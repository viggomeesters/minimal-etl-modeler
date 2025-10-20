# Changelog

All notable changes to this project will be documented in this file.

## [v0.1.0-POC] - 2025-10-20

### Initial Release - Proof of Concept

#### ✨ Features
- **Drag-and-Drop Interface**: Full drag-and-drop support for ETL components
- **Data Input Block**: Load CSV files with automatic parsing
- **Data View Block**: Display data in clean tabular format
- **Visual Connections**: Connect blocks with curved SVG lines
- **Minimalistic UI**: Clean, clutter-free interface
- **Zero Dependencies**: Pure vanilla JavaScript implementation

#### 📦 Deliverables
- Core application (`index.html`, `style.css`, `app.js`)
- Sample SAP data (`sample-data.csv`)
- Demo pages (`demo.html`, `example-flow.html`)
- Comprehensive documentation:
  - `README.md` - Project overview
  - `QUICKSTART.md` - Quick start guide
  - `GEBRUIKERSHANDLEIDING.md` - User guide (Dutch)
  - `ARCHITECTURE.md` - Technical architecture
  - `DELIVERABLES.md` - Complete deliverables list
- Test suite:
  - `test-csv-parser.js` - CSV parser unit tests
  - `test-integration.js` - Integration tests (10/10 passing)
- Screenshots demonstrating functionality

#### 🎯 Requirements Met
- ✅ Simple ETL modeler inspired by Alteryx Designer
- ✅ SAP domain data support
- ✅ Load, transform, and view data capabilities
- ✅ Draggable blocks with connections
- ✅ Clean, minimal GUI
- ✅ Data reading and viewing (POC)

#### 🏗️ Technical Details
- **Total Lines of Code**: ~1,600
- **File Size**: ~17KB (unminified)
- **External Dependencies**: 0
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Test Coverage**: 10 integration tests, all passing

#### 📊 Supported Features
- CSV file upload
- Automatic CSV parsing
- Tabular data display (up to 100 rows)
- Block positioning and repositioning
- Block deletion
- Connection management
- Data flow visualization
- Modal dialogs for interactions

#### 🎨 Design Philosophy
- **Lightweight**: No frameworks, no build process
- **Scalable**: Modular architecture for extensions
- **Minimalistic**: Only essential features
- **0 Clutter**: Focus on functionality

#### 🔮 Future Enhancements (Not in POC)
- Filter and transform blocks
- Export functionality
- Save/load ETL flows
- More SAP-specific transformations
- Real-time data preview
- Undo/redo functionality
- Canvas zoom controls

#### 📝 Known Limitations
- CSV only (no Excel, JSON, etc.)
- Display limited to 100 rows for performance
- No persistence (flows not saved)
- No undo/redo
- Basic SAP data support (extensible)

---

**Version**: 0.1.0-POC  
**Status**: Complete ✅  
**License**: Not specified  
**Contributors**: GitHub Copilot
