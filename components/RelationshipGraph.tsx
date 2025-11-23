import React, { useState, useRef } from 'react';
import { RelationshipMapData } from '../types';
import { IconPlus, IconMinus, IconRefresh, IconImage } from './Icons';

export const RelationshipGraph = ({ mapData }: { mapData: RelationshipMapData }) => {
  if (!mapData || !mapData.nodes) return null;

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Configuration for larger canvas and responsiveness
  const viewBoxWidth = 800;
  const viewBoxHeight = 500;
  const centerX = viewBoxWidth / 2;
  const centerY = viewBoxHeight / 2;
  const radius = 200; 

  // Separate leader (center) from others
  const leaderNode = mapData.nodes.find(n => n.type === 'LEADER') || mapData.nodes[0];
  const otherNodes = mapData.nodes.filter(n => n.id !== leaderNode.id);
  
  const totalNodes = otherNodes.length;
  const angleStep = (2 * Math.PI) / totalNodes;

  const getNodePos = (index: number) => {
    const angle = index * angleStep - Math.PI / 2; // Start top
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  const nodePositions: Record<string, { x: number, y: number }> = {};
  nodePositions[leaderNode.id] = { x: centerX, y: centerY };
  otherNodes.forEach((node, idx) => {
    nodePositions[node.id] = getNodePos(idx);
  });

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'LEADER': return '#8a0303'; // Blood Red
      case 'ENEMY': return '#b91c1c'; // Red-700
      case 'ALLY': return '#2563eb'; // Blue-600
      case 'RESOURCE': return '#ca8a04'; // Yellow-600
      case 'MEMBER': return '#4b5563'; // Gray-600
      default: return '#374151';
    }
  };

  const getNodeStroke = (type: string) => {
     switch(type) {
       case 'LEADER': return '#ff9999';
       case 'ENEMY': return '#fca5a5';
       default: return '#d1d5db';
     }
  }

  // Zoom handlers
  const handleZoomIn = () => setZoom(z => Math.min(z * 1.2, 5));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.2, 0.5));
  const handleReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleExportMap = async () => {
    if (!containerRef.current) return;
    try {
        // @ts-ignore
        const canvas = await window.html2canvas(containerRef.current, {
            backgroundColor: "#111827", // match bg-gray-900
            scale: 2 // high res
        });
        const link = document.createElement('a');
        link.download = 'mapa_relacional.png';
        link.href = canvas.toDataURL();
        link.click();
    } catch (e) {
        console.error("Map export failed", e);
        alert("Erro ao exportar mapa.");
    }
  }

  return (
    <div className="relative w-full h-[500px] bg-gray-900/50 rounded border border-gray-800 mt-4 overflow-hidden group select-none">
      
      {/* Controls Overlay */}
      <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-100 transition-opacity bg-black/60 p-1 rounded backdrop-blur-sm">
         <button onClick={handleZoomIn} className="p-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 border border-gray-700" title="Aumentar Zoom"><IconPlus /></button>
         <button onClick={handleZoomOut} className="p-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 border border-gray-700" title="Diminuir Zoom"><IconMinus /></button>
         <button onClick={handleReset} className="p-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 border border-gray-700" title="Resetar Visualização"><IconRefresh /></button>
         <div className="w-px bg-gray-600 mx-1"></div>
         <button onClick={handleExportMap} className="p-1.5 bg-blood text-white rounded hover:bg-red-900 border border-red-900" title="Exportar Mapa (PNG)"><IconImage /></button>
      </div>

      <div 
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={(e) => {
            if(e.deltaY < 0) handleZoomIn();
            else handleZoomOut();
        }}
      >
        <svg 
          width="100%" 
          height="100%" 
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="mx-auto"
        >
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
            </marker>
          </defs>
          
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} style={{ transformOrigin: 'center', transition: isDragging ? 'none' : 'transform 0.1s' }}>
          
          {/* Edges */}
          {mapData.edges.map((edge, i) => {
            const start = nodePositions[edge.source];
            const end = nodePositions[edge.target];
            if (!start || !end) return null;

            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;

            return (
              <g key={`edge-${i}`}>
                <line 
                  x1={start.x} y1={start.y} 
                  x2={end.x} y2={end.y} 
                  stroke="#555" 
                  strokeWidth="1.5"
                  strokeOpacity="0.6"
                  markerEnd="url(#arrowhead)"
                />
                {/* Text Background for Readability */}
                <rect 
                  x={midX - (edge.label.length * 3 + 10)} 
                  y={midY - 10} 
                  width={(edge.label.length * 6 + 20)} 
                  height="20" 
                  rx="4" 
                  fill="#000" 
                  fillOpacity="0.8" 
                  stroke="#333"
                  strokeWidth="0.5"
                />
                <text 
                  x={midX} 
                  y={midY + 4} 
                  textAnchor="middle" 
                  fill="#ccc" 
                  fontSize="12" 
                  fontFamily="sans-serif"
                >
                  {edge.label}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {mapData.nodes.map((node) => {
            const pos = nodePositions[node.id];
            if (!pos) return null;
            return (
              <g key={node.id}>
                <circle 
                  cx={pos.x} 
                  cy={pos.y} 
                  r="24" 
                  fill={getNodeColor(node.type)} 
                  stroke={getNodeStroke(node.type)} 
                  strokeWidth="2"
                  className="drop-shadow-lg"
                />
                 {/* Text Background for Node Label */}
                <rect 
                   x={pos.x - (node.label.length * 3.5 + 5)}
                   y={pos.y + 30}
                   width={(node.label.length * 7 + 10)}
                   height="20" 
                   rx="4"
                   fill="#111"
                   opacity="0.9"
                />
                <text 
                  x={pos.x} 
                  y={pos.y + 44} 
                  textAnchor="middle" 
                  fill="#fff" 
                  fontSize="14" 
                  fontWeight="bold" 
                  fontFamily="serif"
                >
                  {node.label}
                </text>
                <text 
                  x={pos.x} 
                  y={pos.y + 6} 
                  textAnchor="middle" 
                  fill="rgba(255,255,255,0.8)" 
                  fontSize="10" 
                  fontWeight="bold"
                >
                  {node.type.substring(0,1)}
                </text>
              </g>
            );
          })}
          </g>
        </svg>
      </div>
      <div className="flex justify-center gap-4 text-xs mt-0 text-gray-400 p-2 border-t border-gray-800 bg-gray-900/80 absolute bottom-0 w-full pointer-events-none">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#8a0303]"></span> Líder</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-600"></span> Membro</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600"></span> Aliado</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-600"></span> Inimigo</span>
      </div>
    </div>
  );
};
