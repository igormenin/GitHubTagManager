import * as vscode from 'vscode';
import { TagViewProvider } from './TagViewProvider';
import { telemetry } from './telemetry';

export function activate(context: vscode.ExtensionContext) {
    // Verificar consentimento da telemetria
    const promptShown = context.globalState.get<boolean>('telemetryPromptShown');

    if (!promptShown) {
        const savedLang = context.globalState.get<'en' | 'br'>('extensionLanguage');
        const isPortuguese = savedLang 
            ? savedLang === 'br' 
            : vscode.env.language.toLowerCase().startsWith('pt');
        const msg = isPortuguese
            ? "Para nos ajudar a melhorar o GitHub Tag Manager, gostaríamos de coletar estatísticas de uso anônimas (interações de tags). Nenhum código do seu projeto será lido. Deseja habilitar a telemetria?"
            : "To help us improve GitHub Tag Manager, we would like to collect anonymous usage statistics (tag interactions). No project code is ever read. Would you like to enable telemetry?";
        const acceptLabel = isPortuguese ? "Aceitar" : "Accept";
        const declineLabel = isPortuguese ? "Recusar" : "Decline";

        vscode.window.showInformationMessage(msg, acceptLabel, declineLabel).then(async (selection) => {
            if (selection === acceptLabel) {
                await vscode.workspace.getConfiguration('github-tag-manager').update('telemetry.enabled', true, vscode.ConfigurationTarget.Global);
                await context.globalState.update('telemetryPromptShown', true);
                telemetry.initialize();
                telemetry.trackEvent('extension_activated');
            } else if (selection === declineLabel) {
                await vscode.workspace.getConfiguration('github-tag-manager').update('telemetry.enabled', false, vscode.ConfigurationTarget.Global);
                await context.globalState.update('telemetryPromptShown', true);
            }
            // Se o usuário fechar clicando no 'X' (retorna undefined), não marcamos 'telemetryPromptShown'
            // para que o prompt seja reexibido na próxima inicialização da extensão.
        });
    } else {
        telemetry.initialize();
        telemetry.trackEvent('extension_activated');
    }

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
