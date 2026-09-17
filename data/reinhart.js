// Map: Storm op Huize Reinhart
// Eén vaste zaak voor de eerste test. Later: meerdere varianten per map,
// zodat de oplossing niet elk potje hetzelfde is.

const reinhart = {
  id: "reinhart",
  title: "Storm op Huize Reinhart",
  tagline:
    "Gastheer Victor Reinhart is dood gevonden in zijn wijnkelder. Buiten raast de storm — niemand kon weg. Eén van jullie heeft het gedaan.",
  minPlayers: 4,
  maxPlayers: 5,

  characters: [
    { id: "clara", name: "Clara", role: "zakenpartner" },
    { id: "daniel", name: "Daniël", role: "schoonzoon" },
    { id: "isabel", name: "Isabel", role: "huishoudster" },
    { id: "ruben", name: "Ruben", role: "jeugdvriend" },
    { id: "ties", name: "Ties", role: "neef en erfgenaam" },
  ],

  // Het personage dat de dader is. De speler die dit personage krijgt, is de imposter.
  guiltyCharacter: "isabel",

  solution: {
    dader: "isabel",
    locatie: "wijnkelder",
    wapen: "gif in de wijn",
    motief: "ontslag en aangifte wegens diefstal",
  },

  imposterBriefing:
    "Jij bent de dader. Gisteravond om negen uur heb jij Victor in de wijnkelder ontmoet en gif in zijn glas gedaan. Hij zou je vandaag ontslaan én aangeven wegens diefstal. Jouw verklaring over Ruben is verzonnen — dat is de barst in je alibi. Stuur de groep weg van de keuken, weg van het gif, en vooral: weg van jou.",

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
  },

  npcNote:
    "was die avond aanwezig maar speelt niet mee. De politie nam deze verklaring eerder af.",

  rounds: {
    r1: {
      title: "Het alibi-kruisverhoor",
      intro:
        "Iedereen heeft een verklaring afgelegd over het halfuur tussen 21:00 en 21:30. Victor werd om 21:45 gevonden. Ergens wringen twee verklaringen. Overleg — en kies daarna zelf, in stilte, welke twee verklaringen elkaar tegenspreken.",
      // Correct: Isabel beweert dat Ruben in de keuken was; Ruben zegt dat hij nooit is weggeweest.
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
        "De dader had de keldersleutel. Alleen Victor zelf en de huishoudster hadden er één.",
        "De dader was tussen 21:00 en 21:20 níet in de salon.",
        "De dader is niet degene die onafgebroken aan de telefoon te horen was.",
        "Getuigen roken een keukengeur aan de kleding van de dader.",
      ],
      fakeClue:
        "De kelderdeur zat van binnen op slot. De dader moet via de smalle dienstlift zijn gegaan — en alleen Daniël past daardoorheen.",
      fakeClueLabel: "Aanvullende verklaring binnengekomen",
    },
  },

  finalOptions: {
    locaties: ["wijnkelder", "keuken", "salon", "studeerkamer", "de gang"],
    wapens: ["gif in de wijn", "kandelaar", "keukenmes", "koord van het gordijn"],
    motieven: [
      "ontslag en aangifte wegens diefstal",
      "de erfenis",
      "jaloezie",
      "een zakelijk conflict",
    ],
  },
};

export default reinhart;
export const maps = { reinhart };
