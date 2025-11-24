import React, { useState } from 'react';
import { EntityType, WorldContextState, GeneratedEntity, NpcData, FactionData, LocationData } from '../types';
import { IconEye, IconUsers } from './Icons';

// Helper Components - Defined before usage to ensure proper TS inference
const EmptyState = () => (
    <div className="col-span-full text-center py-12 bg-gray-900/50 rounded border border-gray-800 border-dashed animate-pulse">
        <p className="text-gray-600">Nada registrado no sangue ainda.</p>
    </div>
);

const LibraryCard = ({ item, type, onSelect, index }: { item: any, type: EntityType, onSelect: (e: GeneratedEntity) => void, index: number }) => (
    <div 
      onClick={() => onSelect({ type, data: item })}
      className="card-hover group bg-panel border border-gray-800 hover:border-blood transition-all p-4 rounded cursor-pointer flex gap-4 items-start animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="w-16 h-16 bg-black flex-shrink-0 overflow-hidden rounded border border-gray-700 transition-colors group-hover:border-blood">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-700 group-hover:text-blood transition-colors">
            <IconEye />
          </div>
        )}
      </div>
      <div className="overflow-hidden">
        <h4 className="font-serif font-bold text-gray-200 truncate group-hover:text-blood transition-colors">{item.name}</h4>
        <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">
           {type === EntityType.NPC ? (item as NpcData).clan : 
            type === EntityType.FACTION ? (item as FactionData).type : 
            (item as LocationData).type}
        </p>
        <p className="text-xs text-gray-600 truncate mt-1">
           {type === EntityType.NPC ? (item as NpcData).generation : 
            type === EntityType.FACTION ? (item as FactionData).leader : 
            (item as LocationData).controlledBy}
        </p>
      </div>
    </div>
);

export const ChronicleLibrary = ({ 
    worldState, 
    onSelect 
}: { 
    worldState: WorldContextState, 
    onSelect: (entity: GeneratedEntity) => void 
}) => {
    const [activeTab, setActiveTab] = useState<EntityType>(EntityType.FACTION);

    // Group NPCs by Faction Logic
    const renderNpcGroups = () => {
        if (worldState.npcs.length === 0) return <EmptyState />;

        // 1. Identify all Faction Names
        const factionNames = worldState.factions.map(f => f.name);
        
        // 2. Map NPCs to Factions
        const grouped: Record<string, NpcData[]> = {};
        const unassigned: NpcData[] = [];

        worldState.npcs.forEach(npc => {
            // Find if NPC belongs to a faction (Simple text match in relationships or history)
            const factionMatch = factionNames.find(fName => 
                (npc.relationships && npc.relationships.some(r => r.includes(fName))) || 
                npc.history.includes(fName)
            );

            if (factionMatch) {
                if (!grouped[factionMatch]) grouped[factionMatch] = [];
                grouped[factionMatch].push(npc);
            } else {
                unassigned.push(npc);
            }
        });

        // 3. Render
        return (
            <div className="space-y-8">
                {/* Render Faction Groups */}
                {Object.keys(grouped).map(factionName => (
                    <div key={factionName} className="animate-fade-in-up">
                         <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-2">
                             <span className="text-blood"><IconUsers /></span>
                             <h4 className="text-xl font-serif text-gray-200">{factionName}</h4>
                             <span className="text-xs text-gray-500 bg-gray-900 px-2 py-0.5 rounded-full">{grouped[factionName].length}</span>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                             {grouped[factionName].map((npc, i) => (
                                 <LibraryCard key={npc.id} item={npc} type={EntityType.NPC} onSelect={onSelect} index={i} />
                             ))}
                         </div>
                    </div>
                ))}

                {/* Render Unassigned */}
                {unassigned.length > 0 && (
                    <div className="animate-fade-in-up">
                        <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-2 mt-8">
                            <span className="text-gray-500"><IconUsers /></span>
                            <h4 className="text-xl font-serif text-gray-400">Independentes / Outros</h4>
                             <span className="text-xs text-gray-500 bg-gray-900 px-2 py-0.5 rounded-full">{unassigned.length}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {unassigned.map((npc, i) => (
                                <LibraryCard key={npc.id} item={npc} type={EntityType.NPC} onSelect={onSelect} index={i} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderList = (items: any[], type: EntityType) => {
        if (items.length === 0) return <EmptyState />;
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item, index) => (
                    <LibraryCard key={item.id} item={item} type={type} onSelect={onSelect} index={index} />
                ))}
            </div>
        );
    };

    return (
      <div className="w-full max-w-6xl mt-12 animate-fade-in-up">
        <h3 className="text-2xl font-serif text-gray-400 mb-6 border-b border-gray-800 pb-2">Grimório da Crônica</h3>
        
        <div className="flex gap-4 mb-6">
          {[EntityType.FACTION, EntityType.NPC, EntityType.LOCATION].map(type => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`btn-press px-4 py-2 text-sm uppercase tracking-widest rounded transition-all duration-300 ${
                activeTab === type 
                ? 'bg-blood text-white shadow-[0_0_15px_rgba(138,3,3,0.4)]' 
                : 'bg-gray-900 text-gray-500 hover:text-gray-300'
              }`}
            >
              {type === EntityType.FACTION ? 'Facções' : type === EntityType.NPC ? 'NPCs' : 'Lugares'}
            </button>
          ))}
        </div>

        {activeTab === EntityType.NPC 
            ? renderNpcGroups()
            : renderList(
                activeTab === EntityType.FACTION ? worldState.factions : worldState.locations, 
                activeTab
            )
        }
      </div>
    );
};