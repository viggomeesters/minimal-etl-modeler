# Gebruikershandleiding - Minimal ETL Modeler

## Introductie

De Minimal ETL Modeler is een eenvoudige, visuele tool voor het transformeren van SAP data. Deze handleiding helpt je om snel aan de slag te gaan.

## Aan de slag

### 1. Open de applicatie

**Optie A: Direct via bestand**
Open `index.html` in je webbrowser (Chrome, Firefox, Safari, of Edge). Dit werkt prima voor het laden van lokale CSV bestanden via de bestandskiezer.

**Optie B: Via lokale server (aanbevolen)**
Voor optimale werking, start een lokale webserver:

```bash
# Met Python 3
python3 -m http.server 8000

# Of met Node.js
npx http-server -p 8000
```

Open vervolgens `http://localhost:8000` in je browser.

> **Tip**: Een lokale server is alleen nodig als je externe CSV bestanden wilt laden via URL of als je browser strikte CORS-restricties heeft. Voor normale gebruik met lokale bestanden is dit niet vereist.

### 2. Bouw je eerste ETL flow

#### Stap 1: Data laden
1. Sleep een **Data Input** block (📥) van de toolbox naar het canvas
2. Dubbelklik op het Data Input block
3. Klik op "Choose File" en selecteer een CSV bestand
   - Je kunt `sample-data.csv` gebruiken om te testen
4. Het block toont nu het aantal geladen rijen

#### Stap 2: Data bekijken
1. Sleep een **Data View** block (👁️) naar het canvas
2. Verbind de blocks:
   - Klik op de **onderste** connector (⚪) van het Data Input block
   - Sleep naar de **bovenste** connector (⚪) van het Data View block
3. Dubbelklik op het Data View block om de data te zien

### 3. Blocks beheren

#### Een block verplaatsen
- Klik en sleep het block naar de gewenste positie

#### Een block verwijderen
- Klik op de **✕** knop in de rechterbovenhoek van het block

## Componenten

### Data Input (📥)
- **Doel**: CSV bestanden inladen
- **Configuratie**: Dubbelklik om een bestand te selecteren
- **Output**: Parsed CSV data als array van objecten

### Data View (👁️)
- **Doel**: Data visualiseren in tabel vorm
- **Input**: Vereist connectie met een Data Input block
- **Features**: 
  - Automatische tabel weergave
  - Sticky headers voor scrollen
  - Toont max. 100 rijen voor performance

### Target Structure (📤)
- **Doel**: Output template/structuur definiëren
- **Configuratie**: Upload CSV met gewenste output kolommen
- **Gebruik**: Nodig voor Automapper en Transform blocks

### Automapper (🤖) ✨ NIEUW
- **Doel**: Automatisch kolommen mappen tussen input en output
- **Input**: Vereist connectie met Data Input én Target Structure
- **Functionaliteit**:
  - Genereert automatisch kolom mappings
  - Gebruikt smart matching (exact, partial, fuzzy)
  - Toont confidence level per mapping
  - Highlight van niet-gematchte kolommen
  - Toont unmapped input kolommen
- **Acties**:
  - **Apply Auto-Mappings**: Direct toepassen en data transformeren
  - **Send to Mapping Block**: Overdragen naar Mapping block voor handmatige aanpassingen
- **Matching Types**:
  - ✓ **Exact**: Perfecte match na normalisatie (bijv. "Material_Number" = "materialnumber")
  - ≈ **Partial**: Gedeeltelijke match (bijv. "Material" bevat in "MaterialNumber")
  - ~ **Fuzzy**: Vergelijkbare strings op basis van karakterovereenkomst
  - ❓ **Unmatched**: Geen match gevonden

### Mapping (🔗)
- **Doel**: Handmatig kolommen mappen of aanpassen van auto-mappings
- **Input**: Data Input block of Automapper output
- **Configuratie**: 
  - Selecteer voor elke output kolom een input kolom
  - Kan pre-filled zijn vanuit Automapper
  - Toevoegen/verwijderen van mappings
- **Output**: Gemapte data klaar voor transformatie

## Workflow Voorbeelden

### Workflow 1: Snelle mapping met Automapper
**Ideaal voor**: Datasets met vergelijkbare kolomnamen

1. Sleep **Data Input** naar canvas → Laad source CSV (bijv. `sample-data.csv`)
2. Sleep **Target Structure** naar canvas → Laad template CSV (bijv. `sample-template.csv`)
3. Sleep **Automapper** naar canvas
4. Verbind **Data Input** → **Automapper**
5. Verbind **Target Structure** → **Automapper** (of andersom)
6. Dubbelklik op **Automapper** → Bekijk auto-generated mappings
7. Kies een van de volgende opties:
   - **Apply Auto-Mappings**: Direct toepassen als mappings goed zijn
   - **Send to Mapping Block**: Overdragen voor verdere aanpassingen
