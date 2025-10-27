// Global state
let blocks = [];
let connections = [];
let blockCounter = 0;
let selectedBlock = null;
let dataStore = {};

// Constants
const MAX_DISPLAY_ROWS = 100;
const SIMILARITY_THRESHOLD = 0.5;
const PARTIAL_MATCH_SCORE = 0.8;
const EXACT_MATCH_SCORE = 1.0;

// Canvas sizing constants
const CANVAS_BLOCK_PADDING = 300; // Extra space around blocks for comfortable dragging
const DEFAULT_BLOCK_WIDTH = 220; // Approximate block width including padding
const DEFAULT_BLOCK_HEIGHT = 120; // Approximate block height including padding

// Performance optimization constants
const RENDER_CONNECTIONS_THROTTLE = 16; // ~60fps throttle for connection rendering
const LARGE_DATASET_THRESHOLD = 1000; // Threshold for enabling performance optimizations

// Performance monitoring
let performanceMetrics = {
    lastOperationTime: 0,
    operationCount: 0
};

/**
 * Measures execution time of a function and logs if it exceeds threshold
 * @param {string} operationName - Name of the operation being measured
 * @param {Function} fn - Function to execute and measure
 * @param {number} warnThreshold - Threshold in ms to warn about slow operations (default 1000ms)
 * @returns {*} Result of the function execution
 */
function measurePerformance(operationName, fn, warnThreshold = 1000) {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    performanceMetrics.lastOperationTime = duration;
    performanceMetrics.operationCount++;
    
    if (duration > warnThreshold) {
        console.warn(`⚠️ Performance warning: ${operationName} took ${duration.toFixed(2)}ms`);
    } else {
        console.debug(`✓ ${operationName}: ${duration.toFixed(2)}ms`);
    }
    
    return result;
}

// Utility Functions
/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text safe for HTML
 */
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

/**
 * Shows a modal by ID
 * @param {string} modalId - The ID of the modal to show
 */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'block';
}

/**
 * Hides a modal by ID
 * @param {string} modalId - The ID of the modal to hide
 */
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initDragAndDrop();
    initModals();
    initCanvasPanning();
});

// Drag and Drop functionality
function initDragAndDrop() {
    const toolItems = document.querySelectorAll('.tool-item');
    const canvas = document.getElementById('canvas');
    
    toolItems.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
    });
    
    canvas.addEventListener('dragover', handleDragOver);
    canvas.addEventListener('drop', handleDrop);
}

function handleDragStart(e) {
    e.dataTransfer.setData('blockType', e.target.dataset.type);
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const blockType = e.dataTransfer.getData('blockType');
    const canvas = e.currentTarget;
    const canvasRect = canvas.getBoundingClientRect();
    
    // Calculate position relative to canvas content (including scroll)
    const x = e.clientX - canvasRect.left + canvas.scrollLeft;
    const y = e.clientY - canvasRect.top + canvas.scrollTop;
    
    createBlock(blockType, x, y);
    
    // Remove hint if it exists
    const hint = document.querySelector('.hint');
    if (hint) hint.style.display = 'none';
}

// Canvas panning functionality
function initCanvasPanning() {
    const canvas = document.getElementById('canvas');
    let isPanning = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;
    let scrollTimeout = null;
    
    canvas.addEventListener('mousedown', (e) => {
        // Enable panning with shift+drag or middle button
        if (e.shiftKey || e.button === 1) {
            isPanning = true;
            startX = e.pageX;
            startY = e.pageY;
            scrollLeft = canvas.scrollLeft;
            scrollTop = canvas.scrollTop;
            canvas.classList.add('panning');
            e.preventDefault();
        }
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        
        const dx = e.pageX - startX;
        const dy = e.pageY - startY;
        
        canvas.scrollLeft = scrollLeft - dx;
        canvas.scrollTop = scrollTop - dy;
    });
    
    canvas.addEventListener('mouseup', () => {
        if (isPanning) {
            isPanning = false;
            canvas.classList.remove('panning');
        }
    });
    
    canvas.addEventListener('mouseleave', () => {
        if (isPanning) {
            isPanning = false;
            canvas.classList.remove('panning');
        }
    });
    
    // Prevent context menu on middle button
    canvas.addEventListener('contextmenu', (e) => {
        if (e.button === 1) {
            e.preventDefault();
        }
    });
    
    // Update connection lines when canvas is scrolled (throttled for performance)
    canvas.addEventListener('scroll', () => {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        scrollTimeout = setTimeout(() => {
            renderConnections();
        }, 16); // ~60fps throttle
    });
}

function createBlock(type, x, y) {
    const blockId = `block-${blockCounter++}`;
    const block = {
        id: blockId,
        type: type,
        x: x,
        y: y,
        data: null
    };
    
    blocks.push(block);
    renderBlock(block);
}

function renderBlock(block) {
    const canvas = document.getElementById('canvas');
    const blockEl = document.createElement('div');
    blockEl.className = 'block';
    blockEl.id = block.id;
    blockEl.style.left = `${block.x}px`;
    blockEl.style.top = `${block.y}px`;
    
    let icon, title, content;
    if (block.type === 'input') {
        icon = '📥';
        title = 'Input Source Data';
        content = 'Klik om data te laden';
    } else if (block.type === 'view') {
        icon = '👁️';
        title = 'Data View';
        content = 'Klik om data te bekijken';
    } else if (block.type === 'output') {
        icon = '📤';
        title = 'Target Structure';
        content = 'Klik om template te laden';
    } else if (block.type === 'automapper') {
        icon = '🤖';
        title = 'Automapper';
        content = 'Klik om automatische mappings te genereren';
    } else if (block.type === 'mapping') {
        icon = '🔗';
        title = 'Mapping';
        content = 'Klik om kolommen te mappen';
    } else if (block.type === 'transform') {
        icon = '⚙️';
        title = 'Transform';
        content = 'Klik om te transformeren';
    } else if (block.type === 'outputdata') {
        icon = '💾';
        title = 'Output Data';
        content = 'Klik om data te exporteren';
    } else if (block.type === 'validation') {
        icon = '✓';
        title = 'Validation';
        content = block.content || 'Klik om validatie te configureren';
    } else if (block.type === 'valuemapper') {
        icon = '🔄';
        title = 'Value Mapper';
        content = block.content || 'Klik om value mappings te configureren';
    } else if (block.type === 'concatenate') {
        icon = '➕';
        title = 'Concatenate';
        content = block.content || 'Klik om kolommen samen te voegen';
    } else if (block.type === 'split') {
        icon = '✂️';
        title = 'Split';
        content = block.content || 'Klik om kolom te splitsen';
    } else if (block.type === 'casechange') {
        icon = '🔤';
        title = 'Case Change';
        content = block.content || 'Klik om hoofdletters te wijzigen';
    } else if (block.type === 'math') {
        icon = '🔢';
        title = 'Math';
        content = block.content || 'Klik om berekeningen uit te voeren';
    } else if (block.type === 'regexreplace') {
        icon = '🔍';
        title = 'Regex Replace';
        content = block.content || 'Klik om tekst te vervangen';
    } else if (block.type === 'dateformat') {
        icon = '📅';
        title = 'Date Format';
        content = block.content || 'Klik om datum te formatteren';
    } else if (block.type === 'expression') {
        icon = '📝';
        title = 'Expression';
        content = block.content || 'Klik om expressie te evalueren';
    } else if (block.type === 'copyrename') {
        icon = '📋';
        title = 'Copy/Rename';
        content = block.content || 'Klik om kolom te kopiëren/hernoemen';
    } else if (block.type === 'join') {
        icon = '🔀';
        title = 'Join';
        content = block.content || 'Klik om datasets samen te voegen';
    }
    
    blockEl.innerHTML = `
        <div class="block-header">
            <span class="block-icon">${icon}</span>
            <span class="block-title">${title}</span>
            <span class="block-delete" onclick="deleteBlock('${block.id}')">✕</span>
        </div>
        <div class="block-content" id="${block.id}-content">
            ${content}
        </div>
        <div class="block-connector connector-out" data-block="${block.id}" data-type="out"></div>
        <div class="block-connector connector-in" data-block="${block.id}" data-type="in"></div>
    `;
    
    // Make block draggable
    blockEl.addEventListener('mousedown', startDragBlock);
    
    // Double click to open
    blockEl.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        openBlockModal(block);
    });
    
    canvas.appendChild(blockEl);
    initConnectors(block.id);
    
    // Update canvas size to accommodate new block
    updateCanvasSize();
}

function deleteBlock(blockId) {
    // Remove from DOM
    const blockEl = document.getElementById(blockId);
    if (blockEl) blockEl.remove();
    
    // Remove from state
    blocks = blocks.filter(b => b.id !== blockId);
    
    // Remove associated connections
    connections = connections.filter(c => c.from !== blockId && c.to !== blockId);
    renderConnections();
    
    // Remove from data store
    delete dataStore[blockId];
}

// Block dragging
let isDragging = false;
let dragBlock = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let canvasSizeUpdateScheduled = false;

function startDragBlock(e) {
    if (e.target.classList.contains('block-delete') || 
        e.target.classList.contains('block-connector')) {
        return;
    }
    
    isDragging = true;
    dragBlock = e.currentTarget;
    const rect = dragBlock.getBoundingClientRect();
    const canvasRect = document.getElementById('canvas').getBoundingClientRect();
    
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    
    dragBlock.style.cursor = 'grabbing';
    
    document.addEventListener('mousemove', dragBlockMove);
    document.addEventListener('mouseup', stopDragBlock);
}

function dragBlockMove(e) {
    if (!isDragging || !dragBlock) return;
    
    const canvas = document.getElementById('canvas');
    const canvasRect = canvas.getBoundingClientRect();
    
    // Calculate position relative to canvas content (including scroll)
    const x = e.clientX - canvasRect.left + canvas.scrollLeft - dragOffsetX;
    const y = e.clientY - canvasRect.top + canvas.scrollTop - dragOffsetY;
    
    // Ensure blocks can't be positioned at negative coordinates
    const finalX = Math.max(0, x);
    const finalY = Math.max(0, y);
    
    dragBlock.style.left = `${finalX}px`;
    dragBlock.style.top = `${finalY}px`;
    
    // Update block position in state
    const block = blocks.find(b => b.id === dragBlock.id);
    if (block) {
        block.x = finalX;
        block.y = finalY;
    }
    
    // Throttle canvas size updates using requestAnimationFrame
    if (!canvasSizeUpdateScheduled) {
        canvasSizeUpdateScheduled = true;
        requestAnimationFrame(() => {
            updateCanvasSize();
            canvasSizeUpdateScheduled = false;
        });
    }
    
    renderConnections();
}

function stopDragBlock() {
    if (dragBlock) {
        dragBlock.style.cursor = 'move';
    }
    isDragging = false;
    dragBlock = null;
    document.removeEventListener('mousemove', dragBlockMove);
    document.removeEventListener('mouseup', stopDragBlock);
}

// Ensure canvas size accommodates all blocks
function updateCanvasSize() {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;
    
    // Calculate required canvas size based on block positions
    let maxX = 0;
    let maxY = 0;
    
    blocks.forEach(block => {
        const blockEl = document.getElementById(block.id);
        const blockWidth = blockEl ? blockEl.offsetWidth : DEFAULT_BLOCK_WIDTH;
        const blockHeight = blockEl ? blockEl.offsetHeight : DEFAULT_BLOCK_HEIGHT;
        
        maxX = Math.max(maxX, block.x + blockWidth);
        maxY = Math.max(maxY, block.y + blockHeight);
    });
    
    // Set minimum canvas content size
    const minWidth = canvas.clientWidth;
    const minHeight = canvas.clientHeight;
    const requiredWidth = Math.max(minWidth, maxX + CANVAS_BLOCK_PADDING);
    const requiredHeight = Math.max(minHeight, maxY + CANVAS_BLOCK_PADDING);
    
    // Use CSS custom properties to control the ::after pseudo-element size
    canvas.style.setProperty('--canvas-width', `${requiredWidth}px`);
    canvas.style.setProperty('--canvas-height', `${requiredHeight}px`);
}

// Connectors for linking blocks
let isConnecting = false;
let connectFrom = null;
let connectFromElement = null;
let tempConnectionLine = null;

function initConnectors(blockId) {
    const connectors = document.querySelectorAll(`#${blockId} .block-connector`);
    connectors.forEach(connector => {
        connector.addEventListener('mousedown', startConnection);
    });
}

function startConnection(e) {
    e.stopPropagation();
    e.preventDefault(); // Prevent text selection
    if (e.target.dataset.type !== 'out') return;
    
    isConnecting = true;
    connectFrom = e.target.dataset.block;
    connectFromElement = e.target;
    
    // Add active class to highlight the connector
    connectFromElement.classList.add('active');
    
    // Create temporary connection line
    createTempConnectionLine();
    
    // Add mousemove listener for visual feedback
    document.addEventListener('mousemove', updateTempConnection);
}

function createTempConnectionLine() {
    const canvas = document.getElementById('canvas');
    
    // Remove existing temp line if any
    if (tempConnectionLine) {
        tempConnectionLine.remove();
    }
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'temp-connection-svg';
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '1000';
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.id = 'temp-connection-path';
    path.classList.add('temp-connection-line');
    
    svg.appendChild(path);
    canvas.appendChild(svg);
    
    tempConnectionLine = svg;
}

function updateTempConnection(e) {
    if (!isConnecting || !connectFromElement) return;
    
    const canvas = document.getElementById('canvas');
    const canvasRect = canvas.getBoundingClientRect();
    const fromRect = connectFromElement.getBoundingClientRect();
    
    const x1 = fromRect.left - canvasRect.left + fromRect.width / 2;
    const y1 = fromRect.top - canvasRect.top + fromRect.height / 2;
    const x2 = e.clientX - canvasRect.left;
    const y2 = e.clientY - canvasRect.top;
    
    // Create a simple curved path
    const dx = x2 - x1;
    const dy = y2 - y1;
    const midX = x1 + dx / 2;
    
    const d = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
    
    const path = document.getElementById('temp-connection-path');
    if (path) {
        path.setAttribute('d', d);
    }
    
    // Highlight potential target connectors
    const target = e.target;
    document.querySelectorAll('.block-connector.target').forEach(c => c.classList.remove('target'));
    
    if (target && target.classList && target.classList.contains('block-connector') && 
        target.dataset.type === 'in' && 
        target.dataset.block !== connectFrom) {
        target.classList.add('target');
    }
}

function cleanupConnection() {
    // Remove temporary connection line
    if (tempConnectionLine) {
        tempConnectionLine.remove();
        tempConnectionLine = null;
    }
    
    // Remove active class
    if (connectFromElement) {
        connectFromElement.classList.remove('active');
        connectFromElement = null;
    }
    
    // Remove target highlights
    document.querySelectorAll('.block-connector.target').forEach(c => c.classList.remove('target'));
    
    // Remove mousemove listener
    document.removeEventListener('mousemove', updateTempConnection);
    
    isConnecting = false;
    connectFrom = null;
}

document.addEventListener('mouseup', (e) => {
    if (!isConnecting) return;
    
    const target = e.target;
    if (target.classList.contains('block-connector') && target.dataset.type === 'in') {
        const connectTo = target.dataset.block;
        if (connectFrom !== connectTo) {
            addConnection(connectFrom, connectTo);
        }
    }
    
    cleanupConnection();
});

function addConnection(fromId, toId) {
    // Validate both blocks exist
    const fromBlock = blocks.find(b => b.id === fromId);
    const toBlock = blocks.find(b => b.id === toId);
    
    if (!fromBlock || !toBlock) {
        console.error('addConnection: Invalid block IDs', { fromId, toId });
        return;
    }
    
    // Check if connection already exists
    const exists = connections.find(c => c.from === fromId && c.to === toId);
    if (exists) return;
    
    // Add connection with active flag
    connections.push({ from: fromId, to: toId, active: true });
    renderConnections();
    
    // Transfer data if available, with error handling
    try {
        transferData(fromId, toId);
    } catch (error) {
        console.error('Error transferring data on connection:', error);
        // Continue gracefully - connection is still valid even if transfer fails
    }
}

/**
 * Renders all connections between blocks as SVG paths
 * Optimized to cache canvas rect and use early returns
 */
function renderConnections() {
    // Remove existing SVG
    const existingSvg = document.getElementById('connections-svg');
    if (existingSvg) existingSvg.remove();
    
    if (connections.length === 0) return;
    
    const canvas = document.getElementById('canvas');
    const canvasRect = canvas.getBoundingClientRect(); // Cache canvas rect
    
    // Get the full canvas content size from CSS custom properties
    const canvasWidth = canvas.style.getPropertyValue('--canvas-width') || '100%';
    const canvasHeight = canvas.style.getPropertyValue('--canvas-height') || '100%';
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'connections-svg';
    svg.style.cssText = `position:absolute;top:0;left:0;width:${canvasWidth};height:${canvasHeight};pointer-events:none;z-index:1`;
    
    const minSpacing = 30;
    
    connections.forEach(conn => {
        const fromBlock = document.getElementById(conn.from);
        const toBlock = document.getElementById(conn.to);
        
        if (!fromBlock || !toBlock) return;
        
        const fromConnector = fromBlock.querySelector('.connector-out');
        const toConnector = toBlock.querySelector('.connector-in');
        
        if (!fromConnector || !toConnector) return;
        
        const fromRect = fromConnector.getBoundingClientRect();
        const toRect = toConnector.getBoundingClientRect();
        
        // Account for canvas scroll position when calculating connector positions
        const x1 = fromRect.left - canvasRect.left + canvas.scrollLeft + fromRect.width / 2;
        const y1 = fromRect.top - canvasRect.top + canvas.scrollTop + fromRect.height / 2;
        const x2 = toRect.left - canvasRect.left + canvas.scrollLeft + toRect.width / 2;
        const y2 = toRect.top - canvasRect.top + canvas.scrollTop + toRect.height / 2;
        
        // Create orthogonal path (right-angle lines) for clean left-to-right flow
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // Calculate midpoint for the horizontal segment with minimum spacing
        let midX = (x1 + x2) / 2;
        
        // Ensure minimum horizontal spacing from the blocks
        if (x2 > x1) {
            midX = Math.max(midX, x1 + minSpacing);
            midX = Math.min(midX, x2 - minSpacing);
        }
        
        // Create path with horizontal and vertical segments
        // Simple 3-segment path: horizontal -> vertical -> horizontal
        const d = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
        
        path.setAttribute('d', d);
        path.classList.add('connection-line');
        
        // Apply active class if connection is active (default true)
        if (conn.active !== false) {
            path.classList.add('active');
        }
        
        svg.appendChild(path);
    });
    
    canvas.insertBefore(svg, canvas.firstChild);
}

