# v0.0.15 - 2018-02-02
- Fix globs in Windows

# v0.0.14 - 2018-01-17
- If vscode-ripgrep is not found in the standard location, try finding it using the application installation path.

# v0.0.13 - 2018-01-16
- Hide the viewlet by default - instead of when detecting there is nothing in the tree.
- Use the version of vscode-ripgrep and comes with vscode itself. This is a lot simpler and makes starup quicker too. The downside is that if vscode is installed somewhere other than the default location, it won't be found.

# v0.0.12 - 2018-01-05
- Force the use of an older version of vscode-ripgrep. The latest version seems to fail to install.

# v0.0.11 - 2017-12-16
- Remove command logging

# v0.0.10 - 2017-12-16
- Add flat list view

# v0.0.9 - 2017-12-13
- Only show the tree view if it's not empty

# v0.0.8 - 2017-12-12
- Fix scanning message
- sort results to keep tree consistent
- remove empty parent nodes from the tree
- ignore files outside the root folder
- handle filenames containing spaces

# v0.0.7 - 2017-11-30
- Add auto update when saving files
- Add preference to show tree expanded by default

# v0.0.6 - 2017-11-28
- Only attempt install if todo-tree.ripgrep is undefined and show some info if the install fails

# v0.0.5 - 2017-11-28
- Attempt to install vscode-ripgrep directly from the extension

# v0.0.4 - 2017-11-28
- Attempt to reinstall vscode-ripgrep automatically

# v0.0.3 - 2017-11-28
- Removed redundant dependencies
- Add some info for fixing the windows version of vscode-ripgrep

# v0.0.2 - 2017-11-27
- Made it work on Windows
- Add configuration for ripgrep executable path
- Improved error handling

# v0.0.1 - 2017-11-23
- Initial release
