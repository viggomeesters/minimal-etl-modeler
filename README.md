# Minimal ETL Modeler

Een lightweight, schaalbare en minimalistische ETL modeler geïnspireerd op Alteryx Designer, speciaal voor SAP data transformatie.

![Example ETL Flow](screenshot-example-flow.png)

## ✨ Features

- 📥 **Data Input**: Laad CSV bestanden met SAP data
- 👁️ **Data View**: Bekijk en verifieer je data
- 🤖 **Automapper**: Automatische kolom mapping met smart matching algoritme
- 🔗 **Mapping**: Map kolommen tussen input en output formaten (handmatig of vanuit Automapper)
- ⚙️ **Transform**: Transformeer data en exporteer naar CSV
- 🔗 **Visuele Connecties**: Verbind blokken door ze aan elkaar te koppelen
- 🎯 **Minimalistisch Design**: Geen clutter, alleen de essentials

## 🚀 Quick Start

1. Open `index.html` in je browser
2. Sleep een **Data Input** block naar het canvas
3. Dubbelklik op het block en laad een CSV bestand (bijv. `sample-data.csv`)
4. Sleep een **Data View** block naar het canvas
5. Verbind de blocks door te klikken op de output connector (⚪ onderaan) van Data Input en sleep naar de input connector (⚪ bovenaan) van Data View
6. Dubbelklik op Data View om de data te bekijken

## 📁 Project Structuur

```
minimal-etl-modeler/
├── index.html                    # Hoofd HTML bestand
├── style.css                     # Minimalistisch styling
├── app.js                        # Core functionaliteit
├── sample-data.csv               # Voorbeeld SAP data
├── README.md                     # Deze file
├── QUICKSTART.md                 # Snelle start gids
├── GEBRUIKERSHANDLEIDING.md      # Uitgebreide handleiding
├── ARCHITECTURE.md               # Technische architectuur
└── demo.html                     # Demo pagina
```

## 🎨 Design Filosofie

- **Lightweight**: Geen externe dependencies, pure vanilla JavaScript
- **Scalable**: Modulaire architectuur voor toekomstige uitbreidingen
- **Minimalistic**: Clean interface met alleen de noodzakelijke features
- **0 Clutter**: Focus op functionaliteit zonder afleidingen

## 🔧 Gebruik

### Data Input Block
- Ondersteunt CSV bestanden
- Automatische parsing van headers
- Toont aantal rijen en kolommen

### Data View Block
- Tabelweergave van data
- Sticky headers voor gemakkelijk scrollen
- Limiet van 100 rijen voor performance

### Automapper Block ✨ NEW
- Automatische kolom mapping tussen input en output templates
- Smart matching algoritme met 3 niveaus:
  - **Exact match**: Identieke kolomnamen (na normalisatie)
  - **Partial match**: Gedeeltelijke overeenkomst (bijv. "Material" ↔ "MaterialNumber")
  - **Fuzzy match**: Vergelijkbare kolomnamen op basis van karakterovereenkomst
- Visuele confidence indicators per mapping
- Preview van voorgestelde mappings met highlighting van niet-gematchte kolommen
- Twee actiemogelijkheden:
  - **Apply Auto-Mappings**: Direct toepassen voor snelle transformatie
  - **Send to Mapping Block**: Overdragen naar Mapping block voor handmatige aanpassingen
- Normalisatie: automatisch lowercase, verwijderen van underscores/spaties/hyphens

### Mapping Block
- Handmatige kolom mapping
- Kan mappings ontvangen van Automapper block
- Ondersteunt zowel template-based als free-form mapping
- Toepassen van mapping transformaties

### Transform Block
- Map input kolommen naar output kolommen
- Transformeer data volgens mapping regels
- Exporteer getransformeerde data als CSV
- Download functionaliteit voor output bestanden

### Connecties
- Sleep van output (onderste connector) naar input (bovenste connector)
- Data wordt automatisch doorgegeven via connecties
- Visuele curved lines tonen data flow

## 📝 Toekomstige Uitbreidingen

- Meer transformatie opties (filters, aggregaties)
- Save/Load ETL flows
- Real-time data preview
- Meer SAP-specifieke transformaties

## 🧪 Tests

Het project bevat uitgebreide tests voor alle functionaliteiten:

```bash
node test-mapping.js                  # Test mapping functionaliteit (9 tests)
node test-automapper.js               # Test automapper functionaliteit (12 tests)
node test-automapper-integration.js   # Test complete data flow (10 tests)
```

## 🔄 Aanbevolen Workflow

**Snelle mapping met Automapper:**
1. Data Input → Laad bron CSV
2. Target Structure → Laad template CSV
3. Automapper → Verbind met beide, genereer mappings
4. Optie A: Apply direct voor snelle transformatie
5. Optie B: Send to Mapping → handmatige aanpassingen → Transform
6. Output Data → Exporteer resultaat

**Handmatige mapping:**
1. Data Input → Laad bron CSV
2. Mapping → Handmatig kolommen mappen
3. Transform → Transformeer en exporteer
4. Output Data → Exporteer resultaat
## ⚡ Performance

### Optimale Dataset Groottes
- **Aanbevolen**: < 10,000 rijen, < 50 kolommen
- **Maximum**: 50,000 rijen, < 100 kolommen
- **File grootte**: < 50 MB voor beste prestaties

### Performance Tips
- Data View toont automatisch eerste 100 rijen voor snelheid
- Grote bestanden kunnen browser vertragen
- Gebruik filters om datasets te verkleinen waar mogelijk

## 🔒 Beveiliging & Privacy

### Data Privacy
- ✅ Alle data blijft lokaal in je browser
- ✅ Geen data wordt naar externe servers gestuurd
- ✅ Geen tracking of analytics
- ✅ Data wordt gewist bij page refresh

### Veilig Gebruik
- Valideer altijd je CSV bestanden voor gebruik
- Check output data voor correctheid
- XSS bescherming ingebouwd voor data display

## 📚 Documentatie

- **[CSV Format Guide](CSV-GUIDE.md)** - CSV bestand vereisten en best practices
- **[Architecture](ARCHITECTURE.md)** - Technische architectuur en design patterns
- **[Quick Start](QUICKSTART.md)** - Snelle start gids
- **[User Guide](GEBRUIKERSHANDLEIDING.md)** - Uitgebreide gebruikershandleiding

## 🐛 Bekende Beperkingen

- Escaped quotes binnen CSV waarden (bijv. `"value with ""quotes"""`) nog niet ondersteund
- Newlines binnen quoted CSV waarden niet ondersteund
- Maximum bestandsgrootte afhankelijk van browser geheugen
- Canvas kan onoverzichtelijk worden met >50 blocks

**Let op:** Basis quoted values met commas worden WEL ondersteund (bijv. `"value, with comma"`)

