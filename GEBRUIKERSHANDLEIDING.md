# Gebruikershandleiding - Minimal ETL Modeler

## Introductie

De Minimal ETL Modeler is een eenvoudige, visuele tool voor het transformeren van SAP data. Deze handleiding helpt je om snel aan de slag te gaan.

## Aan de slag

### 1. Open de applicatie
Open `index.html` in je webbrowser (Chrome, Firefox, Safari, of Edge).

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

## Tips & Tricks

### CSV Formaat
- Eerste rij moet headers bevatten
- Gebruik komma's (`,`) als scheiding
- Geen quotes nodig voor tekst velden

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

**Q: Hoe kan ik data transformeren?**
A: Transform blocks komen in een toekomstige versie.

**Q: Werkt dit met grote datasets?**
A: De POC is geoptimaliseerd voor kleinere datasets (<10,000 rijen).

## Support

Voor vragen of problemen, zie de GitHub repository.
