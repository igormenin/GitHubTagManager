# PLAN: Telemetry Privacy Prompt & Settings

Plano de implementação para exibir um prompt de consentimento no primeiro carregamento da extensão e introduzir uma configuração local para gerenciar a telemetria independente da IDE.

- **Project Type:** VS Code Extension
- **Task Slug:** telemetry-prompt

---

## User Review Required

> [!NOTE]
> **Comportamento do botão Fechar (X):**
> A API do VS Code não permite desabilitar o botão de fechar (X) da notificação. 
> Para atender ao requisito de não permitir que o usuário ignore a escolha, a extensão **voltará a exibir a notificação** a cada nova inicialização até que o usuário clique explicitamente em "Aceitar" ou "Recusar".

---

## Success Criteria
- [ ] Adicionar a configuração `github-tag-manager.telemetry.enabled` ao `package.json`, padrão `false`.
- [ ] Ao iniciar a extensão, se o usuário ainda não tiver decidido (estado não salvo), exibir uma notificação explicativa.
- [ ] A notificação explicará que coletamos apenas interações de tags (criação, pushes, deleções) de forma anônima e sem ler código do projeto.
- [ ] Botão **Aceitar**: Define `github-tag-manager.telemetry.enabled` para `true`, salva o estado para não perguntar mais, e inicia a telemetria.
- [ ] Botão **Recusar**: Define `github-tag-manager.telemetry.enabled` para `false` e salva o estado para não perguntar mais.
- [ ] Se fechar no **X**: Não salva o estado de decisão, mantendo a telemetria desativada e forçando a pergunta na próxima inicialização.
- [ ] Mudar a lógica de `telemetry.ts` para ler a configuração local em vez do status global da IDE.

---

## Tech Stack
- **Extension API:** VS Code Extension API (`vscode.workspace.getConfiguration`, `vscode.window.showInformationMessage`, `context.globalState`)
- **Telemetry System:** PostHog via `posthog-node`

---

## File Structure
- `package.json` [MODIFY]
- `src/telemetry.ts` [MODIFY]
- `src/extension.ts` [MODIFY]

---

## Task Breakdown

### TASK-1: Adicionar Configuração Local no package.json
- **Agent:** `backend-specialist`
- **Skill:** `nodejs-best-practices`
- **Priority:** High
- **Dependencies:** Nenhuma
- **Description:** Registrar a configuração `github-tag-manager.telemetry.enabled` no manifesto da extensão.
- **INPUT:** `package.json` sem configuração de telemetria.
- **OUTPUT:** `package.json` com seção `contributes.configuration` contendo o parâmetro de telemetria.
- **VERIFY:** Rodar compilação para garantir que o manifesto continua íntegro.

### TASK-2: Atualizar a Lógica de Consentimento da Telemetria
- **Agent:** `backend-specialist`
- **Skill:** `nodejs-best-practices`
- **Priority:** High
- **Dependencies:** `TASK-1`
- **Description:** Modificar `src/telemetry.ts` para verificar `github-tag-manager.telemetry.enabled` da configuração da extensão em vez da telemetria global da IDE.
- **INPUT:** `src/telemetry.ts` atual.
- **OUTPUT:** `src/telemetry.ts` lendo a configuração local usando `vscode.workspace.getConfiguration`.
- **VERIFY:** Garantir que se a configuração local estiver desabilitada, nenhum evento é despachado.

### TASK-3: Implementar o Prompt de Boas-Vindas e Escolha
- **Agent:** `backend-specialist`
- **Skill:** `nodejs-best-practices`
- **Priority:** High
- **Dependencies:** `TASK-2`
- **Description:** Modificar `src/extension.ts` para verificar `context.globalState` e mostrar o prompt de decisão. Salvar o estado correspondente à decisão ou persistir a notificação se for fechada.
- **INPUT:** `src/extension.ts` atual.
- **OUTPUT:** Lógica de exibição da notificação integrada no fluxo de ativação da extensão.
- **VERIFY:** Validar o salvamento de estado do consentimento.

---

## Phase X: Verification Checklist

### 1. Build Verification
- [x] Executar `npm run compile` e obter sucesso.

### 2. Runtime Verification
- [x] Iniciar a extensão e verificar se o prompt é exibido na inicialização.
- [x] Clicar no **X**: Reiniciar a extensão e garantir que o prompt aparece novamente.
- [x] Clicar em **Recusar**: Garantir que a configuração local é definida como `false`, a notificação não aparece no próximo boot e nenhum log é enviado.
- [x] Clicar em **Aceitar**: Garantir que a configuração local é definida como `true`, envia o evento de ativação e a notificação não aparece mais no próximo boot.

## ✅ PHASE X COMPLETE
- Build: ✅ Success
- Local Consent Prompt: ✅ Working (localizes automatically to PT-BR/EN)
- Configuration Overrides: ✅ Working (updates workspace configurations and persists states)
- Date: 2026-06-04
