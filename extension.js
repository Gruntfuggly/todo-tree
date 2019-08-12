/* jshint esversion:6 */

var vscode = require( 'vscode' );
var ripgrep = require( './ripgrep' );
var path = require( 'path' );
var treeify = require( 'treeify' );

var tree = require( "./tree.js" );
var highlights = require( './highlights.js' );
var config = require( './config.js' );
var utils = require( './utils.js' );

var searchResults = [];
var searchList = [];
var currentFilter;
var interrupted = false;
var selectedDocument;
var refreshTimeout;
var openDocuments = {};

function activate( context )
{
    var outputChannel;

    function debug( text )
    {
        if( outputChannel )
        {
            outputChannel.appendLine( text );
        }
    }

    var buildCounter = context.workspaceState.get( 'buildCounter', 1 );
    context.workspaceState.update( 'buildCounter', ++buildCounter );

    currentFilter = context.workspaceState.get( 'currentFilter' );

    config.init( context );
    highlights.init( context );
    utils.init( config );

    var provider = new tree.TreeNodeProvider( context, debug );
    var status = vscode.window.createStatusBarItem( vscode.StatusBarAlignment.Left, 0 );

    var todoTreeViewExplorer = vscode.window.createTreeView( "todo-tree-view-explorer", { treeDataProvider: provider } );
    var todoTreeView = vscode.window.createTreeView( "todo-tree-view", { treeDataProvider: provider } );

    context.subscriptions.push( provider );
    context.subscriptions.push( status );
    context.subscriptions.push( todoTreeViewExplorer );
    context.subscriptions.push( todoTreeView );

    function resetOutputChannel()
    {
        if( outputChannel )
        {
            outputChannel.dispose();
            outputChannel = undefined;
        }
        if( vscode.workspace.getConfiguration( 'todo-tree' ).debug === true )
        {
            outputChannel = vscode.window.createOutputChannel( "Todo Tree" );
        }
    }

    function refreshTree()
    {
        clearTimeout( refreshTimeout );
        refreshTimeout = setTimeout( function()
        {
            provider.refresh();
            setButtonsAndContext();
        }, 200 );
    }

    function addResultsToTree()
    {
        function trimMatchesOnSameLine( searchResults )
        {
            searchResults.forEach( function( match )
            {
                searchResults.map( function( m )
                {
                    if( match.file === m.file && match.line === m.line && match.column < m.column )
                    {
                        match.match = match.match.substr( 0, m.column - 1 );
                    }
                } );
            } );
        }

        trimMatchesOnSameLine( searchResults );

        searchResults.sort( function compare( a, b )
        {
            return a.file > b.file ? 1 : b.file > a.file ? -1 : a.line > b.line ? 1 : -1;
        } );
        searchResults.map( function( match )
        {
            if( match.added !== true )
            {
                provider.add( match );
                match.added = true;
            }
        } );

        if( interrupted === false )
        {
            updateStatusBar();
        }

        provider.filter( currentFilter );
        refreshTree();
    }

    function updateStatusBar()
    {
        var counts = provider.getTagCounts();

        if( vscode.workspace.getConfiguration( 'todo-tree' ).statusBar === 'total' )
        {
            var total = Object.values( counts ).reduce( function( a, b ) { return a + b; }, 0 );

            status.text = "$(check):" + total;
            status.tooltip = "Todo-Tree total";

            if( total > 0 )
            {
                status.show();
            }
            else
            {
                status.hide();
            }
        }
        else if( vscode.workspace.getConfiguration( 'todo-tree' ).statusBar === 'tags' ||
            vscode.workspace.getConfiguration( 'todo-tree' ).statusBar === 'top three' )
        {
            var text = "$(check) ";
            var sortedTags = Object.keys( counts );
            sortedTags.sort( function( a, b ) { return counts[ a ] < counts[ b ] ? 1 : counts[ b ] < counts[ a ] ? -1 : a > b ? 1 : -1; } );
            if( vscode.workspace.getConfiguration( 'todo-tree' ).statusBar === 'top three' )
            {
                sortedTags = sortedTags.splice( 0, 3 );
            }
            sortedTags.map( function( tag )
            {
                text += tag + ":" + counts[ tag ] + " ";
            } );
            status.text = text;
            status.tooltip = "Todo-Tree tags counts";
            if( Object.keys( counts ).length > 0 )
            {
                status.show();
            }
            else
            {
                status.hide();
            }
        }
        else
        {
            status.hide();
        }

        status.command = "todo-tree.onStatusBarClicked";
    }

    function onStatusBarClicked()
    {
        if( config.clickingStatusBarShouldRevealTree() )
        {
            var showInExplorer = vscode.workspace.getConfiguration( 'todo-tree' ).showInExplorer;
            if( showInExplorer === true )
            {
                todoTreeViewExplorer.reveal( provider.getFirstNode(), { focus: false, select: false } );
            }
            if( todoTreeView.visible === false && showInExplorer === false )
            {
                vscode.commands.executeCommand( 'workbench.view.extension.todo-tree-container' );
            }
        }
        else
        {
            var newSetting = vscode.workspace.getConfiguration( 'todo-tree' ).statusBar === 'total' ? "top three" : "total";
            vscode.workspace.getConfiguration( 'todo-tree' ).update( 'statusBar', newSetting, true );
        }
    }

    function removeFileFromSearchResults( filename )
    {
        searchResults = searchResults.filter( match =>
        {
            return match.file !== filename;
        } );
    }

    function search( options, done )
    {
        function onComplete()
        {
            if( done )
            {
                done();
            }
        }

        debug( "Searching " + options.filename + "..." );

        ripgrep.search( "/", options ).then( matches =>
        {
            if( matches.length > 0 )
            {
                matches.forEach( match =>
                {
                    debug( " Match: " + JSON.stringify( match ) );
                    searchResults.push( match );
                } );
            }
            else if( options.filename )
            {
                removeFileFromSearchResults( options.filename );
            }

            onComplete();
        } ).catch( e =>
        {
            var message = e.message;
            if( e.stderr )
            {
                message += " (" + e.stderr + ")";
            }
            vscode.window.showErrorMessage( "todo-tree: " + message );
            onComplete();
        } );
    }

    function buildGlobs( includeGlobs, excludeGlobs, tempIncludeGlobs, tempExcludeGlobs )
    {
        return []
            .concat( includeGlobs )
            .concat( tempIncludeGlobs )
            .concat( excludeGlobs.map( g => `!${g}` ) )
            .concat( tempExcludeGlobs.map( g => `!${g}` ) );
    }

    function getOptions( filename )
    {
        var c = vscode.workspace.getConfiguration( 'todo-tree' );

        var tempIncludeGlobs = context.workspaceState.get( 'includeGlobs' ) || [];
        var tempExcludeGlobs = context.workspaceState.get( 'excludeGlobs' ) || [];

        var options = {
            regex: "\"" + utils.getRegexSource() + "\"",
            rgPath: config.ripgrepPath()
        };
        var globs = c.passGlobsToRipgrep === true ? buildGlobs( c.includeGlobs, c.excludeGlobs, tempIncludeGlobs, tempExcludeGlobs ) : undefined;

        if( globs && globs.length > 0 )
        {
            options.globs = globs;
        }
        if( filename )
        {
            options.filename = filename;
        }

        options.outputChannel = outputChannel;
        options.additional = c.ripgrepArgs;
        options.maxBuffer = c.ripgrepMaxBuffer;
        options.multiline = utils.getRegexSource().indexOf( "\\n" ) > -1;

        if( vscode.workspace.getConfiguration( 'todo-tree' ).get( 'regexCaseSensitive' ) === false )
        {
            options.additional += ' -i ';
        }

        return options;
    }

    function searchWorkspaces( searchList )
    {
        if( vscode.workspace.getConfiguration( 'todo-tree' ).showTagsFromOpenFilesOnly !== true )
        {
            var includes = vscode.workspace.getConfiguration( 'todo-tree' ).get( 'includedWorkspaces', [] );
            var excludes = vscode.workspace.getConfiguration( 'todo-tree' ).get( 'excludedWorkspaces', [] );
            if( vscode.workspace.workspaceFolders )
            {
                vscode.workspace.workspaceFolders.map( function( folder )
                {
                    if( utils.isIncluded( folder.name, includes, excludes ) )
                    {
                        searchList.push( folder.uri.fsPath );
                    }
                } );
            }
        }
    }

    function refreshOpenFiles()
    {
        Object.keys( openDocuments ).map( function( document )
        {
            refreshFile( openDocuments[ document ] );
        } );
    }

    function applyGlobs()
    {
        var includeGlobs = vscode.workspace.getConfiguration( 'todo-tree' ).get( 'includeGlobs' );
        var excludeGlobs = vscode.workspace.getConfiguration( 'todo-tree' ).get( 'excludeGlobs' );

        var tempIncludeGlobs = context.workspaceState.get( 'includeGlobs' ) || [];
        var tempExcludeGlobs = context.workspaceState.get( 'excludeGlobs' ) || [];

        if( includeGlobs.length + excludeGlobs.length + tempIncludeGlobs.length + tempExcludeGlobs.length > 0 )
        {
            debug( "Applying globs to " + searchResults.length + " items..." );

            searchResults = searchResults.filter( function( match )
            {
                return utils.isIncluded( match.file, includeGlobs.concat( tempIncludeGlobs ), excludeGlobs.concat( tempExcludeGlobs ) );
            } );

            debug( "Remaining items: " + searchResults.length );
        }
    }

    function iterateSearchList()
    {
        if( searchList.length > 0 )
        {
            var entry = searchList.pop();
            search( getOptions( entry ), ( searchList.length > 0 ) ? iterateSearchList : function()
            {
                debug( "Found " + searchResults.length + " items" );
                if( vscode.workspace.getConfiguration( 'todo-tree' ).get( 'passGlobsToRipgrep' ) !== true )
                {
                    applyGlobs();
                }
                addResultsToTree();
                setButtonsAndContext();
            } );
        }
        else
        {
            addResultsToTree();
            setButtonsAndContext();
        }
    }

    function rebuild()
    {
        function getRootFolders()
        {
            var rootFolders = [];
            var valid = true;
            var rootFolder = vscode.workspace.getConfiguration( 'todo-tree' ).get( 'rootFolder' );
            var envRegex = new RegExp( "\\$\\{(.*?)\\}", "g" );
            if( rootFolder.indexOf( "${workspaceFolder}" ) > -1 )
            {
                if( vscode.workspace.workspaceFolders )
                {
                    vscode.workspace.workspaceFolders.map( function( folder )
                    {
                        var path = rootFolder;
                        path = path.replace( /\$\{workspaceFolder\}/g, folder.uri.fsPath );
                        rootFolders.push( path );
                    } );
                }
                else
                {
                    valid = false;
                }
            }
            else if( rootFolder !== "" )
            {
                rootFolders.push( rootFolder );
            }

            rootFolders.forEach( function( rootFolder )
            {
                rootFolder = rootFolder.replace( envRegex, function( match, name )
                {
                    return process.env[ name ];
                } );
            } );

            var includes = vscode.workspace.getConfiguration( 'todo-tree' ).get( 'includedWorkspaces', [] );
            var excludes = vscode.workspace.getConfiguration( 'todo-tree' ).get( 'excludedWorkspaces', [] );

            if( valid === true )
            {
                rootFolders = rootFolders.filter( function( folder )
                {
                    return utils.isIncluded( folder, includes, excludes );
                } );
            }

            return valid === true ? rootFolders : undefined;
        }

        searchResults = [];
        searchList = [];

        provider.clear( vscode.workspace.workspaceFolders );

        interrupted = false;

        status.text = "todo-tree: Scanning...";
        status.show();
        status.command = "todo-tree.stopScan";
        status.tooltip = "Click to interrupt scan";

        searchList = getRootFolders();

        if( searchList.length === 0 )
        {
            searchWorkspaces( searchList );
        }

        iterateSearchList();

        refreshOpenFiles();
    }

    function setButtonsAndContext()
    {
        var c = vscode.workspace.getConfiguration( 'todo-tree' );
        var isTagsOnly = context.workspaceState.get( 'tagsOnly', c.get( 'tagsOnly', false ) );
        var isGrouped = context.workspaceState.get( 'grouped', c.get( 'grouped', false ) );
        var isCollapsible = !isTagsOnly || isGrouped;

        vscode.commands.executeCommand( 'setContext', 'todo-tree-expanded', context.workspaceState.get( 'expanded', c.get( 'expanded', false ) ) );
        vscode.commands.executeCommand( 'setContext', 'todo-tree-flat', context.workspaceState.get( 'flat', c.get( 'flat', false ) ) );
        vscode.commands.executeCommand( 'setContext', 'todo-tree-tags-only', isTagsOnly );
        vscode.commands.executeCommand( 'setContext', 'todo-tree-grouped', isGrouped );
        vscode.commands.executeCommand( 'setContext', 'todo-tree-filtered', context.workspaceState.get( 'filtered', false ) );
        vscode.commands.executeCommand( 'setContext', 'todo-tree-collapsible', isCollapsible );

        vscode.commands.executeCommand( 'setContext', 'todo-tree-show-scan-open-files-or-workspace-button', c.get( 'showScanOpenFilesOrWorkspaceButton', false ) );
        vscode.commands.executeCommand( 'setContext', 'todo-tree-scan-open-files-only', c.get( 'showTagsFromOpenFilesOnly', false ) );

        var children = provider.getChildren();
        var empty = children.length === 1 && children[ 0 ].empty === true;

        if( c.get( "hideTreeWhenEmpty" ) === true )
        {
            vscode.commands.executeCommand( 'setContext', 'todo-tree-has-content', empty === false );
        }
        else
        {
            vscode.commands.executeCommand( 'setContext', 'todo-tree-has-content', true );
        }
    }

    function isIncluded( filename )
    {
        var includeGlobs = vscode.workspace.getConfiguration( 'todo-tree' ).get( 'includeGlobs' );
        var excludeGlobs = vscode.workspace.getConfiguration( 'todo-tree' ).get( 'excludeGlobs' );

        return utils.isIncluded( filename, includeGlobs, excludeGlobs ) === true;
    }

    function refreshFile( document )
    {
        function addResult( offset )
        {
            var position = document.positionAt( offset );
            var line = document.lineAt( position.line );
            return {
                file: document.fileName,
                line: position.line + 1,
                column: position.character + 1,
                match: line.text
            };
        }

        var matchesFound = false;

        removeFileFromSearchResults( document.fileName );

        if( document.uri.scheme === 'file' && isIncluded( document.fileName ) === true )
        {
            var text = document.getText();
            var regex = utils.getRegexForEditorSearch();

            var match;
            while( ( match = regex.exec( text ) ) !== null )
            {
                while( text[ match.index ] === '\n' || text[ match.index ] === '\r' )
                {
                    match.index++;
                    match[ 0 ] = match[ 0 ].substring( 1 );
                }

                var offset = match.index;
                var sections = match[ 0 ].split( "\n" );

                var result = addResult( offset );

                if( sections.length > 1 )
                {
                    result.extraLines = [];
                    offset += sections[ 0 ].length + 1;
                    sections.shift();
                    sections.map( function( section )
                    {
                        result.extraLines.push( addResult( offset ) );
                        offset += section.length + 1;
                    } );
                }

                var found = false;
                searchResults.map( function( s )
                {
                    if( s.file === result.file && s.line == result.line && s.column == result.column )
                    {
                        found = true;
                    }
                } );
                if( found === false )
                {
                    searchResults.push( result );
                    matchesFound = true;
                }
            }
        }

        if( matchesFound === true )
        {
            provider.reset( document.fileName );
        }
        else
        {
            provider.remove( document.fileName );
        }

        addResultsToTree();
    }

    function refresh()
    {
        searchResults.forEach( function( match )
        {
            match.added = false;
        } );
        provider.clear( vscode.workspace.workspaceFolders );
        provider.rebuild();

        refreshOpenFiles();

        addResultsToTree();
        setButtonsAndContext();
    }

    function clearExpansionStateAndRefresh()
    {
        provider.clearExpansionState();
        refresh();
    }

    function showFlatView()
    {
        context.workspaceState.update( 'tagsOnly', false );
        context.workspaceState.update( 'flat', true ).then( refresh );
    }

    function showTagsOnlyView()
    {
        context.workspaceState.update( 'flat', false );
        context.workspaceState.update( 'tagsOnly', true ).then( refresh );
    }

    function showTreeView()
    {
        context.workspaceState.update( 'tagsOnly', false );
        context.workspaceState.update( 'flat', false ).then( refresh );
    }

    function collapse() { context.workspaceState.update( 'expanded', false ).then( clearExpansionStateAndRefresh ); }
    function expand() { context.workspaceState.update( 'expanded', true ).then( clearExpansionStateAndRefresh ); }
    function groupByTag() { context.workspaceState.update( 'grouped', true ).then( refresh ); }
    function ungroupByTag() { context.workspaceState.update( 'grouped', false ).then( refresh ); }

    function clearFilter()
    {
        currentFilter = undefined;
        context.workspaceState.update( 'filtered', false );
        context.workspaceState.update( 'currentFilter', undefined );
        provider.clearFilter();
        refreshTree();
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

    function scanOpenFilesOnly()
    {
        vscode.workspace.getConfiguration( 'todo-tree' ).update( 'showTagsFromOpenFilesOnly', true, false );
    }

    function scanWorkspace()
    {
        vscode.workspace.getConfiguration( 'todo-tree' ).update( 'showTagsFromOpenFilesOnly', false, false );
    }

    function exportTree( exported, extension )
    {
        var newFile = vscode.Uri.parse( 'untitled:' + path.join( vscode.workspace.rootPath, 'todo-tree' + extension ) );
        vscode.workspace.openTextDocument( newFile ).then( function( document )
        {
            var edit = new vscode.WorkspaceEdit();
            edit.delete( newFile, new vscode.Range(
                document.positionAt( 0 ),
                document.positionAt( document.getText().length - 1 )
            ) );
            return vscode.workspace.applyEdit( edit ).then( function( success )
            {
                var edit = new vscode.WorkspaceEdit();
                edit.insert( newFile, new vscode.Position( 0, 0 ), exported );
                return vscode.workspace.applyEdit( edit ).then( function( success )
                {
                    if( success )
                    {
                        vscode.window.showTextDocument( document );
                    }
                } );
            } );
        } );
    }

    function dumpFolderFilter()
    {
        debug( "Folder filter include:" + JSON.stringify( context.workspaceState.get( 'includeGlobs' ) ) );
        debug( "Folder filter exclude:" + JSON.stringify( context.workspaceState.get( 'excludeGlobs' ) ) );
    }

    function register()
    {
        function migrateSettings()
        {
        }

        function showInTree( uri )
        {
            if( vscode.workspace.getConfiguration( 'todo-tree' ).trackFile === true )
            {
                provider.getElement( uri.fsPath, function( element )
                {
                    if( todoTreeViewExplorer.visible === true )
                    {
                        todoTreeViewExplorer.reveal( element, { focus: false, select: true } );
                    }
                    if( todoTreeView.visible === true )
                    {
                        todoTreeView.reveal( element, { focus: false, select: true } );
                    }
                } );
            }
        }

        function documentChanged( document )
        {
            vscode.window.visibleTextEditors.map( editor =>
            {
                if( document === editor.document && editor.document.uri.scheme === 'file' )
                {
                    if( document.fileName === undefined || isIncluded( document.fileName ) )
                    {
                        highlights.triggerHighlight( editor );
                    }
                }
            } );
        }

        // We can't do anything if we can't find ripgrep
        if( !config.ripgrepPath() )
        {
            vscode.window.showErrorMessage( "todo-tree: Failed to find vscode-ripgrep - please install ripgrep manually and set 'todo-tree.ripgrep' to point to the executable" );
            return;
        }

        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.revealTodo', ( file, line, column, endColumn ) =>
        {
            selectedDocument = file;
            vscode.workspace.openTextDocument( file ).then( function( document )
            {
                vscode.window.showTextDocument( document ).then( function( editor )
                {
                    var selectionStart, selectionEnd;
                    var todoStart = new vscode.Position( line, column - 1 );
                    var todoEnd = new vscode.Position( line, endColumn - 1 );
                    var lineStart = new vscode.Position( line, 0 );
                    var lineEnd = new vscode.Position( line, document.lineAt( line ).text.length );
                    var revealBehaviour = vscode.workspace.getConfiguration( 'todo-tree' ).get( 'revealBehaviour' );

                    if( revealBehaviour == "end of todo" )
                    {
                        selectionStart = todoEnd;
                        selectionEnd = todoEnd;
                    }
                    else if( revealBehaviour == "highlight todo" )
                    {
                        selectionStart = todoStart;
                        selectionEnd = todoEnd;
                    }
                    else if( revealBehaviour == "start of line" )
                    {
                        selectionStart = lineStart;
                        selectionEnd = lineStart;
                    }
                    else if( revealBehaviour == "highlight line" )
                    {
                        selectionStart = lineStart;
                        selectionEnd = lineEnd;
                    }
                    else
                    {
                        selectionStart = todoStart;
                        selectionEnd = todoStart;
                    }

                    editor.selection = new vscode.Selection( selectionStart, selectionEnd );
                    editor.revealRange( editor.selection, vscode.TextEditorRevealType.InCenter );
                    vscode.commands.executeCommand( 'workbench.action.focusActiveEditorGroup' );
                } );
            } );
        } ) );

        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.filter', function()
        {
            vscode.window.showInputBox( { prompt: "Filter tree" } ).then(
                function( term )
                {
                    currentFilter = term;
                    if( currentFilter )
                    {
                        context.workspaceState.update( 'filtered', true );
                        context.workspaceState.update( 'currentFilter', currentFilter );
                        provider.filter( currentFilter );
                        refreshTree();
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

        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.exportTree', function()
        {
            exportTree( treeify.asTree( provider.exportTree(), true ), ".txt" );
        } ) );

        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.exportTreeAsJSON', function()
        {
            exportTree( JSON.stringify( provider.exportTree(), null, 2 ), ".json" );
        } ) );

        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.showOnlyThisFolder', function( node )
        {
            var glob = node.fsPath + "/*";
            var includeGlobs = [ glob ];
            context.workspaceState.update( 'includeGlobs', includeGlobs );
            rebuild();
            dumpFolderFilter();
        } ) );

        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.showOnlyThisFolderAndSubfolders', function( node )
        {
            var glob = node.fsPath + "/**/*";
            var includeGlobs = [ glob ];
            context.workspaceState.update( 'includeGlobs', includeGlobs );
            rebuild();
            dumpFolderFilter();
        } ) );

        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.excludeThisFolder', function( node )
        {
            var glob = node.fsPath + "/**/*";
            var excludeGlobs = context.workspaceState.get( 'excludeGlobs' ) || [];
            if( excludeGlobs.indexOf( glob ) === -1 )
            {
                excludeGlobs.push( glob );
                context.workspaceState.update( 'excludeGlobs', excludeGlobs );
                rebuild();
            }
            dumpFolderFilter()
        } ) );

        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.resetFolderFilter', function()
        {
            context.workspaceState.update( 'includeGlobs', [] );
            context.workspaceState.update( 'excludeGlobs', [] );
            rebuild();
            dumpFolderFilter();
        } ) );

        context.subscriptions.push( todoTreeViewExplorer.onDidExpandElement( function( e ) { provider.setExpanded( e.element.fsPath, true ); } ) );
        context.subscriptions.push( todoTreeView.onDidExpandElement( function( e ) { provider.setExpanded( e.element.fsPath, true ); } ) );
        context.subscriptions.push( todoTreeViewExplorer.onDidCollapseElement( function( e ) { provider.setExpanded( e.element.fsPath, false ); } ) );
        context.subscriptions.push( todoTreeView.onDidCollapseElement( function( e ) { provider.setExpanded( e.element.fsPath, false ); } ) );

        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.filterClear', clearFilter ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.refresh', rebuild ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.showFlatView', showFlatView ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.showTagsOnlyView', showTagsOnlyView ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.showTreeView', showTreeView ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.expand', expand ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.collapse', collapse ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.groupByTag', groupByTag ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.ungroupByTag', ungroupByTag ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.addTag', addTag ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.removeTag', removeTag ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.onStatusBarClicked', onStatusBarClicked ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.scanOpenFilesOnly', scanOpenFilesOnly ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.scanWorkspace', scanWorkspace ) );

        context.subscriptions.push( vscode.window.onDidChangeActiveTextEditor( function( e )
        {
            if( e && e.document )
            {
                openDocuments[ e.document.fileName ] = e.document;

                if( vscode.workspace.getConfiguration( 'todo-tree' ).autoRefresh === true )
                {
                    if( e.document.uri && e.document.uri.scheme === "file" )
                    {
                        if( selectedDocument !== e.document.fileName )
                        {
                            setTimeout( showInTree, 500, e.document.uri );
                        }
                        selectedDocument = undefined;
                    }
                }

                documentChanged( e.document );
            }
        } ) );

        context.subscriptions.push( vscode.workspace.onDidSaveTextDocument( document =>
        {
            if( document.uri.scheme === "file" && path.basename( document.fileName ) !== "settings.json" )
            {
                if( vscode.workspace.getConfiguration( 'todo-tree' ).autoRefresh === true )
                {
                    refreshFile( document );
                }
            }
        } ) );

        context.subscriptions.push( vscode.workspace.onDidOpenTextDocument( document =>
        {
            if( vscode.workspace.getConfiguration( 'todo-tree' ).autoRefresh === true )
            {
                if( document.uri.scheme === "file" )
                {
                    openDocuments[ document.fileName ] = document;
                    refreshFile( document );
                }
            }
        } ) );

        context.subscriptions.push( vscode.workspace.onDidCloseTextDocument( document =>
        {
            delete openDocuments[ document.fileName ];

            if( vscode.workspace.getConfiguration( 'todo-tree' ).autoRefresh === true )
            {
                if( document.uri.scheme === "file" && vscode.workspace.getConfiguration( 'todo-tree' ).showTagsFromOpenFilesOnly === true )
                {
                    removeFileFromSearchResults( document.fileName );
                    provider.remove( document.fileName );
                    refreshTree();
                    updateStatusBar();
                }
            }
        } ) );

        context.subscriptions.push( vscode.workspace.onDidChangeConfiguration( function( e )
        {
            if( e.affectsConfiguration( "todo-tree" ) )
            {
                if( e.affectsConfiguration( "todo-tree.iconColour" ) ||
                    e.affectsConfiguration( "todo-tree.defaultHighlight" ) ||
                    e.affectsConfiguration( "todo-tree.customHighlight" ) )
                {
                    highlights.refreshComplementaryColours();
                    if( vscode.window.activeTextEditor )
                    {
                        documentChanged( vscode.window.activeTextEditor.document );
                    }
                }

                if( e.affectsConfiguration( "todo-tree.debug" ) )
                {
                    resetOutputChannel();
                }

                if( e.affectsConfiguration( "todo-tree.includeGlobs" ) ||
                    e.affectsConfiguration( "todo-tree.excludeGlobs" ) ||
                    e.affectsConfiguration( "todo-tree.regex" ) ||
                    e.affectsConfiguration( "todo-tree.ripgrep" ) ||
                    e.affectsConfiguration( "todo-tree.ripgrepArgs" ) ||
                    e.affectsConfiguration( "todo-tree.ripgrepMaxBuffer" ) ||
                    e.affectsConfiguration( "todo-tree.rootFolder" ) ||
                    e.affectsConfiguration( "todo-tree.showTagsFromOpenFilesOnly" ) ||
                    e.affectsConfiguration( "todo-tree.includedWorkspaces" ) ||
                    e.affectsConfiguration( "todo-tree.excludedWorkspaces" ) ||
                    e.affectsConfiguration( "todo-tree.tags" ) ||
                    e.affectsConfiguration( "todo-tree.tagsOnly" ) )
                {
                    rebuild();
                    documentChanged();
                }
                else
                {
                    refresh();
                }

                vscode.commands.executeCommand( 'setContext', 'todo-tree-in-explorer', vscode.workspace.getConfiguration( 'todo-tree' ).showInExplorer );
                setButtonsAndContext();
            }
        } ) );

        context.subscriptions.push( vscode.workspace.onDidChangeWorkspaceFolders( function()
        {
            provider.clear( vscode.workspace.workspaceFolders );
            provider.rebuild();
            rebuild();
        } ) );

        context.subscriptions.push( vscode.workspace.onDidChangeTextDocument( function( e )
        {
            documentChanged( e.document );
        } ) );

        context.subscriptions.push( outputChannel );

        vscode.commands.executeCommand( 'setContext', 'todo-tree-in-explorer', vscode.workspace.getConfiguration( 'todo-tree' ).showInExplorer );

        resetOutputChannel();

        highlights.refreshComplementaryColours();

        migrateSettings();
        setButtonsAndContext();
        rebuild();

        var editors = vscode.window.visibleTextEditors;
        editors.map( function( editor )
        {
            if( editor.document && editor.document.uri.scheme === "file" )
            {
                openDocuments[ editor.document.fileName ] = editor.document;
            }
            refreshOpenFiles();
        } );

        if( vscode.window.activeTextEditor )
        {
            documentChanged( vscode.window.activeTextEditor.document );
        }
    }

    register();
}

function deactivate()
{
    provider.clear( [] );
}

exports.activate = activate;
exports.deactivate = deactivate;
