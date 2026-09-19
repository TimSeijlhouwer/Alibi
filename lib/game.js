// Alibi — spelregels, puntentelling, persoonlijke opdrachten en eindafrekening.
// Punten blijven tijdens het spel verborgen; pas bij de onthulling wordt alles
// in één keer uitgerekend. Bij 7+ spelers zijn er twee schuldigen.

export const DUO_THRESHOLD = 7;
export const ZOEKACTIES = 2; // onderzoekspunten per speler

export const SCORE = {
  ROUND_CORRECT: 3, // r1, r2 en r3 goed
  CLUE_KEY: 3, // sleutelspoor gevonden
  CLUE_MINOR: 1, // gewoon spoor gevonden
  TIMELINE_POSITION: 1, // per gebeurtenis op de juiste plek
  TIMELINE_PERFECT: 3, // hele tijdlijn goed
  IMPOSTER_PER_MISS: 2, // per burger die een ronde fout heeft
  FINAL_DADER: 5,
  FINAL_DETAIL: 2, // locatie / wapen / motief
  FINAL_HANDLANGER: 3,
  IMPOSTER_PER_WRONG_ACCUSATION: 4,
  IMPOSTER_ESCAPE: 10,
  HANDLANGER_ESCAPE: 5,
  GOAL_BONUS: 4, // persoonlijke opdracht gehaald
};

// ---- Persoonlijke opdrachten ----
// Alle opdrachten zijn door het spel zelf te controleren, zodat er nooit
// discussie ontstaat. Ze duwen spelers subtiel uit elkaar.

export const BURGER_GOALS = [
  {
    id: "verzamelaar",
    title: "Verzamelaar",
    text: "Vind tijdens de onderzoeksronde minstens twee sporen.",
  },
  {
    id: "speurneus",
    title: "Speurneus",
    text: "Vind minstens één spoor dat er écht toe doet.",
  },
  {
    id: "kroongetuige",
    title: "Kroongetuige",
    text: "Heb zowel het kruisverhoor als het bewijs goed.",
  },
  {
    id: "profiler",
    title: "Profiler",
    text: "Wijs in het deductieraster de juiste verdachte aan.",
  },
  {
    id: "scherpschutter",
    title: "Scherpschutter",
    text: "Zet de hele reconstructie in de juiste volgorde.",
  },
  {
    id: "eenling",
    title: "Eenling",
    text: "Beschuldig in je eindbeschuldiging iemand die verder niemand aanwijst.",
  },
  {
    id: "diplomaat",
    title: "Diplomaat",
    text: "Beschuldig dezelfde persoon als de meeste anderen.",
  },
  {
    id: "kenner",
    title: "Kenner",
    text: "Heb in je eindbeschuldiging locatie, wapen én motief goed.",
  },
];

export const DADER_GOAL = {
  id: "misleider",
  title: "Misleider",
  text: "Zorg dat minstens twee rechercheurs de verkeerde dader aanwijzen.",
};

export function goalById(id) {
  if (id === DADER_GOAL.id) return DADER_GOAL;
  return BURGER_GOALS.find((g) => g.id === id) || null;
}

export function sameSet(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  const s = new Set(a);
  return b.every((x) => s.has(x));
}

// Wat vindt een speler in de kamers die hij doorzocht?
export function findingsFor(map, rooms, wipedClueId) {
  const found = [];
  const verstoord = [];
  for (const roomId of rooms || []) {
    const inRoom = map.clues.filter((c) => c.room === roomId);
    const gewist = inRoom.some((c) => c.id === wipedClueId);
    if (gewist) verstoord.push(roomId);
    for (const c of inRoom) {
      if (c.id !== wipedClueId) found.push(c);
    }
  }
  return { found, verstoord };
}

