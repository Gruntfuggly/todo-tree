var vscode = require( 'vscode' );

var context;

function init( c )
{
    context = c;
}

function shouldGroup()
{
    return context.workspaceState.get( 'grouped', vscode.workspace.getConfiguration( 'todo-tree' ).get( 'grouped', false ) );
}

function shouldExpand()
{
    return context.workspaceState.get( 'expanded', vscode.workspace.getConfiguration( 'todo-tree' ).get( 'expanded', false ) );
}

function shouldFlatten()
{
    return context.workspaceState.get( 'flat', vscode.workspace.getConfiguration( 'todo-tree' ).get( 'flat', false ) );
}

function showFilterCaseSensitive()
{
    return vscode.workspace.getConfiguration( 'todo-tree' ).get( 'filterCaseSensitive', false );
}

function isRegexCaseSensitive()
{
    return vscode.workspace.getConfiguration( 'todo-tree' ).get( 'regexCaseSensitive', true );
}

function showBadges()
{
    return vscode.workspace.getConfiguration( 'todo-tree' ).get( 'showBadges', false );
}

module.exports.init = init;
module.exports.shouldGroup = shouldGroup;
module.exports.shouldExpand = shouldExpand;
module.exports.shouldFlatten = shouldFlatten;
module.exports.showFilterCaseSensitive = showFilterCaseSensitive;
module.exports.isRegexCaseSensitive = isRegexCaseSensitive;
module.exports.showBadges = showBadges;