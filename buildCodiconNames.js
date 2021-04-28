#! /usr/local/bin/node

var fs = require( 'fs' );
var cp = require( "child_process" );

var raw = cp.execSync( "curl -s https://raw.githubusercontent.com/microsoft/vscode-codicons/main/src/template/mapping.json" ).toString();
var mappings = JSON.parse( raw );

fs.writeFileSync( 'src/codiconNames.js', "module.exports = " + JSON.stringify( Object.keys( mappings ), null, 2 ) + ";\n" );
