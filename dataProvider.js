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
            return elements;
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

        if( element.type === PATH )
        {
            treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        }
        else if( element.type === TODO )
        {
            treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;
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

    add( root, match )
    {
        var parts = match.file.split(path.sep);

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
console.log("Creating path element:" + p );
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
            type: TODO, name: match.match.substr( match.column - 1 ), line: match.line - 1, file: path.join( root, match.file )
        };

        pathElement.todos.push( todoElement );

        this._onDidChangeTreeData.fire();
    }

    refresh( html )
    {
        this._onDidChangeTreeData.fire();
    }
}
exports.TodoDataProvider = TodoDataProvider;
