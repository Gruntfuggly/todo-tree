/* jshint esversion:6 */

var vscode = require( 'vscode' );
var ripgrep = require( './ripgrep' );
var TreeView = require( "./dataProvider" );
var childProcess = require( 'child_process' );
var fs = require( 'fs' );
var path = require( 'path' );

var defaultRootFolder = "/";
var lastRootFolder = defaultRootFolder;
var dataSet = [];
var searchList = [];
var currentFilter;

function activate( context )
{
    var provider = new TreeView.TodoDataProvider( context, defaultRootFolder );
    var status = vscode.window.createStatusBarItem( vscode.StatusBarAlignment.Left, 0 );
    var outputChannel = vscode.workspace.getConfiguration( 'todo-tree' ).debug ? vscode.window.createOutputChannel( "todo-tree" ) : undefined;

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

        return rootFolder;
    }

    function addToTree( rootFolder )
    {
        dataSet.sort( function compare( a, b )
        {
            return a.file > b.file ? 1 : b.file > a.file ? -1 : a.line > b.line ? 1 : -1;
        } );
        dataSet.map( function( match )
        {
            provider.add( rootFolder, match );
        } );
        status.hide();
        provider.filter( currentFilter );
        provider.refresh( true );
    }

    function search( rootFolder, options, done )
    {
        ripgrep( "/", options ).then( matches =>
        {
            if( matches.length > 0 )
            {
                matches.forEach( match =>
                {
                    if( outputChannel )
                    {
                        outputChannel.appendLine( " Match: " + JSON.stringify( match ) );
                    }
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

    function getOptions( filename )
    {
        var config = vscode.workspace.getConfiguration( 'todo-tree' );

        var regex = config.regex;
        if( regex.indexOf( "($TAGS)" ) > -1 )
        {
            regex = regex.replace( "$TAGS", config.tags.join( "|" ) );
        }

        var options = {
            regex: "\"" + regex + "\"",
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
        options.additional = vscode.workspace.getConfiguration( 'todo-tree' ).ripgrepArgs;

        return options;
    }

    function searchWorkspace( searchList )
    {
        var rootFolder = getRootFolder();
        if( rootFolder !== defaultRootFolder )
        {
            lastRootFolder = rootFolder;

            searchList.push( { folder: rootFolder } );
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
                if( rootFolder === defaultRootFolder || !filePath.startsWith( rootFolder ) )
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

            if( outputChannel )
            {
                outputChannel.appendLine( "Search: " + JSON.stringify( entry ) );
            }

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

        status.text = "todo-tree: Scanning " + getRootFolder() + "...";
        status.show();

        searchOutOfWorkspaceDocuments( searchList );
        searchWorkspace( searchList );

        iterateSearchList( searchList );
    }

    function setButtons()
    {
        var expanded = vscode.workspace.getConfiguration( 'todo-tree' ).expanded;
        vscode.commands.executeCommand( 'setContext', 'todo-tree-show-expand', !expanded );
        vscode.commands.executeCommand( 'setContext', 'todo-tree-show-collapse', expanded );
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

        searchList = [ { file: filename } ];
        iterateSearchList();
    }

    function collapse()
    {
        vscode.workspace.getConfiguration( 'todo-tree' ).update( 'expanded', false, false );
    }

    function expand()
    {
        vscode.workspace.getConfiguration( 'todo-tree' ).update( 'expanded', true, false );
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

        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.filterClear', clearFilter ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.refresh', rebuild ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.showFlatView', showFlatView ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.showTreeView', showTreeView ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.expand', expand ) );
        context.subscriptions.push( vscode.commands.registerCommand( 'todo-tree.collapse', collapse ) );

        vscode.window.onDidChangeActiveTextEditor( function( e )
        {
            if( vscode.workspace.getConfiguration( 'todo-tree' ).autoRefresh === true )
            {
                if( e && e.document )
                {
                    if( outputChannel )
                    {
                        outputChannel.appendLine( "onDidChangeActiveTextEditor (uri:" + JSON.stringify( e.document.uri ) + ")" );
                    }

                    var workspace = vscode.workspace.getWorkspaceFolder( e.document.uri );
                    var configuredWorkspace = vscode.workspace.getConfiguration( 'todo-tree' ).rootFolder;

                    if( !workspace || configuredWorkspace )
                    {
                        refreshFile( e.document.fileName );
                    }
                    else if( workspace.uri.fsPath !== lastRootFolder )
                    {
                        rebuild();
                    }
                }
            }
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
                if( e.affectsConfiguration( "todo-tree.globs" ) ||
                    e.affectsConfiguration( "todo-tree.regex" ) ||
                    e.affectsConfiguration( "todo-tree.ripgrep" ) ||
                    e.affectsConfiguration( "todo-tree.ripgrepArgs" ) ||
                    e.affectsConfiguration( "todo-tree.rootFolder" ) ||
                    e.affectsConfiguration( "todo-tree.tags" ) )
                {
                    rebuild();
                }
                else
                {
                    provider.clear();
                    provider.rebuild();
                    addToTree( getRootFolder() );
                }

                vscode.commands.executeCommand( 'setContext', 'todo-tree-in-explorer', vscode.workspace.getConfiguration( 'todo-tree' ).showInExplorer );
                setButtons();
            }
        } ) );

        context.subscriptions.push( outputChannel );

        var flat = vscode.workspace.getConfiguration( 'todo-tree' ).flat;
        vscode.commands.executeCommand( 'setContext', 'todo-tree-flat', flat );

        vscode.commands.executeCommand( 'setContext', 'todo-tree-in-explorer', vscode.workspace.getConfiguration( 'todo-tree' ).showInExplorer );

        setButtons();
        rebuild();
    }

    register();
}

function deactivate()
{
}

exports.activate = activate;
exports.deactivate = deactivate;
