import * as vscode from 'vscode';
import { TagViewProvider } from './TagViewProvider';
import { telemetry } from './telemetry';

export function activate(context: vscode.ExtensionContext) {
    const provider = new TagViewProvider(context);

    // Registrar o provedor de visualização da barra lateral
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(TagViewProvider.viewType, provider)
    );

    // Comando para abrir/focar na barra lateral
    context.subscriptions.push(
        vscode.commands.registerCommand('github-tag-manager.open', () => {
            vscode.commands.executeCommand('workbench.view.extension.github-tag-manager-sidebar');
        })
    );

    // Comando para sincronização/recarregamento manual
    context.subscriptions.push(
        vscode.commands.registerCommand('github-tag-manager.refresh', () => {
            provider.refresh();
        })
    );

    // Atualização reativa automática quando o workspace ou editor ativo mudar
    vscode.workspace.onDidChangeWorkspaceFolders(() => provider.refresh(), null, context.subscriptions);
    vscode.window.onDidChangeActiveTextEditor(() => provider.refresh(), null, context.subscriptions);
}

export function deactivate() {
    return telemetry.shutdown();
}
