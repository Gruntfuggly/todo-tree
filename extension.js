
var vscode = require( 'vscode' );
var ripgrep = require( 'ripgrep-js' );

function activate( context ) // TODO: First
{
    var root = vscode.workspace.workspaceFolders[ 0 ].uri.fsPath;

    // TODO: Second
    console.log( "Grepping..." + root );
    // Give `rg` an absolute path to search in and the search term
    ripgrep( root, 'TODO' ).then( ( result ) =>
    {
        result.map( function( match )
        {
            console.log( "f:" + match.file + " l:" + match.line + " c:" + match.column + " m:" + match.match );
        } );
        // `result` is an array of matches
        // const [ firstMatch ] = result;

        // // Match info provided by each result object
        // console.log( firstMatch.file );
        // console.log( firstMatch.line );
        // console.log( firstMatch.column );
        // console.log( firstMatch.match );
    } );
    // context.subscriptions.push(
    //     vscode.commands.registerCommand( 'activitusbar.showSearchViewWithSelection', showSearchViewWithSelection ) );
}

function deactivate()
{
    // TODO: Third
}

exports.activate = activate;
exports.deactivate = deactivate;
