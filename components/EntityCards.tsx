
import React, { useState, useEffect } from 'react';
import { NpcData, FactionData, LocationData, EntityType, GeneratedEntity, Rumor, WorldContextState } from '../types';
import { IconSkull, IconMap, IconUsers, IconRefresh, IconSpinner, IconNetwork, IconPlus, IconMagic, IconBriefcase, IconDownload, IconEye, IconX, IconDice } from './Icons';
import { EditControls, InputField, TextAreaField, ArrayField } from './FormFields';
import { RelationshipGraph } from './RelationshipGraph';
import { exportNpcToFoundry } from '../utils/foundryExport';

// --- Shared Components ---

const EntityLink = ({ name, onOpen, worldState }: { name: string, onOpen?: (n: string) => void, worldState?: WorldContextState }) => {
    if (!onOpen || !worldState) return <>{name}</>;
    
    // Check if exists in state
    const cleanName = name.toLowerCase().trim();
    const exists = 
        worldState.npcs.some(n => n.name.toLowerCase() === cleanName) || 
        worldState.factions.some(f => f.name.toLowerCase() === cleanName) || 
        worldState.locations.some(l => l.name.toLowerCase() === cleanName);

    if (exists) {
        return (
            <button 
                onClick={() => onOpen(name)} 
                className="text-blue-300 hover:text-white hover:underline decoration-blue-500 underline-offset-2 transition-colors inline-block"
                title="Abrir Ficha"
            >
                {name}
            </button>
        );
    }

    return <>{name}</>;
};

