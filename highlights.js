var vscode = require( 'vscode' );

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
    var defaultIconColour = vscode.workspace.getConfiguration( 'todo-tree' ).get( 'iconColour' );
    var iconColours = vscode.workspace.getConfiguration( 'todo-tree' ).get( 'iconColours' );
    if( iconColours[ tag ] !== undefined )
    {
        defaultIconColour = iconColours[ tag ];
    }
    return getAttribute( tag, 'foreground', defaultIconColour );
}

function getBackground( tag )
{
    return getAttribute( tag, 'background', undefined );
}

function getIcon( tag )
{
    return getAttribute( tag, 'icon', undefined );
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

module.exports.getForeground = getForeground;
module.exports.getBackground = getBackground;
module.exports.getIcon = getIcon;
module.exports.getType = getType;
module.exports.getOtherColours = getOtherColours;



