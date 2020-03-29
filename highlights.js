var vscode = require( 'vscode' );

var colours = require( './colours.js' );
var config = require( './config.js' );
var utils = require( './utils.js' );
var attributes = require( './attributes.js' );
var icons = require( './icons.js' );
var lanes =
{
    "none": undefined,
    "left": 1,
    "center": 2,
    "right": 4,
    "full": 7
};

var decorations = {};
var highlightTimer = {};
var context_;
;
function init( context )
{
    context.subscriptions.push( decorations );
    context_ = context;
}

function getDecoration( tag )
{
    var foregroundColour = getForeground( tag );
    var backgroundColour = getBackground( tag );

    var opacity = getOpacity( tag );

    var lightForegroundColour = foregroundColour;
    var darkForegroundColour = foregroundColour;
    var lightBackgroundColour = backgroundColour;
    var darkBackgroundColour = backgroundColour;

    if( foregroundColour )
    {
        if( !utils.isHexColour( foregroundColour ) )
        {
            if( colours.getColourList().indexOf( foregroundColour ) > -1 )
            {
                lightForegroundColour = colours.defaultLightColours[ foregroundColour ];
                darkForegroundColour = colours.defaultDarkColours[ foregroundColour ];
            }
            else if( foregroundColour.match( /(foreground|background)/i ) )
            {
                lightForegroundColour = new vscode.ThemeColor( foregroundColour );
                darkForegroundColour = new vscode.ThemeColor( foregroundColour );
            } else
            {
                lightForegroundColour = new vscode.ThemeColor( 'editor.foreground' );
                darkForegroundColour = new vscode.ThemeColor( 'editor.foreground' );
            }
        }
    }

    if( backgroundColour )
    {
        if( !utils.isHexColour( backgroundColour ) )
        {
            if( colours.getColourList().indexOf( backgroundColour ) > -1 )
            {
                lightBackgroundColour = colours.defaultLightColours[ backgroundColour ];
                darkBackgroundColour = colours.defaultDarkColours[ backgroundColour ];
            }
            else if( backgroundColour.match( /(foreground|background)/i ) )
            {
                lightBackgroundColour = new vscode.ThemeColor( backgroundColour );
                darkBackgroundColour = new vscode.ThemeColor( backgroundColour );
            }
            else
            {
                lightBackgroundColour = new vscode.ThemeColor( 'editor.background' );
                darkBackgroundColour = new vscode.ThemeColor( 'editor.background' );
            }
        }

        if( utils.isHexColour( lightBackgroundColour ) )
        {
            lightBackgroundColour = utils.hexToRgba( lightBackgroundColour, opacity < 1 ? opacity * 100 : opacity );
        }
        if( utils.isHexColour( darkBackgroundColour ) )
        {
            darkBackgroundColour = utils.hexToRgba( darkBackgroundColour, opacity < 1 ? opacity * 100 : opacity );
        }
    }

    if( lightForegroundColour === undefined )
    {
        lightForegroundColour = colours.complementaryColours[ lightBackgroundColour ];
    }
    if( darkForegroundColour === undefined )
    {
        darkForegroundColour = colours.complementaryColours[ darkBackgroundColour ];
    }

    if( lightBackgroundColour === undefined && lightForegroundColour === undefined )
    {
        lightBackgroundColour = vscode.ThemeColor( 'editor.foreground' );
        lightForegroundColour = new vscode.ThemeColor( 'editor.background' );
    }

    if( darkBackgroundColour === undefined && darkForegroundColour === undefined )
    {
        darkBackgroundColour = vscode.ThemeColor( 'editor.foreground' );
        darkForegroundColour = new vscode.ThemeColor( 'editor.background' );
    }

    var lane = getRulerLane( tag );
    if( isNaN( parseInt( lane ) ) )
    {
        lane = lanes[ lane.toLowerCase() ];
    }
    var decorationOptions = {
        borderRadius: getBorderRadius( tag ),
        isWholeLine: getType( tag ) === 'whole-line',
        fontWeight: getFontWeight( tag ),
        fontStyle: getFontStyle( tag ),
        textDecoration: getTextDecoration( tag ),
        gutterIconPath: showInGutter( tag ) ? icons.getIcon( context_, tag ).dark : undefined
    };

    if( lane !== undefined )
    {
        decorationOptions.overviewRulerColor = getRulerColour( tag, darkBackgroundColour ? darkBackgroundColour : vscode.ThemeColor( 'editor.foreground' ) );
        decorationOptions.overviewRulerLane = lane;
    }

    decorationOptions.light = { backgroundColor: lightBackgroundColour, color: lightForegroundColour };
    decorationOptions.dark = { backgroundColor: darkBackgroundColour, color: darkForegroundColour };

    return vscode.window.createTextEditorDecorationType( decorationOptions );
}

