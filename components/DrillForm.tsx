"use client";

import { useState } from "react";
import PitchDiagram, { type DiagramAction, type DiagramAid } from "./PitchDiagram";
import {
  ACTION_KINDS,
  ACTION_KIND_LABELS,
  AID_TYPES,
  AID_TYPE_LABELS,
  BALL_SCALINGS,
  BALL_SCALING_LABELS,
  DRILL_TYPES,
  DRILL_TYPE_LABELS,
  FIELD_TYPES,
  FIELD_TYPE_LABELS,
  SUB_THEMES,
  THEMES,
  THEME_LABELS,
  type ActionKind,
  type AidType,
  type Theme,
} from "@/lib/enums";

export type DrillFormValues = {
  title: string;
  type: string;
  theme: string;
  subTheme?: string | null;
  ageMin: number;
  ageMax: number;
  fieldType: string;
  footprintX: number;
  footprintY: number;
  minPlayers: number;
  idealPlayers: number;
  maxPlayers: number;
  durationMin: number;
  ballScaling: string;
  description: string;
  setup?: string | null;
  steps: string[];
  rules?: string | null;
  coachingPoints?: string | null;
  progressions?: string | null;
  simplifications?: string | null;
  videoUrl?: string | null;
  aids: DiagramAid[];
  actions: DiagramAction[];
};

const EMPTY: DrillFormValues = {
  title: "",
  type: "EXERCISE",
  theme: "ATTACK",
  subTheme: "",
  ageMin: 13,
  ageMax: 17,
  fieldType: "QUARTER",
  footprintX: 30,
  footprintY: 20,
  minPlayers: 6,
  idealPlayers: 8,
  maxPlayers: 8,
  durationMin: 15,
  ballScaling: "FIXED",
  description: "",
  setup: "",
  steps: [],
  rules: "",
  coachingPoints: "",
  progressions: "",
  simplifications: "",
  videoUrl: "",
  aids: [],
  actions: [],
};

