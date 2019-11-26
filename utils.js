var micromatch = require( 'micromatch' );
var path = require( 'path' );
var find = require( 'find' );

var config;

var commentPatterns = require( 'comment-patterns' );

function init( configuration )
{
    config = configuration;
}

function isHexColour( colour )
{
    if( typeof ( colour ) !== 'string' )
    {
        return false;
    }
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

function getTagRegex()
{
    var c = config.regex();
    var tags = c.tags.sort().reverse();
    tags = tags.map( function( tag )
    {
        tag = tag.replace( /\\/g, '\\\\\\' );
        tag = tag.replace( /[|{}()[\]^$+*?.-]/g, '\\$&' );
        return tag;
    } );
    tags = tags.join( '|' );
    return '(' + tags + ')';
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
        var tagRegex = new RegExp( getTagRegex(), flags );

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
    var regex = config.regex().regex;
    if( regex.indexOf( "($TAGS)" ) > -1 )
    {
        regex = regex.split( "($TAGS)" ).join( getTagRegex() );
    }

    return regex;
}

function getRegexSourceFaster()
{
    /*
    Replaces all unescaped "(" capturing groups with "(?:" non-capturing groups
    instead, which doubles performance of the JS regex engine when searching.
    Our replacement pattern uses negative lookbehind + lookahead to ensure
    that it never matches escaped "\(" chars or already-modified "(?" groups.
    Group 1 in the substitution contains any preceding NON-escaping "\".
    */
    var regex = getRegexSource();
    regex = regex.replace( /(?<!\\)((?:\\\\)*)\((?!\?)/g, "$1(?:" );

    return regex;
}

function getRegexForEditorSearch()
{
    var flags = 'gm';
    if( config.regex().caseSensitive === false )
    {
        flags += 'i';
    }

    // JavaScript regex performance is doubled by using the faster regex.
    return RegExp( getRegexSourceFaster(), flags );
}

function getRegexForRipGrep()
{
    var flags = 'gm';
    if( config.regex().caseSensitive === false )
    {
        flags += 'i';
    }

    // RipGrep doesn't accept "(?:)" groups, so we'll send the regular regex.
    return RegExp( getRegexSource(), flags );
}

function isIncluded( name, includes, excludes )
{
    var posix_includes = includes.map( function( glob )
    {
        return glob.replace( /\\/g, '/' );
    } );
    var posix_excludes = excludes.map( function( glob )
    {
        return glob.replace( /\\/g, '/' );
    } );

    var included = posix_includes.length === 0 || micromatch.isMatch( name, posix_includes );
    if( included === true && micromatch.isMatch( name, posix_excludes ) )
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

function createFolderGlob( folderPath, rootPath, filter )
{
    if( process.platform === 'win32' )
    {
        var fp = folderPath.replace( /\\/g, '/' );
        var rp = rootPath.replace( /\\/g, '/' );

        if( fp.indexOf( rp ) === 0 )
        {
            fp = fp.substring( path.dirname( rp ).length );
        }

        return ( "**/" + fp + filter ).replace( /\/\//g, '/' );
    }

    return ( folderPath + filter ).replace( /\/\//g, '/' );
}

function getSubmoduleExcludeGlobs( rootPath )
{
    var submodules = find.fileSync( '.git', rootPath );
    submodules = submodules.map( function( submodule )
    {
        return path.dirname( submodule );
    } );
    submodules = submodules.filter( function( submodule )
    {
        return submodule != rootPath;
    } );
    return submodules;
}

module.exports.init = init;
module.exports.isHexColour = isHexColour;
module.exports.hexToRgba = hexToRgba;
module.exports.removeBlockComments = removeBlockComments;
module.exports.extractTag = extractTag;
module.exports.getRegexSource = getRegexSource;
module.exports.getRegexSourceFaster = getRegexSourceFaster;
module.exports.getRegexForRipGrep = getRegexForRipGrep;
module.exports.getRegexForEditorSearch = getRegexForEditorSearch;
module.exports.isIncluded = isIncluded;
module.exports.formatLabel = formatLabel;
module.exports.createFolderGlob = createFolderGlob;
module.exports.getSubmoduleExcludeGlobs = getSubmoduleExcludeGlobs;
