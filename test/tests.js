var os = require( 'os' );
var strftime = require( 'fast-strftime' );
var utils = require( '../src/utils.js' );
var attributes = require( '../src/attributes.js' );
var stubs = require( './stubs.js' );
var searchResults = require( '../src/searchResults.js' );

QUnit.test( "utils.isHexColour", function( assert )
{
    assert.ok( utils.isHexColour( {} ) === false );
    assert.ok( utils.isHexColour( [] ) === false );
    assert.ok( utils.isHexColour( undefined ) === false );
    assert.ok( utils.isHexColour( "" ) === false );
    assert.ok( utils.isHexColour( "red" ) === false );
    assert.ok( utils.isHexColour( "ff0000" ) === true );
    assert.ok( utils.isHexColour( "fff" ) === true );
    assert.ok( utils.isHexColour( "f" ) === false );
    assert.ok( utils.isHexColour( "ff" ) === false );
    assert.ok( utils.isHexColour( "fff8" ) === true );
    assert.ok( utils.isHexColour( "fff88" ) === false );
    assert.ok( utils.isHexColour( "fff8884" ) === false );
    assert.ok( utils.isHexColour( "fff88844" ) === true );
} );

QUnit.test( "utils.isHexColour strips non RGB values", function( assert )
{
    assert.ok( utils.isHexColour( "#ff00ff" ) === true );
    assert.ok( utils.isHexColour( "#0ff" ) === true );
    assert.ok( utils.isHexColour( "bedding" ) === false );
    assert.ok( utils.isHexColour( "inbed" ) === false );
    assert.ok( utils.isHexColour( "magenta" ) === false );
    assert.ok( utils.isHexColour( "#bed" ) === true );
    assert.ok( utils.isHexColour( "faced" ) === false );
    assert.ok( utils.isHexColour( "ace" ) === true );
} );

QUnit.test( "utils.isRgbColour", function( assert )
{
    assert.ok( utils.isRgbColour( "" ) == false );
    assert.ok( utils.isRgbColour( "rgb(0,0,0)" ) == true );
    assert.ok( utils.isRgbColour( "rgba(0,0,0)" ) == true );
    assert.ok( utils.isRgbColour( "rgb(255,255,255)" ) == true );
    assert.ok( utils.isRgbColour( "rgb(x,0,0)" ) == false );
    assert.ok( utils.isRgbColour( "rgba(0,0,0,0.5)" ) == true );
    assert.ok( utils.isRgbColour( "rgba(0, 0, 0, 0.5)" ) == true );
    assert.ok( utils.isRgbColour( "rgba(0,0.5,0,0.5)" ) == false );
    assert.ok( utils.isRgbColour( "rgxba(0,0,0,0.5)" ) == false );
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
    assert.equal( utils.removeBlockComments( "{- a -}", "x.hs" ), " a " );
    assert.equal( utils.removeBlockComments( "{- a\nb -}", "x.hs" ), " a\nb " );
} );

QUnit.test( "utils.extractTag removes everything including tag", function( assert )
{
    var testConfig = stubs.getTestConfig();
    testConfig.shouldGroupByTagFlag = true;
    utils.init( testConfig );

    var result = utils.extractTag( "before TODO after" );
    assert.equal( result.tag, "TODO" );
    assert.equal( result.withoutTag, "after" );
} );

QUnit.test( "utils.extractTag can be case sensitive", function( assert )
{
    var testConfig = stubs.getTestConfig();
    testConfig.shouldGroupByTagFlag = true;
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
    testConfig.shouldGroupByTagFlag = true;
    utils.init( testConfig );

    var result = utils.extractTag( "before todo after" );
    assert.equal( result.tag, "TODO" );
    assert.equal( result.withoutTag, "after" );
} );

