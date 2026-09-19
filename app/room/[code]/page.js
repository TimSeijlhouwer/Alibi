"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { maps, mapList } from "../../../data/maps";
import {
  DUO_THRESHOLD,
  ZOEKACTIES,
  BURGER_GOALS,
  DADER_GOAL,
  computeResults,
  findingsFor,
  getPlayerId,
  goalById,
  sameSet,
  shuffle,
} from "../../../lib/game";

const PHASES = ["lobby", "r1", "r2", "wipe", "search", "timeline", "r3", "final", "reveal"];
const NEXT_LABEL = {
  r1: "Naar het bewijs",
  r2: "Naar de plaats delict",
  wipe: "Geef de plaats delict vrij",
  search: "Naar de reconstructie",
  timeline: "Naar het deductieraster",
  r3: "Naar de eindbeschuldiging",
  final: "Onthul de waarheid",
};

export default function Room() {
  const { code } = useParams();
  const router = useRouter();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [secretOpen, setSecretOpen] = useState(false);
  const roomRef = useRef(null);
  roomRef.current = room;

  const me = useMemo(() => getPlayerId(), []);

  const refresh = useCallback(async () => {
    if (!roomRef.current) return;
    const { data } = await supabase
      .from("rooms").select("id, code, state").eq("id", roomRef.current.id).maybeSingle();
    if (data) setRoom(data);
  }, []);

  useEffect(() => {
    let channel;
    let poll;
    async function load() {
      const { data } = await supabase
        .from("rooms").select("id, code, state")
        .eq("code", String(code).toUpperCase()).maybeSingle();
      setLoading(false);
      if (!data) return;
      setRoom(data);
      channel = supabase
        .channel(`room-${data.id}`)
        .on("postgres_changes",
          { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${data.id}` },
          (payload) => setRoom((r) => ({ ...r, state: payload.new.state })))
        .subscribe();
      poll = setInterval(refresh, 4000);
    }
    load();
    return () => {
      if (channel) supabase.removeChannel(channel);
      if (poll) clearInterval(poll);
    };
  }, [code, refresh]);

  const state = room?.state;
  const map = maps[state?.mapId] || maps.reinhart;
  const players = state?.players || {};
  const isHost = !!players[me]?.isHost;
  const inGame = !!players[me];
  const phase = state?.phase || "lobby";
  const imposters = state?.imposters || [];
  const answers = state?.answers || {};
  const wiped = state?.flags?.wiped || null;

  const writeState = useCallback(async (next) => {
    await supabase.from("rooms").update({ state: next }).eq("id", roomRef.current.id);
    await refresh();
  }, [refresh]);

  async function submit(phaseKey, answer) {
    const { error } = await supabase.rpc("submit_answer", {
      p_room: room.id, p_phase: phaseKey, p_player_id: me, p_answer: answer,
    });
    if (error) { window.alert("Inleveren mislukt: " + error.message); return; }
    await refresh();
  }

  async function setFlag(key, value) {
    const { error } = await supabase.rpc("set_flag", { p_room: room.id, p_key: key, p_value: value });
    if (error) { window.alert("Actie mislukt: " + error.message); return; }
    await refresh();
  }

  async function startGame() {
    const ids = Object.keys(players);
    const duo = ids.length >= DUO_THRESHOLD;
    const picked = shuffle(ids);
    const dader = picked[0];
    const accomplice = duo ? picked[1] : null;
    const rest = ids.filter((id) => id !== dader && id !== accomplice);
    const freeChars = shuffle(
      map.characters.map((c) => c.id)
        .filter((c) => c !== map.guiltyCharacter && (duo ? c !== map.accompliceCharacter : true))
    );
    const assignments = { [dader]: map.guiltyCharacter };
    if (accomplice) assignments[accomplice] = map.accompliceCharacter;
    rest.forEach((id, i) => { assignments[id] = freeChars[i]; });

    const goalPool = shuffle(BURGER_GOALS.map((g) => g.id));
    const goals = {};
    let gi = 0;
    for (const id of ids) {
      goals[id] = imposterIds(dader, accomplice).includes(id)
        ? DADER_GOAL.id
        : goalPool[gi++ % goalPool.length];
    }

    await writeState({
      ...state,
      phase: "r1",
      imposters: imposterIds(dader, accomplice),
      dader, accomplice, assignments, goals,
      answers: {}, flags: {}, startedAt: Date.now(),
    });
  }

  async function nextPhase() {
    const i = PHASES.indexOf(phase);
    await writeState({ ...state, phase: PHASES[Math.min(i + 1, PHASES.length - 1)] });
  }

  async function toggleTestMode() {
    await writeState({ ...state, testMode: !state.testMode });
  }

  if (loading) return <main><p className="zacht">Dossier openen…</p></main>;
  if (!room) {
    return (
      <main>
        <h1>Onbekende code</h1>
        <p className="sub">Er is geen spel met code {String(code).toUpperCase()}.</p>
        <button onClick={() => router.push("/")}>Terug naar het begin</button>
      </main>
    );
  }
  if (!inGame && phase !== "lobby") {
    return (
      <main>
        <h1>Dit spel is al begonnen</h1>
        <button onClick={() => router.push("/")}>Terug naar het begin</button>
      </main>
    );
  }

  const charOf = (pid) => map.characters.find((c) => c.id === state.assignments?.[pid]);
  const playerOfChar = (charId) =>
    Object.keys(state.assignments || {}).find((pid) => state.assignments[pid] === charId);
  const submittedCount = (key) =>
    Object.keys(players).filter((pid) => answers[key]?.[pid]).length;

  const iAmDader = state?.dader === me;
  const iAmSchuldig = imposters.includes(me);
  const myGoal = goalById(state?.goals?.[me]);
  const wipeUsed = !!wiped;
  const myZoekacties = iAmDader && wipeUsed ? ZOEKACTIES - 1 : ZOEKACTIES;

  // Privé-hints die je onderweg hebt ontgrendeld
  const myHints = [];
  const idx = PHASES.indexOf(phase);
  if (idx > PHASES.indexOf("r1")) {
    const a = answers.r1?.[me];
    if (a && sameSet(a.pair || [], map.r1.answerPair)) myHints.push(map.r1.hint);
  }
  if (idx > PHASES.indexOf("r2")) {
    const a = answers.r2?.[me];
    if (a && a.choice === map.r2.answer) myHints.push(map.r2.hint);
  }
  if (idx > PHASES.indexOf("timeline")) {
    const a = answers.timeline?.[me];
    const correct = map.timeline.events.map((e) => e.id);
    if (a && (a.order || []).every((x, i) => x === correct[i])) myHints.push(map.timeline.hint);
  }

  return (
    <main>
      <p className="klein zacht" style={{ marginBottom: 4 }}>
        Alibi · {map.title} · code {room.code}
      </p>

      {phase === "lobby" && (
        <Lobby map={map} players={players} me={me} isHost={isHost}
          testMode={!!state.testMode} onToggleTest={toggleTestMode}
          onChooseMap={(id) => writeState({ ...state, mapId: id })}
          onStart={startGame} code={room.code} />
      )}

      {phase !== "lobby" && charOf(me) && (
        <SecretPanel map={map} myChar={charOf(me)} isDader={iAmDader}
          isHandlanger={state.accomplice === me} open={secretOpen} setOpen={setSecretOpen}
          phase={phase} injected={!!state.flags?.injected}
          onInject={() => setFlag("injected", true)} goal={myGoal} />
      )}

      {phase !== "lobby" && myHints.map((h) => <div className="hint" key={h}>{h}</div>)}

      {phase === "r1" && (
        <RoundOne map={map} players={players} playerOfChar={playerOfChar}
          myAnswer={answers.r1?.[me]} onSubmit={(pair) => submit("r1", { pair })} />
      )}

      {phase === "r2" && (
        <RoundTwo map={map} myAnswer={answers.r2?.[me]}
          onSubmit={(choice) => submit("r2", { choice })} />
      )}

      {phase === "wipe" && (
        <WipePhase map={map} isSchuldig={iAmSchuldig} wiped={wiped}
          onWipe={(clueId) => setFlag("wiped", clueId)} />
      )}

      {phase === "search" && (
        <SearchPhase map={map} wiped={wiped} maxActies={myZoekacties}
          wipeUsed={wipeUsed} iAmDader={iAmDader}
          myAnswer={answers.search?.[me]} onSubmit={(rooms) => submit("search", { rooms })} />
      )}

      {phase === "timeline" && (
        <TimelinePhase map={map} isSchuldig={iAmSchuldig} myAnswer={answers.timeline?.[me]}
          onSubmit={(order) => submit("timeline", { order })} />
      )}

      {phase === "r3" && (
        <RoundThree map={map} injected={!!state.flags?.injected} myAnswer={answers.r3?.[me]}
          playerOfChar={playerOfChar} players={players}
          onSubmit={(suspect) => submit("r3", { suspect })} />
      )}

      {phase === "final" && (
        <FinalAccusation map={map} players={players} me={me} charOf={charOf}
          duo={imposters.length === 2} myAnswer={answers.final?.[me]}
          onSubmit={(a) => submit("final", a)} />
      )}

      {phase === "reveal" && (
        <>
          <Reveal map={map} state={state} players={players} me={me} charOf={charOf} />
          <div className="nachtkaart">
            <p className="klein zacht" style={{ margin: 0 }}>
              Zin in nog een zaak? Start op de homepagina een nieuw spel.
            </p>
            <button onClick={() => router.push("/")}>Terug naar home</button>
          </div>
        </>
      )}

      {isHost && phase !== "lobby" && phase !== "reveal" && (
        <div className="nachtkaart">
          <p className="klein" style={{ margin: 0 }}>
            Spelleiding · {phase === "wipe"
              ? (wiped ? "de dader heeft gehandeld" : "wachten op de dader…")
              : `${submittedCount(phase)} van ${Object.keys(players).length} spelers hebben ingeleverd.`}
          </p>
          <button onClick={nextPhase}>{NEXT_LABEL[phase] || "Volgende"}</button>
        </div>
      )}
    </main>
  );
}

function imposterIds(dader, accomplice) {
  return accomplice ? [dader, accomplice] : [dader];
}

function Lobby({ map, players, me, isHost, testMode, onToggleTest, onChooseMap, onStart, code }) {
  const count = Object.keys(players).length;
  const min = testMode ? 2 : map.minPlayers;
  const canStart = count >= min && count <= map.maxPlayers;
  const duo = count >= DUO_THRESHOLD;
  return (
    <>
      <h1>{map.title}</h1>
      <p className="sub">{map.tagline}</p>
      <div className="nachtkaart">
        <p className="klein zacht" style={{ margin: 0 }}>Spelcode voor je vrienden</p>
        <div className="code">{code}</div>
      </div>

      {isHost && (
        <div className="nachtkaart">
          <h2>Kies de map</h2>
          {mapList.map((m) => (
            <button key={m.id} className="keuze"
              style={m.id === map.id ? { borderColor: "var(--kaars)", borderWidth: 2 } : undefined}
              onClick={() => onChooseMap(m.id)}>
              <strong>{m.title}</strong> — {m.setting}{m.id === map.id ? " · gekozen" : ""}
            </button>
          ))}
        </div>
      )}

      <div className="nachtkaart">
        <h2>Aan tafel ({count})</h2>
        <div className="rij">
          {Object.entries(players).map(([pid, p]) => (
            <span className="speler" key={pid}>
              {p.name}{p.isHost ? " · gastvrouw/heer" : ""}{pid === me ? " (jij)" : ""}
            </span>
          ))}
        </div>
        <p className="klein zacht">
          {map.minPlayers}–{map.maxPlayers} spelers · vijf rondes · iedereen krijgt een personage én
          een geheime persoonlijke opdracht. {duo
            ? "Met deze groepsgrootte werken er twee samen: een dader én een handlanger."
            : "Eén van jullie wordt in het geheim de dader. Vanaf 7 spelers komt er een handlanger bij."}
        </p>
        {isHost ? (
          <div className="rij">
            <button onClick={onStart} disabled={!canStart}>Start het spel</button>
            <button className="stil" onClick={onToggleTest}>
              {testMode ? "Testmodus uit" : "Testmodus aan (min. 2)"}
            </button>
          </div>
        ) : (
          <p className="klein zacht">Wachten tot de host het spel start…</p>
        )}
      </div>
    </>
  );
}

function SecretPanel({ map, myChar, isDader, isHandlanger, open, setOpen, phase, injected, onInject, goal }) {
  return (
    <div className="dader">
      <span className="zegel">Vertrouwelijk</span>
      <h3>Jij bent {myChar?.name}, {myChar?.role}</h3>
      {!open ? (
        <button className="stil" onClick={() => setOpen(true)}>Toon mijn geheime dossier</button>
      ) : (
        <>
          {isDader || isHandlanger ? (
            <>
              <p>{isDader ? map.imposterBriefing : map.accompliceBriefing}</p>
              <p className="klein">
                De waarheid: {map.solution.locatie} · {map.solution.wapen} · motief: {map.solution.motief}.
              </p>
              {phase === "r3" && (
                <>
                  <p className="klein">
                    Jullie kunnen éénmalig een valse aanwijzing in het dossier laten opduiken.
                    Niemand ziet van wie die komt.
                  </p>
                  <button onClick={onInject} disabled={injected}>
                    {injected ? "Valse aanwijzing is ingebracht" : "Breng de valse aanwijzing in"}
                  </button>
                </>
              )}
            </>
          ) : (
            <p>
              Jij bent onschuldig. Jouw verklaring klopt. Win rondes om punten te scoren en hints te
              ontgrendelen — en beslis zelf of je die deelt, of voor jezelf houdt.
            </p>
          )}
          {goal && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(240,217,212,0.25)" }}>
              <p className="klein" style={{ margin: 0 }}>
                <strong>Persoonlijke opdracht · {goal.title}</strong><br />
                {goal.text}
              </p>
            </div>
          )}
          <button className="stil" onClick={() => setOpen(false)}>Verberg</button>
        </>
      )}
    </div>
  );
}

function RoundOne({ map, players, playerOfChar, myAnswer, onSubmit }) {
  const [picked, setPicked] = useState(myAnswer?.pair || []);
  const done = !!myAnswer;
  function toggle(charId) {
    if (done) return;
    setPicked((p) => p.includes(charId) ? p.filter((x) => x !== charId)
      : p.length < 2 ? [...p, charId] : p);
  }
  return (
    <div className="papier">
      <div className="dossier-kop">Ronde 1 — {map.r1.title}</div>
      <p>{map.r1.intro}</p>
      {map.characters.map((c) => {
        const pid = playerOfChar(c.id);
        return (
          <div className="alibi" key={c.id}>
            <div className="naam">
              {c.name} ({c.role}) — {pid ? `gespeeld door ${players[pid]?.name}` : map.npcNote}
            </div>
            <div>{map.alibis[c.id]}</div>
            <button className={`keuze${picked.includes(c.id) ? " actief" : ""}`}
              onClick={() => toggle(c.id)}>
              {picked.includes(c.id) ? "Geselecteerd als tegenspraak" : "Selecteer deze verklaring"}
            </button>
          </div>
        );
      })}
      {!done ? (
        <button onClick={() => onSubmit(picked)} disabled={picked.length !== 2}>
          Lever mijn keuze in
        </button>
      ) : (
        <p className="status zacht">Ingeleverd. Blijf meepraten — of juist niet.</p>
      )}
    </div>
  );
}

function RoundTwo({ map, myAnswer, onSubmit }) {
  const [choice, setChoice] = useState(myAnswer?.choice || null);
  const done = !!myAnswer;
  return (
    <div className="papier">
      <div className="dossier-kop">Ronde 2 — {map.r2.title}</div>
      <p>{map.r2.intro}</p>
      {map.r2.options.map((o) => (
        <button key={o.id} className={`keuze${choice === o.id ? " actief" : ""}`}
          onClick={() => !done && setChoice(o.id)}>
          <strong>{o.label}.</strong> {o.text}
        </button>
      ))}
      {!done ? (
        <button onClick={() => onSubmit(choice)} disabled={!choice}>
          Leg mijn keuze vast
        </button>
      ) : (
        <p className="status zacht">Vastgelegd. De uitkomst blijft geheim tot het einde.</p>
      )}
    </div>
  );
}

function WipePhase({ map, isSchuldig, wiped, onWipe }) {
  const [sel, setSel] = useState(null);
  if (!isSchuldig) {
    return (
      <div className="papier">
        <div className="dossier-kop">De plaats delict wordt afgezet</div>
        <p>
          De recherche maakt het terrein gereed. Zo dadelijk mag iedereen twee plekken doorzoeken.
        </p>
        <p className="klein zacht">Even geduld — de host geeft het terrein zo vrij.</p>
      </div>
    );
  }
  return (
    <div className="dader">
      <span className="zegel">Jouw kans</span>
      <h3>Nog één moment alleen</h3>
      <p>
        Voordat de anderen gaan zoeken, kun je één spoor laten verdwijnen. Dat kost je één van je
        twee onderzoeksacties — en in die kamer blijft een melding <strong>VERSTOORD</strong> achter.
        Niemand weet of daar iets lag of dat jij er was.
      </p>
      {wiped ? (
        <p className="klein">
          Je hebt <strong>{map.clues.find((c) => c.id === wiped)?.label}</strong> laten verdwijnen.
          Je houdt één zoekactie over.
        </p>
      ) : (
        <>
          {map.clues.map((c) => {
            const room = map.rooms.find((r) => r.id === c.room);
            return (
              <button key={c.id} className={`keuze${sel === c.id ? " actief" : ""}`}
                onClick={() => setSel(c.id)}>
                <strong>{c.label}</strong> — {room?.name}
              </button>
            );
          })}
          <div className="rij">
            <button onClick={() => onWipe(sel)} disabled={!sel}>Laat dit spoor verdwijnen</button>
            <button className="stil" onClick={() => onWipe("geen")}>
              Niets wissen (houd twee zoekacties)
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SearchPhase({ map, wiped, maxActies, wipeUsed, iAmDader, myAnswer, onSubmit }) {
  const [picked, setPicked] = useState(myAnswer?.rooms || []);
  const done = !!myAnswer;
  const result = done ? findingsFor(map, myAnswer.rooms, wiped === "geen" ? null : wiped) : null;

  function toggle(roomId) {
    if (done) return;
    setPicked((p) => p.includes(roomId) ? p.filter((x) => x !== roomId)
      : p.length < maxActies ? [...p, roomId] : p);
  }

  return (
    <div className="papier">
      <div className="dossier-kop">Ronde 3 — De onderzoeksronde</div>
      {!done ? (
        <>
          <p>
            Je mag {maxActies} {maxActies === 1 ? "plek" : "plekken"} doorzoeken.
            {iAmDader && wipeUsed && maxActies === 1
              ? " Je hebt één actie gebruikt om een spoor te laten verdwijnen."
              : ""}{" "}
            Wat je vindt, zie alleen jij — delen mag, maar hoeft niet.
          </p>
          <div className="plattegrond">
            {map.rooms.map((r) => (
              <button key={r.id} className={`kamer${picked.includes(r.id) ? " actief" : ""}`}
                onClick={() => toggle(r.id)}>
                <span className="kamer-naam">{r.name}</span>
                <span className="kamer-actie">{picked.includes(r.id) ? "wordt doorzocht" : "doorzoeken"}</span>
              </button>
            ))}
          </div>
          <button onClick={() => onSubmit(picked)} disabled={picked.length !== maxActies}>
            Doorzoek {picked.length === 1 ? "deze plek" : "deze plekken"}
          </button>
        </>
      ) : (
        <>
          <p><strong>Wat jij hebt gevonden:</strong></p>
          {result.verstoord.map((rid) => (
            <p key={rid} className="verstoord">
              {map.rooms.find((r) => r.id === rid)?.name.toUpperCase()} — VERSTOORD. Hier is recent
              iemand geweest. Of er iets lag, valt niet meer te zeggen.
            </p>
          ))}
          {result.found.length === 0 && result.verstoord.length === 0 && (
            <p className="zacht">Niets gevonden. Dat kan pech zijn — of niet.</p>
          )}
          {result.found.map((c) => (
            <div className="vondst" key={c.id}>
              <div className="naam">{c.label}</div>
              <div>{c.text}</div>
            </div>
          ))}
          <p className="status zacht">
            Wat je hiermee doet, is aan jou. Zwijgen levert jou punten op; delen levert de groep
            een dader op.
          </p>
        </>
      )}
    </div>
  );
}

function TimelinePhase({ map, isSchuldig, myAnswer, onSubmit }) {
  const events = map.timeline.events;
  const shuffled = useMemo(() => shuffle(events), [events]);
  const [order, setOrder] = useState(myAnswer?.order || []);
  const done = !!myAnswer;

  function tik(id) {
    if (done) return;
    setOrder((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  }

  return (
    <div className="papier">
      <div className="dossier-kop">Ronde 4 — {map.timeline.title}</div>
      <p>{map.timeline.intro}</p>
      {isSchuldig && (
        <p className="klein" style={{ color: "var(--was)" }}>
          <strong>Jij weet precies hoe het ging.</strong> De juiste volgorde is hieronder
          genummerd zichtbaar voor jou. Je mág meepraten — maar &ldquo;ik weet het niet meer
          precies&rdquo; is vaak veiliger dan een leugen.
        </p>
      )}
      <p className="klein zacht">Tik de gebeurtenissen aan in de volgorde waarin ze volgens jou plaatsvonden.</p>
      {shuffled.map((e) => {
        const pos = order.indexOf(e.id);
        const echtePositie = events.findIndex((x) => x.id === e.id) + 1;
        return (
          <button key={e.id} className={`keuze${pos >= 0 ? " actief" : ""}`} onClick={() => tik(e.id)}>
            <strong>{pos >= 0 ? `${pos + 1}.` : "·"}</strong> {e.text}
            {isSchuldig && <span className="waarheid"> [echt: {echtePositie}]</span>}
          </button>
        );
      })}
      {!done ? (
        <button onClick={() => onSubmit(order)} disabled={order.length !== events.length}>
          Leg mijn volgorde vast
        </button>
      ) : (
        <p className="status zacht">Vastgelegd. Elke gebeurtenis op de juiste plek telt mee.</p>
      )}
    </div>
  );
}

function RoundThree({ map, injected, myAnswer, playerOfChar, players, onSubmit }) {
  const [suspect, setSuspect] = useState(myAnswer?.suspect || null);
  const done = !!myAnswer;
  return (
    <div className="papier">
      <div className="dossier-kop">Ronde 5 — {map.r3.title}</div>
      <p>{map.r3.intro}</p>
      <p className="klein zacht">
        Tijdens deze ronde kunnen extra verklaringen binnenkomen. Niet alles wat binnenkomt is waar.
      </p>
      <ul>
        {map.r3.clues.map((c) => <li key={c}>{c}</li>)}
        {injected && <li><em>{map.r3.fakeClueLabel}:</em> {map.r3.fakeClue}</li>}
      </ul>
      <p><strong>Wie blijft er volgens jou over?</strong></p>
      {map.characters.map((c) => {
        const pid = playerOfChar(c.id);
        return (
          <button key={c.id} className={`keuze${suspect === c.id ? " actief" : ""}`}
            onClick={() => !done && setSuspect(c.id)}>
            <strong>{c.name}</strong> ({c.role}){pid ? ` — ${players[pid]?.name}` : ""}
          </button>
        );
      })}
      {!done ? (
        <button onClick={() => onSubmit(suspect)} disabled={!suspect}>Streep de rest weg</button>
      ) : (
        <p className="status zacht">Vastgelegd. Overtuig de rest — of juist niet.</p>
      )}
    </div>
  );
}

function FinalAccusation({ map, players, me, charOf, duo, myAnswer, onSubmit }) {
  const [dader, setDader] = useState(myAnswer?.dader || "");
  const [handlanger, setHandlanger] = useState(myAnswer?.handlanger || "");
  const [locatie, setLocatie] = useState(myAnswer?.locatie || "");
  const [wapen, setWapen] = useState(myAnswer?.wapen || "");
  const [motief, setMotief] = useState(myAnswer?.motief || "");
  const done = !!myAnswer;
  const alle = Object.keys(players);
  const naam = (pid) => `${players[pid]?.name}${pid === me ? " (jij)" : ""} (${charOf(pid)?.name || "?"})`;
  return (
    <div className="papier">
      <div className="dossier-kop">De eindbeschuldiging</div>
      <p>
        Bespreek het hardop — maar iedereen vult zijn eigen beschuldiging in. Alleen als een
        meerderheid de juiste dader aanwijst, wordt die gepakt. De details tellen mee voor je eigen
        score als rechercheur.
      </p>
      <label>Wie heeft het gedaan?</label>
      <select value={dader} disabled={done} onChange={(e) => setDader(e.target.value)}>
        <option value="">— kies een speler —</option>
        {alle.map((pid) => <option key={pid} value={pid}>{naam(pid)}</option>)}
      </select>
      {duo && (
        <>
          <label>Wie was de handlanger? (er werkten er twee samen)</label>
          <select value={handlanger} disabled={done} onChange={(e) => setHandlanger(e.target.value)}>
            <option value="">— kies een speler —</option>
            {alle.map((pid) => <option key={pid} value={pid}>{naam(pid)}</option>)}
          </select>
        </>
      )}
      <label>Waar?</label>
      <select value={locatie} disabled={done} onChange={(e) => setLocatie(e.target.value)}>
        <option value="">— kies een locatie —</option>
        {map.finalOptions.locaties.map((x) => <option key={x} value={x}>{x}</option>)}
      </select>
      <label>Waarmee?</label>
      <select value={wapen} disabled={done} onChange={(e) => setWapen(e.target.value)}>
        <option value="">— kies een wapen —</option>
        {map.finalOptions.wapens.map((x) => <option key={x} value={x}>{x}</option>)}
      </select>
      <label>Waarom?</label>
      <select value={motief} disabled={done} onChange={(e) => setMotief(e.target.value)}>
        <option value="">— kies een motief —</option>
        {map.finalOptions.motieven.map((x) => <option key={x} value={x}>{x}</option>)}
      </select>
      {!done ? (
        <button onClick={() => onSubmit({ dader, handlanger: handlanger || null, locatie, wapen, motief })}
          disabled={!dader || !locatie || !wapen || !motief || (duo && (!handlanger || handlanger === dader))}>
          Dien mijn beschuldiging in
        </button>
      ) : (
        <p className="status zacht">Ingediend. Wachten op de onthulling…</p>
      )}
      {duo && handlanger && handlanger === dader && !done && (
        <p className="klein fout">Kies twee verschillende spelers voor dader en handlanger.</p>
      )}
    </div>
  );
}

function Reveal({ map, state, players, me, charOf }) {
  const r = computeResults(map, state);
  const daderName = players[r.daderPid]?.name || "?";
  const daderChar = charOf(r.daderPid);
  const accName = r.accomplicePid ? players[r.accomplicePid]?.name : null;
  const accChar = r.accomplicePid ? charOf(r.accomplicePid) : null;
  const duo = !!r.accomplicePid;
  const gewistSpoor = r.wiped && r.wiped !== "geen"
    ? map.clues.find((c) => c.id === r.wiped) : null;
  const ranked = Object.keys(players)
    .map((pid) => ({ pid, name: players[pid]?.name, ...r.perPlayer[pid] }))
    .sort((a, b) => b.score - a.score);

  return (
    <>
      <div className="papier">
        <div className="dossier-kop">De onthulling</div>
        <h2>{r.caught ? "De dader is gepakt" : "De dader is ontsnapt"}</h2>
        <p>
          Het was <strong>{daderName}</strong>, als {daderChar?.name} ({daderChar?.role}) — in{" "}
          {map.solution.locatie}, met {map.solution.wapen}, vanwege {map.solution.motief}.
          {duo && (
            <> {" "}De handlanger: <strong>{accName}</strong>, als {accChar?.name} ({accChar?.role})
              {r.handlangerFound ? " — ook ontmaskerd." : " — buiten schot gebleven."}</>
          )}
        </p>
        <p>
          {r.correctAccusations} van de {r.citizens.length} rechercheurs wees
          {r.correctAccusations === 1 ? "" : "en"} de dader correct aan
          {r.caught ? " — genoeg voor een veroordeling." : " — te weinig. De zaak is geseponeerd."}
        </p>
        {r.caught && r.bestRechercheur ? (
          <p>Beste rechercheur: <strong>{r.bestRechercheur.name}</strong> met {r.bestRechercheur.score} punten.</p>
        ) : null}
      </div>

      <div className="papier">
        <div className="dossier-kop">Zo werden jullie gestuurd</div>
        <ul>
          {map.reveal.punten.map((p) => <li key={p}>{p}</li>)}
          {duo && <li>{map.reveal.handlanger}</li>}
          <li>
            {gewistSpoor
              ? `De dader liet "${gewistSpoor.label}" verdwijnen uit ${map.rooms.find((x) => x.id === gewistSpoor.room)?.name} — daar vond niemand meer iets.`
              : "De dader heeft geen spoor laten verdwijnen; alles lag er nog."}
          </li>
          <li>{state.flags?.injected ? map.reveal.fakeUsed : map.reveal.fakeUnused}</li>
        </ul>
      </div>

      <div className="papier">
        <div className="dossier-kop">Persoonlijke opdrachten</div>
        <table className="uitslag">
          <tbody>
            {ranked.map((p) => {
              const g = goalById(p.goalId);
              return (
                <tr key={p.pid}>
                  <td>{p.name}{p.pid === me ? " (jij)" : ""}</td>
                  <td>{g ? g.title : "—"}</td>
                  <td>{p.goalDone ? <span className="goed">gehaald</span> : <span className="fout">niet gehaald</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="papier">
        <div className="dossier-kop">Scorebord</div>
        <table className="uitslag">
          <thead>
            <tr>
              <th>Speler</th><th>R1</th><th>R2</th><th>Sporen</th><th>Tijdlijn</th><th>R5</th>
              <th>Dader</th>{duo && <th>Handl.</th>}<th>Punten</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((p) => {
              const isImp = r.imposters.includes(p.pid);
              return (
                <tr key={p.pid}>
                  <td>
                    {p.name}
                    {p.pid === r.daderPid ? " — de dader" : ""}
                    {p.pid === r.accomplicePid ? " — de handlanger" : ""}
                    {p.pid === me ? " (jij)" : ""}
                  </td>
                  <td>{isImp ? "—" : mark(p.r1)}</td>
                  <td>{isImp ? "—" : mark(p.r2)}</td>
                  <td>{isImp ? "—" : p.sporen}</td>
                  <td>{isImp ? "—" : `${p.tijdlijn}/${map.timeline.events.length}`}</td>
                  <td>{isImp ? "—" : mark(p.r3)}</td>
                  <td>{isImp ? "—" : mark(p.final?.dader)}</td>
                  {duo && <td>{isImp ? "—" : mark(p.final?.handlanger)}</td>}
                  <td><strong>{p.score}</strong></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="klein zacht">
          Sleutelsporen telden zwaarder dan gewone. Een gehaalde persoonlijke opdracht gaf een bonus.
          De schuldigen scoorden op elke rechercheur die de mist in ging
          {r.caught ? "." : " — en op de ontsnapping."}
        </p>
      </div>
    </>
  );
}

function mark(v) {
  if (v === null || v === undefined) return <span className="zacht">·</span>;
  return v ? <span className="goed">✓</span> : <span className="fout">✗</span>;
}
