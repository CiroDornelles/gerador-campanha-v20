import { WorldContextState, GeneratedEntity, EntityType, NpcData, FactionData, LocationData } from '../types';

// Visual Style Configuration (Parchment Theme)
const COLORS = {
  PAPER: [242, 238, 230] as [number, number, number], // #F2EEE6
  INK: [20, 20, 20] as [number, number, number],      // Near Black
  BLOOD: [138, 3, 3] as [number, number, number],     // #8A0303
  GRAY: [100, 100, 100] as [number, number, number],
  BOX_BG: [229, 231, 235] as [number, number, number] // #E5E7EB (Light Gray for boxes)
};

const PAGE_MARGIN = 15;
const IMG_SIDEBAR_WIDTH_RATIO = 0.35; // Image takes 35% of page width

// Helper to interact with jsPDF
const getDoc = () => {
    // @ts-ignore
    if (!window.jspdf) throw new Error("jsPDF not loaded");
    // @ts-ignore
    return new window.jspdf.jsPDF('p', 'mm', 'a4');
};

export const exportSingleEntityPDF = (entity: GeneratedEntity) => {
    try {
        const doc = getDoc();
        renderEntityPage(doc, entity);
        const nameClean = entity.data.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `v20_${entity.type.toLowerCase()}_${nameClean}.pdf`;
        doc.save(filename);
    } catch (e) {
        console.error("PDF Generation Error", e);
        alert("Erro ao gerar PDF. Tente novamente.");
    }
};

export const exportChronicleToPDF = (worldState: WorldContextState) => {
    try {
        const doc = getDoc();
        
        // Cover Page
        renderCover(doc, worldState);

        // Sections
        if (worldState.factions.length > 0) {
            doc.addPage();
            renderSectionTitle(doc, "FACÇÕES & COTERIES");
            worldState.factions.forEach((f) => {
                doc.addPage();
                renderEntityPage(doc, { type: EntityType.FACTION, data: f });
            });
        }

        if (worldState.locations.length > 0) {
            doc.addPage();
            renderSectionTitle(doc, "DOMÍNIOS & REFÚGIOS");
            worldState.locations.forEach((l) => {
                doc.addPage();
                renderEntityPage(doc, { type: EntityType.LOCATION, data: l });
            });
        }

        if (worldState.npcs.length > 0) {
            doc.addPage();
            renderSectionTitle(doc, "DRAMATIS PERSONAE");
            worldState.npcs.forEach((n) => {
                doc.addPage();
                renderEntityPage(doc, { type: EntityType.NPC, data: n });
            });
        }

        doc.save("cronica_v20_grimoire.pdf");
    } catch (e) {
        console.error("PDF Export Error", e);
        alert("Erro ao exportar crônica.");
    }
};

// --- Page Renderers ---

const renderCover = (doc: any, state: WorldContextState) => {
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();

    // Background
    doc.setFillColor(...COLORS.INK);
    doc.rect(0, 0, w, h, 'F');

    // Border
    doc.setDrawColor(...COLORS.BLOOD);
    doc.setLineWidth(2);
    doc.rect(10, 10, w - 20, h - 20);

    // Text
    doc.setFont("times", "bold");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(40);
    doc.text("CRÔNICA", w / 2, 80, { align: "center" });
    
    doc.setTextColor(...COLORS.BLOOD);
    doc.setFontSize(60);
    doc.text("VAMPIRO", w / 2, 105, { align: "center" });
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("A MÁSCARA", w / 2, 120, { align: "center" });

    // Stats
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 200, 200);
    const stats = `${state.factions.length} Facções  |  ${state.locations.length} Lugares  |  ${state.npcs.length} NPCs`;
    doc.text(stats, w / 2, h - 40, { align: "center" });
};

const renderSectionTitle = (doc: any, title: string) => {
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    
    doc.setFillColor(...COLORS.BLOOD);
    doc.rect(0, 0, w, h, 'F');
    
    doc.setFont("times", "bold");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(36);
    doc.text(title, w / 2, h / 2, { align: "center" });
};

