# PLAN: GitHub Tag Manager Extension for Antigravity IDE

Plano detalhado para desenvolvimento da extensão de gerenciamento de Tags Git e versionamento semântico independente de linguagem.

---

## Project Overview
Esta extensão adiciona ao Antigravity IDE uma interface visual para gerenciar tags Git locais e remotas. O objetivo é facilitar o versionamento semântico (Major, Minor, Patch) de forma transparente, executando comandos Git nativos diretamente pelo CLI local do usuário.

- **Project Type:** WEB / VS Code Extension
- **Repository:** Greenfield (`c:\Projetos\GitHubTagManager`)

---

## Success Criteria
- [ ] Exibir a versão semântica atual identificada por tags do Git.
- [ ] Fornecer botões rápidos para incrementar versões Major, Minor ou Patch (ex: `1.0.2` -> `1.1.0`).
- [ ] Listar o histórico cronológico de todas as tags locais existentes no repositório.
- [ ] Criar tags anotadas locais com mensagens personalizadas.
- [ ] Enviar (push) tags selecionadas para o servidor remoto (`origin`) via CLI local do Git.
- [ ] Deletar tags locais e remotas através da interface.
- [ ] Interface visual perfeitamente integrada aos temas de cores do IDE.

---

## Tech Stack
- **Extension API:** VS Code Extension API (compatível com Antigravity IDE)
- **Programming Language:** TypeScript / JavaScript
- **Webview UI:** Vanilla HTML5, Vanilla CSS3 (usando CSS custom properties baseadas em temas do VS Code), Vanilla JavaScript
- **Git Execution:** Node.js `child_process` (execução assíncrona do CLI local `git`)

---

## File Structure
O projeto será organizado da seguinte forma:

```plaintext
GitHubTagManager/
├── docs/
│   └── PLAN-git-tag-manager.md    # Este plano de projeto
├── webview/
│   ├── index.html                 # Interface da Webview
│   ├── style.css                  # Estilo Vanilla CSS (com variáveis VS Code)
│   └── main.js                    # Lógica da Webview (postMessage/DOM)
├── src/
│   ├── extension.ts               # Inicialização da extensão e registro de comandos
│   └── TagPanel.ts                # Controlador da Webview e executor de comandos Git
├── package.json                   # Manifesto da extensão
├── tsconfig.json                  # Configuração do TypeScript
└── README.md                      # Documentação básica de uso
```

---

## Task Breakdown

### Task 1: Scaffolding e Configurações Iniciais
- **ID:** `TASK-1`
- **Agent:** `backend-specialist`
- **Skill:** `nodejs-best-practices`
- **Priority:** High
- **Dependencies:** Nenhuma
- **Description:** Criar arquivos de configuração do projeto: `package.json`, `tsconfig.json` e estrutura de pastas básica.
- **INPUT:** Workspace vazio.
- **OUTPUT:** `package.json` configurado como extensão VS Code (incluindo o comando `github-tag-manager.open` e dependências `@types/vscode`), `tsconfig.json` apontando para compilation targets adequados.
- **VERIFY:** Executar `npm install` e garantir que o projeto baixa dependências e reconhece a estrutura básica sem erros.

---

### Task 2: Ponto de Entrada da Extensão (extension.ts)
- **ID:** `TASK-2`
- **Agent:** `backend-specialist`
- **Skill:** `nodejs-best-practices`
- **Priority:** High
- **Dependencies:** `TASK-1`
- **Description:** Implementar o arquivo `src/extension.ts` para registrar o comando principal e instanciar o painel.
- **INPUT:** Estrutura básica configurada.
- **OUTPUT:** Arquivo `src/extension.ts` ativando a extensão e invocando o `TagPanel`.
- **VERIFY:** Compilar o código TypeScript (`npm run compile`) verificando se não há erros de sintaxe ou imports.

---

### Task 3: Controlador Git e Gerenciamento do Painel (TagPanel.ts)
- **ID:** `TASK-3`
- **Agent:** `backend-specialist`
- **Skill:** `nodejs-best-practices`
- **Priority:** High
- **Dependencies:** `TASK-2`
- **Description:** Criar a lógica que gerencia o ciclo de vida do painel WebviewPanel e executa comandos Git locais (`git tag`, `git describe`, `git push`, `git tag -d`, etc.) de forma assíncrona.
- **INPUT:** Entrada da extensão ativada.
- **OUTPUT:** Classe `TagPanel` em `src/TagPanel.ts` implementando tratamento de mensagens (`onDidReceiveMessage`) e retorno de dados Git via `postMessage`.
- **VERIFY:** Validar o tratamento de retornos de erro do Git (ex: repositório sem tags, sem repositório Git iniciado, ou falha de conexão com remoto) e adicionar tratamento adequado para evitar que a extensão quebre.

