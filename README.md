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

By default, the extension tries to download and use the version of ripgrep that has been compiled by vscode for your platform. If this doesn't work you can install ripgrep yourself and set this preference to point to it.

### Credits

Uses a modified version of <a href="https://www.npmjs.com/package/ripgrep-js">ripgrep-js</a>.

<div>Icon originally made by <a href="http://www.freepik.com" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div>
