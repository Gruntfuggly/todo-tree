/* jshint esversion:6 */

var vscode = require( 'vscode' );
var path = require( "path" );

var utils = require( './utils.js' );
var icons = require( './icons.js' );
var config = require( './config.js' );

var workspaceFolders;
var nodes = [];

const PATH = "path";
const TODO = "todo";

var buildCounter = 1;
var nodeCounter = 1;

var expandedNodes = {};

var isVisible = function( e )
{
    return e.visible === true;
};

var findTagNode = function( node )
{
    if( config.isRegexCaseSensitive() )
    {
        return node.type === PATH && node.tag === this.toString();
    }
    return node.type === PATH && node.tag && node.tag.toLowerCase() === this.toString().toLowerCase();
};

var findExactPath = function( node )
{
    return node.type === PATH && node.fsPath === this.toString();
};

var findPathNode = function( node )
{
    return node.type === PATH && node.pathElement === this.toString();
};

var findTodoNode = function( node )
{
    return node.name === this.label.toString() && node.line === this.line;
};

var sortByLabel = function( a, b )
{
    return a.label > b.label ? 1 : b.label > a.label ? -1 : a.line > b.line ? 1 : -1;
};

function createWorkspaceRootNode( folder )
{
    var id = ( buildCounter * 1000000 ) + nodeCounter++;
    return {
        isWorkspaceNode: true,
        type: PATH,
        label: folder.name,
        nodes: [],
        todos: [],
        fsPath: folder.uri.fsPath,
        id: id,
        visible: true
    };
}

function createPathNode( folder, pathElements )
{
    var id = ( buildCounter * 1000000 ) + nodeCounter++;
    var fsPath = pathElements.length > 0 ? path.join( folder, pathElements.join( path.sep ) ) : folder;

    return {
        type: PATH,
        fsPath: fsPath,
        pathElement: pathElements[ pathElements.length - 1 ],
        label: pathElements[ pathElements.length - 1 ],
        nodes: [],
        todos: [],
        id: id,
        visible: true
    };
}

function createFlatNode( fsPath, rootNode )
{
    var id = ( buildCounter * 1000000 ) + nodeCounter++;
    var pathLabel = path.dirname( rootNode === undefined ? fsPath : path.relative( rootNode.fsPath, fsPath ) );

    return {
        type: PATH,
        fsPath: fsPath,
        label: path.basename( fsPath ),
        pathLabel: pathLabel === '.' ? '' : '(' + pathLabel + ')',
        nodes: [],
        todos: [],
        id: id,
        visible: true
    };
}

function createTodoNode( result )
{
    var id = ( buildCounter * 1000000 ) + nodeCounter++;
    var label = utils.removeBlockComments( result.match.substr( result.column - 1 ), result.file );
    var extracted = utils.extractTag( label );

    return {
        type: TODO,
        fsPath: result.file,
        label: extracted.withoutTag ? extracted.withoutTag : "line " + result.line,
        tag: extracted.tag,
        line: result.line - 1,
        id: id,
        visible: true
    };
}

function locateWorkspaceNode( nodes, filename )
{
    var result;
    nodes.map( function( node )
    {
        if( node.isWorkspaceNode && filename.indexOf( node.fsPath ) === 0 )
        {
            result = node;
        }
    } );
    return result;
}

function locateFlatChildNode( rootNode, result, tag )
{
    var parentNodes = ( rootNode === undefined ? nodes : rootNode.nodes );
    if( config.shouldGroup() && tag )
    {
        var parentNode = parentNodes.find( findTagNode, tag );
        if( parentNode === undefined )
        {
            parentNode = createPathNode( rootNode ? rootNode.fsPath : JSON.stringify( result ), [ tag ] );
            parentNode.tag = tag;
            parentNodes.push( parentNode );
            parentNodes.sort( sortByLabel );
        }
        parentNodes = parentNode.nodes;
    }

    var childNode = parentNodes.find( findExactPath, result.file );
    if( childNode === undefined )
    {
        childNode = createFlatNode( result.file, rootNode );
        parentNodes.push( childNode );
        parentNodes.sort( sortByLabel );
    }

    return childNode;
}

