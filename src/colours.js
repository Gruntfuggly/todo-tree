var vscode = require( 'vscode' );

var utils = require( './utils.js' );

function validate( workspace )
{
    function check( setting )
    {
        var definedColour = workspace.getConfiguration( 'todo-tree.highlights' ).get( setting );
        if( definedColour !== undefined && !utils.isValidColour( definedColour ) )
        {
            invalidColours.push( setting + ' (' + definedColour + ')' );
        }
    }

    var invalidColours = [];
    var result = "";

    var attributeList = [ 'foreground', 'background', 'iconColour', 'rulerColour' ];
    attributeList.forEach( function( attribute ) { check( 'defaultHighlight.' + attribute ); } );

    var config = vscode.workspace.getConfiguration( 'todo-tree.highlights' );
    Object.keys( config.customHighlight ).forEach( function( tag )
    {
        attributeList.forEach( function( attribute ) { check( 'customHighlight.' + tag + '.' + attribute ); } );
    } );

    if( invalidColours.length > 0 )
    {
        result = "Invalid colour settings: " + invalidColours.join( ', ' );
    }

    return result;
}

module.exports.validate = validate;