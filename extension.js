
var vscode = require( 'vscode' );
var ripgrep = require( './ripgrep' );
var TreeView = require( "./dataProvider" );
var childProcess = require( 'child_process' );
var fs = require( 'fs' );
var path = require( 'path' );

function activate( context )
{
    // It would be nice if vscode-ripgrep could simply be installed by npm as a dependency of
    // the extension, but for some reason it gets the platform wrong and downloads the wrong
    // version, so it needs to be done here insted.
    var extPath = vscode.extensions.getExtension( "Gruntfuggly.todo-tree" ).extensionPath;
    var rgPath = path.join( extPath, "node_modules/vscode-ripgrep" );
    var rgExe = vscode.workspace.getConfiguration( 'todo-tree' ).ripgrep;
    if( ( !rgExe || rgExe === "" ) && !fs.existsSync( rgPath ) )
    {
        try
        {
            childProcess.execSync( "npm install vscode-ripgrep", { cwd: extPath } );
        }
        catch( e )
        {
            vscode.window.showErrorMessage( "todo-tree: Failed to install vscode-ripgrep - please install ripgrep manually and set 'todo-tree.ripgrep' to point to the executable" );
            return;
        }
    }

    var provider = new TreeView.TodoDataProvider( context );
    vscode.window.registerTreeDataProvider( 'todo-tree', provider );

    var status = vscode.window.createStatusBarItem( vscode.StatusBarAlignment.Left, 0 );

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

    var onSave = vscode.workspace.onDidSaveTextDocument( ( e ) =>
    {
        var rootFolder = getRootFolder();
        if( vscode.workspace.getConfiguration( 'todo-tree' ).autoUpdate && rootFolder )
        {
            var removed = provider.remove( rootFolder, e.fileName );
            search( e.fileName, removed );
        }
    } );

    context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.refresh', refresh ) );

    refresh();
}

function deactivate()
{
}

exports.activate = activate;
exports.deactivate = deactivate;
