var vscode = require( 'vscode' );

var config = require( './config.js' );
var utils = require( './utils.js' );
var attributes = require( './attributes.js' );
var icons = require( './icons.js' );

var captureGroupArgument = "capture-groups";

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
        lightBackgroundColour = new vscode.ThemeColor( 'editor.foreground' );
        lightForegroundColour = new vscode.ThemeColor( 'editor.background' );
    }

    if( darkBackgroundColour === undefined && darkForegroundColour === undefined )
    {
        darkBackgroundColour = new vscode.ThemeColor( 'editor.foreground' );
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
        id = JSON.stringify( editor.document.uri );
    }
    if( editor.viewColumn )
    {
        id += editor.viewColumn;
    }
    return id;
}

function highlight( editor )
{
    function addDecoration( startPos, endPos )
    {
        var decoration = { range: new vscode.Range( startPos, endPos ) };
        if( documentHighlights[ tag ] === undefined )
        {
            documentHighlights[ tag ] = [];
        }
        documentHighlights[ tag ].push( decoration );
    }

    function detectMultilineBlock( document, startLine, commentPrefix )
    {
        var lines = [ startLine ];
        var maxLines = config.getMultilineMaxLines();
        var currentLine = startLine + 1;
        var lineCount = document.lineCount;
        
        // Handle different comment styles
        var continuationPatterns = [];
        var trimmedPrefix = commentPrefix.trim();
        
        if( trimmedPrefix.indexOf('/*') !== -1 )
        {
            // For /* style comments, look for continuation patterns like " *", "  *", etc.
            continuationPatterns = ['*', ' *', '  *', '   *', '    *'];
        }
        else if( trimmedPrefix.indexOf('<!--') !== -1 )
        {
            // For HTML comments, continuation lines can be plain text (no special prefix required)
            // We'll handle this differently - any non-empty line until --> is considered continuation
            continuationPatterns = [];
        }
        else
        {
            // For other comments like #, //, use the original prefix
            continuationPatterns = [trimmedPrefix];
        }
        
        while( currentLine < lineCount && lines.length < maxLines )
        {
            var line = document.lineAt( currentLine );
            var lineText = line.text;
            var trimmedText = lineText.trim();
            
            // Check for end of block comments
            if( trimmedPrefix.indexOf('/*') !== -1 && trimmedText.indexOf('*/') !== -1 )
            {
                lines.push( currentLine );
                break;
            }
            else if( trimmedPrefix.indexOf('<!--') !== -1 && trimmedText.indexOf('-->') !== -1 )
            {
                lines.push( currentLine );
                break;
            }
            
            // Determine if this is a comment line
            var isCommentLine = false;
            
            if( trimmedText.length === 0 )
            {
                // Empty lines are considered part of the comment block
                isCommentLine = true;
            }
            else if( trimmedPrefix.indexOf('<!--') !== -1 )
            {
                // For HTML comments, any line that doesn't contain --> is a continuation
                if( trimmedText.indexOf('-->') === -1 )
                {
                    isCommentLine = true;
                }
            }
            else if( continuationPatterns.length > 0 )
            {
                // For other comment types, check against continuation patterns
                for( var i = 0; i < continuationPatterns.length; i++ )
                {
                    if( trimmedText.startsWith( continuationPatterns[i] ) )
                    {
                        isCommentLine = true;
                        break;
                    }
                }
            }
            
            if( isCommentLine )
            {
                lines.push( currentLine );
                currentLine++;
            }
            else
            {
                break;
            }
        }
        
        return lines;
    }

    var documentHighlights = {};
    var subTagHighlights = {};
    var customHighlight = config.customHighlight();
    var isMultilineEnabled = config.isMultilineHighlightEnabled();

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

        var highlightConfig = vscode.workspace.getConfiguration( 'todo-tree.highlights' );
        if( highlightConfig.get( 'enabled', true ) )
        {
            var text = editor.document.getText();
            var regex = utils.getRegexForEditorSearch( true );
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
                        addDecoration(
                            editor.document.positionAt( match.index ),
                            new vscode.Position( fullEndPos.line, editor.document.lineAt( fullEndPos.line ).range.end.character ) );
                    }
                    else if( type === 'text' )
                    {
                        addDecoration(
                            startPos,
                            new vscode.Position( fullEndPos.line, editor.document.lineAt( fullEndPos.line ).range.end.character ) );
                    }
                    else if( type !== undefined && type.indexOf( captureGroupArgument + ":" ) === 0 )
                    {
                        type.substring( type.indexOf( ':' ) + 1 ).split( ',' ).map( function( groupText )
                        {
                            var group = parseInt( groupText );
                            if( match.indices && match.indices[ group ] )
                            {
                                addDecoration(
                                    editor.document.positionAt( match.indices[ group ][ 0 ] ),
                                    editor.document.positionAt( match.indices[ group ][ 1 ] ) );
                            }
                        } );
                    }
                    else if( type === 'tag-and-subTag' || type === 'tag-and-subtag' )
                    {
                        addDecoration( startPos, endPos );

                        var endOfLineOffset = editor.document.offsetAt( new vscode.Position( fullEndPos.line, editor.document.lineAt( fullEndPos.line ).range.end.character ) );
                        var todoText = text.substring( offsetEnd, endOfLineOffset );
                        var subTagMatch = todoText.match( subTagRegex );
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
                        addDecoration( editor.document.positionAt( match.index ), endPos );
                    }
                    else if( type === 'line' || type === 'whole-line' )
                    {
                        addDecoration(
                            new vscode.Position( fullEndPos.line, editor.document.lineAt( fullEndPos.line ).range.end.character ),
                            new vscode.Position( startPos.line, 0 ) );
                    }
                    else
                    {
                        addDecoration( startPos, endPos );
                    }
                    
                    // Handle multi-line highlighting if enabled (for ALL types)
                    if( isMultilineEnabled )
                    {
                        var lineText = editor.document.lineAt( startPos.line ).text;
                        var commentPrefix = '';
                        
                        // Detect comment prefix (supports #, //, /*, <!--, ;, etc.)
                        // Group 1 captures leading whitespace, Group 2 captures the comment character(s)
                        var prefixMatch = lineText.match( /^(\s*)(#|\/{2}|\/{1}\*|<!--|;|--|-|\d+\.|\*)/ );
                        if( prefixMatch )
                        {
                            commentPrefix = prefixMatch[ 0 ];
                            
                            var multiLines = detectMultilineBlock( editor.document, startPos.line, commentPrefix );
                            
                            // If we found a multi-line block, add highlighting for continuation lines
                            if( multiLines.length > 1 )
                            {
                                // For the first line, if type is 'tag', replace it with content-only highlight
                                if( type === 'tag' )
                                {
                                    // Remove the tag-only highlight and replace with content highlight
                                    if( documentHighlights[ tag ] && documentHighlights[ tag ].length > 0 )
                                    {
                                        documentHighlights[ tag ].pop();
                                    }
                                    
                                    // Find where the actual content starts after the TODO tag
                                    var firstLine = editor.document.lineAt( startPos.line );
                                    var firstLineText = firstLine.text;
                                    
                                    // Look for the TODO tag and start highlighting after it
                                    var tagPattern = new RegExp( '\\b' + tag + '\\b.*?:?\\s*' );
                                    var tagMatch = firstLineText.match( tagPattern );
                                    if( tagMatch )
                                    {
                                        var contentStart = firstLineText.indexOf( tagMatch[0] ) + tagMatch[0].length;
                                        if( contentStart < firstLineText.length )
                                        {
                                            var firstLineStartPos = new vscode.Position( firstLine.line, contentStart );
                                            addDecoration( firstLineStartPos, firstLine.range.end );
                                        }
                                    }
                                }
                                
                                // Add highlights for continuation lines
                                for( var i = 1; i < multiLines.length; i++ )
                                {
                                    var blockLine = editor.document.lineAt( multiLines[ i ] );
                                    var blockLineText = blockLine.text;
                                    
                                    if( blockLineText.trim().length > 0 )
                                    {
                                        var blockContentStart = 0;
                                        
                                        // Find where the actual content starts (after comment characters and spaces)
                                        var blockPrefixMatch = blockLineText.match( /^(\s*)(#|\/{2}|\/{1}\*|<!--|;|--|-|\d+\.|\*)(\s*)/ );
                                        if( blockPrefixMatch )
                                        {
                                            // Start after the comment prefix and any following spaces
                                            blockContentStart = blockPrefixMatch[ 0 ].length;
                                        }
                                        else if( prefixMatch && prefixMatch[ 0 ].indexOf('<!--') !== -1 )
                                        {
                                            // For HTML comment continuation lines without specific prefix,
                                            // start from the first non-whitespace character (the actual content)
                                            blockContentStart = blockLine.firstNonWhitespaceCharacterIndex;
                                        }
                                        else
                                        {
                                            // Fallback to first non-whitespace character
                                            blockContentStart = blockLine.firstNonWhitespaceCharacterIndex;
                                        }
                                        
                                        // Only highlight if there's actual content after the comment characters
                                        if( blockContentStart < blockLineText.length )
                                        {
                                            var blockStartPos = new vscode.Position( multiLines[ i ], blockContentStart );
                                            var blockEndPos = blockLine.range.end;
                                            addDecoration( blockStartPos, blockEndPos );
                                        }
                                    }
                                }
                            }
                        }
                    }
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
        var highlightDelay = vscode.workspace.getConfiguration( 'todo-tree.highlights' ).highlightDelay;
        highlightTimer[ id ] = setTimeout( highlight, highlightDelay, editor );
    }
}

module.exports.init = init;
module.exports.getDecoration = getDecoration;
module.exports.triggerHighlight = triggerHighlight;

