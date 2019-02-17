var vscode = require( 'vscode' );

var config = require( './config.js' );
var utils = require( './utils.js' );

var diagnosticsCollection;

function init( context )
{
    context.subscriptions.push( diagnosticsCollection );
}

function showDiagnostic( tag )
{
    return config.getAttribute( tag, 'showDiagnostic', vscode.workspace.getConfiguration( 'todo-tree' ).get( 'highlight' ) ) === true;
}

function generate( document )
{
    console.log( "diagnostics.generate doc:" + document );
    if( document )
    {
        var diagnostics = [];
        var text = document.getText();
        var regex = utils.getRegex();
        var match;
        while( ( match = regex.exec( text ) ) !== null )
        {
            var tag = match[ 0 ];

            if( showDiagnostic( tag ) )
            {
                console.log( "yep!" );
                var startPos = document.positionAt( match.index );
                var endPos = document.positionAt( match.index + match[ 0 ].length );

                diagnostics.push( new vscode.Diagnostic( new vscode.Range( startPos, endPos ), text.substr( match.index, match.index + match[ 0 ].length ), vscode.DiagnosticSeverity.Information ) );
            }
            else
            {
                console.log( "nope" );
            }
        }

        diagnosticsCollection.set( document.uri, diagnostics );
    }
}

function reset()
{
    if( diagnosticsCollection )
    {
        diagnosticsCollection.dispose();
    }

    diagnosticsCollection = vscode.languages.createDiagnosticCollection( 'todo-tree' );
}

reset();

module.exports.init = init;
module.exports.generate = generate;
module.exports.reset = reset;
