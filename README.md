# Todo Tree

[![Build Status](https://travis-ci.org/Gruntfuggly/todo-tree.svg?branch=master)](https://travis-ci.org/Gruntfuggly/todo-tree)

This extension quickly searches (using [ripgrep](https://github.com/BurntSushi/ripgrep)) your workspace for comment tags like TODO and FIXME, and displays them in a tree view in the explorer pane. Clicking a TODO within the tree will open the file and put the cursor on the line containing the TODO.

Found TODOs can also be highlighted in open files.

*Please see the [wiki](https://github.com/Gruntfuggly/todo-tree/wiki/Configuration-Examples) for configuration examples.*

![screenshot](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/screenshot.png)

*Notes:*

- *User* `rg.conf` *files are ignored.*

## Highlighting

>*New!:* If you just want to set different colours for tags, you can now enable `todo-tree.highlights.useColourScheme`. This will apply a set of colours (which can be changed) to the tags in the order that they are defined.

Highlighting tags is configurable. Use `defaultHighlight` to set up highlights for all tags. If you need to configure individual tags differently, use `customHighlight`. If settings are not specified in `customHighlight`, the value from `defaultHighlight` is used.

Custom highlights can also be specified for sub tags (if used).

<sup>*Note: `defaultHighlight` is not applied to sub tags.*</sup>

Both `defaultHighlight` and `customHighlight` allow for the following settings:

`foreground` - used to set the foreground colour of the highlight in the editor and the marker in the ruler.

`background` - used to set the background colour of the highlight in the editor.

<sup>*Note: Foreground and background colours can be specified using [HTML/CSS colour names](https://en.wikipedia.org/wiki/Web_colors) (e.g. "Salmon"), RGB hex values (e.g. "#80FF00"), RGB CSS style values (e.g. "rgb(255,128,0)" or colours from the current theme, e.g. `peekViewResult.background`. See [Theme Color](https://code.visualstudio.com/api/references/theme-color) for the details. Hex and RGB values can also have an alpha specified, e.g. "#ff800080" or "rgba(255,128,0,0.5)".*</sup>

`opacity` - percentage value used with the background colour. 100% will produce an opaque background which will obscure selection and other decorations.

<sup>*Note: opacity can only be specified when hex or RGB colours are used.*</sup>

`fontWeight`, `fontStyle`, `textDecoration` - can be used to style the highlight with standard CSS values.

`borderRadius` - used to set the border radius of the background of the highlight.

`icon` - used to set a different icon in the tree view. Must be a valid octicon (see <https://octicons.github.com>) or codicon (see <https://microsoft.github.io/vscode-codicons/dist/codicon.html>). If using codicons, specify them in the format "$(*icon*)". The icon defaults to a tick if it's not valid. You can also use "todo-tree", or "todo-tree-filled" if you want to use the icon from the activity view.

`iconColour` - used to set the colour of the icon in the tree. If not specified, it will try to use the foreground colour or the background colour. Colour can be specified as per foreground and background colours, but see note below.

<sup>*Note: Theme colours are only supported when using codicons. Hex, RGB and HTML colours are only supported when using octicons or the default icon.*</sup>

`gutterIcon` - set to true to show the icon in the editor gutter.

<sup>*Note: Unfortunately, only octicons and the todo-tree icon can be displayed in the gutter.*</sup>

`rulerColour` - used to set the colour of the marker in the overview ruler. If not specified, it will default to use the foreground colour. Colour can be specified as per foreground and background colours.

`rulerOpacity` - used to set the opacity of the ruler markers.

<sup>*Note: Only works with hex and RGB colour settings.*</sup>

`rulerLane` - used to set the lane for the marker in the overview ruler. If not specified, it will default to the right hand lane. Use one of "left", "center", "right", or "full". You can also use "none" to disable the ruler markers.

`type` - used to control how much is highlighted in the editor. Valid values are:

- `tag` - highlights just the tag
- `text` - highlights the tag and any text after the tag
- `tag-and-comment` - highlights the comment characters (or the start of the match) and the tag
- `tag-and-subTag` - as above, but allows the sub tag to be highlight too (with colours defined in custom highlights)
- `text-and-comment` - highlights the comment characters (or the start of the match), the tag and the text after the tag
- `line` - highlights the entire line containing the tag
- `whole-line` - highlights the entire line containing the tag to the full width of the editor
- `capture-groups:n,m...` - highlights capture groups from the regex, where 'n' is the index into the regex

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

<sup>*Note: The highlight configuration is separate from the settings for the search. Adding settings in `customHighlight` does not automatically add the tags into `todo-tree.general.tags`.*</sup>

<sup>*Note: Using the `capture-groups` setting in `type` may have an impact on performance with large files.

## Installing

You can install the latest version of the extension via the Visual Studio Marketplace [here](https://marketplace.visualstudio.com/items?itemName=Gruntfuggly.todo-tree).

Alternatively, open Visual Studio code, press `Ctrl+P` or `Cmd+P` and type:

> ext install Gruntfuggly.todo-tree

### Source Code

The source code is available on GitHub [here](https://github.com/Gruntfuggly/todo-tree).

## Controls

The tree view header can contain the following buttons:

![collapse](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/collapse.png) - Collapse all tree nodes</br>
![expand](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/expand.png) - Expand all tree nodes</br>
![flat](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/flat.png) - Show the tree view as a flat list, with the full filename for each TODO</br>
![tags](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/tags.png) - Show the view as a list of tags</br>
![tree](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/tree.png) - Show the tree view as a tree with expandable nodes for each folder (default)</br>
![tag](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/tag.png) - Group the TODOs in the tree by the tag</br>
![notag](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/notag.png) - Organise the TODOs by file (default)</br>
![filter](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/filter.png) - Only show items in the tree which match the entered filter text</br>
![clear-filter](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/clear-filter.png) - Remove any active filter</br>
![refresh](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/refresh.png) - Rebuild the tree</br>
![scan-open-files](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/scan-open-files.png) - Show tags from open files only</br>
![scan-current-file](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/scan-current-file.png) - Show tags from the current file</br>
![scan-workspace](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/scan-workspace-only.png) - Show tags from workspace only</br>
![scan-workspace](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/scan-workspace.png) - Show tags from workspace and open files</br>
![reveal](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/reveal.png) - Show the current file in the tree</br>
![export](https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/button-icons/export.png) - Export the tree content to a file</br>

## Folder Filter Context Menu

Right clicking in the tree view will bring up a context menu with the following options:

**Hide This Folder/Hide This File** - removes the folder or file from the tree</br>
**Only Show This Folder** - remove all other folders and subfolders from the tree</br>
**Only Show This Folder And Subfolders** - remove other folders from the tree, but keep subfolders</br>
**Reset Folder Filter** - reset any folders previously filtered using the above</br>
**Toggle Badges** - enable/disable SCM decorations</br>
**Toggle Compact Folders** - enable/disable compressed folder names</br>
**Toggle Item Counts** - enable/disable counts of tags</br>
**Scan Open Files Only** - show TODOs from files open in VSCode (no search)</br>
**Scan Current File Only** - show TODOs from the current open file only</br>
**Scan Workspace And Open Files** - show TODOs from the workspace and any open files</br>
**Scan Workspace Only** - show TODOs from the workspace only (requires manual refres or use of the file watcher)</br>
**Expand Tree/Collapse Tree** - expand or collapse the whole tree
**Show Tree View/Show Flat View/Show Tags Only View** - change the tree view style
**Group by Tag/Ungroup by Tag** - toggle grouping of items by tag
**Group by Sub Tag/Ungroup by Sub Tag** - toggle grouping of items by sub tag
**Export Tree** - dump the tree contents into a file
**Reveal Current File in Tree** - show the current editor file in tree (if present)

<sup>*Note: The current filters are shown in the debug log. Also, the filter can always be reset by right clicking the **Nothing Found** item in the tree. If your tree becomes invisible because everything is filtered and `hideTreeWhenEmpty` is set to true, you can reset the filter by pressing **F1** and selecting the **Todo Tree: Reset Folder Filter** command.*</sup>

## Commands

### Tags

To make it easier to configure the tags, there are two commands available:

**Todo Tree: Add Tag** - allows entry of a new tag for searching

**Todo Tree: Remove Tag** - shows a list of current tags which can be selected for removing

<sup>*Note: The Remove Tag command can be used to show current tags - just press Escape or Enter with out selecting any to close it.*</sup>

### Export

The contents of the tree can be exported using **Todo Tree: Export Tree**. A read-only file will be created using the path specified with `todo-tree.general.exportPath`. The file can be saved using **File: Save As...**. *Note: Currently **File: Save** does not work which seems to be a VSCode bug (see <https://github.com/microsoft/vscode/issues/101952>).*

### Switch Scope

**Todo Tree: Switch Scope** - shows a list of configured scopes which can be selected

## Configuration

The extension can be customised as follows (default values in brackets):

**todo-tree.general.debug** (`false`)</br>
Show a debug channel in the output view.

**todo-tree.general.enableFileWatcher** (`false`)</br>
Set this to true to turn on automatic updates when files in the workspace are created, changed or deleted.

**todo-tree.general.exportPath** (`~/todo-tree-%Y%m%d-%H%M.txt`)</br>
Path to use when exporting the tree. Environment variables will be expanded, e.g `${HOME}` and the path is passed through strftime (see <https://github.com/samsonjs/strftime>). Set the extension to `.json` to export as a JSON record.

**todo-tree.general.rootFolder** (`""`)</br>
By default, any open workspaces will have a tree in the view. Use this to force another folder to be the root of the tree. You can include environment variables and also use ${workspaceFolder}. e.g.</br>
`"todo-tree.general.rootFolder": "${workspaceFolder}/test"`</br>
or</br>
`"todo-tree.general.rootFolder": "${HOME}/project"`.</br>


<sup>*Note: Other open files (outside of the rootFolder) will be shown (as they are opened) with their full path in brackets.*</sup>

**todo-tree.general.schemes** (`['file','ssh','untitled']`)</br>
Editor schemes to find TODOs in. To find TODOs in settings files, for instance, add `vscode-userdata` or for output windows, add `output`.

**todo-tree.general.tags** (`["TODO","FIXME","BUG"]`)</br>
This defines the tags which are recognised as TODOs. This list is automatically inserted into the regex.

**todo-tree.general.tagGroups** (`{}`)</br>
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

This treats any of `FIXME`, `FIXIT` or `FIX` as `FIXME`. When the tree is grouped by tag, all of these will appear under the `FIXME` node. This also means that custom highlights are applied to the group, not each tag type.

<sup>*Note: all tags in the group should also appear in `todo-tree.general.tags`.*</sup>

**todo-tree.general.revealBehaviour** (`start of todo`)</br>
Change the cursor behaviour when double-clicking a todo in the tree. You can choose from: `start of todo` (moves the cursor to the beginning of the todo), `end of todo` (moves the cursor to the end of the todo) or `start of line` (moves the cursor to the start of the line).

**todo-tree.general.statusBar** (`none`)</br>
What to show in the status bar - nothing (`none`), total count (`total`), counts per tag (`tags`), counts for the top three tags (`top three`) or counts for the current file only (`current file`).

**todo-tree.general.statusBarClickBehaviour** (`reveal`)</br>
Set the behaviour of clicking the status bar to either cycle through the status bar display formats (`cycle`), reveal the tree (`reveal`) or to toggle highlights (`toggle highlights`).

**todo-tree.filtering.includeGlobs** (`[]`)</br>
Globs for use in limiting search results by inclusion, e.g. `[\"**/unit-tests/*.js\"]` to only show .js files in unit-tests subfolders. [Globs help](https://code.visualstudio.com/api/references/vscode-api#GlobPattern).

<sup>*Note: globs paths are absolute - not relative to the current workspace.*</sup>

**todo-tree.filtering.excludeGlobs** (`["**/node_modules"]`)</br>
Globs for use in limiting search results by exclusion (applied after **includeGlobs**), e.g. `[\"**/*.txt\"]` to ignore all .txt files.

<sup>*Note: `node_modules` are excluded by default.*</sup>

**todo-tree.filtering.includedWorkspaces** (`[]`)</br>
A list of workspace names to include as roots in the tree (wildcards can be used). An empty array includes all workspace folders.

**todo-tree.filtering.excludedWorkspaces** (`[]`)</br>
A list of workspace names to exclude as roots in the tree (wildcards can be used).

**todo-tree.filtering.passGlobsToRipgrep** (`true`)</br>
Set this to false to apply the globs *after* the search (legacy behaviour).

**todo-tree.filtering.useBuiltInExcludes** (`none`)</br>
Set this to use VSCode's built in files or search excludes. Can be one of `none`, `file excludes` (uses Files:Exclude), `search excludes` (Uses Search:Exclude) or `file and search excludes` (uses both).

**todo-tree.filtering.ignoreGitSubmodules** (`false`)</br>
If true, any subfolders containing a `.git` file will be ignored when searching.

**todo-tree.filtering.includeHiddenFiles** (`false`)</br>
If true, files starting with a period (.) will be included.

**todo-tree.highlights.enabled** (`true`)</br>
Set this to false to turn off highlighting.

**todo-tree.highlights.highlightDelay** (`500`)</br>
The delay before highlighting (milliseconds).

**todo-tree.highlights.defaultHighlight** (`{}`)</br>
Set default highlights. Example:

```json
{
    "foreground": "white",
    "background": "red",
    "icon": "check",
    "type": "text"
}
```

**todo-tree.highlights.customHighlight** (`{}`)</br>
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

**todo-tree.highlights.useColourScheme** (`false`)</br>
Use a simple scheme for colouring highlights. This will simply apply a list of colours in the same order as the tags are defined. Use this as a much simpler alternative to setting up custom highlights for each tag.

<sup>*Note: The colour scheme overrides the colours defined in* `todo-tree.highlights.defaultHighlight` *but not* `todo-tree.highlights.customHighlight`*.*</sup>

**todo-tree.highlights.backgroundColourScheme** (`["red","orange","yellow","green","blue","indigo","violet"]`)</br>
Defines colours for use in conjunction with `todo-tree.highlights.useColourScheme` to colour highlights. Colours can be defined in the same way as other colours (e.g. hex code, theme names, etc.). If there are more tags than colours, the sequence is repeated.

**todo-tree.highlights.foreroundColourScheme** (`["white","black","black","white","white","white","black"]`)</br>
Defines colours for use in conjunction with `todo-tree.highlights.backgroundColourScheme` to colour highlights. These colours should be complementary to the background colours.

**todo-tree.regex.enableMultiLine** (`false`)</br>
Normally, multiline support is enabled by detecting the use of `\n` in the regex. Set this to `true`, to enable multiline support by default. This allows the use of `[\s\S]` as an alternative to matching any character including newlines.

**todo-tree.regex.regex** (<tt>&#x22;&#x28;&#x28;&#x2f;&#x2f;&#x7c;&#x23;&#x7c;&#x3c;&#x21;&#x2d;&#x2d;&#x7c;&#x3b;&#x7c;&#x2f;&#x5c;&#x5c;&#x2a;&#x29;&#x5c;&#x5c;&#x73;&#x2a;&#x28;&#x24;&#x54;&#x41;&#x47;&#x53;&#x29;&#x7c;&#x5e;&#x5c;&#x5c;&#x73;&#x2a;&#x2d;&#x20;&#x5c;&#x5c;&#x5b;&#x20;&#x5c;&#x5c;&#x5d;&#x29;&#x22;</tt>)</br>
This defines the regex used to locate TODOs. By default, it searches for tags in comments starting with <tt>&#47;&#47;</tt>, <tt>#</tt>, <tt>;</tt>, <tt>&lt;!--</tt> or <tt>&#47;*</tt>. This should cover most languages. However if you want to refine it, make sure that the <tt>($TAGS)</tt> is kept as <tt>($TAGS)</tt> will be replaced by the expanded tag list. For some of the extension features to work, <tt>($TAGS)</tt> should be present in the regex, however, the basic functionality should still work if you need to explicitly expand the tag list. The second part of the expression allows matching of Github markdown task lists.

<sup>*Note: This is a [Rust regular expression](https://docs.rs/regex/1.0.0/regex)</a>, not javascript.*</sup>

**todo-tree.regex.subTagRegex**
This is a regular expression for processing the text to the right of the tag, e.g. for extracting a sub tag, or removing unwanted characters. Anything that the regex matches will be removed from the text. If a capture group is included, the contents are extracted into a sub tag, which will be used in the tree to group similar tags. The sub tag can also be used as a placeholder in `todo-tree.tree.subTagClickUrl` and `todo-tree.tree.labelFormat`. Sub tags can also be highlighted by specifying a section in the `todo-tree.highlights.customHighlights` setting. To highlight the sub tag itself, set "type" to "tag-and-subTag" in custom highlights for the tag.

Examples:

`"^:\s*"` can be used to remove colons from immediately after tags.

`"^\s*\((.*)\)"` can be used to extract anything in parentheses after the tag and use it as a sub tag.

**todo-tree.regex.regexCaseSensitive** (`true`)</br>
Set to false to allow tags to be matched regardless of case.

**todo-tree.ripgrep.ripgrep** (`""`)</br>
Normally, the extension will locate ripgrep itself as and when required. If you want to use an alternate version of ripgrep, set this to point to wherever it is installed.

**todo-tree.ripgrep.ripgrepArgs** (`"--max-columns=1000"`)</br>
Use this to pass additional arguments to ripgrep. e.g. `"-i"` to make the search case insensitive. *Use with caution!*

**todo-tree.ripgrep.ripgrepMaxBuffer** (`200`)</br>
By default, the ripgrep process will have a buffer of 200KB. However, this is sometimes not enough for all the tags you might want to see. This setting can be used to increase the buffer size accordingly.

**todo-tree.ripgrep.usePatternFile** (`true`)</br>
A pattern file is used with ripgrep by default. If you experience issues with deleting the pattern file, set this to false to use the legacy method of providing the regex to ripgrep.

**todo-tree.tree.hideTreeWhenEmpty** (`true`)</br>
Normally, the tree is removed from the explorer view if nothing is found. Set this to false to keep the view present.

**todo-tree.tree.filterCaseSensitive** (`false`)</br>
Use this if you need the filtering to be case sensitive.

<sup>*Note: this does not the apply to the search*.</sup>

**todo-tree.tree.trackFile** (`true`)</br>
Set to false if you want to prevent tracking the open file in the tree view.

**todo-tree.tree.showBadges** (`true`)</br>
Set to false to disable SCM status and badges in the tree. *

<sup>*Note: This also unfortunately turns off themed icons.*</sup>

**todo-tree.tree.expanded<sup>*</sup>** (`false`)</br>
Set to true if you want new views to be expanded by default.

**todo-tree.tree.flat<sup>*</sup>** (`false`)</br>
Set to true if you want new views to be flat by default.

**todo-tree.tree.grouped<sup>*</sup>** (`false`)</br>
Set to true if you want new views to be grouped by default.

**todo-tree.tree.tagsOnly<sup>*</sup>** (`false`)</br>
Set to true if you want new views with tags only by default.

**todo-tree.tree.sortTagsOnlyViewAlphabetically** (`false`)</br>
Sort items in the tags only view alphabetically instead of in order of the tags list.

**todo-tree.tree.showCountsInTree** (`false`)</br>
Set to true to show counts of TODOs in the tree.

**todo-tree.tree.labelFormat** (`${tag} ${after}`)</br>
Format of the TODO item labels. Available placeholders are `${line}`, `${column}`, `${tag}`, `${before}` (text from before the tag), `${after}` (text from after the tag), `${filename}`, `${filepath}` and `${afterOrBefore}` (use "after" text or "before" text if after is empty). When using `${tag}` or `${subTag}` you can also transform the text with "uppercase", "lowercase" or "capitalize", e.g. `${tag:lowercase}`.

**todo-tree.tree.scanMode** (`workspace`)</br>
By default the extension scans the whole workspace (`workspace`). Use this to limit the search to only open files (`open files`) or only the current file (`current file`).

**todo-tree.tree.showScanModeButton** (`false`)</br>
Show a button on the tree view header to switch the scanMode (see above).

**todo-tree.tree.hideIconsWhenGroupedByTag** (`false`)</br>
Hide item icons when grouping by tag.

**todo-tree.tree.sort** (`true`)</br>
ripgrep searches using multiple threads to improve performance. The tree is sorted when it is populated so that it stays stable. If you want to use ripgrep's own sort arguments, set this to false.

<sup>*Note: Depending on what scan mode you select, you may also want to disable auto-refresh when disabling the sort, otherwise the tree may still be unstable.*</sup>

**todo-tree.tree.disableCompactFolders** (`false`)</br>
The tree will normally respect the VSCode's `explorer.compactFolders` setting. Set this to true if you want to disable compact folders in the todo tree.

**todo-tree.tree.tooltipFormat** (`${filepath}, ${line}`)</br>
Format of the tree item tooltips. Uses the same placeholders as `todo-tree.tree.labelFormat` (see above).

**todo-tree.tree.subTagClickUrl**</br>
A URL (which can contain placeholders), which will be opened when clicking on a sub tag in the tree, e.g. `https://github.com/${subTag}` could be used if the sub tag extracts a user name.

**todo-tree.tree.buttons.reveal** (`true`)</br>
Show a button in the tree view title bar to reveal the current item (only when track file is not enabled).

**todo-tree.tree.buttons.scanMode** (`false`)</br>
Show a button in the tree view title bar to change the Scan Mode setting.

**todo-tree.tree.buttons.viewStyle** (`true`)</br>
Show a button in the tree view title bar to change the view style (tree, flat or tags only).

**todo-tree.tree.buttons.groupByTag** (`true`)</br>
Show a button in the tree view title bar to enable grouping items by tag.

**todo-tree.tree.buttons.groupBySubTag** (`false`)</br>
Show a button in the tree view title bar to enable grouping items by sub tag.

<sup>*Note: This button will only be visible when sub tags have been found and are present in the tree.*</sup>

**todo-tree.tree.buttons.filter** (`true`)</br>
Show a button in the tree view title bar allowing the tree to be filtered by entering some text.

**todo-tree.tree.buttons.refresh** (`true`)</br>
Show a refresh button in the tree view title bar.

**todo-tree.tree.buttons.expand** (`true`)</br>
Show a button in the tree view title bar to expand or collapse the whole tree.

**todo-tree.tree.buttons.export** (`false`)</br>
Show a button in the tree view title bar to create a text file showing the tree content.

<sup>*</sup>*Only applies to new workspaces. Once the view has been changed in the workspace, the current state is stored.*


**todo-tree.scopes** (`{}`)</br>
Defines a set of file scopes that can be quickly swicthed between using the *todo-tree.switchScope* command.

This is a complex configuration property that can only be configured through the configuration JSON file. For example

```json
"todo-tree.scopes": [
    {
        "name": "Production ",
        "excludeGlobs": [
             "**/tests/**"
        ]
    },
    {
        "name": "Tests",
        "includeGlobs": [
            "**/tests/**"
        ]
    },
    {
        "name": "All"
    }
]
```

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

<sup>*Note: If you are modifying settings using the settings GUI, you don't need to escape each backslash.*</sup>

**Warning: Multiline TODOs will not work with markdown TODOs and may have other unexpected results. There may also be a reduction in performance.**

### Excluding files and folders

To restrict the set of folders which is searched, you can define `todo-tree.filtering.includeGlobs`. This is an array of globs which the search results are matched against. If the results match any of the globs, they will be shown. By default the array is empty, which matches everything. See [here](https://code.visualstudio.com/api/references/vscode-api#GlobPattern) for more information on globs.

<sup>*Note: globs paths are absolute - not relative to the current workspace.*</sup>

To exclude folders/files from your search you can define `todo-tree.filtering.excludeGlobs`. If the search results match any of these globs, then the results will be ignored.

You can also include and exclude folders from the tree using the context menu. This folder filter is applied separately to the include/exclude globs.

<sup>*Note: By default, ripgrep ignores files and folders from your `.gitignore` or `.ignore` files. If you want to include these files, set* `todo-tree.ripgrep.ripgrepArgs` *to* `--no-ignore`.</sup>

### Markdown Support

When the extension was first written, very basic markdown support was added simply by adding a pattern to the default regex to match "`- [ ]`". A better way to handle markdown TODOs is to add "`(-|\d+.)`" to the list of "comments" in the first part of the regex and then adding "`[ ]`" and "`[x]`" to the list of tags in `settings.json`, e.g. :

```json
"todo-tree.regex.regex": "(//|#|<!--|;|/\\*|^|^\\s*(-|\\d+.))\\s*($TAGS)"
"todo-tree.general.tags": [
        "BUG",
        "HACK",
        "FIXME",
        "TODO",
        "XXX",
        "[ ]",
        "[x]"
    ]
```

<sup>*Note: If you modify the settings via the GUI, replace every instance of* `\\` *in the regex setting with* `\`.</sup>

This will then match all of the following:

```markdown
- [ ] Do something
- [x] Something I've done

1. [ ] Do this first
2. [ ] Followed by this
```

This also allows custom highlighting to be applied, e.g.

```json
"todo-tree.highlights.customHighlight": {
    "[ ]": {
        "background": "#ff000080"
    },
    "[x]": {
        "background": "#00ff0080"
    }
}
```

which will colour pending TODOs red and completed TODOs green.

Lastly, it will allow grouping by tag (and sub tags) to work and also work better when showing counts in the status bar.

<sup>*Note: The default regex will be updated to reflect these changes at some point in the future.*<sup>

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