---

### Task 4: Layout HTML da Interface (index.html)
- **ID:** `TASK-4`
- **Agent:** `frontend-specialist`
- **Skill:** `frontend-design`
- **Priority:** Medium
- **Dependencies:** `TASK-1`
- **Description:** Desenvolver a estrutura HTML do painel em `webview/index.html`.
- **INPUT:** Estrutura de arquivos básica.
- **OUTPUT:** Arquivo `webview/index.html` com divs organizadas: Header, Card de Versão Atual, Botões rápidos de Incremento (Major, Minor, Patch), Input de Mensagem/Anotação, Timeline de histórico de tags e área de logs/mensagens de status.
- **VERIFY:** Visualizar o arquivo HTML em um navegador básico para assegurar estrutura DOM correta.

---

### Task 5: Estilização Visual Premium (style.css)
- **ID:** `TASK-5`
- **Agent:** `frontend-specialist`
- **Skill:** `ui-ux-pro-max`
- **Priority:** Medium
- **Dependencies:** `TASK-4`
- **Description:** Estilizar a interface em `webview/style.css`. Deve usar variáveis CSS do VS Code (`--vscode-editor-background`, `--vscode-foreground`, etc.) para adaptação de tema. Aplicar efeitos de glassmorphism em cards, bordas arredondadas modernas, sombras elegantes e transições animadas suaves ao passar o mouse ou clicar em botões.
- **INPUT:** HTML cru em `webview/index.html`.
- **OUTPUT:** `webview/style.css` completo e referenciado pelo HTML.
- **VERIFY:** Verificar se o design é responsivo, legível tanto em temas escuros (Dark) quanto claros (Light) e visualmente premium.

---

### Task 6: Script Interativo da Webview (main.js)
- **ID:** `TASK-6`
- **Agent:** `frontend-specialist`
- **Skill:** `frontend-design`
- **Priority:** Medium
- **Dependencies:** `TASK-4`
- **Description:** Implementar a lógica JS da Webview em `webview/main.js` para manipulação de eventos e comunicação com a extensão.
- **INPUT:** HTML e CSS estruturados.
- **OUTPUT:** `webview/main.js` enviando mensagens (ex: `{ command: 'createTag', version: '1.2.0', message: '...' }`) e reagindo a mensagens de atualização do backend (ex: renderizando tags na timeline).
- **VERIFY:** Conferir que a comunicação do `vscode.postMessage` e o listener `window.addEventListener('message', ...)` funcionam sem erros no console.

---

### Task 7: Integração Final, Testes e Polimento
- **ID:** `TASK-7`
- **Agent:** `test-engineer`
- **Skill:** `testing-patterns`
- **Priority:** High
- **Dependencies:** `TASK-3`, `TASK-5`, `TASK-6`
- **Description:** Realizar a integração de ponta a ponta. Corrigir incompatibilidades e polir interações.
- **INPUT:** Todos os arquivos de frontend e backend prontos.
- **OUTPUT:** Extensão totalmente operacional.
- **VERIFY:** Executar a extensão em uma instância do Extension Development Host, interagir com um repositório git fictício e validar a criação, listagem e bump de tags com sucesso.

---

## Phase X: Verification Checklist

### 1. Build Verification
- [ ] Executar compilação TypeScript com `npm run compile`. Sem erros ou avisos críticos.

### 2. Runtime Verification
- [ ] Executar a extensão via Extension Development Host.
- [ ] Testar em repositório sem commits (deve exibir erro amigável de Git).
- [ ] Testar em repositório com commits mas sem tags (deve sugerir criar versão inicial `1.0.0`, `0.1.0` ou `0.0.1`).
- [ ] Testar bump de Patch (ex: `1.0.0` -> `1.0.1`).
- [ ] Testar bump de Minor (ex: `1.0.0` -> `1.1.0`).
- [ ] Testar bump de Major (ex: `1.0.0` -> `2.0.0`).
- [ ] Testar cancelamento/criação de tags com e sem mensagem.
- [ ] Validar exclusão de tag local.

### 3. Rule Compliance
- [ ] Não usar cores hexadecimais de tom roxo/violeta fixas (conforme Purple Ban).
- [ ] Seguir diretrizes de design limpo e interfaces premium.
- [ ] Socratic Gate foi devidamente respeitado e concluído.

### 4. Phase X Completion Marker
A ser adicionado após a aprovação de todos os testes na execução.
