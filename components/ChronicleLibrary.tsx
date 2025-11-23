import React, { useState } from 'react';
import { EntityType, WorldContextState, GeneratedEntity, NpcData, FactionData, LocationData } from '../types';
import { IconEye } from './Icons';

export const ChronicleLibrary = ({ 
    worldState, 
    onSelect 
}: { 
    worldState: WorldContextState, 
    onSelect: (entity: GeneratedEntity) => void 
}) => {
    const [activeTab, setActiveTab] = useState<EntityType>(EntityType.FACTION);

    let items: any[] = [];
    if (activeTab === EntityType.FACTION) items = worldState.factions;
    if (activeTab === EntityType.NPC) items = worldState.npcs;
    if (activeTab === EntityType.LOCATION) items = worldState.locations;

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.length === 0 && (
            <div className="col-span-full text-center py-12 bg-gray-900/50 rounded border border-gray-800 border-dashed animate-pulse">
              <p className="text-gray-600">Nada registrado no sangue ainda.</p>
            </div>
          )}
          {items.map((item, index) => (
            <div 
              key={item.id}
              onClick={() => onSelect({ type: activeTab, data: item })}
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
                   {activeTab === EntityType.NPC ? (item as NpcData).clan : 
                    activeTab === EntityType.FACTION ? (item as FactionData).type : 
                    (item as LocationData).type}
                </p>
                <p className="text-xs text-gray-600 truncate mt-1">
                   {activeTab === EntityType.NPC ? (item as NpcData).generation : 
                    activeTab === EntityType.FACTION ? (item as FactionData).leader : 
                    (item as LocationData).controlledBy}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };