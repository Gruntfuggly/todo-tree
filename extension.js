
var vscode = require( 'vscode' );
var ripgrep = require( 'ripgrep-js' );
var TreeView = require( "./dataProvider" );

function activate( context )
{
    var provider = new TreeView.TodoDataProvider( context );
    vscode.window.registerTreeDataProvider( 'todo-tree', provider );

    function findTodos()
    {
        provider.clear();

        var root = vscode.workspace.getConfiguration( 'todo-tree' ).rootFolder;
        if( root === "" )
        {
            root = vscode.workspace.workspaceFolders[ 0 ].uri.fsPath;
        }

        var regex = vscode.workspace.getConfiguration( 'todo-tree' ).regex;
        ripgrep( root, { regex: "'" + regex + "'" } ).then( ( result ) =>
        {
            result.map( function( match )
            {
                provider.add( root, match );
            } );
        } );
    }

    function refresh()
    {
        findTodos();
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
}

function deactivate()
{
}

exports.activate = activate;
exports.deactivate = deactivate;
