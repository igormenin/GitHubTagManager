// Obter a API de comunicação do VS Code
const vscode = acquireVsCodeApi();

// Dicionário de Idiomas (i18n)
const locales = {
    en: {
        currentVersion: "Current Version",
        incrementVersion: "Increment Version",
        tagMessage: "Tag Message (Annotated)",
        tagPlaceholder: "Write the changelog or description for this version...",
        createAnnotated: "Create as Annotated Tag (-a)",
        createLocalTag: "Create Local Tag",
        secureConnection: "Secure local connection and execution",
        downloadRemote: "Download Remote Tags",
        pushAllTags: "Push All Tags",
        gitHistoryTitle: "Git Tag History",
        emptyStateTitle: "No Tags Created",
        emptyStateBody: "No tags were found in this repository. Use the sidebar panel to start versioning by creating your first tag.",
        errorStateTitle: "No Git Repository",
        errorStateBody: "This directory is not initialized as a Git repository or has no commits.",
        initRepoBtn: "Initialize Git Repository",
        badgeSync: "GitHub Sync",
        badgeLocal: "Local Only",
        btnPush: "Push to GitHub",
        btnDelete: "Delete Local",
        loading: "Loading...",
        branchLabel: "branch: --",
        statusLabel: "status: --",
        statusClean: "CLEAN",
        statusDirty: "PENDING CHANGES"
    },
    br: {
        currentVersion: "Versão Atual",
        incrementVersion: "Incrementar Versão",
        tagMessage: "Mensagem da Tag (Anotada)",
        tagPlaceholder: "Escreva o changelog ou descrição para esta versão...",
        createAnnotated: "Criar como Tag Anotada (-a)",
        createLocalTag: "Criar Tag Local",
        secureConnection: "Conexão e execução local segura",
        downloadRemote: "Baixar TAGs Remotas",
        pushAllTags: "Enviar Todas as Tags (Push)",
        gitHistoryTitle: "Histórico de Tags Git",
        emptyStateTitle: "Nenhuma Tag Criada",
        emptyStateBody: "Nenhuma tag foi encontrada neste repositório. Use o painel lateral para iniciar o versionamento criando sua primeira tag.",
        errorStateTitle: "Sem Repositório Git",
        errorStateBody: "Este diretório não está inicializado como um repositório Git ou não possui commits.",
        initRepoBtn: "Inicializar Repositório Git",
        badgeSync: "GitHub Sync",
        badgeLocal: "Local Only",
        btnPush: "Push para GitHub",
        btnDelete: "Excluir Local",
        loading: "Carregando...",
        branchLabel: "branch: --",
        statusLabel: "status: --",
        statusClean: "LIMPO",
        statusDirty: "ALTERAÇÕES PENDENTES"
    }
};

let currentLang = localStorage.getItem('github-tag-manager-lang') || 'en';

// Estado Local
let state = {
    projectName: '',
    branch: '',
    isDirty: false,
    currentVersion: '0.0.0',
    tags: [],
    selectedBumpType: null,
    targetVersion: null
};

// Elementos do DOM
const projectNameEl = document.getElementById('project-name');
const branchBadgeEl = document.getElementById('branch-badge');
const dirtyBadgeEl = document.getElementById('dirty-badge');
const currentVersionEl = document.getElementById('current-version');

const btnLangEn = document.getElementById('btn-lang-en');
const btnLangBr = document.getElementById('btn-lang-br');

const previewPatchEl = document.getElementById('preview-patch');
const previewMinorEl = document.getElementById('preview-minor');
const previewMajorEl = document.getElementById('preview-major');

const tagMessageEl = document.getElementById('tag-message');
const isAnnotatedEl = document.getElementById('is-annotated');
const btnCreateTag = document.getElementById('btn-create-tag');

const btnSync = document.getElementById('btn-sync');
const btnPushAll = document.getElementById('btn-push-all');
const btnInitGit = document.getElementById('btn-init-git');

const tagCountDisplay = document.getElementById('tag-count-display');
const gitErrorState = document.getElementById('git-error-state');
const emptyState = document.getElementById('empty-state');
const timelineList = document.getElementById('timeline-list');
const timelineArea = document.getElementById('timeline-area');
const controlSidebar = document.getElementById('control-sidebar');