// Modal management
function initModals() {
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close');
    
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modals.forEach(modal => modal.style.display = 'none');
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // File input handler
    document.getElementById('fileInput').addEventListener('change', handleFileSelect);
    
    // Template input handler
    document.getElementById('templateInput').addEventListener('change', handleTemplateSelect);
}

/**
 * Opens the appropriate modal for a block type
 * @param {Object} block - The block to open modal for
 */
function openBlockModal(block) {
    if (block.type === 'input') {
        showModal('inputModal');
        selectedBlock = block;
    } else if (block.type === 'view') {
        displayData(block);
    } else if (block.type === 'output') {
        showModal('outputModal');
        selectedBlock = block;
    } else if (block.type === 'automapper') {
        openAutomapperModal(block);
    } else if (block.type === 'mapping') {
        openMappingModal(block);
    } else if (block.type === 'transform') {
        openTransformModal(block);
    } else if (block.type === 'outputdata') {
        openOutputDataModal(block);
    } else if (block.type === 'validation') {
        openValidationModal(block);
    } else if (block.type === 'valuemapper') {
        openValueMapperModal(block);
    } else if (block.type === 'concatenate') {
        openConcatenateModal(block);
    } else if (block.type === 'split') {
        openSplitModal(block);
    } else if (block.type === 'casechange') {
        openCaseChangeModal(block);
    } else if (block.type === 'math') {
        openMathModal(block);
    } else if (block.type === 'regexreplace') {
        openRegexReplaceModal(block);
    } else if (block.type === 'dateformat') {
        openDateFormatModal(block);
    } else if (block.type === 'expression') {
        openExpressionModal(block);
    } else if (block.type === 'copyrename') {
        openCopyRenameModal(block);
    } else if (block.type === 'join') {
        openJoinModal(block);
    }
}

/**
 * Handles file selection for data input
 * @param {Event} e - File input change event
 */
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    const isLargeFile = file.size > 5 * 1024 * 1024; // > 5MB
    
    // Show loading indicator for large files
    if (isLargeFile) {
        document.getElementById('fileInfo').innerHTML = `<div style="color: #666;">⏳ Laden van groot bestand (${fileSizeMB} MB)...</div>`;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const csvData = event.target.result;
        
        // Use performance monitoring for large files
        const parsed = isLargeFile 
            ? measurePerformance(`CSV parsing (${fileSizeMB} MB)`, () => parseCSV(csvData))
            : parseCSV(csvData);
        
        // Store data with headers
        dataStore[selectedBlock.id] = {
            data: parsed.data,
            headers: parsed.headers
        };
        
        // Update block UI with performance indicator
        let statusText = `${escapeHtml(file.name)} (${parsed.data.length} rijen)`;
        if (parsed.isLarge) {
            statusText += ' 🚀';
        }
        updateBlockContent(selectedBlock.id, statusText);
        
        // Close modal
        hideModal('inputModal');
        
        // Transfer to connected blocks
        propagateData(selectedBlock.id);
        
        // Show info with performance note
        let infoHTML = `
            <strong>Geladen:</strong> ${escapeHtml(file.name)}<br>
            <strong>Rijen:</strong> ${parsed.data.length}<br>
            <strong>Kolommen:</strong> ${parsed.headers.length}
        `;
        
        if (parsed.isLarge) {
            infoHTML += `<br><div style="color: #4CAF50; font-size: 12px; margin-top: 5px;">✓ Performance optimalisaties actief</div>`;
        }
        
        document.getElementById('fileInfo').innerHTML = infoHTML;
    };
    reader.readAsText(file);
}

/**
 * Handles template file selection for output structure
 * @param {Event} e - File input change event
 */
function handleTemplateSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    const isLargeFile = file.size > 5 * 1024 * 1024; // > 5MB
    
    // Show loading indicator for large files
    if (isLargeFile) {
        document.getElementById('templateInfo').innerHTML = `<div style="color: #666;">⏳ Laden van groot bestand (${fileSizeMB} MB)...</div>`;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const csvData = event.target.result;
        
        // Use performance monitoring for large files
        const parsed = isLargeFile 
            ? measurePerformance(`Template CSV parsing (${fileSizeMB} MB)`, () => parseCSV(csvData))
            : parseCSV(csvData);
        
        // Store template data
        dataStore[selectedBlock.id] = {
            data: parsed.data,
            headers: parsed.headers,
            isTemplate: true,
            fileName: file.name
        };
        
        // Update block UI
        let statusText = `${escapeHtml(file.name)} (${parsed.data.length} rijen)`;
        if (parsed.isLarge) {
            statusText += ' 🚀';
        }
        updateBlockContent(selectedBlock.id, statusText);
        
        // Close modal
        hideModal('outputModal');
        
        // Show info with performance note
        let infoHTML = `
            <strong>Geladen:</strong> ${escapeHtml(file.name)}<br>
            <strong>Template rijen:</strong> ${parsed.data.length}<br>
            <strong>Kolommen:</strong> ${parsed.headers.length}
        `;
        
        if (parsed.isLarge) {
            infoHTML += `<br><div style="color: #4CAF50; font-size: 12px; margin-top: 5px;">✓ Performance optimalisaties actief</div>`;
        }
        
        document.getElementById('templateInfo').innerHTML = infoHTML;
    };
    reader.readAsText(file);
}

/**
 * Parses a CSV string into headers and data rows
 * Handles quoted values with commas properly
 * Optimized for large datasets with efficient memory usage
 * @param {string} csv - The CSV string to parse
 * @returns {Object} - Object with headers array and data array
 */
function parseCSV(csv) {
    try {
        const lines = csv.trim().split('\n');
        if (lines.length === 0) return { data: [], headers: [] };
        
        // Helper function to parse a CSV line respecting quotes
        function parseLine(line) {
            const values = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim());
            return values;
        }
        
        const headers = parseLine(lines[0]);
        const data = [];
        
        // For large datasets, pre-allocate array capacity hint (if possible)
        // Use fallback value if LARGE_DATASET_THRESHOLD is not defined (for test compatibility)
        const threshold = typeof LARGE_DATASET_THRESHOLD !== 'undefined' ? LARGE_DATASET_THRESHOLD : 1000;
        const isLargeDataset = lines.length > threshold;
        
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue; // Skip empty lines
            
            const values = parseLine(lines[i]);
            const row = {};
            
            // Optimize property assignment for large datasets
            for (let j = 0; j < headers.length; j++) {
                row[headers[j]] = values[j] || '';
            }
            
            data.push(row);
        }
        
        return { 
            data: data, 
            headers: headers,
            isLarge: isLargeDataset 
        };
    } catch (error) {
        console.error('Error parsing CSV:', error);
        // Return empty structure instead of crashing
        return { data: [], headers: [], error: error.message };
    }
}

function updateBlockContent(blockId, content) {
    const contentEl = document.getElementById(`${blockId}-content`);
    if (contentEl) {
        contentEl.innerHTML = content;
    }
    
    // Add success status
    const block = document.getElementById(blockId);
    let statusEl = block.querySelector('.block-status');
    if (!statusEl) {
        statusEl = document.createElement('div');
        statusEl.className = 'block-status success';
        block.querySelector('.block-content').after(statusEl);
    }
    statusEl.textContent = '✓ Gereed';
}

function propagateData(blockId) {
    const connectedBlocks = connections.filter(c => c.from === blockId);
    connectedBlocks.forEach(conn => {
        transferData(conn.from, conn.to);
    });
}

function transferData(fromId, toId) {
    // Defensive check: ensure source data exists and is valid
    if (!dataStore[fromId]) {
        console.warn('transferData: No data in source block', fromId);
        return;
    }
    
    const sourceData = dataStore[fromId];
    let dataArray = [];
    
    // Handle both new format (with headers/data) and legacy format (array)
    if (sourceData.data && Array.isArray(sourceData.data)) {
        dataArray = sourceData.data;
    } else if (Array.isArray(sourceData)) {
        dataArray = sourceData;
    }
    
    if (dataArray.length === 0) {
        console.warn('transferData: Source data is empty', fromId);
        // Still transfer empty data structure to maintain consistency
    }
    
    // Optimize cloning for large datasets
    // For large datasets, use shallow copy of array and only clone row references
    // This is safe because transform operations create new row objects
    let clonedData;
    // Use fallback value if LARGE_DATASET_THRESHOLD is not defined (for test compatibility)
    const threshold = typeof LARGE_DATASET_THRESHOLD !== 'undefined' ? LARGE_DATASET_THRESHOLD : 1000;
    const isLargeDataset = dataArray.length >= threshold;
    
    if (sourceData.data && sourceData.headers) {
        if (isLargeDataset) {
            // For large datasets: shallow copy array, rows are shared (safe for read-only operations)
            // Transforms will create new objects anyway
            clonedData = {
                data: [...dataArray],
                headers: [...sourceData.headers]
            };
        } else {
            // For small datasets: deep clone for safety
            clonedData = {
                data: dataArray.map(row => ({ ...row })),
                headers: [...sourceData.headers]
            };
        }
    } else {
        if (isLargeDataset) {
            clonedData = [...dataArray];
        } else {
            clonedData = dataArray.map(row => ({ ...row }));
        }
    }
    
    dataStore[toId] = clonedData;
    
    console.debug('transferData', {
        from: fromId,
        to: toId,
        rows: dataArray.length,
        optimized: isLargeDataset
    });
    
    // Update target block UI if it's a view block
    const toBlock = blocks.find(b => b.id === toId);
    if (toBlock && toBlock.type === 'view') {
        updateBlockContent(toId, `Data beschikbaar (${dataArray.length} rijen)`);
    }
}

/**
 * Displays data in a modal table view with proper HTML escaping
 * Optimized for large datasets using DOM manipulation instead of string concatenation
 * @param {Object} block - The block whose data to display
 */
function displayData(block) {
    let blockData = dataStore[block.id];
    let headers = [];
    let rows = [];
    
    // Handle new data structure with headers and data properties
    if (blockData && blockData.headers && Array.isArray(blockData.headers)) {
        headers = blockData.headers;
        rows = blockData.data || [];
    } else if (Array.isArray(blockData)) {
        // Legacy support: old format where data was stored as array
        if (blockData.length > 0) {
            headers = Object.keys(blockData[0]);
            rows = blockData;
        }
    }
    
    const dataDisplay = document.getElementById('dataDisplay');
    
    // Display table if we have headers
    if (headers.length > 0) {
        // For large datasets, use DOM manipulation for better performance
        // Use fallback value if LARGE_DATASET_THRESHOLD is not defined (for test compatibility)
        const threshold = typeof LARGE_DATASET_THRESHOLD !== 'undefined' ? LARGE_DATASET_THRESHOLD : 1000;
        const isLargeDataset = rows.length >= threshold;
        
        if (isLargeDataset) {
            // Use DocumentFragment for efficient DOM building
            const table = document.createElement('table');
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            
            headers.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            const tbody = document.createElement('tbody');
            const displayRows = rows.slice(0, MAX_DISPLAY_ROWS);
            
            if (displayRows.length > 0) {
                displayRows.forEach(row => {
                    const tr = document.createElement('tr');
                    headers.forEach(header => {
                        const td = document.createElement('td');
                        td.textContent = row[header] || '';
                        tr.appendChild(td);
                    });
                    tbody.appendChild(tr);
                });
            } else {
                const tr = document.createElement('tr');
                const td = document.createElement('td');
                td.setAttribute('colspan', headers.length);
                td.style.textAlign = 'center';
                td.style.color = '#888';
                td.textContent = 'Geen data, alleen kolommen';
                tr.appendChild(td);
                tbody.appendChild(tr);
            }
            
            table.appendChild(tbody);
            
            // Clear and append
            dataDisplay.innerHTML = '';
            dataDisplay.appendChild(table);
            
            if (rows.length > MAX_DISPLAY_ROWS) {
                const info = document.createElement('p');
                info.style.marginTop = '15px';
                info.style.color = '#666';
                info.style.fontSize = '12px';
                info.textContent = `Toon eerste ${MAX_DISPLAY_ROWS} van ${rows.length} rijen`;
                dataDisplay.appendChild(info);
            }
        } else {
            // For smaller datasets, use string concatenation (faster for small data)
            let html = '<table>';
            html += '<thead><tr>';
            headers.forEach(header => {
                html += `<th>${escapeHtml(header)}</th>`;
            });
            html += '</tr></thead>';
            html += '<tbody>';
            if (rows.length > 0) {
                rows.slice(0, MAX_DISPLAY_ROWS).forEach(row => {
                    html += '<tr>';
                    headers.forEach(header => {
                        html += `<td>${escapeHtml(row[header] || '')}</td>`;
                    });
                    html += '</tr>';
                });
            } else {
                html += '<tr><td colspan="' + headers.length + '" style="text-align:center; color:#888;">Geen data, alleen kolommen</td></tr>';
            }
            html += '</tbody>';
            html += '</table>';
            if (rows.length > MAX_DISPLAY_ROWS) {
                html += `<p style="margin-top: 15px; color: #666; font-size: 12px;">Toon eerste ${MAX_DISPLAY_ROWS} van ${rows.length} rijen</p>`;
            }
            dataDisplay.innerHTML = html;
        }
        showModal('viewModal');
    } else {
        dataDisplay.innerHTML = '<p>Geen data beschikbaar. Verbind met een Data Input block.</p>';
        showModal('viewModal');
    }
}

// Automapper functionality
/**
 * Automatically generates column mappings between input and output headers
 * Uses exact, partial, and fuzzy matching strategies
 * @param {string[]} inputHeaders - Input column names
 * @param {string[]} outputHeaders - Output column names
 * @returns {Object} - Mappings object and confidence levels
 */
function autoGenerateMappings(inputHeaders, outputHeaders) {
    const mappings = {};
    const matchedInputs = new Set();
    const matchConfidence = {};
    
    // Normalize function for column matching
    function normalize(str) {
        return str.toLowerCase()
            .replace(/[_\s-]/g, '')
            .replace(/[^a-z0-9]/g, '');
    }
    
    outputHeaders.forEach(outHeader => {
        let bestMatch = null;
        let bestScore = 0;
        
        inputHeaders.forEach(inHeader => {
            if (matchedInputs.has(inHeader)) {
                return; // Skip already matched columns
            }
            
            const outNorm = normalize(outHeader);
            const inNorm = normalize(inHeader);
            
            // Exact match after normalization
            if (outNorm === inNorm) {
                bestMatch = inHeader;
                bestScore = EXACT_MATCH_SCORE;
                matchConfidence[outHeader] = 'exact';
            }
            // Partial match - output contains input or vice versa
            else if (bestScore < PARTIAL_MATCH_SCORE && (outNorm.includes(inNorm) || inNorm.includes(outNorm))) {
                bestMatch = inHeader;
                bestScore = PARTIAL_MATCH_SCORE;
                matchConfidence[outHeader] = 'partial';
            }
            // Similarity match using simple character overlap
            else if (bestScore < SIMILARITY_THRESHOLD) {
                const similarity = calculateSimilarity(outNorm, inNorm);
                if (similarity > SIMILARITY_THRESHOLD && similarity > bestScore) {
                    bestMatch = inHeader;
                    bestScore = similarity;
                    matchConfidence[outHeader] = 'fuzzy';
                }
            }
        });
        
        if (bestMatch) {
            mappings[outHeader] = bestMatch;
            matchedInputs.add(bestMatch);
        } else {
            matchConfidence[outHeader] = 'unmatched';
        }
    });
    
    return { mappings, matchConfidence };
}

/**
 * Calculates similarity between two strings
 * Uses position-based and character-based matching
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score between 0 and 1
 */
function calculateSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const maxLen = Math.max(len1, len2);
    
    if (maxLen === 0) return EXACT_MATCH_SCORE;
    
    // Quick check for exact match
    if (str1 === str2) return EXACT_MATCH_SCORE;
    
    // Count matching characters at same positions
    let matches = 0;
    const minLen = Math.min(len1, len2);
    for (let i = 0; i < minLen; i++) {
        if (str1[i] === str2[i]) {
            matches++;
        }
    }
    
    // Also count common characters regardless of position
    const chars1 = new Set(str1);
    const chars2 = new Set(str2);
    let commonChars = 0;
    chars1.forEach(char => {
        if (chars2.has(char)) {
            commonChars++;
        }
    });
    
    // Weighted score: position matches count more
    return (matches * 2 + commonChars) / (maxLen * 2 + Math.max(chars1.size, chars2.size));
}

