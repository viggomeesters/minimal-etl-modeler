# Minimal ETL Modeler

Een lightweight, schaalbare en minimalistische ETL modeler geïnspireerd op Alteryx Designer, speciaal voor SAP data transformatie.

![Example ETL Flow](screenshot-example-flow.png)

## ✨ Features

- 📥 **Data Input**: Laad CSV bestanden met SAP data
- 👁️ **Data View**: Bekijk en verifieer je data
- 🤖 **Automapper**: Automatische kolom mapping met smart matching algoritme
- 🔗 **Mapping**: Map kolommen tussen input en output formaten (handmatig of vanuit Automapper)
- 🔄 **Individuele Transformatie Blocks**: ✨ **NIEUW** - Visuele transformatie blokken voor betere flow zichtbaarheid
  - ➕ **Concatenate**: Voeg kolommen samen
  - ✂️ **Split**: Split kolommen op delimiter
  - 🔤 **Case Change**: Wijzig hoofdletters
  - 🔢 **Math**: Bereken met getallen
  - 🔍 **Regex Replace**: Vervang tekst patronen
  - 📅 **Date Format**: Formatteer datums
  - 📝 **Expression**: Evalueer expressies
  - 📋 **Copy/Rename**: Kopieer/hernoem kolommen
  - 🔀 **Join**: Voeg twee datasets samen ✨ **NIEUW**
- ⚙️ **Transform (Legacy)**: Complete transformatie block voor complexe bewerkingen
- 🔗 **Visuele Connecties**: Verbind blokken door ze aan elkaar te koppelen
- 🎯 **Minimalistisch Design**: Geen clutter, alleen de essentials

## 🚀 Quick Start

### Optie 1: Direct in browser (aanbevolen voor lokale bestanden)
1. Open `index.html` in je browser
2. Sleep een **Data Input** block naar het canvas
3. Dubbelklik op het block en laad een CSV bestand (bijv. `sample-data.csv`)
4. Sleep een **Data View** block naar het canvas
5. Verbind de blocks door te klikken op de output connector (⚪ onderaan) van Data Input en sleep naar de input connector (⚪ bovenaan) van Data View
6. Dubbelklik op Data View om de data te bekijken

### Optie 2: Met lokale server (voor geavanceerde features)
Voor optimale werking, vooral wanneer je externe CSV bestanden wilt laden via URL, gebruik een lokale webserver:

```bash
# Met Python 3
python3 -m http.server 8000

# Of met Node.js (npx)
npx http-server -p 8000
```

Open vervolgens: `http://localhost:8000`

> **Note**: De applicatie gebruikt FileReader API voor lokale bestanden, wat werkt zonder server. Een lokale server is alleen nodig als je externe CSV bestanden wilt laden via fetch() of als je browser strikte CORS-restricties heeft.

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

### Transformatie Blocks ✨ NIEUW
Individuele blocks voor elk transformatie type - verbeter de visuele duidelijkheid van je data flow:

- **➕ Concatenate**: Voeg meerdere kolommen samen met een scheidingsteken
- **✂️ Split**: Split een kolom op een delimiter en extraheer een specifiek deel
- **🔤 Case Change**: Wijzig tekstkapitalisatie (UPPERCASE, lowercase, Capitalize)
- **🔢 Math**: Voer mathematische bewerkingen uit (optellen, aftrekken, vermenigvuldigen, delen)
- **🔍 Regex Replace**: Zoek en vervang tekst met reguliere expressies
- **📅 Date Format**: Parse en herformatteer datums
- **📝 Expression**: Evalueer expressies met kolom waarde substitutie
- **📋 Copy/Rename**: Kopieer of hernoem kolommen
- **🔀 Join**: Voeg twee datasets samen op basis van matching sleutels

Zie [SPLIT-TRANSFORM-BLOCKS-GUIDE.md](SPLIT-TRANSFORM-BLOCKS-GUIDE.md) voor uitgebreide documentatie.

### Join Block ✨ NIEUW
- Voeg twee datasets samen op basis van matching kolommen
- Ondersteunt 4 join types:
  - **Inner Join**: Alleen matching records
  - **Left Join**: Alle records uit linker dataset + matches
  - **Right Join**: Alle records uit rechter dataset + matches  
  - **Full Outer Join**: Alle records uit beide datasets
- Vereist twee input connecties
- Automatische conflict resolutie voor kolommen met dezelfde naam
- Visuele preview van beide datasets voor de join

### Transform Block (Legacy)
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
node test-mapping.js                   # Test mapping functionaliteit (9 tests)
node test-automapper.js                # Test automapper functionaliteit (12 tests)
node test-automapper-integration.js    # Test complete data flow (10 tests)
node test-advanced-transform.js        # Test transformatie operaties (20 tests)
node test-split-transform-blocks.js    # Test individuele transformatie blocks (12 tests)
node test-join.js                      # Test join functionaliteit (10 tests)
```

## 🔄 Aanbevolen Workflows

**Met Join block voor dataset combinatie:** ✨ NIEUW
1. Data Input 1 → Laad eerste dataset (bijv. employees.csv)
2. Data Input 2 → Laad tweede dataset (bijv. departments.csv)
3. Join → Verbind beide inputs, selecteer join type en keys
4. Data View → Preview samengevoegde resultaat
5. Output Data → Exporteer gecombineerde dataset

**Met visuele transformatie blocks:** ✨ NIEUW
1. Data Input → Laad bron CSV
2. Concatenate → Voeg kolommen samen (bijv. voornaam + achternaam)
3. Split → Extraheer domein uit email
4. Case Change → Normaliseer tekst
5. Math → Bereken totalen
6. Data View → Preview resultaat
7. Output Data → Exporteer resultaat

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
3. Transform (Legacy) → Transformeer en exporteer
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

