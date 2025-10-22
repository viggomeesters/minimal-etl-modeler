# Save/Load Flow Feature - User Guide

## Overview
The Minimal ETL Modeler now supports saving and loading complete ETL flows. This feature allows you to:
- Save your work and continue later
- Share flows with colleagues
- Create templates for common ETL patterns
- Version control your ETL designs

## How to Use

### Saving a Flow
1. Build your ETL flow on the canvas
2. Click the **💾 Save** button in the top-right corner
3. The flow will be downloaded as a JSON file (e.g., `etl-flow-2025-10-21.json`)
4. Save the file to your computer

### Loading a Flow
1. Click the **📂 Load** button in the top-right corner
2. Select a previously saved JSON file
3. The canvas will be cleared and your flow will be reconstructed
4. All blocks, connections, and data are restored

## What Gets Saved?

The following information is preserved:
- **Blocks**: Type, position, and configuration
- **Connections**: All links between blocks
- **Data Store**: Loaded data and mappings
- **Block Counter**: Ensures unique IDs when adding new blocks

## Flow File Format

Flows are saved in JSON format:

```json
{
  "version": "1.0",
  "timestamp": "2025-10-21T07:30:00.000Z",
  "blocks": [
    {
      "id": "block-0",
      "type": "input",
      "x": 100,
      "y": 100,
      "data": null
    }
  ],
  "connections": [
    {
      "from": "block-0",
      "to": "block-1"
    }
  ],
  "dataStore": {},
  "blockCounter": 5
}
```

## Example Flow

An example flow is included in `example-etl-flow.json`. This demonstrates:
- Input → Automapper → Mapping → Transform → Output Data
- A complete ETL pipeline structure
- Proper connection patterns

To try it:
1. Open the application
2. Click **📂 Load**
3. Select `example-etl-flow.json`
4. The example flow appears on the canvas

## Tips

- **Unique Filenames**: Save flows with descriptive names (e.g., `sap-order-transform.json`)
- **Version Control**: Use Git or similar tools to track flow changes
- **Templates**: Create reusable flow templates for common patterns
- **Backup**: Keep backups of important flows
- **Testing**: Load flows in a fresh browser to verify they work correctly

## Limitations

- **Local Only**: Flows are saved to your computer (no cloud storage)
- **File-Based**: Uses browser download/upload (no database)
- **CSV Data**: Uploaded CSV files are not included in the saved flow (you'll need to reload them)
- **Browser Specific**: Each browser maintains its own state

## Troubleshooting

**Flow won't load**
- Ensure the JSON file is valid
- Check that it was created by this application
- Try opening the file in a text editor to verify structure

**Missing data after loading**
- CSV files must be re-uploaded after loading a flow
- Only the flow structure is saved, not the actual data files

**Blocks overlap after loading**
- Blocks are restored to their exact saved positions
- Drag blocks to rearrange if needed

## Technical Details

- **Format**: JSON (human-readable)
- **Size**: Typically <10KB for most flows
- **Compatibility**: Version 1.0 format
- **Browser Support**: All modern browsers (Chrome, Firefox, Safari, Edge)
