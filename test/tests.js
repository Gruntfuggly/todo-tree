var utils = require( '../utils.js' );
var stubs = require( './stubs.js' );

QUnit.test( "utils.isHexColour", function( assert )
{
    assert.ok( utils.isHexColour( "" ) === false );
    assert.ok( utils.isHexColour( "red" ) === false );
    assert.ok( utils.isHexColour( "ff0000" ) === true );
    assert.ok( utils.isHexColour( "fff" ) === true );
} );

QUnit.test( "utils.isHexColour strips non RGB values", function( assert )
{
    assert.ok( utils.isHexColour( "#ff00ff" ) === true );
    assert.ok( utils.isHexColour( "#0ff" ) === true );
    assert.ok( utils.isHexColour( "bedding" ) === false );
    assert.ok( utils.isHexColour( "inbed" ) === false );
    assert.ok( utils.isHexColour( "magneta" ) === false );
    assert.ok( utils.isHexColour( "#bed" ) === true );
    assert.ok( utils.isHexColour( "face" ) === false );
    assert.ok( utils.isHexColour( "ace" ) === true );
} );

QUnit.test( "utils.removeBlockComments strips block comments based on filename", function( assert )
{
    assert.equal( utils.removeBlockComments( "/* a */", "x.cpp" ), " a " );
    assert.equal( utils.removeBlockComments( "// a //", "x.cpp" ), "// a //" );
    assert.equal( utils.removeBlockComments( "/* a */", "x.js" ), " a " );
    assert.equal( utils.removeBlockComments( "/* a */", "x.txt" ), "/* a */" );
    assert.equal( utils.removeBlockComments( "<!-- a -->", "x.html" ), " a " );
    assert.equal( utils.removeBlockComments( "  /* a */", "x.cpp" ), " a " );
    assert.equal( utils.removeBlockComments( "b /* a */", "x.cpp" ), "b /* a */" );
} );

QUnit.test( "utils.extractTag removes everything including tag", function( assert )
{
    var testConfig = stubs.getTestConfig();
    testConfig.shouldGroupFlag = true;
    utils.init( testConfig );

    var result = utils.extractTag( "before TODO after" );
    assert.equal( result.tag, "TODO" );
    assert.equal( result.withoutTag, "after" );
} );

QUnit.test( "utils.extractTag can be case sensitive", function( assert )
{
    var testConfig = stubs.getTestConfig();
    testConfig.shouldGroupFlag = true;
    testConfig.shouldBeCaseSensitive = false;
    utils.init( testConfig );

    var result = utils.extractTag( "before todo after" );
    assert.equal( result.tag, "TODO" );
    assert.equal( result.withoutTag, "after" );

    testConfig.shouldBeCaseSensitive = true;
    result = utils.extractTag( "before todo after" );
    assert.equal( result.tag, "" );
    assert.equal( result.withoutTag, "before todo after" );
} );

QUnit.test( "utils.extractTag returns tag from tags list, not the match", function( assert )
{
    var testConfig = stubs.getTestConfig();
    testConfig.shouldGroupFlag = true;
    utils.init( testConfig );

    var result = utils.extractTag( "before todo after" );
    assert.equal( result.tag, "TODO" );
    assert.equal( result.withoutTag, "after" );
} );

QUnit.test( "utils.extractTag returns the tag offset", function( assert )
{
    var testConfig = stubs.getTestConfig();
    testConfig.shouldGroupFlag = true;
    utils.init( testConfig );

    var result = utils.extractTag( "before todo after" );
    assert.equal( result.tag, "TODO" );
    assert.equal( result.tagOffset, 7 );
} );

QUnit.test( "utils.extractTag remove colon from ${after}", function( assert )
{
    var testConfig = stubs.getTestConfig();
    utils.init( testConfig );

    result = utils.extractTag( "before TODO: after" );
    assert.equal( result.withoutTag, "after" );

    result = utils.extractTag( "before TODO : after" );
    assert.equal( result.withoutTag, "after" );

    result = utils.extractTag( "before TODO :after" );
    assert.equal( result.withoutTag, "after" );
    result = utils.formatLabel( "${tag}: ${after}", { tag: result.tag, after: result.withoutTag } )
    assert.equal( result, "TODO: after" );
} );

QUnit.test( "utils.extractTag returns text from the start of the line if the tag is on then end", function( assert )
{
    var testConfig = stubs.getTestConfig();
    utils.init( testConfig );

    result = utils.extractTag( "before TODO" );
    assert.equal( result.withoutTag, "before " );
} );

QUnit.test( "utils.getRegexSource returns the regex source without expanded tags if they aren't present", function( assert )
{
    var testConfig = stubs.getTestConfig();
    testConfig.regexSource = "notags";
    utils.init( testConfig );

    assert.equal( utils.getRegexSource(), "notags" );
} );

QUnit.test( "utils.getRegexSource returns the regex source with expanded tags", function( assert )
{
    var testConfig = stubs.getTestConfig();
    testConfig.tagList = [ "ONE", "TWO" ];
    utils.init( testConfig );

    assert.equal( utils.getRegexSource(), "(ONE|TWO)" );
} );

QUnit.test( "utils.getRegexSource returns the regex source and converts backslashes to hex", function( assert )
{
    var testConfig = stubs.getTestConfig();
    testConfig.tagList = [ "ONE\\", "\\TWO" ];
    utils.init( testConfig );

    assert.equal( utils.getRegexSource(), "(ONE\\x5c|\\x5cTWO)" );
} );

