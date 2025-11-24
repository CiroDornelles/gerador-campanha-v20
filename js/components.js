
import { Icons } from './icons.js';

export const Components = {
    cardBase(children) {
        return `<div class="bg-panel border border-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col md:flex-row relative transition-all hover:shadow-2xl animate-fade-in-up">${children}</div>`;
    },

    npcCard(data) {
        return this.cardBase(`
            <div class="flex-1 p-8 relative">
                <div class="absolute top-0 right-0 p-4 opacity-10 transform rotate-12 pointer-events-none">${Icons.skull}</div>
                <div class="flex justify-between items-baseline border-b-2 border-blood pb-2 mb-4 pr-12">
                    <h2 class="text-3xl font-serif font-black uppercase text-blood tracking-tight">${data.name}</h2>
                    <span class="font-bold font-serif bg-gray-900 text-paper px-2 py-0.5 rounded text-sm shadow">${data.clan}</span>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-sm">
                    <div class="space-y-1">
                        <p><strong class="text-gray-500">Geração:</strong> ${data.generation}</p>
                        <p><strong class="text-gray-500">Senhor:</strong> ${data.sire}</p>
                        <p><strong class="text-gray-500">Natureza:</strong> ${data.nature}</p>
                        <p><strong class="text-gray-500">Comportamento:</strong> ${data.demeanor}</p>
                    </div>
                    <div>
                        <p class="italic border-l-2 border-blood pl-3 py-1 my-2 bg-black/20">"${data.quote}"</p>
                        <div class="flex flex-wrap gap-2 mt-2">
                            ${(data.influence || []).map(i => `<span class="bg-gray-800 text-xs px-2 py-1 rounded">${i}</span>`).join('')}
                        </div>
                    </div>
                </div>

                <div class="mb-4">
                    <h4 class="font-bold font-serif uppercase border-b border-gray-700 mb-2 text-gray-400">História</h4>
                    <p class="text-sm leading-relaxed whitespace-pre-line text-justify text-gray-300">${data.history}</p>
                </div>
            </div>
            ${data.imageUrl ? `<div class="md:w-1/3 min-h-[300px] bg-black"><img src="${data.imageUrl}" class="w-full h-full object-cover opacity-80"></div>` : ''}
        `);
    },

    libraryCard(entity, type, onClickId) {
        return `
        <div onclick="window.app.openEntity('${type}', '${entity.id}')" class="card-hover group bg-panel border border-gray-800 hover:border-blood p-4 rounded cursor-pointer flex gap-4 items-start">
            <div class="w-16 h-16 bg-black flex-shrink-0 rounded overflow-hidden border border-gray-700">
                ${entity.imageUrl ? `<img src="${entity.imageUrl}" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center text-gray-700">${Icons.users}</div>`}
            </div>
            <div>
                <h4 class="font-serif font-bold text-gray-200 truncate group-hover:text-blood">${entity.name}</h4>
                <p class="text-xs text-gray-500 uppercase">${type === 'NPC' ? entity.clan : entity.type}</p>
            </div>
        </div>`;
    }
};
