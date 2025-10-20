# Architecture Overview

## Application Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Minimal ETL Modeler                      │
│                     (Single Page App)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
  ┌──────────┐         ┌──────────┐         ┌──────────┐
  │   HTML   │         │   CSS    │         │    JS    │
  │ (View)   │◄────────┤ (Style)  │────────►│ (Logic)  │
  └──────────┘         └──────────┘         └──────────┘
        │                                          │
        │                                          │
        ▼                                          ▼
  ┌──────────────────────────────┐    ┌─────────────────────┐
  │  UI Components               │    │  State Management   │
  ├──────────────────────────────┤    ├─────────────────────┤
  │ • Header                     │    │ • blocks[]          │
  │ • Toolbox                    │    │ • connections[]     │
  │   - Data Input Block         │    │ • dataStore{}       │
  │   - Data View Block          │    │ • selectedBlock     │
  │ • Canvas                     │    └─────────────────────┘
  │ • Modals                     │              │
  │   - Input Modal              │              │
  │   - View Modal               │              │
  └──────────────────────────────┘              │
                                                 │
                                                 ▼
                                    ┌────────────────────────┐
                                    │  Core Functions        │
                                    ├────────────────────────┤
                                    │ • initDragAndDrop()    │
                                    │ • createBlock()        │
                                    │ • renderBlock()        │
                                    │ • deleteBlock()        │
                                    │ • addConnection()      │
                                    │ • parseCSV()           │
                                    │ • displayData()        │
                                    │ • transferData()       │
                                    └────────────────────────┘
```

## Component Interaction Flow

```
User Action                  System Response
───────────                  ───────────────

[Drag Block from Toolbox]
         │
         ▼
    handleDragStart()
         │
         ▼
    Store block type
         │
         ▼
[Drop on Canvas]
         │
         ▼
    handleDrop()
         │
         ▼
    createBlock(type, x, y)
         │
         ▼
    renderBlock() ────────► [Block appears on canvas]


[Double-click Data Input]
         │
         ▼
    openBlockModal()
         │
         ▼
    [File Upload Dialog]
         │
         ▼
    handleFileSelect()
         │
         ▼
    parseCSV(data)
         │
         ▼
    dataStore[blockId] = parsedData
         │
         ▼
    updateBlockContent() ──► [Block shows "X rows"]


[Connect two blocks]
         │
         ▼
    Click output connector
         │
         ▼
    startConnection()
         │
         ▼
    Drag to input connector
         │
         ▼
    addConnection(from, to)
         │
         ▼
    renderConnections() ───► [SVG line drawn]
         │
         ▼
    transferData(from, to) ─► [Data flows through]


[Double-click Data View]
         │
         ▼
    displayData(block)
         │
         ▼
    Get data from dataStore
         │
         ▼
    Generate HTML table
         │
         ▼
    Show modal ────────────► [Data displayed in table]
```

## Data Flow

```
CSV File Input
     │
     ▼
FileReader API
     │
     ▼
parseCSV()
     │
     ▼
dataStore[inputBlockId] = [{row1}, {row2}, ...]
     │
     ▼
Connection established
     │
     ▼
transferData(inputId, viewId)
     │
     ▼
dataStore[viewBlockId] = dataStore[inputBlockId]
     │
     ▼
displayData()
     │
     ▼
HTML Table rendered in modal
     │
     ▼
User sees data
```

## File Dependencies

```
index.html
    │
    ├──► style.css (for styling)
    │
    └──► app.js (for functionality)

demo.html
    │
    └──► screenshot-initial.png

example-flow.html
    │
    ├──► style.css
    │
    └──► app.js
```

## Technology Stack

```
┌─────────────────────────────────────┐
│         Browser (Client-Side)       │
├─────────────────────────────────────┤
│                                     │
│  HTML5                              │
│  ├─ Semantic markup                │
│  ├─ Drag & Drop API                │
│  └─ File API                       │
│                                     │
│  CSS3                               │
│  ├─ Flexbox layout                 │
│  ├─ Transitions & animations       │
│  └─ Media queries (responsive)     │
│                                     │
│  JavaScript (ES6+)                  │
│  ├─ DOM manipulation               │
│  ├─ Event handling                 │
│  ├─ SVG generation                 │
│  └─ Array methods (map, filter)   │
│                                     │
│  SVG                                │
│  └─ Connection lines (paths)       │
│                                     │
└─────────────────────────────────────┘

No external dependencies!
No build process required!
No frameworks!
```

## State Management Pattern

```
                  User Interaction
                         │
                         ▼
                  Event Handler
                         │
                         ▼
                  Update State
                    (blocks[],
                   connections[],
                    dataStore{})
                         │
                         ▼
                  Re-render UI
                    (if needed)
                         │
                         ▼
                   Visual Update
```

## Module Responsibilities

```
┌─────────────────────────────────────────────────┐
│              app.js Modules                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. Initialization                              │
│     └─ initDragAndDrop(), initModals()         │
│                                                 │
│  2. Block Management                            │
│     ├─ createBlock()                           │
│     ├─ renderBlock()                           │
│     ├─ deleteBlock()                           │
│     ├─ startDragBlock()                        │
│     ├─ dragBlockMove()                         │
│     └─ stopDragBlock()                         │
│                                                 │
│  3. Connection Management                       │
│     ├─ initConnectors()                        │
│     ├─ startConnection()                       │
│     ├─ addConnection()                         │
│     ├─ renderConnections()                     │
│     └─ transferData()                          │
│                                                 │
│  4. Data Processing                             │
│     ├─ handleFileSelect()                      │
│     ├─ parseCSV()                              │
│     ├─ displayData()                           │
│     └─ updateBlockContent()                    │
│                                                 │
│  5. Modal Management                            │
│     ├─ initModals()                            │
│     └─ openBlockModal()                        │
│                                                 │
└─────────────────────────────────────────────────┘
```
