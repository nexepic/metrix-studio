import { StylesheetStyle } from 'cytoscape';

// --- 1. "Strategic" Professional Palette ---
// Matte, desaturated colors inspired by financial terminals and data viz tools.
// Avoids neon; focuses on distinct but calm tones against black.
const STRATEGIC_PALETTE = [
    '#6366f1', // Indigo (Primary) - Logic/Core
    '#38bdf8', // Sky - Information
    '#2dd4bf', // Teal - Success/Safe
    '#a78bfa', // Violet - Meta/Abstract
    '#fb923c', // Orange - Warning/State
    '#f472b6', // Pink - Entity/Person
    '#94a3b8', // Slate - Infrastructure
    '#e879f9', // Fuchsia - Special
];

const COLORS = {
    bg: '#050505',

    // VISIBILITY FIX: Lighter grey for edges, higher opacity
    edge: '#52525b',         // Zinc-600 (Much more visible than Zinc-800)
    edgeHover: '#a1a1aa',    // Zinc-400
    edgeSelected: '#818cf8', // Indigo-400

    label: '#a1a1aa',        // Zinc-400
    labelSelected: '#ffffff',

    nodeBorder: '#18181b',   // Zinc-900 (Stroke)

    highlight: '#38bdf8'     // Sky-400
};

// --- Helper: Consistent Color Hashing ---
export const generateNodeColor = (label: string = ""): string => {
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
        hash = label.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % STRATEGIC_PALETTE.length;
    return STRATEGIC_PALETTE[index];
};

// --- 2. Stylesheet ---
export const graphStyles: StylesheetStyle[] = [
    // --- NODES ---
    {
        selector: 'node',
        style: {
            'background-color': 'data(color)',
            'border-width': 1.5,
            'border-color': COLORS.nodeBorder,
            'width': 18,
            'height': 18,

            'label': 'data(label)',
            'color': COLORS.label,
            'font-size': 9,
            'text-valign': 'bottom',
            'text-margin-y': 5,
            'font-family': 'Inter, sans-serif',
            'font-weight': 500,
            'min-zoomed-font-size': 6,
            'text-events': 'yes'
        }
    },

    // --- EDGES ---
    {
        selector: 'edge',
        style: {
            'width': 1.5, // Slightly thicker
            'line-color': COLORS.edge,
            'target-arrow-color': COLORS.edge,
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 0.8,
            'opacity': 0.8 // Increased from 0.5 to 0.8 for visibility
        }
    },

    // --- SELECTION STATES ---
    {
        selector: 'node:selected',
        style: {
            'border-width': 2,
            'border-color': '#fff',
            'width': 24,
            'height': 24,
            'color': COLORS.labelSelected,
            'font-weight': 700,
            'z-index': 9999,
        }
    },
    {
        selector: 'edge:selected',
        style: {
            'width': 2.5,
            'line-color': COLORS.edgeSelected,
            'target-arrow-color': COLORS.edgeSelected,
            'source-arrow-color': COLORS.edgeSelected,
            'opacity': 1,
            'arrow-scale': 1,
            'z-index': 999
        }
    },

    // --- ALGORITHMIC HIGHLIGHTS (For Clustering/Analysis) ---
    {
        selector: '.cluster-highlight',
        style: {
            'border-width': 0,
            'width': 30,
            'height': 30,
            'opacity': 1
        }
    },
    {
        selector: '.dimmed',
        style: {
            'opacity': 0.2,
            'label': ''
        }
    }
];

// --- 3. Layout ---
export const defaultLayout = {
    name: 'cola',
    animate: true,
    refresh: 1,
    maxSimulationTime: 2000,
    ungrabifyWhileSimulating: false,
    fit: true,
    padding: 60,
    nodeSpacing: 45,
    edgeLengthVal: 90,
    gravity: 0.4,
    friction: 0.15,
};