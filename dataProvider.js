/* jshint esversion:6 */

Object.defineProperty( exports, "__esModule", { value: true } );

var vscode = require( 'vscode' );
var path = require( "path" );
var fs = require( 'fs' );
var commentPatterns = require( 'comment-patterns' );
var octicons = require( 'octicons' );

var elements = [];

const PATH = "path";
const TODO = "todo";

var defaultColours = [ "red", "green", "blue", "yellow", "magenta", "cyan", "grey" ];

var buildCounter = 1;
var usedHashes = {};

function hash( text )
{
    var hash = 0;
    if( text.length === 0 )
    {
        return hash;
    }
    for( var i = 0; i < text.length; i++ )
    {
        var char = text.charCodeAt( i );
        hash = ( ( hash << 5 ) - hash ) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    hash = Math.abs( hash ) % 1000000;

    while( usedHashes[ hash ] !== undefined )
    {
        hash++;
    }

    usedHashes[ hash ] = true;

    return hash;
}

class TodoDataProvider
{
    constructor( _context, defaultRootFolder )
    {
        this._context = _context;
        this.defaultRootFolder = defaultRootFolder;

        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    getChildren( element )
    {
        if( !element )
        {
            var roots = elements.filter( e => e.visible );
            if( roots.length > 0 )
            {
                return roots;
            }
            return [ { name: "Nothing found" } ];
        }
        else if( element.type === PATH )
        {
            if( element.elements && element.elements.length > 0 )
            {
                return element.elements.filter( e => e.visible );
            }
            else
            {
                return element.todos.filter( e => e.visible );
            }
        }
        else if( element.type === TODO )
        {
            return element.text;
        }
    }

    getTodoIcon( text )
    {
        function isHexColour( text )
        {
            return ( typeof text === "string" ) && ( text.length === 3 || text.length === 6 ) && !isNaN( parseInt( text, 16 ) );
        }

        var colourMappings = vscode.workspace.getConfiguration( 'todo-tree' ).iconColours;

        var colour = colourMappings[ text ] || "";

        if( colour === "" )
        {
            Object.keys( colourMappings ).forEach( mapping =>
            {
                if( text.match( mapping ) )
                {
                    colour = colourMappings[ mapping ];
                }
            } );
        }

        if( colour === "" )
        {
            colour = vscode.workspace.getConfiguration( 'todo-tree' ).iconColour;
        }

        var darkIconPath;
        var lightIconPath;

        var colourName = isHexColour( colour.substr( 1 ) ) ? colour.substr( 1 ) : colour;

        var icons = vscode.workspace.getConfiguration( 'todo-tree' ).icons;
        if( icons[ text ] )
        {
            var iconName = icons[ text ];
            if( !octicons[ iconName ] )
            {
                iconName = "check";
            }

            var iconPath = path.join( this._context.storagePath, "todo-" + iconName + "-" + colourName + ".svg" );
            if( !fs.existsSync( iconPath ) )
            {
                if( !fs.existsSync( this._context.storagePath ) )
                {
                    fs.mkdirSync( this._context.storagePath );
                }

                var content = "<?xml version=\"1.0\" encoding=\"iso-8859-1\"?>\n" +
                    octicons[ iconName ].toSVG( { "xmlns": "http://www.w3.org/2000/svg", "fill": colour } );

                fs.writeFileSync( iconPath, content );
            }

            darkIconPath = iconPath;
            lightIconPath = iconPath;
        }
        else if( isHexColour( colour.substr( 1 ) ) )
        {
            var iconPath = path.join( this._context.storagePath, "todo-" + colourName + ".svg" );
            if( !fs.existsSync( iconPath ) )
            {
                if( !fs.existsSync( this._context.storagePath ) )
                {
                    fs.mkdirSync( this._context.storagePath );
                }

                var content =
                    "<?xml version=\"1.0\" encoding=\"iso-8859-1\"?>" +
                    "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"" +
                    "\tviewBox=\"0 0 426.667 426.667\" style=\"enable-background:new 0 0 426.667 426.667;\" xml:space=\"preserve\">" +
                    "<path style=\"fill:" + colour + ";\" d=\"M213.333,0C95.518,0,0,95.514,0,213.333s95.518,213.333,213.333,213.333" +
                    "\tc117.828,0,213.333-95.514,213.333-213.333S331.157,0,213.333,0z M174.199,322.918l-93.935-93.931l31.309-31.309l62.626,62.622" +
                    "\tl140.894-140.898l31.309,31.309L174.199,322.918z\"/>" +
                    "</svg>";

                fs.writeFileSync( iconPath, content );
            }

            darkIconPath = iconPath;
            lightIconPath = iconPath;
        }
        else if( defaultColours.indexOf( colour ) > -1 )
        {
            darkIconPath = this._context.asAbsolutePath( path.join( "resources/icons", "dark", "todo-" + colour + ".svg" ) );
            lightIconPath = this._context.asAbsolutePath( path.join( "resources/icons", "light", "todo-" + colour + ".svg" ) );
        }
        else
        {
            darkIconPath = this._context.asAbsolutePath( path.join( "resources/icons", "dark", "todo-green.svg" ) );
            lightIconPath = this._context.asAbsolutePath( path.join( "resources/icons", "light", "todo-green.svg" ) );
        }

        var icon = {
            dark: darkIconPath,
            light: lightIconPath
        };

        return icon;
    }

    getTreeItem( element )
    {
        let treeItem = new vscode.TreeItem( element.name + ( element.pathLabel ? element.pathLabel : "" ) );

        treeItem.id = element.id;

        treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;

        if( element.file )
        {
            treeItem.resourceUri = new vscode.Uri.file( element.file );
            treeItem.tooltip = element.file;

            if( element.type === PATH )
            {
                treeItem.collapsibleState = vscode.workspace.getConfiguration( 'todo-tree' ).expanded ?
                    vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed;

                if( element.isRootTag )
                {
                    treeItem.iconPath = this.getTodoIcon( element.tag ? element.tag : element.name );
                }
                else if( element.elements && element.elements.length > 0 )
                {
                    treeItem.iconPath = vscode.ThemeIcon.Folder;
                }
                else
                {
                    treeItem.iconPath = vscode.ThemeIcon.File;
                }
            }
            else if( element.type === TODO )
            {
                treeItem.iconPath = this.getTodoIcon( element.tag ? element.tag : element.name );

                treeItem.command = {
                    command: "todo-tree.revealTodo",
                    title: "",
                    arguments: [
                        element.file,
                        element.line
                    ]
                };
            }
        }

        return treeItem;
    }

    clear()
    {
        usedHashes = {};
        elements = [];
    }

    add( rootFolder, match, tagRegex )
    {
        function getRootTagElement( tag )
        {
            var findRootTag = function( e )
            {
                return e.name === this;
            };
            child = elements.find( findRootTag, tag );
            if( child === undefined )
            {
                child = {
                    isRootTag: true,
                    type: PATH,
                    name: tag,
                    tag: tag,
                    visible: true,
                    elements: [],
                    todos: [],
                    file: fullPath,
                    id: ( buildCounter * 1000000 ) + hash( tag + fullPath ),
                };
                elements.push( child );
            }
            return child;
        }

        var fullPath = path.resolve( rootFolder, match.file );
        var relativePath = path.relative( rootFolder, fullPath );
        var parts = relativePath.split( path.sep );

        var pathElement;
        var name = match.match.substr( match.column - 1 );

        var commentPattern;
        try
        {
            commentPattern = commentPatterns( match.file );
        }
        catch( e )
        {
        }

        if( commentPattern && commentPattern.multiLineComment && commentPattern.multiLineComment.length > 0 )
        {
            commentPattern = commentPatterns.regex( match.file );
            if( commentPattern && commentPattern.regex )
            {
                var commentMatch = commentPattern.regex.exec( name );
                if( commentMatch )
                {
                    for( var i = commentPattern.cg.contentStart; i < commentMatch.length; ++i )
                    {
                        if( commentMatch[ i ] )
                        {
                            name = commentMatch[ i ];
                            break;
                        }
                    }
                }
            }
        }
        var tagMatch;
        if( tagRegex )
        {
            tagMatch = tagRegex.exec( name );
            if( tagMatch )
            {
                name = name.substr( tagMatch.index );
                if( vscode.workspace.getConfiguration( 'todo-tree' ).grouped )
                {
                    name = name.substr( tagMatch[ 0 ].length );
                }
            }
        }

        var todoElement = {
            type: TODO,
            name: name,
            line: match.line - 1,
            file: fullPath,
            id: ( buildCounter * 1000000 ) + hash( JSON.stringify( match ) ),
            visible: true
        };

        if( tagMatch )
        {
            todoElement.tag = tagMatch[ 0 ];
        }

        var flat =
            relativePath.startsWith( ".." ) ||
            rootFolder === this.defaultRootFolder ||
            vscode.workspace.getConfiguration( 'todo-tree' ).flat;

        if( flat )
        {
            var findExactPath = function( e )
            {
                return e.type === PATH && e.file === this;
            };

            var parent;
            if( vscode.workspace.getConfiguration( 'todo-tree' ).grouped && todoElement.tag )
            {
                parent = getRootTagElement( todoElement.tag ).elements;
            }
            else
            {
                parent = elements;
            }
            var child = parent.find( findExactPath, fullPath );

            if( !child )
            {
                var folder = relativePath.startsWith( '..' ) ? path.dirname( fullPath ) : path.dirname( relativePath );
                var pathLabel = ( folder === "." ) ? "" : " (" + folder + ")";
                pathElement = {
                    type: PATH,
                    file: fullPath,
                    name: path.basename( fullPath ),
                    pathLabel: pathLabel,
                    path: relativePath,
                    elements: [],
                    todos: [],
                    id: ( buildCounter * 1000000 ) + hash( fullPath ),
                    visible: true
                };

                parent.push( pathElement );
            }
            else
            {
                pathElement = child;
            }
        }
        else
        {
            var findSubPath = function( e )
            {
                return e.pathLabel === undefined && e.type === PATH && e.name === this;
            };

            var parent;
            if( vscode.workspace.getConfiguration( 'todo-tree' ).grouped && todoElement.tag )
            {
                parent = getRootTagElement( todoElement.tag ).elements;
            }
            else
            {
                parent = elements;
            }
            parts.map( function( p, level )
            {
                var child = parent.find( findSubPath, p );
                if( !child )
                {
                    var subPath = path.join( rootFolder, parts.slice( 0, level + 1 ).join( path.sep ) );
                    pathElement = {
                        type: PATH,
                        file: subPath,
                        name: p,
                        parent: pathElement,
                        elements: [],
                        todos: [],
                        id: ( buildCounter * 1000000 ) + hash( subPath ),
                        visible: true
                    };
                    parent.push( pathElement );
                }
                else
                {
                    pathElement = child;
                }
                parent = pathElement.elements;
            } );
        }

        if( !pathElement.todos.find( element => { return element.name === todoElement.name && element.line === todoElement.line; } ) )
        {
            pathElement.todos.push( todoElement );
        }
    }

    rebuild()
    {
        usedHashes = {};
        buildCounter = ( buildCounter + 1 ) % 100;
    }

    refresh( setViewVisibility )
    {
        this._onDidChangeTreeData.fire();
        if( setViewVisibility === true )
        {
            vscode.commands.executeCommand( 'setContext', 'todo-tree-has-content', elements.length > 0 );
        }
    }

    filter( text, children )
    {
        var matcher = new RegExp( text, vscode.workspace.getConfiguration( 'todo-tree' ).filterCaseSensitive ? "" : "i" );

        if( children === undefined )
        {
            children = elements;
        }
        children.forEach( child =>
        {
            if( child.type == TODO )
            {
                child.visible = !text || matcher.exec( child.name );
            }
            else
            {
                if( child.elements )
                {
                    this.filter( text, child.elements );
                }
                if( child.todos )
                {
                    this.filter( text, child.todos );
                }
                var visibleElements = child.elements.filter( e => e.visible ).length;
                var visibleTodos = child.todos.filter( e => e.visible ).length;
                child.visible = visibleElements + visibleTodos > 0;
            }
        } );
    }

    clearFilter( children )
    {
        if( children === undefined )
        {
            children = elements;
        }
        children.forEach( child =>
        {
            child.visible = true;
            if( child.elements )
            {
                this.clearFilter( child.elements );
            }
            if( child.todos )
            {
                this.clearFilter( child.todos );
            }
        } );
    }
}
exports.TodoDataProvider = TodoDataProvider;
