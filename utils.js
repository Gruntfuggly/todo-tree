var minimatch = require( 'minimatch' );
var micromatch = require( 'micromatch' );

var config;

var commentPatterns = require( 'comment-patterns' );

function init( configuration )
{
    config = configuration;
}

function isHexColour( rgb )
{
    return ( typeof rgb === "string" ) && ( rgb.length === 3 || rgb.length === 6 ) && !isNaN( parseInt( rgb, 16 ) );
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
    var originalTag;

    if( c.regex.indexOf( "$TAGS" ) > -1 )
    {
        var tagRegex = new RegExp( "(" + c.tags.join( "|" ) + ")", flags );

        tagMatch = tagRegex.exec( text );
        if( tagMatch )
        {
            text = text.substr( tagMatch.index );
            if( config.shouldGroup() )
            {
                text = text.substr( tagMatch[ 0 ].length );
            }
            c.get( 'tags' ).map( function( tag )
            {
                if( tag.toLowerCase() == tagMatch[ 0 ].toLowerCase() )
                {
                    originalTag = tagMatch[ 0 ];
                }
            } );
        }
    }

    return { tag: tagMatch ? originalTag : "", withoutTag: text.trim() };
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

function getRegex()
{
    var flags = 'gm';
    if( config.regex().caseSensitive === false )
    {
        flags += 'i';
    }

    return RegExp( getRegexSource(), flags );
}

function shouldIgnore( filename )
{
    var globs = config.globs();

    var result = false;

    if( globs.length > 0 )
    {
        result = true;
        globs.map( function( glob )
        {
            if( minimatch( filename, glob ) )
            {
                result = false;
            }
        } );
    }

    return result;
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

module.exports.init = init;
module.exports.isHexColour = isHexColour;
module.exports.removeBlockComments = removeBlockComments;
module.exports.extractTag = extractTag;
module.exports.getRegexSource = getRegexSource;
module.exports.getRegex = getRegex;
module.exports.shouldIgnore = shouldIgnore;
module.exports.isIncluded = isIncluded;