function openAutomapperModal(block) {
    selectedBlock = block;
    
    // Get input data from connected blocks
    const inputConnection = connections.find(c => c.to === block.id);
    if (!inputConnection || !dataStore[inputConnection.from]) {
        document.getElementById('automapperInterface').innerHTML = '<p style="color: #e44;">Verbind eerst een Data Input block met deze Automapper block.</p>';
        document.getElementById('automapperModal').style.display = 'block';
        return;
    }
    
    const inputData = dataStore[inputConnection.from];
    const inputHeaders = inputData.headers || [];
    
    // Get output template from second input or look for output block
    let outputHeaders = [];
    let templateFound = false;
    
    // Check all connections to this block for a template
    const allInputConnections = connections.filter(c => c.to === block.id);
    allInputConnections.forEach(conn => {
        if (dataStore[conn.from] && dataStore[conn.from].isTemplate) {
            outputHeaders = dataStore[conn.from].headers || [];
            templateFound = true;
        }
    });
    
    // If no template found as input, check for connected output blocks
    if (!templateFound) {
        const outputConnection = connections.find(c => c.from === block.id);
        if (outputConnection && dataStore[outputConnection.to] && dataStore[outputConnection.to].isTemplate) {
            outputHeaders = dataStore[outputConnection.to].headers || [];
            templateFound = true;
        }
    }
    
    if (!templateFound || outputHeaders.length === 0) {
        document.getElementById('automapperInterface').innerHTML = '<p style="color: #e44;">Verbind ook een Target Structure block om automatische mappings te genereren.</p>';
        document.getElementById('automapperModal').style.display = 'block';
        return;
    }
    
    // Generate automatic mappings
    const { mappings, matchConfidence } = autoGenerateMappings(inputHeaders, outputHeaders);
    
    // Store the auto-generated mappings
    block.autoMappings = mappings;
    block.matchConfidence = matchConfidence;
    
    // Build display interface
    let html = '<div style="margin-bottom: 20px;">';
    html += `<div style="background: #f0f8ff; padding: 12px; border-radius: 4px; border-left: 4px solid #4a90e2; margin-bottom: 15px;">`;
    html += `<strong>Automatisch gegenereerd:</strong> ${Object.keys(mappings).length} van ${outputHeaders.length} kolommen gematcht`;
    html += '</div>';
    
    html += '<div style="display: grid; grid-template-columns: 1fr auto 1fr auto; gap: 15px; align-items: center; margin-bottom: 10px; padding: 10px; background: #f5f5f5; border-radius: 4px; font-weight: 600; font-size: 13px;">';
    html += '<div>Output Kolom</div>';
    html += '<div></div>';
    html += '<div>Input Kolom</div>';
    html += '<div>Match</div>';
    html += '</div>';
    
    outputHeaders.forEach(outHeader => {
        const inputCol = mappings[outHeader];
        const confidence = matchConfidence[outHeader];
        
        let confidenceColor = '#aaa';
        let confidenceIcon = '❓';
        let confidenceText = 'Niet gematcht';
        
        if (confidence === 'exact') {
            confidenceColor = '#2ecc71';
            confidenceIcon = '✓';
            confidenceText = 'Exact';
        } else if (confidence === 'partial') {
            confidenceColor = '#f39c12';
            confidenceIcon = '≈';
            confidenceText = 'Gedeeltelijk';
        } else if (confidence === 'fuzzy') {
            confidenceColor = '#e67e22';
            confidenceIcon = '~';
            confidenceText = 'Vergelijkbaar';
        }
        
        html += '<div style="display: grid; grid-template-columns: 1fr auto 1fr auto; gap: 15px; align-items: center; padding: 12px; background: white; border-radius: 4px; border: 1px solid #e0e0e0; margin-bottom: 8px;">';
        html += `<div style="font-weight: 500;">${outHeader}</div>`;
        html += '<div style="color: #666; font-size: 18px;">→</div>';
        html += `<div style="color: ${inputCol ? '#333' : '#999'}; ${!inputCol ? 'font-style: italic;' : ''}">${inputCol || 'Geen match'}</div>`;
        html += `<div style="display: flex; align-items: center; gap: 5px;">`;
        html += `<span style="color: ${confidenceColor}; font-size: 16px;">${confidenceIcon}</span>`;
        html += `<span style="font-size: 11px; color: ${confidenceColor}; font-weight: 500;">${confidenceText}</span>`;
        html += `</div>`;
        html += '</div>';
    });
    
    html += '</div>';
    
    // Show unmapped input columns
    const unmappedInputs = inputHeaders.filter(h => !Object.values(mappings).includes(h));
    if (unmappedInputs.length > 0) {
        html += '<div style="margin-top: 20px; padding: 12px; background: #fff3cd; border-radius: 4px; border-left: 4px solid #ffc107;">';
        html += `<strong>Niet gemapte input kolommen (${unmappedInputs.length}):</strong><br>`;
        html += '<div style="margin-top: 8px; font-size: 12px;">';
        html += unmappedInputs.map(h => `<span style="display: inline-block; padding: 4px 8px; background: white; border-radius: 3px; margin-right: 5px; margin-bottom: 5px;">${h}</span>`).join('');
        html += '</div>';
        html += '</div>';
    }
    
    document.getElementById('automapperInterface').innerHTML = html;
    document.getElementById('automapperModal').style.display = 'block';
    
    // Apply automapper button
    document.getElementById('applyAutomapper').onclick = () => {
        applyAutomapper(block, inputHeaders);
    };
    
    // Send to mapping button
    document.getElementById('sendToMapping').onclick = () => {
        sendToMappingBlock(block);
    };
}

function applyAutomapper(block, inputHeaders) {
    const mappings = block.autoMappings || {};
    
    // Execute the mapping transformation
    const inputConnection = connections.find(c => c.to === block.id);
    if (inputConnection && dataStore[inputConnection.from]) {
        const inputData = dataStore[inputConnection.from];
        const mappedData = applyMappingTransformation(inputData, mappings);
        
        // Store mapped data
        dataStore[block.id] = mappedData;
        
        // Update block content
        const mappingCount = Object.keys(mappings).length;
        updateBlockContent(block.id, `${mappingCount} auto-mapping(s) actief`);
        
        // Propagate data to connected blocks
        propagateData(block.id);
    }
    
    // Close modal
    document.getElementById('automapperModal').style.display = 'none';
}

function sendToMappingBlock(block) {
    // Find or create a connected mapping block
    const outputConnection = connections.find(c => c.from === block.id);
    let mappingBlock = null;
    
    if (outputConnection) {
        const connectedBlock = blocks.find(b => b.id === outputConnection.to);
        if (connectedBlock && connectedBlock.type === 'mapping') {
            mappingBlock = connectedBlock;
        }
    }
    
    if (!mappingBlock) {
        // Create a new mapping block connected to automapper
        const automapperEl = document.getElementById(block.id);
        const rect = automapperEl.getBoundingClientRect();
        const canvasRect = document.getElementById('canvas').getBoundingClientRect();
        
        // Position it to the right
        const x = block.x + 250;
        const y = block.y;
        
        createBlock('mapping', x, y);
        mappingBlock = blocks[blocks.length - 1];
        
        // Connect automapper to mapping block
        addConnection(block.id, mappingBlock.id);
    }
    
    // Transfer auto-mappings to mapping block
    mappingBlock.mappings = block.autoMappings || {};
    mappingBlock.fromAutomapper = true;
    
    // Update mapping block content
    const mappingCount = Object.keys(mappingBlock.mappings).length;
    updateBlockContent(mappingBlock.id, `${mappingCount} mapping(s) van Automapper`);
    
    // Close automapper modal
    document.getElementById('automapperModal').style.display = 'none';
    
    // Notify user
    alert(`Auto-mappings succesvol overgedragen naar Mapping block!\n\nJe kunt nu het Mapping block openen om aanpassingen te maken.`);
}

// Mapping functionality
function openMappingModal(block) {
    selectedBlock = block;
    
    // Get input data from connected blocks
    const inputConnection = connections.find(c => c.to === block.id);
    if (!inputConnection || !dataStore[inputConnection.from]) {
        document.getElementById('mappingInterface').innerHTML = '<p style="color: #e44;">Verbind eerst een Data Input block met deze Mapping block.</p>';
        document.getElementById('mappingModal').style.display = 'block';
        return;
    }
    
    const inputData = dataStore[inputConnection.from];
    const inputHeaders = inputData.headers || [];
    
    // Get output template if connected
    const outputConnection = connections.find(c => c.from === block.id);
    let outputHeaders = [];
    if (outputConnection && dataStore[outputConnection.to] && dataStore[outputConnection.to].isTemplate) {
        outputHeaders = dataStore[outputConnection.to].headers || [];
    }
    
    // Load existing mappings if any
    const existingMappings = block.mappings || {};
    
    // Build mapping interface
    let html = '<div style="display: flex; gap: 30px;">';
    
    // Input columns
    html += '<div style="flex: 1;">';
    html += '<h3 style="font-size: 14px; margin-bottom: 10px; font-weight: 600;">Input Kolommen</h3>';
    html += '<div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 10px; background: #f9f9f9;">';
    inputHeaders.forEach(header => {
        html += `<div style="padding: 8px; margin-bottom: 5px; background: white; border-radius: 3px; border: 1px solid #e0e0e0;">${header}</div>`;
    });
    html += '</div></div>';
    
    // Mapping interface
    html += '<div style="flex: 2;">';
    html += '<h3 style="font-size: 14px; margin-bottom: 10px; font-weight: 600;">Kolom Mappings</h3>';
    html += '<div id="mappingList" style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 10px; background: white;">';
    
    if (outputHeaders.length > 0) {
        // If we have an output template, show mappings for each output column
        outputHeaders.forEach((outHeader, idx) => {
            html += '<div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px; padding: 10px; background: #f9f9f9; border-radius: 4px;">';
            html += `<span style="flex: 1; font-weight: 500;">${outHeader}</span>`;
            html += '<span style="color: #666;">←</span>';
            html += `<select class="mapping-select" data-output="${outHeader}" style="flex: 2; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px; font-size: 13px;">`;
            html += '<option value="">-- Selecteer input kolom --</option>';
            inputHeaders.forEach(inHeader => {
                const selected = existingMappings[outHeader] === inHeader ? 'selected' : '';
                html += `<option value="${inHeader}" ${selected}>${inHeader}</option>`;
            });
            html += '</select>';
            html += '</div>';
        });
    } else {
        // No output template, allow free-form mapping
        html += '<p style="color: #666; font-size: 13px; margin-bottom: 15px;">Creëer mappings van input naar output kolommen.</p>';
        
        // Show existing mappings
        const mappingCount = Object.keys(existingMappings).length;
        if (mappingCount > 0) {
            Object.keys(existingMappings).forEach((outCol, idx) => {
                html += createMappingRow(outCol, existingMappings[outCol], inputHeaders, idx);
            });
        } else {
            html += createMappingRow('', '', inputHeaders, 0);
        }
        
        html += '<button id="addMappingRow" style="margin-top: 10px; padding: 8px 15px; background: #f0f0f0; border: 1px solid #e0e0e0; border-radius: 4px; cursor: pointer; font-size: 12px;">+ Voeg mapping toe</button>';
    }
    
    html += '</div></div></div>';
    
    document.getElementById('mappingInterface').innerHTML = html;
    document.getElementById('mappingModal').style.display = 'block';
    
    // Add event listener for adding new mapping rows (free-form mode)
    const addButton = document.getElementById('addMappingRow');
    if (addButton) {
        addButton.addEventListener('click', () => {
            const mappingList = document.getElementById('mappingList');
            const rowCount = mappingList.querySelectorAll('.mapping-row').length;
            const newRow = createMappingRow('', '', inputHeaders, rowCount);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = newRow;
            addButton.parentNode.insertBefore(tempDiv.firstChild, addButton);
        });
    }
    
    // Apply mapping button
    document.getElementById('applyMapping').onclick = () => {
        applyMapping(block, inputHeaders, outputHeaders);
    };
}

function createMappingRow(outputCol, inputCol, inputHeaders, index) {
    let html = '<div class="mapping-row" style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px; padding: 10px; background: #f9f9f9; border-radius: 4px;">';
    html += `<input type="text" class="output-column" value="${outputCol}" placeholder="Output kolom" style="flex: 1; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px; font-size: 13px;" />`;
    html += '<span style="color: #666;">←</span>';
    html += `<select class="input-column" style="flex: 1; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px; font-size: 13px;">`;
    html += '<option value="">-- Selecteer --</option>';
    inputHeaders.forEach(header => {
        const selected = header === inputCol ? 'selected' : '';
        html += `<option value="${header}" ${selected}>${header}</option>`;
    });
    html += '</select>';
    html += `<button class="remove-mapping" style="padding: 6px 10px; background: #fee; color: #e44; border: 1px solid #fcc; border-radius: 3px; cursor: pointer; font-size: 12px;">×</button>`;
    html += '</div>';
    return html;
}

function applyMapping(block, inputHeaders, outputHeaders) {
    // Collect mappings from UI
    const mappings = {};
    
    if (outputHeaders.length > 0) {
        // Template-based mapping
        const selects = document.querySelectorAll('.mapping-select');
        selects.forEach(select => {
            const outputCol = select.dataset.output;
            const inputCol = select.value;
            if (inputCol) {
                mappings[outputCol] = inputCol;
            }
        });
    } else {
        // Free-form mapping
        const rows = document.querySelectorAll('.mapping-row');
        rows.forEach(row => {
            const outputCol = row.querySelector('.output-column').value.trim();
            const inputCol = row.querySelector('.input-column').value;
            if (outputCol && inputCol) {
                mappings[outputCol] = inputCol;
            }
        });
    }
    
    // Store mappings in block
    block.mappings = mappings;
    
    // Execute the mapping transformation
    const inputConnection = connections.find(c => c.to === block.id);
    if (inputConnection && dataStore[inputConnection.from]) {
        const inputData = dataStore[inputConnection.from];
        const mappedData = applyMappingTransformation(inputData, mappings);
        
        // Store mapped data
        dataStore[block.id] = mappedData;
        
        // Update block content
        const mappingCount = Object.keys(mappings).length;
        updateBlockContent(block.id, `${mappingCount} mapping(s) actief`);
        
        // Propagate data to connected blocks
        propagateData(block.id);
    }
    
    // Close modal
    document.getElementById('mappingModal').style.display = 'none';
}

function applyMappingTransformation(inputData, mappings) {
    const inputRows = inputData.data || [];
    const inputHeaders = inputData.headers || [];
    
    // Create new headers based on mappings
    const outputHeaders = Object.keys(mappings);
    
    // Transform each row
    const outputRows = inputRows.map(row => {
        const newRow = {};
        outputHeaders.forEach(outputCol => {
            const inputCol = mappings[outputCol];
            newRow[outputCol] = row[inputCol] || '';
        });
        return newRow;
    });
    
    return {
        data: outputRows,
        headers: outputHeaders
    };
}