// Funções de Gerenciamento de Idioma
function setLanguage(lang) {
    if (locales[lang]) {
        currentLang = lang;
        localStorage.setItem('github-tag-manager-lang', lang);
        updateLanguageUI();
        vscode.postMessage({ command: 'changeLanguage', lang: currentLang });
        
        // Se houver tags carregadas, re-renderizar para traduzir botões e badges
        if (state.tags && state.tags.length > 0) {
            renderTimeline();
        }
        
        // Atualizar status dirty/clean se aplicável
        if (state.projectName) {
            if (state.isDirty) {
                dirtyBadgeEl.textContent = locales[currentLang].statusDirty;
            } else {
                dirtyBadgeEl.textContent = locales[currentLang].statusClean;
            }
        }
    }
}

function updateLanguageUI() {
    const dict = locales[currentLang];
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            el.textContent = dict[key];
        }
    });

    if (tagMessageEl) {
        tagMessageEl.placeholder = dict.tagPlaceholder;
    }

    btnLangEn.classList.toggle('active', currentLang === 'en');
    btnLangBr.classList.toggle('active', currentLang === 'br');
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    vscode.postMessage({ command: 'loadData' });
    setupEventListeners();
    updateLanguageUI();
});

// Configurar listeners de eventos de clique e inputs
function setupEventListeners() {
    // Seletores de Idioma
    btnLangEn.addEventListener('click', () => setLanguage('en'));
    btnLangBr.addEventListener('click', () => setLanguage('br'));



    // Cliques nos botões de Bump
    const bumpButtons = document.querySelectorAll('.btn-bump');
    bumpButtons.forEach(button => {
        button.addEventListener('click', () => {
            bumpButtons.forEach(btn => btn.classList.remove('active'));
            
            const bumpType = button.getAttribute('data-type');
            if (state.selectedBumpType === bumpType) {
                // Desmarcar se clicado novamente
                state.selectedBumpType = null;
                state.targetVersion = null;
                btnCreateTag.disabled = true;
                btnCreateTag.textContent = locales[currentLang].createLocalTag;
            } else {
                state.selectedBumpType = bumpType;
                button.classList.add('active');
                
                // Calcular nova versão
                state.targetVersion = calculateBumpVersion(state.currentVersion, bumpType);
                btnCreateTag.disabled = false;
                btnCreateTag.textContent = `${locales[currentLang].createLocalTag} (v${state.targetVersion})`;
            }
        });
    });

    // Clique em Criar Tag
    btnCreateTag.addEventListener('click', () => {
        if (!state.targetVersion) return;

        const isAnnotated = isAnnotatedEl.checked;
        const message = tagMessageEl.value.trim();

        if (isAnnotated && !message) {
            const alertMsg = currentLang === 'br'
                ? 'Tags anotadas exigem uma mensagem. Digite uma mensagem ou desmarque a opção "Criar como Tag Anotada".'
                : 'Annotated tags require a message. Enter a message or uncheck "Create as Annotated Tag".';
            alert(alertMsg);
            tagMessageEl.focus();
            return;
        }

        vscode.postMessage({
            command: 'createTag',
            version: state.targetVersion,
            message: message,
            isAnnotated: isAnnotated
        });

        // Resetar formulário
        tagMessageEl.value = '';
        state.selectedBumpType = null;
        state.targetVersion = null;
        bumpButtons.forEach(btn => btn.classList.remove('active'));
        btnCreateTag.disabled = true;
        btnCreateTag.textContent = locales[currentLang].createLocalTag;
    });

    // Clique em Sync (Fetch)
    btnSync.addEventListener('click', () => {
        vscode.postMessage({ command: 'fetchTags' });
    });

    // Clique em Push All Tags
    btnPushAll.addEventListener('click', () => {
        vscode.postMessage({ command: 'pushAllTags' });
    });

    // Inicializar Repositório Git
    btnInitGit.addEventListener('click', () => {
        vscode.postMessage({ command: 'initRepo' });
    });
}

