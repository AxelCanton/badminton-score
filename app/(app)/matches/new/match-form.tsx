"use client";

import { useActionState, useState } from "react";

import { createMatch, type MatchFormState } from "@/lib/actions/matches";

type Player = { id: string; name: string };

const initialState: MatchFormState = {};

const fieldClass =
  "rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50";

/** Valeur par défaut du champ datetime-local : maintenant, heure locale. */
function nowForInput() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;

  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
}

export function MatchForm({ players }: { players: Player[] }) {
  const [state, formAction, pending] = useActionState(
    createMatch,
    initialState,
  );
  const [isDoubles, setIsDoubles] = useState(false);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Format</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="format"
              value="SINGLES"
              checked={!isDoubles}
              onChange={() => setIsDoubles(false)}
            />
            Simple (1 v 1)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="format"
              value="DOUBLES"
              checked={isDoubles}
              onChange={() => setIsDoubles(true)}
            />
            Double (2 v 2)
          </label>
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <TeamFields
          label="Équipe A"
          name="teamA"
          players={players}
          isDoubles={isDoubles}
        />
        <TeamFields
          label="Équipe B"
          name="teamB"
          players={players}
          isDoubles={isDoubles}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Score équipe A</span>
          <input
            name="scoreA"
            type="number"
            min={0}
            required
            defaultValue={0}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Score équipe B</span>
          <input
            name="scoreB"
            type="number"
            min={0}
            required
            defaultValue={0}
            className={fieldClass}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Date du match</span>
        <input
          name="playedAt"
          type="datetime-local"
          required
          defaultValue={nowForInput()}
          className={`${fieldClass} sm:max-w-xs`}
        />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Enregistrement…" : "Enregistrer le match"}
      </button>
    </form>
  );
}

function TeamFields({
  label,
  name,
  players,
  isDoubles,
}: {
  label: string;
  name: string;
  players: Player[];
  isDoubles: boolean;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 text-sm font-medium">{label}</legend>

      <PlayerSelect name={name} players={players} label="Joueur 1" />
      {isDoubles && (
        <PlayerSelect name={name} players={players} label="Joueur 2" />
      )}
    </fieldset>
  );
}

function PlayerSelect({
  name,
  players,
  label,
}: {
  name: string;
  players: Player[];
  label: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-black/60 dark:text-white/60">{label}</span>
      <select name={name} required defaultValue="" className={fieldClass}>
        <option value="" disabled>
          Choisir un joueur…
        </option>
        {players.map((player) => (
          <option key={player.id} value={player.id}>
            {player.name}
          </option>
        ))}
      </select>
    </label>
  );
}
