var vscode = require( 'vscode' );

var utils = require( './utils.js' );

var defaultColours = [ "red", "green", "blue", "yellow", "magenta", "cyan", "grey", "white", "black" ];

var defaultLightColours = {
    "red": "#CC0000",
    "green": "#008f00",
    "blue": "#0433ff",
    "yellow": "#c8c800",
    "magenta": "#bb60bb",
    "cyan": "#76d6ff",
    "grey": "#888888",
    "white": "#ffffff",
    "black": "#000000"
};

var defaultDarkColours = {
    "red": "#CC0000",
    "green": "#6AC259",
    "blue": "#0433ff",
    "yellow": "#fffb00",
    "magenta": "#ff85ff",
    "cyan": "#76d6ff",
    "grey": "#aaaaaa",
    "white": "#ffffff",
    "black": "#000000"
};

var complementaryColours = {};

function getColourList()
{
    return defaultColours;
}

function complementaryColour( colour )
{
    var hex = colour.split( / / )[ 0 ].replace( /[^\da-fA-F]/g, '' );
    var digits = hex.length / 3;
    var red = parseInt( hex.substr( 0, digits ), 16 );
    var green = parseInt( hex.substr( 1 * digits, digits ), 16 );
    var blue = parseInt( hex.substr( 2 * digits, digits ), 16 );
    var c = [ red / 255, green / 255, blue / 255 ];
    for( var i = 0; i < c.length; ++i )
    {
        if( c[ i ] <= 0.03928 )
        {
            c[ i ] = c[ i ] / 12.92;
        } else
        {
            c[ i ] = Math.pow( ( c[ i ] + 0.055 ) / 1.055, 2.4 );
        }
    }
    var l = 0.2126 * c[ 0 ] + 0.7152 * c[ 1 ] + 0.0722 * c[ 2 ];
    return l > 0.179 ? "#000000" : "#ffffff";
}

function getOtherColours()
{
    function addColour( colour )
    {
        if( colour !== undefined )
        {
            colours.push( colour );
        }
    }

    var colours = [];

    var config = vscode.workspace.getConfiguration( 'todo-tree.highlights' );
    var customHighlight = config.get( 'customHighlight' );

    addColour( config.get( 'defaultHighlight' ).foreground );
    addColour( config.get( 'defaultHighlight' ).background );
    Object.keys( customHighlight ).map( function( tag )
    {
        addColour( customHighlight[ tag ].foreground );
        addColour( customHighlight[ tag ].background );
    } );

    return colours;
}

function refreshComplementaryColours()
{
    complementaryColours = {};

    Object.keys( defaultLightColours ).forEach( function( colour )
    {
        complementaryColours[ defaultLightColours[ colour ] ] = complementaryColour( defaultLightColours[ colour ] );
    } );
    Object.keys( defaultDarkColours ).forEach( function( colour )
    {
        complementaryColours[ defaultDarkColours[ colour ] ] = complementaryColour( defaultDarkColours[ colour ] );
    } );

    var otherColours = getOtherColours();

    otherColours.forEach( function( colour )
    {
        if( utils.isHexColour( colour ) )
        {
            complementaryColours[ colour ] = complementaryColour( colour );
        }
    } );
}

function isInvalidColour( colour )
{
    if( colour && !utils.isHexColour( colour ) )
    {
        return defaultColours.indexOf( colour ) === -1;
    }

    return false;
}

function validate( workspace )
{
    function check( setting )
    {
        var definedColour = workspace.getConfiguration( 'todo-tree.highlights' ).get( setting );
        if( isInvalidColour( definedColour ) )
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

module.exports.getColourList = getColourList;
module.exports.refreshComplementaryColours = refreshComplementaryColours;
module.exports.complementaryColours = complementaryColours;
module.exports.defaultLightColours = defaultLightColours;
module.exports.defaultDarkColours = defaultDarkColours;
module.exports.validate = validate;