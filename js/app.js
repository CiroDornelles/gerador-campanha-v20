
import state from './state.js';
import { generateEntity } from './api.js';
import { Components } from './components.js';
import { Icons } from './icons.js';

// --- Main Render Function ---
function render() {
    const app = document.getElementById('app');
    app.innerHTML = '';

    // 1. Header/Nav
    const header = document.createElement('header');
    header.className = "p-4 flex justify-between items-center bg-panel border-b border-gray-800";
    header.innerHTML = `
        <h1 class="text-xl font-serif text-blood font-bold cursor-pointer" onclick="window.app.goHome()">V20 Storyteller</h1>
        <div class="flex gap-2">
            <button onclick="window.app.openApiKeyModal()" class="text-xs uppercase tracking-widest hover:text-white ${!state.apiKey ? 'text-red-500 animate-pulse' : 'text-gray-500'}">
                ${Icons.key} API
            </button>
        </div>
    `;
    app.appendChild(header);

    // 2. Main Content Area
    const main = document.createElement('main');
    main.className = "flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full";

    if (state.currentView === 'HOME') {
        main.innerHTML = renderHome();
    } else {
        main.innerHTML = renderGenerator();
    }
    app.appendChild(main);
}

function renderHome() {
    // Render Library
    const npcsHtml = state.world.npcs.map(n => Components.libraryCard(n, 'NPC')).join('');
    const factsHtml = state.world.factions.map(f => Components.libraryCard(f, 'FACTION')).join('');
    
    return `
        <div class="text-center mb-12">
            <h1 class="text-5xl font-serif text-blood mb-2">Grimório da Crônica</h1>
            <p class="text-gray-500 text-sm uppercase tracking-widest">Gerador Conectado V20</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <button onclick="window.app.goTo('NPC')" class="bg-panel border border-gray-800 hover:border-blood p-8 rounded text-center group transition-all">
                <div class="text-blood mb-4 transform group-hover:scale-110 transition-transform inline-block">${Icons.skull}</div>
                <h2 class="text-xl font-serif text-white">Novo NPC</h2>
            </button>
            <button onclick="window.app.goTo('FACTION')" class="bg-panel border border-gray-800 hover:border-blood p-8 rounded text-center group transition-all">
                <div class="text-blood mb-4 transform group-hover:scale-110 transition-transform inline-block">${Icons.users}</div>
                <h2 class="text-xl font-serif text-white">Nova Facção</h2>
            </button>
            <button onclick="window.app.goTo('LOCATION')" class="bg-panel border border-gray-800 hover:border-blood p-8 rounded text-center group transition-all">
                <div class="text-blood mb-4 transform group-hover:scale-110 transition-transform inline-block">${Icons.map}</div>
                <h2 class="text-xl font-serif text-white">Novo Lugar</h2>
            </button>
        </div>

        <div class="space-y-8">
            ${npcsHtml ? `<h3 class="font-serif text-gray-400 border-b border-gray-800 pb-2">NPCs Recentes</h3><div class="grid grid-cols-1 md:grid-cols-3 gap-4">${npcsHtml}</div>` : ''}
            ${factsHtml ? `<h3 class="font-serif text-gray-400 border-b border-gray-800 pb-2 mt-8">Facções Recentes</h3><div class="grid grid-cols-1 md:grid-cols-3 gap-4">${factsHtml}</div>` : ''}
        </div>
    `;
}

function renderGenerator() {
    const title = state.currentView === 'NPC' ? 'Novo NPC' : state.currentView === 'FACTION' ? 'Nova Facção' : 'Novo Local';
    
    let resultHtml = '';
    if (state.lastGenerated) {
        if(state.lastGenerated.type === 'NPC') resultHtml = Components.npcCard(state.lastGenerated.data);
        // Add other types here...
    }

    return `
        <button onclick="window.app.goHome()" class="mb-6 text-gray-500 hover:text-white flex items-center gap-2 text-sm uppercase tracking-widest">${Icons.arrowLeft} Voltar</button>
        <h2 class="text-3xl font-serif text-white mb-6 border-b border-gray-800 pb-4">${title}</h2>
        
        <div class="bg-panel p-6 rounded border border-gray-800 mb-8">
            <textarea id="user-input" class="w-full bg-black/50 border border-gray-700 rounded p-4 text-white h-32 focus:border-blood outline-none" placeholder="Descreva o que você quer (opcional)..."></textarea>
            <button id="generate-btn" onclick="window.app.generate()" class="w-full mt-4 bg-blood hover:bg-red-900 text-white py-3 rounded font-serif font-bold uppercase tracking-widest transition-colors">Gerar</button>
        </div>

        <div id="result-container">
            ${resultHtml}
        </div>
    `;
}

// --- Global Actions (Attached to Window for HTML access) ---
window.app = {
    goHome: () => state.setView('HOME'),
    goTo: (view) => state.setView(view),
    
    openApiKeyModal: () => {
        const overlay = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');
        content.innerHTML = `
            <div class="bg-panel p-8 rounded border border-gray-700">
                <h2 class="text-xl font-serif text-blood mb-4">Configurar API Key (Google Gemini)</h2>
                <input type="text" id="api-key-input" value="${state.apiKey}" class="w-full bg-black border border-gray-600 p-2 text-white rounded mb-4">
                <div class="flex justify-end gap-2">
                    <button onclick="document.getElementById('modal-overlay').classList.add('hidden')" class="px-4 py-2 text-gray-400">Cancelar</button>
                    <button onclick="window.app.saveApiKey()" class="bg-blood text-white px-4 py-2 rounded">Salvar</button>
                </div>
            </div>
        `;
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
    },

    saveApiKey: () => {
        const key = document.getElementById('api-key-input').value;
        state.setApiKey(key);
        document.getElementById('modal-overlay').classList.add('hidden');
        render(); // Re-render to update header state
    },

    generate: async () => {
        if (!state.apiKey) { alert("Configure a API Key primeiro!"); return; }
        const input = document.getElementById('user-input').value;
        state.setLoading(true);
        
        try {
            const data = await generateEntity(state.currentView, input, state.world, state.apiKey);
            const entity = { type: state.currentView, data: { ...data, id: crypto.randomUUID() } };
            state.addEntity(entity); // Adds to list and sets lastGenerated
        } catch (e) {
            console.error(e);
            alert("Erro na geração. Verifique o console.");
        } finally {
            state.setLoading(false);
        }
    },

    openEntity: (type, id) => {
        // Simple navigation for now
        console.log("Opening", type, id);
    }
};

// Init
state.subscribe(render);
render();