function locateTreeChildNode( rootNode, pathElements, tag )
{
    var childNode;

    var parentNodes = rootNode.nodes;

    if( config.shouldGroup() && tag )
    {
        var parentNode = parentNodes.find( findTagNode, tag );
        if( parentNode === undefined )
        {
            parentNode = createPathNode( rootNode ? rootNode.fsPath : JSON.stringify( result ), [ tag ] );
            parentNode.tag = tag;
            parentNodes.push( parentNode );
            parentNodes.sort( sortByLabel );
        }
        parentNodes = parentNode.nodes;
    }

    pathElements.map( function( element, level )
    {
        childNode = parentNodes.find( findPathNode, element );
        if( childNode === undefined )
        {
            childNode = createPathNode( rootNode.fsPath, pathElements.slice( 0, level + 1 ) );
            parentNodes.push( childNode );
            parentNodes.sort( sortByLabel );
            parentNodes = childNode.nodes;
        }
        else
        {
            parentNodes = childNode.nodes;
        }
    } );

    return childNode;
}

function addWorkspaceFolders()
{
    if( workspaceFolders )
    {
        workspaceFolders.map( function( folder )
        {
            nodes.push( createWorkspaceRootNode( folder ) );
        } );
    }
}

class TreeNodeProvider
{
    constructor( _context )
    {
        this._context = _context;

        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;

        buildCounter = _context.workspaceState.get( 'buildCounter', 1 );
        expandedNodes = _context.workspaceState.get( 'expandedNodes', {} );
    }

    getChildren( node )
    {
        if( node === undefined )
        {
            var availableNodes = nodes.filter( function( node )
            {
                return node.nodes.length + node.todos.length > 0;
            } );
            var rootNodes = nodes.filter( isVisible );
            if( rootNodes.length > 0 )
            {
                if( config.shouldGroup() )
                {
                    rootNodes.sort( function( a, b )
                    {
                        return a.name > b.name;
                    } );
                }
                return rootNodes;
            }

            return [ { label: "Nothing found", empty: availableNodes.length === 0 } ];
        }
        else if( node.type === PATH )
        {
            if( node.nodes && node.nodes.length > 0 )
            {
                return node.nodes.filter( isVisible );
            }
            else
            {
                return node.todos.filter( isVisible );
            }
        }
        else if( node.type === TODO )
        {
            return node.text;
        }
    }

    getParent( node )
    {
        return node.parent;
    }

    getTreeItem( node )
    {
        var treeItem;
        try
        {
            treeItem = new vscode.TreeItem( node.label + ( node.pathLabel ? ( " " + node.pathLabel ) : "" ) );
        }
        catch( e )
        {
            console.log( "Failed to create tree item: " + e );
        }

        treeItem.id = node.id;
        treeItem.fsPath = node.fsPath;

        treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;

        if( node.fsPath )
        {
            treeItem.node = node;
            if( config.showBadges() && !node.tag )
            {
                treeItem.resourceUri = new vscode.Uri.file( node.fsPath );
            }

            treeItem.tooltip = node.fsPath;

            if( node.type === PATH )
            {
                if( expandedNodes[ node.fsPath ] !== undefined )
                {
                    treeItem.collapsibleState = ( expandedNodes[ node.fsPath ] === true ) ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed;
                }
                else
                {
                    treeItem.collapsibleState = config.shouldExpand() ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed;
                }

                if( node.isWorkspaceNode || node.tag )
                {
                    treeItem.iconPath = icons.getIcon( this._context, node.tag ? node.tag : node.label );
                }
                else if( node.nodes && node.nodes.length > 0 )
                {
                    treeItem.iconPath = vscode.ThemeIcon.Folder;
                }
                else
                {
                    treeItem.iconPath = vscode.ThemeIcon.File;
                }
            }
            else if( node.type === TODO )
            {
                treeItem.iconPath = icons.getIcon( this._context, node.tag ? node.tag : node.label );

                treeItem.command = {
                    command: "todo-tree.revealTodo",
                    title: "",
                    arguments: [
                        node.fsPath,
                        node.line
                    ]
                };
            }
        }

        return treeItem;
    }

