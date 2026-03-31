import * as vscode from 'vscode';
import { getDiagnosticCount } from './diagnostics';

let statusBarItem: vscode.StatusBarItem;
let updateTimer: ReturnType<typeof setInterval> | undefined;

export function createStatusBar(context: vscode.ExtensionContext): void {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    -100,
  );

  statusBarItem.command = 'envguard.runDoctor';
  statusBarItem.tooltip = 'Click to run EnvGuard Doctor';
  context.subscriptions.push(statusBarItem);

  updateStatusBar();

  // Update periodically
  updateTimer = setInterval(updateStatusBar, 3000);
  context.subscriptions.push({ dispose: () => clearInterval(updateTimer) });

  // Update on save
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(() => {
      setTimeout(updateStatusBar, 500);
    }),
  );
}

function updateStatusBar(): void {
  const count = getDiagnosticCount();

  if (count === 0) {
    statusBarItem.text = '$(shield) EnvGuard: $(check)';
    statusBarItem.backgroundColor = undefined;
  } else {
    statusBarItem.text = `$(shield) EnvGuard: ${count} issue${count === 1 ? '' : 's'}`;
    statusBarItem.backgroundColor = new vscode.ThemeColor(
      'statusBarItem.warningBackground',
    );
  }

  statusBarItem.show();
}

export function disposeStatusBar(): void {
  statusBarItem?.dispose();
  if (updateTimer) clearInterval(updateTimer);
}
