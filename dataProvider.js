Object.defineProperty( exports, "__esModule", { value: true } );
var vscode = require( 'vscode' );
var path = require( "path" );

var elements = [];

const PATH = "path";
const TODO = "todo";

class TodoDataProvider
{
    constructor( _context )
    {
        this._context = _context;

        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    getChildren( element )
    {
        if( !element )
        {
            if( elements.length > 0 )
            {
                return elements;
            }
            return [ { name: "Nothing found" }];
        }
        else if( element.type === PATH )
        {
            if( element.elements && element.elements.length > 0 )
            {
                return element.elements;
            }
            else
            {
                return element.todos;
            }
        }
        else if( element.type === TODO )
        {
            return element.text;
        }
    }

    getTreeItem( element )
    {
        let treeItem = new vscode.TreeItem( element.name );
        treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;

        if( element.type === PATH )
        {
            treeItem.collapsibleState = vscode.workspace.getConfiguration( 'todo-tree' ).expanded ?
                vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed;
        }
        else if( element.type === TODO )
        {
            treeItem.command = {
                command: "todo-tree.revealTodo",
                title: "",
                arguments: [
                    element.file,
                    element.line
                ]
            };
        }

        return treeItem;
    }

    clear()
    {
        elements = [];
        this._onDidChangeTreeData.fire();
    }

    remove( root, filename )
    {
        var removed = false;

        var fullPath = path.resolve( root, filename );
        var relativePath = path.relative( root, fullPath );
        var parts = relativePath.split( path.sep );

        function findSubPath( e )
        {
            return e.type === PATH && e.name === this;
        }

        var me = this;
        var pathElement;
        var parent = elements;
        parts.map( function( p, i )
        {
            var child = parent.find( findSubPath, p );
            if( !child || i === parts.length - 1 )
            {
                if( child )
                {
                    parent.splice( parent.indexOf( child ), 1 );
                    me._onDidChangeTreeData.fire( child );
                    removed = true;
                }
            }
            else
            {
                pathElement = child;
                parent = pathElement.elements;
            }
        } );

        return removed;
    }

    add( root, match )
    {
        var fullPath = path.resolve( root, match.file );
        var relativePath = path.relative( root, fullPath );
        var parts = relativePath.split( path.sep );

        function findSubPath( e )
        {
            return e.type === PATH && e.name === this;
        }

        var pathElement;
        var parent = elements;
        parts.map( function( p )
        {
            var child = parent.find( findSubPath, p );
            if( !child )
            {
                pathElement = {
                    type: PATH, name: p, elements: [], todos: []
                };
                parent.push( pathElement );
                parent = pathElement.elements;
            }
            else
            {
                pathElement = child;
                parent = pathElement.elements;
            }
        } );

        var todoElement = {
            type: TODO, name: match.match.substr( match.column - 1 ), line: match.line - 1, file: fullPath
        };

        pathElement.todos.push( todoElement );

        this._onDidChangeTreeData.fire();
    }

    refresh()
    {
        this._onDidChangeTreeData.fire();
    }
}
exports.TodoDataProvider = TodoDataProvider;
