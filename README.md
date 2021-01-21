# Todo Tree

[![Build Status](https://travis-ci.org/Gruntfuggly/todo-tree.svg?branch=master)](https://travis-ci.org/Gruntfuggly/todo-tree)

This extension quickly searches (using [ripgrep](https://github.com/BurntSushi/ripgrep) your workspace for comment tags like TODO and FIXME, and displays them in a tree view in the explorer pane. Clicking a TODO within the tree will open the file and put the cursor on the line containing the TODO.

Found TODOs can also be highlighted in open files.

*Please see the [wiki](https://github.com/Gruntfuggly/todo-tree/wiki/Configuration-Examples) for configuration examples.*

![screenshot](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/screenshot.png)

*Notes:*

- *User* `rg.conf` *files are ignored.*

## Highlighting

>*New!:* If you just want to set different colours for tags, you can now enable `todo-tree.highlights.useColourScheme`. This will apply a set of colours (which can be changed) to the tags in the order that they are defined.

Highlighting tags is configurable. Use `defaultHighlight` to set up highlights for all tags. If you need to configure individual tags differently, use `customHighlight`. If settings are not specified in `customHighlight`, the value from `defaultHighlight` is used. If a setting is not specified in `defaultHighlight` then the older, deprecated `icon`, `iconColour` and `iconColours` settings are used.

Both `defaultHighlight` and `customHighlight` allow for the following settings:

`foreground` - used to set the foreground colour of the highlight in the editor and the marker in the ruler.

`background` - used to set the background colour of the highlight in the editor.

*Note: Foreground and background colours can be specified using [HTML/CSS colour names](https://en.wikipedia.org/wiki/Web_colors) (e.g. "Salmon"), RGB hex values (e.g. "#80FF00"), RGB CSS style values (e.g. "rgb(255,128,0)" or colours from the current theme, e.g. `peekViewResult.background`. Hex and RGB values can also have an alpha specified, e.g. "#ff800080" or "rgba(255,128,0,0.5)".*

`opacity` - percentage value used with the background colour. 100% will produce an opaque background which will obscure selection and other decorations. *Note: opacity can only be specified when hex or rgb colours are used.*

`fontWeight`, `fontStyle`, `textDecoration` - can be used to style the highlight with standard CSS values.

`borderRadius` - used to set the border radius of the background of the highlight.

`icon` - used to set a different icon in the tree view. Must be a valid octicon (see <https://octicons.github.com>) or codicon (see <https://microsoft.github.io/vscode-codicons/dist/codicon.html>). If using codicons, specify them in the format "$(*icon*)". The icon defaults to a tick if it's not valid. You can also use "todo-tree", or "todo-tree-filled" if you want to use the icon from the activity view.

`iconColour` - used to set the colour of the icon in the tree. If not specified, it will try to use the foreground colour or the background colour. Colour can be specified as per foreground and background colours, except that theme colours are only available when using codicons. Theme colours are *not* supported for octicons.

`gutterIcon` - set to true to show the icon in the editor gutter. *Note: Unfortunately, only octicons and the todo-tree icon can be displayed in the gutter.*

`rulerColour` - used to set the colour of the marker in the overview ruler. If not specified, it will default to use the foreground colour. Colour can be specified as per foreground and background colours.

`rulerLane` - used to set the lane for the marker in the overview ruler. If not specified, it will default to the right hand lane. Use one of "left", "center", "right", or "full". You can also use "none" to disable the ruler markers.

`type` - used to control how much is highlighted in the editor. Valid values are:

- `tag` - highlights just the tag
- `text` - highlights the tag and any text after the tag
- `tag-and-comment` - highlights the comment characters (or the start of the match) and the tag
- `text-and-comment` - highlights the comment characters (or the start of the match), the tag and the text after the tag
- `line` - highlights the entire line containing the tag
- `whole-line` - highlights the entire line containing the tag to the full width of the editor

`hideFromTree` - used to hide tags from the tree, but still highlight in files

`hideFromStatusBar` - prevents the tag from being included in the status bar counts

Example:

```json
"todo-tree.highlights.defaultHighlight": {
    "icon": "alert",
    "type": "text",
    "foreground": "red",
    "background": "white",
    "opacity": 50,
    "iconColour": "blue"
},
"todo-tree.highlights.customHighlight": {
    "TODO": {
        "icon": "check",
        "type": "line"
    },
    "FIXME": {
        "foreground": "black",
        "iconColour": "yellow",
        "gutterIcon": true
    }
}
```

*Note: The highlight configuration is separate from the settings for the search. Adding settings in `customHighlight` does not automatically add the tags into `todo-tree.general.tags`.*

## Installing

You can install the latest version of the extension via the Visual Studio Marketplace [here](https://marketplace.visualstudio.com/items?itemName=Gruntfuggly.todo-tree).

Alternatively, open Visual Studio code, press `Ctrl+P` or `Cmd+P` and type:

    > ext install Gruntfuggly.todo-tree

*Note: Don't forget to reload the window to activate the extension!*

### Source Code

The source code is available on GitHub [here](https://github.com/Gruntfuggly/todo-tree).

## Controls

The tree view header can contain the following buttons:

![collapse](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/collapse.png) - Collapse all tree nodes<br>
![expand](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/expand.png) - Expand all tree nodes<br>
![flat](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/flat.png) - Show the tree view as a flat list, with the full filename for each TODO<br>
![tags](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/tags.png) - Show the view as a list of tags<br>
![tree](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/tree.png) - Show the tree view as a tree with expandable nodes for each folder (default)<br>
![tag](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/tag.png) - Group the TODOs in the tree by the tag<br>
![notag](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/notag.png) - Organise the TODOs by file (default)<br>
![filter](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/filter.png) - Only show items in the tree which match the entered filter text<br>
![clear-filter](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/clear-filter.png) - Remove any active filter<br>
![refresh](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/refresh.png) - Rebuild the tree<br>
![scan-open-files](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/scan-open-files.png) - Show tags from open files only<br>
![scan-current-file](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/scan-current-file.png) - Show tags from the current file<br>
![scan-workspace](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/scan-workspace-only.png) - Show tags from workspace only<br>
![scan-workspace](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/scan-workspace.png) - Show tags from workspace and open files<br>
![reveal](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/reveal.png) - Show the current file in the tree<br>
![export](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/export.png) - Export the tree content to a file<br>

## Folder Filter Context Menu

Right clicking on a folder in the tree will bring up a context menu with the following options:

**Hide This Folder** - removes the folder from the tree

**Only Show This Folder** - remove all other folders and subfolders from the tree

**Only Show This Folder And Subfolders** - remove other folders from the tree, but keep subfolders

**Reset Folder Filter** - reset any folders previously filtered using the above

*Note: The current filters are shown in the debug log. Also, the filter can always be reset by right clicking the **Nothing Found** item in the tree. If your tree becomes invisible because everything is filtered and `hideTreeWhenEmpty` is set to true, you can reset the filter by pressing **F1** and selecting the **Todo Tree: Reset Folder Filter** command.*

## Commands

### Tags

To make it easier to configure the tags, there are two commands available:

**Todo Tree: Add Tag** - allows entry of a new tag for searching

**Todo Tree: Remove Tag** - shows a list of current tags which can be selected for removing

*Note: The Remove Tag command can be used to show current tags - just press Escape or Enter with out selecting any to close it.*

### Export

The contents of the tree can be exported using **Todo Tree: Export Tree**. A read-only file will be created using the path specified with `todo-tree.general.exportPath`. The file can be saved using **File: Save As...**. Note: Currently **File: Save** does not work which seems to be a VSCode bug (see <https://github.com/microsoft/vscode/issues/101952>).

## Configuration

The extension can be customised as follows (default values in brackets):

**todo-tree.general.debug** (`false`)<br/>
Show a debug channel in the output view.

**todo-tree.general.enableFileWatcher** (`false`)<br/>
Set this to true to turn on automatic updates when files in the workspace are created, changed or deleted.

**todo-tree.general.exportPath** (`~/todo-tree-%Y%m%d-%H%M.txt`)<br/>
Path to use when exporting the tree. Environment variables will be expanded, e.g `${HOME}` and the path is passed through strftime (see <https://github.com/samsonjs/strftime>). Set the extension to `.json` to export as a JSON record.

**todo-tree.general.rootFolder** (`""`)<br/>
By default, any open workspaces will have a tree in the view. Use this to force another folder to be the root of the tree. You can include environment variables and also use ${workspaceFolder}. e.g.<br/>
`"todo-tree.general.rootFolder": "${workspaceFolder}/test"`<br/>
or<br/>
`"todo-tree.general.rootFolder": "${HOME}/project"`.<br/>
*Note: Other open files (outside of the rootFolder) will be shown (as they are opened) with their full path in brackets.*

**todo-tree.general.tags** (`["TODO","FIXME","BUG"]`)<br/>
This defines the tags which are recognised as TODOs. This list is automatically inserted into the regex.

**todo-tree.general.tagGroups** (`{}`)<br/>
This setting allows multiple tags to be treated as a single group. Example:

```json
    "todo-tree.general.tagGroups": {
        "FIXME": [
            "FIXME",
            "FIXIT",
            "FIX",
        ]
    },
```

This treats any of `FIXME`, `FIXIT` or `FIX` as `FIXME`. When the tree is grouped by tag, all of these will appear under the `FIXME` node. This also means that custom highlights are applied to the group, not each tag type. *Note: all tags in the group should also appear in `todo-tree.general.tags`.*

**todo-tree.general.revealBehaviour** (`start of todo`)<br/>
Change the cursor behaviour when selecting a todo from the explorer. Yo.u can choose from: `start of todo` (moves the cursor to the beginning of the todo), `end of todo` (moves the cursor to the end of the todo) `highlight todo` (selects the todo text), `start of line` (moves the cursor to the start of the line) and `highlight line` (selected the whole line)

**todo-tree.general.statusBar** (`none`)<br/>
What to show in the status bar - nothing (`none`), total count (`total`), counts per tag (`tags`), counts for the top three tags (`top three`) or counts for the current file only (`current file`).

**todo-tree.general.statusBarClickBehaviour** (`cycle`)<br/>
Set the behaviour of clicking the status bar to either cycle display formats, or reveal the tree.

**todo-tree.filtering.includeGlobs** (`[]`)<br/>
Globs for use in limiting search results by inclusion, e.g. `[\"**/unit-tests/*.js\"]` to only show .js files in unit-tests subfolders. [Globs help](https://code.visualstudio.com/api/references/vscode-api#GlobPattern). *Note: globs paths are absolute - not relative to the current workspace.*

**todo-tree.filtering.excludeGlobs** (`[]`)<br/>
Globs for use in limiting search results by exclusion (applied after **includeGlobs**), e.g. `[\"**/*.txt\"]` to ignore all .txt files

**todo-tree.filtering.includedWorkspaces** (`[]`)<br/>
A list of workspace names to include as roots in the tree (wildcards can be used). An empty array includes all workspace folders.

**todo-tree.filtering.excludedWorkspaces** (`[]`)<br/>
A list of workspace names to exclude as roots in the tree (wildcards can be used).

**todo-tree.filtering.passGlobsToRipgrep** (`true`)<br/>
Set this to false to apply the globs *after* the search (legacy behaviour).

**todo-tree.filtering.useBuiltInExcludes** (`none`)<br/>
Set this to use VSCode's built in files or search excludes. Can be one of `none`, `file excludes` (uses Files:Exclude), `search excludes` (Uses Search:Exclude) or `file and search excludes` (uses both).

**todo-tree.filtering.ignoreGitSubmodules** (`false`)<br/>
If true, any subfolders containing a `.git` file will be ignored when searching.

**todo-tree.filtering.includeHiddenFiles** (`false`)<br/>
If true, files starting with a period (.) will be included.

**todo-tree.highlights.enabled** (`true`)<br/>
Set this to false to turn off highlighting.

**todo-tree.highlights.highlightDelay** (`500`)<br/>
The delay before highlighting (milliseconds).

**todo-tree.highlights.defaultHighlight** (`{}`)<br/>
Set default highlights. Example:

```json
{
    "foreground": "white",
    "background": "red",
    "icon": "check",
    "type": "text"
}
```

**todo-tree.highlights.customHighlight** (`{}`)<br/>
Set highlights per tag (or tag group). Example:

```json
{
    "TODO": {
        "foreground": "white",
        "type": "text"
    },
    "FIXME": {
        "icon": "beaker"
    }
}
```

**todo-tree.highlights.schemes** (`['file','untitled']`)<br/>
Editor schemes to show highlights in. To show highlights in settings files, for instance, add `vscode-userdata` or for output windows, add `output`.

**todo-tree.highlights.useColourScheme** (`false`)<br/>
Use a simple scheme for colouring highlights. This will simply apply a list of colours in the same order as the tags are defined. Use this as a much simpler alternative to setting up custom highlights for each tag. *Note: The colour scheme overrides the colours defined in* `todo-tree.highlights.defaultHighlight` *but not* `todo-tree.highlights.customHighlight`*.*

**todo-tree.highlights.backgroundColourScheme** (`["red","orange","yellow","green","blue","indigo","violet"]`)<br/>
Defines colours for use in conjunction with `todo-tree.highlights.useColourScheme` to colour highlights. Colours can be defined in the same way as other colours (e.g. hex code, theme names, etc.). If there are more tags than colours, the sequence is repeated.

**todo-tree.highlights.foreroundColourScheme** (`["white","black","black","white","white","white","black"]`)<br/>
Defines colours for use in conjunction with `todo-tree.highlights.backgroundColourScheme` to colour highlights. These colours should be complementary to the background colours.

**todo-tree.regex.regex** (<tt>&#x22;&#x28;&#x28;&#x2f;&#x2f;&#x7c;&#x23;&#x7c;&#x3c;&#x21;&#x2d;&#x2d;&#x7c;&#x3b;&#x7c;&#x2f;&#x5c;&#x5c;&#x2a;&#x29;&#x5c;&#x5c;&#x73;&#x2a;&#x28;&#x24;&#x54;&#x41;&#x47;&#x53;&#x29;&#x7c;&#x5e;&#x5c;&#x5c;&#x73;&#x2a;&#x2d;&#x20;&#x5c;&#x5c;&#x5b;&#x20;&#x5c;&#x5c;&#x5d;&#x29;&#x22;</tt>)<br/>
This defines the regex used to locate TODOs. By default, it searches for tags in comments starting with <tt>&#47;&#47;</tt>, <tt>#</tt>, <tt>;</tt>, <tt>&lt;!--</tt> or <tt>&#47;*</tt>. This should cover most languages. However if you want to refine it, make sure that the <tt>($TAGS)</tt> is kept as <tt>($TAGS)</tt> will be replaced by the expanded tag list. For some of the extension features to work, <tt>($TAGS)</tt> should be present in the regex, however, the basic functionality should still work if you need to explicitly expand the tag list. The second part of the expression allows matching of Github markdown task lists. *Note: This is a [Rust regular expression](https://docs.rs/regex/1.0.0/regex)</a>, not javascript.*

**todo-tree.regex.regexCaseSensitive** (`true`)<br/>
Set to false to allow tags to be matched regardless of case.

**todo-tree.ripgrep.ripgrep** (`""`)<br/>
Normally, the extension will locate ripgrep itself as and when required. If you want to use an alternate version of ripgrep, set this to point to wherever it is installed.

**todo-tree.ripgrep.ripgrepArgs** (`"--max-columns=1000"`)<br/>
Use this to pass additional arguments to ripgrep. e.g. `"-i"` to make the search case insensitive. *Use with caution!*

**todo-tree.ripgrep.ripgrepMaxBuffer** (`200`)<br/>
By default, the ripgrep process will have a buffer of 200KB. However, this is sometimes not enough for all the tags you might want to see. This setting can be used to increase the buffer size accordingly.

**todo-tree.ripgrep.usePatternFile** (`true`)<br/>
A pattern file is used with ripgrep by default. If you experience issues with deleting the pattern file, set this to false to use the legacy method of providing the regex to ripgrep.

**todo-tree.tree.hideTreeWhenEmpty** (`true`)<br/>
Normally, the tree is removed from the explorer view if nothing is found. Set this to false to keep the view present.
*NOTE: This setting is currently disabled due to a bug in VSCode. It will be re-enabled after the January release.*

**todo-tree.tree.filterCaseSensitive** (`false`)<br/>
Use this if you need the filtering to be case sensitive. *Note: this does not the apply to the search*.

**todo-tree.tree.trackFile** (`true`)<br/>
Set to false if you want to prevent tracking the open file in the tree view.

**todo-tree.tree.showBadges** (`true`)<br/>
Set to false to disable SCM status and badges in the tree. Note: This also unfortunately turns off themed icons.

**todo-tree.tree.expanded<sup>*</sup>** (`false`)<br/>
Set to true if you want new views to be expanded by default.

**todo-tree.tree.flat<sup>*</sup>** (`false`)<br/>
Set to true if you want new views to be flat by default.

**todo-tree.tree.grouped<sup>*</sup>** (`false`)<br/>
Set to true if you want new views to be grouped by default.

**todo-tree.tree.tagsOnly<sup>*</sup>** (`false`)<br/>
Set to true if you want new views with tags only by default.

**todo-tree.tree.sortTagsOnlyViewAlphabetically** (`false`)<br/>
Sort items in the tags only view alphabetically instead of by file and line number.

**todo-tree.tree.showCountsInTree** (`false`)<br/>
Set to true to show counts of TODOs in the tree.

**todo-tree.tree.labelFormat** (`${tag} ${after}`)<br/>
Format of the TODO item labels. Available placeholders are `${line}`, `${column}`, `${tag}`, `${before}` (text from before the tag), `${after}` (text from after the tag), `${filename}`, `${filepath}` and `${afterOrBefore}` (use "after" text or "before" text if after is empty).

**todo-tree.tree.scanMode** (`workspace`)<br/>
By default the extension scans the whole workspace (`workspace`). Use this to limit the search to only open files (`open files`) or only the current file (`current file`).

**todo-tree.tree.showScanModeButton** (`false`)<br/>
Show a button on the tree view header to switch the scanMode (see above).

**todo-tree.tree.hideIconsWhenGroupedByTag** (`false`)<br/>
Hide item icons when grouping by tag.

**todo-tree.tree.sort** (`true`)<br/>
ripgrep searches using multiple threads to improve performance. The tree is sorted when it is populated so that it stays stable. If you want to use ripgrep's own sort arguments, set this to false. *Note: Depending on what scan mode you select, you may also want to disable auto-refresh when disabling the sort, otherwise the tree may still be unstable.*

**todo-tree.tree.disableCompactFolders** (`false`)<br/>
The tree will normally respect the VSCode's `explorer.compactFolders` setting. Set this to true if you want to disable compact folders in the todo tree.

**todo-tree.tree.tooltipFormat** (`${filepath}, ${line}`)</br>
Format of the tree item tooltips. Uses the same placeholders as `todo-tree.tree.labelFormat` (see above).

**todo-tree.tree.buttons.reveal** (`true`)<br/>
Show a button in the tree view title bar to reveal the current item (only when track file is not enabled).

**todo-tree.tree.buttons.scanMode** (`false`)<br/>
Show a button in the tree view title bar to change the Scan Mode setting.

**todo-tree.tree.buttons.viewStyle** (`true`)<br/>
Show a button in the tree view title bar to change the view style (tree, flat or tags only).

**todo-tree.tree.buttons.groupByTag** (`true`)<br/>
Show a button in the tree view title bar to enable grouping items by tag.

**todo-tree.tree.buttons.filter** (`true`)<br/>
Show a button in the tree view title bar allowing the tree to be filtered by entering some text.

**todo-tree.tree.buttons.refresh** (`true`)<br/>
Show a refresh button in the tree view title bar.

**todo-tree.tree.buttons.expand** (`true`)<br/>
Show a button in the tree view title bar to expand or collapse the whole tree.

**todo-tree.tree.buttons.export** (`false`)<br/>
Show a button in the tree view title bar to create a text file showing the tree content.

<sup>*</sup>*Only applies to new workspaces. Once the view has been changed in the workspace, the current state is stored.*

### Multiline TODOs

If the regex contains `\n`, then multiline TODOs will be enabled. In this mode, the search results are processed slightly differently. If results are found which do not contain any tags from `todo-tree.general.tags` it will be assumed that they belong to the previous result that did have a tag. For example, if you set the regex to something like:

```json
"todo-tree.regex.regex": "(//)\\s*($TAGS).*(\\n\\s*//\\s{2,}.*)*"
```

This will now match multiline TODOs where the extra lines have at least two spaces between the comment characters and the TODO item. e.g.

```json
// TODO multiline example
//  second line
//  third line
```

If you want to match multiline TODOs in C++ style multiline comment blocks, you'll need something like:

```json
"todo-tree.regex.regex": "(/\\*)\\s*($TAGS).*(\\n\\s*(//|/\\*|\\*\\*)\\s{2,}.*)*"
```

which should match:

```json
/* TODO multiline example
**  second line
**  third line
*/
```

*Note: If you are modifying settings using the settings GUI, you don't need to escape each backslash.*

**Warning: Multiline TODOs will not work with markdown TODOs and may have other unexpected results. There may also be a reduction in performance.**

### Excluding files and folders

To restrict the set of folders which is searched, you can define `todo-tree.filtering.includeGlobs`. This is an array of globs which the search results are matched against. If the results match any of the globs, they will be shown. By default the array is empty, which matches everything. See [here](https://code.visualstudio.com/api/references/vscode-api#GlobPattern) for more information on globs. *Note: globs paths are absolute - not relative to the current workspace.*

To exclude folders/files from your search you can define `todo-tree.filtering.excludeGlobs`. If the search results match any of these globs, then the results will be ignored.

You can also include and exclude folders from the tree using the context menu. This folder filter is applied separately to the include/exclude globs.

*Note: By default, ripgrep ignores files and folders from your `.gitignore` or `.ignore` files. If you want to include these files, set* `todo-tree.ripgrep.ripgrepArgs` *to* `--no-ignore`.

## Known Issues

Grouping by tag will only work when your configuration defines the tags using the `todo-tree.general.tags` setting. Older versions of the extension had the tags directly defined in the `todo-tree.regex.regex` whereas now, the regex replaces **$TAGS** with the contents of `todo-tree.general.tags`.

Grouping by tag doesn't work for markdown task list items as there is no tag to group with. The tree will show the files alongside the tag groups.

Tracking the file in the tree view when grouping by tag will reveal the first tag found.

When there is no current workspace, default icons will be shown in the tree.

## Donate

If you find this extension useful, please feel free to donate [here](https://paypal.me/Gruntfuggly). Thanks!

### Credits

Uses a modified version of [ripgrep-js](https://www.npmjs.com/package/ripgrep-js).

Main icons originally made by [Freepik](http://www.freepik.com) from [www.flaticon.com](https://www.flaticon.com/) is licensed by [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)

Tree view icons made by [Vaadin](https://www.flaticon.com/authors/vaadin) from [www.flaticon.com](https://www.flaticon.com/) is licensed by [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)

Tag icons made by [Dave Gandy](https://www.flaticon.com/authors/dave-gandy) from [www.flaticon.com](https://www.flaticon.com/) is licensed by [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)

Tags Icon made by [Vectors Market](https://www.flaticon.com/authors/vectors-market) from [www.flaticon.com](https://www.flaticon.com/) is licensed by [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)

Reveal Icon made by [Gregor Cresnar](https://www.flaticon.com/authors/gregor-cresnar) from [www.flaticon.com](https://www.flaticon.com/)

Lots of the icons have now been updated by [johnletey](https://github.com/johnletey) to match the new VS Code 1.37.0 GUI. Much appreciated!

#### Translations

Simplified Chinese translation by [loniceras](https://github.com/loniceras).
