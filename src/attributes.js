var vscode = require( 'vscode' );

function getAttribute( tag, attribute, defaultValue )
{
    function getCustomHighlightSettings( customHighlight, tag )
    {
        var result;
        Object.keys( customHighlight ).map( function( t )
        {
            var flags = '';
            if( vscode.workspace.getConfiguration( 'todo-tree.regex' ).get( 'regexCaseSensitive' ) === false )
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

    var config = vscode.workspace.getConfiguration( 'todo-tree.highlights' );
    var tagSettings = getCustomHighlightSettings( config.customHighlight, tag );
    if( tagSettings && tagSettings[ attribute ] !== undefined )
    {
        return tagSettings[ attribute ];
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

function getIcon( tag )
{
    return getAttribute( tag, 'icon', undefined );
}

function getIconColour( tag )
{
    var foreground = getAttribute( tag, 'foreground', undefined );
    var background = getAttribute( tag, 'background', undefined );

    return getAttribute( tag, 'iconColour', foreground ? foreground : ( background ? background : "green" ) );
}

module.exports.getAttribute = getAttribute;
module.exports.getIcon = getIcon;
module.exports.getIconColour = getIconColour;
