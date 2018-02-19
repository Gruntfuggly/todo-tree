# Todo Tree

This extension uses <a href="https://github.com/BurntSushi/ripgrep">ripgrep</a> to search for TODOs within your workspace, which it will then show in a tree view in the explorer pane. Clicking a TODO within the tree will open the file and put the cursor on the line containing the TODO.

## Installing

You can install the latest version of the extension via the Visual Studio Marketplace [here](https://marketplace.visualstudio.com/items?itemName=Gruntfuggly.todo-tree).

Alternatively, open Visual Studio code, press `Ctrl+P` or `Cmd+P` and type:

    > ext install todo-tree

### Source Code

The source code is available on GitHub [here](https://github.com/Gruntfuggly/todo-tree).

## Configuration

The extension can be customised as follows:

`todo-tree.regex`

By default, the regex to find TODOs is fairly simple - it searches for `TODO` or `FIXME` in coments starting with `//`, `#`, `;` or `<--`

If you want to refine it, just modify this regex. Note: This is a <a href="https://doc.rust-lang.org/regex/regex/index.html>">Rust regular expression</a>, not javascript.

`todo-tree.rootFolder`

The search starts in your workspace folder. Change this if you want to start somewhere else.

`todo-tree.globs`

If you want to modify the files which are searched, you can define a list of <a href="https://www.npmjs.com/package/glob">globs</a>.

`todo-tree.ripgrep`

When first installed, the extension will attempt to find the version of vscode-ripgrep that comes with vscode. Depending on your OS, it looks in the following places:

* Windows: `C:\Program Files\Microsoft VS Code\resources\app\node_modules\vscode-ripgrep\bin\rg.exe`
* Linux: `/usr/share/code/resources/app/node_modules/vscode-ripgrep/bin/rg`
* OSX: `/Applications/Visual Studio Code.app/Contents/Resources/app/node_modules/vscode-ripgrep/bin/rg`

If you installed vscode somewhere else, the extension will try to find vscode-ripgrep using the application installation path.

Alternatively, you can install ripgrep manually and set this to point to wherever it is installed.

`todo-tree.autoUpdate`

When set to true, the tree will be updated when a file is saved.

`todo-tree.expanded`

If you want the tree to be opened with all nodes expanded, set this to true. By default, the tree will be collapsed.

`todo-tree.flat`

Set to true to show the tree as a flat list of files (with folder names in brackets).

`todo-tree.iconColour`

Use this to change the colour of the icon for TODOs in the tree. Should be one of "red", "green", "blue", "yellow", "magenta", "cyan" or "grey".

`todo-tree.iconColours`

Use this if you need different icon colours based on the type of tag. The colours must be from the list above, and the match can be a javasctipt regex. E.g.

```
{
    "TODO": "yellow",
    "^BUG": "red"
}
```

_Note: The colours are applied __after__ the search results, so don't forget to modify `todo-tree.regex` if you want to add new tags!_

## Known issues

The tree is normally presented in alphabetical order. The extension tries to update individual files when they are saved. If there are no more TODOs in the file it will be removed from the tree
along with any parent folders which are now empty. If a TODO is then re-added to the file, it will be inserted into the tree at the end. Refreshing the tree will put the file back in the expected place. Hopefully when the tree views are enhanced, there will be a better mechanism to keep the tree ordered in some way.

### Credits

Uses a modified version of <a href="https://www.npmjs.com/package/ripgrep-js">ripgrep-js</a>.

<div>Main icons originally made by <a href="http://www.freepik.com" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div>

<div>Tree view icons made by <a href="https://www.flaticon.com/authors/vaadin" title="Vaadin">Vaadin</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div>