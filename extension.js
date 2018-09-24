/* jshint esversion:6 */

var vscode = require( 'vscode' );
var ripgrep = require( './ripgrep' );
var TreeView = require( "./dataProvider" );
var fs = require( 'fs' );
var path = require( 'path' );
var minimatch = require( 'minimatch' );
var highlights = require( './highlights.js' );

var defaultRootFolder = "/";
var lastRootFolder = defaultRootFolder;
var dataSet = [];
var searchList = [];
var currentFilter;
var highlightTimer = {};
var interrupted = false;
var selectedDocument;

function activate( context )
{
    var decorations = {};
    var provider = new TreeView.TodoDataProvider( context, defaultRootFolder );
    var status = vscode.window.createStatusBarItem( vscode.StatusBarAlignment.Left, 0 );
    var outputChannel = vscode.workspace.getConfiguration( 'todo-tree' ).debug ? vscode.window.createOutputChannel( "todo-tree" ) : undefined;

    var todoTreeViewExplorer = vscode.window.createTreeView( "todo-tree-view-explorer", { treeDataProvider: provider } );
    var todoTreeView = vscode.window.createTreeView( "todo-tree-view", { treeDataProvider: provider } );

    function debug( text )
    {
        if( outputChannel )
        {
            outputChannel.appendLine( text );
        }
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
        function trimMatchesOnSameLine( dataSet )
        {
            dataSet.forEach( function( match )
            {
                dataSet.map( function( m )
                {
                    if( match.file === m.file && match.line === m.line && match.column < m.column )
                    {
                        match.match = match.match.substr( 0, m.column - 1 );
                    }
                } );
            } );
        }

        debug( "Found " + dataSet.length + " items" );

        var regex = vscode.workspace.getConfiguration( 'todo-tree' ).regex;
        var tagRegex = regex.indexOf( "$TAGS" ) > -1 ? new RegExp( "(" + vscode.workspace.getConfiguration( 'todo-tree' ).tags.join( "|" ) + ")" ) : undefined;

        trimMatchesOnSameLine( dataSet );

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
        var c = vscode.workspace.getConfiguration( 'todo-tree' );
        vscode.commands.executeCommand( 'setContext', 'todo-tree-expanded', context.workspaceState.get( 'expanded', c.get( 'expanded', false ) ) );
        vscode.commands.executeCommand( 'setContext', 'todo-tree-flat', context.workspaceState.get( 'flat', c.get( 'flat', false ) ) );
        vscode.commands.executeCommand( 'setContext', 'todo-tree-grouped', context.workspaceState.get( 'grouped', c.get( 'grouped', false ) ) );
        vscode.commands.executeCommand( 'setContext', 'todo-tree-filtered', context.workspaceState.get( 'filtered', false ) );
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

    function refresh()
    {
        provider.clear();
        provider.rebuild();
        addToTree( getRootFolder() );
        setButtons();
    }

    function showFlatView()
    {
        context.workspaceState.update( 'flat', true ).then( refresh );
    }

    function showTreeView()
    {
        context.workspaceState.update( 'flat', false ).then( refresh );
    }

    function collapse()
    {
        context.workspaceState.update( 'expanded', false ).then( refresh );
    }

    function expand()
    {
        context.workspaceState.update( 'expanded', true ).then( refresh );
    }

    function groupByTag()
    {
        context.workspaceState.update( 'grouped', true ).then( refresh );
    }

    function ungroupByTag()
    {
        context.workspaceState.update( 'grouped', false ).then( refresh );
    }

    function clearFilter()
    {
        currentFilter = undefined;
        context.workspaceState.update( 'filtered', false );
        provider.clearFilter();
        provider.refresh();
        setButtons();
    }

    function addTag()
    {
        vscode.window.showInputBox( { prompt: "New tag", placeHolder: "e.g. FIXME" } ).then( function( tag )
        {
            if( tag )
            {
                var tags = vscode.workspace.getConfiguration( 'todo-tree' ).get( 'tags' );
                if( tags.indexOf( tag ) === -1 )
                {
                    tags.push( tag );
                    vscode.workspace.getConfiguration( 'todo-tree' ).update( 'tags', tags, true );
                }
            }
        } );
    }

    function removeTag()
    {
        var tags = vscode.workspace.getConfiguration( 'todo-tree' ).get( 'tags' );
        vscode.window.showQuickPick( tags, { matchOnDetail: true, matchOnDescription: true, canPickMany: true, placeHolder: "Select tags to remove" } ).then( function( tagsToRemove )
        {
            tagsToRemove.map( tag =>
            {
                tags = tags.filter( t => tag != t );
            } );
            vscode.workspace.getConfiguration( 'todo-tree' ).update( 'tags', tags, true );
        } );
    }

    function register()
    {
        function migrateSettings()
        {
            if( vscode.workspace.getConfiguration( 'todo-tree' ).get( 'highlight' ) === true )
            {
                vscode.workspace.getConfiguration( 'todo-tree' ).update( 'highlight', 'tag', true );
            }
            else if( vscode.workspace.getConfiguration( 'todo-tree' ).get( 'highlight' ) === false )
            {
                vscode.workspace.getConfiguration( 'todo-tree' ).update( 'highlight', 'none', true );
            }

            var defaultHighlight = vscode.workspace.getConfiguration( 'todo-tree' ).get( 'defaultHighlight' );
            if( Object.keys( defaultHighlight ).length === 0 )
            {
                defaultHighlight.foreground = vscode.workspace.getConfiguration( 'todo-tree' ).get( 'iconColour' );
                defaultHighlight.type = vscode.workspace.getConfiguration( 'todo-tree' ).get( 'highlight' );

                vscode.workspace.getConfiguration( 'todo-tree' ).update( 'defaultHighlight', defaultHighlight, true );
            }

            var customHighlight = vscode.workspace.getConfiguration( 'todo-tree' ).get( 'customHighlight' );
            if( Object.keys( customHighlight ).length === 0 )
            {
                var tags = vscode.workspace.getConfiguration( 'todo-tree' ).get( 'tags' );
                var icons = vscode.workspace.getConfiguration( 'todo-tree' ).get( 'icons' );
                var iconColours = vscode.workspace.getConfiguration( 'todo-tree' ).get( 'iconColours' );

                tags.map( function( tag )
                {
                    customHighlight[ tag ] = {};
                    if( icons[ tag ] !== undefined )
                    {
                        customHighlight[ tag ].icon = icons[ tag ];
                    }
                    if( iconColours[ tag ] !== undefined )
                    {
                        customHighlight[ tag ].foreground = iconColours[ tag ];
                    }
                } );

                vscode.workspace.getConfiguration( 'todo-tree' ).update( 'customHighlight', customHighlight, true );
            }
        }

        migrateSettings();

        // We can't do anything if we can't find ripgrep
        if( !getRgPath() )
        {
            vscode.window.showErrorMessage( "todo-tree: Failed to find vscode-ripgrep - please install ripgrep manually and set 'todo-tree.ripgrep' to point to the executable" );
            return;
        }

        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.revealTodo', ( file, line ) =>
        {
            selectedDocument = file;
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
        } ) );

        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.filter', function()
        {
            vscode.window.showInputBox( { prompt: "Filter TODOs" } ).then(
                function( term )
                {
                    currentFilter = term;
                    if( currentFilter )
                    {
                        context.workspaceState.update( 'filtered', true );
                        provider.filter( currentFilter );
                        provider.refresh();
                        setButtons();
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
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.addTag', addTag ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.removeTag', removeTag ) );

        context.subscriptions.push( vscode.window.onDidChangeActiveTextEditor( function( e )
        {
            if( e && e.document )
            {
                if( vscode.workspace.getConfiguration( 'todo-tree' ).autoRefresh === true )
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

                if( selectedDocument !== e.document.fileName )
                {
                    showInTree( e.document.fileName );
                }

                selectedDocument = undefined;

                documentChanged( e.document );
            }
        } ) );

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
                    e.affectsConfiguration( "todo-tree.icons" ) ||
                    e.affectsConfiguration( "todo-tree.defaultHighlight" ) ||
                    e.affectsConfiguration( "todo-tree.customHighlight" ) )
                {
                    highlights.refreshComplementaryColours();
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
                    documentChanged();
                }
                else
                {
                    provider.clear();
                    provider.rebuild();
                    addToTree( getRootFolder() );
                    documentChanged();
                }

                vscode.commands.executeCommand( 'setContext', 'todo-tree-in-explorer', vscode.workspace.getConfiguration( 'todo-tree' ).showInExplorer );
                setButtons();
            }
        } ) );

        function showInTree( filename )
        {
            if( vscode.workspace.getConfiguration( 'todo-tree' ).trackFile === true )
            {
                var element = provider.getElement( getRootFolder(), filename );
                if( element )
                {
                    if( todoTreeViewExplorer.visible === true )
                    {
                        todoTreeViewExplorer.reveal( element, { focus: false, select: true } );
                    }
                    if( todoTreeView.visible === true )
                    {
                        todoTreeView.reveal( element, { focus: false, select: true } );
                    }
                }
            }
        }

        function highlight( editor )
        {
            var documentHighlights = {};

            if( editor )
            {
                const text = editor.document.getText();
                var regex = new RegExp( getRegex(), 'gm' );
                let match;
                while( ( match = regex.exec( text ) ) !== null )
                {
                    var tag = match[ 0 ];
                    var type = highlights.getType( tag );
                    if( type !== 'none' )
                    {
                        var startPos = editor.document.positionAt( match.index );
                        var endPos = editor.document.positionAt( match.index + match[ 0 ].length );

                        if( type === 'text' )
                        {
                            endPos = new vscode.Position( endPos.line, editor.document.lineAt( endPos.line ).range.end.character );
                        }

                        if( type === 'line' )
                        {
                            endPos = new vscode.Position( endPos.line, editor.document.lineAt( endPos.line ).range.end.character );
                            startPos = new vscode.Position( endPos.line, 0 );
                        }

                        const decoration = { range: new vscode.Range( startPos, endPos ) };
                        if( documentHighlights[ tag ] === undefined )
                        {
                            documentHighlights[ tag ] = [];
                        }
                        documentHighlights[ tag ].push( decoration );
                    }
                }

                if( decorations[ editor.id ] )
                {
                    decorations[ editor.id ].forEach( decoration =>
                    {
                        decoration.dispose();
                    } );
                }

                decorations[ editor.id ] = [];
                Object.keys( documentHighlights ).forEach( tag =>
                {
                    var decoration = highlights.getDecoration( tag );
                    decorations[ editor.id ].push( decoration );
                    editor.setDecorations( decoration, documentHighlights[ tag ] );
                } );
            }
        }

        function triggerHighlight( editor )
        {
            if( editor )
            {
                if( highlightTimer[ editor.id ] )
                {
                    clearTimeout( highlightTimer[ editor.id ] );
                }
                highlightTimer[ editor.id ] = setTimeout( highlight, vscode.workspace.getConfiguration( 'todo-tree' ).highlightDelay, editor );
            }
        }

        function documentChanged( document )
        {
            var visibleEditors = vscode.window.visibleTextEditors;

            visibleEditors.map( editor =>
            {
                if( document === undefined || document === editor.document )
                {
                    triggerHighlight( editor );
                }
            } );
        }

        context.subscriptions.push( vscode.workspace.onDidChangeTextDocument( function( e )
        {
            documentChanged( e.document );
        } ) );

        context.subscriptions.push( outputChannel );
        context.subscriptions.push( decorations );

        vscode.commands.executeCommand( 'setContext', 'todo-tree-in-explorer', vscode.workspace.getConfiguration( 'todo-tree' ).showInExplorer );

        highlights.refreshComplementaryColours();

        setButtons();
        rebuild();

        if( vscode.window.activeTextEditor )
        {
            documentChanged( vscode.window.activeTextEditor.document );
        }
    }

    register();
}

function deactivate()
{
}

exports.activate = activate;
exports.deactivate = deactivate;