const ImageContainer = ({ imageUrl, alt, onRegenerate, isLoading }: { imageUrl?: string, alt: string, onRegenerate: () => void, isLoading: boolean }) => {
  const [showLightbox, setShowLightbox] = useState(false);

  if (!imageUrl) return null;

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `v20_art_${alt.replace(/\s+/g, '_').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="w-full h-64 md:h-full bg-black border-b md:border-b-0 md:border-l border-gray-700 overflow-hidden relative group">
        <img 
          src={imageUrl} 
          alt={alt} 
          className="w-full h-full object-cover opacity-80 group-hover:opacity-40 transition-all duration-700 group-hover:scale-105 filter group-hover:blur-sm" 
        />
        
        {/* Overlay Controls */}
        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 gap-4">
           
           <div className="flex gap-4">
              <button 
                onClick={() => setShowLightbox(true)} 
                className="bg-gray-900/80 hover:bg-blood text-white p-3 rounded-full border border-gray-600 hover:border-white transition-all transform hover:scale-110 shadow-lg" 
                title="Expandir"
              >
                <IconEye />
              </button>
              
              <button 
                onClick={handleDownload} 
                className="bg-gray-900/80 hover:bg-blood text-white p-3 rounded-full border border-gray-600 hover:border-white transition-all transform hover:scale-110 shadow-lg" 
                title="Baixar Imagem"
              >
                <IconDownload />
              </button>
           </div>

           <button 
              onClick={onRegenerate} 
              disabled={isLoading} 
              className="absolute top-2 right-2 bg-black/60 hover:bg-blood text-white p-2 rounded backdrop-blur border border-white/20 btn-press" 
              title="Regenerar Imagem"
           >
             {isLoading ? <IconSpinner /> : <IconRefresh />}
           </button>
        </div>
      </div>

      {/* Lightbox Modal */}
      {showLightbox && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-up" onClick={() => setShowLightbox(false)}>
           <button 
             onClick={() => setShowLightbox(false)} 
             className="absolute top-4 right-4 text-gray-400 hover:text-white bg-gray-800/50 p-2 rounded-full transition-colors z-[101]"
           >
             <IconX />
           </button>

           <div className="relative max-w-7xl max-h-screen flex flex-col items-center" onClick={e => e.stopPropagation()}>
              <img 
                src={imageUrl} 
                alt={alt} 
                className="max-h-[85vh] max-w-full object-contain rounded shadow-[0_0_50px_rgba(138,3,3,0.3)] border border-gray-800" 
              />
              <div className="mt-4 flex gap-4">
                 <button 
                    onClick={handleDownload} 
                    className="flex items-center gap-2 bg-blood hover:bg-red-900 text-white px-6 py-2 rounded uppercase tracking-widest text-sm font-bold shadow-lg transition-transform hover:scale-105"
                 >
                    <IconDownload /> Baixar Original
                 </button>
                 <button 
                    onClick={onRegenerate} 
                    disabled={isLoading} 
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-6 py-2 rounded uppercase tracking-widest text-sm font-bold border border-gray-700 transition-colors"
                 >
                    {isLoading ? <IconSpinner /> : <IconRefresh />} Regenerar
                 </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

// --- NPC Card ---
export const NpcCard = ({ 
  data, 
  onUpdate, 
  onRegenerateImage, 
  onUpgradeProfile,
  onHarmonize,
  onGenerateMinion,
  isImageLoading,
  isLoading,
  apiKey,
  onOpenLink,
  worldState
}: { 
  data: NpcData, 
  onUpdate: (d: NpcData) => void, 
  onRegenerateImage: () => void, 
  onUpgradeProfile: (n: NpcData) => void,
  onHarmonize?: (n: NpcData) => Promise<NpcData | null>,
  onGenerateMinion?: (n: NpcData, type: 'GHOUL' | 'RETAINER' | 'CHILD') => void,
  isImageLoading: boolean,
  isLoading: boolean,
  apiKey: string,
  onOpenLink?: (name: string) => void,
  worldState?: WorldContextState
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(data);

  useEffect(() => { setFormData(data); }, [data]);

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  const handleHarmonizeClick = async () => {
      if (!onHarmonize) return;
      const harmonizedData = await onHarmonize(formData);
      if (harmonizedData) {
          setFormData(harmonizedData);
      }
  }

  const isV2 = !!data.rumors; // Check if it's the new model

  return (
    <div className="bg-paper text-gray-900 rounded shadow-lg overflow-hidden border-t-4 border-blood flex flex-col md:flex-row relative transition-all duration-500 hover:shadow-2xl">
      <EditControls isEditing={isEditing} onEdit={() => setIsEditing(true)} onSave={handleSave} onCancel={() => { setIsEditing(false); setFormData(data); }} />
      
      {!isEditing && (
         <div className="absolute bottom-2 right-2 z-20 flex gap-2">
            <button onClick={() => exportNpcToFoundry(data)} className="bg-black/80 hover:bg-purple-900 text-white p-2 rounded shadow transition-colors" title="Exportar para Foundry VTT"><IconDice /></button>
         </div>
      )}

      <div className="flex-1 p-8 relative">
        {!isEditing ? (
          <div className="animate-fade-in-up">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none transform rotate-12"><IconSkull /></div>
            <div className="flex justify-between items-baseline border-b-2 border-gray-400 pb-2 mb-4 pr-12 flex-wrap gap-2">
              <h2 className="text-3xl font-serif font-black uppercase text-blood tracking-tight">{data.name}</h2>
              <span className="font-bold font-serif bg-gray-900 text-paper px-2 py-0.5 rounded text-sm shadow">{data.clan}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-1">
                <p><strong>Geração:</strong> {data.generation}</p>
                <p><strong>Senhor:</strong> <EntityLink name={data.sire} onOpen={onOpenLink} worldState={worldState} /></p>
                <p><strong>Natureza:</strong> {data.nature}</p>
                <p><strong>Comportamento:</strong> {data.demeanor}</p>
                {data.parents && <p className="text-sm text-gray-700"><strong>Pais Mortais:</strong> {data.parents}</p>}
                {data.birthDate && <p className="mt-2 text-sm text-gray-700"><strong>Nascimento:</strong> {data.birthDate}</p>}
                {data.embraceDate && <p className="text-sm text-gray-700"><strong>Abraço:</strong> {data.embraceDate}</p>}
              </div>
              <div>
                <p className="italic text-sm border-l-2 border-blood pl-3 py-1 my-2 bg-black/5 p-2 rounded-r">"{data.quote}"</p>
                <h4 className="font-bold mt-2 uppercase text-xs tracking-widest text-gray-600">Influência</h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  {data.influence.map((inf, i) => <span key={i} className="bg-gray-800 text-white px-2 py-0.5 text-xs rounded shadow-sm transform hover:scale-105 transition-transform">{inf}</span>)}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-bold font-serif uppercase border-b border-gray-400 mb-2">História & Ambições</h4>
              <p className="text-sm leading-relaxed whitespace-pre-line text-justify space-y-2 font-serif text-gray-800">{data.history}</p>
            </div>
            
            <div className="bg-gray-200/50 p-4 rounded text-sm mb-4 border border-gray-300"><strong>Aparência:</strong> {data.appearance}</div>

            {/* V2 Section: Likes/Dislikes */}
            {data.likes && data.dislikes && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                 <div className="bg-green-100/80 p-3 rounded border border-green-300 shadow-sm transition-transform hover:scale-[1.01]">
                    <h5 className="text-green-800 text-xs font-bold uppercase mb-1">Gosta</h5>
                    <ul className="text-xs list-disc list-inside text-gray-800">
                       {data.likes.map((l, i) => <li key={i}>{l}</li>)}
                    </ul>
                 </div>
                 <div className="bg-red-100/80 p-3 rounded border border-red-300 shadow-sm transition-transform hover:scale-[1.01]">
                    <h5 className="text-red-800 text-xs font-bold uppercase mb-1">Não Gosta</h5>
                    <ul className="text-xs list-disc list-inside text-gray-800">
                       {data.dislikes.map((l, i) => <li key={i}>{l}</li>)}
                    </ul>
                 </div>
              </div>
            )}

            {/* V2 Section: Rumors */}
            {data.rumors && (
               <div className="mb-4">
                  <h4 className="font-bold font-serif uppercase border-b border-gray-400 mb-2 text-xs tracking-widest">Rumores</h4>
                  <div className="space-y-2">
                     {data.rumors.map((r, i) => (
                        <div key={i} className="text-sm border-l-4 pl-3 py-2 bg-gray-50/50 rounded-r shadow-sm transition-all hover:bg-white" 
                             style={{ borderColor: r.status === 'VERDADEIRO' ? 'green' : r.status === 'FALSO' ? '#8a0303' : '#ca8a04' }}>
                            <div className="flex justify-between items-center mb-1">
                               <span className="font-bold text-gray-700">"{r.content}"</span>
                               <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded text-white shadow-sm" 
                                     style={{ backgroundColor: r.status === 'VERDADEIRO' ? 'green' : r.status === 'FALSO' ? '#8a0303' : '#ca8a04' }}>
                                  {r.status}
                               </span>
                            </div>
                            <p className="text-xs text-gray-500 italic">{r.context}</p>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {!isV2 && (
               <button onClick={() => onUpgradeProfile(data)} disabled={isLoading} className="btn-press w-full mt-4 py-2 bg-purple-900 text-white rounded shadow hover:bg-purple-800 transition-colors uppercase text-xs tracking-widest font-bold flex justify-center items-center gap-2">
                   {isLoading ? <IconSpinner /> : <IconPlus />} Atualizar Perfil (V2)
               </button>
            )}

            {/* Minions Section */}
            {(data.minions && data.minions.length > 0) && (
                 <div className="mt-4 pt-4 border-t border-gray-300">
                    <h4 className="font-bold font-serif uppercase text-xs tracking-widest mb-2 text-gray-600">Lacaios & Crias</h4>
                    <div className="flex flex-wrap gap-2">
                        {data.minions.map((minionName, i) => (
                            <span key={i} className="bg-gray-800 text-white px-2 py-1 text-xs rounded shadow-sm border border-gray-600">
                                <EntityLink name={minionName} onOpen={onOpenLink} worldState={worldState} />
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {onGenerateMinion && (
                <div className="mt-2 pt-2">
                    <div className="flex gap-2">
                        <button onClick={() => onGenerateMinion(data, 'GHOUL')} disabled={isLoading} className="btn-press flex-1 py-1.5 bg-gray-800 text-white rounded text-xs uppercase hover:bg-blood transition-colors opacity-80 hover:opacity-100">Criar Ghoul</button>
                        <button onClick={() => onGenerateMinion(data, 'RETAINER')} disabled={isLoading} className="btn-press flex-1 py-1.5 bg-gray-800 text-white rounded text-xs uppercase hover:bg-blood transition-colors opacity-80 hover:opacity-100">Criar Mortal</button>
                        <button onClick={() => onGenerateMinion(data, 'CHILD')} disabled={isLoading} className="btn-press flex-1 py-1.5 bg-gray-800 text-white rounded text-xs uppercase hover:bg-blood transition-colors opacity-80 hover:opacity-100">Criar Cria</button>
                    </div>
                </div>
            )}

            {data.relationships && (
              <div className="mt-4">
                <h4 className="font-bold font-serif uppercase text-xs tracking-widest mb-1">Conexões</h4>
                <ul className="list-disc list-inside text-sm">
                    {data.relationships.map((rel, i) => (
                        <li key={i}><EntityLink name={rel} onOpen={onOpenLink} worldState={worldState} /></li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 pr-8 animate-fade-in-up">
             {onHarmonize && (
                <button 
                    onClick={handleHarmonizeClick} 
                    disabled={isLoading}
                    className="w-full py-2 bg-purple-900/80 border border-purple-500 text-white rounded shadow hover:bg-purple-800 transition-colors uppercase text-xs tracking-widest font-bold flex justify-center items-center gap-2 mb-4"
                >
                    {isLoading ? <IconSpinner /> : <IconMagic />} Harmonizar Ficha (Baseado na História)
                </button>
             )}

            <div className="grid grid-cols-2 gap-4">
               <InputField label="Nome" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
               <InputField label="Clã" value={formData.clan} onChange={v => setFormData({...formData, clan: v})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <InputField label="Geração" value={formData.generation} onChange={v => setFormData({...formData, generation: v})} />
               <InputField label="Senhor" value={formData.sire} onChange={v => setFormData({...formData, sire: v})} />
            </div>
             <div className="grid grid-cols-2 gap-4">
               <InputField label="Natureza" value={formData.nature} onChange={v => setFormData({...formData, nature: v})} />
               <InputField label="Comportamento" value={formData.demeanor} onChange={v => setFormData({...formData, demeanor: v})} />
            </div>
            
            <InputField label="Pais Mortais" value={formData.parents || ''} onChange={v => setFormData({...formData, parents: v})} />

            <div className="grid grid-cols-2 gap-4">
               <InputField label="Nascimento (DD/MM/AAAA HH:MM)" value={formData.birthDate || ''} onChange={v => setFormData({...formData, birthDate: v})} />
               <InputField label="Abraço (DD/MM/AAAA)" value={formData.embraceDate || ''} onChange={v => setFormData({...formData, embraceDate: v})} />
            </div>

            <InputField label="Citação" value={formData.quote} onChange={v => setFormData({...formData, quote: v})} />
            <TextAreaField label="História (5 Parágrafos)" value={formData.history} onChange={v => setFormData({...formData, history: v})} apiKey={apiKey} />
            <TextAreaField label="Aparência" value={formData.appearance} onChange={v => setFormData({...formData, appearance: v})} apiKey={apiKey} />
            
            <ArrayField label="Influência" values={formData.influence} onChange={v => setFormData({...formData, influence: v})} />
            <ArrayField label="Gostos (5)" values={formData.likes || []} onChange={v => setFormData({...formData, likes: v})} />
            <ArrayField label="Desgostos (5)" values={formData.dislikes || []} onChange={v => setFormData({...formData, dislikes: v})} />
            <ArrayField label="Conexões" values={formData.relationships || []} onChange={v => setFormData({...formData, relationships: v})} />
          </div>
        )}
      </div>
      {data.imageUrl && (
        <div className="md:w-1/3 min-h-[300px]">
          <ImageContainer imageUrl={data.imageUrl} alt={data.name} onRegenerate={onRegenerateImage} isLoading={isImageLoading} />
        </div>
      )}
    </div>
  );
};

// --- Faction Card ---
export const FactionCard = ({ 
  data, 
  onUpdate,
  onGenerateMap, 
  onGenerateMembers,
  onGenerateLocations,
  onGenerateResources,
  onApplyAdjustment,
  isLoading,
  onRegenerateImage, 
  isImageLoading,
  apiKey,
  onOpenLink,
  worldState
}: { 
  data: FactionData, 
  onUpdate: (d: FactionData) => void,
  onGenerateMap: (f: FactionData) => void, 
  onGenerateMembers: (f: FactionData, input: string) => void,
  onGenerateLocations: (f: FactionData, input: string) => void,
  onGenerateResources: (f: FactionData, input: string) => void,
  onApplyAdjustment: (f: FactionData, instruction: string) => void,
  isLoading: boolean,
  onRegenerateImage: () => void,
  isImageLoading: boolean,
  apiKey: string,
  onOpenLink?: (n: string) => void,
  worldState?: WorldContextState
}) => {
  const [memberInput, setMemberInput] = useState("3");
  const [locationInput, setLocationInput] = useState("");
  const [resourceInput, setResourceInput] = useState("");
  const [adjustmentInput, setAdjustmentInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(data);

  useEffect(() => { setFormData(data); }, [data]);

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded shadow-lg overflow-hidden flex flex-col relative transition-all duration-300 hover:border-gray-600">
       <EditControls isEditing={isEditing} onEdit={() => setIsEditing(true)} onSave={handleSave} onCancel={() => { setIsEditing(false); setFormData(data); }} />

      <div className="flex flex-col md:flex-row">
      <div className="flex-1 p-8 relative">
        {!isEditing ? (
          <div className="animate-fade-in-up">
            <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-6 pr-12">
              <div>
                <h2 className="text-3xl font-serif text-blood tracking-wider">{data.name}</h2>
                <span className="text-gray-500 uppercase tracking-widest text-xs">{data.type}</span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Líder</p>
                <p className="text-lg font-bold text-white tracking-wide"><EntityLink name={data.leader} onOpen={onOpenLink} worldState={worldState} /></p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-blood font-serif uppercase mb-2">Objetivos</h4>
                <p className="text-gray-300 text-sm mb-4 leading-relaxed">{data.goals}</p>

                <h4 className="text-blood font-serif uppercase mb-2">Território</h4>
                <p className="text-gray-300 text-sm leading-relaxed">{data.territory}</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-gray-500 text-xs uppercase tracking-widest mb-1">Recursos</h4>
                  <div className="flex flex-wrap gap-2">
                    {data.resources.map((res, i) => <span key={i} className="border border-gray-600 text-gray-300 px-2 py-1 text-xs rounded transition-colors hover:border-gray-400 hover:text-white cursor-default">{res}</span>)}
                  </div>
                </div>
                <div>
                  <h4 className="text-gray-500 text-xs uppercase tracking-widest mb-1">Inimigos</h4>
                  <ul className="text-sm text-red-400 list-disc list-inside">
                    {data.enemies.map((enem, i) => <li key={i}><EntityLink name={enem} onOpen={onOpenLink} worldState={worldState} /></li>)}
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 border-t border-gray-800 pt-4">
              <div className="transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-gray-400 text-xs uppercase tracking-widest flex items-center gap-2"><IconNetwork /> Mapa Relacional</h4>
                  {!data.relationshipMap && <button onClick={() => onGenerateMap(data)} disabled={isLoading} className="btn-press text-xs bg-gray-800 hover:bg-gray-700 text-blood px-3 py-1 rounded border border-gray-700 transition-colors">Gerar Mapa</button>}
                </div>
                {data.relationshipMap && (
                   <div className="animate-fade-in-up">
                      <RelationshipGraph mapData={data.relationshipMap} />
                   </div>
                )}
              </div>

              <div className="space-y-4">
                 {/* Mass NPC */}
                 <div>
                    <h4 className="text-gray-400 text-xs uppercase tracking-widest flex items-center gap-2 mb-2"><IconUsers /> Popular Facção</h4>
                    <div className="bg-black/30 p-4 rounded border border-gray-800 transition-colors hover:border-gray-700">
                      <p className="text-xs text-gray-500 mb-3">Crie vampiros para a hierarquia. Qtd ou papéis.</p>
                      <div className="flex gap-2 items-center">
                        <input type="text" value={memberInput} onChange={(e) => setMemberInput(e.target.value)} placeholder="Qtd ou Cargos..." className="flex-1 bg-gray-800 border border-gray-700 text-white rounded px-3 py-1 text-sm focus:border-blood focus:outline-none transition-colors" />
                        <button onClick={() => onGenerateMembers(data, memberInput)} disabled={isLoading || !memberInput} className="btn-press bg-blood hover:bg-red-900 text-white text-xs px-3 py-1.5 rounded uppercase tracking-wider transition-colors disabled:opacity-50">{isLoading ? '...' : 'Criar'}</button>
                      </div>
                    </div>
                 </div>
                 {/* Mass Location */}
                 <div>
                    <h4 className="text-gray-400 text-xs uppercase tracking-widest flex items-center gap-2 mb-2"><IconMap /> Expandir Território</h4>
                    <div className="bg-black/30 p-4 rounded border border-gray-800 transition-colors hover:border-gray-700">
                      <p className="text-xs text-gray-500 mb-3">Crie refúgios, caça e domínios.</p>
                      <div className="flex gap-2 items-center">
                        <input type="text" value={locationInput} onChange={(e) => setLocationInput(e.target.value)} placeholder="Ex: Refúgios, Racks..." className="flex-1 bg-gray-800 border border-gray-700 text-white rounded px-3 py-1 text-sm focus:border-blood focus:outline-none transition-colors" />
                        <button onClick={() => onGenerateLocations(data, locationInput)} disabled={isLoading} className="btn-press bg-blood hover:bg-red-900 text-white text-xs px-3 py-1.5 rounded uppercase tracking-wider transition-colors disabled:opacity-50">{isLoading ? '...' : 'Criar'}</button>
                      </div>
                    </div>
                 </div>
                 
                 {/* Mass Resources - NEW */}
                 <div>
                    <h4 className="text-gray-400 text-xs uppercase tracking-widest flex items-center gap-2 mb-2"><IconBriefcase /> Adquirir Recursos</h4>
                    <div className="bg-black/30 p-4 rounded border border-gray-800 transition-colors hover:border-gray-700">
                      <p className="text-xs text-gray-500 mb-3">Gere novos assets, contatos ou relíquias.</p>
                      <div className="flex gap-2 items-center">
                        <input type="text" value={resourceInput} onChange={(e) => setResourceInput(e.target.value)} placeholder="Ex: Contatos, Armas..." className="flex-1 bg-gray-800 border border-gray-700 text-white rounded px-3 py-1 text-sm focus:border-blood focus:outline-none transition-colors" />
                        <button onClick={() => onGenerateResources(data, resourceInput)} disabled={isLoading} className="btn-press bg-blood hover:bg-red-900 text-white text-xs px-3 py-1.5 rounded uppercase tracking-wider transition-colors disabled:opacity-50">{isLoading ? '...' : 'Criar'}</button>
                      </div>
                    </div>
                 </div>

                 {/* Global Adjustment */}
                 <div>
                    <h4 className="text-purple-400 text-xs uppercase tracking-widest flex items-center gap-2 mb-2"><IconMagic /> Ajustes de Realidade</h4>
                    <div className="bg-purple-900/10 p-4 rounded border border-purple-500/30 transition-colors hover:border-purple-500/50">
                      <p className="text-xs text-purple-300/70 mb-3">Modifique esta facção e atualize NPCs/Lugares afetados na crônica.</p>
                      <textarea value={adjustmentInput} onChange={(e) => setAdjustmentInput(e.target.value)} placeholder="Ex: O líder agora é o NPC X; eles entraram em guerra com Y..." className="w-full bg-gray-800 border border-gray-700 text-white rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none transition-colors mb-2 resize-none h-16" />
                      <button onClick={() => onApplyAdjustment(data, adjustmentInput)} disabled={isLoading || !adjustmentInput} className="w-full btn-press bg-purple-900/50 hover:bg-purple-800 text-white text-xs px-3 py-1.5 rounded uppercase tracking-wider transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
                          {isLoading ? <IconSpinner /> : <IconMagic />} Reescrever Realidade
                      </button>
                    </div>
                 </div>

              </div>
            </div>
          </div>
        ) : (
           <div className="space-y-4 pr-8 animate-fade-in-up">
              <InputField label="Nome" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
              <div className="grid grid-cols-2 gap-4">
                 <InputField label="Tipo" value={formData.type} onChange={v => setFormData({...formData, type: v})} />
                 <InputField label="Líder" value={formData.leader} onChange={v => setFormData({...formData, leader: v})} />
              </div>
              <TextAreaField label="Objetivos" value={formData.goals} onChange={v => setFormData({...formData, goals: v})} apiKey={apiKey} />
              <TextAreaField label="Território" value={formData.territory} onChange={v => setFormData({...formData, territory: v})} apiKey={apiKey} />
              <ArrayField label="Recursos" values={formData.resources} onChange={v => setFormData({...formData, resources: v})} />
              <ArrayField label="Inimigos" values={formData.enemies} onChange={v => setFormData({...formData, enemies: v})} />
           </div>
        )}

      </div>
      {data.imageUrl && (
        <div className="md:w-1/3 min-h-[300px]">
          <ImageContainer imageUrl={data.imageUrl} alt={data.name} onRegenerate={onRegenerateImage} isLoading={isImageLoading} />
        </div>
      )}
      </div>
    </div>
  );
};

// --- Location Card ---
export const LocationCard = ({ 
  data, 
  onUpdate, 
  onRegenerateImage, 
  onGenerateFrequenters,
  onSuggestFrequenters,
  npcList,
  isImageLoading,
  isLoading, 
  apiKey,
  onOpenLink,
  worldState
}: { 
  data: LocationData, 
  onUpdate: (d: LocationData) => void, 
  onRegenerateImage: () => void, 
  onGenerateFrequenters?: (l: LocationData, type: 'MORTAL' | 'VAMPIRE' | 'GHOUL') => void,
  onSuggestFrequenters?: (l: LocationData) => void,
  npcList?: NpcData[],
  isImageLoading: boolean,
  isLoading?: boolean,
  apiKey: string,
  onOpenLink?: (n: string) => void,
  worldState?: WorldContextState
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(data);
  const [selectedExistingNpc, setSelectedExistingNpc] = useState("");

  useEffect(() => { setFormData(data); }, [data]);

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  const handleAddExisting = () => {
      if (!selectedExistingNpc) return;
      const current = formData.frequenters || [];
      if (!current.includes(selectedExistingNpc)) {
          const updated = { ...formData, frequenters: [...current, selectedExistingNpc] };
          setFormData(updated);
          onUpdate(updated);
      }
      setSelectedExistingNpc("");
  }

  const handleRemoveFrequenter = (name: string) => {
      const current = formData.frequenters || [];
      const updated = { ...formData, frequenters: current.filter(f => f !== name) };
      setFormData(updated);
      onUpdate(updated);
  }

  return (
    <div className="bg-black border border-gray-800 p-0 rounded-lg shadow-lg overflow-hidden flex flex-col relative transition-all hover:shadow-[0_0_20px_rgba(0,0,0,0.5)]">
      <EditControls isEditing={isEditing} onEdit={() => setIsEditing(true)} onSave={handleSave} onCancel={() => { setIsEditing(false); setFormData(data); }} />
      
      {data.imageUrl && (
        <div className="w-full h-48 md:h-64 relative group overflow-hidden">
           <ImageContainer imageUrl={data.imageUrl} alt={data.name} onRegenerate={onRegenerateImage} isLoading={isImageLoading} />
        </div>
      )}
      <div className="flex flex-col md:flex-row">
        {!isEditing ? (
          <>
            <div className="bg-gray-900 p-8 md:w-1/3 border-r border-gray-800 flex flex-col justify-center items-center text-center animate-fade-in-up">
               <div className="mb-4 text-blood opacity-80"><IconMap /></div>
               <h2 className="text-2xl font-serif text-white mb-2 tracking-wide">{data.name}</h2>
               <span className="bg-gray-800 px-3 py-1 text-xs rounded-full text-gray-400 uppercase tracking-widest">{data.type}</span>
               <div className="mt-8 w-full">
                 <p className="text-xs text-gray-500 uppercase">Controlado por</p>
                 <p className="text-blood font-bold"><EntityLink name={data.controlledBy} onOpen={onOpenLink} worldState={worldState} /></p>
               </div>
            </div>

            <div className="p-8 md:w-2/3 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
               <h4 className="font-serif text-gray-400 mb-2 uppercase tracking-widest text-xs">Descrição & Atmosfera</h4>
               <p className="text-gray-300 text-sm leading-relaxed mb-6 whitespace-pre-line">{data.description}</p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-900 p-4 rounded border border-gray-800 transition-colors hover:border-gray-700">
                    <h5 className="text-blood text-xs uppercase font-bold mb-1">Atmosfera</h5>
                    <p className="text-gray-400 text-sm">{data.atmosphere}</p>
                  </div>
                  <div className="bg-gray-900 p-4 rounded border border-gray-800 transition-colors hover:border-gray-700">
                    <h5 className="text-blood text-xs uppercase font-bold mb-1">Segurança</h5>
                    <p className="text-gray-400 text-sm">{data.security}</p>
                  </div>
               </div>

               <div className="border-t border-gray-800 pt-4">
                    <h4 className="font-serif text-gray-400 mb-2 uppercase tracking-widest text-xs flex items-center gap-2"><IconUsers /> Gerenciar Frequentadores</h4>
                    
                    {/* Current Frequenters List */}
                    {data.frequenters && data.frequenters.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {data.frequenters.map((freq, i) => (
                                <span key={i} className="flex items-center gap-1 bg-gray-800 text-gray-200 px-2 py-1 text-xs rounded border border-gray-700 group">
                                    <EntityLink name={freq} onOpen={onOpenLink} worldState={worldState} />
                                    <button onClick={() => handleRemoveFrequenter(freq)} className="text-gray-500 hover:text-red-500 ml-1"><IconX /></button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Management Controls */}
                    <div className="space-y-3">
                         {/* 1. Add Existing / AI Suggest */}
                         <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                             <p className="text-[10px] text-gray-500 uppercase mb-2">Adicionar Existente</p>
                             <div className="flex gap-2 mb-2">
                                <select 
                                    value={selectedExistingNpc} 
                                    onChange={(e) => setSelectedExistingNpc(e.target.value)}
                                    className="flex-1 bg-gray-800 border border-gray-600 text-white text-xs rounded p-1.5 focus:border-blood focus:outline-none"
                                >
                                    <option value="">Selecione um NPC...</option>
                                    {npcList?.map(n => (
                                        <option key={n.id} value={n.name}>{n.name} ({n.clan})</option>
                                    ))}
                                </select>
                                <button onClick={handleAddExisting} disabled={!selectedExistingNpc} className="bg-gray-700 hover:bg-gray-600 text-white px-3 rounded text-xs"><IconPlus /></button>
                             </div>
                             
                             {onSuggestFrequenters && (
                                 <button 
                                     onClick={() => onSuggestFrequenters(data)} 
                                     disabled={isLoading} 
                                     className="w-full py-1.5 bg-purple-900/40 border border-purple-500/50 hover:bg-purple-900/60 text-purple-200 rounded text-xs uppercase tracking-wider flex justify-center items-center gap-2 transition-colors"
                                 >
                                    {isLoading ? <IconSpinner /> : <IconMagic />} IA Sugerir (Baseado em Lore)
                                 </button>
                             )}
                         </div>

                         {/* 2. Generate New (Secondary) */}
                         {onGenerateFrequenters && (
                            <div className="mt-2 opacity-80 hover:opacity-100 transition-opacity">
                                <p className="text-[10px] text-gray-600 uppercase mb-1">Ou Criar Novos (Desconhecidos)</p>
                                <div className="flex gap-2">
                                    <button onClick={() => onGenerateFrequenters(data, 'MORTAL')} disabled={isLoading} className="flex-1 py-1.5 bg-black border border-gray-800 hover:border-gray-500 text-gray-500 hover:text-white rounded text-[10px] uppercase tracking-widest transition-colors">
                                        Mortais
                                    </button>
                                    <button onClick={() => onGenerateFrequenters(data, 'VAMPIRE')} disabled={isLoading} className="flex-1 py-1.5 bg-black border border-gray-800 hover:border-gray-500 text-gray-500 hover:text-white rounded text-[10px] uppercase tracking-widest transition-colors">
                                        Vampiros
                                    </button>
                                    <button onClick={() => onGenerateFrequenters(data, 'GHOUL')} disabled={isLoading} className="flex-1 py-1.5 bg-black border border-gray-800 hover:border-gray-500 text-gray-500 hover:text-white rounded text-[10px] uppercase tracking-widest transition-colors">
                                        Ghouls
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
               </div>
            </div>
          </>
        ) : (
          <div className="w-full p-8 space-y-4 animate-fade-in-up">
             <InputField label="Nome" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
             <div className="grid grid-cols-2 gap-4">
               <InputField label="Tipo" value={formData.type} onChange={v => setFormData({...formData, type: v})} />
               <InputField label="Controlado Por" value={formData.controlledBy} onChange={v => setFormData({...formData, controlledBy: v})} />
             </div>
             <TextAreaField label="Descrição" value={formData.description} onChange={v => setFormData({...formData, description: v})} apiKey={apiKey} />
             <div className="grid grid-cols-2 gap-4">
               <InputField label="Atmosfera" value={formData.atmosphere} onChange={v => setFormData({...formData, atmosphere: v})} />
               <InputField label="Segurança" value={formData.security} onChange={v => setFormData({...formData, security: v})} />
             </div>
             <ArrayField label="Frequentadores (Lista Manual)" values={formData.frequenters || []} onChange={v => setFormData({...formData, frequenters: v})} />
          </div>
        )}
      </div>
    </div>
  );
};

// --- Wrapper ---
export const DisplayCard = ({ 
  entity, 
  onUpdate,
  onGenerateMap, 
  onGenerateMembers,
  onGenerateLocations,
  onGenerateResources,
  onApplyAdjustment,
  onGenerateImage,
  onUpgradeProfile,
  onHarmonizeNpc,
  onGenerateLocationFrequenters,
  onSuggestFrequenters,
  onGenerateMinion,
  npcList,
  isLoading,
  isImageLoading,
  apiKey,
  onOpenLink,
  worldState
}: { 
  entity: GeneratedEntity, 
  onUpdate: (e: GeneratedEntity) => void,
  onGenerateMap: (f: FactionData) => void, 
  onGenerateMembers: (f: FactionData, input: string) => void,
  onGenerateLocations: (f: FactionData, input: string) => void,
  onGenerateResources: (f: FactionData, input: string) => void,
  onApplyAdjustment: (f: FactionData, instruction: string) => void,
  onGenerateImage: (e: GeneratedEntity) => void,
  onUpgradeProfile: (n: NpcData) => void,
  onHarmonizeNpc?: (n: NpcData) => Promise<NpcData | null>,
  onGenerateLocationFrequenters?: (l: LocationData, type: 'MORTAL' | 'VAMPIRE' | 'GHOUL') => void,
  onSuggestFrequenters?: (l: LocationData) => void,
  onGenerateMinion?: (n: NpcData, type: 'GHOUL' | 'RETAINER' | 'CHILD') => void,
  npcList?: NpcData[],
  isLoading: boolean,
  isImageLoading: boolean,
  apiKey: string,
  onOpenLink?: (n: string) => void,
  worldState?: WorldContextState
}) => {
  switch (entity.type) {
    case EntityType.NPC:
      return <NpcCard data={entity.data} onUpdate={(d) => onUpdate({...entity, data: d})} onRegenerateImage={() => onGenerateImage(entity)} onUpgradeProfile={onUpgradeProfile} onHarmonize={onHarmonizeNpc} onGenerateMinion={onGenerateMinion} isImageLoading={isImageLoading} isLoading={isLoading} apiKey={apiKey} onOpenLink={onOpenLink} worldState={worldState} />;
    case EntityType.FACTION:
      return <FactionCard data={entity.data} onUpdate={(d) => onUpdate({...entity, data: d})} onGenerateMap={onGenerateMap} onGenerateMembers={onGenerateMembers} onGenerateLocations={onGenerateLocations} onGenerateResources={onGenerateResources} onApplyAdjustment={onApplyAdjustment} isLoading={isLoading} onRegenerateImage={() => onGenerateImage(entity)} isImageLoading={isImageLoading} apiKey={apiKey} onOpenLink={onOpenLink} worldState={worldState} />;
    case EntityType.LOCATION:
      return <LocationCard data={entity.data} onUpdate={(d) => onUpdate({...entity, data: d})} onRegenerateImage={() => onGenerateImage(entity)} onGenerateFrequenters={onGenerateLocationFrequenters} onSuggestFrequenters={onSuggestFrequenters} npcList={npcList} isImageLoading={isImageLoading} isLoading={isLoading} apiKey={apiKey} onOpenLink={onOpenLink} worldState={worldState} />;
    default:
      return null;
  }
};