
var vscode = require( 'vscode' );
var ripgrep = require( './ripgrep' );
var TreeView = require( "./dataProvider" );

function activate( context )
{
    var provider = new TreeView.TodoDataProvider( context );
    vscode.window.registerTreeDataProvider( 'todo-tree', provider );

    var status = vscode.window.createStatusBarItem( vscode.StatusBarAlignment.Left, 0 );

    function refresh()
    {
        provider.clear();

        status.show();

        var root = vscode.workspace.getConfiguration( 'todo-tree' ).rootFolder;
        if( root === "" )
        {
            if( vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0 )
            {
                root = vscode.workspace.workspaceFolders[ 0 ].uri.fsPath;
            }
            else
            {
                status.hide();
                return;
            }
        }

        status.text = "Scanning " + root + " for TODOs...";

        var regex = vscode.workspace.getConfiguration( 'todo-tree' ).regex;
        var options = { regex: "\"" + regex + "\"" };
        var globs = vscode.workspace.getConfiguration( 'todo-tree' ).globs;
        if( globs && globs.length > 0 )
        {
            options.globs = globs;
        }
        ripgrep( root, options ).then( ( result ) =>
        {
            result.map( function( match )
            {
                provider.add( root, match );
            } );
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

    context.subscriptions.push(
        vscode.commands.registerCommand( 'todo-tree.refresh', refresh ) );

    refresh();
}

function deactivate()
{
}

exports.activate = activate;
exports.deactivate = deactivate;
