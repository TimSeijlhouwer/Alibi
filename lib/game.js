// Spelregels, puntentelling en de eindafrekening.
// Punten blijven tijdens het spel verborgen; pas bij de onthulling rekent
// deze functie alles in één keer uit.

export const SCORE = {
  ROUND_CORRECT: 3, // burger heeft een minigame goed
  IMPOSTER_PER_MISS: 2, // imposter: per burger die een ronde fout heeft
  FINAL_DADER: 5, // burger wijst de juiste dader aan
  FINAL_DETAIL: 2, // per juist detail: locatie / wapen / motief
  IMPOSTER_PER_WRONG_ACCUSATION: 4,
  IMPOSTER_ESCAPE: 10, // imposter wordt niet gepakt
};

export function sameSet(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  const s = new Set(a);
  return b.every((x) => s.has(x));
}

export function computeResults(map, state) {
  const players = state.players || {};
  const answers = state.answers || {};
  const imposterId = state.imposter;
  const ids = Object.keys(players);
  const citizens = ids.filter((id) => id !== imposterId);

  const perPlayer = {};
  for (const id of ids) {
    perPlayer[id] = { score: 0, r1: null, r2: null, r3: null, final: null };
  }

  // Ronde 1: welke twee alibi's spreken elkaar tegen?
  for (const id of citizens) {
    const a = answers.r1?.[id];
    const ok = !!a && sameSet(a.pair || [], map.rounds.r1.answerPair);
    perPlayer[id].r1 = ok;
    if (ok) perPlayer[id].score += SCORE.ROUND_CORRECT;
    else perPlayer[imposterId].score += SCORE.IMPOSTER_PER_MISS;
  }

  // Ronde 2: interpretatie van het bewijs
  for (const id of citizens) {
    const a = answers.r2?.[id];
    const ok = !!a && a.choice === map.rounds.r2.answer;
    perPlayer[id].r2 = ok;
    if (ok) perPlayer[id].score += SCORE.ROUND_CORRECT;
    else perPlayer[imposterId].score += SCORE.IMPOSTER_PER_MISS;
  }

  // Ronde 3: wie blijft er over in het raster?
  for (const id of citizens) {
    const a = answers.r3?.[id];
    const ok = !!a && a.suspect === map.guiltyCharacter;
    perPlayer[id].r3 = ok;
    if (ok) perPlayer[id].score += SCORE.ROUND_CORRECT;
    else perPlayer[imposterId].score += SCORE.IMPOSTER_PER_MISS;
  }

  // Eindbeschuldiging (ieder voor zich)
  let correctAccusations = 0;
  for (const id of citizens) {
    const a = answers.final?.[id] || {};
    const daderOk = a.dader === imposterId;
    const f = {
      dader: daderOk,
      locatie: a.locatie === map.solution.locatie,
      wapen: a.wapen === map.solution.wapen,
      motief: a.motief === map.solution.motief,
    };
    perPlayer[id].final = f;
    if (daderOk) {
      perPlayer[id].score += SCORE.FINAL_DADER;
      correctAccusations += 1;
    } else {
      perPlayer[imposterId].score += SCORE.IMPOSTER_PER_WRONG_ACCUSATION;
    }
    for (const k of ["locatie", "wapen", "motief"]) {
      if (f[k]) perPlayer[id].score += SCORE.FINAL_DETAIL;
    }
  }

  // Gepakt = een strikte meerderheid van de burgers wijst de imposter aan.
  const caught = correctAccusations > citizens.length / 2;
  if (!caught) perPlayer[imposterId].score += SCORE.IMPOSTER_ESCAPE;

  const rankedCitizens = citizens
    .map((id) => ({ id, name: players[id]?.name || "?", score: perPlayer[id].score }))
    .sort((a, b) => b.score - a.score);

  return {
    caught,
    correctAccusations,
    citizens,
    imposterId,
    perPlayer,
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
