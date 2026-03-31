import * as vscode from 'vscode';
import * as fs from 'node:fs';
import * as path from 'node:path';

let diagnosticCollection: vscode.DiagnosticCollection;
let schemaKeys: Set<string> = new Set();

const PROCESS_ENV_DOT = /process\.env\.([A-Z][A-Z0-9_]*)/g;
const PROCESS_ENV_BRACKET = /process\.env\[['"]([A-Z][A-Z0-9_]*)['"]\]/g;
const PROCESS_ENV_DYNAMIC = /process\.env\[(?!['"])/g;

/**
 * Load schema keys from the schema file using simple regex extraction.
 */
function loadSchemaKeys(workspaceRoot: string): void {
  const config = vscode.workspace.getConfiguration('envguard');
  const schemaPath = config.get<string>('schemaPath', './env.schema.ts');
  const fullPath = path.resolve(workspaceRoot, schemaPath);

  schemaKeys.clear();

  if (!fs.existsSync(fullPath)) return;

  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const keyRegex = /([A-Z][A-Z0-9_]*)\s*:\s*z\./g;
    let match;
    while ((match = keyRegex.exec(content)) !== null) {
      schemaKeys.add(match[1]!);
    }
  } catch {
    // Schema file unreadable
  }
}

/**
 * Analyze a document for process.env usage issues.
 */
function analyzeDocument(document: vscode.TextDocument): void {
  if (!document.fileName.match(/\.(ts|js|tsx|jsx)$/)) return;
  if (document.fileName.includes('node_modules')) return;
  if (document.fileName.includes('env.schema')) return;

  const text = document.getText();
  const diagnostics: vscode.Diagnostic[] = [];

  // Check process.env.KEY references
  let match;

  PROCESS_ENV_DOT.lastIndex = 0;
  while ((match = PROCESS_ENV_DOT.exec(text)) !== null) {
    const key = match[1]!;
    if (schemaKeys.size > 0 && !schemaKeys.has(key)) {
      const pos = document.positionAt(match.index);
      const range = new vscode.Range(pos, document.positionAt(match.index + match[0].length));
      diagnostics.push(new vscode.Diagnostic(
        range,
        `"${key}" is not declared in env schema`,
        vscode.DiagnosticSeverity.Error,
      ));
    }
  }

  PROCESS_ENV_BRACKET.lastIndex = 0;
  while ((match = PROCESS_ENV_BRACKET.exec(text)) !== null) {
    const key = match[1]!;
    if (schemaKeys.size > 0 && !schemaKeys.has(key)) {
      const pos = document.positionAt(match.index);
      const range = new vscode.Range(pos, document.positionAt(match.index + match[0].length));
      diagnostics.push(new vscode.Diagnostic(
        range,
        `"${key}" is not declared in env schema`,
        vscode.DiagnosticSeverity.Error,
      ));
    }
  }

  // Check dynamic access
  PROCESS_ENV_DYNAMIC.lastIndex = 0;
  while ((match = PROCESS_ENV_DYNAMIC.exec(text)) !== null) {
    const pos = document.positionAt(match.index);
    const range = new vscode.Range(pos, document.positionAt(match.index + 15));
    diagnostics.push(new vscode.Diagnostic(
      range,
      'Dynamic process.env access cannot be statically verified',
      vscode.DiagnosticSeverity.Warning,
    ));
  }

  diagnosticCollection.set(document.uri, diagnostics);
}

/**
 * Count total diagnostics across all files.
 */
export function getDiagnosticCount(): number {
  let count = 0;
  diagnosticCollection.forEach((uri, diags) => {
    count += diags.length;
  });
  return count;
}

export function createDiagnostics(context: vscode.ExtensionContext): void {
  diagnosticCollection = vscode.languages.createDiagnosticCollection('envguard');
  context.subscriptions.push(diagnosticCollection);

  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (workspaceRoot) {
    loadSchemaKeys(workspaceRoot);
  }

  const config = vscode.workspace.getConfiguration('envguard');
  const autoRun = config.get<boolean>('autoRun', true);

  if (autoRun) {
    // Analyze on save
    context.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument((doc) => {
        if (doc.fileName.includes('env.schema')) {
          if (workspaceRoot) loadSchemaKeys(workspaceRoot);
          // Re-analyze all open documents
          vscode.workspace.textDocuments.forEach(analyzeDocument);
        } else {
          analyzeDocument(doc);
        }
      }),
    );

    // Analyze on open
    context.subscriptions.push(
      vscode.workspace.onDidOpenTextDocument(analyzeDocument),
    );

    // Analyze currently open documents
    vscode.workspace.textDocuments.forEach(analyzeDocument);
  }
}

export function disposeDiagnostics(): void {
  diagnosticCollection?.dispose();
}
