
var vscode = require( 'vscode' );
var ripgrep = require( './ripgrep' );
var TreeView = require( "./dataProvider" );
var childProcess = require( 'child_process' );
var fs = require( 'fs' );
var path = require( 'path' );

var lastRootFolder;

function activate( context )
{
    var provider = new TreeView.TodoDataProvider( context );
    var status = vscode.window.createStatusBarItem( vscode.StatusBarAlignment.Left, 0 );

    function exeName()
    {
        var isWin = /^win/.test( process.platform );
        return isWin ? "rg.exe" : "rg";
    }
    function getRgPath()
    {
        var rgPath = "";

        rgPath = exePathIsDefined( vscode.workspace.getConfiguration( 'todo-tree' ).ripgrep );
        if( rgPath ) return rgPath;

        rgPath = exePathIsDefined( path.join( path.dirname( path.dirname( require.main.filename ) ), "node_modules/vscode-ripgrep/bin/rg" ) );
        if( rgPath ) return rgPath;

        rgPath = exePathIsDefined( path.join( path.dirname( path.dirname( require.main.filename ) ), "node_modules.asar.unpacked/vscode-ripgrep/bin/rg" ) );
        if( rgPath ) return rgPath;

        return rgPath;
    }

    function exePathIsDefined( rgExePath )
    {
        return fs.existsSync( rgExePath ) ? rgExePath : undefined;
    }

    function getRootFolder()
    {
        var rootFolder = vscode.workspace.getConfiguration( 'todo-tree' ).rootFolder;
        if( rootFolder === "" )
        {
            if( vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0 )
            {
                var editor = vscode.window.activeTextEditor;
                if( editor )
                {
                    var workspace = vscode.workspace.getWorkspaceFolder( editor.document.uri );
                    if( workspace )
                    {
                        rootFolder = workspace.uri.fsPath;
                    }
                    else
                    {
                        rootFolder = lastRootFolder;
                    }
                }
            }
        }
        return rootFolder;
    }

    function search( filename, refreshRequired )
    {
        var rootFolder = getRootFolder();
        if( !rootFolder )
        {
            status.hide();
            return;
        }

        lastRootFolder = rootFolder;

        var regex = vscode.workspace.getConfiguration( 'todo-tree' ).regex;
        var options = {
            regex: "\"" + regex + "\"",
            rgPath: getRgPath()
        };
        var globs = vscode.workspace.getConfiguration( 'todo-tree' ).globs;
        if( globs && globs.length > 0 )
        {
            options.globs = globs;
        }
        if( filename )
        {
            options.filename = filename;
        }
        ripgrep( rootFolder, options ).then( ( result ) =>
        {
            result.sort( function compare( a, b )
            {
                return a.file > b.file ? 1 : b.file > a.file ? -1 : a.line > b.line ? 1 : -1;
            } );
            result.map( function( match )
            {
                provider.add( rootFolder, match );
            } );
            if( refreshRequired && ( result === undefined || result.length === 0 ) )
            {
                provider.refresh();
            }
            status.hide();
        } ).catch( ( e ) =>
        {
            status.hide();
            if( e.error )
            {
                vscode.window.showErrorMessage( "todo-tree: " + e.error );
            }
            else
            {
                vscode.window.showErrorMessage( "todo-tree: failed to execute search (" + e.stderr + ")" );
            }
        } );
    }

    function refresh()
    {
        provider.clear();

        status.show();

        status.text = "todo-tree: Scanning " + getRootFolder() + "...";

        search();
    }

    function refreshFile( e )
    {
        var rootFolder = getRootFolder();
        if( vscode.workspace.getConfiguration( 'todo-tree' ).autoUpdate && rootFolder )
        {
            const relative = path.relative( rootFolder, e.fileName );
            if( !!relative && !relative.startsWith( '..' ) && !path.isAbsolute( relative ) )
            {
                var removed = provider.remove( rootFolder, e.fileName );
                search( e.fileName, removed );
            }
        }
    }

    function showFlatView()
    {
        vscode.workspace.getConfiguration( 'todo-tree' ).update( 'flat', true, false ).then( function()
        {
            vscode.commands.executeCommand( 'setContext', 'todo-tree-flat', true );
            vscode.commands.executeCommand( 'setContext', 'todo-tree-tree', false );
            refresh();
        } );
    }

    function showTreeView()
    {
        vscode.workspace.getConfiguration( 'todo-tree' ).update( 'flat', false, false ).then( function()
        {
            vscode.commands.executeCommand( 'setContext', 'todo-tree-tree', true );
            vscode.commands.executeCommand( 'setContext', 'todo-tree-flat', false );
            refresh();
        } );
    }

    function register()
    {
        // We can't do anything if we can't find ripgrep
        if( !getRgPath() )
        {
            vscode.window.showErrorMessage( "todo-tree: Failed to find vscode-ripgrep - please install ripgrep manually and set 'todo-tree.ripgrep' to point to the executable" );
            return;
        }
        vscode.window.registerTreeDataProvider( 'todo-tree', provider );

        vscode.commands.registerCommand( 'todo-tree.revealTodo', ( file, line ) =>
        {
            vscode.workspace.openTextDocument( file ).then( function( document )
            {
                vscode.window.showTextDocument( document ).then( function( editor )
                {
                    var position = new vscode.Position( line, 0 );
                    editor.selection = new vscode.Selection( position, position );
                    editor.revealRange( editor.selection, vscode.TextEditorRevealType.Default );
                    vscode.commands.executeCommand( 'workbench.action.focusActiveEditorGroup' );
                } );
            } );
        } );

        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.refresh', refresh ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.showFlatView', showFlatView ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.showTreeView', showTreeView ) );

        vscode.window.onDidChangeActiveTextEditor( function( e )
        {
            if( e && e.document )
            {
                var workspace = vscode.workspace.getWorkspaceFolder( e.document.uri );
                if( workspace )
                {
                    if( workspace.uri.fsPath !== lastRootFolder )
                    {
                        refresh();
                    }
                }
            }
        } );

        context.subscriptions.push( vscode.workspace.onDidSaveTextDocument( refreshFile ) );
        context.subscriptions.push( vscode.workspace.onDidCloseTextDocument( refreshFile ) );

        context.subscriptions.push( vscode.workspace.onDidChangeConfiguration( function( e )
        {
            if( e.affectsConfiguration( "todo-tree.iconColour" ) ||
                e.affectsConfiguration( "todo-tree.iconColours" ) )
            {
                provider.refresh();
            }
            else if( e.affectsConfiguration( "todo-tree" ) )
            {
                refresh();
            }
        } ) );

        var flat = vscode.workspace.getConfiguration( 'todo-tree' ).flat;
        vscode.commands.executeCommand( 'setContext', 'todo-tree-tree', !flat );
        vscode.commands.executeCommand( 'setContext', 'todo-tree-flat', flat );

        refresh();
    }

    register();
}

function deactivate()
{
}

exports.activate = activate;
exports.deactivate = deactivate;
