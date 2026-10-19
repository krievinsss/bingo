# Prezentāciju BINGO

Interaktīva, mobilajām ierīcēm piemērota BINGO lietotne: **13 dažādas, fiksētas 5×5 kartītes**, tieši tādā pašā izkārtojumā kā iepriekš sagatavotajā PDF. Neizmanto datubāzi vai ārēju API.

## Palaist lokāli

Nepieciešams Node.js 20+. Projekts veidots ar tīru HTML, CSS un JavaScript (bez ārējām bibliotēkām).

```bash
npm run dev
```

Atver terminālī norādīto adresi (parasti `http://localhost:5173`).

## Ievietot Vercel

1. Izpako ZIP un augšupielādē saturu jaunā GitHub repozitorijā (`package.json` jābūt repozitorija saknē).
2. Vercel izvēlies **Add New → Project**, importē repozitoriju.
3. Framework Preset: **Other**. Build Command: `npm run build`; Output Directory: `dist` (abi norādīti arī `vercel.json`).
4. Spied **Deploy**.

Var arī lokāli pārbaudīt produkcijas versiju:

```bash
npm run build
npm run preview
```

## Kā organizēt spēli

- Sākumlapā redzamas kartītes **01–13**. Katram jaunietim iedod vienu atšķirīgu numuru un nokopē viņa kartītes saiti ar saites pogu. Piemēram, `https://tavs-projekts.vercel.app/?card=7`.
- Jaunieši spiež uz lauciņa, kad novēro tajā aprakstīto situāciju. Centrālais lauciņš ir atzīmēts automātiski.
- Lietotne automātiski pārbauda piecas atzīmes vienā rindā, kolonnā vai diagonālē un paziņo par BINGO.
- `Drukāt` ļauj izdrukāt pašreizējo kartīti; `Notīrīt` dzēš tās atzīmes **tikai pašreizējā pārlūkā**.
- Atzīmes un izvēlētais spēlētāja vārds tiek glabāti lokāli pārlūka `localStorage`, atsevišķi katram kartītes numuram. Kopējā reāllaika sinhronizācija vai skolotāja rezultātu panelis **nav iekļauts**, tādēļ jaunietis parāda uzvaras kartīti skolotājam.
- BINGO situācijas ir apzināti neitrālas: atzīmē tikai reāli dzirdēto un redzēto, neprovocē notikumus.

### Saturs un pielāgošana

Kartītes glabātas `src/cards.js`; vari labot tekstus, tomēr kartītē jāpaliek 25 laukiem, un 13. laukam jābūt `BRĪVĀ VIETA`. Visas kartītes pēc noklusējuma atbilst oriģinālajam PDF.

Projektu var izmantot bez servera datubāzes; vienīgā tīkla prasība ir statisko failu ielāde pirmreizējai apmeklēšanai.