const renderEntityPage = (doc: any, entity: GeneratedEntity) => {
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    
    // Background
    doc.setFillColor(...COLORS.PAPER);
    doc.rect(0, 0, w, h, 'F');

    // Layout Calculation
    const hasImage = !!entity.data.imageUrl;
    let sidebarWidth = 0;
    
    if (hasImage) {
        sidebarWidth = w * IMG_SIDEBAR_WIDTH_RATIO;
        const sidebarX = w - sidebarWidth;
        
        try {
            // Draw Image using Clipping to avoid stretching (Cover fit)
            // 1. Save state
            doc.saveGraphicsState();
            // 2. Define Clipping Rect (The sidebar area)
            doc.rect(sidebarX, 0, sidebarWidth, h, 'clip');
            
            // 3. Draw Image Scaled to Height (Assuming portrait-ish crop is desired from square)
            // We scale the image so its height matches the page height. 
            // Since most gen-ai images are 1:1, the width will be equal to page height.
            // We center this wide image in the narrow sidebar.
            const imgSize = h; // 1:1 Aspect ratio assumption for base scaling
            const imgX = sidebarX - (imgSize - sidebarWidth) / 2; // Center horizontally in sidebar
            
            doc.addImage(entity.data.imageUrl, 'JPEG', imgX, 0, imgSize, imgSize, undefined, 'FAST');
            
            // 4. Restore state (removes clip)
            doc.restoreGraphicsState();
            
            // Sidebar Divider Line
            doc.setDrawColor(...COLORS.INK);
            doc.setLineWidth(0.5);
            doc.line(sidebarX, 0, sidebarX, h); 

        } catch (e) {
            console.warn("Could not render image", e);
            sidebarWidth = 0; // Fallback if image fails
        }
    }

    // Content Area
    // Add extra padding from the image sidebar
    const contentRightMargin = 10; 
    let contentWidth = w - (PAGE_MARGIN * 2) - (sidebarWidth > 0 ? sidebarWidth - PAGE_MARGIN + contentRightMargin : 0);
    let startX = PAGE_MARGIN;
    let y = 20;

    // --- Header ---
    doc.setFont("times", "bold");
    doc.setTextColor(...COLORS.BLOOD);
    doc.setFontSize(24);
    
    const name = entity.data.name.toUpperCase();
    const nameLines = doc.splitTextToSize(name, contentWidth);
    doc.text(nameLines, startX, y);
    y += (nameLines.length * 8);

    // Header Line
    doc.setDrawColor(...COLORS.BLOOD);
    doc.setLineWidth(1.5);
    doc.line(startX, y, startX + contentWidth, y);
    y += 6;

    // Subtitle (Aligned Right under the line)
    doc.setFont("times", "bold"); 
    doc.setTextColor(...COLORS.INK);
    doc.setFontSize(10);
    const subtitle = entity.type === EntityType.NPC ? (entity.data as NpcData).clan :
                     entity.type === EntityType.FACTION ? (entity.data as FactionData).type :
                     (entity.data as LocationData).type;
    
    doc.text(subtitle.toUpperCase(), startX + contentWidth, y, { align: "right" });
    y += 10;

    // --- Text Helper ---
    
    const printText = (text: string, fontSize: number = 10, fontStyle: string = "normal", color: number[] = COLORS.INK, align: "left" | "justify" = "left") => {
        if (!text) return;
        doc.setFont("helvetica", fontStyle);
        doc.setFontSize(fontSize);
        doc.setTextColor(...color);
        
        // Split text
        const lines = doc.splitTextToSize(text, contentWidth);
        
        // Check Page Break
        if (y + (lines.length * 5) > h - PAGE_MARGIN) {
            doc.addPage();
            doc.setFillColor(...COLORS.PAPER);
            doc.rect(0, 0, w, h, 'F');
            y = PAGE_MARGIN;
            // On Page 2, we assume full width (no image sidebar repetition)
            contentWidth = w - (PAGE_MARGIN * 2);
            startX = PAGE_MARGIN;
        }

        doc.text(lines, startX, y, { align, maxWidth: contentWidth });
        y += (lines.length * 5); // Line spacing
    };

    const printLabelValue = (label: string, value: string) => {
        if (!value) return;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...COLORS.INK);
        const labelStr = label + ": ";
        const labelW = doc.getTextWidth(labelStr);
        
        doc.text(labelStr, startX, y);
        
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(value, contentWidth - labelW);
        
        // Simple page check for single line items
        if (y + (lines.length * 5) > h - PAGE_MARGIN) {
             doc.addPage(); doc.setFillColor(...COLORS.PAPER); doc.rect(0, 0, w, h, 'F'); y = PAGE_MARGIN; contentWidth = w - (PAGE_MARGIN * 2);
             doc.setFont("helvetica", "bold"); doc.text(labelStr, startX, y); doc.setFont("helvetica", "normal");
        }

        doc.text(lines, startX + labelW, y);
        y += (lines.length * 5);
    };

    // --- Entity Specific Rendering ---

    if (entity.type === EntityType.NPC) {
        const data = entity.data as NpcData;

        // Split Layout: Stats (Left) | Quote (Right)
        const initialY = y;
        const colGap = 5;
        const colW = (contentWidth / 2) - colGap;

        // Left: Stats
        doc.setFontSize(10);
        const stats = [
            { l: "Geração", v: data.generation },
            { l: "Senhor", v: data.sire },
            { l: "Natureza", v: data.nature },
            { l: "Comportamento", v: data.demeanor },
            { l: "Nascimento", v: data.birthDate },
            { l: "Abraço", v: data.embraceDate },
        ];
        
        stats.forEach(s => {
            if (s.v) {
                doc.setFont("helvetica", "bold");
                const label = s.l + ": ";
                doc.text(label, startX, y);
                doc.setFont("helvetica", "normal");
                const valLines = doc.splitTextToSize(s.v, colW - doc.getTextWidth(label));
                doc.text(valLines, startX + doc.getTextWidth(label), y);
                y += (valLines.length * 5);
            }
        });

        const leftHeight = y - initialY;
        y = initialY; // Reset Y for Right Column

        // Right: Quote
        const rightX = startX + colW + (colGap * 2);
        
        if (data.quote) {
            // Red Vertical Bar
            doc.setDrawColor(...COLORS.BLOOD);
            doc.setLineWidth(0.8);
            
            doc.setFont("times", "italic");
            doc.setFontSize(11);
            doc.setTextColor(...COLORS.INK);
            
            const quoteLines = doc.splitTextToSize(`"${data.quote}"`, colW - 5);
            const quoteH = quoteLines.length * 5;
            
            doc.line(rightX, y, rightX, y + quoteH);
            doc.text(quoteLines, rightX + 4, y + 4);
            
            y += quoteH + 5;
        }

        // Influence (Right Col, below quote)
        if (data.influence && data.influence.length > 0) {
            y += 5;
            doc.setFont("times", "bold");
            doc.setFontSize(9);
            doc.setTextColor(...COLORS.BLOOD);
            doc.text("INFLUÊNCIA", rightX, y);
            y += 4;
            
            data.influence.forEach(inf => {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(8);
                doc.setTextColor(255,255,255);
                const w = doc.getTextWidth(inf) + 4;
                doc.setFillColor(...COLORS.INK);
                doc.roundedRect(rightX, y - 3, w, 5, 1, 1, 'F');
                doc.text(inf, rightX + 2, y + 0.5);
                y += 6;
            });
        }
        
        const rightHeight = y - initialY;
        
        // Move Y to below the tallest column
        y = initialY + Math.max(leftHeight, rightHeight) + 10;

        // History
        doc.setFont("times", "bold");
        doc.setFontSize(12);
        doc.setTextColor(...COLORS.BLOOD);
        doc.text("HISTÓRIA & AMBIÇÕES", startX, y);
        doc.setLineWidth(0.5);
        doc.line(startX, y + 1, startX + contentWidth, y + 1);
        y += 8;
        
        printText(data.history, 10, "normal", COLORS.INK, "justify");
        y += 6;

        // Appearance Box
        if (data.appearance) {
            const appLines = doc.splitTextToSize(data.appearance, contentWidth - 6);
            const boxH = (appLines.length * 5) + 10;
            
            // Check Page Break for Box
            if (y + boxH > h - PAGE_MARGIN) {
                doc.addPage(); doc.setFillColor(...COLORS.PAPER); doc.rect(0,0,w,h,'F'); y = PAGE_MARGIN; contentWidth = w - (PAGE_MARGIN * 2);
            }
            
            doc.setFillColor(...COLORS.BOX_BG);
            doc.rect(startX, y, contentWidth, boxH, 'F');
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(...COLORS.INK);
            doc.text("Aparência:", startX + 3, y + 6);
            
            doc.setFont("helvetica", "normal");
            doc.text(appLines, startX + 3, y + 12);
            y += boxH + 8;
        }

        // Rumors
        if (data.rumors) {
             doc.setFont("times", "bold");
             doc.setFontSize(12);
             doc.setTextColor(...COLORS.BLOOD);
             doc.text("RUMORES", startX, y);
             y += 6;

             data.rumors.forEach(r => {
                 const statusColor = r.status === 'VERDADEIRO' ? [20, 150, 20] : r.status === 'FALSO' ? [150, 20, 20] : [200, 150, 20];
                 
                 // Bullet + Content
                 doc.setFont("helvetica", "italic");
                 doc.setFontSize(10);
                 doc.setTextColor(...COLORS.INK);
                 const rumorText = `• "${r.content}"`;
                 const lines = doc.splitTextToSize(rumorText, contentWidth - 25); // Reserve space for badge
                 
                 // Page break check
                 if (y + (lines.length*5) + 5 > h - PAGE_MARGIN) {
                    doc.addPage(); doc.setFillColor(...COLORS.PAPER); doc.rect(0,0,w,h,'F'); y = PAGE_MARGIN; contentWidth = w - (PAGE_MARGIN*2);
                 }

                 doc.text(lines, startX, y);
                 
                 // Badge (Right aligned)
                 doc.setTextColor(...statusColor);
                 doc.setFont("helvetica", "bold");
                 doc.setFontSize(8);
                 doc.text(`[${r.status}]`, startX + contentWidth, y, { align: 'right' });
                 
                 y += (lines.length * 5);
                 
                 // Context
                 doc.setFont("helvetica", "normal");
                 doc.setFontSize(9);
                 doc.setTextColor(...COLORS.GRAY);
                 const contextLines = doc.splitTextToSize(`(${r.context})`, contentWidth - 5);
                 doc.text(contextLines, startX + 5, y);
                 y += (contextLines.length * 4) + 4;
             });
        }
    } 
    else if (entity.type === EntityType.FACTION) {
        const data = entity.data as FactionData;
        
        printLabelValue("Líder", data.leader);
        y += 5;
        
        doc.setFont("times", "bold");
        doc.setTextColor(...COLORS.BLOOD);
        doc.text("OBJETIVOS", startX, y);
        y += 6;
        printText(data.goals);
        y += 5;

        doc.setFont("times", "bold");
        doc.setTextColor(...COLORS.BLOOD);
        doc.text("TERRITÓRIO", startX, y);
        y += 6;
        printText(data.territory);
        y += 5;
        
        if(data.resources.length > 0) {
            printLabelValue("Recursos", data.resources.join(", "));
        }
        if(data.enemies.length > 0) {
            printLabelValue("Inimigos", data.enemies.join(", "));
        }
    }
    else if (entity.type === EntityType.LOCATION) {
        const data = entity.data as LocationData;
        
        printLabelValue("Controlado por", data.controlledBy);
        y += 5;

        doc.setFont("times", "bold");
        doc.setTextColor(...COLORS.BLOOD);
        doc.text("DESCRIÇÃO", startX, y);
        y += 6;
        printText(data.description, 10, "normal", COLORS.INK, "justify");
        y += 5;
        
        printLabelValue("Atmosfera", data.atmosphere);
        printLabelValue("Segurança", data.security);
    }
};