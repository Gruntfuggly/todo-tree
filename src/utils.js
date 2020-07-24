var micromatch = require( 'micromatch' );
var os = require( 'os' );
var path = require( 'path' );
var find = require( 'find' );
var strftime = require( 'fast-strftime' );

var config;

var commentPatterns = require( 'comment-patterns' );

var envRegex = new RegExp( "\\$\\{(.*?)\\}", "g" );

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
    if( path.extname( fileName ) === ".jsonc" )
    {
        fileName = path.join( path.dirname( fileName ), path.basename( fileName, path.extname( fileName ) ) ) + ".js";
    }

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

function removeLineComments( text, fileName )
{
    var result = text.trim();

    if( path.extname( fileName ) === ".jsonc" )
    {
        fileName = path.join( path.dirname( fileName ), path.basename( fileName, path.extname( fileName ) ) ) + ".js";
    }

    var commentPattern;
    try
    {
        commentPattern = commentPatterns( fileName );
    }
    catch( e )
    {
    }

    if( commentPattern && commentPattern.singleLineComment )
    {
        commentPattern.singleLineComment.map( function( comment )
        {
            if( result.indexOf( comment.start ) === 0 )
            {
                result = result.substr( comment.start.length );
            }
        } );
    }

    return result;
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

function extractTag( text, matchOffset )
{
    var c = config.regex();
    var flags = c.caseSensitive ? '' : 'i';
    var tagMatch;
    var tagOffset;
    var originalTag;
    var before = text;
    var after = text;

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
                text = text.substr( 0, matchOffset ? matchOffset - 1 : tagMatch.index ).trim();
                after = "";
                before = text;
            }
            else
            {
                before = text.substr( 0, matchOffset ? matchOffset - 1 : tagMatch.index ).trim();
                text = rightOfTag;
                after = rightOfTag;
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
    return { tag: tagMatch ? originalTag : "", withoutTag: text, before: before, after: after, tagOffset: tagOffset };
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

function getRegexForEditorSearch()
{
    var flags = 'gm';
    if( config.regex().caseSensitive === false )
    {
        flags += 'i';
    }

    var source = getRegexSource();
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
    result = result.replace( /\$\{tag\}/g, node.actualTag );
    result = result.replace( /\$\{after\}/g, node.after );
    result = result.replace( /\$\{before\}/g, node.before );
    result = result.replace( /\$\{afterOrBefore\}/g, ( ( node.after === "" ) ? node.before : node.after ) );
    if( node.fsPath )
    {
        result = result.replace( /\$\{filename\}/g, path.basename( node.fsPath ) );
        result = result.replace( /\$\{filepath\}/g, node.fsPath );
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

function isHidden( filename )
{
    return filename.indexOf( '.' ) !== -1 && path.extname( filename ) === "";
}

function expandTilde( filePath )
{
    if( filePath && filePath[ 0 ] === '~' )
    {
        filePath = path.join( os.homedir(), filePath.slice( 1 ) );
    }

    return filePath;
}

function replaceEnvironmentVariables( text )
{
    text = text.replace( envRegex, function( match, name )
    {
        return process.env[ name ] ? process.env[ name ] : "";
    } );

    return text;
}

function formatExportPath( template, dateTime )
{
    var result = expandTilde( template );
    if( result )
    {
        result = strftime.strftime( result, dateTime );
    }
    return result;
}

module.exports.init = init;
module.exports.isHexColour = isHexColour;
module.exports.hexToRgba = hexToRgba;
module.exports.removeBlockComments = removeBlockComments;
module.exports.removeLineComments = removeLineComments;
module.exports.extractTag = extractTag;
module.exports.getRegexSource = getRegexSource;
module.exports.getRegexForRipGrep = getRegexForRipGrep;
module.exports.getRegexForEditorSearch = getRegexForEditorSearch;
module.exports.isIncluded = isIncluded;
module.exports.formatLabel = formatLabel;
module.exports.createFolderGlob = createFolderGlob;
module.exports.getSubmoduleExcludeGlobs = getSubmoduleExcludeGlobs;
module.exports.isHidden = isHidden;
module.exports.expandTilde = expandTilde;
module.exports.replaceEnvironmentVariables = replaceEnvironmentVariables;
module.exports.formatExportPath = formatExportPath;
