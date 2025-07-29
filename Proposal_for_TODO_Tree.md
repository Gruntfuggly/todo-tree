# 💬 Proposal for Todo Tree – Enhancing Tag Click Behavior

Hello,
I've been working with your excellent Todo Tree extension and would like to propose a non-intrusive improvement that retains current functionality while giving users an optional, contextual layer of interaction. Here's a concept document detailing the idea and implementation path:

---

## 🧠 Current Behavior

- Each item in the tree triggers the command `todo-tree.treeItemClick`, which opens the file and places the cursor at the line of the marker (`TODO`, `FIXME`, etc.).

---

## 💡 New Feature: Configurable Click Modes

Introduce a setting to let users choose between two interaction behaviors:

| Mode       | Description |
|------------|-------------|
| **Classic**   | Executes `todo-tree.treeItemClick` (default behavior). |
| **Extended**  | Executes `todo-tree.treeItemExtendedClick`, preserving classic navigation but adding contextual logic for reactive tags. |

---

## 🧭 Extended Logic – Contextual Second Click

- **First click** from the tree navigates to the file and the target line—this behavior remains untouched.
- Once the user lands on the tag line, a **single click on the tag text** (not a double-click) triggers extended behavior based on reactive tag configuration.
- This click can either open a contextual menu or directly perform a predefined action.

Example logic:

```js
editor.onDidChangeCursorSelection((e) => {
    const lineText = getLineText(e.selection.active.line);
    const tag = detectTag(lineText);

    if (tag && extendedModeEnabled) {
        showConfirmationMenu(tag, lineText);
    }
});
🔐 Action Confirmation
To prevent accidental data loss or changes, every contextual action requires user confirmation before execution:

js
vscode.window.showInformationMessage(
    `Confirm action "${selectedOption}" on line: ${line}`,
    'Yes', 'Cancel'
).then(response => {
    if (response === 'Yes') {
        executeAction(selectedOption, tag, line);
    }
});
🧷 Configuration Options – Reactive Tags
Tag-specific behavior should be fully defined through settings.json. This ensures safety and avoids live editing of tags that may break custom patterns.

json
"todo-tree.tags": [
    "TODO", "FIXME", "task"
],

"todo-tree.reactiveTags": [
    {
        "tag": "TODO",
        "description": "Pending code review",
        "action": "review completed",
        "clickMode": "menu",
        "menu": ["Mark as complete", "Delete"],
        "replaceWith": "DONE"
    },
    {
        "tag": "task",
        "description": "Work in progress",
        "action": "task completed",
        "clickMode": "direct",
        "replaceWith": "task-completed"
    }
],

"todo-tree.clickMode": "menu" // Default global behavior
description: semantic meaning of the tag, user-defined.

action: the semantic result of applying completion.

replaceWith: new tag name after action is applied.

clickMode: defines whether a contextual menu or direct action should occur (menu or direct).

menu: defines what options appear if menu mode is selected.

Tag editing is only done via configuration, not inline, ensuring consistency and safety.

📋 Contextual Menu (streamlined and controlled)
Only safe actions are allowed:

✅ Semantic Actions (based on tag configuration)
Mark as completed

Delete marker

🧹 Cleanup Actions
Archive entry

Temporarily hide from tree

🚫 Visual edits (icon/color) and external integrations (GitHub, Markdown notes, etc.) are not included—to preserve predictability.

📜 Licensing and Contribution Approach
Todo Tree is licensed under MIT. While this permits modification and reuse, we believe this proposal fits beautifully within the original project. Our intention is to contribute respectfully and collaboratively.
