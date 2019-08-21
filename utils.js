var micromatch = require( 'micromatch' );
var path = require( 'path' );

var config;

var commentPatterns = require( 'comment-patterns' );

function init( configuration )
{
    config = configuration;
}

function isHexColour( colour )
{
    var withoutHash = colour.indexOf( '#' ) === 0 ? colour.substring( 1 ) : colour;
    var hex = withoutHash.split( / / )[ 0 ].replace( /[^\da-fA-F]/g, '' );
    return ( typeof colour === "string" ) && hex.length === withoutHash.length && ( hex.length === 3 || hex.length === 6 ) && !isNaN( parseInt( hex, 16 ) );
}

function hexToRgba( hex, opacity )
{
    function toComponent( digits )
    {
        return ( digits.length == 1 ) ? parseInt( digits + digits, 16 ) : parseInt( digits, 16 );
    }

    if( hex !== undefined )
    {
        hex = hex.replace( '#', '' );

        var rgb = hex.substring( 0, ( hex.length == 3 || hex.length == 4 ) ? 3 : 6 );

        var r = toComponent( rgb.substring( 0, rgb.length / 3 ) );
        var g = toComponent( rgb.substring( rgb.length / 3, 2 * rgb.length / 3 ) );
        var b = toComponent( rgb.substring( 2 * rgb.length / 3, 3 * rgb.length / 3 ) );

        if( hex.length == 4 || hex.length == 8 )
        {
            opacity = parseInt( toComponent( hex.substring( 3 * hex.length / 4, 4 * hex.length / 4 ) ) * 100 / 255 );
        }

        return 'rgba(' + r + ',' + g + ',' + b + ',' + opacity / 100 + ')';
    }

    return '#0F0';
}

function removeBlockComments( text, fileName )
{
    var commentPattern;
    try
    {
        commentPattern = commentPatterns( fileName );
    }
    catch( e )
    {
    }

    if( commentPattern && commentPattern.multiLineComment && commentPattern.multiLineComment.length > 0 )
    {
        commentPattern = commentPatterns.regex( fileName );
        if( commentPattern && commentPattern.regex )
        {
            var commentMatch = commentPattern.regex.exec( text );
            if( commentMatch )
            {
                for( var i = commentPattern.cg.contentStart; i < commentMatch.length; ++i )
                {
                    if( commentMatch[ i ] )
                    {
                        text = commentMatch[ i ];
                        break;
                    }
                }
            }
        }
    }

    return text;
}

function extractTag( text )
{
    var c = config.regex();
    var flags = c.caseSensitive ? '' : 'i';
    var tagMatch;
    var tagOffset;
    var originalTag;

    if( c.regex.indexOf( "$TAGS" ) > -1 )
    {
        var tagRegex = new RegExp( "(" + c.tags.join( "|" ) + ")", flags );

        tagMatch = tagRegex.exec( text );
        if( tagMatch )
        {
            tagOffset = tagMatch.index;
            rightOfTag = text.substr( tagMatch.index + tagMatch[ 0 ].length ).trim().replace( /^:\s*/, "" );
            if( rightOfTag.length === 0 )
            {
                text = text.substr( 0, tagMatch.index );
            }
            else
            {
                text = rightOfTag;
            }
            c.tags.map( function( tag )
            {
                if( tag.toLowerCase() == tagMatch[ 0 ].toLowerCase() )
                {
                    originalTag = tag;
                }
            } );
        }
    }
    return { tag: tagMatch ? originalTag : "", withoutTag: text, tagOffset: tagOffset };
}

function getRegexSource()
{
    var c = config.regex();
    if( c.regex.indexOf( "($TAGS)" ) > -1 )
    {
        var tags = c.tags.join( "|" );
        tags = tags.replace( /\\/g, '\\x5c' );
        c.regex = c.regex.replace( "$TAGS", tags );
    }

    return c.regex;
}

function getRegexForEditorSearch()
{
    var flags = 'gm';
    if( config.regex().caseSensitive === false )
    {
        flags += 'i';
    }

    var source = getRegexSource();
    source = source.replace( /\\\\/g, "\\" );
    return RegExp( source, flags );
}

function getRegexForRipGrep()
{
    var flags = 'gm';
    if( config.regex().caseSensitive === false )
    {
        flags += 'i';
    }

    return RegExp( getRegexSource(), flags );
}
function isIncluded( name, includes, excludes )
{
    var included = includes.length === 0 || micromatch.isMatch( name, includes );
    if( included === true && micromatch.isMatch( name, excludes ) )
    {
        included = false;
    }
    return included;
}

function formatLabel( template, node )
{
    var result = template;

    result = result.replace( /\$\{line\}/g, ( node.line + 1 ) );
    result = result.replace( /\$\{column\}/g, node.column );
    result = result.replace( /\$\{tag\}/g, node.tag );
    result = result.replace( /\$\{after\}/g, node.after );
    result = result.replace( /\$\{before\}/g, node.before );
    if( node.fsPath )
    {
        result = result.replace( /\$\{filename\}/g, path.basename( node.fsPath ) );
    }

    return result;
}

module.exports.init = init;
module.exports.isHexColour = isHexColour;
module.exports.hexToRgba = hexToRgba;
module.exports.removeBlockComments = removeBlockComments;
module.exports.extractTag = extractTag;
module.exports.getRegexSource = getRegexSource;
module.exports.getRegexForRipGrep = getRegexForRipGrep;
module.exports.getRegexForEditorSearch = getRegexForEditorSearch;
module.exports.isIncluded = isIncluded;
module.exports.formatLabel = formatLabel;
