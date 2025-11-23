import React, { useState } from 'react';
import { IconSave, IconX, IconEdit, IconMagic, IconSpinner } from './Icons';
import { refineText } from '../services/gemini';

export const EditControls = ({ isEditing, onSave, onCancel, onEdit }: { isEditing: boolean, onSave: () => void, onCancel: () => void, onEdit: () => void }) => (
  <div className="absolute top-2 right-2 z-20 flex gap-2">
    {isEditing ? (
      <>
        <button onClick={onSave} className="bg-green-800 text-white p-2 rounded hover:bg-green-700" title="Salvar"><IconSave /></button>
        <button onClick={onCancel} className="bg-red-800 text-white p-2 rounded hover:bg-red-700" title="Cancelar"><IconX /></button>
      </>
    ) : (
      <button onClick={onEdit} className="bg-gray-800/80 text-white p-2 rounded hover:bg-blood backdrop-blur" title="Editar"><IconEdit /></button>
    )}
  </div>
);

export const InputField = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
  <div className="mb-2">
    <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</label>
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm focus:border-blood focus:outline-none" />
  </div>
);

export const TextAreaField = ({ label, value, onChange, apiKey }: { label: string, value: string, onChange: (v: string) => void, apiKey: string }) => {
  const [showAiInput, setShowAiInput] = useState(false);
  const [aiInstruction, setAiInstruction] = useState("");
  const [isRefining, setIsRefining] = useState(false);

  const handleAiRefine = async () => {
    if (!aiInstruction) return;
    if (!apiKey) {
        alert("Configure sua API Key nas configurações primeiro.");
        return;
    }
    setIsRefining(true);
    try {
      const newText = await refineText(value, aiInstruction, label, apiKey);
      onChange(newText);
      setShowAiInput(false);
      setAiInstruction("");
    } catch (e) {
      alert("Erro ao refinar texto.");
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="mb-2 relative">
      <div className="flex justify-between items-end mb-1">
        <label className="block text-xs text-gray-500 uppercase tracking-wide">{label}</label>
        <button 
          onClick={() => setShowAiInput(!showAiInput)} 
          className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${showAiInput ? 'bg-blood text-white' : 'bg-gray-800 text-purple-400 hover:bg-gray-700'}`}
          title="Refinar com IA"
        >
          <IconMagic /> IA
        </button>
      </div>
      
      {showAiInput && (
        <div className="mb-2 bg-gray-800 p-2 rounded border border-purple-500/50 animate-fade-in">
           <input 
             type="text" 
             value={aiInstruction} 
             onChange={(e) => setAiInstruction(e.target.value)} 
             placeholder="Ex: Deixe mais sombrio, adicione detalhes sobre..." 
             className="w-full bg-black border border-gray-600 rounded p-1 text-xs text-white mb-2"
             onKeyDown={(e) => e.key === 'Enter' && handleAiRefine()}
           />
           <div className="flex justify-end gap-2">
              <button onClick={() => setShowAiInput(false)} className="text-xs text-gray-400 hover:text-white">Cancelar</button>
              <button onClick={handleAiRefine} disabled={isRefining} className="text-xs bg-purple-900 hover:bg-purple-800 text-white px-2 py-1 rounded flex items-center gap-1">
                {isRefining ? <IconSpinner /> : 'Refinar'}
              </button>
           </div>
        </div>
      )}

      <textarea value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm h-24 focus:border-blood focus:outline-none resize-y" />
    </div>
  );
}

export const ArrayField = ({ label, values, onChange }: { label: string, values: string[], onChange: (v: string[]) => void }) => (
   <div className="mb-2">
      <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">{label} (Separe por vírgula)</label>
      <input 
        type="text" 
        value={values.join(', ')} 
        onChange={(e) => onChange(e.target.value.split(',').map(s => s.trim()))} 
        className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm focus:border-blood focus:outline-none" 
      />
   </div>
);