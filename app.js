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
    
    let icon, title, content;
    if (block.type === 'input') {
        icon = '📥';
        title = 'Data Input';
        content = 'Klik om data te laden';
    } else if (block.type === 'view') {
        icon = '👁️';
        title = 'Data View';
        content = 'Klik om data te bekijken';
    } else if (block.type === 'output') {
        icon = '📤';
        title = 'Output Format';
        content = 'Klik om template te laden';
    } else if (block.type === 'mapping') {
        icon = '🔗';
        title = 'Mapping';
        content = 'Klik om kolommen te mappen';
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
    
    // Template input handler
    document.getElementById('templateInput').addEventListener('change', handleTemplateSelect);
}

function openBlockModal(block) {
    if (block.type === 'input') {
        document.getElementById('inputModal').style.display = 'block';
        selectedBlock = block;
    } else if (block.type === 'view') {
        displayData(block);
    } else if (block.type === 'output') {
        document.getElementById('outputModal').style.display = 'block';
        selectedBlock = block;
    } else if (block.type === 'mapping') {
        openMappingModal(block);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const csvData = event.target.result;
        const parsed = parseCSV(csvData);
        
        // Store data with headers
        dataStore[selectedBlock.id] = {
            data: parsed.data,
            headers: parsed.headers
        };
        
        // Update block UI
        updateBlockContent(selectedBlock.id, `${file.name} (${parsed.data.length} rijen)`);
        
        // Close modal
        document.getElementById('inputModal').style.display = 'none';
        
        // Transfer to connected blocks
        propagateData(selectedBlock.id);
        
        // Show info
        document.getElementById('fileInfo').innerHTML = `
            <strong>Geladen:</strong> ${file.name}<br>
            <strong>Rijen:</strong> ${parsed.data.length}<br>
            <strong>Kolommen:</strong> ${parsed.headers.length}
        `;
    };
    reader.readAsText(file);
}

function handleTemplateSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const csvData = event.target.result;
        const parsed = parseCSV(csvData);
        // Store template data
        dataStore[selectedBlock.id] = {
            data: parsed.data,
            headers: parsed.headers,
            isTemplate: true,
            fileName: file.name
        };
        // Update block UI
        updateBlockContent(selectedBlock.id, `${file.name} (${parsed.data.length} rijen)`);
        // Close modal
        document.getElementById('outputModal').style.display = 'none';
        // Show info
        document.getElementById('templateInfo').innerHTML = `
            <strong>Geladen:</strong> ${file.name}<br>
            <strong>Template rijen:</strong> ${parsed.data.length}<br>
            <strong>Kolommen:</strong> ${parsed.headers.length}
        `;
    };
    reader.readAsText(file);
}

function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    if (lines.length === 0) return { data: [], headers: [] };
    
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
    
    return { data: data, headers: headers };
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
        let rowCount = 0;
        if (dataStore[toId].data && Array.isArray(dataStore[toId].data)) {
            rowCount = dataStore[toId].data.length;
        } else if (Array.isArray(dataStore[toId])) {
            // Legacy support for old format
            rowCount = dataStore[toId].length;
        }
        if (toBlock && toBlock.type === 'view') {
            updateBlockContent(toId, `Data beschikbaar (${rowCount} rijen)`);
        }
    }
}

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
    
    // Display table if we have headers
    if (headers.length > 0) {
        let html = '<table>';
        html += '<thead><tr>';
        headers.forEach(header => {
            html += `<th>${header}</th>`;
        });
        html += '</tr></thead>';
        html += '<tbody>';
        if (rows.length > 0) {
            rows.slice(0, 100).forEach(row => {
                html += '<tr>';
                headers.forEach(header => {
                    html += `<td>${row[header] || ''}</td>`;
                });
                html += '</tr>';
            });
        } else {
            html += '<tr><td colspan="' + headers.length + '" style="text-align:center; color:#888;">Geen data, alleen kolommen</td></tr>';
        }
        html += '</tbody>';
        html += '</table>';
        if (rows.length > 100) {
            html += `<p style="margin-top: 15px; color: #666; font-size: 12px;">Toon eerste 100 van ${rows.length} rijen</p>`;
        }
        document.getElementById('dataDisplay').innerHTML = html;
        document.getElementById('viewModal').style.display = 'block';
    } else {
        document.getElementById('dataDisplay').innerHTML = '<p>Geen data beschikbaar. Verbind met een Data Input block.</p>';
        document.getElementById('viewModal').style.display = 'block';
    }
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

// Add click handlers for remove buttons (using event delegation)
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-mapping')) {
        e.target.closest('.mapping-row').remove();
    }
});
