const path = require('path');
const vscode = require('vscode');

function toReference(editor) {
  const document = editor.document;
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
  const filePath = document.uri.fsPath;

  let referencePath = filePath;
  if (workspaceFolder) {
    const relativePath = path.relative(workspaceFolder.uri.fsPath, filePath);
    if (relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
      referencePath = relativePath;
    }
  }

  const normalizedPath = referencePath.split(path.sep).join('\\');
  const selection = editor.selection;
  const startLine = selection.start.line + 1;
  let endLine = startLine;
  if (!selection.isEmpty) {
    endLine = selection.end.line + 1;
    if (selection.end.character === 0 && selection.end.line > selection.start.line) {
      endLine = selection.end.line;
    }
  }

  return `@${normalizedPath}#L${startLine}-${endLine}`;
}

function getActiveEditor() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('AutoPath: no active editor.');
    return null;
  }

  return editor;
}

function activate(context) {
  const copyReference = vscode.commands.registerCommand('autopath.copyReference', async () => {
    const editor = getActiveEditor();
    if (!editor) {
      return;
    }

    const reference = toReference(editor);
    await vscode.env.clipboard.writeText(reference);
    vscode.window.setStatusBarMessage(`Copied ${reference}`, 2000);
  });

  const copyReferenceWithCode = vscode.commands.registerCommand('autopath.copyReferenceWithCode', async () => {
    const editor = getActiveEditor();
    if (!editor) {
      return;
    }

    const selection = editor.selection;
    if (selection.isEmpty) {
      vscode.window.showWarningMessage('AutoPath: select code first to copy reference with code.');
      return;
    }

    const reference = toReference(editor);
    const selectedCode = editor.document.getText(selection);
    await vscode.env.clipboard.writeText(`${reference}\n\n${selectedCode}`);
    vscode.window.setStatusBarMessage(`Copied ${reference} with code`, 2000);
  });

  context.subscriptions.push(copyReference, copyReferenceWithCode);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
