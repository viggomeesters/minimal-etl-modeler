# Data Flow Logging Feature

## Overview

The Data Flow Log component provides a textual representation of the data flow and transformations in your ETL pipeline. This feature helps you understand how data moves through your workflow and what transformations are applied at each step.

## Features

- **Real-time Logging**: Captures all data operations as they happen
- **Detailed Information**: Shows row counts, column names, and transformation details
- **Timestamp Tracking**: Each log entry includes a timestamp for tracking when operations occurred
- **Clear Log Function**: Ability to clear the log and start fresh
- **Automatic Updates**: Log block updates automatically when new operations are performed

## Using the Data Flow Log

### Adding a Log Block

1. Locate the **Data Flow Log** component in the toolbox (📋 icon)
2. Drag it onto the canvas
3. The block will display the number of log entries

### Viewing the Log

1. Double-click on the Data Flow Log block
2. A modal will open showing all logged operations
3. Each entry shows:
   - Timestamp (HH:MM:SS format)
   - Block type and ID
   - Operation type
   - Operation details (rows, columns, mappings, etc.)

### Log Entry Types

The logging system captures the following operations:

#### DATA_LOADED
- **When**: A CSV file is loaded into an Input Source Data block
- **Information Logged**:
  - Number of rows loaded
  - Column names
  - Source file name

Example:
```
[8:51:00 PM] INPUT (block-0): DATA_LOADED
  → Rows: 3
  → Columns: Name, Age, City
```

#### DATA_TRANSFER
- **When**: Data flows from one block to another through a connection
- **Information Logged**:
  - Source block type and ID
  - Target block type and ID
  - Number of rows transferred
  - Column names

Example:
```
[8:51:41 PM] LOGGING (block-1): DATA_TRANSFER
  → Rows: 3
  → Columns: Name, Age, City
  → From: input (block-0)
  → To: logging (block-1)
```

#### MAPPING_APPLIED
- **When**: Column mapping is applied in a Mapping block
- **Information Logged**:
  - Number of rows processed
  - Mapping configuration (input → output column mappings)
  - Input and output column names

Example:
```
[8:51:41 PM] INPUT (block-0): MAPPING_APPLIED
  → Rows: 3
  → Mapping: {"FullName":"Name","Years":"Age","Location":"City"}
```

#### TRANSFORM_APPLIED
- **When**: Data transformation is applied in a Transform block
- **Information Logged**:
  - Number of rows processed
  - Number of transformations applied
  - Input and output column names

Example:
```
[8:51:41 PM] INPUT (block-0): TRANSFORM_APPLIED
  → Rows: 3
  → Transform: 2 transformations
```

### Clearing the Log

1. Open the Data Flow Log modal
2. Click the **Clear Log** button at the bottom
3. All log entries will be removed
4. Log blocks will reset to show "0 log entries"

## Implementation Details

### Global State
- `dataFlowLog`: Array storing all log entries
- Maximum 1000 entries (oldest entries removed automatically)

### Key Functions

#### `addLogEntry(blockId, operation, details)`
Adds a new log entry to the system.

**Parameters:**
- `blockId`: ID of the block performing the operation
- `operation`: Type of operation (e.g., 'DATA_LOADED', 'MAPPING_APPLIED')
- `details`: Object containing operation-specific details

#### `formatLogEntry(entry)`
Formats a log entry for display in the modal.

**Returns:** Formatted string with timestamp, operation, and details

#### `updateLoggingBlocks()`
Updates all logging blocks on the canvas to show current entry count.

#### `openLoggingModal(block)`
Opens the logging modal and displays all current log entries.

## Technical Notes

- Log entries are stored in memory and cleared when the page is refreshed
- The logging system is integrated into key data operations:
  - File loading (`handleFileSelect`)
  - Data transfer (`transferData`)
  - Mapping operations (`applyMapping`)
  - Transform operations (transform block)
- All logging blocks automatically update when new entries are added
- The log display uses monospace font for better readability

## Best Practices

1. **Regular Monitoring**: Check the log periodically during workflow development
2. **Clear When Needed**: Clear the log when testing new configurations to avoid confusion
3. **Multiple Blocks**: You can add multiple Data Flow Log blocks to different parts of your canvas
4. **Debugging**: Use the log to identify where data transformations might be going wrong

## Limitations

- Log entries are not persisted across page refreshes
- Maximum 1000 log entries (older entries are automatically removed)
- Log does not show actual data values, only metadata about operations

## Future Enhancements

Potential improvements that could be added:
- Export log to file (CSV or JSON)
- Filter log by operation type or block
- Search functionality within the log
- Persistent logging across sessions
- Detailed data preview in log entries
