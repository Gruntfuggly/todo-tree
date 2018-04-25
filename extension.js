/* jshint esversion:6 */

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

        rgPath = exePathIsDefined( path.join( path.dirname( path.dirname( require.main.filename ) ), "node_modules/vscode-ripgrep/bin/", exeName() ) );
        if( rgPath ) return rgPath;

        rgPath = exePathIsDefined( path.join( path.dirname( path.dirname( require.main.filename ) ), "node_modules.asar.unpacked/vscode-ripgrep/bin/", exeName() ) );
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

    function addToTree( rootFolder, matches, flat )
    {
        matches.sort( function compare( a, b )
        {
            return a.file > b.file ? 1 : b.file > a.file ? -1 : a.line > b.line ? 1 : -1;
        } );
        matches.map( function( match )
        {
            provider.add( rootFolder, match, flat );
        } );
    }

    function search( rootFolder, options, flat )
    {
        ripgrep( rootFolder, options ).then( matches =>
        {
            if( matches.length > 0 )
            {
                addToTree( rootFolder, matches, flat );
            }
            else if( options.filename )
            {
                provider.remove( rootFolder, options.filename, flat, false );
            }
            status.hide();
        } ).catch( e =>
        {
            status.hide();
            var message = e.message;
            if( e.stderr )
            {
                message += " (" + e.stderr + ")";
            }
            vscode.window.showErrorMessage( "todo-tree: " + message );
        } );
    }

    function getOptions( filename )
    {
        var config = vscode.workspace.getConfiguration( 'todo-tree' );

        var regex = config.regex;
        if( regex.indexOf( "($TAGS)" ) > -1 )
        {
            regex = regex.replace( "$TAGS", config.tags.join( "|" ) );
        }

        var options = {
            regex: "\"" + regex + "\"",
            rgPath: getRgPath()
        };
        var globs = config.globs;
        if( globs && globs.length > 0 )
        {
            options.globs = globs;
        }
        if( filename )
        {
            options.filename = filename;
        }

        return options;
    }

    function searchWorkspace()
    {
        // console.log( "searchWorkspace" );
        var rootFolder = getRootFolder();
        if( !rootFolder )
        {
            status.hide();
            return;
        }

        lastRootFolder = rootFolder;

        search( rootFolder, getOptions(), vscode.workspace.getConfiguration( 'todo-tree' ).flat );
    }

    function searchOutOfWorkspaceDocuments()
    {
        // console.log( "searchOutOfWorkspaceDocuments" );
        var rootFolder = getRootFolder();
        var documents = vscode.workspace.textDocuments;
        documents.map( function( document, index )
        {
            if( document.uri && document.uri.scheme === "file" )
            {
                var filePath = vscode.Uri.parse( document.uri.path ).fsPath;
                if( !rootFolder || !filePath.startsWith( rootFolder ) )
                {
                    searchFile( filePath );
                }
            }
        } );
    }

    function rebuild()
    {
        // console.log( "rebuild" );
        provider.clear();

        status.text = "todo-tree: Scanning " + getRootFolder() + "...";
        status.show();

        searchWorkspace();
        searchOutOfWorkspaceDocuments();
    }

    function searchFile( filename )
    {
        // console.log( "searchFile(" + filename + ")" );
        var rootFolder = getRootFolder();
        var relative = "";
        var flat = rootFolder ? vscode.workspace.getConfiguration( 'todo-tree' ).flat : true;

        if( rootFolder )
        {
            relative = path.relative( rootFolder, filename );
            if( relative.startsWith( '..' ) )
            {
                flat = true;
            }
        }
        else
        {
            rootFolder = "/";
            flat = true;
        }

        provider.removeChildren( rootFolder, filename, flat );
        search( rootFolder, getOptions( filename ), flat );
    }

    function showFlatView()
    {
        vscode.workspace.getConfiguration( 'todo-tree' ).update( 'flat', true, false ).then( function()
        {
            vscode.commands.executeCommand( 'setContext', 'todo-tree-flat', true );
            vscode.commands.executeCommand( 'setContext', 'todo-tree-tree', false );
            rebuild();
        } );
    }

    function showTreeView()
    {
        vscode.workspace.getConfiguration( 'todo-tree' ).update( 'flat', false, false ).then( function()
        {
            vscode.commands.executeCommand( 'setContext', 'todo-tree-tree', true );
            vscode.commands.executeCommand( 'setContext', 'todo-tree-flat', false );
            rebuild();
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

        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.refresh', rebuild ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.showFlatView', showFlatView ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.showTreeView', showTreeView ) );

        vscode.window.onDidChangeActiveTextEditor( function( e )
        {
            if( e && e.document )
            {
                var workspace = vscode.workspace.getWorkspaceFolder( e.document.uri );
                if( !workspace || workspace.uri.fsPath !== lastRootFolder )
                {
                    rebuild();
                }
            }
        } );

        context.subscriptions.push( vscode.workspace.onDidSaveTextDocument( e =>
        {
            if( e.uri.scheme === "file" )
            {
                searchFile( e.fileName );
            }
        } ) );
        context.subscriptions.push( vscode.workspace.onDidCloseTextDocument( e =>
        {
            if( e.uri.scheme === "file" && e.isClosed !== true )
            {
                searchFile( e.fileName );
            }
        } ) );

        context.subscriptions.push( vscode.workspace.onDidChangeConfiguration( function( e )
        {
            if( e.affectsConfiguration( "todo-tree.iconColour" ) ||
                e.affectsConfiguration( "todo-tree.iconColours" ) )
            {
                provider.refresh();
            }
            else if( e.affectsConfiguration( "todo-tree" ) )
            {
                rebuild();
            }
        } ) );

        var flat = vscode.workspace.getConfiguration( 'todo-tree' ).flat;
        vscode.commands.executeCommand( 'setContext', 'todo-tree-tree', !flat );
        vscode.commands.executeCommand( 'setContext', 'todo-tree-flat', flat );

        rebuild();
    }

    register();
}

function deactivate()
{
}

exports.activate = activate;
exports.deactivate = deactivate;
