// Alibi — de maps.
// Elke map: 8 personages, een dader (bij 7+ spelers ook een handlanger),
// vijf rondes met eigen verhaal, en een eigen oplossing.

const reinhart = {
  id: "reinhart",
  title: "Storm op Huize Reinhart",
  setting: "landhuis",
  tagline:
    "Gastheer Victor Reinhart is dood gevonden in zijn wijnkelder. Buiten raast de storm — niemand kon weg. Eén van jullie heeft het gedaan.",
  minPlayers: 4,
  maxPlayers: 8,

  characters: [
    { id: "clara", name: "Clara", role: "zakenpartner" },
    { id: "daniel", name: "Daniël", role: "schoonzoon" },
    { id: "isabel", name: "Isabel", role: "huishoudster" },
    { id: "ruben", name: "Ruben", role: "jeugdvriend" },
    { id: "ties", name: "Ties", role: "neef en erfgenaam" },
    { id: "margot", name: "Margot", role: "zus van Victor" },
    { id: "otto", name: "Otto", role: "wijnhandelaar" },
    { id: "fleur", name: "Fleur", role: "verloofde van Ties" },
  ],

  guiltyCharacter: "isabel",
  accompliceCharacter: "otto",

  solution: {
    locatie: "de wijnkelder",
    wapen: "gif in de wijn",
    motief: "ontslag en aangifte wegens diefstal",
  },

  imposterBriefing:
    "Jij bent de dader. Gisteravond om negen uur heb jij Victor in de wijnkelder ontmoet en gif in zijn glas gedaan. Hij zou je vandaag ontslaan én aangeven wegens diefstal. Jouw verklaring over Ruben is verzonnen — dat is de barst in je alibi. Stuur de groep weg van de keuken, weg van het gif, en vooral: weg van jou.",
  accompliceBriefing:
    "Jij bent de handlanger. Jij regelde het gif via je handel en stond buiten op de uitkijk terwijl Isabel het deed. Jouw verklaring dekt haar zonder aantoonbaar te liegen. Bevestig haar verhaal waar het kan, en houd de aandacht ver van de keuken.",

  alibis: {
    clara:
      "Ik zat van negen tot half tien in de studeerkamer, aan de telefoon met een klant. Daniël liep op een gegeven moment langs de deur.",
    daniel:
      "Ik was op de gang. Clara's deur was dicht, ik hoorde haar praten. En ik zag Isabel uit de keuken komen, ergens rond kwart over negen.",
    isabel:
      "Ik stond in de keuken, bezig met het dessert. Ruben kwam nog even een glas water halen, dat moet rond negen uur geweest zijn.",
    ruben:
      "Ik heb de hele avond in de salon bij het vuur gezeten, samen met Ties. Ik ben niet weggeweest.",
    ties:
      "Ik zat met Ruben in de salon, tot ongeveer tien over negen. Toen ben ik even naar de wc geweest en daarna teruggegaan.",
    margot:
      "Ik heb me om acht uur met migraine teruggetrokken op de logeerkamer. Ik heb niemand meer gezien tot al het tumult.",
    otto:
      "Ik stond onder het afdak bij de keukendeur een sigaar te roken. Toen ik rond kwart over negen naar binnen ging, zag ik Isabel in de keuken met het dessert bezig.",
    fleur:
      "Ik heb van negen tot half tien piano gespeeld in de muziekkamer. Vraag maar na — iedereen moet het gehoord hebben.",
  },

  npcNote: "was die avond aanwezig maar speelt niet mee. De politie nam deze verklaring eerder af.",

  rooms: [
    { id: "bibliotheek", name: "Bibliotheek" },
    { id: "logeerkamer", name: "Logeerkamer" },
    { id: "keuken", name: "Keuken" },
    { id: "hal", name: "Hal" },
    { id: "kelder", name: "Wijnkelder" },
    { id: "salon", name: "Salon" },
  ],

  clues: [
    { id: "vijzel", room: "keuken", label: "Een vijzel met wit poederrestant",
      text: "Achter de kruidenpotten staat een vijzel. Op de bodem: een fijn wit residu dat daar niet hoort.", key: true },
    { id: "tweedeglas", room: "kelder", label: "Een tweede glas, omgespoeld",
      text: "Naast Victors glas heeft een tweede glas gestaan — de kring is nog zichtbaar. Iemand heeft het meegenomen.", key: true },
    { id: "kruidenboek", room: "bibliotheek", label: "Een opengeslagen boek over kruiden",
      text: "Een naslagwerk ligt open op het hoofdstuk over giftige bessen. De rug is stijf: recent opengeslagen.", key: true },
    { id: "theedoek", room: "keuken", label: "Een natte theedoek",
      text: "Over de gootsteen hangt een doek die nog druipt. Er is hier kortgeleden iets schoongemaakt.", key: false },
    { id: "laars", room: "hal", label: "Een modderige laarsafdruk",
      text: "Eén afdruk, van buiten naar binnen. De maat komt overeen met de laarzen bij de achterdeur.", key: false },
    { id: "sigaar", room: "salon", label: "Een halfopgerookte sigaar",
      text: "In de asbak ligt een sigaar die niet is uitgedrukt maar gewoon is uitgegaan. Iemand vertrok halverwege.", key: false },
    { id: "poeders", room: "logeerkamer", label: "Migrainepoeders",
      text: "Op het nachtkastje staat een doosje poeders, half leeg. Een glas water ernaast is niet aangeraakt.", key: false },
    { id: "telefoon", room: "hal", label: "De telefoon van de haak",
      text: "De hoorn ligt naast het toestel. De lijn is al uren open — er is niemand meer aan de andere kant.", key: false },
  ],

  r1: {
    title: "Het alibi-kruisverhoor",
    intro:
      "Iedereen heeft een verklaring afgelegd over het halfuur tussen 21:00 en 21:30. Victor werd om 21:45 gevonden. Ergens wringen twee verklaringen. Overleg — en kies daarna zelf, in stilte, welke twee elkaar tegenspreken.",
    answerPair: ["isabel", "ruben"],
    hint: "Hint ontgrendeld — de wijnkelder is alléén via de keuken bereikbaar. Wie 'uit de keuken kwam', kan uit de kelder zijn gekomen.",
  },

  r2: {
    title: "Het bewijs",
    intro:
      "De recherche legt vier vondsten op tafel. Eén daarvan bewijst dat dit geen ongeluk was; de rest is ruis van een huis vol gasten. Overleg — en kies daarna zelf, in stilte, welke vondst er écht toe doet.",
    options: [
      { id: "briefje", label: "Het briefje in Victors zak",
        text: "\u201Ekelder — 21u — zoals afgesproken.\u201D Iemand had daar met hem afgesproken." },
      { id: "kandelaar", label: "De omgevallen kandelaar",
        text: "In de hal ligt een zware kandelaar op de grond, het kaarsvet nog zacht." },
      { id: "raam", label: "Het opengewaaide keukenraam",
        text: "Het raam staat op een kier en klappert in de storm. Er ligt water op de vloer." },
      { id: "agenda", label: "Victors agenda",
        text: "Volgeschreven met afspraken over de wijnhandel, tot ver in de volgende maand." },
    ],
    answer: "briefje",
    hint: "Hint ontgrendeld — die afspraak om 21:00 in de kelder was met iemand die daar mocht komen. Alleen Victor en de huishoudster hadden een keldersleutel.",
  },

  timeline: {
    title: "De reconstructie",
    intro:
      "De technische recherche heeft geluiden, getuigenissen en sporen verzameld — maar niet de volgorde. Leg ze samen in de juiste volgorde. Niemand hoeft het zeker te weten.",
    events: [
      { id: "e1", text: "Victor verlaat de eetkamer met een fles onder zijn arm." },
      { id: "e2", text: "De keldertrap kraakt onder twee paar voeten." },
      { id: "e3", text: "In de keuken wordt een glas omgespoeld." },
      { id: "e4", text: "Daniël ziet iemand uit de keuken komen." },
      { id: "e5", text: "Otto drukt zijn sigaar uit en gaat naar binnen." },
      { id: "e6", text: "Fleur stopt met pianospelen; er wordt geroepen." },
    ],
    hint: "Hint ontgrendeld — het glas werd omgespoeld vóórdat iemand de keuken uit kwam. De dader ruimde eerst op.",
  },

  r3: {
    title: "Het deductieraster",
    intro:
      "De recherche deelt haar aanwijzingen. Streep verdachten weg en kies zelf, in stilte, wie er volgens jou overblijft.",
    clues: [
      "De dader zat om kwart voor negen nog mee aan tafel. Wie zich eerder had teruggetrokken, valt af.",
      "De dader is tussen negen en half tien niet onafgebroken door anderen gehoord.",
      "Onder het afdak liggen twee sigarenpeuken en een lang spoor van as — dáár heeft iemand al die tijd gestaan.",
      "De dader was niet in de salon.",
      "De dader had een keldersleutel. Alleen Victor zelf en de huishoudster hadden er één.",
    ],
    fakeClue:
      "De kelderdeur zat van binnen op slot. De dader moet via de smalle dienstlift zijn gegaan — en alleen Daniël past daardoorheen.",
    fakeClueLabel: "Aanvullende verklaring binnengekomen",
  },

  finalOptions: {
    locaties: ["de wijnkelder", "de keuken", "de salon", "de studeerkamer", "de muziekkamer", "de hal"],
    wapens: ["gif in de wijn", "een kandelaar", "een keukenmes", "het koord van het gordijn"],
    motieven: [
      "ontslag en aangifte wegens diefstal",
      "de erfenis",
      "jaloezie",
      "een zakelijk conflict",
    ],
  },

  reveal: {
    punten: [
      "De barst in de alibi's: Isabel verzon dat Ruben in de keuken was — Ruben is nooit weggeweest. En wie 'uit de keuken kwam', kwam uit de kelder.",
      "Het briefje was het enige echte bewijs: een afspraak om 21:00 in de kelder, met iemand die een sleutel had.",
      "De vijzel in de keuken, het tweede glas in de kelder en het kruidenboek in de bibliotheek vormden samen het recept.",
    ],
    handlanger:
      "Otto regelde het gif en stond buiten op de uitkijk. Zijn sigaar onder het afdak was geen pauze — het was een post.",
    fakeUsed:
      "De \u201Eaanvullende verklaring\u201D over de dienstlift was vals — ingebracht door de dader om Daniël te framen.",
    fakeUnused: "De dader heeft de valse aanwijzing over de dienstlift níet ingezet.",
  },
};

