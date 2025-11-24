
import React, { useState, useRef, useEffect } from 'react';
import { EntityType, WorldContextState, NpcData, FactionData, LocationData, GeneratedEntity } from './types';
import { generateEntity, generateEntityImage, generateFactionMap, generateFactionMembers, generateFactionLocations, generateFactionResources, upgradeNpcData, applyWorldAdjustment, harmonizeNpcProfile, generateLocationFrequenters, generateNpcMinion, suggestFrequenters } from './services/gemini';
import { exportChronicleToPDF, exportSingleEntityPDF } from './utils/pdfExport';

// Imported Components
import { IconSkull, IconMap, IconUsers, IconArrowLeft, IconDownload, IconUpload, IconFileText, IconImage, IconRefresh, IconX, IconSpinner, IconKey, IconSave } from './components/Icons';
import { DisplayCard } from './components/EntityCards';
import { ChronicleLibrary } from './components/ChronicleLibrary';

// --- Helper Functions (Simple ones remaining) ---

const exportDataJSON = (filename: string, data: any) => {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- Shared Components ---

const Modal = ({ 
  isOpen, 
  onClose, 
  children 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  children: React.ReactNode 
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-up">
      <div 
        className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-transparent rounded-lg shadow-2xl transition-all duration-300 transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-black/50 text-white p-2 rounded-full hover:bg-blood transition-colors btn-press"
        >
          <IconX />
        </button>
        {children}
      </div>
    </div>
  );
};

const ImagePromptModal = ({
    isOpen,
    onClose,
    onGenerate,
    isLoading
}: {
    isOpen: boolean,
    onClose: () => void,
    onGenerate: (prompt: string) => void,
    isLoading: boolean
}) => {
    const [prompt, setPrompt] = useState("");
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur animate-fade-in-up">
            <div className="bg-panel border border-gray-700 p-6 rounded-lg max-w-md w-full shadow-[0_0_30px_rgba(138,3,3,0.3)]">
                <h3 className="text-xl font-serif text-white mb-2 flex items-center gap-2"><IconImage /> Visão do Artista</h3>
                <p className="text-sm text-gray-400 mb-4">Descreva a cena, pose ou detalhes visuais específicos para guiar a geração da imagem.</p>
                
                <textarea 
                    value={prompt} 
                    onChange={(e) => setPrompt(e.target.value)} 
                    placeholder="Ex: Um vampiro usando terno branco, fumando na chuva, neon ao fundo..." 
                    className="w-full bg-black border border-gray-600 rounded p-3 text-white mb-6 focus:border-blood focus:outline-none transition-colors duration-300 h-32 resize-none"
                />
                
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors btn-press">Cancelar</button>
                    <button onClick={() => onGenerate(prompt)} disabled={isLoading} className="bg-blood hover:bg-red-900 text-white px-6 py-2 rounded uppercase tracking-widest font-bold flex items-center gap-2 btn-press shadow-lg shadow-blood/20">
                        {isLoading ? <IconSpinner /> : null} Gerar
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- API Key Modal ---
const ApiKeyModal = ({ isOpen, onClose, apiKey, onSave }: { isOpen: boolean, onClose: () => void, apiKey: string, onSave: (key: string) => void }) => {
    const [keyInput, setKeyInput] = useState(apiKey);
    
    useEffect(() => { setKeyInput(apiKey); }, [apiKey]);
    
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur animate-fade-in-up">
            <div className="bg-panel border border-gray-700 p-8 rounded-lg max-w-lg w-full shadow-[0_0_30px_rgba(138,3,3,0.3)] transform transition-all duration-500 hover:shadow-[0_0_50px_rgba(138,3,3,0.5)]">
                <h2 className="text-2xl font-serif text-blood mb-4 flex items-center gap-2"><IconKey /> Configuração de API</h2>
                <p className="text-gray-300 text-sm mb-4">
                    Para utilizar a inteligência artificial (Google Gemini) deste aplicativo, você deve fornecer sua própria chave de API.
                </p>
                <div className="bg-gray-900 p-4 rounded border border-gray-800 mb-6 text-sm text-gray-400">
                    <strong>Como obter sua chave:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Acesse o <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 underline">Google AI Studio</a>.</li>
                        <li>Faça login com sua conta Google.</li>
                        <li>Clique em <strong>Create API Key</strong>.</li>
                        <li>Copie o código gerado e cole abaixo.</li>
                    </ol>
                    <p className="mt-2 text-xs text-gray-500 italic">* Sua chave será salva apenas no armazenamento local do seu navegador.</p>
                </div>
                
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">API Key</label>
                <input 
                    type="password" 
                    value={keyInput} 
                    onChange={(e) => setKeyInput(e.target.value)} 
                    placeholder="Cole sua API Key aqui..." 
                    className="w-full bg-black border border-gray-600 rounded p-3 text-white mb-6 focus:border-blood focus:outline-none transition-colors duration-300"
                />
                
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors btn-press">Cancelar</button>
                    <button onClick={() => onSave(keyInput)} className="bg-blood hover:bg-red-900 text-white px-6 py-2 rounded uppercase tracking-widest font-bold flex items-center gap-2 btn-press shadow-lg shadow-blood/20">
                        <IconSave /> Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Main App ---

export default function App() {
  const [currentView, setCurrentView] = useState<'HOME' | EntityType>('HOME');
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [worldState, setWorldState] = useState<WorldContextState>({
    npcs: [],
    factions: [],
    locations: []
  });
  const [lastGenerated, setLastGenerated] = useState<GeneratedEntity | null>(null);
  const [userInput, setUserInput] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<GeneratedEntity | null>(null);
  
  // API Key State
  const [apiKey, setApiKey] = useState("");
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Image Modal State
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageTargetEntity, setImageTargetEntity] = useState<GeneratedEntity | null>(null);

  // File Import Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize API Key from LocalStorage
  useEffect(() => {
    const storedKey = localStorage.getItem('V20_API_KEY');
    if (storedKey) setApiKey(storedKey);
  }, []);

  const handleSaveApiKey = (key: string) => {
      setApiKey(key);
      localStorage.setItem('V20_API_KEY', key);
      setShowKeyModal(false);
  };

  const checkApiKey = (): boolean => {
      if (!apiKey) {
          setShowKeyModal(true);
          return false;
      }
      return true;
  }

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json.npcs) && Array.isArray(json.factions) && Array.isArray(json.locations)) {
          setWorldState(json);
          alert(`Crônica importada com sucesso!\n${json.npcs.length} NPCs, ${json.factions.length} Facções, ${json.locations.length} Lugares.`);
        } else {
          alert("Arquivo inválido. O formato não corresponde a uma crônica V20.");
        }
      } catch (err) {
        console.error(err);
        alert("Erro ao ler o arquivo. Certifique-se de que é um JSON válido.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Entity Navigation ---
  const handleOpenLink = (entityName: string) => {
      // Find entity by name (case insensitive)
      const targetName = entityName.toLowerCase().trim();
      
      const foundNpc = worldState.npcs.find(n => n.name.toLowerCase() === targetName);
      if (foundNpc) {
          setSelectedEntity({ type: EntityType.NPC, data: foundNpc });
          return;
      }
      
      const foundFaction = worldState.factions.find(f => f.name.toLowerCase() === targetName);
      if (foundFaction) {
          setSelectedEntity({ type: EntityType.FACTION, data: foundFaction });
          return;
      }
      
      const foundLocation = worldState.locations.find(l => l.name.toLowerCase() === targetName);
      if (foundLocation) {
          setSelectedEntity({ type: EntityType.LOCATION, data: foundLocation });
          return;
      }

      // Try fuzzy match? For now, exact match or nothing to avoid annoyance.
      console.log(`Entity not found: ${entityName}`);
  };

  // --- Update Handler ---
  const handleUpdateEntity = (updatedEntity: GeneratedEntity) => {
    setWorldState(prev => {
      const newState = { ...prev };
      if (updatedEntity.type === EntityType.NPC) {
        newState.npcs = prev.npcs.map(n => n.id === updatedEntity.data.id ? updatedEntity.data as NpcData : n);
      } else if (updatedEntity.type === EntityType.FACTION) {
        newState.factions = prev.factions.map(f => f.id === updatedEntity.data.id ? updatedEntity.data as FactionData : f);
      } else if (updatedEntity.type === EntityType.LOCATION) {
        newState.locations = prev.locations.map(l => l.id === updatedEntity.data.id ? updatedEntity.data as LocationData : l);
      }
      return newState;
    });

    // Also update local viewing state if necessary
    if (lastGenerated && lastGenerated.data.id === updatedEntity.data.id) {
        setLastGenerated(updatedEntity);
    }
    if (selectedEntity && selectedEntity.data.id === updatedEntity.data.id) {
        setSelectedEntity(updatedEntity);
    }
  };

  const handleGenerate = async () => {
    if (currentView === 'HOME') return;
    if (!checkApiKey()) return;

    setIsLoading(true);
    setLastGenerated(null);

    try {
      const data = await generateEntity(currentView, userInput, worldState, apiKey);
      const newId = crypto.randomUUID();
      const entityWithId = { ...data, id: newId };

      setWorldState(prev => {
        const newState = { ...prev };
        if (currentView === EntityType.NPC) newState.npcs = [entityWithId, ...prev.npcs];
        if (currentView === EntityType.FACTION) newState.factions = [entityWithId, ...prev.factions];
        if (currentView === EntityType.LOCATION) newState.locations = [entityWithId, ...prev.locations];
        return newState;
      });

      setLastGenerated({ type: currentView, data: entityWithId });
      setUserInput(""); 
    } catch (error) {
      alert("Falha ao gerar. Verifique sua chave de API.");
    } finally {
      setIsLoading(false);
    }
  };

  const initiateImageGeneration = (entity: GeneratedEntity) => {
      if (!checkApiKey()) return;
      setImageTargetEntity(entity);
      setShowImageModal(true);
  }

  const handleConfirmGenerateImage = async (prompt: string) => {
    setShowImageModal(false);
    if (!imageTargetEntity) return;
    
    setIsImageLoading(true);
    try {
      const base64Image = await generateEntityImage(imageTargetEntity.type, imageTargetEntity.data, apiKey, prompt);
      const updatedEntity = { ...imageTargetEntity, data: { ...imageTargetEntity.data, imageUrl: base64Image } } as GeneratedEntity;
      handleUpdateEntity(updatedEntity);
    } catch (e) {
      alert("Erro ao gerar imagem.");
    } finally {
      setIsImageLoading(false);
      setImageTargetEntity(null);
    }
  };

  const handleGenerateMap = async (faction: FactionData) => {
    if (!checkApiKey()) return;
    setIsLoading(true);
    try {
      const mapData = await generateFactionMap(faction, worldState, apiKey);
      const updatedFaction = { ...faction, relationshipMap: mapData };
      const updatedEntity = { type: EntityType.FACTION, data: updatedFaction } as GeneratedEntity;
      handleUpdateEntity(updatedEntity);
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar mapa relacional.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateFactionMembers = async (faction: FactionData, input: string) => {
    if (!checkApiKey()) return;
    setIsLoading(true);
    try {
      const newNpcs = await generateFactionMembers(faction, input, worldState, apiKey);
      const npcsWithIds = newNpcs.map(n => ({ ...n, id: crypto.randomUUID() }));
      setWorldState(prev => ({
        ...prev,
        npcs: [...npcsWithIds, ...prev.npcs]
      }));
      alert(`${npcsWithIds.length} membros foram criados e adicionados ao Grimório.`);
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar membros da facção.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateFactionLocations = async (faction: FactionData, input: string) => {
    if (!checkApiKey()) return;
    setIsLoading(true);
    try {
      const newLocations = await generateFactionLocations(faction, input, worldState, apiKey);
      const locsWithIds = newLocations.map(l => ({ ...l, id: crypto.randomUUID() }));
      setWorldState(prev => ({
          ...prev,
          locations: [...locsWithIds, ...prev.locations]
      }));
      alert(`${locsWithIds.length} lugares foram criados e adicionados ao Grimório.`);
    } catch(e) {
        console.error(e);
        alert("Erro ao gerar lugares para a facção.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerateFactionResources = async (faction: FactionData, input: string) => {
    if (!checkApiKey()) return;
    setIsLoading(true);
    try {
      const newResources = await generateFactionResources(faction, input, worldState, apiKey);
      const updatedFaction = {
          ...faction,
          resources: [...faction.resources, ...newResources]
      };
      handleUpdateEntity({ type: EntityType.FACTION, data: updatedFaction });
    } catch(e) {
        console.error(e);
        alert("Erro ao gerar recursos para a facção.");
    } finally {
        setIsLoading(false);
    }
  }

  const handleSuggestFrequenters = async (location: LocationData) => {
      if (!checkApiKey()) return;
      setIsLoading(true);
      try {
          const suggestions = await suggestFrequenters(location, worldState, apiKey);
          if (suggestions.length === 0) {
              alert("A IA não encontrou nenhum NPC existente que se encaixe perfeitamente. Tente adicionar manualmente.");
              return;
          }
          // Merge logic: Add suggested names to existing list, avoid duplicates
          const currentList = new Set(location.frequenters || []);
          suggestions.forEach(name => currentList.add(name));
          
          const updatedLoc = {
              ...location,
              frequenters: Array.from(currentList)
          };
          handleUpdateEntity({ type: EntityType.LOCATION, data: updatedLoc });
          alert(`${suggestions.length} frequentadores existentes foram sugeridos e adicionados.`);
      } catch (e) {
          console.error(e);
          alert("Erro ao sugerir frequentadores.");
      } finally {
          setIsLoading(false);
      }
  }

  const handleGenerateLocationFrequenters = async (location: LocationData, type: 'MORTAL' | 'VAMPIRE' | 'GHOUL') => {
      if (!checkApiKey()) return;
      setIsLoading(true);
      try {
          const newNpcs = await generateLocationFrequenters(location, type, worldState, apiKey);
          const npcsWithIds = newNpcs.map(n => ({ ...n, id: crypto.randomUUID() }));
          
          setWorldState(prev => ({
              ...prev,
              npcs: [...npcsWithIds, ...prev.npcs]
          }));

          // Link them to the location in local state for display
          const updatedLoc = {
              ...location,
              frequenters: [...(location.frequenters || []), ...npcsWithIds.map(n => n.name)]
          };
          handleUpdateEntity({ type: EntityType.LOCATION, data: updatedLoc });
          
          alert(`${npcsWithIds.length} frequentadores (${type}) foram criados e adicionados ao Grimório.`);
      } catch (e) {
          console.error(e);
          alert("Erro ao gerar frequentadores.");
      } finally {
          setIsLoading(false);
      }
  }

  const handleGenerateMinion = async (npc: NpcData, type: 'GHOUL' | 'RETAINER' | 'CHILD') => {
      if (!checkApiKey()) return;
      setIsLoading(true);
      try {
          const minion = await generateNpcMinion(npc, type, worldState, apiKey);
          const minionWithId = { ...minion, id: crypto.randomUUID() };
          
          setWorldState(prev => ({
              ...prev,
              npcs: [minionWithId, ...prev.npcs]
          }));

          // Link to parent
          const updatedParent = {
              ...npc,
              minions: [...(npc.minions || []), minion.name]
          };
          handleUpdateEntity({ type: EntityType.NPC, data: updatedParent });

          alert(`${minion.name} (${type}) foi criado.`);
      } catch (e) {
          console.error(e);
          alert("Erro ao gerar lacaio.");
      } finally {
          setIsLoading(false);
      }
  }

  const handleUpgradeNpcProfile = async (npc: NpcData) => {
    if (!checkApiKey()) return;
    setIsLoading(true);
    try {
        const updates = await upgradeNpcData(npc, apiKey);
        const updatedNpc = { ...npc, ...updates };
        handleUpdateEntity({ type: EntityType.NPC, data: updatedNpc });
    } catch (e) {
        console.error(e);
        alert("Erro ao atualizar perfil do NPC.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleHarmonizeNpc = async (npcData: NpcData): Promise<NpcData | null> => {
      if (!checkApiKey()) return null;
      setIsLoading(true);
      try {
          const harmonized = await harmonizeNpcProfile(npcData, apiKey);
          // Keep the ID and ImageUrl from the original to avoid data loss
          return { ...harmonized, id: npcData.id, imageUrl: npcData.imageUrl };
      } catch (e) {
          console.error(e);
          alert("Erro ao harmonizar a ficha.");
          return null;
      } finally {
          setIsLoading(false);
      }
  }

  const handleWorldAdjustment = async (faction: FactionData, instruction: string) => {
    if (!checkApiKey()) return;
    setIsLoading(true);
    try {
        const result = await applyWorldAdjustment(instruction, worldState, faction, apiKey);
        
        // Merge Logic
        setWorldState(prev => {
            const newNpcs = prev.npcs.map(n => {
                const updated = result.updatedNpcs.find(u => u.id === n.id);
                return updated || n;
            });
            const newFactions = prev.factions.map(f => {
                const updated = result.updatedFactions.find(u => u.id === f.id);
                return updated || f;
            });
            const newLocations = prev.locations.map(l => {
                const updated = result.updatedLocations.find(u => u.id === l.id);
                return updated || l;
            });
            
            return {
                npcs: newNpcs,
                factions: newFactions,
                locations: newLocations
            };
        });

        // If the current viewed faction was updated, reflect it
        const currentUpdated = result.updatedFactions.find(f => f.id === faction.id);
        if (currentUpdated) {
            handleUpdateEntity({ type: EntityType.FACTION, data: currentUpdated });
        }

        alert(`Realidade Reescrita: ${result.summary}`);
    } catch (e) {
        console.error(e);
        alert("Erro ao aplicar ajuste de realidade.");
    } finally {
        setIsLoading(false);
    }
  };

  const renderHome = () => (
    <div className="flex flex-col items-center min-h-[80vh] p-4 relative pt-20 animate-fade-in-up">
       <div className="absolute top-4 right-4 flex gap-2">
         <button onClick={() => setShowKeyModal(true)} className={`btn-press flex items-center gap-2 bg-gray-900 border border-gray-700 hover:border-blue-500 text-gray-400 hover:text-white px-4 py-2 rounded transition-all text-xs uppercase tracking-widest ${!apiKey ? 'animate-pulse border-red-500 text-red-500' : ''}`} title="Configurar API Key"><IconKey /> API</button>
         <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
         <button onClick={handleImportClick} className="btn-press flex items-center gap-2 bg-gray-900 border border-gray-700 hover:border-blue-500 text-gray-400 hover:text-white px-4 py-2 rounded transition-all text-xs uppercase tracking-widest" title="Carregar JSON"><IconUpload /> Importar</button>
         <button onClick={() => exportChronicleToPDF(worldState)} className="btn-press flex items-center gap-2 bg-gray-900 border border-gray-700 hover:border-white text-gray-400 hover:text-white px-4 py-2 rounded transition-all text-xs uppercase tracking-widest" title="Exportar Crônica em PDF"><IconFileText /> PDF</button>
         <button onClick={() => exportDataJSON('cronica_v20_dados', worldState)} className="btn-press flex items-center gap-2 bg-gray-900 border border-gray-700 hover:border-blood text-gray-400 hover:text-white px-4 py-2 rounded transition-all text-xs uppercase tracking-widest" title="Salvar Crônica em JSON"><IconDownload /> JSON</button>
      </div>

      <h1 className="text-5xl md:text-6xl font-serif text-blood mb-2 text-center tracking-wider drop-shadow-[0_4px_10px_rgba(138,3,3,0.5)] cursor-pointer hover:scale-105 transition-transform duration-500" onClick={() => setCurrentView('HOME')}>V20 Storyteller</h1>
      <p className="text-gray-400 mb-12 text-center font-sans tracking-widest uppercase text-sm opacity-80">Gerador de Crônicas Conectadas</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        <div onClick={() => setCurrentView(EntityType.FACTION)} className="card-hover group bg-panel border border-gray-800 hover:border-blood/50 p-8 rounded-lg cursor-pointer hover:shadow-[0_0_20px_rgba(138,3,3,0.2)] flex flex-col items-center">
          <div className="p-4 bg-black/40 rounded-full mb-6 group-hover:text-blood transition-colors duration-300 group-hover:scale-110 transform"><IconUsers /></div>
          <h2 className="text-2xl font-serif text-gray-200 mb-2">Facção</h2>
          <p className="text-center text-gray-500 text-sm">Crie coteries, sectos ou guildas criminosas que disputam poder.</p>
        </div>

        <div onClick={() => setCurrentView(EntityType.LOCATION)} className="card-hover group bg-panel border border-gray-800 hover:border-blood/50 p-8 rounded-lg cursor-pointer hover:shadow-[0_0_20px_rgba(138,3,3,0.2)] flex flex-col items-center">
          <div className="p-4 bg-black/40 rounded-full mb-6 group-hover:text-blood transition-colors duration-300 group-hover:scale-110 transform"><IconMap /></div>
          <h2 className="text-2xl font-serif text-gray-200 mb-2">Lugar</h2>
          <p className="text-center text-gray-500 text-sm">Crie Elysiums, refúgios, racks ou boates controladas por vampiros.</p>
        </div>

        <div onClick={() => setCurrentView(EntityType.NPC)} className="card-hover group bg-panel border border-gray-800 hover:border-blood/50 p-8 rounded-lg cursor-pointer hover:shadow-[0_0_20px_rgba(138,3,3,0.2)] flex flex-col items-center">
          <div className="p-4 bg-black/40 rounded-full mb-6 group-hover:text-blood transition-colors duration-300 group-hover:scale-110 transform"><IconSkull /></div>
          <h2 className="text-2xl font-serif text-gray-200 mb-2">NPC</h2>
          <p className="text-center text-gray-500 text-sm">Crie anciões, neófitos ou ghouls com histórias ricas e influências.</p>
        </div>
      </div>

      <ChronicleLibrary worldState={worldState} onSelect={setSelectedEntity} />

      <div className="mt-16 pb-8 text-gray-600 text-xs uppercase tracking-widest flex gap-8">
        <span>Facções: <span className="text-blood font-bold">{worldState.factions.length}</span></span>
        <span>Lugares: <span className="text-blood font-bold">{worldState.locations.length}</span></span>
        <span>NPCs: <span className="text-blood font-bold">{worldState.npcs.length}</span></span>
      </div>
    </div>
  );

  const renderGenerator = () => {
    const title = currentView === EntityType.FACTION ? 'Nova Facção' : currentView === EntityType.LOCATION ? 'Novo Lugar' : 'Novo NPC';
    const placeholder = currentView === EntityType.FACTION 
      ? 'Ex: O Comando Vermelho, um grupo Anarquista violento que controla o tráfico...' 
      : currentView === EntityType.LOCATION 
      ? 'Ex: A Catedral de Sangue, um Elysium secreto no subsolo...' 
      : 'Ex: Um Nosferatu hacker que sabe tudo sobre o Príncipe...';

    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 animate-fade-in-up">
        <button onClick={() => { setCurrentView('HOME'); setLastGenerated(null); setUserInput(""); }} className="group flex items-center text-gray-500 hover:text-blood mb-6 transition-colors text-sm uppercase tracking-widest">
          <span className="mr-2 transform group-hover:-translate-x-1 transition-transform"><IconArrowLeft /></span> Voltar
        </button>

        <h2 className="text-3xl font-serif text-white mb-6 border-b border-gray-800 pb-4">{title}</h2>

        <div className="bg-panel p-6 rounded-lg border border-gray-800 mb-8 shadow-xl">
          <label className="block text-gray-400 text-sm font-bold mb-2 uppercase tracking-wide">Diretrizes (Opcional)</label>
          <textarea 
            value={userInput} 
            onChange={(e) => setUserInput(e.target.value)} 
            className="w-full bg-black/50 border border-gray-700 text-gray-200 p-4 rounded focus:outline-none focus:border-blood h-32 resize-none transition-colors duration-300" 
            placeholder={placeholder} 
          />
          <button onClick={handleGenerate} disabled={isLoading} className={`btn-press mt-4 w-full py-3 px-6 rounded font-serif font-bold tracking-wider uppercase transition-all flex justify-center items-center gap-3 ${isLoading ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-blood hover:bg-red-900 text-white shadow-lg hover:shadow-red-900/20'}`}>
            {isLoading ? <IconSpinner /> : null} {isLoading ? 'Invocando Sangue...' : 'Gerar'}
          </button>
        </div>

        {lastGenerated && (
          <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h3 className="text-xl font-serif text-blood flex items-center">
                <span className="w-2 h-2 bg-blood rounded-full mr-3 animate-pulse"></span> Resultado
              </h3>
              <div className="flex gap-2">
                 <button onClick={() => initiateImageGeneration(lastGenerated)} disabled={isImageLoading} className={`btn-press flex items-center gap-2 px-3 py-1 text-xs uppercase tracking-widest rounded border transition-all ${!!lastGenerated.data.imageUrl ? 'bg-gray-800 border-gray-700 text-white hover:border-blood' : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-blood hover:text-white'}`}>
                   {isImageLoading ? 'Pintando...' : !!lastGenerated.data.imageUrl ? <><IconRefresh /> Regenerar Imagem</> : <><IconImage /> Criar Imagem</>}
                 </button>
                 <button onClick={() => exportSingleEntityPDF(lastGenerated)} className="btn-press flex items-center gap-2 bg-gray-900 border border-gray-700 hover:border-white text-gray-300 hover:text-white px-3 py-1 rounded text-xs uppercase tracking-widest"><IconFileText /> PDF Card</button>
                 <button onClick={() => exportDataJSON(`v20_${lastGenerated.type.toLowerCase()}_${lastGenerated.data.name.replace(/\s/g, '_')}`, lastGenerated.data)} className="btn-press flex items-center gap-2 bg-gray-900 border border-gray-700 hover:border-white text-gray-300 hover:text-white px-3 py-1 rounded text-xs uppercase tracking-widest"><IconDownload /> JSON</button>
              </div>
            </div>
            
            <div id="card-capture">
               <DisplayCard 
                entity={lastGenerated} 
                onUpdate={handleUpdateEntity} 
                onGenerateMap={handleGenerateMap} 
                onGenerateMembers={handleGenerateFactionMembers} 
                onGenerateLocations={handleGenerateFactionLocations} 
                onGenerateResources={handleGenerateFactionResources}
                isLoading={isLoading} 
                onGenerateImage={initiateImageGeneration} 
                isImageLoading={isImageLoading}
                onUpgradeProfile={handleUpgradeNpcProfile}
                onApplyAdjustment={handleWorldAdjustment}
                onHarmonizeNpc={handleHarmonizeNpc}
                onGenerateLocationFrequenters={handleGenerateLocationFrequenters}
                onGenerateMinion={handleGenerateMinion}
                onSuggestFrequenters={handleSuggestFrequenters}
                npcList={worldState.npcs}
                apiKey={apiKey}
                onOpenLink={handleOpenLink}
                worldState={worldState}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-darkbg text-gray-300 selection:bg-blood selection:text-white font-sans overflow-x-hidden">
      <ApiKeyModal isOpen={showKeyModal} onClose={() => setShowKeyModal(false)} onSave={handleSaveApiKey} apiKey={apiKey} />
      <ImagePromptModal isOpen={showImageModal} onClose={() => setShowImageModal(false)} onGenerate={handleConfirmGenerateImage} isLoading={isImageLoading} />
      
      {currentView === 'HOME' ? renderHome() : renderGenerator()}
      
      <Modal isOpen={!!selectedEntity} onClose={() => setSelectedEntity(null)}>
        {selectedEntity && (
           <div className="w-full">
              <div className="flex justify-end p-2 bg-gray-900 border-b border-gray-800 mb-2 gap-2">
                 <button onClick={() => initiateImageGeneration(selectedEntity)} disabled={isImageLoading} className={`btn-press flex items-center gap-2 px-3 py-1 text-xs uppercase tracking-widest rounded border transition-colors ${!!selectedEntity.data.imageUrl ? 'bg-gray-800 border-gray-700 text-white hover:border-blood' : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-blood hover:text-white'}`}>
                   {isImageLoading ? 'Pintando...' : !!selectedEntity.data.imageUrl ? <><IconRefresh /> Regenerar Imagem</> : <><IconImage /> Criar Imagem</>}
                 </button>
                <button onClick={() => exportSingleEntityPDF(selectedEntity)} className="btn-press flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-300 hover:text-white px-3 py-1 rounded text-xs uppercase tracking-widest"><IconFileText /> PDF Card</button>
              </div>
              <div id="modal-card-capture">
                <DisplayCard 
                  entity={selectedEntity} 
                  onUpdate={handleUpdateEntity} 
                  onGenerateMap={handleGenerateMap} 
                  onGenerateMembers={handleGenerateFactionMembers} 
                  onGenerateLocations={handleGenerateFactionLocations} 
                  onGenerateResources={handleGenerateFactionResources}
                  isLoading={isLoading} 
                  onGenerateImage={initiateImageGeneration} 
                  isImageLoading={isImageLoading}
                  onUpgradeProfile={handleUpgradeNpcProfile}
                  onApplyAdjustment={handleWorldAdjustment}
                  onHarmonizeNpc={handleHarmonizeNpc}
                  onGenerateLocationFrequenters={handleGenerateLocationFrequenters}
                  onGenerateMinion={handleGenerateMinion}
                  onSuggestFrequenters={handleSuggestFrequenters}
                  npcList={worldState.npcs}
                  apiKey={apiKey}
                  onOpenLink={handleOpenLink}
                  worldState={worldState}
                />
              </div>
           </div>
        )}
      </Modal>
    </div>
  );
}