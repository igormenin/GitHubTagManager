import * as vscode from 'vscode';
import { PostHog } from 'posthog-node';
import * as os from 'os';

class TelemetryService {
    private client: PostHog | undefined;
    private readonly token = 'phc_C4RTnbLpvHab4ziGTAEaGiAdZbngboNnLuj5otMiGqAh';
    private extensionVersion: string = 'unknown';

    constructor() {
        const extension = vscode.extensions.getExtension('igormenin.github-tag-manager');
        if (extension) {
            this.extensionVersion = extension.packageJSON.version;
        }
    }

    public initialize(): void {
        const isTelemetryEnabled = vscode.workspace.getConfiguration('github-tag-manager').get<boolean>('telemetry.enabled', false);
        if (!isTelemetryEnabled) {
            if (this.client) {
                this.shutdown();
            }
            return;
        }

        if (this.client) {
            return;
        }

        try {
            this.client = new PostHog(this.token, {
                host: 'https://us.i.posthog.com',
                preloadFeatureFlags: false
            });
        } catch (error) {
            console.error('Falha ao inicializar a telemetria do PostHog:', error);
        }
    }

    public trackEvent(eventName: string, properties: Record<string, any> = {}): void {
        const isTelemetryEnabled = vscode.workspace.getConfiguration('github-tag-manager').get<boolean>('telemetry.enabled', false);
        if (!isTelemetryEnabled) {
            if (this.client) {
                this.shutdown();
            }
            return;
        }

        // Inicialização preguiçosa caso ainda não tenha sido inicializado ou as configurações tenham mudado
        if (!this.client) {
            this.initialize();
        }

        if (!this.client) {
            return;
        }

        try {
            const defaultProperties = {
                distinctId: vscode.env.machineId,
                $lib: 'github-tag-manager-vscode',
                vscodeVersion: vscode.version,
                extensionVersion: this.extensionVersion,
                osPlatform: os.platform(),
                osRelease: os.release(),
                vscodeLanguage: vscode.env.language,
                vscodeAppName: vscode.env.appName,
                ...properties
            };

            this.client.capture({
                distinctId: vscode.env.machineId,
                event: eventName,
                properties: defaultProperties
            });
        } catch (error) {
            console.error(`Falha ao registrar o evento de telemetria '${eventName}':`, error);
        }
    }

    public async shutdown(): Promise<void> {
        if (this.client) {
            try {
                await this.client.shutdown();
            } catch (error) {
                console.error('Falha ao encerrar o cliente de telemetria do PostHog:', error);
            } finally {
                this.client = undefined;
            }
        }
    }
}

export const telemetry = new TelemetryService();
