# v0.0.72 - 2018-07-16
- Treat process as a stream to avoid buffer size problems

# v0.0.71 - 2018-07-13
- Inhibit failure messages when there is nothing found

# v0.0.70 - 2018-07-13
- Allow configuration of buffer size to cope with large amounts of TODOs (thanks to [somewhatabstract](https://github.com/somewhatabstract))

# v0.0.69 - 2018-07-12
- Support custom icons from the octicon set

# v0.0.68 - 2018-07-12
- Fix trailing slash in rootFolder (Windows)

# v0.0.67 - 2018-07-12
- Add support for interrupt/restart of scan

# v0.0.66 - 2018-07-06
- Allow delay before highlighting to be configured

# v0.0.65 - 2018-07-02
- Fix icons for folders
- Add start of line as start of tag marker

# v0.0.64 - 2018-06-29
- Add support for grouping by tags

# v0.0.63 - 2018-06-14
- Cope with languages that don't have block comments

# v0.0.62 - 2018-06-14
- Handle missing languages when checking block comments

# v0.0.61 - 2018-06-14
- Tidy up trailing block comments
- Fix error when checking for changed editors (thanks to [md2perpe](https://github.com/md2perpe))

# v0.0.60 - 2018-06-11
- Improve tag matching icon colours

# v0.0.59 - 2018-06-10
- Add option to disable scanning of workspace

# v0.0.58 - 2018-06-05
- Add in file highlighting
- Remove leading comments from tree

# v0.0.57 - 2018-05-28
- Apply globs to files out of workspace

# v0.0.56 - 2018-05-28
- Add configuration to disable auto refresh

# v0.0.55 - 2018-05-25
- Add filter function
- Refresh or rebuild (as appropriate) the tree on config changes

# v0.0.54 - 2018-05-23
- Add expand/collapse buttons
- Fix link to rust regex docs
- Change example glob pattern in config

# v0.0.53 - 2018-05-17
- Restore icons to the explorer tree view

# v0.0.52 - 2018-05-12
- Inhibit warning if version of vscode is earlier than 1.23

# v0.0.51 - 2018-05-11
- Add tree view to activity bar

# v0.0.50 - 2018-05-09
- Fix bad display of READMD.md in marketplace

# v0.0.34 - 2018-05-09
- Add support for additional ripgrep arguments
- Add support for diagnostic logging (to Output window)
- Improve configuration section of README.md

# v0.0.33 - 2018-04-27
- Allow variable substitution (including ${workspaceFolder}) in todo-tree.rootFolder

# v0.0.32 - 2018-04-25
- Show TODOs from open files which are not within the workspace. Note: Due to a limitation of VSCode, they will only appear as the files are loaded.
- Split tags out of regex to simplify configuration. Note: existing configurations should still work.
- Removed autoUpdate flag as it seems a but irrelevant now
- Improve stability of tree

# v0.0.31 - 2018-03-19
- Fix executable name for Windows

# v0.0.30 - 2018-03-17
- Inhibit error when no root folder is initially available

# v0.0.29 - 2018-03-16
- Add support for multiple workspaces
- Refresh view when configuration is modified

# v0.0.28 - 2018-03-15
- Fix sort function

# v0.0.27 - 2018-03-14
- Locate ripgrep dynamically (thanks to [ericmoritz](https://github.com/ericmoritz))

# v0.0.26 - 2018-03-08
- Try resetting the ripgrep path if the current path is not found

# v0.0.25 - 2018-03-08
- Support new location of vscode-ripgrep for 1.21.0

# v0.0.24 - 2018-03-06
- Inhibit error messages from ripgrep (stops error when current folder is empty)
- Refresh current file when editor is closed

# v0.0.23 - 2018-02-22
- Allow hex codes to be used to specify icon colours

# v0.0.22 - 2018-02-21
- Add keywords to package.json
- Update description

# v0.0.21 - 2018-02-20
- Added list of available icon colours to configuration description

# v0.0.20 - 2018-02-19
- Added a screenshot to the README.md

# v0.0.19 - 2018-02-19
- Allow icon colour customization based on type of tag

# v0.0.18 - 2018-02-16
- Fixed default regex for HTML (thanks to [kcmr](https://github.com/kcmr))

# v0.0.17 - 2018-02-16
- Add support for file icons from theme
- Add customizable icon colour for todo icon

# v0.0.16 - 2018-02-16
- Fix single file update in flat view

# v0.0.15 - 2018-02-02
- Fix globs in Windows

# v0.0.14 - 2018-01-17
- If vscode-ripgrep is not found in the standard location, try finding it using the application installation path.

# v0.0.13 - 2018-01-16
- Hide the viewlet by default - instead of when detecting there is nothing in the tree.
- Use the version of vscode-ripgrep and comes with vscode itself. This is a lot simpler and makes startup quicker too. The downside is that if vscode is installed somewhere other than the default location, it won't be found.

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
