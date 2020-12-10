var config;

function init( configuration )
{
    config = configuration;
}

function getAttribute( tag, attribute, defaultValue, ignoreDefaultHighlight )
{
    function getCustomHighlightSettings( customHighlight, tag )
    {
        var result;
        Object.keys( customHighlight ).map( function( t )
        {
            var flags = '';
            if( config.isRegexCaseSensitive() === false )
            {
                flags += 'i';
            }
            t = t.replace( /\\/g, '\\\\' );
            t = t.replace( /[|{}()[\]^$+*?.-]/g, '\\$&' );

            var regex = new RegExp( t, flags );

            if( tag.match( regex ) )
            {
                result = customHighlight[ tag ];
            }
        } );
        return result;
    }

    var tagSettings = getCustomHighlightSettings( config.customHighlight(), tag );
    if( tagSettings && tagSettings[ attribute ] !== undefined )
    {
        return tagSettings[ attribute ];
    }
    else if( ignoreDefaultHighlight !== true )
    {
        var defaultHighlight = config.defaultHighlight();
        if( defaultHighlight[ attribute ] !== undefined )
        {
            return defaultHighlight[ attribute ];
        }
    }
    return defaultValue;
}

function getIcon( tag )
{
    return getAttribute( tag, 'icon', undefined );
}

function getIconColour( tag )
{
    var useColourScheme = config.shouldUseColourScheme();

    var colour = getAttribute( tag, 'iconColour', undefined, useColourScheme );
    if( colour === undefined && useColourScheme )
    {
        colour = getSchemeColour( tag, config.backgroundColourScheme() );
    }

    if( colour === undefined )
    {
        var foreground = getAttribute( tag, 'foreground', undefined, useColourScheme );
        var background = getAttribute( tag, 'background', undefined, useColourScheme );

        colour = foreground ? foreground : ( background ? background : "green" );
    }

    return colour;
}

function getSchemeColour( tag, colours )
{
    var index = config.tags().indexOf( tag );
    if( colours && colours.length > 0 )
    {
        return colours[ index % colours.length ];
    }
}

function getForeground( tag )
{
    var useColourScheme = config.shouldUseColourScheme();
    var colour = getAttribute( tag, 'foreground', undefined, useColourScheme );
    if( colour === undefined && useColourScheme )
    {
        colour = getSchemeColour( tag, config.foregroundColourScheme() );
    }
    return colour;
}

function getBackground( tag )
{
    var useColourScheme = config.shouldUseColourScheme();
    var colour = getAttribute( tag, 'background', undefined, useColourScheme );
    if( colour === undefined && useColourScheme )
    {
        colour = getSchemeColour( tag, config.backgroundColourScheme() );
    }
    return colour;
}

module.exports.init = init;
module.exports.getAttribute = getAttribute;
module.exports.getIcon = getIcon;
module.exports.getIconColour = getIconColour;
module.exports.getForeground = getForeground;
module.exports.getBackground = getBackground;