// Algoritmo robusto de cálculo SemVer
function calculateBumpVersion(current, type) {
    // Limpar espaços e remover qualquer prefixo 'v' ou 'V' temporariamente
    const cleanStr = current.replace(/^[vV]/, '').trim();
    
    // Separar sufixos de pré-lançamento se existirem (ex: 1.35-beta -> 1.35 e -beta)
    const suffixMatch = cleanStr.match(/^([\d.]+)(.*)$/);
    let versionNumbers = cleanStr;
    let suffix = '';
    
    if (suffixMatch) {
        versionNumbers = suffixMatch[1];
        suffix = suffixMatch[2] || '';
    }
    
    const parts = versionNumbers.split('.');
    
    let major = parts.length >= 1 ? (parseInt(parts[0], 10) || 0) : 0;
    let minor = parts.length >= 2 ? (parseInt(parts[1], 10) || 0) : 0;
    let patch = parts.length >= 3 ? (parseInt(parts[2], 10) || 0) : 0;
    
    if (type === 'major') {
        major += 1;
        minor = 0;
        patch = 0;
    } else if (type === 'minor') {
        minor += 1;
        patch = 0;
    } else if (type === 'patch') {
        patch += 1;
    }
    
    // Reconstrói a versão mantendo o mesmo número de dígitos da original
    // Caso seja incremento de PATCH, força pelo menos 3 dígitos (x.y.z)
    let result = '';
    if (parts.length >= 3 || type === 'patch') {
        result = `${major}.${minor}.${patch}`;
    } else {
        result = `${major}.${minor}`;
    }
    
    return result + suffix;
}

// Escutar mensagens vindas da extensão (Backend)
window.addEventListener('message', event => {
    const message = event.data;

    switch (message.command) {
        case 'dataLoaded':
            const data = message.payload;
            // Se o usuário nunca escolheu um idioma manualmente, inicializa com base no idioma do VS Code
            if (!localStorage.getItem('github-tag-manager-lang') && data.vscodeLanguage) {
                const ideLang = data.vscodeLanguage.toLowerCase();
                currentLang = ideLang.startsWith('pt') ? 'br' : 'en';
                localStorage.setItem('github-tag-manager-lang', currentLang);
                vscode.postMessage({ command: 'changeLanguage', lang: currentLang });
            }
            updateLanguageUI();
            updateUI(data);
            break;
        case 'operationError':
            alert(`Erro na operação: ${message.message}`);
            break;
    }
});

// Atualizar elementos da UI com base no payload recebido
function updateUI(payload) {
    if (!payload.isGitRepo) {
        // Exibir tela de erro de Git
        gitErrorState.classList.remove('hidden');
        emptyState.classList.add('hidden');
        timelineList.classList.add('hidden');
        controlSidebar.style.opacity = '0.5';
        disableSidebarControls(true);
        projectNameEl.textContent = currentLang === 'br' ? 'Sem Repositório' : 'No Repository';
        branchBadgeEl.textContent = 'branch: --';
        dirtyBadgeEl.textContent = 'status: --';
        currentVersionEl.textContent = 'v0.0.0';
        return;
    }

    // Ativar área normal
    gitErrorState.classList.add('hidden');
    timelineList.classList.remove('hidden');
    controlSidebar.style.opacity = '1';
    disableSidebarControls(false);

    // Salvar estado
    state.projectName = payload.projectName;
    state.branch = payload.branch;
    state.isDirty = payload.isDirty;
    state.currentVersion = payload.currentVersion;
    state.tags = payload.tags || [];

    // Renderizar informações básicas
    projectNameEl.textContent = state.projectName;
    branchBadgeEl.textContent = `branch: ${state.branch}`;
    
    // Status Dirty
    if (state.isDirty) {
        dirtyBadgeEl.textContent = locales[currentLang].statusDirty;
        dirtyBadgeEl.className = 'badge pending';
    } else {
        dirtyBadgeEl.textContent = locales[currentLang].statusClean;
        dirtyBadgeEl.className = 'badge pushed';
    }

    currentVersionEl.textContent = `v${state.currentVersion}`;

    // Calcular previews dinâmicos de Bump
    previewPatchEl.textContent = `v${calculateBumpVersion(state.currentVersion, 'patch')}`;
    previewMinorEl.textContent = `v${calculateBumpVersion(state.currentVersion, 'minor')}`;
    previewMajorEl.textContent = `v${calculateBumpVersion(state.currentVersion, 'major')}`;

    // Re-aplicar seleção se houver
    if (state.selectedBumpType) {
        state.targetVersion = calculateBumpVersion(state.currentVersion, state.selectedBumpType);
        btnCreateTag.textContent = `Criar Tag Local (v${state.targetVersion})`;
    }

    // Renderizar Timeline de Tags
    renderTimeline();
}

