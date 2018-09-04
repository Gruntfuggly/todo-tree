var vscode = require( 'vscode' );

var defaultColours = [ "red", "green", "blue", "yellow", "magenta", "cyan", "grey" ];

var defaultLightColours = {
    "red": "#CC0000",
    "green": "#008f00",
    "blue": "#0433ff",
    "yellow": "#c8c800",
    "magenta": "#bb60bb",
    "cyan": "#76d6ff",
    "grey": "#888888"
};

var defaultDarkColours = {
    "red": "#CC0000",
    "green": "#6AC259",
    "blue": "#0433ff",
    "yellow": "#fffb00",
    "magenta": "#ff85ff",
    "cyan": "#76d6ff",
    "grey": "#aaaaaa"
};

var complementaryColours = {};

function isHexColour( colour )
{
    var hex = colour.split( / / )[ 0 ].replace( /[^\da-fA-F]/g, '' );
    return ( typeof colour === "string" ) && ( hex.length === 3 || hex.length === 6 ) && !isNaN( parseInt( hex, 16 ) );
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

function getDecoration( tag )
{
    var foregroundColour = getForeground( tag );
    var backgroundColour = getBackground( tag );

    var lightForegroundColour = foregroundColour;
    var darkForegroundColour = foregroundColour;
    var lightBackgroundColour = backgroundColour;
    var darkBackgroundColour = backgroundColour;

    if( foregroundColour )
    {
        if( !isHexColour( foregroundColour ) )
        {
            if( defaultColours.indexOf( foregroundColour ) > -1 )
            {
                lightForegroundColour = defaultLightColours[ foregroundColour ];
                darkForegroundColour = defaultDarkColours[ foregroundColour ];
            }
            else
            {
                lightDoregroundColour = "#ffffff";
                darkDoregroundColour = "#000000";
            }
        }
    }

    if( backgroundColour )
    {
        if( backgroundColour !== undefined && !isHexColour( backgroundColour ) )
        {
            if( defaultColours.indexOf( backgroundColour ) > -1 )
            {
                lightBackgroundColour = defaultLightColours[ backgroundColour ];
                darkBackgroundColour = defaultDarkColours[ backgroundColour ];
            }
            else
            {
                lightBackgroundColour = "#ffffff";
                darkBackgroundColour = "#000000";
            }
        }
    }

    if( lightForegroundColour === undefined )
    {
        lightForegroundColour = complementaryColours[ lightBackgroundColour ];
    }
    if( darkForegroundColour === undefined )
    {
        darkForegroundColour = complementaryColours[ darkBackgroundColour ];
    }

    var decorationOptions = {
        overviewRulerColor: lightForegroundColour,
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        borderRadius: "0.2em",
    };

    decorationOptions.light = { backgroundColor: lightBackgroundColour, color: lightForegroundColour };
    decorationOptions.dark = { backgroundColor: darkBackgroundColour, color: darkForegroundColour };

    return vscode.window.createTextEditorDecorationType( decorationOptions );
}

function getAttribute( tag, attribute, defaultValue )
{
    var config = vscode.workspace.getConfiguration( 'todo-tree' );
    var customHighlight = config.get( 'customHighlight' );
    var tagSettings = customHighlight[ tag ];
    if( tagSettings && tagSettings[ attribute ] !== undefined )
    {
        return customHighlight[ tag ][ attribute ];
    }
    else
    {
        var defaultHighlight = config.get( 'defaultHighlight' );
        if( defaultHighlight[ attribute ] !== undefined )
        {
            return defaultHighlight[ attribute ];
        }
    }
    return defaultValue;
}

function getForeground( tag )
{
    return getAttribute( tag, 'foreground', undefined );
}

function getBackground( tag )
{
    return getAttribute( tag, 'background', undefined );
}

function getIcon( tag )
{
    return getAttribute( tag, 'icon', undefined );
}

function getIconColour( tag )
{
    var defaultIconColour = vscode.workspace.getConfiguration( 'todo-tree' ).get( 'iconColour' );
    var iconColours = vscode.workspace.getConfiguration( 'todo-tree' ).get( 'iconColours' );
    if( iconColours[ tag ] !== undefined )
    {
        defaultIconColour = iconColours[ tag ];
    }
    var foreground = getAttribute( tag, 'foreground', undefined );
    var background = getAttribute( tag, 'background', undefined );

    return foreground ? foreground : ( background ? background : defaultIconColour );
}

function getType( tag )
{
    return getAttribute( tag, 'type', vscode.workspace.getConfiguration( 'todo-tree' ).get( 'highlight' ) );
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

    var config = vscode.workspace.getConfiguration( 'todo-tree' );
    var customHighlight = config.get( 'customHighlight' );

    addColour( config.get( 'iconColour' ) );
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
        if( isHexColour( colour ) )
        {
            complementaryColours[ colour ] = complementaryColour( colour );
        }
    } );
}

module.exports.getForeground = getForeground;
module.exports.getBackground = getBackground;
module.exports.getIcon = getIcon;
module.exports.getIconColour = getIconColour;
module.exports.getType = getType;
module.exports.getOtherColours = getOtherColours;
module.exports.getDecoration = getDecoration;
module.exports.refreshComplementaryColours = refreshComplementaryColours;



