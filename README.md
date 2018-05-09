# Todo Tree

This extension quickly searches (using <a href="https://github.com/BurntSushi/ripgrep">ripgrep</a>) your workspace for comment tags like TODO and FIXME, and displays them in a tree view in the explorer pane. Clicking a TODO within the tree will open the file and put the cursor on the line containing the TODO.

<img src="https://raw.githubusercontent.com/Gruntfuggly/todo-tree/master/resources/screenshot.png">

*Note: The tree will only appear when it finds some TODOs.*

## Installing

You can install the latest version of the extension via the Visual Studio Marketplace [here](https://marketplace.visualstudio.com/items?itemName=Gruntfuggly.todo-tree).

Alternatively, open Visual Studio code, press `Ctrl+P` or `Cmd+P` and type:

    > ext install todo-tree

### Source Code

The source code is available on GitHub [here](https://github.com/Gruntfuggly/todo-tree).

## Configuration

The extension can be customised as follows:

| Setting | Default | Description |
|---------|---------|-------------|
| todo&#8209;tree.rootFolder | "" | The search starts in your current workspace folder (or the workspace of the currently selected file). Change this setting if you want to start somewhere else. You can include environment variables and also use ${workspaceFolder}. e.g. "todo-tree.rootFolder": "$&#123;workspaceFolder&#125;/test" or "todo-tree.rootFolder": "$&#123;HOME&#125;/project". Note: Other open files (outside of the rootFolder) will be shown (as they are opened) with their full path in brackets.* |
| todo&#8209;tree.tags | ["TODO","FIXME"] |This defines the tags which are recognised as TODOs. This list is automatically inserted into the regex. |
| todo&#8209;tree.regex | &#x22;&#x28;&#x28;&#x2f;&#x2f;&#x7c;&#x23;&#x7c;&#x3c;&#x21;&#x2d;&#x2d;&#x7c;&#x3b;&#x7c;&#x2f;&#x5c;&#x5c;&#x2a;&#x29;&#x5c;&#x5c;&#x73;&#x2a;&#x28;&#x24;&#x54;&#x41;&#x47;&#x53;&#x29;&#x7c;&#x5e;&#x5c;&#x5c;&#x73;&#x2a;&#x2d;&#x20;&#x5c;&#x5c;&#x5b;&#x20;&#x5c;&#x5c;&#x5d;&#x29;&#x22; | This defines the regex used to locate TODOs. By default, it searches for tags in comments starting with &#47;&#47;, #, ;, &lt;!-- or &#47;*. This should cover most languages. However if you want to refine it, make sure that the ($TAGS) is kept. The second part of the expression allows matching of Github markdown task lists. *Note: This is a <a href="https://doc.rust-lang.org/regex/regex/index.html>">Rust regular expression</a>, not javascript.* |
| todo&#8209;tree.globs | [] | If you want to modify the files which are searched, you can define a list of <a href="https://www.npmjs.com/package/glob">globs</a>.|
| todo&#8209;tree.ripgrep | "" | Normally, the extension will locate ripgrep itself as and when required. If you want to use an alternate version of ripgrep, set this to point to wherever it is installed. |
| todo&#8209;tree.ripgrepArgs | "" | Use this to pass additional arguments to ripgrep. e.g. "-i" to make the search case insensitive. *Use with caution!* |
| todo&#8209;tree.expanded | false | If you want the tree to be opened with all nodes expanded, set this to true. By default, the tree will be collapsed. |
| todo-tree.flat | false | Set to true to show the tree as a flat list of files (with folder names in brackets). |
| todo-tree.iconColour | "green" | Use this to change the colour of the icon for TODOs in the tree. Can be hex (e.g. "#FF80FF" ) or one of "red", "green", "blue", "yellow", "magenta", "cyan" or "grey". |
| todo&#8209;tree.iconColours | {} | Use this if you need different icon colours based on the type of tag. The colours can be hex codes, or from the list above, and the match can be a javascript regex. e.g. {"TODO": "#FF80FF","^BUG": "red"}. *Note: The colours are applied **after** the search results, so don't forget to modify todo-tree.tags if you want to add new tags!* |

### Credits

Uses a modified version of <a href="https://www.npmjs.com/package/ripgrep-js">ripgrep-js</a>.

<div>Main icons originally made by <a href="http://www.freepik.com" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div>

<div>Tree view icons made by <a href="https://www.flaticon.com/authors/vaadin" title="Vaadin">Vaadin</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div>