QUnit.test( "utils.getRegexForRipGrep applies the expected default flags", function( assert )
{
    var testConfig = stubs.getTestConfig();
    utils.init( testConfig );
    assert.equal( utils.getRegexForRipGrep().flags, "gim" );
} );

QUnit.test( "utils.getRegexForRipGrep can remove the case insensitive flag", function( assert )
{
    var testConfig = stubs.getTestConfig();
    testConfig.shouldBeCaseSensitive = true;
    utils.init( testConfig );
    assert.equal( utils.getRegexForRipGrep().flags, "gm" );
} );

QUnit.test( "utils.getRegexForEditorSearch removes extra escape characters", function( assert )
{
    var testConfig = stubs.getTestConfig();
    testConfig.regexSource = "\\\\n\\\\s";
    utils.init( testConfig );
    assert.equal( utils.getRegexForEditorSearch().source, "\\n\\s" );
} );

QUnit.test( "utils.isIncluded returns true when no includes or excludes are specified", function( assert )
{
    assert.ok( utils.isIncluded( "filename.js", [], [] ) === true );
    assert.ok( utils.isIncluded( "filename.txt", [], [] ) === true );
} );

QUnit.test( "utils.isIncluded returns false when name matches excludes", function( assert )
{
    assert.ok( utils.isIncluded( "filename.js", [], [ "*.txt" ] ) === true );
    assert.ok( utils.isIncluded( "filename.txt", [], [ "*.txt" ] ) === false );
} );

QUnit.test( "utils.isIncluded returns false when name doesn't match includes", function( assert )
{
    assert.ok( utils.isIncluded( "filename.js", [ "*.txt" ], [] ) === false );
    assert.ok( utils.isIncluded( "filename.txt", [ "*.txt" ], [] ) === true );
} );

QUnit.test( "utils.isIncluded returns false when name matches includes but also matches excludes", function( assert )
{
    assert.ok( utils.isIncluded( "filename.js", [ "*.txt" ], [ "*.js" ] ) === false );
    assert.ok( utils.isIncluded( "filename.txt", [ "*.txt" ], [ "*.txt" ] ) === false );
    assert.ok( utils.isIncluded( "filename.js", [ "*.txt" ], [ "*.txt" ] ) === false );
    assert.ok( utils.isIncluded( "filename.js", [ "*.txt", "*.js" ], [ "*.txt" ] ) === true );
} );

QUnit.test( "utils.formatLabel replaces line number placeholder", function( assert )
{
    assert.equal( utils.formatLabel( "Label ${line} content", { line: 23 } ), "Label 24 content" ); // line is zero based
} );

QUnit.test( "utils.formatLabel replaces column number placeholder", function( assert )
{
    assert.equal( utils.formatLabel( "Label ${column} content", { column: 78 } ), "Label 78 content" );
} );

QUnit.test( "utils.formatLabel replaces before text placeholder", function( assert )
{
    assert.equal( utils.formatLabel( "Label ${before} content", { before: "text before tag" } ), "Label text before tag content" );
} );

QUnit.test( "utils.formatLabel replaces tag placeholder", function( assert )
{
    assert.equal( utils.formatLabel( "Label ${tag} content", { tag: "TODO" } ), "Label TODO content" );
} );

QUnit.test( "utils.formatLabel replaces after text placeholder", function( assert )
{
    assert.equal( utils.formatLabel( "Label ${after} content", { after: "text after tag" } ), "Label text after tag content" );
} );

QUnit.test( "utils.formatLabel replaces before text placeholder", function( assert )
{
    assert.equal( utils.formatLabel( "Label ${before} content", { before: "text before tag" } ), "Label text before tag content" );
} );

QUnit.test( "utils.formatLabel replaces filename placeholder", function( assert )
{
    assert.equal( utils.formatLabel( "Label ${filename} content", { fsPath: "/path/to/filename.txt" } ), "Label filename.txt content" );
} );

QUnit.test( "utils.hexToRgba converts correctly", function( assert )
{
    assert.equal( utils.hexToRgba( "#000000", 0 ), "rgba(0,0,0,0)" );
    assert.equal( utils.hexToRgba( "#000000", 100 ), "rgba(0,0,0,1)" );
    assert.equal( utils.hexToRgba( "#000000", 50 ), "rgba(0,0,0,0.5)" );
    assert.equal( utils.hexToRgba( "#FFFFFF", 50 ), "rgba(255,255,255,0.5)" );
    assert.equal( utils.hexToRgba( "#4080A0", 50 ), "rgba(64,128,160,0.5)" );
    assert.equal( utils.hexToRgba( "#fff", 50 ), "rgba(255,255,255,0.5)" );
    assert.equal( utils.hexToRgba( "#48a", 50 ), "rgba(68,136,170,0.5)" );
    assert.equal( utils.hexToRgba( "#FFFFFFFF", 0 ), "rgba(255,255,255,1)" );
    assert.equal( utils.hexToRgba( "#FFFF", 0 ), "rgba(255,255,255,1)" );
    assert.equal( utils.hexToRgba( "#FFFFFF80", 0 ), "rgba(255,255,255,0.5)" );
    assert.equal( utils.hexToRgba( "#FFF8", 0 ), "rgba(255,255,255,0.53)" );
} );
