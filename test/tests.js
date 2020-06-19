var os = require( 'os' );
var strftime = require( 'fast-strftime' );
var utils = require( '../utils.js' );
var stubs = require( './stubs.js' );

QUnit.test( "utils.isHexColour", function( assert )
{
    assert.ok( utils.isHexColour( {} ) === false );
    assert.ok( utils.isHexColour( [] ) === false );
    assert.ok( utils.isHexColour( undefined ) === false );
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

QUnit.test( "utils.extractTag removes colon from ${after}", function( assert )
{
    var testConfig = stubs.getTestConfig();
    utils.init( testConfig );

    result = utils.extractTag( "before TODO: after" );
    assert.equal( result.withoutTag, "after" );

    result = utils.extractTag( "before TODO : after" );
    assert.equal( result.withoutTag, "after" );

    result = utils.extractTag( "before TODO :after" );
    assert.equal( result.withoutTag, "after" );
    result = utils.formatLabel( "${tag}: ${after}", { actualTag: result.tag, after: result.withoutTag } );
    assert.equal( result, "TODO: after" );
} );

QUnit.test( "utils.extractTag returns text from the start of the line if the tag is on then end", function( assert )
{
    var testConfig = stubs.getTestConfig();
    utils.init( testConfig );

    result = utils.extractTag( "before TODO" );
    assert.equal( result.withoutTag, "before" );
    assert.equal( result.before, "before" );
    assert.equal( result.after, "" );
} );

QUnit.test( "utils.extractTag returns text from before and after the tag", function( assert )
{
    var testConfig = stubs.getTestConfig();
    utils.init( testConfig );

    result = utils.extractTag( "                before = text; // TODO stuff  ", 32 );
    assert.equal( result.withoutTag, "stuff" );
    assert.equal( result.before, "before = text;" );
    assert.equal( result.after, "stuff" );
} );

QUnit.test( "utils.extractTag copes with escaped regex characters", function( assert )
{
    var testConfig = stubs.getTestConfig();
    testConfig.tagList = [
        "TO\\DO",
    ];
    utils.init( testConfig );

    result = utils.extractTag( "before TO\\DO" );
    assert.equal( result.tag, "TO\\DO" );
} );

QUnit.test( "utils.extractTag returns entire text if $TAGS is not found in regex", function( assert )
{
    var testConfig = stubs.getTestConfig();
    testConfig.regexSource = "";
    utils.init( testConfig );

    result = utils.extractTag( "                before = text; // TODO stuff  ", 1 );
    assert.equal( result.withoutTag, "                before = text; // TODO stuff  " );
    assert.equal( result.before, "                before = text; // TODO stuff  " );
    assert.equal( result.after, "                before = text; // TODO stuff  " );
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
    testConfig.tagList = [ "TWO", "ONE" ];
    utils.init( testConfig );

    assert.equal( utils.getRegexSource(), "(TWO|ONE)" );

    testConfig.regexSource = "($TAGS)-($TAGS)";
    utils.init( testConfig );

    assert.equal( utils.getRegexSource(), "(TWO|ONE)-(TWO|ONE)" );
} );

QUnit.test( "utils.getRegexSource returns the regex source and escapes backslashes", function( assert )
{
    var testConfig = stubs.getTestConfig();
    testConfig.tagList = [ "\\TWO", "ONE\\" ];
    utils.init( testConfig );

    assert.equal( utils.getRegexSource(), "(\\\\\\TWO|ONE\\\\\\)" );
} );

QUnit.test( "utils.getRegexSource sorts the tags in reverse order to allow more specific tags to be found first", function( assert )
{
    var testConfig = stubs.getTestConfig();
    testConfig.tagList = [ "FIXME", "TODO", "TODO(API)" ];
    utils.init( testConfig );

    assert.equal( utils.getRegexSource(), "(TODO\\(API\\)|TODO|FIXME)" );
} );

QUnit.test( "utils.getRegexSource returns the regex source and escapes other regex characters", function( assert )
{
    var testConfig = stubs.getTestConfig();
    testConfig.tagList = [
        "A|B", "A{B", "A^B", "A[B", "A?B", "A.B", "A+B", "A*B", "A)B", "A(B", "A$B",
    ];

    utils.init( testConfig );

    assert.equal( utils.getRegexSource(), "(A\\|B|A\\{B|A\\^B|A\\[B|A\\?B|A\\.B|A\\+B|A\\*B|A\\)B|A\\(B|A\\$B)" );
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
    assert.equal( utils.formatLabel( "Label ${tag} content", { actualTag: "TODO" } ), "Label TODO content" );
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

QUnit.test( "utils.formatLabel replaces filepath placeholder", function( assert )
{
    assert.equal( utils.formatLabel( "Label ${filepath} content", { fsPath: "/path/to/filename.txt" } ), "Label /path/to/filename.txt content" );
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

QUnit.test( "utils.createFolderGlob creates expected globs", function( assert )
{
    if( process.platform === 'win32' )
    {
        assert.equal( utils.createFolderGlob( "c:\\Users\\name\\workspace\\project\\folder\\subfolder", "c:\\Users\\name\\workspace\\project", "/**/*" ), "**/project/folder/subfolder/**/*" );
        assert.equal( utils.createFolderGlob( "c:\\Users\\name\\workspace\\project\\folder\\subfolder", "c:\\Users\\name\\workspace\\project", "/**//*" ), "**/project/folder/subfolder/**/*" );
        assert.equal( utils.createFolderGlob( "c:\\folder", "c:\\", "/**/*" ), "**/folder/**/*" );
    }
    else
    {
        assert.equal( utils.createFolderGlob( "/Users/name/workspace/project/folder/subfolder", "/Users/name/workspace/project", "/**/*" ), "/Users/name/workspace/project/folder/subfolder/**/*" );
        assert.equal( utils.createFolderGlob( "/Users/name/workspace/project/folder/subfolder", "/Users/name/workspace/project", "/**//*" ), "/Users/name/workspace/project/folder/subfolder/**/*" );
    }
} );

QUnit.test( "utils.removeBlockComments supports jsonc", function( assert )
{
    assert.equal( utils.removeBlockComments( "/* a */", "x.jsonc" ), " a " );
} );

QUnit.test( "utils.isHidden", function( assert )
{
    assert.equal( utils.isHidden( "test.txt" ), false );
    assert.equal( utils.isHidden( "test" ), false );
    assert.equal( utils.isHidden( ".test" ), true );
} );

QUnit.test( "utils.formatExportPath inserts date and time fields", function( assert )
{
    var expectedDateTime = strftime( "%F-%T", new Date( 1307472705067 ) );
    assert.equal( utils.formatExportPath( "todo-tree-%F-%T", new Date( 1307472705067 ) ), "todo-tree-" + expectedDateTime );
    expectedDateTime = strftime( "%Y%m%d-%H%M", new Date( 1307472705067 ) );
    assert.equal( utils.formatExportPath( "todo-tree-%Y%m%d-%H%M-export", new Date( 1307472705067 ) ), "todo-tree-" + expectedDateTime + "-export" );
} );

QUnit.test( "utils.expandTilde replaces tilde with home folder", function( assert )
{
    var homeFolder = os.homedir();
    assert.equal( utils.expandTilde( "~/" ), homeFolder + "/" );
} );

QUnit.test( "utils.formatExportPath expands tilde", function( assert )
{
    var homeFolder = os.homedir();
    var expectedDateTime = strftime( "%A", new Date( 1307472705067 ) );
    assert.equal( utils.formatExportPath( "~/todo-tree-%A", new Date( 1307472705067 ) ), homeFolder + "/todo-tree-" + expectedDateTime );
} );

QUnit.test( "utils.replaceEnvironmentVariables", function( assert )
{
    assert.equal( utils.replaceEnvironmentVariables( "cod, ${FISH}, halibut, ${FISH}" ), "cod, , halibut, " );
    process.env[ 'FISH' ] = 'turbot';
    assert.equal( utils.replaceEnvironmentVariables( "cod, ${FISH}, halibut, ${FISH}" ), "cod, turbot, halibut, turbot" );
} );