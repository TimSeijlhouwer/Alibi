"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { makeCode, getPlayerId } from "../lib/game";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(window.localStorage.getItem("dossier_name") || "");
  }, []);

  function saveName() {
    const n = name.trim();
    if (!n) {
      setError("Vul eerst je naam in.");
      return null;
    }
    window.localStorage.setItem("dossier_name", n);
    return n;
  }

  async function hostGame() {
    const n = saveName();
    if (!n) return;
    setBusy(true);
    setError("");
    const pid = getPlayerId();
    const code = makeCode();
    const state = {
      phase: "lobby",
      mapId: "reinhart",
      testMode: false,
      players: { [pid]: { name: n, isHost: true, joinedAt: Date.now() } },
      answers: {},
      flags: {},
    };
    const { error: err } = await supabase.from("rooms").insert({ code, state });
    setBusy(false);
    if (err) {
      setError("Kon geen spel aanmaken. Controleer je Supabase-instellingen.");
      return;
    }
    router.push(`/room/${code}`);
  }

  async function joinGame() {
    const n = saveName();
    if (!n) return;
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 4) {
      setError("Een spelcode bestaat uit 4 letters.");
      return;
    }
    setBusy(true);
    setError("");
    const { data, error: err } = await supabase
      .from("rooms")
      .select("id, state")
      .eq("code", code)
      .maybeSingle();
    if (err || !data) {
      setBusy(false);
      setError("Geen spel gevonden met deze code.");
      return;
    }
    const pid = getPlayerId();
    const players = data.state.players || {};
    const already = !!players[pid];
    if (!already) {
      if (data.state.phase !== "lobby") {
        setBusy(false);
        setError("Dit spel is al begonnen.");
        return;
      }
      if (Object.keys(players).length >= 8) {
        setBusy(false);
        setError("Dit spel zit vol (max. 8 spelers).");
        return;
      }
      await supabase.rpc("join_room", {
        p_room: data.id,
        p_player_id: pid,
        p_player: { name: n, isHost: false, joinedAt: Date.now() },
      });
    }
    setBusy(false);
    router.push(`/room/${code}`);
  }

  return (
    <main>
      <h1>Alibi</h1>
      <p className="sub">
        Een moord. Een storm. En één speler die precies weet wat er is gebeurd —
        omdat die het zelf heeft gedaan. Reconstrueer samen de misdaad, maar
        onthoud: de beste rechercheur speelt óók voor zichzelf.
      </p>

      <div className="nachtkaart">
        <label htmlFor="naam">Je naam</label>
        <input
          id="naam"
          type="text"
          value={name}
          maxLength={20}
          placeholder="Bijv. Sam"
          onChange={(e) => setName(e.target.value)}
        />

        <div className="rij">
          <button onClick={hostGame} disabled={busy}>
            Nieuw spel starten
          </button>
        </div>

        <label htmlFor="joincode">Of doe mee met een spelcode</label>
        <div className="rij">
          <input
            id="joincode"
            type="text"
            value={joinCode}
            maxLength={4}
            placeholder="ABCD"
            style={{ maxWidth: 140, textTransform: "uppercase" }}
            onChange={(e) => setJoinCode(e.target.value)}
          />
          <button className="stil" onClick={joinGame} disabled={busy}>
            Meedoen
          </button>
        </div>

        {error ? <p className="fout">{error}</p> : null}
      </div>

      <p className="klein zacht">
        Testversie · 3 maps: landhuis, verlaten fabriek, boshut · 4–8 spelers (of 2+ in
        testmodus) · vanaf 7 spelers werken twee schuldigen samen
      </p>
    </main>
  );
}