// Transform functionality
function openTransformModal(block) {
    selectedBlock = block;
    
    // Get input data from connected blocks
    const inputConnection = connections.find(c => c.to === block.id);
    if (!inputConnection || !dataStore[inputConnection.from]) {
        document.getElementById('transformInterface').innerHTML = '<p style="color: #e44;">Verbind eerst een Data Input of Mapping block met deze Transform block.</p>';
        document.getElementById('transformModal').style.display = 'block';
        return;
    }
    
    const inputData = dataStore[inputConnection.from];
    const inputHeaders = inputData.headers || [];
    const inputRows = inputData.data || [];
    
    // Load existing transformations if any (new structure)
    const existingTransformations = block.transformations || {};
    
    // Build transform interface
    let html = '<div style="display: flex; gap: 30px;">';
    
    // Input columns
    html += '<div style="flex: 1;">';
    html += '<h3 style="font-size: 14px; margin-bottom: 10px; font-weight: 600;">Input Kolommen</h3>';
    html += '<div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 10px; background: #f9f9f9;">';
    inputHeaders.forEach(header => {
        html += `<div style="padding: 8px; margin-bottom: 5px; background: white; border-radius: 3px; border: 1px solid #e0e0e0;">${header}</div>`;
    });
    html += '</div></div>';
    
    // Transformation interface
    html += '<div style="flex: 2;">';
    html += '<h3 style="font-size: 14px; margin-bottom: 10px; font-weight: 600;">Output Kolom Transformations</h3>';
    html += '<div id="transformMappingList" style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 10px; background: white; max-height: 400px; overflow-y: auto;">';
    
    html += '<p style="color: #666; font-size: 13px; margin-bottom: 15px;">Configure advanced transformations for each output column.</p>';
    
    // Show existing transformations
    const transformCount = Object.keys(existingTransformations).length;
    if (transformCount > 0) {
        Object.keys(existingTransformations).forEach((outCol, idx) => {
            html += createTransformMappingRow(outCol, null, inputHeaders, idx, existingTransformations[outCol]);
        });
    } else {
        html += createTransformMappingRow('', '', inputHeaders, 0, null);
    }
    
    html += '<button id="addTransformMappingRow" style="margin-top: 10px; padding: 8px 15px; background: #f0f0f0; border: 1px solid #e0e0e0; border-radius: 4px; cursor: pointer; font-size: 12px;">+ Voeg transformatie toe</button>';
    
    html += '</div></div></div>';
    
    // Show data preview
    html += '<div style="margin-top: 20px; border-top: 1px solid #e0e0e0; padding-top: 20px;">';
    html += '<h3 style="font-size: 14px; margin-bottom: 10px; font-weight: 600;">Data Preview</h3>';
    html += `<p style="color: #666; font-size: 13px;">Input heeft ${inputRows.length} rijen en ${inputHeaders.length} kolommen</p>`;
    html += '<div id="transformPreview" style="margin-top: 10px;"></div>';
    html += '</div>';
    
    document.getElementById('transformInterface').innerHTML = html;
    document.getElementById('transformModal').style.display = 'block';
    
    // Add event listener for operation changes to update parameter fields
    const updateParamFields = () => {
        document.querySelectorAll('.transform-operation').forEach(select => {
            select.addEventListener('change', (e) => {
                const row = e.target.closest('.transform-mapping-row');
                const paramContainer = row.querySelector('.param-container');
                const operation = e.target.value;
                paramContainer.innerHTML = getParameterFields(operation, {});
                
                // Update input selector type based on operation
                const inputsDiv = row.querySelector('.transform-inputs');
                const operation_val = e.target.value;
                
                // Rebuild inputs selector
                let newInputsHTML = '<span style="font-size: 12px; color: #666; min-width: 80px;">Input(s):</span>';
                
                if (operation_val === 'concatenate' || operation_val === 'math') {
                    // Multi-select with checkboxes
                    newInputsHTML += '<div style="flex: 1; display: flex; flex-wrap: wrap; gap: 5px; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px; background: white; min-height: 36px;">';
                    inputHeaders.forEach(header => {
                        newInputsHTML += `<label style="display: flex; align-items: center; gap: 3px; font-size: 12px; padding: 3px 6px; background: #f0f0f0; border-radius: 3px; cursor: pointer;">`;
                        newInputsHTML += `<input type="checkbox" class="transform-input-checkbox" value="${header}" style="cursor: pointer;">`;
                        newInputsHTML += `<span>${header}</span></label>`;
                    });
                    newInputsHTML += '</div>';
                } else {
                    // Single select dropdown
                    newInputsHTML += `<select class="transform-input-column" style="flex: 1; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px; font-size: 13px;">`;
                    newInputsHTML += '<option value="">-- Selecteer input kolom --</option>';
                    inputHeaders.forEach(header => {
                        newInputsHTML += `<option value="${header}">${header}</option>`;
                    });
                    newInputsHTML += '</select>';
                }
                
                inputsDiv.innerHTML = newInputsHTML;
            });
        });
    };
    
    // Add event listener for adding new transformation rows
    const addButton = document.getElementById('addTransformMappingRow');
    if (addButton) {
        addButton.addEventListener('click', () => {
            const mappingList = document.getElementById('transformMappingList');
            const rowCount = mappingList.querySelectorAll('.transform-mapping-row').length;
            const newRow = createTransformMappingRow('', '', inputHeaders, rowCount, null);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = newRow;
            const newRowElement = tempDiv.firstChild;
            addButton.parentNode.insertBefore(newRowElement, addButton);
            
            // Attach event listeners to the new row
            updateParamFields();
            attachRemoveListeners();
        });
    }
    
    // Attach remove button listeners
    const attachRemoveListeners = () => {
        document.querySelectorAll('.remove-transform-mapping').forEach(btn => {
            btn.onclick = function() {
                this.closest('.transform-mapping-row').remove();
            };
        });
    };
    
    updateParamFields();
    attachRemoveListeners();
    
    // Apply transform button (bottom)
    document.getElementById('applyTransform').onclick = () => {
        applyAdvancedTransform(block, inputHeaders, inputRows);
    };
    
    // Apply transform button (top right) - same handler
    document.getElementById('applyTransformTop').onclick = () => {
        applyAdvancedTransform(block, inputHeaders, inputRows);
    };
}

function createTransformMappingRow(outputCol, inputCol, inputHeaders, index, transformation) {
    // If transformation is provided, use it; otherwise default to 'copy' operation
    const op = transformation ? transformation.op : 'copy';
    const inputs = transformation ? transformation.inputs : (inputCol ? [inputCol] : []);
    const params = transformation ? transformation.params : {};
    
    let html = '<div class="transform-mapping-row" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; padding: 12px; background: #f9f9f9; border-radius: 4px; border: 1px solid #e0e0e0;">';
    
    // First row: Output column name and operation selector
    html += '<div style="display: flex; gap: 10px; align-items: center;">';
    html += `<input type="text" class="transform-output-column" value="${outputCol}" placeholder="Output kolom naam" style="flex: 1; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px; font-size: 13px;" />`;
    html += `<select class="transform-operation" style="flex: 1; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px; font-size: 13px;">`;
    html += `<option value="copy" ${op === 'copy' ? 'selected' : ''}>Copy/Rename</option>`;
    html += `<option value="concatenate" ${op === 'concatenate' ? 'selected' : ''}>Concatenate</option>`;
    html += `<option value="split" ${op === 'split' ? 'selected' : ''}>Split</option>`;
    html += `<option value="case" ${op === 'case' ? 'selected' : ''}>Case Change</option>`;
    html += `<option value="math" ${op === 'math' ? 'selected' : ''}>Math</option>`;
    html += `<option value="regex" ${op === 'regex' ? 'selected' : ''}>Regex Replace</option>`;
    html += `<option value="date" ${op === 'date' ? 'selected' : ''}>Date Format</option>`;
    html += `<option value="expression" ${op === 'expression' ? 'selected' : ''}>Expression</option>`;
    html += '</select>';
    html += `<button class="remove-transform-mapping" style="padding: 6px 10px; background: #fee; color: #e44; border: 1px solid #fcc; border-radius: 3px; cursor: pointer; font-size: 12px;">×</button>`;
    html += '</div>';
    
    // Second row: Input column(s) selector - shown for all operations
    html += '<div class="transform-inputs" style="display: flex; gap: 10px; align-items: center;">';
    html += '<span style="font-size: 12px; color: #666; min-width: 80px;">Input(s):</span>';
    
    // For operations that need multiple inputs (concatenate, math), show multi-select
    if (op === 'concatenate' || op === 'math') {
        html += '<div style="flex: 1; display: flex; flex-wrap: wrap; gap: 5px; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px; background: white; min-height: 36px;">';
        inputHeaders.forEach(header => {
            const checked = inputs.includes(header) ? 'checked' : '';
            html += `<label style="display: flex; align-items: center; gap: 3px; font-size: 12px; padding: 3px 6px; background: #f0f0f0; border-radius: 3px; cursor: pointer;">`;
            html += `<input type="checkbox" class="transform-input-checkbox" value="${header}" ${checked} style="cursor: pointer;">`;
            html += `<span>${header}</span></label>`;
        });
        html += '</div>';
    } else {
        // Single select for other operations
        html += `<select class="transform-input-column" style="flex: 1; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px; font-size: 13px;">`;
        html += '<option value="">-- Selecteer input kolom --</option>';
        inputHeaders.forEach(header => {
            const selected = inputs.includes(header) ? 'selected' : '';
            html += `<option value="${header}" ${selected}>${header}</option>`;
        });
        html += '</select>';
    }
    html += '</div>';
    
    // Third row: Parameters based on operation type
    html += '<div class="transform-params" style="display: flex; gap: 10px; align-items: center;">';
    html += '<span style="font-size: 12px; color: #666; min-width: 80px;">Parameters:</span>';
    html += '<div style="flex: 1;" class="param-container">';
    html += getParameterFields(op, params);
    html += '</div>';
    html += '</div>';
    
    html += '</div>';
    return html;
}

// Helper function to generate parameter fields based on operation type
function getParameterFields(operation, params) {
    let html = '';
    
    switch(operation) {
        case 'copy':
            html += '<span style="font-size: 12px; color: #999; font-style: italic;">No parameters needed</span>';
            break;
        case 'concatenate':
            html += `<input type="text" class="param-separator" value="${params.separator || ' '}" placeholder="Separator (bijv. ', ')" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px; font-size: 13px;" />`;
            break;
        case 'split':
            html += '<div style="display: flex; gap: 8px;">';
            html += `<input type="text" class="param-delimiter" value="${params.delimiter || ','}" placeholder="Delimiter" style="flex: 1; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px; font-size: 13px;" />`;
            html += `<input type="number" class="param-index" value="${params.index || 0}" placeholder="Index (0-based)" min="0" style="width: 100px; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px; font-size: 13px;" />`;
            html += '</div>';
            break;
        case 'case':
            html += `<select class="param-case-type" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px; font-size: 13px;">`;
            html += `<option value="upper" ${params.type === 'upper' ? 'selected' : ''}>UPPERCASE</option>`;
            html += `<option value="lower" ${params.type === 'lower' ? 'selected' : ''}>lowercase</option>`;
            html += `<option value="capitalize" ${params.type === 'capitalize' ? 'selected' : ''}>Capitalize</option>`;
            html += '</select>';
            break;
        case 'math':
            html += '<div style="display: flex; gap: 8px;">';
            html += `<select class="param-math-op" style="flex: 1; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px; font-size: 13px;">`;
            html += `<option value="add" ${params.mathOp === 'add' ? 'selected' : ''}>Add (+)</option>`;
            html += `<option value="subtract" ${params.mathOp === 'subtract' ? 'selected' : ''}>Subtract (-)</option>`;
            html += `<option value="multiply" ${params.mathOp === 'multiply' ? 'selected' : ''}>Multiply (*)</option>`;
            html += `<option value="divide" ${params.mathOp === 'divide' ? 'selected' : ''}>Divide (/)</option>`;
            html += '</select>';
            html += `<select class="param-round" style="width: 120px; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px; font-size: 13px;">`;
            html += `<option value="none" ${params.round === 'none' ? 'selected' : ''}>No rounding</option>`;
            html += `<option value="0" ${params.round === '0' ? 'selected' : ''}>0 decimals</option>`;
            html += `<option value="2" ${params.round === '2' ? 'selected' : ''}>2 decimals</option>`;
            html += `<option value="4" ${params.round === '4' ? 'selected' : ''}>4 decimals</option>`;
            html += '</select>';
            html += '</div>';
            break;
        case 'regex':
            html += '<div style="display: flex; gap: 8px;">';
            html += `<input type="text" class="param-regex-pattern" value="${params.pattern || ''}" placeholder="Pattern (bijv. [0-9]+)" style="flex: 1; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px; font-size: 13px;" />`;
            html += `<input type="text" class="param-regex-replacement" value="${params.replacement || ''}" placeholder="Replacement" style="flex: 1; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px; font-size: 13px;" />`;
            html += '</div>';
            break;
        case 'date':
            html += '<div style="display: flex; gap: 8px;">';
            html += `<input type="text" class="param-date-input-format" value="${params.inputFormat || 'ISO'}" placeholder="Input format (ISO/locale)" style="flex: 1; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px; font-size: 13px;" />`;
            html += `<input type="text" class="param-date-output-format" value="${params.outputFormat || 'ISO'}" placeholder="Output format" style="flex: 1; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px; font-size: 13px;" />`;
            html += '</div>';
            break;
        case 'expression':
            html += `<input type="text" class="param-expression" value="${params.expression || ''}" placeholder="Expression (bijv. \${A} + '-' + \${B})" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px; font-size: 13px;" />`;
            html += '<div style="font-size: 11px; color: #999; margin-top: 4px;">Use \${columnName} to reference columns</div>';
            break;
    }
    
    return html;
}

function applyAdvancedTransform(block, inputHeaders, inputRows) {
    // Collect transformations from UI
    const transformations = {};
    const rows = document.querySelectorAll('.transform-mapping-row');
    
    rows.forEach(row => {
        const outputCol = row.querySelector('.transform-output-column').value.trim();
        if (!outputCol) return;
        
        const operation = row.querySelector('.transform-operation').value;
        
        // Collect inputs based on operation type
        let inputs = [];
        if (operation === 'concatenate' || operation === 'math') {
            // Multi-select with checkboxes
            const checkboxes = row.querySelectorAll('.transform-input-checkbox:checked');
            inputs = Array.from(checkboxes).map(cb => cb.value);
        } else {
            // Single select
            const inputSelect = row.querySelector('.transform-input-column');
            if (inputSelect && inputSelect.value) {
                inputs = [inputSelect.value];
            }
        }
        
        if (inputs.length === 0 && operation !== 'expression') return;
        
        // Collect parameters based on operation type
        const params = {};
        
        switch(operation) {
            case 'concatenate':
                const separatorInput = row.querySelector('.param-separator');
                params.separator = separatorInput ? separatorInput.value : ' ';
                break;
            case 'split':
                const delimiterInput = row.querySelector('.param-delimiter');
                const indexInput = row.querySelector('.param-index');
                params.delimiter = delimiterInput ? delimiterInput.value : ',';
                params.index = indexInput ? parseInt(indexInput.value) : 0;
                break;
            case 'case':
                const caseTypeSelect = row.querySelector('.param-case-type');
                params.type = caseTypeSelect ? caseTypeSelect.value : 'upper';
                break;
            case 'math':
                const mathOpSelect = row.querySelector('.param-math-op');
                const roundSelect = row.querySelector('.param-round');
                params.mathOp = mathOpSelect ? mathOpSelect.value : 'add';
                params.round = roundSelect ? roundSelect.value : 'none';
                break;
            case 'regex':
                const patternInput = row.querySelector('.param-regex-pattern');
                const replacementInput = row.querySelector('.param-regex-replacement');
                params.pattern = patternInput ? patternInput.value : '';
                params.replacement = replacementInput ? replacementInput.value : '';
                break;
            case 'date':
                const inputFormatInput = row.querySelector('.param-date-input-format');
                const outputFormatInput = row.querySelector('.param-date-output-format');
                params.inputFormat = inputFormatInput ? inputFormatInput.value : 'ISO';
                params.outputFormat = outputFormatInput ? outputFormatInput.value : 'ISO';
                break;
            case 'expression':
                const expressionInput = row.querySelector('.param-expression');
                params.expression = expressionInput ? expressionInput.value : '';
                break;
        }
        
        transformations[outputCol] = {
            op: operation,
            inputs: inputs,
            params: params
        };
    });
    
    // Store transformations in block
    block.transformations = transformations;
    
    // Execute the transformations
    const inputConnection = connections.find(c => c.to === block.id);
    if (inputConnection && dataStore[inputConnection.from]) {
        const inputData = dataStore[inputConnection.from];
        const transformedData = applyAdvancedTransformationLogic(inputData, transformations);
        
        // Store transformed data
        dataStore[block.id] = transformedData;
        
        // Update block content
        const transformCount = Object.keys(transformations).length;
        updateBlockContent(block.id, `${transformCount} kolom(men) getransformeerd`);
        
        // Propagate data to connected blocks
        propagateData(block.id);
    }
    
    // Close modal
    document.getElementById('transformModal').style.display = 'none';
}

// Advanced transformation logic with multiple operation types
function applyAdvancedTransformationLogic(inputData, transformations, preserveUnmapped = true) {
    const inputRows = inputData.data || [];
    const inputHeaders = inputData.headers || [];
    const outputHeaders = Object.keys(transformations);
    
    // Transform each row
    const outputRows = inputRows.map(row => {
        const newRow = {};
        
        // If preserveUnmapped is true, first copy all unmapped input columns
        if (preserveUnmapped) {
            inputHeaders.forEach(inputCol => {
                // Check if this input column is used in any transformation
                const isUsedInTransformation = outputHeaders.some(outCol => {
                    const transformation = transformations[outCol];
                    return transformation.inputs && transformation.inputs.includes(inputCol);
                });
                
                // If not used in any transformation, preserve it as-is
                if (!isUsedInTransformation) {
                    newRow[inputCol] = row[inputCol] || '';
                }
            });
        }
        
        // Apply transformations to create/overwrite output columns
        outputHeaders.forEach(outputCol => {
            const transformation = transformations[outputCol];
            const op = transformation.op;
            const inputs = transformation.inputs || [];
            const params = transformation.params || {};
            
            try {
                let result = '';
                
                switch(op) {
                    case 'copy':
                        // Simple copy/rename
                        result = inputs.length > 0 ? (row[inputs[0]] || '') : '';
                        break;
                        
                    case 'concatenate':
                        // Concatenate multiple columns with separator
                        result = inputs.map(col => row[col] || '').join(params.separator || ' ');
                        break;
                        
                    case 'split':
                        // Split column on delimiter and take specific index
                        if (inputs.length > 0) {
                            const value = row[inputs[0]] || '';
                            const parts = value.split(params.delimiter || ',');
                            const index = params.index || 0;
                            result = parts[index] || '';
                        }
                        break;
                        
                    case 'case':
                        // Change case of text
                        if (inputs.length > 0) {
                            const value = row[inputs[0]] || '';
                            switch(params.type) {
                                case 'upper':
                                    result = value.toUpperCase();
                                    break;
                                case 'lower':
                                    result = value.toLowerCase();
                                    break;
                                case 'capitalize':
                                    result = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
                                    break;
                                default:
                                    result = value;
                            }
                        }
                        break;
                        
                    case 'math':
                        // Perform mathematical operations
                        if (inputs.length >= 2) {
                            const values = inputs.map(col => parseFloat(row[col]) || 0);
                            let mathResult = values[0];
                            
                            for (let i = 1; i < values.length; i++) {
                                switch(params.mathOp) {
                                    case 'add':
                                        mathResult += values[i];
                                        break;
                                    case 'subtract':
                                        mathResult -= values[i];
                                        break;
                                    case 'multiply':
                                        mathResult *= values[i];
                                        break;
                                    case 'divide':
                                        mathResult = values[i] !== 0 ? mathResult / values[i] : mathResult;
                                        break;
                                }
                            }
                            
                            // Apply rounding if specified
                            if (params.round !== 'none' && params.round !== undefined) {
                                const decimals = parseInt(params.round);
                                mathResult = Math.round(mathResult * Math.pow(10, decimals)) / Math.pow(10, decimals);
                            }
                            
                            result = mathResult.toString();
                        } else if (inputs.length === 1) {
                            result = row[inputs[0]] || '0';
                        }
                        break;
                        
                    case 'regex':
                        // Regex find and replace
                        if (inputs.length > 0 && params.pattern) {
                            const value = row[inputs[0]] || '';
                            try {
                                const regex = new RegExp(params.pattern, 'g');
                                result = value.replace(regex, params.replacement || '');
                            } catch(e) {
                                // Invalid regex, return original value
                                result = value;
                            }
                        }
                        break;
                        
                    case 'date':
                        // Date formatting
                        if (inputs.length > 0) {
                            const value = row[inputs[0]] || '';
                            result = formatDate(value, params.inputFormat, params.outputFormat);
                        }
                        break;
                        
                    case 'expression':
                        // Safe expression evaluation
                        result = evaluateSafeExpression(params.expression || '', row);
                        break;
                        
                    default:
                        result = '';
                }
                
                newRow[outputCol] = result;
            } catch(e) {
                // On error, set empty value
                newRow[outputCol] = '';
                console.error(`Error in transformation for ${outputCol}:`, e);
            }
        });
        
        return newRow;
    });
    
    // Determine final headers: unmapped columns + transformed columns
    let finalHeaders = outputHeaders;
    if (preserveUnmapped) {
        // Get unmapped input columns
        const unmappedColumns = inputHeaders.filter(inputCol => {
            return !outputHeaders.some(outCol => {
                const transformation = transformations[outCol];
                return transformation.inputs && transformation.inputs.includes(inputCol);
            });
        });
        // Combine unmapped columns (first) with transformed columns
        finalHeaders = [...unmappedColumns, ...outputHeaders];
    }
    
    return {
        data: outputRows,
        headers: finalHeaders
    };
}

