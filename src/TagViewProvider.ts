import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';

export class TagViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'github-tag-manager-view';
    private _view?: vscode.WebviewView;
    private _currentLanguage: 'en' | 'br' = 'en';

    constructor(private readonly _extensionUri: vscode.Uri) {
        const ideLang = vscode.env.language.toLowerCase();
        this._currentLanguage = ideLang.startsWith('pt') ? 'br' : 'en';
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        // Configurar as opções da Webview para a Sidebar
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this._extensionUri.fsPath, 'webview')),
                this._extensionUri
            ]
        };

        // Renderizar o HTML
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Registrar o listener de mensagens da Webview (Frontend)
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'changeLanguage':
                    this._currentLanguage = message.lang === 'br' ? 'br' : 'en';
                    break;
                case 'loadData':
                    await this.loadWorkspaceData();
                    break;
                case 'createTag':
                    await this.createTag(message.version, message.message, message.isAnnotated);
                    break;
                case 'pushTag':
                    await this.pushTag(message.tagName);
                    break;
                case 'pushAllTags':
                    await this.pushAllTags();
                    break;
                case 'deleteTag':
                    await this.deleteTag(message.tagName, message.localOnly);
                    break;
                case 'fetchTags':
                    await this.fetchTags();
                    break;
                case 'initRepo':
                    await this.initRepository();
                    break;
            }
        });

        // Executar carregamento inicial de dados
        this.loadWorkspaceData();
    }

    // Método público para forçar recarregamento
    public refresh() {
        this.loadWorkspaceData();
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const htmlPath = path.join(this._extensionUri.fsPath, 'webview', 'index.html');
        if (!fs.existsSync(htmlPath)) {
            return `<h3>Erro: O arquivo HTML da webview não foi encontrado em: ${htmlPath}</h3>`;
        }

        let htmlContent = fs.readFileSync(htmlPath, 'utf8');

        // Converter caminhos locais em URIs válidas do VS Code Webview
        const styleUri = webview.asWebviewUri(
            vscode.Uri.file(path.join(this._extensionUri.fsPath, 'webview', 'style.css'))
        );
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.file(path.join(this._extensionUri.fsPath, 'webview', 'main.js'))
        );

        htmlContent = htmlContent.replace('style.css', styleUri.toString());
        htmlContent = htmlContent.replace('main.js', scriptUri.toString());

        return htmlContent;
    }

    // Helper genérico para executar comandos Git no workspace
    private execGit(command: string): Promise<{ stdout: string; stderr: string }> {
        return new Promise((resolve, reject) => {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                reject(new Error('Nenhum workspace aberto. Abra um projeto Git para continuar.'));
                return;
            }
            const cwd = workspaceFolders[0].uri.fsPath;
            exec(command, { cwd }, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(stderr.trim() || error.message));
                    return;
                }
                resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
            });
        });
    }

    // Carregar informações do Git e atualizar a Webview
    private async loadWorkspaceData() {
        if (!this._view) {
            return;
        }

        this.logToWebview('Carregando informações do Git...');
        try {
            // 1. Verificar se é repositório Git
            const isGit = await this.checkIsGitRepo();
            if (!isGit) {
                this._view.webview.postMessage({
                    command: 'dataLoaded',
                    payload: { isGitRepo: false }
                });
                this.logToWebview('Aviso: O diretório atual não é um repositório Git ativo.');
                return;
            }

            // 2. Buscar branch atual e status dirty
            const branch = await this.getCurrentBranch();
            const isDirty = await this.getDirtyStatus();

            // 3. Buscar tags locais
            const tags = await this.getLocalTags();

            // 4. Buscar tags remotas (para marcar se foram enviadas)
            const remoteTags = await this.getRemoteTags();

            // 5. Descobrir última versão baseada em tag
            const currentVersion = await this.getCurrentVersionFromTags();

            // 6. Nome da pasta do projeto
            const workspaceFolders = vscode.workspace.workspaceFolders;
            const projectName = workspaceFolders ? workspaceFolders[0].name : 'Projeto Sem Nome';

            const payload = {
                isGitRepo: true,
                projectName,
                branch,
                isDirty,
                currentVersion,
                vscodeLanguage: vscode.env.language,
                tags: tags.map(tag => ({
                    name: tag.name,
                    date: tag.date,
                    message: tag.message,
                    pushed: remoteTags.includes(tag.name)
                }))
            };

            this._view.webview.postMessage({
                command: 'dataLoaded',
                payload
            });
            this.logToWebview('Informações do Git carregadas com sucesso.');

        } catch (error: any) {
            this.logToWebview(`Erro ao carregar dados do workspace: ${error.message}`, 'error');
            this._view.webview.postMessage({
                command: 'operationError',
                message: error.message
            });
        }
    }

    private async checkIsGitRepo(): Promise<boolean> {
        try {
            await this.execGit('git rev-parse --is-inside-work-tree');
            return true;
        } catch {
            return false;
        }
    }

    private async getCurrentBranch(): Promise<string> {
        try {
            const { stdout } = await this.execGit('git rev-parse --abbrev-ref HEAD');
            return stdout || 'Desconhecido';
        } catch {
            return 'Sem Branch';
        }
    }

    private async getDirtyStatus(): Promise<boolean> {
        try {
            const { stdout } = await this.execGit('git status --porcelain');
            return stdout.length > 0;
        } catch {
            return false;
        }
    }

    // Lista tags formatadas: nome|data_criacao|mensagem
    private async getLocalTags(): Promise<{ name: string; date: string; message: string }[]> {
        try {
            const { stdout } = await this.execGit(
                'git tag -l --sort=-creatordate --format="%(refname:short)|%(creatordate:short)|%(contents:subject)"'
            );

            if (!stdout) {
                return [];
            }

            return stdout.split('\n').filter(line => line.trim()).map(line => {
                const parts = line.split('|');
                return {
                    name: parts[0] || '',
                    date: parts[1] || 'Sem data',
                    message: parts[2] || 'Sem descrição'
                };
            });
        } catch {
            return [];
        }
    }

    // Busca tags no remoto para verificação
    private async getRemoteTags(): Promise<string[]> {
        try {
            const { stdout } = await this.execGit('git ls-remote --tags origin');
            if (!stdout) {
                return [];
            }

            return stdout.split('\n')
                .filter(line => line.trim())
                .map(line => {
                    const match = line.match(/refs\/tags\/(.+)$/);
                    return match ? match[1] : '';
                })
                .filter(name => name.length > 0);
        } catch {
            return [];
        }
    }

    private async getCurrentVersionFromTags(): Promise<string> {
        try {
            const { stdout } = await this.execGit('git describe --tags --abbrev=0');
            // Remove o prefixo 'v' se existir (ex: v1.2.3 -> 1.2.3)
            const cleanVersion = stdout.replace(/^v/, '');
            return cleanVersion || '0.0.0';
        } catch {
            return '0.0.0';
        }
    }

    // Criar tag localmente
    private async createTag(version: string, message: string, isAnnotated: boolean) {
        const tagName = `v${version}`;
        const cmd = isAnnotated
            ? `git tag -a ${tagName} -m "${message.replace(/"/g, '\\"')}"`
            : `git tag ${tagName}`;

        this.logToWebview(`Executando: ${cmd}`);
        try {
            await this.execGit(cmd);
            this.logToWebview(`Tag ${tagName} criada localmente com sucesso.`, 'success');
            await this.loadWorkspaceData();
        } catch (error: any) {
            this.logToWebview(`Erro ao criar tag: ${error.message}`, 'error');
            vscode.window.showErrorMessage(`Falha ao criar Tag: ${error.message}`);
        }
    }

    // Enviar tag individual para remoto
    private async pushTag(tagName: string) {
        const cmd = `git push origin ${tagName}`;
        this.logToWebview(`Executando: ${cmd}`);
        try {
            await this.execGit(cmd);
            this.logToWebview(`Tag ${tagName} enviada para o remoto 'origin'.`, 'success');
            await this.loadWorkspaceData();
        } catch (error: any) {
            this.logToWebview(`Erro ao enviar tag: ${error.message}`, 'error');
            vscode.window.showErrorMessage(`Falha ao enviar Tag: ${error.message}`);
        }
    }

    // Enviar todas as tags locais
    private async pushAllTags() {
        const title = this._currentLanguage === 'br'
            ? 'Tem certeza que deseja enviar TODAS as tags locais para o GitHub?'
            : 'Are you sure you want to push ALL local tags to GitHub?';
        const button = this._currentLanguage === 'br' ? 'Enviar Tudo' : 'Push All';
        const cancel = this._currentLanguage === 'br' ? 'Cancelar' : 'Cancel';

        const choice = await vscode.window.showWarningMessage(
            title,
            { modal: true },
            button,
            cancel
        );
        if (choice !== button) {
            return;
        }

        const cmd = `git push origin --tags`;
        this.logToWebview(
            this._currentLanguage === 'br' ? `Executando: ${cmd}` : `Running: ${cmd}`
        );
        try {
            await this.execGit(cmd);
            this.logToWebview(
                this._currentLanguage === 'br'
                    ? `Todas as tags locais foram enviadas para o remoto.`
                    : `All local tags were pushed to the remote repository.`,
                'success'
            );
            await this.loadWorkspaceData();
        } catch (error: any) {
            this.logToWebview(
                this._currentLanguage === 'br'
                    ? `Erro ao enviar tags: ${error.message}`
                    : `Error pushing tags: ${error.message}`,
                'error'
            );
            vscode.window.showErrorMessage(
                this._currentLanguage === 'br'
                    ? `Falha ao enviar Tags: ${error.message}`
                    : `Failed to push Tags: ${error.message}`
            );
        }
    }

    // Excluir tags
    private async deleteTag(tagName: string, localOnly: boolean) {
        let warningMsg = '';
        let button = '';
        let cancel = '';

        if (this._currentLanguage === 'br') {
            warningMsg = localOnly
                ? `Tem certeza que deseja excluir a tag local "${tagName}"? Isso não a removerá do remoto se já foi enviada.`
                : `⚠️ CUIDADO: Isso excluirá permanentemente a tag "${tagName}" LOCALMENTE e no repositório REMOTO (GitHub). Deseja continuar?`;
            button = 'Excluir';
            cancel = 'Cancelar';
        } else {
            warningMsg = localOnly
                ? `Are you sure you want to delete the local tag "${tagName}"? This will not remove it from remote if already pushed.`
                : `⚠️ CAUTION: This will permanently delete the tag "${tagName}" LOCALLY and on the REMOTE repository (GitHub). Do you want to continue?`;
            button = 'Delete';
            cancel = 'Cancel';
        }

        const choice = await vscode.window.showWarningMessage(
            warningMsg,
            { modal: true },
            button,
            cancel
        );
        if (choice !== button) {
            return;
        }

        this.logToWebview(
            this._currentLanguage === 'br'
                ? `Excluindo tag ${tagName} (Somente Local: ${localOnly})...`
                : `Deleting tag ${tagName} (Local Only: ${localOnly})...`
        );
        try {
            const delLocalCmd = `git tag -d ${tagName}`;
            this.logToWebview(
                this._currentLanguage === 'br' ? `Executando: ${delLocalCmd}` : `Running: ${delLocalCmd}`
            );
            await this.execGit(delLocalCmd);
            this.logToWebview(
                this._currentLanguage === 'br'
                    ? `Tag ${tagName} excluída localmente.`
                    : `Tag ${tagName} deleted locally.`,
                'success'
            );

            if (!localOnly) {
                const delRemoteCmd = `git push origin --delete ${tagName}`;
                this.logToWebview(
                    this._currentLanguage === 'br' ? `Executando: ${delRemoteCmd}` : `Running: ${delRemoteCmd}`
                );
                await this.execGit(delRemoteCmd);
                this.logToWebview(
                    this._currentLanguage === 'br'
                        ? `Tag ${tagName} excluída no remoto 'origin'.`
                        : `Tag ${tagName} deleted on remote 'origin'.`,
                    'success'
                );
            }

            await this.loadWorkspaceData();
        } catch (error: any) {
            this.logToWebview(
                this._currentLanguage === 'br'
                    ? `Erro ao excluir tag: ${error.message}`
                    : `Error deleting tag: ${error.message}`,
                'error'
            );
            vscode.window.showErrorMessage(
                this._currentLanguage === 'br'
                    ? `Falha ao excluir Tag: ${error.message}`
                    : `Failed to delete Tag: ${error.message}`
            );
            await this.loadWorkspaceData();
        }
    }

    // Sync tags (fetch)
    private async fetchTags() {
        const cmd = `git fetch origin --tags`;
        this.logToWebview(`Executando: ${cmd}`);
        try {
            await this.execGit(cmd);
            this.logToWebview(`Tags sincronizadas com o remoto 'origin'.`, 'success');
            await this.loadWorkspaceData();
        } catch (error: any) {
            this.logToWebview(`Erro ao sincronizar tags: ${error.message}`, 'error');
            vscode.window.showErrorMessage(`Falha ao sincronizar: ${error.message}`);
        }
    }

    // Inicializar repositório Git
    private async initRepository() {
        const cmd = `git init`;
        this.logToWebview(`Executando: ${cmd}`);
        try {
            await this.execGit(cmd);
            this.logToWebview(`Repositório Git iniciado com sucesso!`, 'success');
            await this.loadWorkspaceData();
        } catch (error: any) {
            this.logToWebview(`Erro ao iniciar repositório: ${error.message}`, 'error');
            vscode.window.showErrorMessage(`Falha ao iniciar repositório: ${error.message}`);
        }
    }

    // Imprimir log de console na Webview (Removido da interface visual)
    private logToWebview(text: string, type: 'info' | 'success' | 'error' = 'info') {
        console.log(`[GitLog] [${type.toUpperCase()}] ${text}`);
    }
}