QUnit.test( "utils.extractTag returns the tag offset", function( assert )
{
    var testConfig = stubs.getTestConfig();
    testConfig.shouldGroupByTagFlag = true;
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

QUnit.test( "utils.extractTag removes custom regex from ${after}", function( assert )
{
    var testConfig = stubs.getTestConfig();
    testConfig.subTagRegexString = "(^--\\s*)";
    utils.init( testConfig );

    result = utils.extractTag( "before TODO-- after" );
    assert.equal( result.withoutTag, "after" );

    result = utils.extractTag( "before TODO -- after" );
    assert.equal( result.withoutTag, "after" );

    result = utils.extractTag( "before TODO --after" );
    assert.equal( result.withoutTag, "after" );
    result = utils.formatLabel( "${tag}-- ${after}", { actualTag: result.tag, after: result.withoutTag } );
    assert.equal( result, "TODO-- after" );
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

QUnit.test( "utils.extractTag returns entire text if regex is empty", function( assert )
{
    var testConfig = stubs.getTestConfig();
    testConfig.regexSource = "";
    utils.init( testConfig );

    result = utils.extractTag( "                before = text; // TODO stuff  ", 1 );
    assert.equal( result.withoutTag, "                before = text; // TODO stuff  " );
    assert.equal( result.before, "                before = text; // TODO stuff  " );
    assert.equal( result.after, "                before = text; // TODO stuff  " );
} );

QUnit.test( "utils.extractTag returns expected result if regex does not contain $TAGS", function( assert )
{
    var testConfig = stubs.getTestConfig();
    testConfig.regexSource = "// TODO";
    utils.init( testConfig );

    result = utils.extractTag( "                before = text; // TODO stuff  ", 1 );
    assert.equal( result.withoutTag, " stuff  " );
    assert.equal( result.before, "                before = text; " );
    assert.equal( result.after, " stuff  " );
} );

QUnit.test( "utils.extractTag can extract sub tag", function( assert )
{
    var testConfig = stubs.getTestConfig();
    testConfig.subTagRegexString = ".*\\((.*)\\).*";
    utils.init( testConfig );

    result = utils.extractTag( "before TODO (email@place.com) after" );
    assert.equal( result.subTag, "email@place.com" );
} );

QUnit.test( "utils.extractTag works with multiline", function( assert )
{
    var testConfig = stubs.getTestConfig();
    utils.init( testConfig );

    var result = utils.extractTag( "before\nTODO\nafter" );
    assert.equal( result.tag, "TODO" );
    assert.equal( result.withoutTag, "after" );
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
    var unexpectedPlaceholders = [];
    assert.equal( utils.formatLabel( "Label ${line} content", { line: 23 }, unexpectedPlaceholders ), "Label 24 content" ); // line is zero based
    assert.equal( unexpectedPlaceholders.length, 0 );
} );

QUnit.test( "utils.formatLabel replaces column number placeholder", function( assert )
{
    var unexpectedPlaceholders = [];
    assert.equal( utils.formatLabel( "Label ${column} content", { column: 78 }, unexpectedPlaceholders ), "Label 78 content" );
    assert.equal( unexpectedPlaceholders.length, 0 );
} );

QUnit.test( "utils.formatLabel replaces before text placeholder", function( assert )
{
    var unexpectedPlaceholders = [];
    assert.equal( utils.formatLabel( "Label ${before} content", { before: "text before tag" }, unexpectedPlaceholders ), "Label text before tag content" );
    assert.equal( unexpectedPlaceholders.length, 0 );
} );

QUnit.test( "utils.formatLabel replaces tag placeholders", function( assert )
{
    var unexpectedPlaceholders = [];
    assert.equal( utils.formatLabel( "Label ${tag} content", { actualTag: "Todo" }, unexpectedPlaceholders ), "Label Todo content" );
    assert.equal( utils.formatLabel( "Label ${tag:uppercase} content", { actualTag: "todo" }, unexpectedPlaceholders ), "Label TODO content" );
    assert.equal( utils.formatLabel( "Label ${tag:lowercase} content", { actualTag: "TODO" }, unexpectedPlaceholders ), "Label todo content" );
    assert.equal( utils.formatLabel( "Label ${tag:capitalize} content", { actualTag: "todo" }, unexpectedPlaceholders ), "Label Todo content" );
    assert.equal( unexpectedPlaceholders.length, 0 );
} );

QUnit.test( "utils.formatLabel replaces sub tag placeholders", function( assert )
{
    var unexpectedPlaceholders = [];
    assert.equal( utils.formatLabel( "Label ${subTag} content", { subTag: "name@mail.com" }, unexpectedPlaceholders ), "Label name@mail.com content" );
    assert.equal( utils.formatLabel( "Label ${subtag} content", { subTag: "Name@mail.com" }, unexpectedPlaceholders ), "Label Name@mail.com content" );
    assert.equal( utils.formatLabel( "Label ${subtag:uppercase} content", { subTag: "example" }, unexpectedPlaceholders ), "Label EXAMPLE content" );
    assert.equal( utils.formatLabel( "Label ${subtag:lowercase} content", { subTag: "EXAMPLE" }, unexpectedPlaceholders ), "Label example content" );
    assert.equal( utils.formatLabel( "Label ${subtag:capitalize} content", { subTag: "example" }, unexpectedPlaceholders ), "Label Example content" );
    assert.equal( unexpectedPlaceholders.length, 0 );
} );

QUnit.test( "utils.formatLabel replaces after text placeholder", function( assert )
{
    var unexpectedPlaceholders = [];
    assert.equal( utils.formatLabel( "Label ${after} content", { after: "text after tag" }, unexpectedPlaceholders ), "Label text after tag content" );
    assert.equal( unexpectedPlaceholders.length, 0 );
} );

QUnit.test( "utils.formatLabel replaces before text placeholder", function( assert )
{
    var unexpectedPlaceholders = [];
    assert.equal( utils.formatLabel( "Label ${before} content", { before: "text before tag" }, unexpectedPlaceholders ), "Label text before tag content" );
    assert.equal( unexpectedPlaceholders.length, 0 );
} );

QUnit.test( "utils.formatLabel replaces filename placeholder", function( assert )
{
    var unexpectedPlaceholders = [];
    assert.equal( utils.formatLabel( "Label ${filename} content", { fsPath: "/path/to/filename.txt" }, unexpectedPlaceholders ), "Label filename.txt content" );
    assert.equal( unexpectedPlaceholders.length, 0 );
} );

QUnit.test( "utils.formatLabel replaces filepath placeholder", function( assert )
{
    var unexpectedPlaceholders = [];
    assert.equal( utils.formatLabel( "Label ${filepath} content", { fsPath: "/path/to/filename.txt" }, unexpectedPlaceholders ), "Label /path/to/filename.txt content" );
    assert.equal( unexpectedPlaceholders.length, 0 );
} );

QUnit.test( "utils.formatLabel doesn't report errors if fileName or filePath is undefined", function( assert )
{
    var unexpectedPlaceholders = [];
    assert.equal( utils.formatLabel( "Label ${filepath} content", {}, unexpectedPlaceholders ), "Label  content" );
    assert.equal( unexpectedPlaceholders.length, 0 );
    assert.equal( utils.formatLabel( "Label ${filename} content", {}, unexpectedPlaceholders ), "Label  content" );
    assert.equal( unexpectedPlaceholders.length, 0 );
} );

QUnit.test( "utils.formatLabel reports unexpectedPlaceholders for unexpected placeholders", function( assert )
{
    var unexpectedPlaceholders = [];
    assert.equal( utils.formatLabel( "Label ${unknown} content", {}, unexpectedPlaceholders ), "Label ${unknown} content" );
    assert.equal( unexpectedPlaceholders.length, 1 );
    assert.equal( unexpectedPlaceholders[ 0 ], "${unknown}" );
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
    assert.equal( utils.isHidden( "/folder.with.dots/test" ), false );
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
    process.env.FISH = 'turbot';
    assert.equal( utils.replaceEnvironmentVariables( "cod, ${FISH}, halibut, ${FISH}" ), "cod, turbot, halibut, turbot" );
} );

QUnit.test( "utils.complementaryColour", function( assert )
{
    assert.equal( utils.complementaryColour( "#ffffff" ), "#000000" );
    assert.equal( utils.complementaryColour( "#ffff00" ), "#000000" );
    assert.equal( utils.complementaryColour( "#ff0000" ), "#000000" );
    assert.equal( utils.complementaryColour( "#000000" ), "#ffffff" );
    assert.equal( utils.complementaryColour( "#00ffff" ), "#000000" );
    assert.equal( utils.complementaryColour( "#0000ff" ), "#ffffff" );
} );

QUnit.test( "utils.isValidColour", function( assert )
{
    assert.ok( utils.isValidColour( "red" ) );
    assert.ok( utils.isValidColour( "chartreuse" ) );
    assert.ok( utils.isValidColour( "Chartreuse" ) );
    assert.ok( utils.isValidColour( "#ffffff" ) );
    assert.ok( utils.isValidColour( "ffffff" ) );
    assert.ok( utils.isValidColour( "rgb(0,0,0)" ) );
    assert.ok( utils.isValidColour( "editor.foreground" ) );
    assert.notOk( utils.isValidColour( "skybluepink" ) );
    assert.notOk( utils.isValidColour( "gggggg" ) );
    assert.notOk( utils.isValidColour( "some.theme.colour" ) );
    assert.notOk( utils.isValidColour( "rgb(0,0,0" ) );
    assert.notOk( utils.isValidColour( "" ) );
} );

QUnit.test( "utils.setRgbAlpha", function( assert )
{
    assert.equal( utils.setRgbAlpha( "fail", 0.5 ), "fail" );
    assert.equal( utils.setRgbAlpha( "rgb(0,0,0)", 0.5 ), "rgba(0,0,0,0.5)" );
    assert.equal( utils.setRgbAlpha( "rgba(0,0,0,1.0)", 0.5 ), "rgba(0,0,0,0.5)" );
} );

QUnit.test( "attributes.getForeground uses colour scheme", function( assert )
{
    var testConfig = stubs.getTestConfig();
    testConfig.useColourScheme = true;
    testConfig.tagList = [
        "FIXME",
        "TODO",
        "BUG"
    ];
    testConfig.foregroundColours = [ "red", "green" ];
    attributes.init( testConfig );

    assert.equal( attributes.getForeground( "FIXME" ), "red" );
    assert.equal( attributes.getForeground( "TODO" ), "green" );
    assert.equal( attributes.getForeground( "BUG" ), "red" );
} );

QUnit.test( "attributes.getBackground uses colour scheme", function( assert )
{
    var testConfig = stubs.getTestConfig();
    testConfig.useColourScheme = true;
    testConfig.tagList = [
        "FIXME",
        "TODO",
        "BUG"
    ];
    testConfig.backgroundColours = [ "white", "#000" ];
    attributes.init( testConfig );

    assert.equal( attributes.getBackground( "FIXME" ), "white" );
    assert.equal( attributes.getBackground( "TODO" ), "#000" );
    assert.equal( attributes.getBackground( "BUG" ), "white" );
} );

QUnit.test( "utils.formatLabel replaces afterOrBefore tag", function( assert )
{
    var unexpectedPlaceholders = [];
    assert.equal( utils.formatLabel( "${afterOrBefore}", { after: "xxx", before: "yyy" }, unexpectedPlaceholders ), "xxx" );
    assert.equal( utils.formatLabel( "${afterOrBefore}", { after: "", before: "yyy" }, unexpectedPlaceholders ), "yyy" );
    assert.equal( unexpectedPlaceholders.length, 0 );
} );

QUnit.test( "utils.isCodicon", function( assert )
{
    assert.equal( utils.isCodicon( "$(beaker)" ), true );
    assert.equal( utils.isCodicon( "  $(beaker)" ), true );
    assert.equal( utils.isCodicon( "beaker" ), false );
} );

QUnit.test( "searchResults can be added and removed", function( assert )
{
    searchResults.add( { uri: "uri" } );
    assert.equal( searchResults.count(), 1 );
    searchResults.remove( "uri" );
    assert.equal( searchResults.count(), 0 );
} );

QUnit.test( "searchResults can be cleared", function( assert )
{
    searchResults.add( { uri: "uri1" } );
    searchResults.add( { uri: "uri2" } );
    assert.equal( searchResults.count(), 2 );
    searchResults.clear();
    assert.equal( searchResults.count(), 0 );
} );
