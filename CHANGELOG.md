# Todo Tree Change Log

## v0.0.178 - 2020-07-08

- Fix octicons link in README.md (thanks to [VictorHAS](https://github.com/VictorHAS))
- Fix tooltipFormat always displaying default (thanks to [jasonericdavis](https://github.com/jasonericdavis))
- Add missing 'default' in README.md (thanks to [rhynodesigns](https://github.com/rhynodesigns))
- Simplify export function

## v0.0.177 - 2020-06-16

- Allow buttons in tree view title to be configured
- Add export button to tree view title
- Use Code's codicons for title bar instead of custom icons
- Don't include files without extensions as hidden files
- Fix line numbers in export
- Add file path in tags only view export
- Don't include filtered nodes in tree counters
- Support configurable export path

## v0.0.176 - 2020-05-20

- Only scan workspaces with "file" scheme
- Add option to include hidden files
- Order configuration settings alphabetically in package.json
- Remove leading comments from multiline TODOs
- Update README.md with 'current file' status bar details

## v0.0.175 - 2020-05-13

- Remove migration code for version 0.0.161
- Add spaces and commas to status bar item
- Update to latest version of micromatch

## v0.0.174 - 2020-04-29

- Fix "Nothing found" indicator
- Remove colon from status bar when single counts are shown

## v0.0.173 - 2020-04-24

- Improve handling of tree view status item (showing active filters)
- Fix link to codicons in README.md
- Don't show 'None Found', just use '0' to keep the status bar item short
- Support removal of block comments in .jsonc files

## v0.0.172 - 2020-04-13

- Add "current file" option to status bar
- Add popup to show current status bar mode
- Add support for codicons
- Fix block comment extraction

## v0.0.171 - 2020-03-29

- Refresh files after a timeout
- Fix tag counts in tags only view
- Add support for hiding tags from the status bar counts
- Fix cycling of status bar

## v0.0.170 - 2020-03-22

- Add option to manually start the scan
- Add configuration for tooltip
- Don't refresh when regex is being changed
- Add more information about globs to README.md
- Allow file watcher glob to be configured
- Fix error on deactivate (thanks to [hacke2](https://github.com/hacke2))

## v0.0.169 - 2020-02-25

- Turn off file watcher by default

## v0.0.168 - 2020-02-25

- Support showing TODOs from current file only
- Show scan mode indication in status bar item
- Add HACK and XXX to default tags
- Add support for using built in search excludes
- Add button icons for README.md
- Allow array settings to be modified in the settings GUI
- Detect external file changes and update tree

## v0.0.167 - 2020-01-30

- Skip leading whitespace when highlighting
- Fix hide tree when empty option
- Count markdown TODOs as "TODO" when showing totals in the status bar
- Use a default colour for ruler highlights
- Add better explanation of useBuiltInExcludes setting
- Add support for compact folders in tree
- Fix path searches

## v0.0.166 - 2020-01-22

- Improve fix for case where $TAGS is not used in regex
- Support tag groups

## v0.0.165 - 2020-01-21

- Fix case where $TAGS is not used in regex

## v0.0.164 - 2020-01-20

- Fix missing background colours

## v0.0.163 - 2020-01-20

- Add some default icons and the BUG tag
- Fix reveal tree from status bar
- Remove files from tree when files are closed
- Add option to show icons in gutter

## v0.0.162 - 2019-11-04

- Add support for manually revealing the current file in the tree

## v0.0.161 - 2019-10-30

- Add support for theme colours in highlights
- Turn on highlighting by default (inverted editor background/foreground)

## v0.0.160 - 2019-10-11

- Fix submodule detection to look for .git file not folder

## v0.0.159 - 2019-10-11

- Add option to ignore git submodules
- Reorder icons to be consistent with the Explorer view
- Fix white icons in tree
- Remove cached icons when resetting cache
- Sort tags in reverse order to allow more specific tags to be found first
- Add link to wiki in README.md

## v0.0.158 - 2019-10-03

- Allow --no-config to be removed
- Simplify regex escape regexes
- Show active folder filters in tree

## v0.0.157 - 2019-10-01

- Further improvements to regex chars in tags

## v0.0.156 - 2019-09-29

- Fix top level folder globs
- Add support for including the built in files.exclude setting

## v0.0.155 - 2019-09-27

- Handle regex characters in tags properly

## v0.0.154 - 2019-09-25

- Add setting to control which editor URI schemes should be highlighted
- Add --no-config to ripgrep command to prevent parsing of user rg.conf files
- Fix object migration bug
- Improve folder globs for windows
- Replace all instances of tags in regex (thanks to [tylerbrockett](https://github.com/tylerbrockett))

## v0.0.153 - 2019-09-12

- Update README.md with new settings (thanks to [abelmatser](https://github.com/abelmatser))
- Fix ripgrep arguments
- Add "Reset Cache" command

## v0.0.152 - 2019-09-12

- Fix migration of 'tags' setting
- Open settings in a better way

## v0.0.151 - 2019-09-11

- Use global state (not workspace state) for "Don't Show This Again"

## v0.0.150 - 2019-09-11

- Make "Open Settings" work for Insiders too

## v0.0.149 - 2019-09-11

- Fix "Ignore" option for settings migration warning

## v0.0.148 - 2019-09-11

- Move settings into groups
- Make settings in README.md easier to read

## v0.0.147 - 2019-09-10

- Fix broken match extraction
- Fix 'os' library import for export function (thanks to [thalesfsp](https://github.com/thalesfsp))
- Fix settings table in README.md

## v0.0.146 - 2019-09-09

- Simplify regex for decoding results and fall back to old method on failure

## v0.0.145 - 2019-09-07

- Allow use of the todo-tree icon in the tree

## v0.0.144 - 2019-09-07

- Improve decoding of ripgrep results (thanks to [Quacky2200](https://github.com/Quacky2200))

## v0.0.143 - 2019-08-27

- Remove use of deprecated rootPath when exporting tree
- Add option to configure border radius on highlights
- Check file path when looking for existing todo nodes

## v0.0.142 - 2019-08-21

- Fix magenta icon
- Handle tags at the end of lines better

## v0.0.141 - 2019-08-13

- Fix custom coloured icons
- Sort folders before files

## v0.0.140 - 2019-08-12

- Update icons to match the 1.37.0 GUI (great work by [johnletey](https://github.com/johnletey) - many thanks!)
- Add option to hide ruler markers
- Add option to reveal tree when clicking the status bar

## v0.0.139 - 2019-07-15

- Add option to hide icons when grouping by tag
- Add support for fontStyle, fontWeight and textDecoration to highlights

## v0.0.138 - 2019-07-01

- Fix multiline highlight

## v0.0.137 - 2019-06-30

- Fix error in isHex function
- Add folder filtering context menu
- Make multiline TODO highlights work properly
- Add option to disable hiding the tree when it is empty

## v0.0.136 - 2019-06-28

- Add option to highlight line to full width of the editor

## v0.0.135 - 2019-06-13

- Add tree export feature

## v0.0.134 - 2019-06-02

- Add license

## v0.0.133 - 2019-06-02

- Add option to prevent globs being passed to ripgrep

## v0.0.132 - 2019-05-14

- Add option to highlight the comment characters in front of the tag
- Add option to highlight the comment characters in front of the tag and text (thanks to [sidpagariya](https://github.com/sidpagariya))
- Improve glob handling (thanks to [somewhatabstract](https://github.com/somewhatabstract))
- Prevent finding TODOs in output windows, etc.
- Fix clearing of filter
- Add missing icons in README.md

## v0.0.131 - 2019-05-10

- Add configuration for reveal behaviour (thanks to [pd93](https://github.com/pd93))
- Fixed install instructions in README.md (thanks to [patros](https://github.com/patros))

## v0.0.130 - 2019-04-25

- Improve experience for contributors (thanks to [true0r](https://github.com/true0r))
- Remove colon in format strings (thanks to [true0r](https://github.com/true0r))
- Fix hideFromTree for complex tags
- Fix detection of multiline highlights in open files

## v0.0.129 - 2019-04-17

- Add "scan open files only"/"scan workspace" toggle button
- Fix previous fix (sigh)

## v0.0.128 - 2019-04-16

- Use old highlight mechanism if no tag is extracted from the match

## v0.0.127 - 2019-04-14

- Support multiline TODOs
- Save filter state

## v0.0.126 - 2019-03-27

- Add option to hide tags from tree, but still highlight in files
- Add link to octicons to README.md

## v0.0.125 - 2019-03-11

- Revert adding word boundary from default regex

## v0.0.124 - 2019-03-07

- Fix ripgrep argument combination (sorry again!)

## v0.0.123 - 2019-03-07

- Fix default regex (sorry!)

## v0.0.122 - 2019-03-06

- Set default ripgrepArgs to include "--max-columns=1000"
- Add word boundary to default regex

## v0.0.121 - 2019-03-04

- Add support for ${filename} in label format
- Remove redundant dependency on minimatch

## v0.0.120 - 2019-02-27

- Fix error when creating resources

## v0.0.119 - 2019-02-19

- Use globalStoragePath instead of storagePath

## v0.0.118 - 2019-02-10

- Fix isNaN error (thanks to [JakubKoralewski](https://github.com/JakubKoralewski))

## v0.0.117 - 2019-02-08

- Add support for overview ruler configuration

## v0.0.116 - 2019-01-28

- Update to the latest octicons

## v0.0.115 - 2019-01-18

- Don't set default background colours unless a background is specified

## v0.0.114 - 2019-01-11

- Fix crash when highlight colour is not defined

## v0.0.113 - 2019-01-10

- Add opacity option to highlights
- Removed settings migration code

## v0.0.112 - 2019-01-01

- Fix line number in label format
- Add black and white colours

## v0.0.111 - 2018-12-21

- Add support for showing counts in the tree
- Add top three counts option to status bar
- Add configuration of TODO item labels
- Remove deprecated settings
- Fix root folder configuration

## v0.0.110 - 2018-12-17

- Fix bug in tag counting

## v0.0.109 - 2018-12-11

- Add support for showing counts of tags in the status bar
- Fix showTagsFromOpenFilesOnly

## v0.0.108 - 2018-12-09

- Add option to sort tags only view alphabetically

## v0.0.107 - 2018-11-28

- Add line number to tooltip
- Add new minimal view (tags only)
- Fix context.storagePath creation error
- Start adding unit tests
- Fix tag extraction function (properly)

## v0.0.106 - 2018-11-22

- Fix tag extraction function

## v0.0.105 - 2018-11-21

- Don't add entries for open files if already found by search
- Don't remove items from tree when file is closed and showTagsFromOpenFilesOnly is false

## v0.0.104 - 2018-11-21

- Don't use case sensitive group nodes if regexCaseSensitive if false
- Remove items from tree when file is closed and showTagsFromOpenFilesOnly is true

## v0.0.103 - 2018-11-19

- Fix globs migration error

## v0.0.102 - 2018-11-17

- Make globs work properly (at last!)
- Fix showTagsFromOpenFilesOnly option
- Expand ${workspaceFolder} in rootFolder for all workspaces

## v0.0.101 - 2018-11-06

- Provide configuration for included/excluded workspace folders

## v0.0.100 - 2018-11-05

- Handle situation where there are no workspace folders better

## v0.0.99 - 2018-11-04

- Trap errors when there are no workspaces

## v0.0.98 - 2018-11-02

- Allow debug channel to be enabled/disabled without reloading the window

## v0.0.97 - 2018-10-30

- Fix trailing slash on windows paths
- Remove leading newlines from matches in files
- Show `line <n>` for tags with no content when grouping by tag

## v0.0.96 - 2018-10-23

- Don't sort tags within files

## v0.0.95 - 2018-10-22

- Fix workspace paths
- Replace backslashes in the tags list with \\x5c

## v0.0.94 - 2018-10-22

- Set workspaces when first TODO is added

## v0.0.93 - 2018-10-21

- Major refactor to simplify and remove unused code
- Stop using ripgrep for single file updates
- Add configuration setting for badges and SCM state
- Fix configuration example and rust regex link ([#82](https://github.com/Gruntfuggly/todo-tree/issues/82) and [#79](https://github.com/Gruntfuggly/todo-tree/issues/79))
- Support multiple workspaces properly
- Preserve expansion state when changing view and reloading the window

## v0.0.92 - 2018-10-02

- Add support for case insensitive tag matching

## v0.0.91 - 2018-10-02

- Sort tree alphabetically when grouping by tag

## v0.0.90 - 2018-09-28

- Allow proper highlighting without using tags setting
- Reveal items in the middle of the window ([#76](https://github.com/Gruntfuggly/todo-tree/issues/76)

## v0.0.89 - 2018-09-26

- Fix stupid label trimming error

## v0.0.88 - 2018-09-22

- Allow customHighlight match by regex

## v0.0.87 - 2018-09-22

- Support multiple tags on the same line

## v0.0.86 - 2018-09-10

- Allow the icon colour to be explicit set in the custom and default highlight settings.

## v0.0.85 - 2018-09-07

- Restore 'expanded', 'flat' and 'grouped' default configuration settings  (fixes [#68](https://github.com/Gruntfuggly/todo-tree/issues/68))

## v0.0.84 - 2018-09-06

- Fix tree elements not appearing when there is no workspace (fixes [#67](https://github.com/Gruntfuggly/todo-tree/issues/67))
- Use workspaceState for view state instead of workspace settings
- Remove redundant settings from README.md
- Fix a bunch of typos in various files

## v0.0.83 - 2018-09-04

- If foreground is not specified, use black or white depending on background colour
- If foreground is not specified, use background for icon colour if specified, else deprecated colours

## v0.0.82 - 2018-09-02

- Fix settings for unknown tags (e.g. markdown TODOs)

## v0.0.81 - 2018-09-02

- Fix spelling mistake in package.json

## v0.0.80 - 2018-09-02

- Extend configurability of highlights

## v0.0.79 - 2018-08-22

- Add support for highlight tag only, tag and text, or entire line
- Inhibit tracking document when selecting from tree

## v0.0.78 - 2018-08-06

- Prevent tracking file when grouping enabled

## v0.0.77 - 2018-08-03

- Track open file in the tree views

## v0.0.76 - 2018-07-31

- Add information about header buttons to README.md

## v0.0.75 - 2018-07-31

- Add commands for adding and removing tags
- Add note to README.md about reloading the window after installation
- Add note to README.md about excluding files and folders

## v0.0.74 - 2018-07-31

- Fix showing highlights properly

## v0.0.73 - 2018-07-30

- Show highlights in all editors (not just the active editor) (fixes [#61](https://github.com/Gruntfuggly/todo-tree/issues/61))

## v0.0.72 - 2018-07-16

- Treat process as a stream to avoid buffer size problems

## v0.0.71 - 2018-07-13

- Inhibit failure messages when there is nothing found

## v0.0.70 - 2018-07-13

- Allow configuration of buffer size to cope with large amounts of TODOs (thanks to [somewhatabstract](https://github.com/somewhatabstract))

## v0.0.69 - 2018-07-12

- Support custom icons from the octicon set

## v0.0.68 - 2018-07-12

- Fix trailing slash in rootFolder (Windows)

## v0.0.67 - 2018-07-12

- Add support for interrupt/restart of scan

## v0.0.66 - 2018-07-06

- Allow delay before highlighting to be configured

## v0.0.65 - 2018-07-02

- Fix icons for folders
- Add start of line as start of tag marker

## v0.0.64 - 2018-06-29

- Add support for grouping by tags

## v0.0.63 - 2018-06-14

- Cope with languages that don't have block comments

## v0.0.62 - 2018-06-14

- Handle missing languages when checking block comments

## v0.0.61 - 2018-06-14

- Tidy up trailing block comments
- Fix error when checking for changed editors (thanks to [md2perpe](https://github.com/md2perpe))

## v0.0.60 - 2018-06-11

- Improve tag matching icon colours

## v0.0.59 - 2018-06-10

- Add option to disable scanning of workspace

## v0.0.58 - 2018-06-05

- Add in file highlighting
- Remove leading comments from tree

## v0.0.57 - 2018-05-28

- Apply globs to files out of workspace

## v0.0.56 - 2018-05-28

- Add configuration to disable auto refresh

## v0.0.55 - 2018-05-25

- Add filter function
- Refresh or rebuild (as appropriate) the tree on config changes

## v0.0.54 - 2018-05-23

- Add expand/collapse buttons
- Fix link to rust regex docs
- Change example glob pattern in config

## v0.0.53 - 2018-05-17

- Restore icons to the explorer tree view

## v0.0.52 - 2018-05-12

- Inhibit warning if version of vscode is earlier than 1.23

## v0.0.51 - 2018-05-11

- Add tree view to activity bar

## v0.0.50 - 2018-05-09

- Fix bad display of README.md in marketplace

## v0.0.34 - 2018-05-09

- Add support for additional ripgrep arguments
- Add support for diagnostic logging (to Output window)
- Improve configuration section of README.md

## v0.0.33 - 2018-04-27

- Allow variable substitution (including ${workspaceFolder}) in todo-tree.rootFolder

## v0.0.32 - 2018-04-25

- Show TODOs from open files which are not within the workspace. Note: Due to a limitation of VSCode, they will only appear as the files are loaded.
- Split tags out of regex to simplify configuration. Note: existing configurations should still work.
- Removed autoUpdate flag as it seems a but irrelevant now
- Improve stability of tree

## v0.0.31 - 2018-03-19

- Fix executable name for Windows

## v0.0.30 - 2018-03-17

- Inhibit error when no root folder is initially available

## v0.0.29 - 2018-03-16

- Add support for multiple workspaces
- Refresh view when configuration is modified

## v0.0.28 - 2018-03-15

- Fix sort function

## v0.0.27 - 2018-03-14

- Locate ripgrep dynamically (thanks to [ericmoritz](https://github.com/ericmoritz))

## v0.0.26 - 2018-03-08

- Try resetting the ripgrep path if the current path is not found

## v0.0.25 - 2018-03-08

- Support new location of vscode-ripgrep for 1.21.0

## v0.0.24 - 2018-03-06

- Inhibit error messages from ripgrep (stops error when current folder is empty)
- Refresh current file when editor is closed

## v0.0.23 - 2018-02-22

- Allow hex codes to be used to specify icon colours

## v0.0.22 - 2018-02-21

- Add keywords to package.json
- Update description

## v0.0.21 - 2018-02-20

- Added list of available icon colours to configuration description

## v0.0.20 - 2018-02-19

- Added a screenshot to the README.md

## v0.0.19 - 2018-02-19

- Allow icon colour customization based on type of tag

## v0.0.18 - 2018-02-16

- Fixed default regex for HTML (thanks to [kcmr](https://github.com/kcmr))

## v0.0.17 - 2018-02-16

- Add support for file icons from theme
- Add customizable icon colour for todo icon

## v0.0.16 - 2018-02-16

- Fix single file update in flat view

## v0.0.15 - 2018-02-02

- Fix globs in Windows

## v0.0.14 - 2018-01-17

- If vscode-ripgrep is not found in the standard location, try finding it using the application installation path.

## v0.0.13 - 2018-01-16

- Hide the viewlet by default - instead of when detecting there is nothing in the tree.
- Use the version of vscode-ripgrep and comes with vscode itself. This is a lot simpler and makes startup quicker too. The downside is that if vscode is installed somewhere other than the default location, it won't be found.

## v0.0.12 - 2018-01-05

- Force the use of an older version of vscode-ripgrep. The latest version seems to fail to install.

## v0.0.11 - 2017-12-16

- Remove command logging

## v0.0.10 - 2017-12-16

- Add flat list view

## v0.0.9 - 2017-12-13

- Only show the tree view if it's not empty

## v0.0.8 - 2017-12-12

- Fix scanning message
- sort results to keep tree consistent
- remove empty parent nodes from the tree
- ignore files outside the root folder
- handle filenames containing spaces

## v0.0.7 - 2017-11-30

- Add auto update when saving files
- Add preference to show tree expanded by default

## v0.0.6 - 2017-11-28

- Only attempt install if todo-tree.ripgrep is not defined and show some info if the install fails

## v0.0.5 - 2017-11-28

- Attempt to install vscode-ripgrep directly from the extension

## v0.0.4 - 2017-11-28

- Attempt to reinstall vscode-ripgrep automatically

## v0.0.3 - 2017-11-28

- Removed redundant dependencies
- Add some info for fixing the windows version of vscode-ripgrep

## v0.0.2 - 2017-11-27

- Made it work on Windows
- Add configuration for ripgrep executable path
- Improved error handling

## v0.0.1 - 2017-11-23

- Initial release