8. (Optioneel) Sleep **Data View** om resultaat te bekijken
9. Sleep **Output Data** → Exporteer als CSV

**Voordelen**: 
- Bespaart tijd bij grote datasets
- Reduceert handmatige fouten
- Directe feedback over match quality

### Workflow 2: Automapper + Handmatige aanpassingen
**Ideaal voor**: Complexe mappings met enkele aanpassingen

1. Volg stap 1-7 van Workflow 1
2. Kies **Send to Mapping Block** in Automapper
3. Een nieuw Mapping block wordt automatisch aangemaakt
4. Dubbelklik op **Mapping block** 
5. Pas de auto-mappings aan waar nodig
6. Klik **Apply Mapping**
7. Sleep **Transform** → Verbind met Mapping
8. Dubbelklik Transform → Apply Transform
9. Sleep **Output Data** → Exporteer

**Voordelen**: 
- Combineert snelheid van auto-mapping met flexibiliteit
- Ideaal voor 80/20 regel: 80% automatisch, 20% handmatig

### Workflow 3: Volledig handmatig
**Ideaal voor**: Unieke transformaties zonder template

1. Sleep **Data Input** → Laad CSV
2. Sleep **Mapping** → Verbind met Data Input
3. Dubbelklik Mapping → Handmatig kolommen mappen
4. Klik **Apply Mapping**
5. Sleep **Data View** (optioneel) om te verifiëren
6. Sleep **Output Data** → Exporteer

## Tips & Tricks

### CSV Formaat
- Eerste rij moet headers bevatten
- Gebruik komma's (`,`) als scheiding
- Geen quotes nodig voor tekst velden

### Automapper Tips
- **Best practices**:
  - Gebruik consistente naamgeving in je datasets
  - Templates met duidelijke kolomnamen geven betere matches
  - Check altijd de confidence indicators (✓ ≈ ~ ❓)
- **Wanneer te gebruiken**:
  - Bij herhalende mappings tussen vergelijkbare datasets
  - Voor grote datasets met veel kolommen (>10)
  - Als eerste stap voor snelle setup
- **Beperkingen**:
  - Werkt het best met Engelse/alfanumerieke kolomnamen
  - Speciale karakters en cijfers kunnen matching beïnvloeden
  - Complexe business logic vereist handmatige mapping

### Performance
- Grote bestanden (>1000 rijen) kunnen traag laden
- Data View toont alleen de eerste 100 rijen

### Keyboard Shortcuts
Momenteel geen shortcuts - alles werkt met muis/drag-and-drop

## Veelgestelde vragen

**Q: Welke bestandsformaten worden ondersteund?**
A: Op dit moment alleen CSV bestanden.

**Q: Kan ik mijn ETL flow opslaan?**
A: Dit is nog niet beschikbaar in deze POC versie.

**Q: Hoe werkt de Automapper precies?**
A: De Automapper gebruikt een intelligent matching algoritme met drie niveaus:
1. **Exact match**: Kolomnamen zijn identiek na normalisatie (lowercase, geen underscores/spaties)
2. **Partial match**: Een kolomnaam bevat de andere (bijv. "Material" in "MaterialNumber")
3. **Fuzzy match**: Vergelijkbare strings op basis van karakterovereenkomst

**Q: Wanneer moet ik Automapper gebruiken vs handmatige Mapping?**
A: Gebruik Automapper wanneer:
- Input en output kolommen vergelijkbare namen hebben
- Je snel wilt starten en later wilt verfijnen
- Je veel kolommen hebt (>10) en handmatig werk wilt besparen

Gebruik handmatige Mapping wanneer:
- Kolomnamen volledig verschillend zijn
- Je complexe business logic moet toepassen
- Je volledige controle wilt over elke mapping

**Q: Kan ik auto-mappings aanpassen?**
A: Ja! Gebruik de "Send to Mapping Block" knop in de Automapper. Dit maakt automatisch een Mapping block aan met de auto-generated mappings, die je dan handmatig kunt aanpassen.

**Q: Wat betekenen de confidence indicators?**
A: 
- ✓ (groen) = Exact match - zeer betrouwbaar
- ≈ (oranje) = Partial match - controleer aanbevolen
- ~ (oranje) = Fuzzy match - verificatie nodig
- ❓ (grijs) = Unmatched - handmatige mapping vereist

**Q: Werkt dit met grote datasets?**
A: De POC is geoptimaliseerd voor kleinere datasets (<10,000 rijen).

## Support

Voor vragen of problemen, zie de GitHub repository.