const noordveld = {
  id: "noordveld",
  title: "Nacht op Noordveld",
  setting: "verlaten fabriek",
  tagline:
    "Tijdens een nachtelijke verkenning van de verlaten Noordveld-fabriek is organisator Boris dood gevonden onderaan de silotrap. De leuning bleek losgeschroefd. Eén van jullie heeft het gedaan.",
  minPlayers: 4,
  maxPlayers: 8,

  characters: [
    { id: "vera", name: "Vera", role: "fotografe" },
    { id: "stan", name: "Stan", role: "drone-piloot" },
    { id: "ilse", name: "Ilse", role: "studente" },
    { id: "kasper", name: "Kasper", role: "gids" },
    { id: "noor", name: "Noor", role: "verslaggeefster" },
    { id: "dex", name: "Dex", role: "klimmer" },
    { id: "mila", name: "Mila", role: "geluidstechnicus" },
    { id: "joeri", name: "Joeri", role: "beveiliger" },
  ],

  guiltyCharacter: "vera",
  accompliceCharacter: "stan",

  solution: {
    locatie: "de silo",
    wapen: "de losgeschroefde trapleuning",
    motief: "chantage met foto's",
  },

  imposterBriefing:
    "Jij bent de dader. Boris chanteerde je al maanden met foto's die je carrière zouden verwoesten. Vannacht heb jij de leuning van de silotrap losgeschroefd en hem naar boven gelokt. Jouw bewering dat de silo de hele nacht donker was, is de barst — er is iets gezien. Houd iedereen weg van de silo, weg van je cameratas, en vooral: weg van jou.",
  accompliceBriefing:
    "Jij bent de handlanger. Jouw drone-vlucht was het afgesproken alibi: jij bevestigt dat de dader 'op het dak' was, zonder hard te hoeven liegen. Bevestig haar verhaal waar het kan en houd de aandacht weg van de silo.",

  alibis: {
    vera:
      "Ik stond op het dak van de machinehal de skyline te fotograferen. Ik heb daarvandaan ook op de silo gericht — daar was niets te zien, die is de hele nacht donker gebleven.",
    stan:
      "Ik vloog mijn drone vanaf het dak van de machinehal. Vera stond het grootste deel van de tijd naast me; ze liep af en toe weg voor een andere hoek.",
    ilse:
      "Ik zat in de oude kantine mijn voeten te warmen bij het gaslampje, samen met Mila. We hebben thee gedeeld uit haar thermoskan.",
    kasper:
      "Ik liep vooruit om de route langs de weverij te checken. Onderweg kwam ik Dex tegen, die daar aan het klimmen was.",
    noor:
      "Ik nam een reportage op in de ketelruimte. Op de opname hoor je mij onafgebroken praten — en op de achtergrond nog van alles.",
    dex:
      "Ik klom in de weverij aan een oude takelketting. Door de kapotte ramen zag ik vlak voor twaalven twee keer een felle flits ín de silo.",
    mila:
      "Ik zat met Ilse in de kantine. Ik heb mijn recorder daar zelfs even laten meelopen voor de sfeer.",
    joeri:
      "Ik hield de hoofdingang in de gaten. Er is niemand het terrein op of af gegaan, daar durf ik voor te tekenen.",
  },

  npcNote: "was die nacht aanwezig maar speelt niet mee. Deze verklaring is eerder opgenomen.",

  rooms: [
    { id: "silo", name: "De silo" },
    { id: "machinehal", name: "Machinehal" },
    { id: "kantine", name: "Oude kantine" },
    { id: "weverij", name: "Weverij" },
    { id: "ketelruimte", name: "Ketelruimte" },
    { id: "poort", name: "Hoofdingang" },
  ],

  clues: [
    { id: "moersleutel", room: "silo", label: "Een moersleutel maat 13",
      text: "Onderaan de trap ligt een moersleutel met verse krassen op de bek. De moeren van de leuning passen er precies op.", key: true },
    { id: "lensdoek", room: "silo", label: "Een lenzendoekje",
      text: "Onder de onderste trede ligt een microvezeldoekje. Schoon, droog — het ligt hier nog geen dag.", key: true },
    { id: "negatief", room: "machinehal", label: "Een afgescheurde fotorand",
      text: "Bij de daktrap ligt de rand van een afdruk, net zo'n scheur als het strookje in Boris' binnenzak.", key: true },
    { id: "thermos", room: "kantine", label: "Een omgevallen thermoskan",
      text: "Thee over de tafel, twee bekers. Niemand heeft de moeite genomen het op te ruimen.", key: false },
    { id: "ketting", room: "weverij", label: "Een schommelende takelketting",
      text: "De ketting hangt nog na te zwaaien. Iemand heeft hier tot voor kort geklommen.", key: false },
    { id: "recorder", room: "ketelruimte", label: "Een vergeten recorder",
      text: "Een opnameapparaat staat nog te lopen. Vooral galm, een stem in de verte, en druppelend water.", key: false },
    { id: "bandje", room: "poort", label: "Doorgeknipt afzetlint",
      text: "Het lint bij de poort is doorgeknipt — maar de knip is oud en al dichtgeroest.", key: false },
    { id: "accu", room: "machinehal", label: "Een lege drone-accu",
      text: "Op de daktrap ligt een accu, helemaal leeg gevlogen. Er staat een naam op geschreven, half weggesleten.", key: false },
  ],

  r1: {
    title: "Het alibi-kruisverhoor",
    intro:
      "Iedereen heeft verklaard waar hij tussen 23:30 en middernacht was. Boris werd om 00:15 gevonden. Ergens wringen twee verklaringen. Overleg — en kies daarna zelf, in stilte, welke twee elkaar tegenspreken.",
    answerPair: ["vera", "dex"],
    hint: "Hint ontgrendeld — die flitsen in de silo waren van een camera. Wie fotografeert er midden in de nacht een trapleuning?",
  },

  r2: {
    title: "Het bewijs",
    intro:
      "Vier vondsten liggen op tafel. Eén bewijst dat dit geen ongeluk was; de rest is rommel uit een pand dat al twintig jaar leegstaat. Overleg — en kies daarna zelf, in stilte, welke er écht toe doet.",
    options: [
      { id: "strookje", label: "Het fotostrookje in Boris' binnenzak",
        text: "Een afgescheurde rand van een recente afdruk — hij had iemand iets te laten zien. Of aan te doen." },
      { id: "helm", label: "De gebarsten bouwhelm",
        text: "Naast het lichaam ligt een oude helm met een scheur erin. Hij heeft hem niet op gehad." },
      { id: "roest", label: "De roestige bouten",
        text: "De bouten van de leuning zitten vol roest. In zo'n pand valt alles vroeg of laat uit elkaar." },
      { id: "graffiti", label: "Verse graffiti op de silowand",
        text: "Een tag in fluorescerende verf, nog kleverig. Hier komen vaker mensen." },
    ],
    answer: "strookje",
    hint: "Hint ontgrendeld — Boris chanteerde iemand met foto's. Zoek degene die vannacht een camera bij zich had.",
  },

  timeline: {
    title: "De reconstructie",
    intro:
      "Uit opnames, getuigen en sporen zijn zes momenten gereconstrueerd — maar niet de volgorde. Leg ze samen goed. Niemand hoeft het zeker te weten.",
    events: [
      { id: "e1", text: "Boris kondigt aan dat hij 'even iets moet regelen' en loopt weg." },
      { id: "e2", text: "Op de silotrap wordt gereedschap gebruikt: metaal op metaal." },
      { id: "e3", text: "In de silo flitst het twee keer fel." },
      { id: "e4", text: "Iemand daalt haastig de daktrap van de machinehal af." },
      { id: "e5", text: "Dex hoort iets zwaars vallen en roept de groep." },
      { id: "e6", text: "Joeri komt met de zaklamp aanrennen vanaf de poort." },
    ],
    hint: "Hint ontgrendeld — de flitsen kwamen ná het gereedschap. Iemand legde zijn eigen werk vast voordat Boris viel.",
  },

  r3: {
    title: "Het deductieraster",
    intro:
      "De recherche deelt haar aanwijzingen. Streep verdachten weg en kies zelf, in stilte, wie er volgens jou overblijft.",
    clues: [
      "Op Noors opname is haar stem onafgebroken te horen — met op de achtergrond het kantinegesprek van twee anderen bij het gaslampje.",
      "De moeren zijn losgedraaid met een sleutel uit een gereedschapstas. Alleen de fotografe, de drone-piloot en de gids droegen er één.",
      "De gids is bij de weverij gezien — aan de andere kant van het complex, ver van de silo.",
      "De drone was de hele nacht in de lucht; wie hem vloog, stond met zijn handen aan de controller.",
      "Onder de silotrap lag een lenzendoekje.",
    ],
    fakeClue:
      "Op een oude plattegrond staat een kolentunnel die onder de silo uitkomt — en alleen de klimmer is lenig genoeg voor zo'n nauwe schacht.",
    fakeClueLabel: "Aanvullende vondst gemeld",
  },

  finalOptions: {
    locaties: ["de silo", "de machinehal", "de kantine", "de weverij", "de ketelruimte"],
    wapens: [
      "de losgeschroefde trapleuning",
      "een steigerpijp",
      "een duw in het donker",
      "een vallende katrol",
    ],
    motieven: [
      "chantage met foto's",
      "een oude schuld",
      "jaloezie binnen de groep",
      "Boris wist te veel over een inbraak",
    ],
  },

  reveal: {
    punten: [
      "De barst: Vera beweerde dat de silo de hele nacht donker was — maar Dex zag daar twee cameraflitsen. Ze fotografeerde haar eigen sabotage.",
      "Het fotostrookje was het enige echte bewijs: Boris chanteerde de dader met foto's.",
      "De moersleutel en het lenzendoekje onder de trap wezen samen naar iemand met gereedschap én een camera.",
    ],
    handlanger:
      "Stan's drone-vlucht was het afgesproken alibi: 'ze stond naast me' — behalve toen het ertoe deed.",
    fakeUsed:
      "De \u201Eaanvullende vondst\u201D over de kolentunnel was vals — ingebracht door de dader om de klimmer te framen.",
    fakeUnused: "De dader heeft de valse aanwijzing over de kolentunnel níet ingezet.",
  },
};