    clear( folders )
    {
        nodes = [];

        workspaceFolders = folders;

        addWorkspaceFolders();

        this._onDidChangeTreeData.fire();
    }

    rebuild()
    {
        buildCounter = ( buildCounter + 1 ) % 100;
    }

    refresh()
    {
        this._onDidChangeTreeData.fire();
    }

    filter( text, children )
    {
        var matcher = new RegExp( text, config.showFilterCaseSensitive() ? "" : "i" );

        if( children === undefined )
        {
            children = nodes;
        }
        children.forEach( child =>
        {
            if( child.type === TODO )
            {
                var match = matcher.test( child.label );
                child.visible = !text || match;
            }
            else
            {
                if( child.nodes !== undefined )
                {
                    this.filter( text, child.nodes );
                }
                if( child.todos !== undefined )
                {
                    this.filter( text, child.todos );
                }
                var visibleNodes = child.nodes ? child.nodes.filter( isVisible ).length : 0;
                var visibleTodos = child.todos ? child.todos.filter( isVisible ).length : 0;
                child.visible = visibleNodes + visibleTodos > 0;
            }
        } );
    }

    clearFilter( children )
    {
        if( children === undefined )
        {
            children = nodes;
        }
        children.forEach( function( child )
        {
            child.visible = true;
            if( child.nodes !== undefined )
            {
                this.clearFilter( child.nodes );
            }
            if( child.todos !== undefined )
            {
                this.clearFilter( child.todos );
            }
        }, this );
    }

    add( result )
    {
        if( nodes.length === 0 )
        {
            addWorkspaceFolders();
        }

        var rootNode = locateWorkspaceNode( nodes, result.file );
        var todoNode = createTodoNode( result );

        var childNode;
        if( config.shouldFlatten() || rootNode === undefined )
        {
            childNode = locateFlatChildNode( rootNode, result, todoNode.tag );
        }
        else if( rootNode )
        {
            var relativePath = path.relative( rootNode.fsPath, result.file );
            var pathElements = [];
            if( relativePath !== "" )
            {
                pathElements = relativePath.split( path.sep );
            }
            childNode = locateTreeChildNode( rootNode, pathElements, todoNode.tag );
        }

        if( childNode.todos === undefined )
        {
            childNode.todos = [];
        }

        childNode.expanded = result.expanded;

        if( childNode.todos.find( findTodoNode, todoNode ) === undefined )
        {
            todoNode.parent = childNode;
            childNode.todos.push( todoNode );
        }
    }

    reset( filename, children )
    {
        if( children === undefined )
        {
            children = nodes;
        }
        children.forEach( function( child )
        {
            if( child.nodes !== undefined )
            {
                this.reset( filename, child.nodes );
            }
            if( child.fsPath === filename )
            {
                child.todos = [];
            }
        }, this );
    }

    remove( filename, children )
    {
        var root = children === undefined;
        if( children === undefined )
        {
            children = nodes;
        }
        children = children.filter( function( child )
        {
            if( child.nodes !== undefined )
            {
                child.nodes = this.remove( filename, child.nodes );
            }
            var shouldRemove = ( child.fsPath === filename ) || ( child.nodes.length + child.todos.length === 0 ) && child.isWorkspaceNode !== true;
            if( shouldRemove )
            {
                delete expandedNodes[ child.fsPath ];
                this._context.workspaceState.update( 'expandedNodes', expandedNodes );
            }
            return shouldRemove === false;
        }, this );
        if( root )
        {
            nodes = children;
        }
        return children;
    }

    getElement( filename, found, children )
    {
        if( children === undefined )
        {
            children = nodes;
        }
        children.forEach( function( child )
        {
            if( child.fsPath === filename )
            {
                found( child );
            }
            else if( child.nodes !== undefined )
            {
                return this.getElement( filename, found, child.nodes );
            }
        }, this );
    }

    setExpanded( path, expanded )
    {
        expandedNodes[ path ] = expanded;
        this._context.workspaceState.update( 'expandedNodes', expandedNodes );
    }

    clearExpansionState()
    {
        expandedNodes = {};
        this._context.workspaceState.update( 'expandedNodes', expandedNodes );
    }
}

exports.TreeNodeProvider = TreeNodeProvider;
