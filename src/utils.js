var micromatch = require( 'micromatch' );
var os = require( 'os' );
var path = require( 'path' );
var find = require( 'find' );
var strftime = require( 'fast-strftime' );
var commentPatterns = require( 'comment-patterns' );

var colourNames = require( './colourNames.js' );
var themeColourNames = require( './themeColourNames.js' );

var config;

var envRegex = new RegExp( "\\$\\{(.*?)\\}", "g" );
var rgbRegex = new RegExp( "^rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*(\\d+(?:\\.\\d+)?))?\\)$", "gi" );
var placeholderRegex = new RegExp( "(\\$\\{.*\\})" );

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
    return ( typeof colour === "string" ) && hex.length === withoutHash.length && ( hex.length === 3 || hex.length === 4 || hex.length === 6 || hex.length === 8 ) && !isNaN( parseInt( hex, 16 ) );
}

function isRgbColour( colour )
{
    return colour.match && colour.match( rgbRegex ) !== null;
}

function isNamedColour( colour )
{
    return colourNames.indexOf( colour.toLowerCase() ) > -1;
}

function isThemeColour( colour )
{
    return themeColourNames.indexOf( colour ) > -1;
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
    var extension = path.extname( fileName );

    if( extension === ".jsonc" )
    {
        fileName = path.join( path.dirname( fileName ), path.basename( fileName, extension ) ) + ".js";
    }
    else if( extension === ".vue" )
    {
        fileName = path.join( path.dirname( fileName ), path.basename( fileName, extension ) ) + ".html";
    }
    else if( extension === ".hs" )
    {
        fileName = path.join( path.dirname( fileName ), path.basename( fileName, extension ) ) + ".cpp";
    }

    var commentPattern;
    try
    {
        commentPattern = commentPatterns( fileName );
    }
    catch( e )
    {
    }

    if( commentPattern && commentPattern.name === 'Markdown' )
    {
        commentPattern = commentPatterns( ".html" );
        fileName = ".html";
    }

    if( commentPattern && commentPattern.multiLineComment && commentPattern.multiLineComment.length > 0 )
    {
        commentPattern = commentPatterns.regex( fileName );
        if( commentPattern && commentPattern.regex )
        {
            var regex = commentPattern.regex;
            if( extension == ".hs" )
            {
                var source = regex.source;
                var flags = regex.flags;
                while( source.indexOf( "\\/\\*\\*" ) !== -1 )
                {
                    source = source.replace( "\\/\\*\\*", "{-" );
                }
                while( source.indexOf( "\\/\\*" ) !== -1 )
                {
                    source = source.replace( "\\/\\*", "{-" );
                }
                while( source.indexOf( "\\*\\/" ) !== -1 )
                {
                    source = source.replace( "\\*\\/", "-}" );
                }
                regex = new RegExp( source, flags );
                commentPattern.regex = regex;
            }
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
    var tags = config.tags().slice().sort().reverse();
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
    var tagMatch = null;
    var tagOffset;
    var originalTag;
    var before = text;
    var after = text;
    var subTag;

    if( c.regex.indexOf( "$TAGS" ) > -1 )
    {
        var tagRegex = new RegExp( getTagRegex(), flags );
        var subTagRegex = new RegExp( config.subTagRegex(), flags );
        tagMatch = tagRegex.exec( text );
        if( tagMatch )
        {
            tagOffset = tagMatch.index;
            var rightOfTagText = text.substr( tagMatch.index + tagMatch[ 0 ].length ).trim();
            var subTagMatch = subTagRegex.exec( rightOfTagText );
            if( subTagMatch && subTagMatch.length > 1 )
            {
                subTag = subTagMatch[ 1 ];
            }
            rightOfTag = rightOfTagText.replace( subTagRegex, "" );
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
                if( config.isRegexCaseSensitive() )
                {
                    if( tag === tagMatch[ 0 ] )
                    {
                        originalTag = tag;
                    }
                }
                else if( tag.toLowerCase() === tagMatch[ 0 ].toLowerCase() )
                {
                    originalTag = tag;
                }
            } );
        }
    }
    if( tagMatch === null && c.regex.trim() !== "" )
    {
        var regex = new RegExp( c.regex, flags );
        match = regex.exec( text );
        if( match !== null )
        {
            tagMatch = true;
            originalTag = match[ 0 ];
            before = text.substring( 0, text.indexOf( originalTag ) );
            after = text.substring( before.length + originalTag.length );
            tagOffset = match.index;
            text = after;
        }
    }
    return {
        tag: tagMatch ? originalTag : "",
        withoutTag: text,
        before: before,
        after: after,
        tagOffset: tagOffset,
        subTag: subTag
    };
}