const wolfskuil = {
  id: "wolfskuil",
  title: "Sneeuw op de Wolfskuil",
  setting: "boshut",
  tagline:
    "Acht vrienden, één afgelegen boshut, en een sneeuwjacht die alle wegen afsloot. Hutbaas Herman is dood gevonden in de houtschuur. Eén van jullie heeft het gedaan.",
  minPlayers: 4,
  maxPlayers: 8,

  characters: [
    { id: "sofie", name: "Sofie", role: "nicht van Herman" },
    { id: "bart", name: "Bart", role: "studievriend van Sofie" },
    { id: "anouk", name: "Anouk", role: "huisarts" },
    { id: "pieter", name: "Pieter", role: "buurman en visser" },
    { id: "eva", name: "Eva", role: "schrijfster" },
    { id: "daan", name: "Daan", role: "student bouwkunde" },
    { id: "roos", name: "Roos", role: "hondentrainer" },
    { id: "guus", name: "Guus", role: "kok" },
  ],

  guiltyCharacter: "sofie",
  accompliceCharacter: "bart",

  solution: {
    locatie: "de houtschuur",
    wapen: "een houtblok van de stapel",
    motief: "de erfenis van de hut",
  },

  imposterBriefing:
    "Jij bent de dader. Herman wilde de Wolfskuil nalaten aan de natuurstichting — het nieuwe testament lag klaar om te tekenen. Jij lokte hem om half tien naar de schuur, sloeg toe met een houtblok en verbrandde het papier in de kachel. Om tien voor tien lag je weer 'te lezen' op de zolder. Jouw 'hele avond' is de barst: iemand heeft die zolder leeg gezien. Houd iedereen weg van de schuur, weg van de kachel, en vooral: weg van jou.",
  accompliceBriefing:
    "Jij bent de handlanger. Jij wist van het testament en jouw dekenbezoek aan de zolder is jullie afgesproken alibi — je zág haar daar echt liggen, vlak nádat het gebeurd was. Bevestig haar verhaal waar het kan en houd de aandacht weg van de schuur.",

  alibis: {
    sofie:
      "Ik lag de hele avond op de slaapzolder te lezen met mijn leeslampje. Bart kwam nog een extra deken brengen en heeft me daar gezien.",
    bart:
      "Ik bracht tegen tienen een deken naar de zolder; Sofie lag daar te lezen. Daarna ben ik bij de open haard gaan zitten.",
    anouk:
      "Ik kaartte aan de grote tafel met Eva en Daan. Ik ben hooguit opgestaan om bij te schenken.",
    pieter:
      "Ik stond op de veranda mijn pijp te roken, met de deur op een kier. Roos liet vlakbij de hond uit.",
    eva:
      "Ik zat te kaarten met Anouk en Daan. Guus stond achter ons in de keuken te vloeken op de soep.",
    daan:
      "Kaarten met Anouk en Eva. Ik ben één keer naar boven gelopen om mijn oplader te pakken, rond half tien — de slaapzolder was toen donker en leeg.",
    roos:
      "Ik liet Loki uit langs het pad naar de schuur. Hij trok ineens hard aan de riem, maar met die sneeuw ben ik omgedraaid. Pieter stond toen op de veranda.",
    guus:
      "Ik stond in de keuken. De soep kookte over — iedereen heeft me horen mopperen, denk ik.",
  },

  npcNote: "was dat weekend in de hut maar speelt niet mee. Deze verklaring is eerder opgenomen.",

  rooms: [
    { id: "schuur", name: "Houtschuur" },
    { id: "zolder", name: "Slaapzolder" },
    { id: "keuken", name: "Keuken" },
    { id: "woonkamer", name: "Woonkamer" },
    { id: "veranda", name: "Veranda" },
    { id: "bospad", name: "Bospad" },
  ],

  clues: [
    { id: "kachel", room: "woonkamer", label: "Halfverbrand papier in de kachel",
      text: "Tussen de as ligt een snipper waarop nog '…rfen…' leesbaar is. Het papier is zwaarder dan aanmaakhout.", key: true },
    { id: "houtblok", room: "schuur", label: "Een houtblok dat er niet hoort",
      text: "Eén blok ligt los van de stapel, met een donkere vlek op de bast en een haar eraan geplakt.", key: true },
    { id: "laarzen", room: "bospad", label: "Sporen achter de hut",
      text: "Vanaf de achterdeur loopt één spoor naar de schuur en weer terug. Kleine maat, snelle pas.", key: true },
    { id: "zaklamp", room: "schuur", label: "Hermans zaklamp",
      text: "De lamp ligt naast hem, uitgeschakeld. De batterijen zijn vol.", key: false },
    { id: "leeslamp", room: "zolder", label: "Een koud leeslampje",
      text: "Het lampje staat aan, maar het boek ligt dicht en het bed is nauwelijks ingedrukt.", key: false },
    { id: "soep", room: "keuken", label: "Overgekookte soep",
      text: "De pan is overgelopen en niemand heeft het vuur lager gezet. Guus stond er duidelijk niet de hele tijd bij.", key: false },
    { id: "pijp", room: "veranda", label: "Een uitgeklopte pijp",
      text: "Tabak in de sneeuw, en één stel laarsafdrukken dat lang op dezelfde plek heeft gestaan.", key: false },
    { id: "riem", room: "veranda", label: "Een natte hondenriem",
      text: "De riem hangt te drogen aan de haak, doorweekt tot aan de handlus.", key: false },
  ],

  r1: {
    title: "Het alibi-kruisverhoor",
    intro:
      "Iedereen heeft verklaard waar hij tussen 21:15 en 22:00 was. Herman werd om 22:30 gevonden. Ergens wringen twee verklaringen. Overleg — en kies daarna zelf, in stilte, welke twee elkaar tegenspreken.",
    answerPair: ["sofie", "daan"],
    hint: "Hint ontgrendeld — Loki sloeg rond half tien aan bij de schuur. De dader was daar toen al.",
  },

  r2: {
    title: "Het bewijs",
    intro:
      "Vier vondsten liggen op tafel. Eén verklaart waarom Herman dood is; de rest hoort bij een gewone winteravond. Overleg — en kies daarna zelf, in stilte, welke er écht toe doet.",
    options: [
      { id: "testament", label: "De snipper uit de houtkachel",
        text: "Op het halfverbrande papier staat nog '…rfen…'. Er is vanavond iets verbrand wat niet mocht verdwijnen." },
      { id: "bijl", label: "De bijl aan de muur",
        text: "De bijl hangt gewoon op zijn plek, het blad droog en stoffig." },
      { id: "sneeuw", label: "Dichtgewaaide sporen bij de voordeur",
        text: "Voor de hut is alles ondergesneeuwd. Daar valt niets meer uit af te lezen." },
      { id: "fles", label: "Een lege fles jenever",
        text: "In de schuur staat een lege fles. Herman dronk er graag een, dat wist iedereen." },
    ],
    answer: "testament",
    hint: "Hint ontgrendeld — het verbrande papier was Hermans nieuwe testament. Zonder dat papier erft de familie.",
  },

  timeline: {
    title: "De reconstructie",
    intro:
      "Uit geluiden, sporen en verklaringen zijn zes momenten gereconstrueerd — maar niet de volgorde. Leg ze samen goed. Niemand hoeft het zeker te weten.",
    events: [
      { id: "e1", text: "Herman trekt zijn jas aan en loopt naar buiten, richting de schuur." },
      { id: "e2", text: "Iemand verlaat de hut via de achterdeur." },
      { id: "e3", text: "Loki trekt hard aan de riem en blaft richting de schuur." },
      { id: "e4", text: "De klep van de houtkachel slaat dicht." },
      { id: "e5", text: "Bart loopt met een deken de zoldertrap op." },
      { id: "e6", text: "Guus gaat hout halen en vindt de schuurdeur open." },
    ],
    hint: "Hint ontgrendeld — de kachelklep ging dicht vóórdat de deken naar boven ging. Er was tijd om terug te sluipen.",
  },

  r3: {
    title: "Het deductieraster",
    intro:
      "De recherche deelt haar aanwijzingen. Streep verdachten weg en kies zelf, in stilte, wie er volgens jou overblijft.",
    clues: [
      "De drie kaarters zaten van negen tot tien onafgebroken aan tafel — dat bevestigen ze over elkaar.",
      "De kok is de hele tijd door iedereen gehoord, ook toen de soep overkookte.",
      "De verse sneeuw bij de veranda toont alleen laarzen van de pijproker en hondenpoten. Het pad naar de schuur is vanaf de áchterdeur belopen.",
      "Wie de deken naar boven bracht, was op dat moment binnen in beeld.",
      "Op Hermans jas lag een lange, donkere haar. Eén iemand in de hut heeft lang donker haar.",
    ],
    fakeClue:
      "Achter de schuur zit een riemafdruk in de sneeuw — alsof iemand daar een hond heeft vastgebonden om de wacht te houden.",
    fakeClueLabel: "Aanvullend spoor gemeld",
  },

  finalOptions: {
    locaties: ["de houtschuur", "de slaapzolder", "de keuken", "de veranda", "het bospad"],
    wapens: [
      "een houtblok van de stapel",
      "de bijl",
      "een duw tegen de houtstapel",
      "de vuurpook",
    ],
    motieven: ["de erfenis van de hut", "een oude ruzie", "een schuld bij Herman", "jaloezie"],
  },

  reveal: {
    punten: [
      "De barst: Sofie lag 'de hele avond' te lezen — maar Daan zag de zolder om half tien donker en leeg. Precies toen sloeg Loki aan bij de schuur.",
      "De snipper uit de kachel was het enige echte bewijs: Hermans nieuwe testament, dat de hut aan de natuurstichting naliet.",
      "Het losse houtblok in de schuur en het spoor vanaf de achterdeur wezen samen naar iemand die binnendoor terugsloop.",
    ],
    handlanger:
      "Barts dekenbezoek was het afgesproken alibi: hij zag Sofie écht op de zolder — vlak nadat ze was teruggeslopen.",
    fakeUsed:
      "Het \u201Eaanvullende spoor\u201D achter de schuur was vals — ingebracht door de dader om de hondentrainer te framen.",
    fakeUnused: "De dader heeft het valse spoor achter de schuur níet ingezet.",
  },
};

export const maps = { reinhart, noordveld, wolfskuil };
export const mapList = [reinhart, noordveld, wolfskuil];
export default maps;
