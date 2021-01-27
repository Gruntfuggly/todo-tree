var testConfig = {
    shouldGroupFlag: false,
    shouldBeCaseSensitive: false,
    regexSource: "($TAGS)",
    tagList: [ "TODO" ],
    subTagRegexString: "(^:\\s*)",
    globsList: [],
    useColourScheme: false,
    foregroundColours: [],
    backgroundColours: [],
};

testConfig.regex = function()
{
    return {
        tags: this.tagList,
        regex: this.regexSource,
        caseSensitive: this.shouldBeCaseSensitive
    };
};
testConfig.shouldGroup = function()
{
    return this.shouldGroupFlag;
};
testConfig.globs = function()
{
    return this.globsList;
};
testConfig.tags = function()
{
    return this.tagList;
};
testConfig.isRegexCaseSensitive = function()
{
    return this.shouldBeCaseSensitive;
};

testConfig.subTagRegex = function()
{
    return this.subTagRegexString;
};

testConfig.shouldUseColourScheme = function()
{
    return this.useColourScheme;
};
testConfig.defaultHighlight = function()
{
    return {};
};
testConfig.customHighlight = function()
{
    return [];
};
testConfig.foregroundColourScheme = function()
{
    return this.foregroundColours;
};
testConfig.backgroundColourScheme = function()
{
    return this.backgroundColours;
};

function getTestConfig()
{
    return Object.create( testConfig );
}

module.exports.getTestConfig = getTestConfig;