var vscode = require( 'vscode' );

var config = require( './config.js' );
var utils = require( './utils.js' );

var diagnosticsCollection;
var diagnostics = {};

function init( context )
{
    context.subscriptions.push( diagnosticsCollection );
}

function showDiagnostic( tag )
{
    return config.getAttribute( tag, 'showDiagnostic', vscode.workspace.getConfiguration( 'todo-tree' ).get( 'highlight' ) ) === true;
}

function generate()
{
    Object.keys( diagnostics ).map( function( uri )
    {
        var list = [];
        diagnostics[ uri ].map( function( diagnostic )
        {
            list.push( new vscode.Diagnostic( diagnostic.range, diagnostic.text, vscode.DiagnosticSeverity.Information ) );
        } );

        diagnosticsCollection.set( new vscode.Uri.parse( uri ), list );

    } );
}

function add( uri, range, text )
{
    if( diagnostics[ uri ] === undefined )
    {
        diagnostics[ uri ] = [];
    }
    diagnostics[ uri ].push( { range: range, text: text } );
}

function resetFile( uri )
{
    diagnostics[ uri ] = [];
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
module.exports.add = add;
module.exports.generate = generate;
module.exports.resetFile = resetFile;
module.exports.reset = reset;