// Helper function for date formatting
// Supports basic ISO format and locale string conversion
function formatDate(value, inputFormat, outputFormat) {
    if (!value) return '';
    
    try {
        let date;
        
        // Parse input date
        if (inputFormat === 'ISO' || inputFormat === 'iso') {
            date = new Date(value);
        } else if (inputFormat === 'locale') {
            date = new Date(value);
        } else {
            // Try to parse as ISO by default
            date = new Date(value);
        }
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return value; // Return original if parsing failed
        }
        
        // Format output date
        if (outputFormat === 'ISO' || outputFormat === 'iso') {
            return date.toISOString();
        } else if (outputFormat === 'locale') {
            return date.toLocaleDateString();
        } else if (outputFormat === 'YYYY-MM-DD') {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } else if (outputFormat === 'DD/MM/YYYY') {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${day}/${month}/${year}`;
        } else {
            // Default to ISO
            return date.toISOString();
        }
    } catch(e) {
        return value; // Return original on error
    }
}

// Safe expression evaluator using template string substitution
// Avoids eval() by using limited whitelist of operations
function evaluateSafeExpression(expression, row) {
    if (!expression) return '';
    
    try {
        // Replace ${columnName} with actual values
        let result = expression;
        
        // Find all ${...} patterns
        const pattern = /\$\{([^}]+)\}/g;
        const matches = expression.matchAll(pattern);
        
        for (const match of matches) {
            const columnName = match[1].trim();
            const value = row[columnName] || '';
            // Escape the value for safe string replacement
            const safeValue = String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            result = result.replace(match[0], safeValue);
        }
        
        // For safety, we only support string concatenation with +
        // and do not use eval. Just return the result with substitutions.
        // If the result contains operators, they will be treated as literal strings
        // This is a safe approach that avoids code injection
        
        // If expression only contains substitutions, return as is
        if (!result.includes('${')) {
            return result;
        }
        
        return result;
    } catch(e) {
        return '';
    }
}

// Keep backward compatibility with simple mapping transformation
function applyTransformationLogic(inputData, mappings, preserveUnmapped = true) {
    const inputRows = inputData.data || [];
    const inputHeaders = inputData.headers || [];
    
    // Create new headers based on mappings
    const outputHeaders = Object.keys(mappings);
    
    // Transform each row
    const outputRows = inputRows.map(row => {
        const newRow = {};
        
        // If preserveUnmapped is true, first copy all unmapped input columns
        if (preserveUnmapped) {
            inputHeaders.forEach(inputCol => {
                // Check if this input column is mapped to any output
                const isMapped = Object.values(mappings).includes(inputCol);
                
                // If not mapped, preserve it as-is
                if (!isMapped) {
                    newRow[inputCol] = row[inputCol] || '';
                }
            });
        }
        
        // Apply mappings to create/overwrite output columns
        outputHeaders.forEach(outputCol => {
            const inputCol = mappings[outputCol];
            newRow[outputCol] = row[inputCol] || '';
        });
        return newRow;
    });
    
    // Determine final headers: unmapped columns + mapped columns
    let finalHeaders = outputHeaders;
    if (preserveUnmapped) {
        // Get unmapped input columns
        const unmappedColumns = inputHeaders.filter(inputCol => {
            return !Object.values(mappings).includes(inputCol);
        });
        // Combine unmapped columns (first) with mapped columns
        finalHeaders = [...unmappedColumns, ...outputHeaders];
    }
    
    return {
        data: outputRows,
        headers: finalHeaders
    };
}

function exportTransformedCSV(block) {
    // Get the transformed data
    const transformedData = dataStore[block.id];
    
    if (!transformedData || !transformedData.headers || !transformedData.data) {
        alert('Geen getransformeerde data beschikbaar. Pas eerst een transformatie toe.');
        return;
    }
    
    // Generate CSV content
    const headers = transformedData.headers;
    const rows = transformedData.data;
    
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
        const values = headers.map(header => {
            const value = row[header] || '';
            // Escape values with commas or quotes
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csvContent += values.join(',') + '\n';
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'transformed-output.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success message
    alert(`CSV geëxporteerd met ${rows.length} rijen en ${headers.length} kolommen.`);
}

// Output Data functionality
function openOutputDataModal(block) {
    selectedBlock = block;
    
    // Get input data from connected blocks
    const inputConnection = connections.find(c => c.to === block.id);
    if (!inputConnection || !dataStore[inputConnection.from]) {
        document.getElementById('outputDataInterface').innerHTML = '<p style="color: #e44;">Verbind eerst een Transform block met deze Output Data block.</p>';
        document.getElementById('outputDataModal').style.display = 'block';
        return;
    }
    
    const inputData = dataStore[inputConnection.from];
    const inputHeaders = inputData.headers || [];
    const inputRows = inputData.data || [];
    
    // Build output data interface
    let html = '<div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 20px; background: #f9f9f9;">';
    html += '<h3 style="font-size: 14px; margin-bottom: 10px; font-weight: 600;">Data Overview</h3>';
    html += `<p style="color: #666; font-size: 13px; margin-bottom: 10px;">Klaar om te exporteren: ${inputRows.length} rijen en ${inputHeaders.length} kolommen</p>`;
    
    // Show column names
    html += '<div style="margin-top: 15px;">';
    html += '<h4 style="font-size: 13px; margin-bottom: 8px; font-weight: 600;">Kolommen:</h4>';
    html += '<div style="display: flex; flex-wrap: wrap; gap: 8px;">';
    inputHeaders.forEach(header => {
        html += `<span style="padding: 6px 12px; background: white; border: 1px solid #e0e0e0; border-radius: 4px; font-size: 12px;">${header}</span>`;
    });
    html += '</div></div>';
    
    // Show preview of first few rows
    if (inputRows.length > 0) {
        html += '<div style="margin-top: 15px;">';
        html += '<h4 style="font-size: 13px; margin-bottom: 8px; font-weight: 600;">Preview (eerste 3 rijen):</h4>';
        html += '<table style="width: 100%; border-collapse: collapse; background: white; font-size: 12px;">';
        html += '<thead><tr>';
        inputHeaders.forEach(header => {
            html += `<th style="padding: 8px; border: 1px solid #e0e0e0; background: #f5f5f5; text-align: left;">${header}</th>`;
        });
        html += '</tr></thead><tbody>';
        inputRows.slice(0, 3).forEach(row => {
            html += '<tr>';
            inputHeaders.forEach(header => {
                html += `<td style="padding: 8px; border: 1px solid #e0e0e0;">${row[header] || ''}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table>';
        html += '</div>';
    }
    
    html += '</div>';
    
    document.getElementById('outputDataInterface').innerHTML = html;
    document.getElementById('outputDataModal').style.display = 'block';
    
    // Export button
    document.getElementById('exportOutputData').onclick = () => {
        exportTransformedCSV(block);
    };
}

// Add click handlers for remove buttons (using event delegation)
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-mapping')) {
        e.target.closest('.mapping-row').remove();
    }
    if (e.target.classList.contains('remove-transform-mapping')) {
        e.target.closest('.transform-mapping-row').remove();
    }
    if (e.target.classList.contains('remove-validation-rule')) {
        e.target.closest('.validation-rule-row').remove();
    }
});

// Add change handler for validation rule type selector to show/hide value input
document.addEventListener('change', (e) => {
    if (e.target.classList.contains('validation-rule-type')) {
        const row = e.target.closest('.validation-rule-row');
        const valueInput = row.querySelector('.validation-rule-value');
        const ruleType = e.target.value;
        
        // Show value input only for certain rule types
        if (['type', 'regex', 'min', 'max'].includes(ruleType)) {
            valueInput.style.display = 'flex';
            // Set placeholder based on type
            if (ruleType === 'type') {
                valueInput.placeholder = 'string, number, of date';
            } else if (ruleType === 'regex') {
                valueInput.placeholder = 'Regex patroon';
            } else if (ruleType === 'min') {
                valueInput.placeholder = 'Minimum waarde/lengte';
            } else if (ruleType === 'max') {
                valueInput.placeholder = 'Maximum waarde/lengte';
            }
        } else {
            valueInput.style.display = 'none';
        }
    }
});

// ===== Validation Functionality =====

function openValidationModal(block) {
    selectedBlock = block;
    
    // Get input data from connected blocks
    const inputConnection = connections.find(c => c.to === block.id);
    if (!inputConnection || !dataStore[inputConnection.from]) {
        document.getElementById('validationInterface').innerHTML = '<p style="color: #e44;">Verbind eerst een Data Input, Mapping of Transform block met deze Validation block.</p>';
        document.getElementById('validationModal').style.display = 'block';
        return;
    }
    
    const inputData = dataStore[inputConnection.from];
    const inputHeaders = inputData.headers || [];
    
    // Load existing validations if any
    const existingValidations = block.validations || {};
    
    // Build validation interface
    let html = '<div style="display: flex; gap: 30px;">';
    
    // Available columns
    html += '<div style="flex: 1;">';
    html += '<h3 style="font-size: 14px; margin-bottom: 10px; font-weight: 600;">Kolommen</h3>';
    html += '<div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 10px; background: #f9f9f9; max-height: 400px; overflow-y: auto;">';
    inputHeaders.forEach(header => {
        const ruleCount = existingValidations[header] ? existingValidations[header].length : 0;
        const badge = ruleCount > 0 ? `<span style="background: #4a90e2; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; margin-left: 5px;">${ruleCount}</span>` : '';
        html += `<div style="padding: 8px; margin-bottom: 5px; background: white; border-radius: 3px; border: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center;">
            <span>${header}</span>${badge}
        </div>`;
    });
    html += '</div></div>';
    
    // Validation rules interface
    html += '<div style="flex: 2;">';
    html += '<h3 style="font-size: 14px; margin-bottom: 10px; font-weight: 600;">Validatie Regels</h3>';
    html += '<div id="validationRulesList" style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 15px; background: white; max-height: 400px; overflow-y: auto;">';
    
    html += '<p style="color: #666; font-size: 13px; margin-bottom: 15px;">Configureer validatie regels per kolom</p>';
    
    // Show existing validation rules
    const columns = Object.keys(existingValidations);
    if (columns.length > 0) {
        columns.forEach(column => {
            const rules = existingValidations[column];
            rules.forEach((rule, idx) => {
                html += createValidationRow(column, rule, inputHeaders, `${column}-${idx}`);
            });
        });
    } else {
        // Add one empty rule to start
        html += createValidationRow('', { type: 'required' }, inputHeaders, '0');
    }
    
    html += '<button id="addValidationRule" style="margin-top: 10px; padding: 8px 15px; background: #f0f0f0; border: 1px solid #e0e0e0; border-radius: 4px; cursor: pointer; font-size: 12px;">+ Voeg regel toe</button>';
    html += '</div></div></div>';
    
    document.getElementById('validationInterface').innerHTML = html;
    document.getElementById('validationModal').style.display = 'block';
    
    // Add event listener for adding new validation rules
    const addButton = document.getElementById('addValidationRule');
    if (addButton) {
        addButton.addEventListener('click', () => {
            const rulesList = document.getElementById('validationRulesList');
            const rowCount = rulesList.querySelectorAll('.validation-rule-row').length;
            const newRow = createValidationRow('', { type: 'required' }, inputHeaders, rowCount.toString());
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = newRow;
            addButton.parentNode.insertBefore(tempDiv.firstChild, addButton);
        });
    }
    
    // Apply validation button
    document.getElementById('applyValidation').onclick = () => {
        applyValidationConfig(block, inputHeaders);
    };
}

function createValidationRow(column, rule, inputHeaders, index) {
    const ruleType = rule.type || 'required';
    const ruleValue = rule.value || '';
    
    let html = '<div class="validation-rule-row" style="display: flex; gap: 10px; align-items: flex-start; margin-bottom: 10px; padding: 10px; background: #f9f9f9; border-radius: 4px; border-left: 3px solid #4a90e2;">';
    
    // Column selector
    html += `<select class="validation-column" style="flex: 1; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px; font-size: 13px;">`;
    html += '<option value="">-- Selecteer kolom --</option>';
    inputHeaders.forEach(header => {
        const selected = header === column ? 'selected' : '';
        html += `<option value="${header}" ${selected}>${header}</option>`;
    });
    html += '</select>';
    
    // Rule type selector
    html += `<select class="validation-rule-type" style="flex: 1; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px; font-size: 13px;">`;
    html += `<option value="required" ${ruleType === 'required' ? 'selected' : ''}>Required</option>`;
    html += `<option value="type" ${ruleType === 'type' ? 'selected' : ''}>Type Check</option>`;
    html += `<option value="regex" ${ruleType === 'regex' ? 'selected' : ''}>Regex Pattern</option>`;
    html += `<option value="min" ${ruleType === 'min' ? 'selected' : ''}>Min Value/Length</option>`;
    html += `<option value="max" ${ruleType === 'max' ? 'selected' : ''}>Max Value/Length</option>`;
    html += '</select>';
    
    // Rule value input (conditionally shown based on rule type)
    const needsValue = ['type', 'regex', 'min', 'max'].includes(ruleType);
    const valueDisplay = needsValue ? 'flex' : 'none';
    
    html += `<input type="text" class="validation-rule-value" value="${ruleValue}" placeholder="Waarde" style="flex: 1; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px; font-size: 13px; display: ${valueDisplay};" />`;
    
    // Remove button
    html += `<button class="remove-validation-rule" style="padding: 6px 10px; background: #fee; color: #e44; border: 1px solid #fcc; border-radius: 3px; cursor: pointer; font-size: 12px;">×</button>`;
    html += '</div>';
    
    return html;
}

function applyValidationConfig(block, inputHeaders) {
    // Collect validation rules from UI
    const validations = {};
    const rows = document.querySelectorAll('.validation-rule-row');
    
    rows.forEach(row => {
        const column = row.querySelector('.validation-column').value.trim();
        const ruleType = row.querySelector('.validation-rule-type').value;
        const ruleValue = row.querySelector('.validation-rule-value').value.trim();
        
        if (column) {
            if (!validations[column]) {
                validations[column] = [];
            }
            
            const rule = { type: ruleType };
            if (['type', 'regex', 'min', 'max'].includes(ruleType) && ruleValue) {
                rule.value = ruleValue;
            }
            
            validations[column].push(rule);
        }
    });
    
    // Store validations in block
    block.validations = validations;
    
    // Execute the validation
    const inputConnection = connections.find(c => c.to === block.id);
    if (inputConnection && dataStore[inputConnection.from]) {
        const validationResult = applyValidation(block, dataStore[inputConnection.from]);
        
        // Store validation result in dataStore
        dataStore[block.id] = validationResult;
        
        // Update block content with validation summary
        const { validCount, invalidCount } = validationResult.validation;
        if (invalidCount === 0) {
            updateBlockContent(block.id, `✓ Valid (${validCount} rijen)`);
        } else {
            block.content = `⚠ ${invalidCount} error(s), ${validCount} valid`;
            updateBlockContent(block.id, `⚠ ${invalidCount} error(s), ${validCount} valid`);
        }
        
        // Propagate data to connected blocks
        propagateData(block.id);
    }
    
    // Close modal
    document.getElementById('validationModal').style.display = 'none';
}

function applyValidation(block, inputData) {
    const validations = block.validations || {};
    const headers = inputData.headers || [];
    const rows = inputData.data || [];
    
    const rowErrors = [];
    let validCount = 0;
    let invalidCount = 0;
    
    // Validate each row
    rows.forEach((row, rowIndex) => {
        const errors = [];
        
        // Check each column that has validation rules
        Object.keys(validations).forEach(column => {
            const rules = validations[column];
            const value = row[column];
            
            rules.forEach(rule => {
                const error = validateValue(value, rule, column);
                if (error) {
                    errors.push(error);
                }
            });
        });
        
        if (errors.length > 0) {
            rowErrors.push({ rowIndex, errors });
            invalidCount++;
        } else {
            validCount++;
        }
    });
    
    return {
        data: rows,
        headers: headers,
        validation: {
            rowErrors,
            validCount,
            invalidCount
        }
    };
}

