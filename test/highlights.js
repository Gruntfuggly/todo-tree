var fs = require( 'fs' );
var path = require( 'path' );
var vm = require( 'vm' );

QUnit.test( "highlighting preserves RegExp.prototype.exec and capture-group ranges", function( assert )
{
    var originalExec = RegExp.prototype.exec;
    var ranges = [];
    var vscode = {
        workspace: {
            getConfiguration: function()
            {
                return { get: function( name, fallback ) { return fallback; } };
            }
        },
        window: {
            createTextEditorDecorationType: function() { return { dispose: function() {} }; }
        },
        Range: function( start, end ) { this.start = start; this.end = end; },
        ThemeColor: function( id ) { this.id = id; }
    };
    var dependencies = {
        vscode: vscode,
        'regexp-match-indices': require( 'regexp-match-indices' ),
        './config.js': {
            customHighlight: function() { return {}; },
            subTagRegex: function() { return ''; }
        },
        './utils.js': {
            getRegexForEditorSearch: function() { return /(TODO) (one|two)/g; },
            extractTag: function() { return {}; },
            isHexColour: function() { return false; },
            isThemeColour: function() { return true; }
        },
        './attributes.js': {
            getForeground: function() {},
            getBackground: function() {},
            getAttribute: function( tag, name, fallback )
            {
                return name === 'type' ? 'capture-groups:2' : fallback;
            }
        },
        './icons.js': {}
    };
    var sandbox = {
        module: { exports: {} },
        require: function( name ) { return dependencies[ name ]; },
        setTimeout: function( callback, delay, editor ) { callback( editor ); return 1; },
        clearTimeout: function() {}
    };

    try
    {
        vm.runInNewContext( fs.readFileSync( path.join( __dirname, '../src/highlights.js' ), 'utf8' ), sandbox );
        assert.strictEqual( RegExp.prototype.exec, originalExec, 'loading highlights leaves the shared regex engine unchanged' );

        sandbox.module.exports.triggerHighlight( {
            document: {
                uri: 'test.typ',
                getText: function() { return '// TODO one\n// TODO two'; },
                positionAt: function( offset ) { return { line: 0, character: offset }; }
            },
            setDecorations: function( decoration, highlights )
            {
                highlights.forEach( function( highlight )
                {
                    ranges.push( [ highlight.range.start.character, highlight.range.end.character ] );
                } );
            }
        } );

        assert.deepEqual( ranges, [ [ 8, 11 ], [ 20, 23 ] ], 'each global match retains its capture-group indices' );
        assert.strictEqual( RegExp.prototype.exec, originalExec, 'highlighting leaves other extensions regex operations unchanged' );
    }
    finally
    {
        RegExp.prototype.exec = originalExec;
    }
} );