export default function DrillForm({
  action,
  initial,
  submitLabel = "Opslaan",
}: {
  action: (formData: FormData) => void | Promise<void>;
  initial?: Partial<DrillFormValues>;
  submitLabel?: string;
}) {
  const start = {
    ...EMPTY,
    ...initial,
    aids: initial?.aids ?? [],
    actions: initial?.actions ?? [],
    steps: initial?.steps ?? [],
  };
  const [footprintX, setFootprintX] = useState(start.footprintX);
  const [footprintY, setFootprintY] = useState(start.footprintY);
  const [theme, setTheme] = useState(start.theme);
  const [subTheme, setSubTheme] = useState(start.subTheme ?? "");
  const [aids, setAids] = useState<DiagramAid[]>(start.aids);

  const subThemeOptions = SUB_THEMES[theme as Theme] ?? [];
  function onThemeChange(next: string) {
    setTheme(next);
    // Reset sub-theme if it no longer belongs to the newly chosen theme.
    const opts = SUB_THEMES[next as Theme] ?? [];
    if (!opts.includes(subTheme)) setSubTheme("");
  }
  const [actions, setActions] = useState<DiagramAction[]>(start.actions);
  const [steps, setSteps] = useState<string[]>(start.steps);

  function updateAid(i: number, patch: Partial<DiagramAid>) {
    setAids((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }
  function addAid() {
    setAids((prev) => [
      ...prev,
      { type: "DISC_CONE", x: Math.round(footprintX / 2), y: Math.round(footprintY / 2) },
    ]);
  }
  function removeAid(i: number) {
    setAids((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateAction(i: number, patch: Partial<DiagramAction>) {
    setActions((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }
  function addAction() {
    const cx = Math.round(footprintX / 2);
    setActions((prev) => [
      ...prev,
      { kind: "PASS", fromX: cx, fromY: Math.round(footprintY * 0.7), toX: cx, toY: Math.round(footprintY * 0.3) },
    ]);
  }
  function removeAction(i: number) {
    setActions((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateStep(i: number, value: string) {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? value : s)));
  }
  function addStep() {
    setSteps((prev) => [...prev, ""]);
  }
  function removeStep(i: number) {
    setSteps((prev) => prev.filter((_, idx) => idx !== i));
  }
  function moveStep(i: number, dir: -1 | 1) {
    setSteps((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      {/* ---- Left column: fields ---- */}
      <div className="space-y-6">
        <Section title="Algemeen">
          <Text name="title" label="Titel" defaultValue={start.title} required />
          <div className="grid grid-cols-2 gap-4">
            <Select name="type" label="Type" defaultValue={start.type}
              options={DRILL_TYPES.map((t) => [t, DRILL_TYPE_LABELS[t]])} />
            <label className="block">
              <span className="text-sm font-medium text-zinc-700">Thema</span>
              <select value={theme} onChange={(e) => onThemeChange(e.target.value)} className={inputCls}>
                {THEMES.map((t) => (
                  <option key={t} value={t}>{THEME_LABELS[t]}</option>
                ))}
              </select>
              <input type="hidden" name="theme" value={theme} />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Sub-thema (leerdoel)</span>
            <select
              name="subTheme"
              value={subTheme}
              onChange={(e) => setSubTheme(e.target.value)}
              className={inputCls}
            >
              <option value="">— geen —</option>
              {subThemeOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <Textarea name="description" label="Korte omschrijving" defaultValue={start.description} required />
        </Section>

        <Section title="Instructies">
          <Textarea name="setup" label="Opstelling (hoe zet ik het veld klaar?)" defaultValue={start.setup ?? ""} />
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-700">Stappen (genummerd, om voor te lezen)</span>
              <button type="button" onClick={addStep}
                className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700">
                + stap
              </button>
            </div>
            <div className="space-y-2">
              {steps.length === 0 && (
                <p className="text-xs text-zinc-400">Nog geen stappen. Voeg concrete instructies toe (bijv. “Speler A passt in op B”).</p>
              )}
              {steps.map((s, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="mt-2 w-4 text-right text-xs text-zinc-400">{i + 1}.</span>
                  <input type="text" value={s}
                    onChange={(e) => updateStep(i, e.target.value)}
                    placeholder="Concrete instructie…"
                    className="min-w-0 flex-1 rounded border border-zinc-300 px-2 py-1.5 text-sm" />
                  <button type="button" onClick={() => moveStep(i, -1)} title="omhoog"
                    className="rounded px-1 py-1 text-xs text-zinc-500 hover:bg-zinc-100">↑</button>
                  <button type="button" onClick={() => moveStep(i, 1)} title="omlaag"
                    className="rounded px-1 py-1 text-xs text-zinc-500 hover:bg-zinc-100">↓</button>
                  <button type="button" onClick={() => removeStep(i)} title="verwijderen"
                    className="rounded px-1.5 py-1 text-xs text-red-500 hover:bg-red-50">✕</button>
                </div>
              ))}
            </div>
          </div>
          <Textarea name="rules" label="Spelregels" defaultValue={start.rules ?? ""} />
        </Section>

        <Section title="Veld & spelers">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Select name="fieldType" label="Veldtype" defaultValue={start.fieldType}
              options={FIELD_TYPES.map((t) => [t, FIELD_TYPE_LABELS[t]])} />
            <Num name="footprintX" label="Breedte (m)" value={footprintX}
              onChange={(v) => setFootprintX(v)} />
            <Num name="footprintY" label="Lengte (m)" value={footprintY}
              onChange={(v) => setFootprintY(v)} />
            <Num name="minPlayers" label="Min. spelers" defaultValue={start.minPlayers} />
            <Num name="idealPlayers" label="Ideaal" defaultValue={start.idealPlayers} />
            <Num name="maxPlayers" label="Max. spelers" defaultValue={start.maxPlayers} />
            <Num name="durationMin" label="Duur (min)" defaultValue={start.durationMin} />
            <Num name="ageMin" label="Leeftijd van" defaultValue={start.ageMin} />
            <Num name="ageMax" label="Leeftijd tot" defaultValue={start.ageMax} />
            <Select name="ballScaling" label="Ballen nodig" defaultValue={start.ballScaling}
              options={BALL_SCALINGS.map((b) => [b, BALL_SCALING_LABELS[b]])} />
          </div>
          <p className="text-xs text-zinc-500">
            “Eén bal per speler” schaalt automatisch mee met het aantal spelers en wordt
            gecontroleerd met je aantal ballen in de instellingen.
          </p>
        </Section>

        <Section title="Coaching (optioneel)">
          <Textarea name="coachingPoints" label="Coachpunten" defaultValue={start.coachingPoints ?? ""} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Textarea name="progressions" label="Moeilijker maken" defaultValue={start.progressions ?? ""} />
            <Textarea name="simplifications" label="Makkelijker maken" defaultValue={start.simplifications ?? ""} />
          </div>
          <Text name="videoUrl" label="Video-URL" defaultValue={start.videoUrl ?? ""} />
        </Section>
      </div>

      {/* ---- Right column: aids editor + live preview ---- */}
      <div className="space-y-4">
        <div className="sticky top-4 space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-3">
            <p className="mb-2 text-sm font-semibold text-zinc-700">Veldopstelling</p>
            <PitchDiagram
              footprintX={footprintX || 1}
              footprintY={footprintY || 1}
              aids={aids}
              actions={actions}
              scale={7}
              className="w-full"
            />
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-700">Materiaal & posities</p>
              <button type="button" onClick={addAid}
                className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700">
                + toevoegen
              </button>
            </div>
            <div className="space-y-2">
              {aids.length === 0 && (
                <p className="text-xs text-zinc-400">Nog geen materiaal geplaatst.</p>
              )}
              {aids.map((a, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <select
                    value={a.type}
                    onChange={(e) => updateAid(i, { type: e.target.value as AidType })}
                    className="min-w-0 flex-1 rounded border border-zinc-300 px-1.5 py-1 text-xs"
                  >
                    {AID_TYPES.map((t) => (
                      <option key={t} value={t}>{AID_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                  <input type="number" value={a.x} title="x (m)" step={0.5}
                    onChange={(e) => updateAid(i, { x: Number(e.target.value) })}
                    className="w-12 rounded border border-zinc-300 px-1 py-1 text-xs" />
                  <input type="number" value={a.y} title="y (m)" step={0.5}
                    onChange={(e) => updateAid(i, { y: Number(e.target.value) })}
                    className="w-12 rounded border border-zinc-300 px-1 py-1 text-xs" />
                  <button type="button" onClick={() => removeAid(i)}
                    className="rounded px-1.5 py-1 text-xs text-red-500 hover:bg-red-50" title="verwijderen">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-700">Bewegingen (pijlen)</p>
              <button type="button" onClick={addAction}
                className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700">
                + toevoegen
              </button>
            </div>
            <div className="space-y-2">
              {actions.length === 0 && (
                <p className="text-xs text-zinc-400">Nog geen bewegingen. Voeg pass-/loop-/dribbelpijlen toe.</p>
              )}
              {actions.map((a, i) => (
                <div key={i} className="space-y-1 rounded border border-zinc-200 p-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 text-xs text-zinc-400">{i + 1}</span>
                    <select
                      value={a.kind}
                      onChange={(e) => updateAction(i, { kind: e.target.value as ActionKind })}
                      className="min-w-0 flex-1 rounded border border-zinc-300 px-1.5 py-1 text-xs"
                    >
                      {ACTION_KINDS.map((k) => (
                        <option key={k} value={k}>{ACTION_KIND_LABELS[k]}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => removeAction(i)}
                      className="rounded px-1.5 py-1 text-xs text-red-500 hover:bg-red-50" title="verwijderen">✕</button>
                  </div>
                  <div className="flex items-center gap-1 pl-5 text-xs text-zinc-500">
                    <span>van</span>
                    <input type="number" value={a.fromX} title="van x (m)" step={0.5}
                      onChange={(e) => updateAction(i, { fromX: Number(e.target.value) })}
                      className="w-11 rounded border border-zinc-300 px-1 py-1" />
                    <input type="number" value={a.fromY} title="van y (m)" step={0.5}
                      onChange={(e) => updateAction(i, { fromY: Number(e.target.value) })}
                      className="w-11 rounded border border-zinc-300 px-1 py-1" />
                    <span>→</span>
                    <input type="number" value={a.toX} title="naar x (m)" step={0.5}
                      onChange={(e) => updateAction(i, { toX: Number(e.target.value) })}
                      className="w-11 rounded border border-zinc-300 px-1 py-1" />
                    <input type="number" value={a.toY} title="naar y (m)" step={0.5}
                      onChange={(e) => updateAction(i, { toY: Number(e.target.value) })}
                      className="w-11 rounded border border-zinc-300 px-1 py-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <input type="hidden" name="aids" value={JSON.stringify(aids)} />
          <input type="hidden" name="actions" value={JSON.stringify(actions)} />
          <input type="hidden" name="steps" value={JSON.stringify(steps.map((s) => s.trim()).filter(Boolean))} />
          <button type="submit"
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700">
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

// ---- small field primitives ------------------------------------------------
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
      <legend className="px-1 text-sm font-semibold text-zinc-700">{title}</legend>
      {children}
    </fieldset>
  );
}

const inputCls =
  "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

function Text({ name, label, defaultValue, required }: {
  name: string; label: string; defaultValue?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <input type="text" name={name} defaultValue={defaultValue} required={required} className={inputCls} />
    </label>
  );
}

function Textarea({ name, label, defaultValue, required }: {
  name: string; label: string; defaultValue?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <textarea name={name} defaultValue={defaultValue} required={required} rows={3} className={inputCls} />
    </label>
  );
}

function Select({ name, label, defaultValue, options }: {
  name: string; label: string; defaultValue?: string; options: [string, string][];
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <select name={name} defaultValue={defaultValue} className={inputCls}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}

function Num({ name, label, defaultValue, value, onChange }: {
  name: string; label: string; defaultValue?: number; value?: number;
  onChange?: (v: number) => void;
}) {
  const controlled = value !== undefined && onChange !== undefined;
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <input
        type="number"
        name={name}
        step={0.5}
        {...(controlled
          ? { value, onChange: (e) => onChange!(Number(e.target.value)) }
          : { defaultValue })}
        className={inputCls}
      />
    </label>
  );
}
