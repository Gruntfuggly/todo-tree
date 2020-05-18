/* jshint esversion:6, node: true */
/* eslint-env node */

/**
 * This is a slightly modified version of the ripgrep-js module from npm
 * written by alexlafroscia (github.com/alexlafroscia/ripgrep-js)
 * Instead of assuming that ripgrep is in the users path, it uses the
 * ripgrep binary downloaded via vscode-ripgrep.
 */

'use strict';
const child_process = require( 'child_process' );
const fs = require( 'fs' );
const utils = require( './utils' );

var currentProcess;

function RipgrepError( error, stderr )
{
    this.message = error;
    this.stderr = stderr;
}

function formatResults( stdout, multiline )
{
    stdout = stdout.trim();

    if( !stdout )
    {
        return [];
    }

    if( multiline === true )
    {
        var lines = stdout.split( '\n' ).reverse();

        var results = [];
        var extraLines = [];
        lines.map( function( line )
        {
            var match = new Match( line );
            var extracted = utils.extractTag( match.match );
            if( extracted.tag )
            {
                match.extraLines = extraLines.reverse();
                match.extraLines = match.extraLines.map( function( element )
                {
                    element.match = utils.removeLineComments( element.match, match.file ).trim();
                    return element;
                } );
                extraLines = [];
                results.push( match );
            }
            else
            {
                extraLines.push( match );
            }
        } );

        return results;
    }

    return stdout
        .split( '\n' )
        .map( ( line ) => new Match( line ) );
}

/**
 * @method ripGrep
 * @param {string} cwd
 * @param {object|string} options if a string is provided, it will be used as the `searchTerm`
 * @param {string} options.regex a regex pattern to search for. See `-e` option
 * @param {string} options.string a fixed string to search for. See `-F` option
 * @param {Array<string>} option.globs a set of globs to include/exclude. See `-g` option
 * @param {string} [searchTerm]
 */
module.exports.search = function ripGrep( cwd, options, searchTerm )
{
    // If you're invoking the function with two arguments, just the `cwd` and `searchTerm`
    if( arguments.length === 2 && typeof options === 'string' )
    {
        searchTerm = options;
        options = {};
    }

    if( !cwd )
    {
        return Promise.reject( { error: 'No `cwd` provided' } );
    }

    if( arguments.length === 1 )
    {
        return Promise.reject( { error: 'No search term provided' } );
    }

    options.regex = options.regex || '';
    options.globs = options.globs || [];
    options.string = searchTerm || options.string || '';

    var rgPath = options.rgPath;
    var isWin = /^win/.test( process.platform );

    if( !fs.existsSync( rgPath ) )
    {
        return Promise.reject( { error: "ripgrep executable not found (" + rgPath + ")" } );
    }
    if( !fs.existsSync( cwd ) )
    {
        return Promise.reject( { error: "root folder not found (" + cwd + ")" } );
    }

    if( isWin )
    {
        rgPath = '"' + rgPath + '"';
    }
    else
    {
        rgPath = rgPath.replace( / /g, '\\ ' );
    }

    let execString = rgPath + ' --no-messages --vimgrep -H --column --line-number --color never ' + options.additional;
    if( options.multiline )
    {
        execString += " -U ";
    }
    if( options.regex )
    {
        execString = `${execString} -e ${options.regex}`;
    }
    else if( options.string )
    {
        execString = `${execString} -F ${options.string}`;
    }

    execString = options.globs.reduce( ( command, glob ) =>
    {
        return `${command} -g \"${glob}\"`;
    }, execString );

    if( options.filename )
    {
        var filename = options.filename;
        if( isWin && filename.slice( -1 ) === "\\" )
        {
            filename = filename.substr( 0, filename.length - 1 );
        }
        execString += " \"" + filename + "\"";
    }
    else
    {
        execString += " .";
    }

    if( options.outputChannel )
    {
        options.outputChannel.appendLine( "Command: " + execString );
    }

    return new Promise( function( resolve, reject )
    {
        // The default for omitting maxBuffer, according to Node docs, is 200kB.
        // We'll explicitly give that here if a custom value is not provided.
        // Note that our options value is in KB, so we have to convert to bytes.
        const maxBuffer = ( options.maxBuffer || 200 ) * 1024;
        var currentProcess = child_process.exec( execString, { cwd, maxBuffer } );
        var results = "";

        currentProcess.stdout.on( 'data', function( data )
        {
            if( options.outputChannel )
            {
                options.outputChannel.appendLine( data );
            }
            results += data;
        } );

        currentProcess.stderr.on( 'data', function( data )
        {
            if( options.outputChannel )
            {
                options.outputChannel.appendLine( data );
            }
            reject( new RipgrepError( data, "" ) );
        } );

        currentProcess.on( 'close', function( code )
        {
            resolve( formatResults( results, options.multiline ) );
        } );

    } );
};

module.exports.kill = function()
{
    if( currentProcess !== undefined )
    {
        currentProcess.kill( 'SIGINT' );
    }
};

class Match
{
    constructor( matchText )
    {
        // Detect file, line number and column which is formatted in the
        // following format: {file}:{line}:{column}:{code match}
        var regex = RegExp( /^(?<file>.*):(?<line>\d+):(?<column>\d+):(?<todo>.*)/ );

        var match = regex.exec( matchText );
        if( match && match.groups )
        {
            this.file = match.groups.file;
            this.line = match.groups.line;
            this.column = match.groups.column;
            this.match = match.groups.todo;
        }
        else // Fall back to old method
        {
            this.file = "";

            if( matchText.length > 1 && matchText[ 1 ] === ':' )
            {
                this.file = matchText.substr( 0, 2 );
                matchText = matchText.substr( 2 );
            }

            matchText = matchText.split( ':' );
            this.file += matchText.shift();
            this.line = parseInt( matchText.shift() );
            this.column = parseInt( matchText.shift() );
            this.match = matchText.join( ':' );
        }
    }
}

module.exports.Match = Match;
