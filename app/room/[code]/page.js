"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { maps } from "../../../data/reinhart";
import { computeResults, getPlayerId, sameSet, shuffle } from "../../../lib/game";

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

  useEffect(() => {
    let channel;
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
    }
    load();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [code]);

  const state = room?.state;
  const map = maps[state?.mapId] || maps.reinhart;
  const players = state?.players || {};
  const isHost = !!players[me]?.isHost;
  const inGame = !!players[me];
  const phase = state?.phase || "lobby";
  const myChar = state?.assignments?.[me];
  const iAmImposter = state?.imposter === me;
  const answers = state?.answers || {};

  const writeState = useCallback(
    async (next) => {
      await supabase.from("rooms").update({ state: next }).eq("id", roomRef.current.id);
    },
    []
  );

  async function submit(phaseKey, answer) {
    await supabase.rpc("submit_answer", {
      p_room: room.id,
      p_phase: phaseKey,
      p_player_id: me,
      p_answer: answer,
    });
  }

  async function startGame() {
    const ids = Object.keys(players);
    const imposter = ids[Math.floor(Math.random() * ids.length)];
    const others = shuffle(ids.filter((id) => id !== imposter));
    const chars = shuffle(map.characters.map((c) => c.id).filter((c) => c !== map.guiltyCharacter));
    const assignments = { [imposter]: map.guiltyCharacter };
    others.forEach((id, i) => {
      assignments[id] = chars[i];
    });
    await writeState({
      ...state,
      phase: "r1",
      imposter,
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
  const npcChars = map.characters.filter((c) => !playerOfChar(c.id));

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
        {map.title} · code {room.code}
      </p>

      {phase === "lobby" && (
        <Lobby
          map={map}
          players={players}
          me={me}
          isHost={isHost}
          testMode={!!state.testMode}
          onToggleTest={toggleTestMode}
          onStart={startGame}
          code={room.code}
        />
      )}

      {phase !== "lobby" && myChar && (
        <SecretPanel
          map={map}
          myChar={charOf(me)}
          iAmImposter={iAmImposter}
          open={secretOpen}
          setOpen={setSecretOpen}
          phase={phase}
          injected={!!state.flags?.injected}
          onInject={() =>
            supabase.rpc("set_flag", { p_room: room.id, p_key: "injected", p_value: true })
          }
        />
      )}

      {phase !== "lobby" && myHints.map((h) => (
        <div className="hint" key={h}>{h}</div>
      ))}

      {phase === "r1" && (
        <RoundOne
          map={map}
          players={players}
          me={me}
          charOf={charOf}
          playerOfChar={playerOfChar}
          npcChars={npcChars}
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
          myAnswer={answers.final?.[me]}
          onSubmit={(a) => submit("final", a)}
        />
      )}

      {phase === "reveal" && (
        <Reveal map={map} state={state} players={players} me={me} charOf={charOf} />
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

function Lobby({ map, players, me, isHost, testMode, onToggleTest, onStart, code }) {
  const count = Object.keys(players).length;
  const min = testMode ? 2 : map.minPlayers;
  const canStart = count >= min && count <= map.maxPlayers;
  return (
    <>
      <h1>{map.title}</h1>
      <p className="sub">{map.tagline}</p>
      <div className="nachtkaart">
        <p className="klein zacht" style={{ margin: 0 }}>Spelcode voor je vrienden</p>
        <div className="code">{code}</div>
      </div>
      <div className="nachtkaart">
        <h2>Aan tafel ({count})</h2>
        <div className="rij">
          {Object.entries(players).map(([pid, p]) => (
            <span className="speler" key={pid}>
              {p.name}{p.isHost ? " · gastvrouw/heer" : ""}{pid === me ? " (jij)" : ""}
            </span>
          ))}
        </div>
        {isHost ? (
          <>
            <p className="klein zacht">
              {map.minPlayers}–{map.maxPlayers} spelers. Iedereen krijgt een personage; één van
              jullie wordt in het geheim de dader.
            </p>
            <div className="rij">
              <button onClick={onStart} disabled={!canStart}>Start het spel</button>
              <button className="stil" onClick={onToggleTest}>
                {testMode ? "Testmodus uit" : "Testmodus aan (min. 2)"}
              </button>
            </div>
          </>
        ) : (
          <p className="klein zacht">Wachten tot de host het spel start…</p>
        )}
      </div>
    </>
  );
}

function SecretPanel({ map, myChar, iAmImposter, open, setOpen, phase, injected, onInject }) {
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
          {iAmImposter ? (
            <>
              <p>{map.imposterBriefing}</p>
              <p className="klein">
                De waarheid: {map.solution.locatie} · {map.solution.wapen} · motief:{" "}
                {map.solution.motief}.
              </p>
              {phase === "r3" && (
                <>
                  <p className="klein">
                    Je kunt éénmalig een valse aanwijzing in het dossier laten opduiken. Niemand
                    ziet dat die van jou komt.
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

function RoundOne({ map, players, me, charOf, playerOfChar, npcChars, myAnswer, onSubmit }) {
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

function FinalAccusation({ map, players, me, charOf, myAnswer, onSubmit }) {
  const [dader, setDader] = useState(myAnswer?.dader || "");
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
          onClick={() => onSubmit({ dader, locatie, wapen, motief })}
          disabled={!dader || !locatie || !wapen || !motief}
        >
          Dien mijn beschuldiging in
        </button>
      ) : (
        <p className="status zacht">Ingediend. Wachten op de onthulling…</p>
      )}
    </div>
  );
}

function Reveal({ map, state, players, me, charOf }) {
  const r = computeResults(map, state);
  const imposterName = players[r.imposterId]?.name || "?";
  const imposterChar = charOf(r.imposterId);
  const ranked = Object.keys(players)
    .map((pid) => ({ pid, name: players[pid]?.name, ...r.perPlayer[pid] }))
    .sort((a, b) => b.score - a.score);

  return (
    <>
      <div className="papier">
        <div className="dossier-kop">De onthulling</div>
        <h2>{r.caught ? "De dader is gepakt" : "De dader is ontsnapt"}</h2>
        <p>
          Het was <strong>{imposterName}</strong>, als {imposterChar?.name} ({imposterChar?.role}) —
          in de {map.solution.locatie}, met {map.solution.wapen}, vanwege {map.solution.motief}.
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
          <li>
            De barst in de alibi&#39;s: <strong>Isabel</strong> verzon dat Ruben in de keuken was —
            Ruben is nooit weggeweest. En wie &#39;uit de keuken kwam&#39;, kwam uit de kelder.
          </li>
          <li>
            Het briefje en het bittere glas waren wel degelijk belastend: de afspraak om 21:00 in de
            kelder, en gif in de wijn.
          </li>
          <li>
            {state.flags?.injected
              ? "De \u201Eaanvullende verklaring\u201D over de dienstlift was vals — ingebracht door de dader om Daniël te framen."
              : "De dader heeft de valse aanwijzing over de dienstlift níet ingezet."}
          </li>
        </ul>
      </div>

      <div className="papier">
        <div className="dossier-kop">Scorebord</div>
        <table className="uitslag">
          <thead>
            <tr><th>Speler</th><th>R1</th><th>R2</th><th>R3</th><th>Dader</th><th>Punten</th></tr>
          </thead>
          <tbody>
            {ranked.map((p) => (
              <tr key={p.pid}>
                <td>
                  {p.name}
                  {p.pid === r.imposterId ? " — de dader" : ""}
                  {p.pid === me ? " (jij)" : ""}
                </td>
                <td>{mark(p.r1)}</td>
                <td>{mark(p.r2)}</td>
                <td>{mark(p.r3)}</td>
                <td>{p.pid === r.imposterId ? "—" : mark(p.final?.dader)}</td>
                <td><strong>{p.score}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="klein zacht">
          Details (locatie, wapen, motief) telden mee voor je punten. De dader scoorde op elke
          rechercheur die de mist in ging{r.caught ? "." : " — en op de ontsnapping."}
        </p>
      </div>
    </>
  );
}

function mark(v) {
  if (v === null || v === undefined) return <span className="zacht">·</span>;
  return v ? <span className="goed">✓</span> : <span className="fout">✗</span>;
}
