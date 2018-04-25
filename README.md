# Todo Tree

This extension quickly searches (using <a href="https://github.com/BurntSushi/ripgrep">ripgrep</a>) your workspace for comment tags like TODO and FIXME, and displays them in a tree view in the explorer pane. Clicking a TODO within the tree will open the file and put the cursor on the line containing the TODO. The view is updated whenever files are saved.

<img src="https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/screenshot.png">

## Installing

You can install the latest version of the extension via the Visual Studio Marketplace [here](https://marketplace.visualstudio.com/items?itemName=Gruntfuggly.todo-tree).

Alternatively, open Visual Studio code, press `Ctrl+P` or `Cmd+P` and type:

    > ext install todo-tree

### Source Code

The source code is available on GitHub [here](https://github.com/Gruntfuggly/todo-tree).

## Configuration

The extension can be customised as follows:

`todo-tree.rootFolder`

The search starts in your current workspace folder. Change this if you want to start somewhere else.

*Note: If you are using multiple workspaces the tree will show the TODOs for the workspace of the currently selected file.*

`todo-tree.tags`

This defines the tags which are recognised as TODOs. This list is automatically inserted into the regex. The defaults are "TODO" and "FIXME".

`todo-tree.regex`

This defines the regex used to locate TODOs. By default, it searches for tags in comments starting with `//`, `#`, `;`, `<--` or '/*'. This should cover most languages.
If you want to refine it, make sure that the ($TAGS) is kept. The second part of the expression allows matching of Github markdown task lists.

*Note: This is a <a href="https://doc.rust-lang.org/regex/regex/index.html>">Rust regular expression</a>, not javascript.*

`todo-tree.globs`

If you want to modify the files which are searched, you can define a list of <a href="https://www.npmjs.com/package/glob">globs</a>.

`todo-tree.ripgrep`

Normally, the extension will locate ripgrep itself as and when required. If you want to use an alternate version of ripgrep, set this to point to wherever it is installed.

`todo-tree.expanded`

If you want the tree to be opened with all nodes expanded, set this to true. By default, the tree will be collapsed.

`todo-tree.flat`

Set to true to show the tree as a flat list of files (with folder names in brackets).

`todo-tree.iconColour`

Use this to change the colour of the icon for TODOs in the tree. Can be hex (e.g. "#FF80FF" ) or one of "red", "green", "blue", "yellow", "magenta", "cyan" or "grey".

`todo-tree.iconColours`

Use this if you need different icon colours based on the type of tag. The colours can be hex codes, or from the list above, and the match can be a javascript regex. E.g.

```
{
    "TODO": "#FF80FF",
    "^BUG": "red"
}
```

_Note: The colours are applied __after__ the search results, so don't forget to modify `todo-tree.tags` if you want to add new tags!_

## Known issues

The tree is normally presented in alphabetical order. The extension tries to update individual files when they are saved. If there are no more TODOs in the file it will be removed from the tree along with any parent folders which are now empty. If a TODO is then re-added to the file, it will be inserted into the tree at the end. Refreshing the tree will put the file back in the expected place. Hopefully when the tree views are enhanced, there will be a better mechanism to keep the tree ordered in some way.

### Credits

Uses a modified version of <a href="https://www.npmjs.com/package/ripgrep-js">ripgrep-js</a>.

<div>Main icons originally made by <a href="http://www.freepik.com" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div>

<div>Tree view icons made by <a href="https://www.flaticon.com/authors/vaadin" title="Vaadin">Vaadin</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div>