"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { maps, mapList } from "../../../data/maps";
import {
  DUO_THRESHOLD,
  computeResults,
  getPlayerId,
  sameSet,
  shuffle,
} from "../../../lib/game";

const PHASES = ["lobby", "r1", "r2", "r3", "final", "reveal"];

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
      .from("rooms")
      .select("id, code, state")
      .eq("id", roomRef.current.id)
      .maybeSingle();
    if (data) setRoom(data);
  }, []);

  useEffect(() => {
    let channel;
    let poll;
    async function load() {
      const { data } = await supabase
        .from("rooms")
        .select("id, code, state")
        .eq("code", String(code).toUpperCase())
        .maybeSingle();
      setLoading(false);
      if (!data) return;
      setRoom(data);
      channel = supabase
        .channel(`room-${data.id}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${data.id}` },
          (payload) => setRoom((r) => ({ ...r, state: payload.new.state }))
        )
        .subscribe();
      // Terugval voor als realtime niet aanstaat of hapert: elke 4 s verversen.
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
  const iAmImposter = imposters.includes(me);
  const answers = state?.answers || {};

  const writeState = useCallback(async (next) => {
    await supabase.from("rooms").update({ state: next }).eq("id", roomRef.current.id);
    await refresh();
  }, [refresh]);

  async function submit(phaseKey, answer) {
    const { error } = await supabase.rpc("submit_answer", {
      p_room: room.id,
      p_phase: phaseKey,
      p_player_id: me,
      p_answer: answer,
    });
    if (error) {
      window.alert("Inleveren mislukt: " + error.message);
      return;
    }
    await refresh();
  }

  async function chooseMap(mapId) {
    await writeState({ ...state, mapId });
  }

  async function startGame() {
    const ids = Object.keys(players);
    const duo = ids.length >= DUO_THRESHOLD;
    const picked = shuffle(ids);
    const dader = picked[0];
    const accomplice = duo ? picked[1] : null;
    const rest = ids.filter((id) => id !== dader && id !== accomplice);
    const freeChars = shuffle(
      map.characters
        .map((c) => c.id)
        .filter((c) => c !== map.guiltyCharacter && (duo ? c !== map.accompliceCharacter : true))
    );
    const assignments = { [dader]: map.guiltyCharacter };
    if (accomplice) assignments[accomplice] = map.accompliceCharacter;
    rest.forEach((id, i) => {
      assignments[id] = freeChars[i];
    });
    await writeState({
      ...state,
      phase: "r1",
      imposters: accomplice ? [dader, accomplice] : [dader],
      dader,
      accomplice,
      assignments,
      answers: {},
      flags: {},
      startedAt: Date.now(),
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

  const charOf = (playerId) => map.characters.find((c) => c.id === state.assignments?.[playerId]);
  const playerOfChar = (charId) =>
    Object.keys(state.assignments || {}).find((pid) => state.assignments[pid] === charId);

  const submittedCount = (key) =>
    Object.keys(players).filter((pid) => answers[key]?.[pid]).length;

  const myHints = [];
  if (["r2", "r3", "final", "reveal"].includes(phase)) {
    const a = answers.r1?.[me];
    if (a && sameSet(a.pair || [], map.rounds.r1.answerPair)) myHints.push(map.rounds.r1.hint);
  }
  if (["r3", "final", "reveal"].includes(phase)) {
    const a = answers.r2?.[me];
    if (a && a.choice === map.rounds.r2.answer) myHints.push(map.rounds.r2.hint);
  }

  return (
    <main>
      <p className="klein zacht" style={{ marginBottom: 4 }}>
        Alibi · {map.title} · code {room.code}
      </p>

      {phase === "lobby" && (
        <Lobby
          map={map}
          players={players}
          me={me}
          isHost={isHost}
          testMode={!!state.testMode}
          onToggleTest={toggleTestMode}
          onChooseMap={chooseMap}
          onStart={startGame}
          code={room.code}
        />
      )}

      {phase !== "lobby" && charOf(me) && (
        <SecretPanel
          map={map}
          myChar={charOf(me)}
          isDader={state.dader === me}
          isHandlanger={state.accomplice === me}
          open={secretOpen}
          setOpen={setSecretOpen}
          phase={phase}
          injected={!!state.flags?.injected}
          onInject={async () => {
            await supabase.rpc("set_flag", { p_room: room.id, p_key: "injected", p_value: true });
            await refresh();
          }}
        />
      )}

      {phase !== "lobby" && myHints.map((h) => (
        <div className="hint" key={h}>{h}</div>
      ))}

      {phase === "r1" && (
        <RoundOne
          map={map}
          players={players}
          playerOfChar={playerOfChar}
          myAnswer={answers.r1?.[me]}
          onSubmit={(pair) => submit("r1", { pair })}
        />
      )}

      {phase === "r2" && (
        <RoundTwo map={map} myAnswer={answers.r2?.[me]} onSubmit={(choice) => submit("r2", { choice })} />
      )}

      {phase === "r3" && (
        <RoundThree
          map={map}
          injected={!!state.flags?.injected}
          myAnswer={answers.r3?.[me]}
          playerOfChar={playerOfChar}
          players={players}
          onSubmit={(suspect) => submit("r3", { suspect })}
        />
      )}

      {phase === "final" && (
        <FinalAccusation
          map={map}
          players={players}
          me={me}
          charOf={charOf}
          duo={imposters.length === 2}
          myAnswer={answers.final?.[me]}
          onSubmit={(a) => submit("final", a)}
        />
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
            Spelleiding · {submittedCount(phase)} van {Object.keys(players).length} spelers hebben
            ingeleverd.
          </p>
          <button onClick={nextPhase}>
            {phase === "final" ? "Onthul de waarheid" : "Naar de volgende ronde"}
          </button>
        </div>
      )}
    </main>
  );
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
            <button
              key={m.id}
              className="keuze"
              style={m.id === map.id ? { borderColor: "var(--kaars)", borderWidth: 2 } : undefined}
              onClick={() => onChooseMap(m.id)}
            >
              <strong>{m.title}</strong> — {m.setting}
              {m.id === map.id ? " · gekozen" : ""}
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
          {map.minPlayers}–{map.maxPlayers} spelers. Iedereen krijgt een personage; {duo
            ? "met deze groepsgrootte werken er twee samen: een dader én een handlanger."
            : "één van jullie wordt in het geheim de dader. Vanaf 7 spelers komt er een handlanger bij."}
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

function SecretPanel({ map, myChar, isDader, isHandlanger, open, setOpen, phase, injected, onInject }) {
  return (
    <div className="dader">
      <span className="zegel">Vertrouwelijk</span>
      <h3>
        Jij bent {myChar?.name}, {myChar?.role}
      </h3>
      {!open ? (
        <button className="stil" onClick={() => setOpen(true)}>Toon mijn geheime dossier</button>
      ) : (
        <>
          {isDader || isHandlanger ? (
            <>
              <p>{isDader ? map.imposterBriefing : map.accompliceBriefing}</p>
              <p className="klein">
                De waarheid: {map.solution.locatie} · {map.solution.wapen} · motief:{" "}
                {map.solution.motief}.
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
    setPicked((p) =>
      p.includes(charId) ? p.filter((x) => x !== charId) : p.length < 2 ? [...p, charId] : p
    );
  }

  return (
    <div className="papier">
      <div className="dossier-kop">Ronde 1 — {map.rounds.r1.title}</div>
      <p>{map.rounds.r1.intro}</p>
      <div>
        {map.characters.map((c) => {
          const pid = playerOfChar(c.id);
          const who = pid
            ? `${c.name} (${c.role}) — gespeeld door ${players[pid]?.name}`
            : `${c.name} (${c.role}) — ${map.npcNote}`;
          return (
            <div className="alibi" key={c.id}>
              <div className="naam">{who}</div>
              <div>{map.alibis[c.id]}</div>
              <button
                className={`keuze${picked.includes(c.id) ? " actief" : ""}`}
                onClick={() => toggle(c.id)}
              >
                {picked.includes(c.id) ? "Geselecteerd als tegenspraak" : "Selecteer deze verklaring"}
              </button>
            </div>
          );
        })}
      </div>
      {!done ? (
        <button onClick={() => onSubmit(picked)} disabled={picked.length !== 2}>
          Lever mijn keuze in
        </button>
      ) : (
        <p className="status zacht">
          Ingeleverd. Blijf meepraten — laat niet merken wat je hebt gekozen (of juist wel).
        </p>
      )}
    </div>
  );
}

function RoundTwo({ map, myAnswer, onSubmit }) {
  const [choice, setChoice] = useState(myAnswer?.choice || null);
  const done = !!myAnswer;
  return (
    <div className="papier">
      <div className="dossier-kop">Ronde 2 — {map.rounds.r2.title}</div>
      <p>{map.rounds.r2.intro}</p>
      <p style={{ whiteSpace: "pre-line", fontStyle: "italic" }}>{map.rounds.r2.evidence}</p>
      {map.rounds.r2.options.map((o) => (
        <button
          key={o.id}
          className={`keuze${choice === o.id ? " actief" : ""}`}
          onClick={() => !done && setChoice(o.id)}
        >
          <strong>{o.label}.</strong> {o.text}
        </button>
      ))}
      {!done ? (
        <button onClick={() => onSubmit(choice)} disabled={!choice}>
          Leg mijn interpretatie vast
        </button>
      ) : (
        <p className="status zacht">Vastgelegd. De uitkomst blijft geheim tot het einde.</p>
      )}
    </div>
  );
}

function RoundThree({ map, injected, myAnswer, playerOfChar, players, onSubmit }) {
  const [suspect, setSuspect] = useState(myAnswer?.suspect || null);
  const done = !!myAnswer;
  return (
    <div className="papier">
      <div className="dossier-kop">Ronde 3 — {map.rounds.r3.title}</div>
      <p>{map.rounds.r3.intro}</p>
      <p className="klein zacht">
        Tijdens deze ronde kunnen extra verklaringen binnenkomen. Niet alles wat binnenkomt is waar.
      </p>
      <ul>
        {map.rounds.r3.clues.map((c) => (
          <li key={c}>{c}</li>
        ))}
        {injected && (
          <li>
            <em>{map.rounds.r3.fakeClueLabel}:</em> {map.rounds.r3.fakeClue}
          </li>
        )}
      </ul>
      <p><strong>Wie blijft er volgens jou over?</strong></p>
      {map.characters.map((c) => {
        const pid = playerOfChar(c.id);
        return (
          <button
            key={c.id}
            className={`keuze${suspect === c.id ? " actief" : ""}`}
            onClick={() => !done && setSuspect(c.id)}
          >
            <strong>{c.name}</strong> ({c.role})
            {pid ? ` — ${players[pid]?.name}` : ""}
          </button>
        );
      })}
      {!done ? (
        <button onClick={() => onSubmit(suspect)} disabled={!suspect}>
          Streep de rest weg
        </button>
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
  const others = Object.keys(players).filter((pid) => pid !== me);
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
        <option value="">— kies een medespeler —</option>
        {others.map((pid) => (
          <option key={pid} value={pid}>
            {players[pid]?.name} ({charOf(pid)?.name || "?"})
          </option>
        ))}
      </select>
      {duo && (
        <>
          <label>Wie was de handlanger? (er werkten er twee samen)</label>
          <select value={handlanger} disabled={done} onChange={(e) => setHandlanger(e.target.value)}>
            <option value="">— kies een medespeler —</option>
            {others.map((pid) => (
              <option key={pid} value={pid}>
                {players[pid]?.name} ({charOf(pid)?.name || "?"})
              </option>
            ))}
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
        <button
          onClick={() => onSubmit({ dader, handlanger: handlanger || null, locatie, wapen, motief })}
          disabled={!dader || !locatie || !wapen || !motief || (duo && (!handlanger || handlanger === dader))}
        >
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
            <>
              {" "}De handlanger: <strong>{accName}</strong>, als {accChar?.name} ({accChar?.role})
              {r.handlangerFound ? " — ook ontmaskerd." : " — buiten schot gebleven."}
            </>
          )}
        </p>
        <p>
          {r.correctAccusations} van de {r.citizens.length} rechercheurs wees{r.correctAccusations === 1 ? "" : "en"} de dader
          correct aan{r.caught ? " — genoeg voor een veroordeling." : " — te weinig. De zaak is geseponeerd."}
        </p>
        {r.caught && r.bestRechercheur ? (
          <p>
            Beste rechercheur: <strong>{r.bestRechercheur.name}</strong> met {r.bestRechercheur.score} punten.
          </p>
        ) : null}
      </div>

      <div className="papier">
        <div className="dossier-kop">Zo werden jullie gestuurd</div>
        <ul>
          {map.reveal.punten.map((p) => (
            <li key={p}>{p}</li>
          ))}
          {duo && <li>{map.reveal.handlanger}</li>}
          <li>{state.flags?.injected ? map.reveal.fakeUsed : map.reveal.fakeUnused}</li>
        </ul>
      </div>

      <div className="papier">
        <div className="dossier-kop">Scorebord</div>
        <table className="uitslag">
          <thead>
            <tr>
              <th>Speler</th><th>R1</th><th>R2</th><th>R3</th><th>Dader</th>
              {duo && <th>Handl.</th>}
              <th>Punten</th>
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
          Details (locatie, wapen, motief{duo ? ", handlanger" : ""}) telden mee voor je punten. De
          schuldigen scoorden op elke rechercheur die de mist in ging
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