function validateValue(value, rule, column) {
    const { type, value: ruleValue } = rule;
    
    // Required check
    if (type === 'required') {
        if (value === null || value === undefined || value === '') {
            return { col: column, message: `${column} is required` };
        }
    }
    
    // Type check
    if (type === 'type' && ruleValue) {
        if (ruleValue === 'number') {
            if (isNaN(value) || value === '') {
                return { col: column, message: `${column} must be a number` };
            }
        } else if (ruleValue === 'string') {
            if (typeof value !== 'string') {
                return { col: column, message: `${column} must be a string` };
            }
        } else if (ruleValue === 'date') {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                return { col: column, message: `${column} must be a valid date` };
            }
        }
    }
    
    // Regex check
    if (type === 'regex' && ruleValue) {
        try {
            const regex = new RegExp(ruleValue);
            if (!regex.test(value)) {
                return { col: column, message: `${column} does not match pattern` };
            }
        } catch (e) {
            return { col: column, message: `Invalid regex pattern` };
        }
    }
    
    // Min check (for numbers and string length)
    if (type === 'min' && ruleValue) {
        const minVal = parseFloat(ruleValue);
        if (!isNaN(parseFloat(value))) {
            // Numeric comparison
            if (parseFloat(value) < minVal) {
                return { col: column, message: `${column} must be >= ${minVal}` };
            }
        } else if (typeof value === 'string') {
            // Length comparison
            if (value.length < minVal) {
                return { col: column, message: `${column} length must be >= ${minVal}` };
            }
        }
    }
    
    // Max check (for numbers and string length)
    if (type === 'max' && ruleValue) {
        const maxVal = parseFloat(ruleValue);
        if (!isNaN(parseFloat(value))) {
            // Numeric comparison
            if (parseFloat(value) > maxVal) {
                return { col: column, message: `${column} must be <= ${maxVal}` };
            }
        } else if (typeof value === 'string') {
            // Length comparison
            if (value.length > maxVal) {
                return { col: column, message: `${column} length must be <= ${maxVal}` };
            }
        }
    }
    
    return null; // No error
}

// ===== Value Mapper Functionality =====

function openValueMapperModal(block) {
    selectedBlock = block;
    
    // Get input data from connected blocks
    const inputConnection = connections.find(c => c.to === block.id);
    if (!inputConnection || !dataStore[inputConnection.from]) {
        document.getElementById('valueMapperInterface').innerHTML = '<p style="color: #e44;">Verbind eerst een Data Input of andere block met deze Value Mapper block.</p>';
        document.getElementById('valueMapperModal').style.display = 'block';
        return;
    }
    
    const inputData = dataStore[inputConnection.from];
    const inputHeaders = inputData.headers || [];
    const inputRows = inputData.data || [];
    
    if (inputHeaders.length === 0) {
        document.getElementById('valueMapperInterface').innerHTML = '<p style="color: #e44;">Geen kolommen gevonden in input data.</p>';
        document.getElementById('valueMapperModal').style.display = 'block';
        return;
    }
    
    // Load existing value mappings if any
    const existingValueMap = block.valueMap || {};
    
    // Build value mapper interface
    let html = '<div style="display: flex; gap: 30px;">';
    
    // Column selector
    html += '<div style="flex: 1;">';
    html += '<h3 style="font-size: 14px; margin-bottom: 10px; font-weight: 600;">Select Column</h3>';
    html += '<select id="valueMapperColumnSelect" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px; font-size: 13px;">';
    html += '<option value="">-- Selecteer kolom --</option>';
    inputHeaders.forEach(header => {
        html += `<option value="${header}">${header}</option>`;
    });
    html += '</select>';
    html += '</div>';
    
    // Value mappings interface
    html += '<div style="flex: 2;">';
    html += '<h3 style="font-size: 14px; margin-bottom: 10px; font-weight: 600;">Value Mappings</h3>';
    html += '<div id="valueMappingList" style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 10px; background: white; max-height: 300px; overflow-y: auto;">';
    html += '<p id="valueMappingPlaceholder" style="color: #999; font-size: 13px; text-align: center;">Selecteer een kolom om value mappings te configureren</p>';
    html += '</div>';
    html += '</div>';
    
    html += '</div>';
    
    // Preview section
    html += '<div style="margin-top: 20px; border-top: 1px solid #e0e0e0; padding-top: 20px;">';
    html += '<h3 style="font-size: 14px; margin-bottom: 10px; font-weight: 600;">Preview (First 5 Rows)</h3>';
    html += '<div id="valueMapperPreview" style="overflow-x: auto;"></div>';
    html += '</div>';
    
    document.getElementById('valueMapperInterface').innerHTML = html;
    document.getElementById('valueMapperModal').style.display = 'block';
    
    // Column selection handler
    const columnSelect = document.getElementById('valueMapperColumnSelect');
    columnSelect.addEventListener('change', (e) => {
        const selectedColumn = e.target.value;
        if (selectedColumn) {
            showValueMappingsForColumn(selectedColumn, existingValueMap, inputRows);
        } else {
            document.getElementById('valueMappingList').innerHTML = '<p id="valueMappingPlaceholder" style="color: #999; font-size: 13px; text-align: center;">Selecteer een kolom om value mappings te configureren</p>';
        }
        updateValueMapperPreview(inputRows, inputHeaders, existingValueMap);
    });
    
    // Apply button handler
    document.getElementById('applyValueMapper').onclick = () => {
        applyValueMapping(block);
    };
    
    // Show initial preview
    updateValueMapperPreview(inputRows.slice(0, 5), inputHeaders, existingValueMap);
}

function showValueMappingsForColumn(column, existingValueMap, inputRows) {
    const mappingList = document.getElementById('valueMappingList');
    const columnMappings = existingValueMap[column] || {};
    
    let html = '<div style="margin-bottom: 15px;">';
    html += '<div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px; font-weight: 600; font-size: 12px; color: #666;">';
    html += '<div style="flex: 1;">From Value</div>';
    html += '<div style="flex: 0 0 30px; text-align: center;">→</div>';
    html += '<div style="flex: 1;">To Value</div>';
    html += '<div style="flex: 0 0 40px;"></div>';
    html += '</div>';
    
    // Show existing mappings for this column
    if (Object.keys(columnMappings).length > 0) {
        Object.keys(columnMappings).forEach((fromValue) => {
            html += createValueMappingRow(column, fromValue, columnMappings[fromValue]);
        });
    } else {
        // Show one empty row
        html += createValueMappingRow(column, '', '');
    }
    
    html += '<button id="addValueMappingRow" style="margin-top: 10px; padding: 8px 15px; background: #f0f0f0; border: 1px solid #e0e0e0; border-radius: 4px; cursor: pointer; font-size: 12px;">+ Voeg mapping toe</button>';
    html += '</div>';
    
    mappingList.innerHTML = html;
    
    // Add row button handler
    document.getElementById('addValueMappingRow').addEventListener('click', () => {
        const newRow = createValueMappingRow(column, '', '');
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = newRow;
        document.getElementById('addValueMappingRow').parentNode.insertBefore(tempDiv.firstChild, document.getElementById('addValueMappingRow'));
        attachRemoveValueMappingListeners();
    });
    
    attachRemoveValueMappingListeners();
}

function createValueMappingRow(column, fromValue, toValue) {
    let html = '<div class="value-mapping-row" style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px;" data-column="' + column + '">';
    html += '<input type="text" class="value-mapping-from" value="' + fromValue + '" placeholder="From value" style="flex: 1; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px; font-size: 13px;" />';
    html += '<div style="flex: 0 0 30px; text-align: center; color: #666;">→</div>';
    html += '<input type="text" class="value-mapping-to" value="' + toValue + '" placeholder="To value" style="flex: 1; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px; font-size: 13px;" />';
    html += '<button class="remove-value-mapping" style="flex: 0 0 40px; padding: 6px 10px; background: #fee; color: #e44; border: 1px solid #fcc; border-radius: 3px; cursor: pointer; font-size: 12px;">×</button>';
    html += '</div>';
    return html;
}

function attachRemoveValueMappingListeners() {
    document.querySelectorAll('.remove-value-mapping').forEach(btn => {
        btn.onclick = function() {
            this.closest('.value-mapping-row').remove();
        };
    });
}

function updateValueMapperPreview(rows, headers, valueMap) {
    const previewDiv = document.getElementById('valueMapperPreview');
    const previewRows = rows.slice(0, 5);
    
    if (previewRows.length === 0) {
        previewDiv.innerHTML = '<p style="color: #999;">Geen data beschikbaar voor preview</p>';
        return;
    }
    
    let html = '<table style="width: 100%; border-collapse: collapse; font-size: 12px;">';
    html += '<thead><tr>';
    headers.forEach(header => {
        html += `<th style="padding: 8px; text-align: left; border-bottom: 2px solid #e0e0e0; background: #f9f9f9;">${header}</th>`;
    });
    html += '</tr></thead>';
    html += '<tbody>';
    
    previewRows.forEach(row => {
        html += '<tr>';
        headers.forEach(header => {
            let value = row[header] || '';
            // Apply value mapping if exists
            if (valueMap[header] && valueMap[header][value]) {
                value = valueMap[header][value];
            }
            html += `<td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">${value}</td>`;
        });
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    previewDiv.innerHTML = html;
}

function applyValueMapping(block) {
    // Collect all value mappings from the UI
    const valueMap = {};
    const columnSelect = document.getElementById('valueMapperColumnSelect');
    const selectedColumn = columnSelect.value;
    
    if (selectedColumn) {
        const rows = document.querySelectorAll('.value-mapping-row');
        const columnMappings = {};
        
        rows.forEach(row => {
            const fromValue = row.querySelector('.value-mapping-from').value.trim();
            const toValue = row.querySelector('.value-mapping-to').value.trim();
            
            if (fromValue) {
                columnMappings[fromValue] = toValue;
            }
        });
        
        if (Object.keys(columnMappings).length > 0) {
            valueMap[selectedColumn] = columnMappings;
        }
    }
    
    // Merge with existing mappings for other columns
    const existingValueMap = block.valueMap || {};
    Object.keys(existingValueMap).forEach(col => {
        if (col !== selectedColumn) {
            valueMap[col] = existingValueMap[col];
        }
    });
    
    // Store value map in block
    block.valueMap = valueMap;
    
    // Execute the value mapping
    const inputConnection = connections.find(c => c.to === block.id);
    if (inputConnection && dataStore[inputConnection.from]) {
        const inputData = dataStore[inputConnection.from];
        const mappedData = applyValueMappingTransformation(inputData, valueMap);
        
        // Store mapped data
        dataStore[block.id] = mappedData;
        
        // Update block content
        const totalMappings = Object.keys(valueMap).reduce((sum, col) => {
            return sum + Object.keys(valueMap[col]).length;
        }, 0);
        const columnCount = Object.keys(valueMap).length;
        updateBlockContent(block.id, `${totalMappings} mapping(s) op ${columnCount} kolom(men)`);
        
        // Propagate data to connected blocks
        propagateData(block.id);
    }
    
    // Close modal
    document.getElementById('valueMapperModal').style.display = 'none';
}

function applyValueMappingTransformation(inputData, valueMap) {
    const inputRows = inputData.data || [];
    const inputHeaders = inputData.headers || [];
    
    // Create shallow clone of rows with value replacements
    const outputRows = inputRows.map(row => {
        const newRow = { ...row };
        
        // Apply value mappings for each column
        Object.keys(valueMap).forEach(column => {
            const columnMappings = valueMap[column];
            const originalValue = newRow[column];
            
            // Replace value if mapping exists (exact match)
            if (originalValue !== undefined && columnMappings[originalValue] !== undefined) {
                newRow[column] = columnMappings[originalValue];
            }
        });
        
        return newRow;
    });
    
    // Count applied mappings for metadata
    let appliedMappings = 0;
    Object.keys(valueMap).forEach(column => {
        appliedMappings += Object.keys(valueMap[column]).length;
    });
    
    return {
        data: outputRows,
        headers: inputHeaders,
        valueMapping: {
            mappings: valueMap,
            appliedCount: appliedMappings
        }
    };
}

// ===== Flow Save/Load Functionality =====

// Initialize save/load handlers
document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('saveFlowBtn');
    const loadBtn = document.getElementById('loadFlowBtn');
    const loadInput = document.getElementById('loadFlowInput');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', saveFlow);
    }
    
    if (loadBtn) {
        loadBtn.addEventListener('click', () => {
            loadInput.click();
        });
    }
    
    if (loadInput) {
        loadInput.addEventListener('change', loadFlow);
    }
});

// Save current flow to JSON file
function saveFlow() {
    const flowData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        blocks: blocks.map(block => ({
            id: block.id,
            type: block.type,
            x: block.x,
            y: block.y,
            data: block.data,
            // Include all block-specific properties
            mappings: block.mappings,
            autoMappings: block.autoMappings,
            transformations: block.transformations,
            validations: block.validations,
            valueMap: block.valueMap,
            content: block.content,
            fromAutomapper: block.fromAutomapper
        })),
        connections: connections.map(conn => ({
            from: conn.from,
            to: conn.to
        })),
        dataStore: dataStore,
        blockCounter: blockCounter
    };
    
    const json = JSON.stringify(flowData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `etl-flow-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Flow saved successfully');
}

// Load flow from JSON file
function loadFlow(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const flowData = JSON.parse(e.target.result);
            
            // Validate flow data structure
            if (!flowData.blocks || !flowData.connections) {
                alert('Ongeldig flow bestand');
                return;
            }
            
            // Clear current canvas
            clearCanvas();
            
            // Restore global state
            blocks = flowData.blocks || [];
            connections = flowData.connections || [];
            dataStore = flowData.dataStore || {};
            blockCounter = flowData.blockCounter || blocks.length;
            
            // Render all blocks
            blocks.forEach(block => {
                renderBlock(block);
                
                // Update block content if data exists
                if (dataStore[block.id]) {
                    let content = '';
                    const blockData = dataStore[block.id];
                    
                    if (blockData.headers && blockData.data) {
                        content = `Data geladen (${blockData.data.length} rijen)`;
                    } else if (blockData.isTemplate && blockData.fileName) {
                        content = `${blockData.fileName} (${blockData.data.length} rijen)`;
                    } else if (Array.isArray(blockData)) {
                        content = `Data beschikbaar (${blockData.length} rijen)`;
                    }
                    
                    if (content) {
                        updateBlockContent(block.id, content);
                    }
                }
            });
            
            // Render all connections
            renderConnections();
            
            // Propagate data from blocks that have data to their connected blocks
            // This ensures data flows through the entire pipeline after loading
            blocks.forEach(block => {
                if (dataStore[block.id]) {
                    propagateData(block.id);
                }
            });
            
            // Hide hint if there are blocks
            if (blocks.length > 0) {
                const hint = document.querySelector('.hint');
                if (hint) hint.style.display = 'none';
            }
            
            console.log('Flow loaded successfully');
        } catch (error) {
            console.error('Error loading flow:', error);
            alert('Fout bij het laden van flow: ' + error.message);
        }
    };
    
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

// Clear canvas and reset state
function clearCanvas() {
    // Remove all blocks from DOM
    const canvas = document.getElementById('canvas');
    const blockElements = canvas.querySelectorAll('.block');
    blockElements.forEach(el => el.remove());
    
    // Remove connections SVG
    const svg = document.getElementById('connections-svg');
    if (svg) svg.remove();
    
    // Reset arrays
    blocks = [];
    connections = [];
    dataStore = {};
    
    // Show hint again
    const hint = document.querySelector('.hint');
    if (hint) hint.style.display = 'block';
}

// ============================================================================
// NEW TRANSFORMATION BLOCK IMPLEMENTATIONS
// ============================================================================

/**
 * Opens Concatenate block modal
 */
function openConcatenateModal(block) {
    selectedBlock = block;
    
    const inputConnection = connections.find(c => c.to === block.id);
    if (!inputConnection || !dataStore[inputConnection.from]) {
        document.getElementById('concatenateInterface').innerHTML = 
            '<p style="color: #e44;">Verbind eerst een Data Input block.</p>';
        showModal('concatenateModal');
        return;
    }
    
    const inputData = dataStore[inputConnection.from];
    const inputHeaders = inputData.headers || [];
    
    // Load existing configuration
    const config = block.config || { 
        outputColumn: '', 
        inputs: [], 
        separator: ' ' 
    };
    
    let html = '<div style="margin-bottom: 15px;">';
    html += '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Output Kolom Naam:</label>';
    html += `<input type="text" id="concatOutputCol" value="${config.outputColumn}" placeholder="bijv. FullName" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px;" />`;
    html += '</div>';
    
    html += '<div style="margin-bottom: 15px;">';
    html += '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Selecteer Kolommen om Samen te Voegen:</label>';
    html += '<div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 10px; background: white;">';
    inputHeaders.forEach(header => {
        const checked = config.inputs.includes(header) ? 'checked' : '';
        html += `<label style="display: block; padding: 5px; cursor: pointer;">`;
        html += `<input type="checkbox" class="concat-input-col" value="${header}" ${checked} style="margin-right: 5px;" />`;
        html += `${header}</label>`;
    });
    html += '</div></div>';
    
    html += '<div style="margin-bottom: 15px;">';
    html += '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Scheidingsteken:</label>';
    html += `<input type="text" id="concatSeparator" value="${config.separator}" placeholder="bijv. ' ', '-', ', '" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px;" />`;
    html += '</div>';
    
    document.getElementById('concatenateInterface').innerHTML = html;
    showModal('concatenateModal');
    
    document.getElementById('applyConcatenate').onclick = () => {
        applyConcatenate(block, inputData);
    };
}

