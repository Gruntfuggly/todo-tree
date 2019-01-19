# Todo Tree

[![Build Status](https://travis-ci.org/Gruntfuggly/todo-tree.svg?branch=master)](https://travis-ci.org/Gruntfuggly/todo-tree)

This extension quickly searches (using <a href="https://github.com/BurntSushi/ripgrep">ripgrep</a>) your workspace for comment tags like TODO and FIXME, and displays them in a tree view in the explorer pane. Clicking a TODO within the tree will open the file and put the cursor on the line containing the TODO.

Found TODOs can also be highlighted in open files.

<img src="https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/screenshot.png">

*Note: The tree will only appear in the explorer pane when the extension finds some TODOs.*

## Highlighting

Highlighting tags is configurable. Use `defaultHighlight` to set up highlights for all tags. If you need to configure individual tags differently, use `customHighlight`. If settings are not specified in `customHighlight`, the value from `defaultHighlight` is used. If a setting is not specified in `defaultHighlight` then the older, deprecated `icon`, `iconColour` and `iconColours` settings are used.

Both `defaultHighlight` and `customHighlight` allow for the following settings:

`foreground` - used to set the foreground colour of the highlight in the editor and the marker in the ruler.

`background` - used to set the background colour of the highlight in the editor.

`opacity` - percentage value used with the background colour. 100% will produce an opaque background which will obscure selection and other decorations.

Foreground and background colours can be one of "red", "green", "blue", "yellow", "magenta", "cyan", "grey", "white" or "black". RGB values can also be used (e.g. "#80FF00").

`icon` - used to set a different icon in the tree view. Must be a valid [octicon](https://octicons.github.com/) - will default to a tick if it's not.

`iconColour` - used to set the colour of the icon in the tree. If not specified, it will try to use the foreground colour, the background colour and then the older settings, in that order.

`type` - used to control how much is highlighted in the editor. Valid values are:

 - `tag` - highlights just the tag
 - `text` - highlights the tag and any text after the tag
 - `line` - highlights the entire line containing the tag

Example:

```
"todo-tree.defaultHighlight": {
    "icon": "alert",
    "type": "text",
    "foreground": "red",
    "background": "white",
    "opacity": 50,
    "iconColour": "blue"
},
"todo-tree.customHighlight": {
    "TODO": {
        "icon": "check",
        "type": "line"
    },
    "FIXME": {
        "foreground": "black",
        "iconColour": "yellow"
    }
}
```

*Note: The highlight configuration is separate from the settings for the search. Adding settings in `customHighlight` does not automatically add the tags into `todo-tree.tags`.*

## Installing

You can install the latest version of the extension via the Visual Studio Marketplace [here](https://marketplace.visualstudio.com/items?itemName=Gruntfuggly.todo-tree).

Alternatively, open Visual Studio code, press `Ctrl+P` or `Cmd+P` and type:

    > ext install todo-tree

*Note: Don't forget to reload the window to activate the extension!*

### Source Code

The source code is available on GitHub [here](https://github.com/Gruntfuggly/todo-tree).

## Controls

The tree view header contains the following buttons:

<img src="https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/icons/light/collapse.png" height="16px" align="center"> - Collapse all tree nodes<br>
<img src="https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/icons/light/expand.png" height="16px" align="center"> - Expand all tree nodes<br>
<img src="https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/icons/light/flat.png" height="16px" align="center"> - Show the tree view as a flat list, with the full filename for each TODO<br>
<img src="https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/icons/light/tags.png" height="16px" align="center"> - Show the view as a list of tags<br>
<img src="https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/icons/light/tree.png" height="16px" align="center"> - Show the tree view as a tree with expandable nodes for each folder (default)<br>
<img src="https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/icons/light/tag.png" height="16px" align="center"> - Group the TODOs in the tree by the tag<br>
<img src="https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/icons/light/notag.png" height="16px" align="center"> - Organise the TODOs by file (default)<br>
<img src="https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/icons/light/filter.png" height="16px" align="center"> - Only show items in the tree which match the entered filter text<br>
<img src="https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/icons/light/clear-filter.png" height="16px" align="center"> - Remove any active filter<br>
<img src="https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/icons/light/refresh.png" height="16px" align="center"> - Rebuild the tree

## Commands

To make it easier to configure the tags, there are two commands available:

**todo-tree: Add Tag** - allows entry of a new tag for searching

**todo-tree: Remove Tag** - shows a list of current tags which can be selected for removing

*Note: The Remove Tag command can be used to show current tags - just press Escape or Enter with out selecting any to close it.*

## Configuration

The extension can be customised as follows:

| Setting | Default | Description |
|---------|---------|-------------|
| todo-tree.rootFolder | <tt>""</tt> | By default, any open workspaces will have a tree in the view. Use this to force another folder to be the root of the tree. You can include environment variables and also use ${workspaceFolder}. e.g. <tt>"todo-tree.rootFolder": "$&#123;workspaceFolder&#125;/test"</tt> or <tt>"todo-tree.rootFolder": "$&#123;HOME&#125;/project"</tt>. *Note: Other open files (outside of the rootFolder) will be shown (as they are opened) with their full path in brackets.* |
| todo-tree.tags | <tt>["TODO","FIXME"]</tt> | This defines the tags which are recognised as TODOs. This list is automatically inserted into the regex. |
| todo-tree.regex | <tt>&#x22;&#x28;&#x28;&#x2f;&#x2f;&#x7c;&#x23;&#x7c;&#x3c;&#x21;&#x2d;&#x2d;&#x7c;&#x3b;&#x7c;&#x2f;&#x5c;&#x5c;&#x2a;&#x29;&#x5c;&#x5c;&#x73;&#x2a;&#x28;&#x24;&#x54;&#x41;&#x47;&#x53;&#x29;&#x7c;&#x5e;&#x5c;&#x5c;&#x73;&#x2a;&#x2d;&#x20;&#x5c;&#x5c;&#x5b;&#x20;&#x5c;&#x5c;&#x5d;&#x29;&#x22;</tt> | This defines the regex used to locate TODOs. By default, it searches for tags in comments starting with <tt>&#47;&#47;</tt>, <tt>#</tt>, <tt>;</tt>, <tt>&lt;!--</tt> or <tt>&#47;*</tt>. This should cover most languages. However if you want to refine it, make sure that the <tt>($TAGS)</tt> is kept. The second part of the expression allows matching of Github markdown task lists. *Note: This is a <a href="https://docs.rs/regex/1.0.0/regex">Rust regular expression</a>, not javascript.* |
| todo-tree.regexCaseSensitive | <tt>true</tt> | Set to false to allow tags to be matched regardless of case. |
| todo-tree.includeGlobs | <tt>[]</tt> | Globs for use in limiting search results by inclusion, e.g. `[\"**/unit-tests/*.js\"]` to only show .js files in unit-tests subfolders. <a href="https://www.npmjs.com/package/glob#glob-primer">Globs help</a> |
| todo-tree.excludeGlobs | <tt>[]</tt> | Globs for use in limiting search results by exclusion (applied after **includeGlobs**), e.g. `[\"**/*.txt\"]` to ignore all .txt files |
| todo-tree.includedWorkspaces | <tt>[]</tt> | A list of workspace names to include as roots in the tree (wildcards can be used). An empty array includes all workspace folders |
| todo-tree.excludedWorkspaces | <tt>[]</tt> | A list of workspace names to exclude as roots in the tree (wildcards can be used). |
| todo-tree.ripgrep | <tt>""</tt> | Normally, the extension will locate ripgrep itself as and when required. If you want to use an alternate version of ripgrep, set this to point to wherever it is installed. |
| todo-tree.ripgrepArgs | <tt>""</tt> | Use this to pass additional arguments to ripgrep. e.g. <tt>"-i"</tt> to make the search case insensitive. *Use with caution!* |
| todo-tree.ripgrepMaxBuffer | <tt>200</tt> | By default, the ripgrep process will have a buffer of 200KB. However, this is sometimes not enough for all the tags you might want to see. This setting can be used to increase the buffer size accordingly. |
| todo-tree.showInExplorer | <tt>true</tt> | The tree is shown in the explorer view and also has it's own view in the activity bar. If you no longer want to see it in the explorer view, set this to false. |
| todo-tree.filterCaseSensitive | <tt>false</tt> | Use this if you need the filtering to be case sensitive. *Note: this does not the apply to the search*. |
| todo-tree.highlightDelay | <tt>500</tt> | The delay before highlighting (milliseconds). |
| todo-tree.trackFile | <tt>true</tt> | Set to false if you want to prevent tracking the open file in the tree view. |
| todo-tree.showBadges | <tt>true</tt> | Set to false to disable SCM status and badges in the tree. Note: This also unfortunately turns off themed icons. |
| todo-tree.showTagsFromOpenFilesOnly | <tt>false</tt> | Set to true to only show TODOs in open files. |
| todo-tree.defaultHighlight | <tt>{}</tt> | Set default highlights. E.g. `{"foreground":"white","background":"red","icon":"check","type":"text"}` |
| todo-tree.customHighlight | <tt>{}</tt> | Set highlights per tag. E.g. `{"TODO":{"foreground":"white","type":"text"},"FIXME":{"icon":"beaker"}}` |
| todo-tree.expanded<sup>*</sup> | <tt>false</tt> | Set to true if you want new views to be expanded by default |
| todo-tree.flat<sup>*</sup> | <tt>false</tt> | Set to true if you want new views to be flat by default |
| todo-tree.grouped<sup>*</sup> | <tt>false</tt> | Set to true if you want new views to be grouped by default |
| todo-tree.tagsOnly<sup>*</sup> | <tt>false</tt> | Set to true if you want new views with tags only by default |
| todo-tree.sortTagsOnlyViewAlphabetically | <tt>false</tt> | Sort items in the tags only view alphabetically instead of by file and line number |
| todo-tree.statusBar | <tt>none</tt> | What to show in the status bar - nothing (<tt>none</tt>), total count (<tt>total</tt>), counts per tag (<tt>tags</tt>) or the counts for the top three tags (<tt>top three</tt>) |
| todo-tree.showCountsInTree | <tt>false</tt> | Set to true to show counts of TODOs in the tree |
| todo-tree.labelFormat | <tt>${tag} ${after}</tt> | Format of the TODO item labels. Available placeholders are <tt>${line}</tt>, <tt>${column}</tt>, <tt>${tag}</tt>, <tt>${before}</tt> (text from before the tag) and <tt>${after}</tt> (text from after the tag). |

<sup>*</sup> Only applies to new workspaces. Once the view has been changed in the workspace, the current state is stored.

### Excluding files and folders

To restrict the set of folders which is searched, you can define `todo-tree.includeGlobs`. This is an array of globs which the search results are matched against. If the results match any of the globs, they will be shown. By default the array is empty, which matches everything.

To exclude folders/files from your search you can define `todo-tree.excludeGlobs`. If the search results match any of these globs, then the results will be ignored.

There is also support

*Note: By default, ripgrep ignores files and folders from your `.gitignore` or `.ignore` files. If you want to include these files, set* `todo-tree.ripgrepArgs` *to* `--no-ignore`.

## Known Issues

Grouping by tag will only work when your configuration defines the tags using the `todo-tree.tags` setting. Older versions of the extension had the tags directly defined in the `todo-tree.regex` whereas now, the regex replaces **$TAGS** with the contents of `todo-tree.tags`.

Grouping by tag doesn't work for markdown task list items as there is no tag to group with. The tree will show the files alongside the tag groups.

Tracking the file in the tree view when grouping by tag will reveal the first tag found.

When there is no current workspace, default icons will be shown in the tree.


## Donate

If you find this extension useful, please feel free to donate <a href="https://paypal.me/Gruntfuggly">here</a>. Thanks!

### Credits

Uses a modified version of <a href="https://www.npmjs.com/package/ripgrep-js">ripgrep-js</a>.

Main icons originally made by <a href="http://www.freepik.com" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a>

Tree view icons made by <a href="https://www.flaticon.com/authors/vaadin" title="Vaadin">Vaadin</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a>

Tag icons made by <a href="https://www.flaticon.com/authors/dave-gandy" title="Dave Gandy">Dave Gandy</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a>

Tags Icon made by <a href="https://www.flaticon.com/authors/vectors-market" title="Vectors Market">Vectors Market</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a>
