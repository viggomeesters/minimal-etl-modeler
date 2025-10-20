# Quick Start Guide

## Get Started in 30 Seconds! ⚡

### Step 1: Open the Application
```bash
# Simply open index.html in your browser
# Or start a local server:
python3 -m http.server 8080
# Then visit: http://localhost:8080
```

### Step 2: Create Your First ETL Flow

1. **Drag** a 📥 Data Input block to the canvas
2. **Double-click** the block
3. **Select** `sample-data.csv` (or your own CSV)
4. **Drag** a 👁️ Data View block to the canvas
5. **Connect** them:
   - Click the bottom ⚪ of Data Input
   - Drag to the top ⚪ of Data View
6. **Double-click** Data View to see your data!

### That's It! 🎉

You now have a working ETL flow that:
- ✅ Loads CSV data
- ✅ Displays it in a clean table
- ✅ Shows the data flow visually

## Common Tasks

### Load Your Own Data
- Any CSV file works
- First row must be headers
- Use comma (`,`) as delimiter

### Move Blocks
- Click and drag any block to reposition

### Delete Blocks
- Click the ✕ in the top-right corner

### View More Examples
- Open `example-flow.html` for a pre-configured demo
- Open `demo.html` for the full demo page

## Troubleshooting

**Problem**: Blocks won't drag
**Solution**: Make sure you're dragging from the toolbox, not the title

**Problem**: Can't connect blocks
**Solution**: Always drag FROM the bottom connector TO the top connector

**Problem**: No data showing
**Solution**: Make sure blocks are connected and Data Input has data loaded

## Next Steps

1. Try loading your own SAP CSV data
2. Create multiple flows
3. Experiment with the interface

Need more help? Check:
- `GEBRUIKERSHANDLEIDING.md` - Full user guide (Dutch)
- `README.md` - Complete documentation
- `ARCHITECTURE.md` - Technical details

---

**Enjoy your minimal ETL experience!** 🚀
