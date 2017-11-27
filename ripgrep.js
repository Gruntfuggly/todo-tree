/* eslint-env node */

/**
 * This is a slightly modified version of the ripgrep-js module from npm
 * written by alexlafroscia (github.com/alexlafroscia/ripgrep-js)
 * Instead of assuming that ripgrep is in the users path, it uses the
 * ripgrep binary downloaded via vscode-ripgrep.
 */

'use strict';
const exec = require( 'child_process' ).exec;
const fs = require( 'fs' );
const path = require( 'path' );
const vscode = require( 'vscode' );

function RipgrepError( error, stderr )
{
    this.message = error;
    this.stderr = stderr;
}

function formatResults( stdout )
{
    stdout = stdout.trim();

    if( !stdout )
    {
        return [];
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
module.exports = function ripGrep( cwd, options, searchTerm )
{
    // If you're invoking the function with two arguments, just the `cwd` and `searchTerm`
    if( arguments.length === 2 && typeof options === 'string' )
    {
        searchTerm = options;
        options = {};
    }

    if( !cwd )
    {
        return Promise.reject( 'No `cwd` provided' );
    }

    if( arguments.length === 1 )
    {
        return Promise.reject( 'No search term provided' );
    }

    options.regex = options.regex || '';
    options.globs = options.globs || [];
    options.string = searchTerm || options.string || '';

    var rgPath = vscode.workspace.getConfiguration( 'todo-tree' ).ripgrep;
    if( rgPath === "" )
    {
        var extPath = vscode.extensions.getExtension( "Gruntfuggly.todo-tree" ).extensionPath;
        var isWin = /^win/.test( process.platform );
        var rgExe = isWin ? "rg.exe" : "rg";
        rgPath = path.join( extPath, "node_modules/vscode-ripgrep/bin/", rgExe );
    }

    if( ! fs.existsSync( rgPath ) )
    {
        vscode.window.showErrorMessage( "todo-tree: ripgrep not found (" + rgPath + ")" );
    }

    let execString = rgPath + ' --column --line-number --color never';

    if( options.regex )
    {
        execString = `${execString} -e ${options.regex}`;
    } else if( options.string )
    {
        execString = `${execString} -F ${options.string}`;
    }

    execString = options.globs.reduce( ( command, glob ) =>
    {
        return `${command} -g '${glob}'`;
    }, execString );

    execString += " .";

    return new Promise( function( resolve, reject )
    {
        exec( execString, { cwd }, ( error, stdout, stderr ) =>
        {
            if( !error || ( error && stderr === '' ) )
            {
                resolve( formatResults( stdout ) );
            } else
            {
                reject( new RipgrepError( error, stderr ) );
            }
        } );
    }
    );
};

class Match
{
    constructor( matchText )
    {
        matchText = matchText.split( ':' );

        this.file = matchText.shift();
        this.line = parseInt( matchText.shift() );
        this.column = parseInt( matchText.shift() );
        this.match = matchText.join( ':' );
    }
}

module.exports.Match = Match;
