# Visual Reference Guide

## Component Icons & Meanings

```
┌─────────────────────────────────────────────────┐
│              Component Library                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  📥 Data Input                                  │
│     └─ Load CSV files                          │
│     └─ Parse data automatically                │
│     └─ Show row count                          │
│                                                 │
│  👁️ Data View                                   │
│     └─ Display data in table                   │
│     └─ Scrollable with sticky headers          │
│     └─ Shows first 100 rows                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

## UI Elements

```
Header Bar
┌────────────────────────────────────────────┐
│ Minimal ETL Modeler                        │
│ Lightweight • Scalable • Minimalistic      │
└────────────────────────────────────────────┘


Main Workspace
┌──────────┬─────────────────────────────────┐
│          │                                 │
│ Toolbox  │        Canvas                   │
│          │                                 │
│ ┌──────┐ │    [Drop blocks here]          │
│ │ 📥   │ │                                 │
│ │ Data │ │         ⚪                      │
│ │Input │ │      ┌────────┐                │
│ └──────┘ │      │  📥    │                │
│          │      │  Data  │                │
│ ┌──────┐ │      │  Input │                │
│ │ 👁️   │ │      └────────┘                │
│ │ Data │ │         ⚪                      │
│ │ View │ │          ╲                     │
│ └──────┘ │           ╲  Connection line   │
│          │            ╲                    │
│          │         ⚪  ↓                   │
│          │      ┌────────┐                │
│          │      │  👁️    │                │
│          │      │  Data  │                │
│          │      │  View  │                │
│          │      └────────┘                │
│          │         ⚪                      │
│          │                                 │
└──────────┴─────────────────────────────────┘
```

## Block Structure

```
┌─────────────────────────────────┐
│ 📥 Data Input              ✕    │  ← Header with icon & delete
├─────────────────────────────────┤
│ sample.csv (10 rijen)           │  ← Content/status
│ ✓ Gereed                        │  ← Success indicator
└─────────────────────────────────┘
        ⚪ ← Output connector
```

## Connection Flow

```
Step 1: Click output      Step 2: Drag to input
     ⚪                         ⚪
  ┌────────┐                ┌────────┐
  │  📥    │                │  📥    │
  │  Data  │                │  Data  │
  │  Input │                │  Input │
  └────────┘                └────────┘
     ⚪                         ⚪
     │                          ╲
     │                           ╲
     ↓                            ↓
   [Click]                    ⚪  [Drop]
                           ┌────────┐
                           │  👁️    │
                           │  Data  │
                           │  View  │
                           └────────┘
                              ⚪


Step 3: Connection created
     ⚪
  ┌────────┐
  │  📥    │
  │  Data  │
  │  Input │
  └────────┘
     ⚪
      ╲
       ╲ ← Curved SVG line
        ╲
     ⚪  ↓
  ┌────────┐
  │  👁️    │
  │  Data  │
  │  View  │
  └────────┘
     ⚪
```

## Modal Dialogs

```
Data Input Modal
┌─────────────────────────────────────┐
│ Data Input                      ✕   │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Choose File                │   │
│  └─────────────────────────────┘   │
│                                     │
│  Geladen: sample.csv               │
│  Rijen: 10                         │
│  Kolommen: 6                       │
│                                     │
└─────────────────────────────────────┘


Data View Modal
┌──────────────────────────────────────────┐
│ Data View                            ✕   │
├──────────────────────────────────────────┤
│                                          │
│  ┏━━━━━━━━┯━━━━━━━━┯━━━━━━━━━━━━━━┓   │
│  ┃ Col1   │ Col2   │ Col3          ┃   │
│  ┠────────┼────────┼───────────────┨   │
│  ┃ Value1 │ Value2 │ Value3        ┃   │
│  ┃ Value4 │ Value5 │ Value6        ┃   │
│  ┃ ...    │ ...    │ ...           ┃   │
│  ┗━━━━━━━━┷━━━━━━━━┷━━━━━━━━━━━━━━┛   │
│                                          │
│  Toon eerste 100 van 10 rijen           │
│                                          │
└──────────────────────────────────────────┘
```

## Color Scheme

```
┌─────────────────────────────────────┐
│         Color Palette               │
├─────────────────────────────────────┤
│ Background:  #f5f5f5  (Light gray) │
│ Card/Block:  #ffffff  (White)      │
│ Border:      #e0e0e0  (Gray)       │
│ Accent:      #4a90e2  (Blue)       │
│ Success:     #2e7d32  (Green)      │
│ Text:        #333333  (Dark gray)  │
│ Subtle:      #666666  (Med gray)   │
└─────────────────────────────────────┘
```

## Interaction States

```
Block States:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Default:     Solid border, white bg
Hover:       Shadow increases
Selected:    Blue border (#4a90e2)
Dragging:    Cursor changes to "grabbing"


Tool Item States:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Default:     Gray background
Hover:       White bg, shadow, lift 1px
Active:      "grabbing" cursor


Connector States:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Default:     Blue border, white fill
Hover:       Blue fill
Active:      Crosshair cursor
```

## Keyboard & Mouse Actions

```
┌──────────────────────────────────────────┐
│           User Interactions              │
├──────────────────────────────────────────┤
│                                          │
│  Drag Block         → Move position     │
│  Double-click Block → Open modal        │
│  Click ✕            → Delete block      │
│  Drag from ⚪        → Create connection │
│  Click modal ✕      → Close modal       │
│  Select file        → Load CSV          │
│                                          │
└──────────────────────────────────────────┘
```

## Data Flow Visualization

```
     CSV File
        ↓
    [📁 File]
        ↓
  User selects
        ↓
   FileReader
        ↓
    Raw text
        ↓
   parseCSV()
        ↓
  Array of objects
  [                    ← dataStore[blockId]
    {col1: val1, ...},
    {col1: val2, ...}
  ]
        ↓
   Connection
        ↓
  transferData()
        ↓
  Copy to view block
        ↓
    Display
        ↓
  HTML <table>
```

## File Structure Visualization

```
minimal-etl-modeler/
│
├── 📄 Core Application
│   ├── index.html           (Main app)
│   ├── style.css            (Styling)
│   └── app.js               (Logic)
│
├── 📊 Sample Data
│   └── sample-data.csv      (SAP data)
│
├── 🎨 Demos
│   ├── demo.html            (Demo page)
│   └── example-flow.html    (Pre-built flow)
│
├── 📸 Screenshots
│   ├── screenshot-initial.png
│   └── screenshot-example-flow.png
│
├── 🧪 Tests
│   ├── test-csv-parser.js
│   └── test-integration.js
│
├── 📚 Documentation
│   ├── README.md            (Main docs)
│   ├── QUICKSTART.md        (Quick guide)
│   ├── GEBRUIKERSHANDLEIDING.md (User guide)
│   ├── ARCHITECTURE.md      (Tech docs)
│   ├── DELIVERABLES.md      (Summary)
│   ├── CHANGELOG.md         (Version history)
│   └── VISUAL-REFERENCE.md  (This file)
│
└── ⚙️ Config
    └── .gitignore           (Git config)
```

---

**Pro Tip**: Keep this reference open while using the app! 📌
