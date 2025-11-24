
// Global State Store
const state = {
    currentView: 'HOME', // 'HOME', 'NPC', 'FACTION', 'LOCATION'
    isLoading: false,
    isImageLoading: false,
    apiKey: localStorage.getItem('V20_API_KEY') || '',
    world: {
        npcs: [],
        factions: [],
        locations: []
    },
    lastGenerated: null,
    selectedEntity: null, // For modal viewing
    
    // Subscriptions for reactivity
    listeners: [],
    
    subscribe(fn) {
        this.listeners.push(fn);
    },
    
    notify() {
        this.listeners.forEach(fn => fn(this));
    },

    // Actions
    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('V20_API_KEY', key);
        this.notify();
    },

    setWorld(newWorld) {
        this.world = newWorld;
        this.notify();
    },

    updateEntity(entity) {
        if (entity.type === 'NPC') {
            this.world.npcs = this.world.npcs.map(n => n.id === entity.data.id ? entity.data : n);
        } else if (entity.type === 'FACTION') {
            this.world.factions = this.world.factions.map(f => f.id === entity.data.id ? entity.data : f);
        } else if (entity.type === 'LOCATION') {
            this.world.locations = this.world.locations.map(l => l.id === entity.data.id ? entity.data : l);
        }
        // Update pointers if needed
        if (this.lastGenerated && this.lastGenerated.data.id === entity.data.id) {
            this.lastGenerated = entity;
        }
        if (this.selectedEntity && this.selectedEntity.data.id === entity.data.id) {
            this.selectedEntity = entity;
        }
        this.notify();
    },

    addEntity(entity) {
        if (entity.type === 'NPC') this.world.npcs.unshift(entity.data);
        if (entity.type === 'FACTION') this.world.factions.unshift(entity.data);
        if (entity.type === 'LOCATION') this.world.locations.unshift(entity.data);
        this.lastGenerated = entity;
        this.notify();
    },

    setView(view) {
        this.currentView = view;
        if (view === 'HOME') this.lastGenerated = null;
        this.notify();
    },

    setLoading(loading) {
        this.isLoading = loading;
        // We might not re-render everything on loading to avoid flicker, handled in UI
        const btn = document.getElementById('generate-btn');
        if(btn) {
            btn.disabled = loading;
            btn.innerHTML = loading ? 'Carregando...' : 'Gerar';
        }
    }
};

export default state;