function applyConcatenate(block, inputData) {
    const outputColumn = document.getElementById('concatOutputCol').value.trim();
    const separator = document.getElementById('concatSeparator').value;
    const selectedInputs = Array.from(document.querySelectorAll('.concat-input-col:checked'))
        .map(cb => cb.value);
    
    if (!outputColumn || selectedInputs.length === 0) {
        alert('Vul een output kolom naam in en selecteer minstens één input kolom.');
        return;
    }
    
    // Store configuration
    block.config = { outputColumn, inputs: selectedInputs, separator };
    
    // Transform data
    const transformation = {
        [outputColumn]: {
            op: 'concatenate',
            inputs: selectedInputs,
            params: { separator }
        }
    };
    
    const transformedData = applyAdvancedTransformationLogic(inputData, transformation, true);
    dataStore[block.id] = transformedData;
    
    updateBlockContent(block.id, `${outputColumn} aangemaakt`);
    propagateData(block.id);
    hideModal('concatenateModal');
}

/**
 * Opens Split block modal
 */
function openSplitModal(block) {
    selectedBlock = block;
    
    const inputConnection = connections.find(c => c.to === block.id);
    if (!inputConnection || !dataStore[inputConnection.from]) {
        document.getElementById('splitInterface').innerHTML = 
            '<p style="color: #e44;">Verbind eerst een Data Input block.</p>';
        showModal('splitModal');
        return;
    }
    
    const inputData = dataStore[inputConnection.from];
    const inputHeaders = inputData.headers || [];
    
    const config = block.config || { 
        outputColumnPrefix: '', 
        inputColumn: '', 
        delimiter: ',' 
    };
    
    let html = '<div style="margin-bottom: 15px;">';
    html += '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Output Kolom Prefix:</label>';
    html += `<input type="text" id="splitOutputCol" value="${escapeHtml(config.outputColumnPrefix)}" placeholder="bijv. Part" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px;" />`;
    html += '<p style="font-size: 12px; color: #666; margin-top: 5px;">De gesplitste kolommen krijgen namen: [Prefix]_1, [Prefix]_2, etc.</p>';
    html += '</div>';
    
    html += '<div style="margin-bottom: 15px;">';
    html += '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Input Kolom:</label>';
    html += `<select id="splitInputCol" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px;">`;
    html += '<option value="">-- Selecteer kolom --</option>';
    inputHeaders.forEach(header => {
        const selected = config.inputColumn === header ? 'selected' : '';
        html += `<option value="${escapeHtml(header)}" ${selected}>${escapeHtml(header)}</option>`;
    });
    html += '</select></div>';
    
    html += '<div style="margin-bottom: 15px;">';
    html += '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Scheidingsteken:</label>';
    html += `<select id="splitDelimiter" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px;">`;
    html += `<option value="," ${config.delimiter === ',' ? 'selected' : ''}>Comma ','</option>`;
    html += `<option value=" " ${config.delimiter === ' ' ? 'selected' : ''}>Space ' '</option>`;
    html += `<option value=";" ${config.delimiter === ';' ? 'selected' : ''}>Semicolon ';'</option>`;
    html += `<option value="\t" ${config.delimiter === '\t' ? 'selected' : ''}>Tab '\\t'</option>`;
    html += `<option value="@" ${config.delimiter === '@' ? 'selected' : ''}>At '@'</option>`;
    html += `<option value="|" ${config.delimiter === '|' ? 'selected' : ''}>Pipe '|'</option>`;
    html += `<option value="-" ${config.delimiter === '-' ? 'selected' : ''}>Dash '-'</option>`;
    html += `<option value="_" ${config.delimiter === '_' ? 'selected' : ''}>Underscore '_'</option>`;
    html += `<option value=":" ${config.delimiter === ':' ? 'selected' : ''}>Colon ':'</option>`;
    html += `<option value="custom">Custom...</option>`;
    html += '</select>';
    html += `<input type="text" id="splitCustomDelimiter" value="" placeholder="Voer custom scheidingsteken in" style="width: 100%; padding: 8px; margin-top: 8px; border: 1px solid #e0e0e0; border-radius: 4px; display: ${config.delimiter && ![',', ' ', ';', '\t', '@', '|', '-', '_', ':'].includes(config.delimiter) ? 'block' : 'none'};" />`;
    html += '</div>';
    
    document.getElementById('splitInterface').innerHTML = html;
    showModal('splitModal');
    
    // Setup event listener for custom delimiter
    const delimiterSelect = document.getElementById('splitDelimiter');
    const customDelimiterInput = document.getElementById('splitCustomDelimiter');
    
    delimiterSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            customDelimiterInput.style.display = 'block';
            customDelimiterInput.focus();
        } else {
            customDelimiterInput.style.display = 'none';
        }
    });
    
    // Set initial custom delimiter value if applicable
    if (config.delimiter && ![',', ' ', ';', '\t', '@', '|', '-', '_', ':'].includes(config.delimiter)) {
        delimiterSelect.value = 'custom';
        customDelimiterInput.value = config.delimiter;
        customDelimiterInput.style.display = 'block';
    }
    
    document.getElementById('applySplit').onclick = () => {
        applySplit(block, inputData);
    };
}

function applySplit(block, inputData) {
    const outputColumnPrefix = document.getElementById('splitOutputCol').value.trim();
    const inputColumn = document.getElementById('splitInputCol').value;
    let delimiter = document.getElementById('splitDelimiter').value;
    
    // Handle custom delimiter
    if (delimiter === 'custom') {
        const customDelimiter = document.getElementById('splitCustomDelimiter').value;
        if (!customDelimiter) {
            alert('Vul een custom scheidingsteken in.');
            return;
        }
        delimiter = customDelimiter;
    }
    
    if (!outputColumnPrefix || !inputColumn) {
        alert('Vul alle velden in.');
        return;
    }
    
    block.config = { outputColumnPrefix, inputColumn, delimiter };
    
    // First, determine the maximum number of parts we'll get from splitting
    let maxParts = 0;
    inputData.data.forEach(row => {
        const value = row[inputColumn] || '';
        const parts = value.split(delimiter);
        maxParts = Math.max(maxParts, parts.length);
    });
    
    // Create transformation for each part
    const transformation = {};
    for (let i = 0; i < maxParts; i++) {
        const columnName = `${outputColumnPrefix}_${i + 1}`;
        transformation[columnName] = {
            op: 'split',
            inputs: [inputColumn],
            params: { delimiter, index: i }
        };
    }
    
    const transformedData = applyAdvancedTransformationLogic(inputData, transformation, true);
    dataStore[block.id] = transformedData;
    
    updateBlockContent(block.id, `${maxParts} kolommen aangemaakt (${outputColumnPrefix}_1 t/m ${outputColumnPrefix}_${maxParts})`);
    propagateData(block.id);
    hideModal('splitModal');
}

/**
 * Opens Case Change block modal
 */
function openCaseChangeModal(block) {
    selectedBlock = block;
    
    const inputConnection = connections.find(c => c.to === block.id);
    if (!inputConnection || !dataStore[inputConnection.from]) {
        document.getElementById('caseChangeInterface').innerHTML = 
            '<p style="color: #e44;">Verbind eerst een Data Input block.</p>';
        showModal('caseChangeModal');
        return;
    }
    
    const inputData = dataStore[inputConnection.from];
    const inputHeaders = inputData.headers || [];
    
    const config = block.config || { 
        outputColumn: '', 
        inputColumn: '', 
        caseType: 'upper' 
    };
    
    let html = '<div style="margin-bottom: 15px;">';
    html += '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Output Kolom Naam:</label>';
    html += `<input type="text" id="caseOutputCol" value="${config.outputColumn}" placeholder="bijv. UpperDept" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px;" />`;
    html += '</div>';
    
    html += '<div style="margin-bottom: 15px;">';
    html += '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Input Kolom:</label>';
    html += `<select id="caseInputCol" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px;">`;
    html += '<option value="">-- Selecteer kolom --</option>';
    inputHeaders.forEach(header => {
        const selected = config.inputColumn === header ? 'selected' : '';
        html += `<option value="${header}" ${selected}>${header}</option>`;
    });
    html += '</select></div>';
    
    html += '<div style="margin-bottom: 15px;">';
    html += '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Case Type:</label>';
    html += `<select id="caseType" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px;">`;
    html += `<option value="upper" ${config.caseType === 'upper' ? 'selected' : ''}>UPPERCASE</option>`;
    html += `<option value="lower" ${config.caseType === 'lower' ? 'selected' : ''}>lowercase</option>`;
    html += `<option value="capitalize" ${config.caseType === 'capitalize' ? 'selected' : ''}>Capitalize</option>`;
    html += '</select></div>';
    
    document.getElementById('caseChangeInterface').innerHTML = html;
    showModal('caseChangeModal');
    
    document.getElementById('applyCaseChange').onclick = () => {
        applyCaseChange(block, inputData);
    };
}

function applyCaseChange(block, inputData) {
    const outputColumn = document.getElementById('caseOutputCol').value.trim();
    const inputColumn = document.getElementById('caseInputCol').value;
    const caseType = document.getElementById('caseType').value;
    
    if (!outputColumn || !inputColumn) {
        alert('Vul alle velden in.');
        return;
    }
    
    block.config = { outputColumn, inputColumn, caseType };
    
    const transformation = {
        [outputColumn]: {
            op: 'case',
            inputs: [inputColumn],
            params: { type: caseType }
        }
    };
    
    const transformedData = applyAdvancedTransformationLogic(inputData, transformation, true);
    dataStore[block.id] = transformedData;
    
    updateBlockContent(block.id, `${outputColumn} aangemaakt`);
    propagateData(block.id);
    hideModal('caseChangeModal');
}

/**
 * Opens Math block modal
 */
function openMathModal(block) {
    selectedBlock = block;
    
    const inputConnection = connections.find(c => c.to === block.id);
    if (!inputConnection || !dataStore[inputConnection.from]) {
        document.getElementById('mathInterface').innerHTML = 
            '<p style="color: #e44;">Verbind eerst een Data Input block.</p>';
        showModal('mathModal');
        return;
    }
    
    const inputData = dataStore[inputConnection.from];
    const inputHeaders = inputData.headers || [];
    
    const config = block.config || { 
        outputColumn: '', 
        inputs: [], 
        mathOp: 'add', 
        round: 'none' 
    };
    
    let html = '<div style="margin-bottom: 15px;">';
    html += '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Output Kolom Naam:</label>';
    html += `<input type="text" id="mathOutputCol" value="${config.outputColumn}" placeholder="bijv. Total" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px;" />`;
    html += '</div>';
    
    html += '<div style="margin-bottom: 15px;">';
    html += '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Selecteer Numerieke Kolommen:</label>';
    html += '<div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 10px; background: white;">';
    inputHeaders.forEach(header => {
        const checked = config.inputs.includes(header) ? 'checked' : '';
        html += `<label style="display: block; padding: 5px; cursor: pointer;">`;
        html += `<input type="checkbox" class="math-input-col" value="${header}" ${checked} style="margin-right: 5px;" />`;
        html += `${header}</label>`;
    });
    html += '</div></div>';
    
    html += '<div style="margin-bottom: 15px;">';
    html += '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Bewerking:</label>';
    html += `<select id="mathOp" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px;">`;
    html += `<option value="add" ${config.mathOp === 'add' ? 'selected' : ''}>Add (+)</option>`;
    html += `<option value="subtract" ${config.mathOp === 'subtract' ? 'selected' : ''}>Subtract (-)</option>`;
    html += `<option value="multiply" ${config.mathOp === 'multiply' ? 'selected' : ''}>Multiply (*)</option>`;
    html += `<option value="divide" ${config.mathOp === 'divide' ? 'selected' : ''}>Divide (/)</option>`;
    html += '</select></div>';
    
    html += '<div style="margin-bottom: 15px;">';
    html += '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Afronden:</label>';
    html += `<select id="mathRound" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px;">`;
    html += `<option value="none" ${config.round === 'none' ? 'selected' : ''}>Geen afronden</option>`;
    html += `<option value="0" ${config.round === '0' ? 'selected' : ''}>0 decimalen</option>`;
    html += `<option value="2" ${config.round === '2' ? 'selected' : ''}>2 decimalen</option>`;
    html += `<option value="4" ${config.round === '4' ? 'selected' : ''}>4 decimalen</option>`;
    html += '</select></div>';
    
    document.getElementById('mathInterface').innerHTML = html;
    showModal('mathModal');
    
    document.getElementById('applyMath').onclick = () => {
        applyMath(block, inputData);
    };
}

function applyMath(block, inputData) {
    const outputColumn = document.getElementById('mathOutputCol').value.trim();
    const mathOp = document.getElementById('mathOp').value;
    const round = document.getElementById('mathRound').value;
    const selectedInputs = Array.from(document.querySelectorAll('.math-input-col:checked'))
        .map(cb => cb.value);
    
    if (!outputColumn || selectedInputs.length < 2) {
        alert('Vul een output kolom naam in en selecteer minstens twee input kolommen.');
        return;
    }
    
    block.config = { outputColumn, inputs: selectedInputs, mathOp, round };
    
    const transformation = {
        [outputColumn]: {
            op: 'math',
            inputs: selectedInputs,
            params: { mathOp, round }
        }
    };
    
    const transformedData = applyAdvancedTransformationLogic(inputData, transformation, true);
    dataStore[block.id] = transformedData;
    
    updateBlockContent(block.id, `${outputColumn} aangemaakt`);
    propagateData(block.id);
    hideModal('mathModal');
}

/**
 * Opens Regex Replace block modal
 */
function openRegexReplaceModal(block) {
    selectedBlock = block;
    
    const inputConnection = connections.find(c => c.to === block.id);
    if (!inputConnection || !dataStore[inputConnection.from]) {
        document.getElementById('regexReplaceInterface').innerHTML = 
            '<p style="color: #e44;">Verbind eerst een Data Input block.</p>';
        showModal('regexReplaceModal');
        return;
    }
    
    const inputData = dataStore[inputConnection.from];
    const inputHeaders = inputData.headers || [];
    
    const config = block.config || { 
        outputColumn: '', 
        inputColumn: '', 
        pattern: '', 
        replacement: '' 
    };
    
    let html = '<div style="margin-bottom: 15px;">';
    html += '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Output Kolom Naam:</label>';
    html += `<input type="text" id="regexOutputCol" value="${config.outputColumn}" placeholder="bijv. Cleaned" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px;" />`;
    html += '</div>';
    
    html += '<div style="margin-bottom: 15px;">';
    html += '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Input Kolom:</label>';
    html += `<select id="regexInputCol" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px;">`;
    html += '<option value="">-- Selecteer kolom --</option>';
    inputHeaders.forEach(header => {
        const selected = config.inputColumn === header ? 'selected' : '';
        html += `<option value="${header}" ${selected}>${header}</option>`;
    });
    html += '</select></div>';
    
    html += '<div style="margin-bottom: 15px;">';
    html += '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Regex Patroon:</label>';
    html += `<input type="text" id="regexPattern" value="${config.pattern}" placeholder="bijv. [0-9]+" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px;" />`;
    html += '<p style="font-size: 12px; color: #666; margin-top: 5px;">Gebruik reguliere expressie syntax</p>';
    html += '</div>';
    
    html += '<div style="margin-bottom: 15px;">';
    html += '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Vervanging:</label>';
    html += `<input type="text" id="regexReplacement" value="${config.replacement}" placeholder="bijv. '', 'X', etc." style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px;" />`;
    html += '</div>';
    
    document.getElementById('regexReplaceInterface').innerHTML = html;
    showModal('regexReplaceModal');
    
    document.getElementById('applyRegexReplace').onclick = () => {
        applyRegexReplace(block, inputData);
    };
}

function applyRegexReplace(block, inputData) {
    const outputColumn = document.getElementById('regexOutputCol').value.trim();
    const inputColumn = document.getElementById('regexInputCol').value;
    const pattern = document.getElementById('regexPattern').value;
    const replacement = document.getElementById('regexReplacement').value;
    
    if (!outputColumn || !inputColumn || !pattern) {
        alert('Vul alle velden in.');
        return;
    }
    
    block.config = { outputColumn, inputColumn, pattern, replacement };
    
    const transformation = {
        [outputColumn]: {
            op: 'regex',
            inputs: [inputColumn],
            params: { pattern, replacement }
        }
    };
    
    const transformedData = applyAdvancedTransformationLogic(inputData, transformation, true);
    dataStore[block.id] = transformedData;
    
    updateBlockContent(block.id, `${outputColumn} aangemaakt`);
    propagateData(block.id);
    hideModal('regexReplaceModal');
}

/**
 * Opens Date Format block modal
 */
