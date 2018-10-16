/* jshint esversion:6 */

var vscode = require( 'vscode' );
var ripgrep = require( './ripgrep' );
var path = require( 'path' );
var minimatch = require( 'minimatch' );

var tree = require( "./tree.js" );
var highlights = require( './highlights.js' );
var config = require( './config.js' );
var utils = require( './utils.js' );

var dataSet = [];
var searchList = [];
var currentFilter;
var interrupted = false;
var selectedDocument;

function activate( context )
{
    config.init( context );
    highlights.init( context );

    var provider = new tree.TreeNodeProvider( context );
    var status = vscode.window.createStatusBarItem( vscode.StatusBarAlignment.Left, 0 );
    var outputChannel = vscode.workspace.getConfiguration( 'todo-tree' ).debug ? vscode.window.createOutputChannel( "todo-tree" ) : undefined;

    var todoTreeViewExplorer = vscode.window.createTreeView( "todo-tree-view-explorer", { treeDataProvider: provider } );
    var todoTreeView = vscode.window.createTreeView( "todo-tree-view", { treeDataProvider: provider } );

    context.subscriptions.push( provider );
    context.subscriptions.push( todoTreeViewExplorer );
    context.subscriptions.push( todoTreeView );

    function debug( text )
    {
        if( outputChannel )
        {
            outputChannel.appendLine( text );
        }
    }

    function addToTree()
    {
        function trimMatchesOnSameLine( dataSet )
        {
            dataSet.forEach( function( entry )
            {
                dataSet.map( function( e )
                {
                    if( entry.match.file === e.match.file && entry.match.line === e.match.line && entry.match.column < e.match.column )
                    {
                        entry.match.match = entry.match.match.substr( 0, e.match.column - 1 );
                    }
                } );
            } );
        }

        debug( "Found " + dataSet.length + " items" );

        trimMatchesOnSameLine( dataSet );

        dataSet.sort( function compare( a, b )
        {
            return a.match.file > b.match.file ? 1 : b.match.file > a.match.file ? -1 : a.match.line > b.match.line ? 1 : -1;
        } );
        dataSet.map( function( entry )
        {
            provider.add( entry.match );
        } );

        if( interrupted === false )
        {
            status.hide();
        }

        provider.filter( currentFilter );
        provider.refresh( true );
    }

    function search( entry, options, done, doneArgument )
    {
        ripgrep.search( "/", options ).then( matches =>
        {
            if( matches.length > 0 )
            {
                matches.forEach( match =>
                {
                    debug( " Match: " + JSON.stringify( match ) );
                    dataSet.push( { folder: entry.folder, rootName: entry.rootName, match: match } );
                } );
            }
            else if( options.filename )
            {
                dataSet.filter( entry =>
                {
                    return entry.match.file === options.filename;
                } );
            }

            done( doneArgument );

        } ).catch( e =>
        {
            var message = e.message;
            if( e.stderr )
            {
                message += " (" + e.stderr + ")";
            }
            vscode.window.showErrorMessage( "todo-tree: " + message );
            done( doneArgument );
        } );
    }

    function getOptions( filename )
    {
        var config = vscode.workspace.getConfiguration( 'todo-tree' );

        var options = {
            regex: "\"" + utils.getRegex() + "\"",
            rgPath: utils.getRgPath()
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

        if( vscode.workspace.getConfiguration( 'todo-tree' ).get( 'regexCaseSensitive' ) === false )
        {
            options.additional += '-i ';
        }

        return options;
    }

    function searchWorkspaces( searchList )
    {
        if( vscode.workspace.getConfiguration( 'todo-tree' ).showTagsFromOpenFilesOnly !== true )
        {
            vscode.workspace.workspaceFolders.map( function( folder )
            {
                searchList.push( {
                    folder: folder.uri.path,
                    rootName: vscode.workspace.workspaceFolders.length === 1 ? "" : folder.name
                } );
            } );
        }
    }

    function searchOutOfWorkspaceDocuments( searchList )
    {
        function isInWorkspace( filePath )
        {
            var result = false;
            vscode.workspace.workspaceFolders.map( function( folder )
            {
                if( filePath.indexOf( folder.uri.fsPath ) === 0 )
                {
                    result = true;
                }
            } );
            return result;
        }

        var documents = vscode.workspace.textDocuments;

        documents.map( function( document, index )
        {
            if( document.uri && document.uri.scheme === "file" )
            {
                var filePath = vscode.Uri.parse( document.uri.path ).fsPath;
                if( !isInWorkspace( filePath ) ||
                    vscode.workspace.getConfiguration( 'todo-tree' ).showTagsFromOpenFilesOnly === true )
                {
                    searchList.push( { file: filePath, folder: "/", rootName: "" } );
                }
            }
        } );
    }

    function iterateSearchList( done )
    {
        if( searchList.length > 0 )
        {
            var entry = searchList.pop();

            if( entry.file )
            {
                search( entry, getOptions( entry.file ), iterateSearchList, done );
            }
            else if( entry.folder )
            {
                search( entry, getOptions( entry.folder ), iterateSearchList, done );
            }
        }
        else
        {
            addToTree();
            if( done )
            {
                done();
            }
        }
    }

    function rebuild()
    {
        function getRootFolder()
        {
            var rootFolder = vscode.workspace.getConfiguration( 'todo-tree' ).get( 'rootFolder' );
            var envRegex = new RegExp( "\\$\\{(.*?)\\}", "g" );
            rootFolder = rootFolder.replace( envRegex, function( match, name )
            {
                if( name === "workspaceFolder" && vscode.workspace.workspaceFolders.length === 1 )
                {
                    return vscode.workspace.workspaceFolders[ 0 ].uri.fsPath;
                }
                return process.env[ name ];
            } );

            return rootFolder;
        }

        dataSet = [];
        searchList = [];

        provider.clear( vscode.workspace.workspaceFolders );
        clearFilter();

        interrupted = false;

        status.text = "todo-tree: Scanning...";
        status.show();
        status.command = "todo-tree.stopScan";
        status.tooltip = "Click to interrupt scan";

        var rootFolder = getRootFolder();
        if( rootFolder )
        {
            searchList.push( { folder: rootFolder, rootName: "" } );
        }
        else
        {
            searchOutOfWorkspaceDocuments( searchList );
            searchWorkspaces( searchList );
        }

        iterateSearchList();
    }

    function setButtonsAndContext()
    {
        var c = vscode.workspace.getConfiguration( 'todo-tree' );
        vscode.commands.executeCommand( 'setContext', 'todo-tree-expanded', context.workspaceState.get( 'expanded', c.get( 'expanded', false ) ) );
        vscode.commands.executeCommand( 'setContext', 'todo-tree-flat', context.workspaceState.get( 'flat', c.get( 'flat', false ) ) );
        vscode.commands.executeCommand( 'setContext', 'todo-tree-grouped', context.workspaceState.get( 'grouped', c.get( 'grouped', false ) ) );
        vscode.commands.executeCommand( 'setContext', 'todo-tree-filtered', context.workspaceState.get( 'filtered', false ) );

        var children = provider.getChildren();
        var empty = children.length === 1 && children[ 0 ].empty === true;
        vscode.commands.executeCommand( 'setContext', 'todo-tree-has-content', empty === false );
    }

    function refreshFile( filename, done )
    {
        provider.rebuild();
        provider.clear( vscode.workspace.workspaceFolders );
        dataSet = dataSet.filter( entry =>
        {
            return entry.match.file !== filename;
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
            searchList = [ { file: filename, folder: "/", rootName: "" } ];
            iterateSearchList( done );
        }
    }

    function refresh()
    {
        provider.clear( vscode.workspace.workspaceFolders );
        provider.rebuild();
        addToTree();
        setButtonsAndContext();
    }

    function showFlatView() { context.workspaceState.update( 'flat', true ).then( refresh ); }
    function showTreeView() { context.workspaceState.update( 'flat', false ).then( refresh ); }
    function collapse() { context.workspaceState.update( 'expanded', false ).then( refresh ); }
    function expand() { context.workspaceState.update( 'expanded', true ).then( refresh ); }
    function groupByTag() { context.workspaceState.update( 'grouped', true ).then( refresh ); }
    function ungroupByTag() { context.workspaceState.update( 'grouped', false ).then( refresh ); }

    function clearFilter()
    {
        currentFilter = undefined;
        context.workspaceState.update( 'filtered', false );
        provider.clearFilter();
        provider.refresh();
        setButtonsAndContext();
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
                if( document === editor.document )
                {
                    highlights.triggerHighlight( editor );
                }
            } );
        }

        // We can't do anything if we can't find ripgrep
        if( !utils.getRgPath() )
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
                        provider.filter( currentFilter );
                        provider.refresh();
                        setButtonsAndContext();
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

                    if( e.document.uri && e.document.uri.scheme === "file" )
                    {
                        refreshFile( e.document.fileName, function()
                        {
                            if( selectedDocument !== e.document.fileName )
                            {
                                showInTree( e.document.uri );
                            }
                            selectedDocument = undefined;
                        } );
                    }
                }

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
            if( vscode.workspace.getConfiguration( 'todo-tree' ).autoRefresh === true )
            {
                if( e.uri.scheme === "file" && vscode.workspace.getWorkspaceFolder( vscode.Uri.file( e.fileName ) ) === undefined )
                {
                    dataSet = dataSet.filter( entry =>
                    {
                        return entry.match.file !== e.fileName;
                    } );
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
                    e.affectsConfiguration( "todo-tree.showTagsFromOpenFilesOnly" ) ||
                    e.affectsConfiguration( "todo-tree.tags" ) )
                {
                    rebuild();
                    documentChanged();
                }
                else
                {
                    provider.clear( vscode.workspace.workspaceFolders );
                    provider.rebuild();
                    addToTree();
                    documentChanged();
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

        highlights.refreshComplementaryColours();

        migrateSettings();
        setButtonsAndContext();
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
    provider.clear( [] );
}

exports.activate = activate;
exports.deactivate = deactivate;