function getForeground( tag )
{
    return attributes.getAttribute( tag, 'foreground', undefined );
}

function getBackground( tag )
{
    return attributes.getAttribute( tag, 'background', undefined );
}

function getRulerColour( tag, defaultColour )
{
    return attributes.getAttribute( tag, 'rulerColour', defaultColour );
}

function getRulerLane( tag )
{
    return attributes.getAttribute( tag, 'rulerLane', 4 );
}

function getOpacity( tag )
{
    return attributes.getAttribute( tag, 'opacity', 100 );
}

function getBorderRadius( tag )
{
    return attributes.getAttribute( tag, 'borderRadius', '0.2em' );
}

function getFontStyle( tag )
{
    return attributes.getAttribute( tag, 'fontStyle', 'normal' );
}

function getFontWeight( tag )
{
    return attributes.getAttribute( tag, 'fontWeight', 'normal' );
}

function getTextDecoration( tag )
{
    return attributes.getAttribute( tag, 'textDecoration', '' );
}

function showInGutter( tag )
{
    return attributes.getAttribute( tag, 'gutterIcon', false );
}

function getType( tag )
{
    return attributes.getAttribute( tag, 'type', vscode.workspace.getConfiguration( 'todo-tree.highlights' ).get( 'highlight' ) );
}

function highlight( editor )
{
    var documentHighlights = {};

    if( editor )
    {
        if( decorations[ editor.id ] )
        {
            decorations[ editor.id ].forEach( function( decoration )
            {
                decoration.dispose();
            } );
        }

        decorations[ editor.id ] = [];

        if( vscode.workspace.getConfiguration( 'todo-tree.highlights' ).get( 'enabled', true ) )
        {
            var text = editor.document.getText();
            var regex = utils.getRegexForEditorSearch();
            var match;
            while( ( match = regex.exec( text ) ) !== null )
            {
                var tag = match[ 0 ];
                var offsetStart = match.index;
                var offsetEnd = offsetStart + match[ 0 ].length;

                var extracted = utils.extractTag( match[ 0 ] );
                if( extracted.tag && extracted.tag.length > 0 )
                {
                    var tagGroup = config.tagGroup( extracted.tag );
                    tag = tagGroup ? tagGroup : extracted.tag;
                    offsetStart = match.index + extracted.tagOffset;
                    offsetEnd = offsetStart + extracted.tag.length;
                }
                else
                {
                    offsetStart += match[ 0 ].search( /\S|$/ );
                }
                var type = getType( tag );
                if( type !== 'none' )
                {
                    var startPos = editor.document.positionAt( offsetStart );
                    var endPos = editor.document.positionAt( offsetEnd );
                    var fullEndPos = editor.document.positionAt( match.index + match[ 0 ].length );

                    if( type === 'text-and-comment' )
                    {
                        startPos = editor.document.positionAt( match.index );
                        endPos = new vscode.Position( fullEndPos.line, editor.document.lineAt( fullEndPos.line ).range.end.character );
                    }
                    else if( type === 'text' )
                    {
                        endPos = new vscode.Position( fullEndPos.line, editor.document.lineAt( fullEndPos.line ).range.end.character );
                    }
                    else if( type === 'tag-and-comment' )
                    {
                        startPos = editor.document.positionAt( match.index );
                    }
                    else if( type === 'line' || type === 'whole-line' )
                    {
                        endPos = new vscode.Position( fullEndPos.line, editor.document.lineAt( fullEndPos.line ).range.end.character );
                        startPos = new vscode.Position( startPos.line, 0 );
                    }

                    var decoration = { range: new vscode.Range( startPos, endPos ) };
                    if( documentHighlights[ tag ] === undefined )
                    {
                        documentHighlights[ tag ] = [];
                    }
                    documentHighlights[ tag ].push( decoration );
                }
            }

            Object.keys( documentHighlights ).forEach( function( tag )
            {
                var decoration = getDecoration( tag );
                decorations[ editor.id ].push( decoration );
                editor.setDecorations( decoration, documentHighlights[ tag ] );
            } );
        }
    }
}

function triggerHighlight( editor )
{
    if( editor )
    {
        if( highlightTimer[ editor.id ] )
        {
            clearTimeout( highlightTimer[ editor.id ] );
        }
        highlightTimer[ editor.id ] = setTimeout( highlight, vscode.workspace.getConfiguration( 'todo-tree.highlights' ).highlightDelay, editor );
    }
}

module.exports.init = init;
module.exports.getDecoration = getDecoration;
module.exports.triggerHighlight = triggerHighlight;

