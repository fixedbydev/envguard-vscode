import * as vscode from 'vscode';
import { createDiagnostics, disposeDiagnostics } from './diagnostics';
import { createStatusBar, disposeStatusBar } from './statusbar';

export function activate(context: vscode.ExtensionContext): void {
  console.log('EnvGuard extension activated');

  createDiagnostics(context);
  createStatusBar(context);

  context.subscriptions.push(
    vscode.commands.registerCommand('envguard.runDoctor', () => {
      const terminal = vscode.window.createTerminal('EnvGuard');
      terminal.show();
      terminal.sendText('npx env-guard doctor');
    }),

    vscode.commands.registerCommand('envguard.syncExample', () => {
      const terminal = vscode.window.createTerminal('EnvGuard');
      terminal.show();
      terminal.sendText('npx env-guard diff --env .env --example .env.example');
    }),

    vscode.commands.registerCommand('envguard.showDashboard', () => {
      const terminal = vscode.window.createTerminal('EnvGuard Dashboard');
      terminal.show();
      terminal.sendText('npx env-guard serve --port 4321');
      setTimeout(() => {
        vscode.env.openExternal(vscode.Uri.parse('http://localhost:4321'));
      }, 2000);
    }),
  );
}

export function deactivate(): void {
  disposeDiagnostics();
  disposeStatusBar();
}