function openDateFormatModal(block) {
    selectedBlock = block;
    
    const inputConnection = connections.find(c => c.to === block.id);
    if (!inputConnection || !dataStore[inputConnection.from]) {
        document.getElementById('dateFormatInterface').innerHTML = 
            '<p style="color: #e44;">Verbind eerst een Data Input block.</p>';
        showModal('dateFormatModal');
        return;
    }
    
    const inputData = dataStore[inputConnection.from];
    const inputHeaders = inputData.headers || [];
    
    const config = block.config || { 
        outputColumn: '', 
        inputColumn: '', 
        inputFormat: 'ISO', 
        outputFormat: 'YYYY-MM-DD' 
    };
    
    let html = '<div style="margin-bottom: 15px;">';
    html += '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Output Kolom Naam:</label>';
    html += `<input type="text" id="dateOutputCol" value="${config.outputColumn}" placeholder="bijv. FormattedDate" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px;" />`;
    html += '</div>';
    
    html += '<div style="margin-bottom: 15px;">';
    html += '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Input Kolom:</label>';
    html += `<select id="dateInputCol" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px;">`;
    html += '<option value="">-- Selecteer kolom --</option>';
    inputHeaders.forEach(header => {
        const selected = config.inputColumn === header ? 'selected' : '';
        html += `<option value="${header}" ${selected}>${header}</option>`;
    });
    html += '</select></div>';
    
    html += '<div style="margin-bottom: 15px;">';
    html += '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Input Formaat:</label>';
    html += `<input type="text" id="dateInputFormat" value="${config.inputFormat}" placeholder="ISO, locale, etc." style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px;" />`;
    html += '</div>';
    
    html += '<div style="margin-bottom: 15px;">';
    html += '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Output Formaat:</label>';
    html += `<input type="text" id="dateOutputFormat" value="${config.outputFormat}" placeholder="YYYY-MM-DD, DD/MM/YYYY, etc." style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px;" />`;
    html += '</div>';
    
    document.getElementById('dateFormatInterface').innerHTML = html;
    showModal('dateFormatModal');
    
    document.getElementById('applyDateFormat').onclick = () => {
        applyDateFormat(block, inputData);
    };
}

function applyDateFormat(block, inputData) {
    const outputColumn = document.getElementById('dateOutputCol').value.trim();
    const inputColumn = document.getElementById('dateInputCol').value;
    const inputFormat = document.getElementById('dateInputFormat').value;
    const outputFormat = document.getElementById('dateOutputFormat').value;
    
    if (!outputColumn || !inputColumn) {
        alert('Vul alle velden in.');
        return;
    }
    
    block.config = { outputColumn, inputColumn, inputFormat, outputFormat };
    
    const transformation = {
        [outputColumn]: {
            op: 'date',
            inputs: [inputColumn],
            params: { inputFormat, outputFormat }
        }
    };
    
    const transformedData = applyAdvancedTransformationLogic(inputData, transformation, true);
    dataStore[block.id] = transformedData;
    
    updateBlockContent(block.id, `${outputColumn} aangemaakt`);
    propagateData(block.id);
    hideModal('dateFormatModal');
}

/**
 * Opens Expression block modal
 */
function openExpressionModal(block) {
    selectedBlock = block;
    
    const inputConnection = connections.find(c => c.to === block.id);
    if (!inputConnection || !dataStore[inputConnection.from]) {
        document.getElementById('expressionInterface').innerHTML = 
            '<p style="color: #e44;">Verbind eerst een Data Input block.</p>';
        showModal('expressionModal');
        return;
    }
    
    const inputData = dataStore[inputConnection.from];
    const inputHeaders = inputData.headers || [];
    
    const config = block.config || { 
        outputColumn: '', 
        expression: '' 
    };
    
    let html = '<div style="margin-bottom: 15px;">';
    html += '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Output Kolom Naam:</label>';
    html += `<input type="text" id="exprOutputCol" value="${config.outputColumn}" placeholder="bijv. Computed" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px;" />`;
    html += '</div>';
    
    html += '<div style="margin-bottom: 15px;">';
    html += '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Expressie:</label>';
    html += `<input type="text" id="exprExpression" value="${config.expression}" placeholder="bijv. \${FirstName}-\${LastName}" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px;" />`;
    html += '<p style="font-size: 12px; color: #666; margin-top: 5px;">Gebruik \${kolomNaam} om kolom waarden te refereren</p>';
    html += '</div>';
    
    html += '<div style="margin-bottom: 15px;">';
    html += '<p style="font-weight: 600; margin-bottom: 5px;">Beschikbare Kolommen:</p>';
    html += '<div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 10px; background: #f9f9f9;">';
    inputHeaders.forEach(header => {
        html += `<span style="display: inline-block; padding: 3px 8px; margin: 2px; background: white; border: 1px solid #e0e0e0; border-radius: 3px; font-size: 12px;">${header}</span>`;
    });
    html += '</div></div>';
    
    document.getElementById('expressionInterface').innerHTML = html;
    showModal('expressionModal');
    
    document.getElementById('applyExpression').onclick = () => {
        applyExpression(block, inputData);
    };
}

function applyExpression(block, inputData) {
    const outputColumn = document.getElementById('exprOutputCol').value.trim();
    const expression = document.getElementById('exprExpression').value;
    
    if (!outputColumn || !expression) {
        alert('Vul alle velden in.');
        return;
    }
    
    block.config = { outputColumn, expression };
    
    const transformation = {
        [outputColumn]: {
            op: 'expression',
            inputs: [],
            params: { expression }
        }
    };
    
    const transformedData = applyAdvancedTransformationLogic(inputData, transformation, true);
    dataStore[block.id] = transformedData;
    
    updateBlockContent(block.id, `${outputColumn} aangemaakt`);
    propagateData(block.id);
    hideModal('expressionModal');
}

/**
 * Opens Copy/Rename block modal
 */
function openCopyRenameModal(block) {
    selectedBlock = block;
    
    const inputConnection = connections.find(c => c.to === block.id);
    if (!inputConnection || !dataStore[inputConnection.from]) {
        document.getElementById('copyRenameInterface').innerHTML = 
            '<p style="color: #e44;">Verbind eerst een Data Input block.</p>';
        showModal('copyRenameModal');
        return;
    }
    
    const inputData = dataStore[inputConnection.from];
    const inputHeaders = inputData.headers || [];
    
    const config = block.config || { 
        outputColumn: '', 
        inputColumn: '' 
    };
    
    let html = '<div style="margin-bottom: 15px;">';
    html += '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Output Kolom Naam:</label>';
    html += `<input type="text" id="copyOutputCol" value="${config.outputColumn}" placeholder="bijv. Material" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px;" />`;
    html += '</div>';
    
    html += '<div style="margin-bottom: 15px;">';
    html += '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Input Kolom:</label>';
    html += `<select id="copyInputCol" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px;">`;
    html += '<option value="">-- Selecteer kolom --</option>';
    inputHeaders.forEach(header => {
        const selected = config.inputColumn === header ? 'selected' : '';
        html += `<option value="${header}" ${selected}>${header}</option>`;
    });
    html += '</select></div>';
    
    document.getElementById('copyRenameInterface').innerHTML = html;
    showModal('copyRenameModal');
    
    document.getElementById('applyCopyRename').onclick = () => {
        applyCopyRename(block, inputData);
    };
}

function applyCopyRename(block, inputData) {
    const outputColumn = document.getElementById('copyOutputCol').value.trim();
    const inputColumn = document.getElementById('copyInputCol').value;
    
    if (!outputColumn || !inputColumn) {
        alert('Vul alle velden in.');
        return;
    }
    
    block.config = { outputColumn, inputColumn };
    
    const transformation = {
        [outputColumn]: {
            op: 'copy',
            inputs: [inputColumn],
            params: {}
        }
    };
    
    const transformedData = applyAdvancedTransformationLogic(inputData, transformation, true);
    dataStore[block.id] = transformedData;
    
    updateBlockContent(block.id, `${outputColumn} aangemaakt`);
    propagateData(block.id);
    hideModal('copyRenameModal');
}

/**
 * Opens Join block modal
 * Join block requires TWO input connections from different sources
 */
function openJoinModal(block) {
    selectedBlock = block;
    
    // Get all input connections to this block
    const inputConnections = connections.filter(c => c.to === block.id);
    
    if (inputConnections.length < 2) {
        document.getElementById('joinInterface').innerHTML = 
            '<p style="color: #e44;">Verbind eerst TWEE data bronnen met deze Join block.</p>';
        showModal('joinModal');
        return;
    }
    
    // Get data from both inputs
    const leftInput = dataStore[inputConnections[0].from];
    const rightInput = dataStore[inputConnections[1].from];
    
    if (!leftInput || !rightInput) {
        document.getElementById('joinInterface').innerHTML = 
            '<p style="color: #e44;">Beide input blocks moeten data bevatten.</p>';
        showModal('joinModal');
        return;
    }
    
    const leftHeaders = leftInput.headers || [];
    const rightHeaders = rightInput.headers || [];
    
    if (leftHeaders.length === 0 || rightHeaders.length === 0) {
        document.getElementById('joinInterface').innerHTML = 
            '<p style="color: #e44;">Beide inputs moeten kolommen hebben.</p>';
        showModal('joinModal');
        return;
    }
    
    // Load existing configuration
    const config = block.config || {
        joinType: 'inner',
        leftKey: '',
        rightKey: ''
    };
    
    let html = '<div style="display: flex; gap: 30px; margin-bottom: 20px;">';
    
    // Left dataset info
    html += '<div style="flex: 1; border: 1px solid #e0e0e0; border-radius: 4px; padding: 15px; background: #f9f9f9;">';
    html += '<h3 style="font-size: 14px; margin-bottom: 10px; font-weight: 600;">Left Dataset</h3>';
    html += `<p style="font-size: 12px; color: #666;">Rijen: ${leftInput.data.length}, Kolommen: ${leftHeaders.length}</p>`;
    html += '<div style="max-height: 150px; overflow-y: auto; margin-top: 10px;">';
    leftHeaders.forEach(header => {
        html += `<div style="padding: 4px; font-size: 12px; background: white; margin-bottom: 3px; border-radius: 3px;">${escapeHtml(header)}</div>`;
    });
    html += '</div></div>';
    
    // Right dataset info
    html += '<div style="flex: 1; border: 1px solid #e0e0e0; border-radius: 4px; padding: 15px; background: #f9f9f9;">';
    html += '<h3 style="font-size: 14px; margin-bottom: 10px; font-weight: 600;">Right Dataset</h3>';
    html += `<p style="font-size: 12px; color: #666;">Rijen: ${rightInput.data.length}, Kolommen: ${rightHeaders.length}</p>`;
    html += '<div style="max-height: 150px; overflow-y: auto; margin-top: 10px;">';
    rightHeaders.forEach(header => {
        html += `<div style="padding: 4px; font-size: 12px; background: white; margin-bottom: 3px; border-radius: 3px;">${escapeHtml(header)}</div>`;
    });
    html += '</div></div>';
    
    html += '</div>';
    
    // Join configuration
    html += '<div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 15px; background: white;">';
    html += '<h3 style="font-size: 14px; margin-bottom: 15px; font-weight: 600;">Join Configuration</h3>';
    
    html += '<div style="margin-bottom: 15px;">';
    html += '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Join Type:</label>';
    html += `<select id="joinType" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px;">`;
    html += `<option value="inner" ${config.joinType === 'inner' ? 'selected' : ''}>Inner Join (alleen matches)</option>`;
    html += `<option value="left" ${config.joinType === 'left' ? 'selected' : ''}>Left Join (alle left + matches)</option>`;
    html += `<option value="right" ${config.joinType === 'right' ? 'selected' : ''}>Right Join (alle right + matches)</option>`;
    html += `<option value="outer" ${config.joinType === 'outer' ? 'selected' : ''}>Full Outer Join (alle rijen)</option>`;
    html += '</select></div>';
    
    html += '<div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 15px; align-items: center;">';
    
    html += '<div>';
    html += '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Left Key:</label>';
    html += `<select id="joinLeftKey" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px;">`;
    html += '<option value="">-- Selecteer kolom --</option>';
    leftHeaders.forEach(header => {
        const selected = config.leftKey === header ? 'selected' : '';
        html += `<option value="${escapeHtml(header)}" ${selected}>${escapeHtml(header)}</option>`;
    });
    html += '</select></div>';
    
    html += '<div style="text-align: center; font-size: 20px; color: #666;">⟷</div>';
    
    html += '<div>';
    html += '<label style="display: block; margin-bottom: 5px; font-weight: 600;">Right Key:</label>';
    html += `<select id="joinRightKey" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px;">`;
    html += '<option value="">-- Selecteer kolom --</option>';
    rightHeaders.forEach(header => {
        const selected = config.rightKey === header ? 'selected' : '';
        html += `<option value="${escapeHtml(header)}" ${selected}>${escapeHtml(header)}</option>`;
    });
    html += '</select></div>';
    
    html += '</div>';
    
    html += '<div style="margin-top: 15px; padding: 10px; background: #f0f8ff; border-radius: 4px; border-left: 4px solid #4a90e2;">';
    html += '<p style="font-size: 12px; margin: 0;"><strong>Tip:</strong> Selecteer kolommen met matching waarden om datasets samen te voegen.</p>';
    html += '</div>';
    
    html += '</div>';
    
    document.getElementById('joinInterface').innerHTML = html;
    showModal('joinModal');
    
    document.getElementById('applyJoin').onclick = () => {
        applyJoin(block, leftInput, rightInput);
    };
}

function applyJoin(block, leftInput, rightInput) {
    const joinType = document.getElementById('joinType').value;
    const leftKey = document.getElementById('joinLeftKey').value;
    const rightKey = document.getElementById('joinRightKey').value;
    
    if (!leftKey || !rightKey) {
        alert('Selecteer beide join keys.');
        return;
    }
    
    // Store configuration
    block.config = { joinType, leftKey, rightKey };
    
    // Perform the join
    const joinedData = performJoin(leftInput, rightInput, leftKey, rightKey, joinType);
    
    // Store result
    dataStore[block.id] = joinedData;
    
    // Update block content
    const joinTypeLabel = {
        'inner': 'Inner',
        'left': 'Left',
        'right': 'Right',
        'outer': 'Full Outer'
    }[joinType] || joinType;
    
    updateBlockContent(block.id, `${joinTypeLabel} Join: ${joinedData.data.length} rijen`);
    propagateData(block.id);
    hideModal('joinModal');
}

/**
 * Performs a join operation on two datasets
 * @param {Object} leftData - Left dataset with headers and data
 * @param {Object} rightData - Right dataset with headers and data
 * @param {string} leftKey - Column name to join on from left dataset
 * @param {string} rightKey - Column name to join on from right dataset
 * @param {string} joinType - Type of join: 'inner', 'left', 'right', 'outer'
 * @returns {Object} Joined dataset with headers and data
 */
function performJoin(leftData, rightData, leftKey, rightKey, joinType) {
    const leftRows = leftData.data || [];
    const rightRows = rightData.data || [];
    const leftHeaders = leftData.headers || [];
    const rightHeaders = rightData.headers || [];
    
    // Create result headers - left headers + right headers (excluding right key if it's same name)
    const resultHeaders = [...leftHeaders];
    rightHeaders.forEach(header => {
        // Add right header with prefix if it conflicts with left headers (except the join key)
        if (header === rightKey && header === leftKey) {
            // Skip the right key if it's the same as left key
            return;
        }
        if (leftHeaders.includes(header)) {
            resultHeaders.push(`right_${header}`);
        } else {
            resultHeaders.push(header);
        }
    });
    
    const resultRows = [];
    const matchedRightIndices = new Set();
    
    // Build index for right dataset for faster lookup
    const rightIndex = {};
    rightRows.forEach((row, idx) => {
        const key = row[rightKey];
        if (key !== undefined && key !== null && key !== '') {
            if (!rightIndex[key]) {
                rightIndex[key] = [];
            }
            rightIndex[key].push({ row, idx });
        }
    });
    
    // Process left rows
    leftRows.forEach(leftRow => {
        const leftKeyValue = leftRow[leftKey];
        const rightMatches = rightIndex[leftKeyValue] || [];
        
        if (rightMatches.length > 0) {
            // Found match(es) - create joined row(s)
            rightMatches.forEach(({ row: rightRow, idx }) => {
                matchedRightIndices.add(idx);
                const joinedRow = { ...leftRow };
                
                // Add right columns
                rightHeaders.forEach(header => {
                    if (header === rightKey && header === leftKey) {
                        // Skip duplicate key column
                        return;
                    }
                    const targetHeader = leftHeaders.includes(header) && header !== rightKey ? `right_${header}` : header;
                    joinedRow[targetHeader] = rightRow[header];
                });
                
                resultRows.push(joinedRow);
            });
        } else {
            // No match found
            if (joinType === 'left' || joinType === 'outer') {
                // Include left row with null values for right columns
                const joinedRow = { ...leftRow };
                rightHeaders.forEach(header => {
                    if (header === rightKey && header === leftKey) {
                        return;
                    }
                    const targetHeader = leftHeaders.includes(header) && header !== rightKey ? `right_${header}` : header;
                    joinedRow[targetHeader] = '';
                });
                resultRows.push(joinedRow);
            }
        }
    });
    
    // Process unmatched right rows (for right join and outer join)
    if (joinType === 'right' || joinType === 'outer') {
        rightRows.forEach((rightRow, idx) => {
            if (!matchedRightIndices.has(idx)) {
                // Unmatched right row - add with null values for left columns
                const joinedRow = {};
                
                // Add empty left columns
                leftHeaders.forEach(header => {
                    joinedRow[header] = '';
                });
                
                // Add right columns
                rightHeaders.forEach(header => {
                    if (header === rightKey && header === leftKey) {
                        joinedRow[leftKey] = rightRow[rightKey];
                        return;
                    }
                    const targetHeader = leftHeaders.includes(header) && header !== rightKey ? `right_${header}` : header;
                    joinedRow[targetHeader] = rightRow[header];
                });
                
                resultRows.push(joinedRow);
            }
        });
    }
    
    return {
        data: resultRows,
        headers: resultHeaders,
        joinInfo: {
            type: joinType,
            leftKey,
            rightKey,
            leftRows: leftRows.length,
            rightRows: rightRows.length,
            resultRows: resultRows.length
        }
    };
}
