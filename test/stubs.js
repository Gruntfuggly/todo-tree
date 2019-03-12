var testConfig = {
    shouldGroupFlag: false,
    shouldBeCaseSensitive: false,
    regexSource: "($TAGS)",
    tagList: [ "TODO" ],
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
testConfig.tags = function()
{
    return this.tagList;
}

function getTestConfig()
{
    return Object.create( testConfig );
}

module.exports.getTestConfig = getTestConfig;