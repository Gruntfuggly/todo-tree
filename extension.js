
var vscode = require( 'vscode' );
var ripgrep = require( './ripgrep' );
var TreeView = require( "./dataProvider" );
var childProcess = require( 'child_process' );
var fs = require( 'fs' );
var path = require( 'path' );

function activate( context )
{
    var provider = new TreeView.TodoDataProvider( context );
    var status = vscode.window.createStatusBarItem( vscode.StatusBarAlignment.Left, 0 );

    function exePathUndefined()
    {
        var rgExePath = vscode.workspace.getConfiguration( 'todo-tree' ).ripgrep;
        return !rgExePath || rgExePath === "";
    }

    function setExePath( register )
    {
        function checkExePath( path )
        {
            if( exePathUndefined() && fs.existsSync( path ) )
            {
                vscode.workspace.getConfiguration( 'todo-tree' ).update( "ripgrep", path, true ).then( function()
                {
                    register();
                } );
                return true;
            }
            return false;
        }

        var pathSet = false;
        var isMac = /^darwin/.test( process.platform );
        var isWin = /^win/.test( process.platform );
        if( isMac )
        {
            pathSet = checkExePath( "/Applications/Visual Studio Code.app/Contents/Resources/app/node_modules/vscode-ripgrep/bin/rg" );
        }
        else if( isWin )
        {
            pathSet = checkExePath( "C:\\Program Files\\Microsoft VS Code\\resources\\app\\node_modules\\vscode-ripgrep\\bin\\rg.exe" );
        }
        else
        {
            pathSet = checkExePath( "/usr/share/code/resources/app/node_modules/vscode-ripgrep/bin/rg" );
        }

        if( !pathSet )
        {
            vscode.window.showErrorMessage( "todo-tree: Failed to find vscode-ripgrep - please install ripgrep manually and set 'todo-tree.ripgrep' to point to the executable" );
        }
    }

    function getRootFolder()
    {
        var rootFolder = vscode.workspace.getConfiguration( 'todo-tree' ).rootFolder;
        if( rootFolder === "" )
        {
            if( vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0 )
            {
                rootFolder = vscode.workspace.workspaceFolders[ 0 ].uri.fsPath;
            }
        }
        return rootFolder;
    }

    function search( filename, refreshRequired )
    {
        var rootFolder = getRootFolder();
        if( rootFolder === "" )
        {
            status.hide();
            return;
        }

        var regex = vscode.workspace.getConfiguration( 'todo-tree' ).regex;
        var options = { regex: "\"" + regex + "\"" };
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
                return a.file > b.file ? 1 : b.file > a.file ? -1 : a.line > b.line;
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

    var onSave = vscode.workspace.onDidSaveTextDocument( ( e ) =>
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
    } );

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

        var flat = vscode.workspace.getConfiguration( 'todo-tree' ).flat;
        vscode.commands.executeCommand( 'setContext', 'todo-tree-tree', !flat );
        vscode.commands.executeCommand( 'setContext', 'todo-tree-flat', flat );

        refresh();
    }

    if( exePathUndefined() )
    {
        setExePath( register );
    }
    else
    {
        register();
    }
}

function deactivate()
{
}

exports.activate = activate;
exports.deactivate = deactivate;
