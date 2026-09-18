// Alibi — de maps.
// Elke map: 8 personages, een dader (en bij 7+ spelers een handlanger),
// dezelfde drie rondes met eigen verhaal, en een eigen oplossing.
// De handlanger-verklaring is altijd zó geschreven dat hij óók waar kan zijn
// als dat personage onschuldig is (bij kleinere groepen).

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

  rounds: {
    r1: {
      title: "Het alibi-kruisverhoor",
      intro:
        "Iedereen heeft een verklaring afgelegd over het halfuur tussen 21:00 en 21:30. Victor werd om 21:45 gevonden. Ergens wringen twee verklaringen. Overleg — en kies daarna zelf, in stilte, welke twee verklaringen elkaar tegenspreken.",
      answerPair: ["isabel", "ruben"],
      hint: "Hint ontgrendeld — de wijnkelder is alléén via de keuken bereikbaar. Wie 'uit de keuken kwam', kan uit de kelder zijn gekomen.",
    },
    r2: {
      title: "Het bewijs",
      intro:
        "Op de plaats delict: een wijnglas met een bittere geur, en een half briefje. Wat betekent dit? Overleg — en leg daarna zelf, in stilte, je interpretatie vast.",
      evidence:
        "\u201Ekelder — 21u — zoals afgesproken.\u201D\n\nHet glas naast Victors hand ruikt bitter.",
      options: [
        {
          id: "belastend",
          label: "Dit is opzet",
          text: "Iemand had om 21:00 met Victor in de kelder afgesproken. Het glas was vergiftigd.",
        },
        {
          id: "onschuldig",
          label: "Dit betekent niets",
          text: "Een oud briefje over een wijnbezorging. En Victor dronk elke avond een bittere aperitief.",
        },
      ],
      answer: "belastend",
      hint: "Hint ontgrendeld — het moordwapen: gif, toegediend via de wijn.",
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
  },

  finalOptions: {
    locaties: ["de wijnkelder", "de keuken", "de salon", "de studeerkamer", "de muziekkamer", "de gang"],
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
      "Het briefje en het bittere glas waren wel degelijk belastend: de afspraak om 21:00 in de kelder, en gif in de wijn.",
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

  rounds: {
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
        "Onderaan de silotrap: een moersleutel maat 13 met verse krassen. In Boris' binnenzak: een afgescheurd strookje van een fotoafdruk. Overleg — en leg daarna zelf, in stilte, je interpretatie vast.",
      evidence:
        "Een moersleutel, maat 13, verse krassen op de bek.\n\nEen afgescheurde rand van een fotoafdruk, in Boris' binnenzak.",
      options: [
        {
          id: "belastend",
          label: "Dit is opzet",
          text: "De leuning is vannacht losgeschroefd, en die foto is de reden dat Boris dood is.",
        },
        {
          id: "onschuldig",
          label: "Dit betekent niets",
          text: "In zo'n pand ligt overal gereedschap, en Boris verzamelde oude fabrieksfoto's.",
        },
      ],
      answer: "belastend",
      hint: "Hint ontgrendeld — het wapen: de losgeschroefde trapleuning. Dit was sabotage, geen ongeluk.",
    },
    r3: {
      title: "Het deductieraster",
      intro:
        "De recherche deelt haar aanwijzingen. Streep verdachten weg en kies zelf, in stilte, wie er volgens jou overblijft.",
      clues: [
        "Op Noors opname is haar stem onafgebroken te horen — met op de achtergrond het kantinegesprek van twee anderen bij het gaslampje.",
        "De moeren zijn losgedraaid met een sleutel uit een gereedschapstas. Alleen de fotografe, de drone-piloot en de gids droegen er één.",
        "De gids is bij de weverij gezien — aan de andere kant van het complex, ver van de silo.",
        "Onder de silotrap lag een lenzendoekje.",
      ],
      fakeClue:
        "Op een oude plattegrond staat een kolentunnel die onder de silo uitkomt — en alleen de klimmer is lenig genoeg voor zo'n nauwe schacht.",
      fakeClueLabel: "Aanvullende vondst gemeld",
    },
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
      "De moersleutel en het fotostrookje waren wél belastend: de leuning was vannacht losgeschroefd, en Boris chanteerde de dader met foto's.",
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

  rounds: {
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
        "In de schuur: Hermans zaklamp, uitgeschakeld. In de houtkachel: een half verbrand papier waarop nog '…rfen…' leesbaar is. De bijl hangt onaangeroerd aan de muur. Overleg — en leg daarna zelf, in stilte, je interpretatie vast.",
      evidence:
        "Hermans zaklamp: uit.\n\nIn de kachel: half verbrand papier — \u201E…rfen…\u201D is nog leesbaar.\n\nDe bijl hangt gewoon op zijn plek.",
      options: [
        {
          id: "belastend",
          label: "Dit is opzet",
          text: "Herman werd naar de schuur gelokt, en dat papier moest verdwijnen — er staat iets over erven op.",
        },
        {
          id: "onschuldig",
          label: "Dit betekent niets",
          text: "Herman stookte oud papier als aanmaak, en zijn zaklamp had gewoon lege batterijen.",
        },
      ],
      answer: "belastend",
      hint: "Hint ontgrendeld — het wapen kwam uit de schuur zelf: een houtblok van de stapel. En het verbrande papier was een testament.",
    },
    r3: {
      title: "Het deductieraster",
      intro:
        "De recherche deelt haar aanwijzingen. Streep verdachten weg en kies zelf, in stilte, wie er volgens jou overblijft.",
      clues: [
        "De drie kaarters zaten van negen tot tien onafgebroken aan tafel — dat bevestigen ze over elkaar, en de kok zag het vanuit de keuken.",
        "De kok is de hele tijd door iedereen gehoord.",
        "De verse sneeuw bij de veranda toont alleen laarzen van de pijproker en hondenpoten. Het pad naar de schuur is vanaf de áchterdeur belopen.",
        "Op Hermans jas lag een lange, donkere haar. Eén iemand in de hut heeft lang donker haar.",
      ],
      fakeClue:
        "Achter de schuur zit een riemafdruk in de sneeuw — alsof iemand daar een hond heeft vastgebonden om de wacht te houden.",
      fakeClueLabel: "Aanvullend spoor gemeld",
    },
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
      "Het halfverbrande papier was Hermans nieuwe testament: de hut zou naar de natuurstichting gaan. Zonder dat papier erft de familie.",
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
