var vscode = require( 'vscode' );

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
var context;
var debug;

function init( context_, debug_ )
{
    context = context_;
    debug = debug_;
    context.subscriptions.push( decorations );
}

function applyOpacity( colour, opacity )
{
    if( utils.isHexColour( colour ) )
    {
        colour = utils.hexToRgba( colour, opacity < 1 ? opacity * 100 : opacity );
    }
    else if( utils.isRgbColour( colour ) )
    {
        if( opacity !== 100 )
        {
            colour = utils.setRgbAlpha( colour, opacity > 1 ? opacity / 100 : opacity );
        }
    }

    return colour;
}

function getDecoration( tag )
{
    var foregroundColour = attributes.getForeground( tag );
    var backgroundColour = attributes.getBackground( tag );

    var opacity = getOpacity( tag );

    var lightForegroundColour = foregroundColour;
    var darkForegroundColour = foregroundColour;
    var lightBackgroundColour = backgroundColour;
    var darkBackgroundColour = backgroundColour;

    if( foregroundColour )
    {
        if( foregroundColour.match( /(foreground|background)/i ) )
        {
            lightForegroundColour = new vscode.ThemeColor( foregroundColour );
            darkForegroundColour = new vscode.ThemeColor( foregroundColour );
        }
        else if( !utils.isValidColour( foregroundColour ) )
        {
            lightForegroundColour = new vscode.ThemeColor( 'editor.foreground' );
            darkForegroundColour = new vscode.ThemeColor( 'editor.foreground' );
        }
    }

    if( backgroundColour )
    {
        if( backgroundColour.match( /(foreground|background)/i ) )
        {
            lightBackgroundColour = new vscode.ThemeColor( backgroundColour );
            darkBackgroundColour = new vscode.ThemeColor( backgroundColour );
        }
        else if( !utils.isValidColour( backgroundColour ) )
        {
            lightBackgroundColour = new vscode.ThemeColor( 'editor.background' );
            darkBackgroundColour = new vscode.ThemeColor( 'editor.background' );
        }

        lightBackgroundColour = applyOpacity( lightBackgroundColour, opacity );
        darkBackgroundColour = applyOpacity( darkBackgroundColour, opacity );
    }

    if( lightForegroundColour === undefined && utils.isHexColour( lightBackgroundColour ) )
    {
        lightForegroundColour = utils.complementaryColour( lightBackgroundColour );
    }
    if( darkForegroundColour === undefined && utils.isHexColour( darkBackgroundColour ) )
    {
        darkForegroundColour = utils.complementaryColour( darkBackgroundColour );
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
        gutterIconPath: showInGutter( tag ) ? icons.getIcon( context, tag, debug ).dark : undefined
    };

    if( lane !== undefined )
    {
        var rulerColour = getRulerColour( tag, darkBackgroundColour ? darkBackgroundColour : 'editor.foreground' );
        var rulerOpacity = getRulerOpacity( tag );

        if( utils.isThemeColour( rulerColour ) )
        {
            rulerColour = new vscode.ThemeColor( rulerColour );
        }
        else
        {
            rulerColour = applyOpacity( rulerColour, rulerOpacity );
        }

        decorationOptions.overviewRulerColor = rulerColour;
        decorationOptions.overviewRulerLane = lane;
    }

    decorationOptions.light = { backgroundColor: lightBackgroundColour, color: lightForegroundColour };
    decorationOptions.dark = { backgroundColor: darkBackgroundColour, color: darkForegroundColour };

    return vscode.window.createTextEditorDecorationType( decorationOptions );
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

function getRulerOpacity( tag )
{
    return attributes.getAttribute( tag, 'rulerOpacity', 100 );
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

function editorId( editor )
{
    var id = "";
    if( editor.document )
    {
        id = editor.document.uri.fsPath;
    }
    if( editor.viewColumn )
    {
        id += editor.viewColumn;
    }
    return id;
}

function highlight( editor )
{
    var documentHighlights = {};
    var subTagHighlights = {};
    var customHighlight = config.customHighlight();

    if( editor )
    {
        var id = editorId( editor );

        if( decorations[ id ] )
        {
            decorations[ id ].forEach( function( decoration )
            {
                decoration.dispose();
            } );
        }

        decorations[ id ] = [];

        if( vscode.workspace.getConfiguration( 'todo-tree.highlights' ).get( 'enabled', true ) )
        {
            var text = editor.document.getText();
            var regex = utils.getRegexForEditorSearch();
            var subTagRegex = new RegExp( config.subTagRegex() );

            var match;
            while( ( match = regex.exec( text ) ) !== null )
            {
                var tag = match[ 0 ];
                var offsetStart = match.index;
                var offsetEnd = offsetStart + match[ 0 ].length;
                var extracted = utils.extractTag( match[ 0 ] );
                if( extracted.tag )
                {
                    var line = editor.document.lineAt( editor.document.positionAt( match.index ) );
                    utils.updateBeforeAndAfter( extracted, text.substring( offsetStart, editor.document.offsetAt( line.range.end ) ) );
                }
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
                    else if( type === 'tag-and-subTag' || type === 'tag-and-subtag' )
                    {
                        var endOfLineOffset = editor.document.offsetAt( new vscode.Position( fullEndPos.line, editor.document.lineAt( fullEndPos.line ).range.end.character ) );
                        var todoText = text.substring( offsetEnd, endOfLineOffset );
                        var subTagMatch = subTagRegex.exec( todoText );
                        if( subTagMatch !== null && subTagMatch.length > 1 )
                        {
                            var subTag = subTagMatch[ 1 ];
                            if( customHighlight[ subTag ] !== undefined )
                            {
                                var subTagOffset = todoText.indexOf( subTag );
                                if( subTagOffset !== -1 )
                                {
                                    var subTagStartPos = editor.document.positionAt( offsetEnd + subTagOffset );
                                    var subTagEndPos = editor.document.positionAt( offsetEnd + subTagOffset + subTagMatch[ 1 ].length );
                                    var subTagDecoration = { range: new vscode.Range( subTagStartPos, subTagEndPos ) };
                                    if( subTagHighlights[ subTag ] === undefined )
                                    {
                                        subTagHighlights[ subTag ] = [];
                                    }
                                    subTagHighlights[ subTag ].push( subTagDecoration );
                                }
                            }
                        }
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
                decorations[ id ].push( decoration );
                editor.setDecorations( decoration, documentHighlights[ tag ] );
            } );

            Object.keys( subTagHighlights ).forEach( function( subTag )
            {
                var decoration = getDecoration( subTag );
                decorations[ id ].push( decoration );
                editor.setDecorations( decoration, subTagHighlights[ subTag ] );
            } );
        }
    }
}

function triggerHighlight( editor )
{
    if( editor )
    {
        var id = editorId( editor );

        if( highlightTimer[ id ] )
        {
            clearTimeout( highlightTimer[ id ] );
        }
        highlightTimer[ id ] = setTimeout( highlight, vscode.workspace.getConfiguration( 'todo-tree.highlights' ).highlightDelay, editor );
    }
}

module.exports.init = init;
module.exports.getDecoration = getDecoration;
module.exports.triggerHighlight = triggerHighlight;

