// Global state
let blocks = [];
let connections = [];
let blockCounter = 0;
let selectedBlock = null;
let dataStore = {};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initDragAndDrop();
    initModals();
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
    const canvasRect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;
    
    createBlock(blockType, x, y);
    
    // Remove hint if it exists
    const hint = document.querySelector('.hint');
    if (hint) hint.style.display = 'none';
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
    
    const icon = block.type === 'input' ? '📥' : '👁️';
    const title = block.type === 'input' ? 'Data Input' : 'Data View';
    
    blockEl.innerHTML = `
        <div class="block-header">
            <span class="block-icon">${icon}</span>
            <span class="block-title">${title}</span>
            <span class="block-delete" onclick="deleteBlock('${block.id}')">✕</span>
        </div>
        <div class="block-content" id="${block.id}-content">
            ${block.type === 'input' ? 'Klik om data te laden' : 'Klik om data te bekijken'}
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
    
    const canvasRect = document.getElementById('canvas').getBoundingClientRect();
    const x = e.clientX - canvasRect.left - dragOffsetX;
    const y = e.clientY - canvasRect.top - dragOffsetY;
    
    dragBlock.style.left = `${x}px`;
    dragBlock.style.top = `${y}px`;
    
    // Update block position in state
    const block = blocks.find(b => b.id === dragBlock.id);
    if (block) {
        block.x = x;
        block.y = y;
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

// Connectors for linking blocks
let isConnecting = false;
let connectFrom = null;

function initConnectors(blockId) {
    const connectors = document.querySelectorAll(`#${blockId} .block-connector`);
    connectors.forEach(connector => {
        connector.addEventListener('mousedown', startConnection);
    });
}

function startConnection(e) {
    e.stopPropagation();
    if (e.target.dataset.type !== 'out') return;
    
    isConnecting = true;
    connectFrom = e.target.dataset.block;
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
    
    isConnecting = false;
    connectFrom = null;
});

function addConnection(fromId, toId) {
    // Check if connection already exists
    const exists = connections.find(c => c.from === fromId && c.to === toId);
    if (exists) return;
    
    connections.push({ from: fromId, to: toId });
    renderConnections();
    
    // Transfer data if available
    transferData(fromId, toId);
}

function renderConnections() {
    // Remove existing SVG
    const existingSvg = document.getElementById('connections-svg');
    if (existingSvg) existingSvg.remove();
    
    if (connections.length === 0) return;
    
    const canvas = document.getElementById('canvas');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'connections-svg';
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '1';
    
    connections.forEach(conn => {
        const fromBlock = document.getElementById(conn.from);
        const toBlock = document.getElementById(conn.to);
        
        if (!fromBlock || !toBlock) return;
        
        const fromConnector = fromBlock.querySelector('.connector-out');
        const toConnector = toBlock.querySelector('.connector-in');
        
        const fromRect = fromConnector.getBoundingClientRect();
        const toRect = toConnector.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        
        const x1 = fromRect.left - canvasRect.left + fromRect.width / 2;
        const y1 = fromRect.top - canvasRect.top + fromRect.height / 2;
        const x2 = toRect.left - canvasRect.left + toRect.width / 2;
        const y2 = toRect.top - canvasRect.top + toRect.height / 2;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = `M ${x1} ${y1} C ${x1} ${y1 + 50}, ${x2} ${y2 - 50}, ${x2} ${y2}`;
        path.setAttribute('d', d);
        path.classList.add('connection-line');
        
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
}

function openBlockModal(block) {
    if (block.type === 'input') {
        document.getElementById('inputModal').style.display = 'block';
        selectedBlock = block;
    } else if (block.type === 'view') {
        displayData(block);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const csvData = event.target.result;
        const parsedData = parseCSV(csvData);
        
        // Store data
        dataStore[selectedBlock.id] = parsedData;
        
        // Update block UI
        updateBlockContent(selectedBlock.id, `${file.name} (${parsedData.length} rijen)`);
        
        // Close modal
        document.getElementById('inputModal').style.display = 'none';
        
        // Transfer to connected blocks
        propagateData(selectedBlock.id);
        
        // Show info
        document.getElementById('fileInfo').innerHTML = `
            <strong>Geladen:</strong> ${file.name}<br>
            <strong>Rijen:</strong> ${parsedData.length}<br>
            <strong>Kolommen:</strong> ${parsedData[0] ? Object.keys(parsedData[0]).length : 0}
        `;
    };
    reader.readAsText(file);
}

function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        data.push(row);
    }
    
    return data;
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
    if (dataStore[fromId]) {
        dataStore[toId] = dataStore[fromId];
        const toBlock = blocks.find(b => b.id === toId);
        if (toBlock && toBlock.type === 'view') {
            updateBlockContent(toId, `Data beschikbaar (${dataStore[toId].length} rijen)`);
        }
    }
}

function displayData(block) {
    const data = dataStore[block.id];
    
    if (!data || data.length === 0) {
        document.getElementById('dataDisplay').innerHTML = '<p>Geen data beschikbaar. Verbind met een Data Input block.</p>';
        document.getElementById('viewModal').style.display = 'block';
        return;
    }
    
    const headers = Object.keys(data[0]);
    let html = '<table>';
    
    // Headers
    html += '<thead><tr>';
    headers.forEach(header => {
        html += `<th>${header}</th>`;
    });
    html += '</tr></thead>';
    
    // Rows (limit to first 100 for performance)
    html += '<tbody>';
    data.slice(0, 100).forEach(row => {
        html += '<tr>';
        headers.forEach(header => {
            html += `<td>${row[header]}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody>';
    
    html += '</table>';
    
    if (data.length > 100) {
        html += `<p style="margin-top: 15px; color: #666; font-size: 12px;">Toon eerste 100 van ${data.length} rijen</p>`;
    }
    
    document.getElementById('dataDisplay').innerHTML = html;
    document.getElementById('viewModal').style.display = 'block';
}
