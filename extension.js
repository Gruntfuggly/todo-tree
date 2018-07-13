/* jshint esversion:6 */

var vscode = require( 'vscode' );
var ripgrep = require( './ripgrep' );
var TreeView = require( "./dataProvider" );
var fs = require( 'fs' );
var path = require( 'path' );
var minimatch = require( 'minimatch' );

var defaultRootFolder = "/";
var lastRootFolder = defaultRootFolder;
var dataSet = [];
var searchList = [];
var currentFilter;
var highlightTimer;
var textColours = {};
var decorations = [];
var interrupted = false;

var defaultColours = [ "red", "green", "blue", "yellow", "magenta", "cyan", "grey" ];

var defaultLightColours = {
    "red": "#CC0000",
    "green": "#008f00",
    "blue": "#0433ff",
    "yellow": "#c8c800",
    "magenta": "#bb60bb",
    "cyan": "#76d6ff",
    "grey": "#888888",
};

var defaultDarkColours = {
    "red": "#CC0000",
    "green": "#6AC259",
    "blue": "#0433ff",
    "yellow": "#fffb00",
    "magenta": "#ff85ff",
    "cyan": "#76d6ff",
    "grey": "#aaaaaa"
};

function activate( context )
{
    var provider = new TreeView.TodoDataProvider( context, defaultRootFolder );
    var status = vscode.window.createStatusBarItem( vscode.StatusBarAlignment.Left, 0 );
    var outputChannel = vscode.workspace.getConfiguration( 'todo-tree' ).debug ? vscode.window.createOutputChannel( "todo-tree" ) : undefined;

    function debug( text )
    {
        if( outputChannel )
        {
            outputChannel.appendLine( text );
        }
    }

    function isHexColour( colour )
    {
        var hex = colour.split( / / )[ 0 ].replace( /[^\da-fA-F]/g, '' );
        return ( typeof colour === "string" ) && ( hex.length === 3 || hex.length === 6 ) && !isNaN( parseInt( hex, 16 ) );
    }

    function textColour( colour )
    {
        var hex = colour.split( / / )[ 0 ].replace( /[^\da-fA-F]/g, '' );
        var digits = hex.length / 3;
        var red = parseInt( hex.substr( 0, digits ), 16 );
        var green = parseInt( hex.substr( 1 * digits, digits ), 16 );
        var blue = parseInt( hex.substr( 2 * digits, digits ), 16 );
        var c = [ red / 255, green / 255, blue / 255 ];
        for( var i = 0; i < c.length; ++i )
        {
            if( c[ i ] <= 0.03928 )
            {
                c[ i ] = c[ i ] / 12.92;
            } else
            {
                c[ i ] = Math.pow( ( c[ i ] + 0.055 ) / 1.055, 2.4 );
            }
        }
        var l = 0.2126 * c[ 0 ] + 0.7152 * c[ 1 ] + 0.0722 * c[ 2 ];
        return l > 0.179 ? "#000000" : "#ffffff";
    }

    function refreshTextColours()
    {
        textColours = {};

        Object.keys( defaultLightColours ).forEach( colour =>
        {
            textColours[ defaultLightColours[ colour ] ] = textColour( defaultLightColours[ colour ] );
        } );
        Object.keys( defaultDarkColours ).forEach( colour =>
        {
            textColours[ defaultDarkColours[ colour ] ] = textColour( defaultDarkColours[ colour ] );
        } );

        var iconColours = vscode.workspace.getConfiguration( 'todo-tree' ).iconColours;
        Object.keys( iconColours ).forEach( tag =>
        {
            if( isHexColour( iconColours[ tag ] ) )
            {
                textColours[ iconColours[ tag ] ] = textColour( iconColours[ tag ] );
            }
        } );

        var iconColour = vscode.workspace.getConfiguration( 'todo-tree' ).iconColour;
        if( isHexColour( iconColour ) )
        {
            textColours[ iconColour ] = textColour( iconColour );
        }
    }

    function getDecoration( tag )
    {
        var colourMappings = vscode.workspace.getConfiguration( 'todo-tree' ).iconColours;
        var colour = vscode.workspace.getConfiguration( 'todo-tree' ).iconColour;

        if( colourMappings[ tag ] )
        {
            colour = colourMappings[ tag ];
        }

        var lightColour = colour;
        var darkColour = colour;

        if( !isHexColour( colour ) )
        {
            if( defaultColours.indexOf( colour ) > -1 )
            {
                lightColour = defaultLightColours[ colour ];
                darkColour = defaultDarkColours[ colour ];
            }
            else
            {
                lightColour = "#ffffff";
                darkColour = "#000000";
            }
        }

        return vscode.window.createTextEditorDecorationType( {
            overviewRulerColor: "rgb(255,255,255,0.5)",
            overviewRulerLane: vscode.OverviewRulerLane.Right,
            light: { backgroundColor: lightColour, color: textColours[ lightColour ] },
            dark: { backgroundColor: darkColour, color: textColours[ darkColour ] },
            borderRadius: "0.2em",
        } );
    }

    function exeName()
    {
        var isWin = /^win/.test( process.platform );
        return isWin ? "rg.exe" : "rg";
    }

    function getRgPath()
    {
        var rgPath = "";

        rgPath = exePathIsDefined( vscode.workspace.getConfiguration( 'todo-tree' ).ripgrep );
        if( rgPath ) return rgPath;

        rgPath = exePathIsDefined( path.join( path.dirname( path.dirname( require.main.filename ) ), "node_modules/vscode-ripgrep/bin/", exeName() ) );
        if( rgPath ) return rgPath;

        rgPath = exePathIsDefined( path.join( path.dirname( path.dirname( require.main.filename ) ), "node_modules.asar.unpacked/vscode-ripgrep/bin/", exeName() ) );
        if( rgPath ) return rgPath;

        return rgPath;
    }

    function exePathIsDefined( rgExePath )
    {
        return fs.existsSync( rgExePath ) ? rgExePath : undefined;
    }

    function getRootFolder()
    {
        function workspaceFolder()
        {
            var definition;
            var editor = vscode.window.activeTextEditor;
            if( editor )
            {
                var workspace = vscode.workspace.getWorkspaceFolder( editor.document.uri );
                if( workspace )
                {
                    definition = workspace.uri.fsPath;
                }
            }
            return definition;
        }

        var rootFolder = vscode.workspace.getConfiguration( 'todo-tree' ).rootFolder;
        if( rootFolder === "" )
        {
            rootFolder = workspaceFolder();
            if( !rootFolder )
            {
                rootFolder = lastRootFolder;
            }
        }
        else
        {
            var envRegex = new RegExp( "\\$\\{(.*?)\\}", "g" );
            rootFolder = rootFolder.replace( envRegex, function( match, name )
            {
                if( name === "workspaceFolder" )
                {
                    return workspaceFolder();
                }
                return process.env[ name ];
            } );
        }

        if( !rootFolder )
        {
            rootFolder = defaultRootFolder;
        }

        return path.resolve( rootFolder );
    }

    function addToTree( rootFolder )
    {
        debug( "Found " + dataSet.length + " items" );

        var regex = vscode.workspace.getConfiguration( 'todo-tree' ).regex;
        var tagRegex = regex.indexOf( "$TAGS" ) > -1 ? new RegExp( "(" + vscode.workspace.getConfiguration( 'todo-tree' ).tags.join( "|" ) + ")" ) : undefined;

        dataSet.sort( function compare( a, b )
        {
            return a.file > b.file ? 1 : b.file > a.file ? -1 : a.line > b.line ? 1 : -1;
        } );
        dataSet.map( function( match )
        {
            provider.add( rootFolder, match, tagRegex );
        } );

        if( interrupted === false )
        {
            status.hide();
        }

        provider.filter( currentFilter );
        provider.refresh( true );
    }

    function search( rootFolder, options, done )
    {
        ripgrep.search( "/", options ).then( matches =>
        {
            if( matches.length > 0 )
            {
                matches.forEach( match =>
                {
                    debug( " Match: " + JSON.stringify( match ) );
                    dataSet.push( match );
                } );
            }
            else if( options.filename )
            {
                dataSet.filter( match =>
                {
                    return match.file === options.filename;
                } );
            }

            done();

        } ).catch( e =>
        {
            var message = e.message;
            if( e.stderr )
            {
                message += " (" + e.stderr + ")";
            }
            vscode.window.showErrorMessage( "todo-tree: " + message );
            done();
        } );
    }

    function getRegex()
    {
        var config = vscode.workspace.getConfiguration( 'todo-tree' );

        var regex = config.regex;
        if( regex.indexOf( "($TAGS)" ) > -1 )
        {
            regex = regex.replace( "$TAGS", config.tags.join( "|" ) );
        }

        return regex;
    }

    function getOptions( filename )
    {
        var config = vscode.workspace.getConfiguration( 'todo-tree' );

        var options = {
            regex: "\"" + getRegex() + "\"",
            rgPath: getRgPath()
        };
        var globs = config.globs;
        if( globs && globs.length > 0 )
        {
            options.globs = globs;
        }
        if( filename )
        {
            options.filename = filename;
        }

        options.outputChannel = outputChannel;
        options.additional = config.ripgrepArgs;
        options.maxBuffer = config.ripgrepMaxBuffer;

        return options;
    }

    function searchWorkspace( searchList )
    {
        if( vscode.workspace.getConfiguration( 'todo-tree' ).showTagsFromOpenFilesOnly !== true )
        {
            var rootFolder = getRootFolder();
            if( rootFolder !== defaultRootFolder )
            {
                lastRootFolder = rootFolder;

                searchList.push( { folder: rootFolder } );
            }
        }
    }

    function searchOutOfWorkspaceDocuments( searchList )
    {
        var rootFolder = getRootFolder();
        var documents = vscode.workspace.textDocuments;

        documents.map( function( document, index )
        {
            if( document.uri && document.uri.scheme === "file" )
            {
                var filePath = vscode.Uri.parse( document.uri.path ).fsPath;
                if( rootFolder === defaultRootFolder ||
                    !filePath.startsWith( rootFolder ) ||
                    vscode.workspace.getConfiguration( 'todo-tree' ).showTagsFromOpenFilesOnly === true )
                {
                    searchList.push( { file: filePath } );
                }
            }
        } );
    }

    function iterateSearchList()
    {
        if( searchList.length > 0 )
        {
            var entry = searchList.pop();

            debug( "Search: " + JSON.stringify( entry ) );

            if( entry.file )
            {
                search( getRootFolder(), getOptions( entry.file ), iterateSearchList );
            }
            else if( entry.folder )
            {
                search( entry.folder, getOptions( entry.folder ), iterateSearchList );
            }
        }
        else
        {
            addToTree( getRootFolder() );
        }
    }

    function rebuild()
    {
        dataSet = [];
        provider.clear();
        clearFilter();

        interrupted = false;

        status.text = "todo-tree: Scanning " + getRootFolder() + "...";
        status.show();
        status.command = "todo-tree.stopScan";
        status.tooltip = "Click to interrupt scan";

        searchOutOfWorkspaceDocuments( searchList );
        searchWorkspace( searchList );

        iterateSearchList( searchList );
    }

    function setButtons()
    {
        var expanded = vscode.workspace.getConfiguration( 'todo-tree' ).expanded;
        vscode.commands.executeCommand( 'setContext', 'todo-tree-show-expand', !expanded );
        vscode.commands.executeCommand( 'setContext', 'todo-tree-show-collapse', expanded );
        var grouped = vscode.workspace.getConfiguration( 'todo-tree' ).grouped;
        vscode.commands.executeCommand( 'setContext', 'todo-tree-show-group', !grouped );
        vscode.commands.executeCommand( 'setContext', 'todo-tree-show-ungroup', grouped );
    }

    function showFlatView()
    {
        vscode.workspace.getConfiguration( 'todo-tree' ).update( 'flat', true, false ).then( function()
        {
            vscode.commands.executeCommand( 'setContext', 'todo-tree-flat', true );
        } );
    }

    function showTreeView()
    {
        vscode.workspace.getConfiguration( 'todo-tree' ).update( 'flat', false, false ).then( function()
        {
            vscode.commands.executeCommand( 'setContext', 'todo-tree-flat', false );
        } );
    }

    function refreshFile( filename )
    {
        provider.clear();
        dataSet = dataSet.filter( match =>
        {
            return match.file !== filename;
        } );

        var globs = vscode.workspace.getConfiguration( 'todo-tree' ).globs;
        var add = globs.length === 0;
        if( !add )
        {
            globs.forEach( glob =>
            {
                if( minimatch( filename, glob ) )
                {
                    add = true;
                }
            } );
        }
        if( add === true )
        {
            searchList = [ { file: filename } ];
            iterateSearchList();
        }
    }

    function collapse()
    {
        vscode.workspace.getConfiguration( 'todo-tree' ).update( 'expanded', false, false );
    }

    function expand()
    {
        vscode.workspace.getConfiguration( 'todo-tree' ).update( 'expanded', true, false );
    }

    function groupByTag()
    {
        vscode.workspace.getConfiguration( 'todo-tree' ).update( 'grouped', true, false );
    }

    function ungroupByTag()
    {
        vscode.workspace.getConfiguration( 'todo-tree' ).update( 'grouped', false, false );
    }

    function clearFilter()
    {
        currentFilter = undefined;
        vscode.commands.executeCommand( 'setContext', 'todo-tree-is-filtered', false );
        provider.clearFilter();
        provider.refresh();
    }

    function register()
    {
        // We can't do anything if we can't find ripgrep
        if( !getRgPath() )
        {
            vscode.window.showErrorMessage( "todo-tree: Failed to find vscode-ripgrep - please install ripgrep manually and set 'todo-tree.ripgrep' to point to the executable" );
            return;
        }
        var version = vscode.version.split( "." );

        if( version[ 1 ] > 22 )
        {
            vscode.window.registerTreeDataProvider( 'todo-tree', provider );
        }

        vscode.commands.executeCommand( 'setContext', 'todo-tree-is-filtered', false );

        vscode.window.registerTreeDataProvider( 'todo-tree-explorer', provider );

        vscode.commands.registerCommand( 'todo-tree.revealTodo', ( file, line ) =>
        {
            vscode.workspace.openTextDocument( file ).then( function( document )
            {
                vscode.window.showTextDocument( document ).then( function( editor )
                {
                    var position = new vscode.Position( line, 0 );
                    editor.selection = new vscode.Selection( position, position );
                    editor.revealRange( editor.selection, vscode.TextEditorRevealType.Default );
                    vscode.commands.executeCommand( 'workbench.action.focusActiveEditorGroup' );
                } );
            } );
        } );

        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.filter', function()
        {
            vscode.window.showInputBox( { prompt: "Filter TODOs" } ).then(
                function( term )
                {
                    currentFilter = term;
                    if( currentFilter )
                    {
                        vscode.commands.executeCommand( 'setContext', 'todo-tree-is-filtered', true );
                        provider.filter( currentFilter );
                        provider.refresh();
                    }
                } );
        } ) );

        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.stopScan', function()
        {
            ripgrep.kill();
            status.text = "todo-tree: Scanning interrupted.";
            status.tooltip = "Click to restart";
            status.command = "todo-tree.refresh";
            interrupted = true;
        } ) );

        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.filterClear', clearFilter ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.refresh', rebuild ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.showFlatView', showFlatView ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.showTreeView', showTreeView ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.expand', expand ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.collapse', collapse ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.groupByTag', groupByTag ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.ungroupByTag', ungroupByTag ) );

        vscode.window.onDidChangeActiveTextEditor( function( e )
        {
            if( vscode.workspace.getConfiguration( 'todo-tree' ).autoRefresh === true )
            {
                if( e && e.document )
                {
                    debug( "onDidChangeActiveTextEditor (uri:" + JSON.stringify( e.document.uri ) + ")" );

                    var workspace = vscode.workspace.getWorkspaceFolder( e.document.uri );
                    var configuredWorkspace = vscode.workspace.getConfiguration( 'todo-tree' ).rootFolder;

                    if( !workspace || configuredWorkspace )
                    {
                        if( e.document.uri && e.document.uri.scheme === "file" )
                        {
                            refreshFile( e.document.fileName );
                        }
                    }
                    else if( workspace.uri && ( workspace.uri.fsPath !== lastRootFolder ) )
                    {
                        rebuild();
                    }
                }
            }

            triggerHighlight();
        } );

        context.subscriptions.push( vscode.workspace.onDidSaveTextDocument( e =>
        {
            if( e.uri.scheme === "file" && path.basename( e.fileName ) !== "settings.json" )
            {
                if( vscode.workspace.getConfiguration( 'todo-tree' ).autoRefresh === true )
                {
                    refreshFile( e.fileName );
                }
            }
        } ) );
        context.subscriptions.push( vscode.workspace.onDidCloseTextDocument( e =>
        {
            if( e.uri.scheme === "file" && e.isClosed !== true )
            {
                if( vscode.workspace.getConfiguration( 'todo-tree' ).autoRefresh === true )
                {
                    refreshFile( e.fileName );
                }
            }
        } ) );

        context.subscriptions.push( vscode.workspace.onDidChangeConfiguration( function( e )
        {
            if( e.affectsConfiguration( "todo-tree" ) )
            {
                if( e.affectsConfiguration( "todo-tree.iconColour" ) ||
                    e.affectsConfiguration( "todo-tree.iconColours" ) ||
                    e.affectsConfiguration( "todo-tree.icons" ) )
                {
                    refreshTextColours();
                }

                if( e.affectsConfiguration( "todo-tree.globs" ) ||
                    e.affectsConfiguration( "todo-tree.regex" ) ||
                    e.affectsConfiguration( "todo-tree.ripgrep" ) ||
                    e.affectsConfiguration( "todo-tree.ripgrepArgs" ) ||
                    e.affectsConfiguration( "todo-tree.ripgrepMaxBuffer" ) ||
                    e.affectsConfiguration( "todo-tree.rootFolder" ) ||
                    e.affectsConfiguration( "todo-tree.showTagsFromOpenFilesOnly" ) ||
                    e.affectsConfiguration( "todo-tree.tags" ) )
                {
                    rebuild();
                }
                else
                {
                    provider.clear();
                    provider.rebuild();
                    addToTree( getRootFolder() );
                    triggerHighlight();
                }

                vscode.commands.executeCommand( 'setContext', 'todo-tree-in-explorer', vscode.workspace.getConfiguration( 'todo-tree' ).showInExplorer );
                setButtons();
            }
        } ) );

        function highlight()
        {
            var highlights = {};
            var editor = vscode.window.activeTextEditor;

            if( editor )
            {
                if( vscode.workspace.getConfiguration( 'todo-tree' ).highlight === true )
                {
                    const text = editor.document.getText();
                    var regex = new RegExp( getRegex(), 'g' );
                    let match;
                    while( ( match = regex.exec( text ) ) !== null )
                    {
                        const tag = match[ match.length - 1 ];
                        const startPos = editor.document.positionAt( match.index );
                        const endPos = editor.document.positionAt( match.index + match[ 0 ].length );
                        const decoration = { range: new vscode.Range( startPos, endPos ) };
                        if( highlights[ tag ] === undefined )
                        {
                            highlights[ tag ] = [];
                        }
                        highlights[ tag ].push( decoration );
                    }
                }
                decorations.forEach( decoration =>
                {
                    decoration.dispose();
                } );
                Object.keys( highlights ).forEach( tag =>
                {
                    var decoration = getDecoration( tag );
                    decorations.push( decoration );
                    editor.setDecorations( decoration, highlights[ tag ] );
                } );
            }
        }

        function triggerHighlight()
        {
            clearTimeout( highlightTimer );
            highlightTimer = setTimeout( highlight, vscode.workspace.getConfiguration( 'todo-tree' ).highlightDelay );
        }

        context.subscriptions.push( vscode.workspace.onDidChangeTextDocument( function( e )
        {
            triggerHighlight();
        } ) );

        context.subscriptions.push( outputChannel );

        var flat = vscode.workspace.getConfiguration( 'todo-tree' ).flat;
        vscode.commands.executeCommand( 'setContext', 'todo-tree-flat', flat );

        vscode.commands.executeCommand( 'setContext', 'todo-tree-in-explorer', vscode.workspace.getConfiguration( 'todo-tree' ).showInExplorer );

        refreshTextColours();
        setButtons();
        rebuild();
        triggerHighlight();
    }

    register();
}

function deactivate()
{
}

exports.activate = activate;
exports.deactivate = deactivate;