function disableSidebarControls(disabled) {
    const inputs = controlSidebar.querySelectorAll('button, textarea, input[type="checkbox"]');
    inputs.forEach(input => {
        // Ignorar o botão de inicializar git que está fora do sidebar, mas se for outros botões, desabilitar
        if (input.id !== 'btn-init-git') {
            input.disabled = disabled;
        }
    });
}

// Renderizar timeline das tags
function renderTimeline() {
    timelineList.innerHTML = '';
    const tagCount = state.tags.length;
    tagCountDisplay.textContent = `${tagCount} tag${tagCount !== 1 ? 's' : ''}`;

    if (tagCount === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    state.tags.forEach(tag => {
        const item = document.createElement('div');
        item.className = `timeline-item ${tag.pushed ? 'pushed' : 'pending'}`;

        // Header da Tag
        const header = document.createElement('div');
        header.className = 'tag-header';

        const nameWrapper = document.createElement('div');
        nameWrapper.className = 'tag-name-wrapper';

        // Indicador visual de colapso/expansão
        const chevron = document.createElement('span');
        chevron.className = 'tag-chevron';
        chevron.textContent = '▶';
        nameWrapper.appendChild(chevron);

        const name = document.createElement('span');
        name.className = 'tag-name';
        name.textContent = tag.name;

        const syncBadge = document.createElement('span');
        syncBadge.className = `badge ${tag.pushed ? 'pushed' : 'pending'}`;
        syncBadge.textContent = tag.pushed ? locales[currentLang].badgeSync : locales[currentLang].badgeLocal;

        nameWrapper.appendChild(name);
        nameWrapper.appendChild(syncBadge);

        const date = document.createElement('span');
        date.className = 'tag-date';
        date.textContent = tag.date;

        header.appendChild(nameWrapper);
        header.appendChild(date);
        item.appendChild(header);

        // Mensagem/Descrição da Tag (Oculta por padrão no CSS)
        const body = document.createElement('div');
        body.className = 'tag-body';
        body.textContent = tag.message || (currentLang === 'br' ? 'Sem descrição' : 'No description');
        item.appendChild(body);

        // Ações da Tag (Somente para tags locais pendentes de envio)
        if (!tag.pushed) {
            const actions = document.createElement('div');
            actions.className = 'tag-actions';

            // Botão Push individual
            const btnPush = document.createElement('button');
            btnPush.className = 'btn btn-primary';
            btnPush.textContent = locales[currentLang].btnPush;
            btnPush.addEventListener('click', (e) => {
                e.stopPropagation(); // Impede que o clique feche o item
                vscode.postMessage({ command: 'pushTag', tagName: tag.name });
            });
            actions.appendChild(btnPush);

            // Botão Deletar Local
            const btnDeleteLocal = document.createElement('button');
            btnDeleteLocal.className = 'btn btn-danger';
            btnDeleteLocal.textContent = locales[currentLang].btnDelete;
            btnDeleteLocal.addEventListener('click', (e) => {
                e.stopPropagation(); // Impede que o clique feche o item
                vscode.postMessage({ command: 'deleteTag', tagName: tag.name, localOnly: true });
            });
            actions.appendChild(btnDeleteLocal);

            item.appendChild(actions);
        }

        // Listener de clique para expandir/colapsar
        item.addEventListener('click', () => {
            item.classList.toggle('expanded');
        });

        timelineList.appendChild(item);
    });
}