function updateBeforeAndAfter( result, text, matchOffset )
{
    var c = config.regex();
    var flags = c.caseSensitive ? '' : 'i';
    var tagMatch = null;

    var tagRegex = new RegExp( getTagRegex(), flags );
    var subTagRegex = new RegExp( config.subTagRegex(), flags );
    tagMatch = tagRegex.exec( text );
    if( tagMatch )
    {
        result.tagOffset = tagMatch.index;
        var rightOfTagText = text.substr( tagMatch.index + tagMatch[ 0 ].length ).trim();
        var subTagMatch = subTagRegex.exec( rightOfTagText );
        if( subTagMatch && subTagMatch.length > 1 )
        {
            result.subTag = subTagMatch[ 1 ];
        }
        rightOfTag = rightOfTagText.replace( subTagRegex, "" );
        if( rightOfTag.length === 0 )
        {
            result.text = text.substr( 0, matchOffset ? matchOffset - 1 : tagMatch.index ).trim();
            result.after = "";
            result.before = text;
        }
        else
        {
            result.before = text.substr( 0, matchOffset ? matchOffset - 1 : tagMatch.index ).trim();
            result.text = rightOfTag;
            result.after = rightOfTag;
        }
    }

    return result;
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
    if( config.regex().multiLine === true )
    {
        flags += 's';
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

function formatLabel( template, node, unexpectedPlaceholders )
{
    var result = template;

    var tag = String( node.actualTag ).trim();
    var subTag = node.subTag ? String( node.subTag ).trim() : "";
    var filename = node.fsPath ? path.basename( node.fsPath ) : "";
    var filepath = node.fsPath ? node.fsPath : "";

    var formatLabelMap = {
        "line": node.line + 1,
        "column": node.column,
        "tag": tag,
        "tag:uppercase": tag.toUpperCase(),
        "tag:lowercase": tag.toLowerCase(),
        "tag:capitalize": tag.charAt( 0 ).toUpperCase() + tag.slice( 1 ).toLowerCase(),
        "subtag": subTag,
        "subtag:uppercase": subTag.toUpperCase(),
        "subtag:lowercase": subTag.toLowerCase(),
        "subtag:capitalize": ( subTag === "" ) ? "" : subTag.charAt( 0 ).toUpperCase() + subTag.slice( 1 ).toLowerCase(),
        "before": node.before,
        "after": node.after,
        "afterorbefore": ( node.after === "" ) ? node.before : node.after,
        "filename": filename,
        "filepath": filepath
    }

    // prepare regex to substitude "${name}" with it's value from map
    var re = new RegExp( "\\$\\{(" + Object.keys( formatLabelMap ).join( "|" ) + ")\\}", "gi" );
    result = result.replace( re, function( matched )
    {
        return formatLabelMap[ matched.slice( 2, -1 ).toLowerCase() ];
    } );

    if( unexpectedPlaceholders )
    {
        var placeholderMatch = placeholderRegex.exec( result );
        if( placeholderMatch )
        {
            unexpectedPlaceholders.push( placeholderMatch[ 0 ] );
        }
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
    return path.basename( filename ).indexOf( '.' ) !== -1 && path.extname( filename ) === "";
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

function complementaryColour( colour )
{
    var hex = colour.split( / / )[ 0 ].replace( /[^\da-fA-F]/g, '' );
    var digits = hex.length / 3;
    var red = parseInt( hex.substr( 0, digits ), 16 );
    var green = parseInt( hex.substr( 1 * digits, digits ), 16 );
    var blue = parseInt( hex.substr( 2 * digits, digits ), 16 );
    var c = [ red / 255, green / 255, blue / 255 ];
    for( var i = 0; i < c.length; ++i )
    {
        if( c[ i ] <= 0.03928 )
        {
            c[ i ] = c[ i ] / 12.92;
        } else
        {
            c[ i ] = Math.pow( ( c[ i ] + 0.055 ) / 1.055, 2.4 );
        }
    }
    var l = 0.2126 * c[ 0 ] + 0.7152 * c[ 1 ] + 0.0722 * c[ 2 ];
    return l > 0.179 ? "#000000" : "#ffffff";
}

function isValidColour( colour )
{
    if( colour )
    {
        if( isNamedColour( colour ) || isThemeColour( colour ) || isHexColour( colour ) || isRgbColour( colour ) )
        {
            return true;
        }
    }

    return false;
}

function setRgbAlpha( rgb, alpha )
{
    rgbRegex.lastIndex = 0;
    var match = rgbRegex.exec( rgb );
    if( match !== null )
    {
        return "rgba(" + match[ 1 ] + "," + match[ 2 ] + "," + match[ 3 ] + "," + alpha + ")";
    }
    return rgb;
}

function isCodicon( icon )
{
    return icon.trim().indexOf( "$(" ) === 0;
}

function toGlobArray( globs )
{
    if( globs === undefined )
    {
        return [];
    }
    if( typeof ( globs ) === 'string' )
    {
        return globs.split( ',' );
    }
    return globs;
}

module.exports.init = init;
module.exports.isHexColour = isHexColour;
module.exports.isRgbColour = isRgbColour;
module.exports.isNamedColour = isNamedColour;
module.exports.isThemeColour = isThemeColour;
module.exports.hexToRgba = hexToRgba;
module.exports.removeBlockComments = removeBlockComments;
module.exports.removeLineComments = removeLineComments;
module.exports.extractTag = extractTag;
module.exports.updateBeforeAndAfter = updateBeforeAndAfter;
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
module.exports.complementaryColour = complementaryColour;
module.exports.isValidColour = isValidColour;
module.exports.setRgbAlpha = setRgbAlpha;
module.exports.isCodicon = isCodicon;
module.exports.toGlobArray = toGlobArray;