export function computeResults(map, state) {
  const players = state.players || {};
  const answers = state.answers || {};
  const imposters = state.imposters || [];
  const daderPid = state.dader;
  const accomplicePid = state.accomplice || null;
  const goals = state.goals || {};
  const wiped = state.flags?.wiped || null;
  const ids = Object.keys(players);
  const citizens = ids.filter((id) => !imposters.includes(id));

  const perPlayer = {};
  for (const id of ids) {
    perPlayer[id] = {
      score: 0, r1: null, r2: null, r3: null, final: null,
      sporen: 0, sleutelsporen: 0, tijdlijn: 0, tijdlijnPerfect: false,
      goalId: goals[id] || null, goalDone: false,
    };
  }
  const giveImposters = (pts) => {
    for (const imp of imposters) perPlayer[imp].score += pts;
  };

  // Ronde 1 — alibi-kruisverhoor
  for (const id of citizens) {
    const a = answers.r1?.[id];
    const ok = !!a && sameSet(a.pair || [], map.r1.answerPair);
    perPlayer[id].r1 = ok;
    if (ok) perPlayer[id].score += SCORE.ROUND_CORRECT;
    else giveImposters(SCORE.IMPOSTER_PER_MISS);
  }

  // Ronde 2 — welk bewijs doet ertoe
  for (const id of citizens) {
    const a = answers.r2?.[id];
    const ok = !!a && a.choice === map.r2.answer;
    perPlayer[id].r2 = ok;
    if (ok) perPlayer[id].score += SCORE.ROUND_CORRECT;
    else giveImposters(SCORE.IMPOSTER_PER_MISS);
  }

  // Onderzoeksronde — gevonden sporen (geldt voor iedereen, ook de schuldigen)
  for (const id of ids) {
    const a = answers.search?.[id];
    const { found } = findingsFor(map, a?.rooms, wiped);
    perPlayer[id].sporen = found.length;
    perPlayer[id].sleutelsporen = found.filter((c) => c.key).length;
    if (!imposters.includes(id)) {
      for (const c of found) {
        perPlayer[id].score += c.key ? SCORE.CLUE_KEY : SCORE.CLUE_MINOR;
      }
    }
  }

  // Reconstructie — volgorde
  const correctOrder = map.timeline.events.map((e) => e.id);
  for (const id of citizens) {
    const a = answers.timeline?.[id];
    const order = a?.order || [];
    let goed = 0;
    correctOrder.forEach((eid, i) => {
      if (order[i] === eid) goed += 1;
    });
    perPlayer[id].tijdlijn = goed;
    perPlayer[id].score += goed * SCORE.TIMELINE_POSITION;
    if (goed === correctOrder.length) {
      perPlayer[id].tijdlijnPerfect = true;
      perPlayer[id].score += SCORE.TIMELINE_PERFECT;
    } else {
      giveImposters(SCORE.IMPOSTER_PER_MISS);
    }
  }

  // Ronde 3 — deductieraster
  for (const id of citizens) {
    const a = answers.r3?.[id];
    const ok = !!a && a.suspect === map.guiltyCharacter;
    perPlayer[id].r3 = ok;
    if (ok) perPlayer[id].score += SCORE.ROUND_CORRECT;
    else giveImposters(SCORE.IMPOSTER_PER_MISS);
  }

  // Eindbeschuldiging
  const daderVotes = {};
  for (const id of citizens) {
    const a = answers.final?.[id];
    if (a?.dader) daderVotes[a.dader] = (daderVotes[a.dader] || 0) + 1;
  }
  const meestGekozen = Object.entries(daderVotes).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  let correctAccusations = 0;
  let handlangerHits = 0;
  for (const id of citizens) {
    const a = answers.final?.[id] || {};
    const daderOk = a.dader === daderPid;
    const f = {
      dader: daderOk,
      locatie: a.locatie === map.solution.locatie,
      wapen: a.wapen === map.solution.wapen,
      motief: a.motief === map.solution.motief,
      handlanger: accomplicePid ? a.handlanger === accomplicePid : null,
      keuze: a.dader || null,
    };
    perPlayer[id].final = f;
    if (daderOk) {
      perPlayer[id].score += SCORE.FINAL_DADER;
      correctAccusations += 1;
    } else {
      giveImposters(SCORE.IMPOSTER_PER_WRONG_ACCUSATION);
    }
    for (const k of ["locatie", "wapen", "motief"]) {
      if (f[k]) perPlayer[id].score += SCORE.FINAL_DETAIL;
    }
    if (accomplicePid && f.handlanger) {
      perPlayer[id].score += SCORE.FINAL_HANDLANGER;
      handlangerHits += 1;
    }
  }

  const caught = correctAccusations > citizens.length / 2;
  if (!caught) giveImposters(SCORE.IMPOSTER_ESCAPE);

  const handlangerFound = accomplicePid ? handlangerHits > citizens.length / 2 : null;
  if (caught && accomplicePid && !handlangerFound) {
    perPlayer[accomplicePid].score += SCORE.HANDLANGER_ESCAPE;
  }

  // Persoonlijke opdrachten
  const foutieveAanwijzingen = citizens.length - correctAccusations;
  for (const id of ids) {
    const p = perPlayer[id];
    const gid = p.goalId;
    if (!gid) continue;
    let done = false;
    if (gid === DADER_GOAL.id) {
      done = foutieveAanwijzingen >= 2;
    } else if (gid === "verzamelaar") {
      done = p.sporen >= 2;
    } else if (gid === "speurneus") {
      done = p.sleutelsporen >= 1;
    } else if (gid === "kroongetuige") {
      done = p.r1 === true && p.r2 === true;
    } else if (gid === "profiler") {
      done = p.r3 === true;
    } else if (gid === "scherpschutter") {
      done = p.tijdlijnPerfect;
    } else if (gid === "eenling") {
      const keuze = p.final?.keuze;
      done = !!keuze && daderVotes[keuze] === 1;
    } else if (gid === "diplomaat") {
      const keuze = p.final?.keuze;
      done = !!keuze && keuze === meestGekozen && daderVotes[keuze] > 1;
    } else if (gid === "kenner") {
      done = !!p.final && p.final.locatie && p.final.wapen && p.final.motief;
    }
    p.goalDone = done;
    if (done) p.score += SCORE.GOAL_BONUS;
  }

  const rankedCitizens = citizens
    .map((id) => ({ id, name: players[id]?.name || "?", score: perPlayer[id].score }))
    .sort((a, b) => b.score - a.score);

  return {
    caught, correctAccusations, citizens, imposters, daderPid, accomplicePid,
    handlangerFound, perPlayer, wiped,
    bestRechercheur: rankedCitizens[0] || null,
    rankedCitizens,
  };
}

export function makeCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let out = "";
  for (let i = 0; i < 4; i += 1) {
    out += letters[Math.floor(Math.random() * letters.length)];
  }
  return out;
}

export function getPlayerId() {
  if (typeof window === "undefined") return null;
  let id = window.localStorage.getItem("dossier_pid");
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem("dossier_pid", id);
  }
  return id;
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
