import type { ActionKind, AidType, BallScaling, DrillType, FieldType, Theme } from "./enums";

export type SeedAid = {
  type: AidType;
  x: number; // metres from left edge of the drill footprint
  y: number; // metres from top edge of the drill footprint
  rotation?: number;
  label?: string;
};

export type SeedAction = {
  kind: ActionKind;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  order?: number;
  label?: string;
};

export type SeedDrill = {
  title: string;
  type: DrillType;
  theme: Theme;
  subTheme?: string;
  ageMin: number;
  ageMax: number;
  fieldType: FieldType;
  footprintX: number;
  footprintY: number;
  minPlayers: number;
  idealPlayers: number;
  maxPlayers: number;
  durationMin: number;
  ballScaling?: BallScaling;
  description: string;
  setup?: string;
  steps?: string[];
  rules?: string;
  coachingPoints?: string;
  progressions?: string;
  simplifications?: string;
  videoUrl?: string;
  aids: SeedAid[];
  actions?: SeedAction[];
};

// Corner disc-cones for a WxL rectangle.
function box(w: number, l: number): SeedAid[] {
  return [
    { type: "DISC_CONE", x: 0, y: 0 },
    { type: "DISC_CONE", x: w, y: 0 },
    { type: "DISC_CONE", x: 0, y: l },
    { type: "DISC_CONE", x: w, y: l },
  ];
}

// ---- Figure & action constructors (keep aids/actions readable & non-overlapping) ---
type Pt = [number, number];
const P = (x: number, y: number, label?: string): SeedAid => ({ type: "PLAYER", x, y, ...(label ? { label } : {}) });
const O = (x: number, y: number, label?: string): SeedAid => ({ type: "PLAYER_OPP", x, y, ...(label ? { label } : {}) });
const disc = (x: number, y: number): SeedAid => ({ type: "DISC_CONE", x, y });
const cone = (x: number, y: number): SeedAid => ({ type: "CONE", x, y });
const ball = (x: number, y: number): SeedAid => ({ type: "BALL", x, y });
const bigGoal = (x: number, y: number, label = "doel + keeper"): SeedAid => ({ type: "BIG_GOAL", x, y, label });
const smallGoal = (x: number, y: number, label?: string): SeedAid => ({ type: "SMALL_GOAL", x, y, ...(label ? { label } : {}) });

// A queue of n players from (x,y), each `gap` further along `dir`. First gets `label`.
function queue(x: number, y: number, n: number, label?: string, dir: Pt = [0, 2]): SeedAid[] {
  return Array.from({ length: n }, (_, i) => P(x + i * dir[0], y + i * dir[1], i === 0 ? label : undefined));
}
// n players evenly spread across width `w`, centred on cx at height y (color P=own, O=opponent).
function rowP(cx: number, y: number, n: number, w: number, color: "P" | "O" = "P"): SeedAid[] {
  const f = color === "P" ? P : O;
  if (n <= 1) return [f(cx, y)];
  const step = w / (n - 1);
  return Array.from({ length: n }, (_, i) => f(cx - w / 2 + i * step, y));
}

// Approx diagram radius (m) per figure, used to detect/resolve overlaps.
function figRadius(t: string): number {
  if (t === "PLAYER" || t === "PLAYER_OPP") return 0.93;
  if (t.includes("GOAL")) return 0;
  return 0.57; // cones, balls
}
// How "fixed" a figure is: higher stays put, lower gets nudged away on overlap.
function figPriority(a: SeedAid): number {
  if (a.type.includes("GOAL")) return 5;
  if ((a.type === "PLAYER" || a.type === "PLAYER_OPP") && a.label) return 4;
  if (a.type === "PLAYER" || a.type === "PLAYER_OPP") return 3;
  if (a.type === "DISC_CONE" || a.type === "CONE") return 2;
  return 1; // ball
}
/**
 * Nudge any two figures that sit on top of each other just far enough apart (a few
 * relaxation passes). Balls/cones move before players, and labelled players last, so
 * the drawn positions stay meaningful and action arrows (which point at players) still
 * line up. Goals are anchors and never move.
 */
function declutter(aids: SeedAid[], fx: number, fy: number): SeedAid[] {
  const arr = aids.map((a) => ({ ...a }));
  const clamp = (v: number, hi: number) => Math.max(0.3, Math.min(hi - 0.3, v));
  for (let pass = 0; pass < 10; pass++) {
    let moved = false;
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i], b = arr[j];
        if (a.type.includes("GOAL") || b.type.includes("GOAL")) continue;
        const min = figRadius(a.type) + figRadius(b.type) + 0.1;
        let dx = b.x - a.x, dy = b.y - a.y;
        let dist = Math.hypot(dx, dy);
        if (dist >= min) continue;
        if (dist < 1e-6) { dx = 0.12; dy = 0.09; dist = Math.hypot(dx, dy); }
        const push = min - dist;
        const ux = dx / dist, uy = dy / dist;
        if (figPriority(b) <= figPriority(a)) {
          b.x = clamp(b.x + ux * push, fx); b.y = clamp(b.y + uy * push, fy);
        } else {
          a.x = clamp(a.x - ux * push, fx); a.y = clamp(a.y - uy * push, fy);
        }
        moved = true;
      }
    }
    if (!moved) break;
  }
  return arr;
}

const pass = (f: Pt, t: Pt, label?: string): SeedAction => ({ kind: "PASS", fromX: f[0], fromY: f[1], toX: t[0], toY: t[1], ...(label ? { label } : {}) });
const run = (f: Pt, t: Pt, label?: string): SeedAction => ({ kind: "RUN", fromX: f[0], fromY: f[1], toX: t[0], toY: t[1], ...(label ? { label } : {}) });
const dribble = (f: Pt, t: Pt, label?: string): SeedAction => ({ kind: "DRIBBLE", fromX: f[0], fromY: f[1], toX: t[0], toY: t[1], ...(label ? { label } : {}) });
const carry = (f: Pt, t: Pt, label?: string): SeedAction => ({ kind: "CARRY", fromX: f[0], fromY: f[1], toX: t[0], toY: t[1], ...(label ? { label } : {}) });
const shot = (f: Pt, t: Pt, label?: string): SeedAction => ({ kind: "SHOT", fromX: f[0], fromY: f[1], toX: t[0], toY: t[1], ...(label ? { label } : {}) });

// NOTE: this starter set is intentionally small (P1). It is expanded toward ~100
// U15 drills in P6. Every theme has >= 2 EXERCISE drills so a split block (two
// same-theme stations, groups rotating) can always be filled.
const RAW_SEED_DRILLS: SeedDrill[] = [
  // ==== EXEMPLAR DRILLS (gold-standard: setup + numbered steps + arrows) =====
  // These set the quality bar for the whole library: concrete instructions the
  // coach can read out, lettered players, and pass/run/dribble/shot arrows.
  {
    title: "Passruit — pass en volg",
    type: "WARMUP",
    theme: "NEUTRAL",
    ageMin: 12,
    ageMax: 18,
    fieldType: "QUARTER",
    footprintX: 18,
    footprintY: 18,
    minPlayers: 8,
    idealPlayers: 12,
    maxPlayers: 16,
    durationMin: 10,
    ballScaling: "FIXED",
    description:
      "Klassieke passvorm in een ruit waarbij je je eigen pass volgt. Rustig starten, tempo opvoeren.",
    setup:
      "Zet een vierkant van 15×15 m met vier pylonen. Bij elke pylon staat minstens één speler; de rest sluit aan achter de pylon. Eén bal per ruit; bij 12+ spelers twee ruiten naast elkaar.",
    steps: [
      "Speler A passt strak over de grond naar speler B.",
      "Direct na de pass loopt A rustig achter de bal aan naar de pylon van B.",
      "B neemt aan met de binnenkant, passt naar C en volgt zijn eigen pass naar C.",
      "Zo gaat het met de klok mee door: passen, dan zelf doorschuiven.",
      "Na 3 minuten de andere kant op (tegen de klok in) en met andere voet.",
    ],
    rules: "Maximaal 2× raken: aannemen en passen.",
    coachingPoints:
      "Speel op de goede voet (verste van de tegenstander), pass strak en over de grond, geef aan met je hand of stem.",
    progressions: "Eén keer raken (direct); voeg een tweede bal toe.",
    simplifications: "Maak de ruit groter en sta 3× raken toe.",
    aids: [
      // Positie A (linksboven) met wachtrij
      { type: "CONE", x: 2, y: 2 },
      { type: "PLAYER", x: 3.8, y: 2, label: "A" },
      { type: "PLAYER", x: 2, y: 4 },
      { type: "PLAYER", x: 2, y: 6 },
      // Positie B (rechtsboven)
      { type: "CONE", x: 16, y: 2 },
      { type: "PLAYER", x: 14.2, y: 2, label: "B" },
      { type: "PLAYER", x: 16, y: 4 },
      { type: "PLAYER", x: 16, y: 6 },
      // Positie C (rechtsonder)
      { type: "CONE", x: 16, y: 16 },
      { type: "PLAYER", x: 14.2, y: 16, label: "C" },
      { type: "PLAYER", x: 16, y: 14 },
      { type: "PLAYER", x: 16, y: 12 },
      // Positie D (linksonder)
      { type: "CONE", x: 2, y: 16 },
      { type: "PLAYER", x: 3.8, y: 16, label: "D" },
      { type: "PLAYER", x: 2, y: 14 },
      { type: "PLAYER", x: 2, y: 12 },
      { type: "BALL", x: 5.6, y: 2 },
    ],
    actions: [
      { kind: "PASS", fromX: 4.6, fromY: 2, toX: 13.4, toY: 2, label: "pass" },
      { kind: "RUN", fromX: 3.8, fromY: 3.2, toX: 13.4, toY: 3.2, label: "volg je pass" },
    ],
  },
  {
    title: "Afwerken via de 1-2",
    type: "EXERCISE",
    theme: "ATTACK",
    ageMin: 13,
    ageMax: 18,
    fieldType: "QUARTER",
    footprintX: 22,
    footprintY: 30,
    minPlayers: 6,
    idealPlayers: 8,
    maxPlayers: 10,
    durationMin: 15,
    ballScaling: "FIXED",
    description:
      "Combinatie via een 1-2 met een dieptepass en afronden op doel. De hele groep schuift steeds een positie door.",
    setup:
      "Groot doel met keeper aan de korte zijde. Zet met schijfhoedjes vier posities uit: A centraal onderin (met de ballen), B links, C linksvoor, D rechts. Leg de ballen bij A; de overige spelers wachten in een rij achter positie A.",
    steps: [
      "Speler A passt in op speler B.",
      "Speler B kaatst de bal (1-2) met speler C.",
      "Speler C legt de bal in één keer terug in de loop van B.",
      "Speler B speelt een dieptepass op speler D.",
      "Speler D neemt de bal mee naar binnen en werkt af op doel.",
      "Doorschuiven: A→B, B→C, C→D, D sluit achteraan bij A. Ook vanaf de rechterkant starten.",
    ],
    rules: "B en C spelen in één keer (direct). D mag 2× raken vóór het schot.",
    coachingPoints:
      "Hoofd omhoog om te kijken waar de bal naartoe moet; pas de balsnelheid aan; timing van de dieptepass op de loop, niet in de voeten.",
    progressions: "Voeg een passieve verdediger bij D toe; afronden in maximaal 2 contacten.",
    simplifications: "Speel de dieptepass in de voeten in plaats van in de loop.",
    aids: [
      { type: "BIG_GOAL", x: 11, y: 1.2 },
      { type: "PLAYER", x: 11, y: 3.4, label: "K" },
      // Positie A met wachtrij (ideaal 8 spelers)
      { type: "PLAYER", x: 10, y: 22, label: "A" },
      { type: "PLAYER", x: 10, y: 24 },
      { type: "PLAYER", x: 10, y: 26 },
      { type: "PLAYER", x: 10, y: 28 },
      { type: "DISC_CONE", x: 12.5, y: 22 },
      { type: "PLAYER", x: 6, y: 18, label: "B" },
      { type: "DISC_CONE", x: 4, y: 18 },
      { type: "PLAYER", x: 6, y: 11, label: "C" },
      { type: "DISC_CONE", x: 4, y: 11 },
      { type: "PLAYER", x: 17.5, y: 16, label: "D" },
      { type: "DISC_CONE", x: 19.5, y: 16 },
      { type: "BALL", x: 11.6, y: 20.4 },
    ],
    actions: [
      { kind: "PASS", fromX: 10, fromY: 22, toX: 6, toY: 18, label: "1" },
      { kind: "PASS", fromX: 6.5, fromY: 18, toX: 6.5, toY: 11, label: "2" },
      { kind: "PASS", fromX: 5.5, fromY: 11, toX: 5.5, toY: 18, label: "3" },
      { kind: "PASS", fromX: 6, fromY: 18, toX: 17, toY: 16, label: "4 diep" },
      { kind: "CARRY", fromX: 17.5, fromY: 15, toX: 13, toY: 8, label: "meenemen" },
      { kind: "SHOT", fromX: 13, fromY: 8, toX: 11, toY: 3.6, label: "schot" },
    ],
  },
  {
    title: "Dieptepass en voorzet afronden",
    type: "EXERCISE",
    theme: "ATTACK",
    ageMin: 13,
    ageMax: 18,
    fieldType: "QUARTER",
    footprintX: 22,
    footprintY: 30,
    minPlayers: 6,
    idealPlayers: 8,
    maxPlayers: 10,
    durationMin: 15,
    ballScaling: "FIXED",
    description:
      "Opbouw via de vleugel met een voorzet die door de inkomende spelers wordt afgerond.",
    setup:
      "Groot doel met keeper. A start centraal met de bal, B is de vleugelspeler rechts, C komt vanuit het midden inlopen. Schijfhoedjes markeren de startposities; de overige spelers wachten in een rij achter positie A.",
    steps: [
      "Speler A speelt een dieptepass op vleugelspeler B.",
      "Speler B neemt mee tot de achterlijn en geeft een lage voorzet.",
      "Speler C timet zijn loop en rondt de voorzet in één keer af.",
      "A sluit aan als tweede inkomende speler op de tweede paal.",
      "Doorschuiven: A→B→C→achteraan. Wissel na 4 minuten van vleugel.",
    ],
    rules: "Voorzet laag en hard; afronden in één contact.",
    coachingPoints:
      "Timing van de inloop: kom van achteren, niet te vroeg. Voorzet vóór de keeper, achter de laatste verdediger.",
    progressions: "Voeg een tweede afmaker toe op de tweede paal.",
    simplifications: "Sta een controle toe vóór het afronden; hogere, langzamere voorzet.",
    aids: [
      { type: "BIG_GOAL", x: 11, y: 1.2 },
      { type: "PLAYER", x: 11, y: 3.4, label: "K" },
      // Positie A met wachtrij (ideaal 8 spelers)
      { type: "PLAYER", x: 8, y: 23, label: "A" },
      { type: "PLAYER", x: 8, y: 25 },
      { type: "PLAYER", x: 8, y: 27 },
      { type: "PLAYER", x: 8, y: 29 },
      { type: "DISC_CONE", x: 10, y: 23 },
      { type: "PLAYER", x: 18, y: 18, label: "B" },
      { type: "DISC_CONE", x: 20, y: 18 },
      { type: "PLAYER", x: 10, y: 13, label: "C" },
      { type: "PLAYER", x: 10, y: 15 },
      { type: "DISC_CONE", x: 11.7, y: 13 },
      { type: "BALL", x: 9, y: 21 },
    ],
    actions: [
      { kind: "PASS", fromX: 8, fromY: 23, toX: 18, toY: 18, label: "1 diep" },
      { kind: "CARRY", fromX: 18, fromY: 17.5, toX: 18, toY: 7, label: "meenemen" },
      { kind: "PASS", fromX: 18, fromY: 6.5, toX: 11, toY: 6, label: "voorzet" },
      { kind: "RUN", fromX: 10, fromY: 13, toX: 11, toY: 6.5, label: "inloop" },
      { kind: "SHOT", fromX: 11, fromY: 5.5, toX: 11, toY: 3.6, label: "afronden" },
    ],
  },
  {
    title: "Partij 6-6 met accent op diepte",
    type: "MATCHFORM",
    theme: "ATTACK",
    ageMin: 13,
    ageMax: 18,
    fieldType: "HALF",
    footprintX: 44,
    footprintY: 30,
    minPlayers: 10,
    idealPlayers: 12,
    maxPlayers: 16,
    durationMin: 20,
    ballScaling: "FIXED",
    description:
      "Positiespel richting twee grote doelen met keepers, met de opdracht om zo snel mogelijk de diepte te zoeken.",
    setup:
      "Half veld met aan beide korte zijden een groot doel en een keeper. Verdeel in twee teams met hesjes. Leg reserveballen bij beide doelen zodat het spel snel doorgaat.",
    steps: [
      "Vrije partij 6 tegen 6 op de twee grote doelen.",
      "Bij balbezit: probeer binnen drie passes een speler diep aan te spelen.",
      "Een doelpunt na een dieptepass telt dubbel.",
      "Bij balverlies schakelt het hele team direct om en zet druk op de bal.",
    ],
    rules: "Doelpunt na een dieptepass = 2 punten. Buitenspel geldt niet.",
    coachingPoints:
      "Kijk vóór je aanneemt of de diepte openligt; blijf speelbaar door hoekjes te maken; snel omschakelen bij balverlies.",
    progressions: "Maximaal 3× raken in eigen helft.",
    simplifications: "Vrij aantal keren raken; groter veld voor meer ruimte.",
    aids: [
      // Blauw team (verdedigt boven, valt naar onderen aan) — 6 incl. keeper
      { type: "BIG_GOAL", x: 22, y: 1.2 },
      { type: "PLAYER", x: 22, y: 3.4, label: "K" },
      { type: "PLAYER", x: 12, y: 8 },
      { type: "PLAYER", x: 32, y: 8 },
      { type: "PLAYER", x: 22, y: 12 },
      { type: "PLAYER", x: 15, y: 16 },
      { type: "PLAYER", x: 26, y: 21 },
      // Oranje team — 6 incl. keeper
      { type: "BIG_GOAL", x: 22, y: 28.8 },
      { type: "PLAYER_OPP", x: 22, y: 26.6, label: "K" },
      { type: "PLAYER_OPP", x: 12, y: 22 },
      { type: "PLAYER_OPP", x: 32, y: 22 },
      { type: "PLAYER_OPP", x: 22, y: 20 },
      { type: "PLAYER_OPP", x: 16, y: 24 },
      { type: "PLAYER_OPP", x: 30, y: 17 },
      { type: "BALL", x: 23.4, y: 10.8 },
    ],
    actions: [
      { kind: "PASS", fromX: 22, fromY: 12, toX: 15, toY: 16, label: "1" },
      { kind: "PASS", fromX: 15, fromY: 16, toX: 26, toY: 20.5, label: "2 diep" },
    ],
  },

  // ---- Warming-ups ---------------------------------------------------------
  {
    title: "Passen en bewegen in het vierkant",
    type: "WARMUP",
    theme: "NEUTRAL",
    ageMin: 13,
    ageMax: 17,
    fieldType: "QUARTER",
    footprintX: 20,
    footprintY: 20,
    minPlayers: 6,
    idealPlayers: 12,
    maxPlayers: 16,
    durationMin: 12,
    description:
      "Spelers passen in een vierkant en bewegen na de pass mee. Twee ballen tegelijk om het tempo hoog te houden.",
    setup:
      "Vierkant van 18×18 m met pylonen op de hoeken. Verdeel de spelers over de vier zijden. Twee ballen in het spel, diagonaal van elkaar.",
    steps: [
      "Speler met bal passt naar een vrije speler op een andere zijde.",
      "Na de pass loopt de passer mee naar een vrije plek (niet stilstaan).",
      "De ontvanger neemt aan met de juiste voet en speelt door.",
      "Houd beide ballen tegelijk in beweging; kijk op vóór je passt.",
    ],
    rules: "Maximaal 3× raken; na 4 minuten alleen nog 2× raken.",
    coachingPoints:
      "Aanspeelbaar staan, inspeelmoment kiezen, pass met de juiste snelheid en op de goede voet.",
    progressions: "Beperk tot één of twee keer raken; voeg een derde bal toe.",
    simplifications: "Werk met één bal en een groter vierkant.",
    aids: [
      ...box(20, 20),
      // Spelers verdeeld over de vier zijden (12 totaal)
      P(6, 1.5), P(10, 1.5), P(14, 1.5),
      P(6, 18.5), P(10, 18.5), P(14, 18.5),
      P(1.5, 6), P(1.5, 10), P(1.5, 14),
      P(18.5, 6), P(18.5, 10), P(18.5, 14),
      ball(8, 1.5), ball(12, 18.5),
    ],
    actions: [
      pass([8, 2], [18, 9], "pass"),
      run([10, 2.5], [17.5, 9.5], "beweeg mee"),
    ],
  },
  {
    title: "Tikspel met bal — iedereen aan de bal",
    type: "WARMUP",
    theme: "NEUTRAL",
    ageMin: 12,
    ageMax: 17,
    fieldType: "QUARTER",
    footprintX: 25,
    footprintY: 25,
    minPlayers: 8,
    idealPlayers: 14,
    maxPlayers: 16,
    durationMin: 10,
    ballScaling: "PER_PLAYER",
    description:
      "Iedereen dribbelt met een bal in het vak. Twee tikkers (met hesje) proberen af te tikken.",
    setup:
      "Vak van 23×23 m met pylonen op de hoeken. Iedereen een bal, behalve de twee tikkers (hesje). Afgetikte spelers doen 5 jongleer-tikjes en gaan weer verder.",
    steps: [
      "Alle spelers dribbelen vrij door het vak, bal dicht aan de voet.",
      "De twee tikkers (zonder bal) proberen een dribbelaar aan te tikken.",
      "Ben je getikt? Doe je taak (5 tikjes) en speel weer mee.",
      "Vol vak? Kap en draai weg uit de drukte, hoofd omhoog.",
    ],
    rules: "Tikkers mogen niet tegen ballen trappen; alleen met de hand tikken.",
    coachingPoints: "Bal dicht bij de voet, hoofd omhoog, kappen en draaien om ruimte te vinden.",
    progressions: "Verklein het vak of voeg een tikker toe.",
    simplifications: "Vergroot het vak of tik zonder bal.",
    aids: [
      ...box(25, 25),
      // 2 tikkers (oranje) + 12 dribbelaars met bal
      O(12, 12, "T"), O(6, 18, "T"),
      P(5, 5), ball(6.2, 5),
      P(12, 5), ball(13.2, 5),
      P(19, 5), ball(20.2, 5),
      P(19, 12), ball(20.2, 12),
      P(19, 19), ball(20.2, 19),
      P(12, 19), ball(13.2, 19),
      P(5, 19), ball(6.2, 19),
      P(5, 12), ball(6.2, 12),
      P(9, 9), ball(10.2, 9),
      P(16, 9), ball(17.2, 9),
      P(16, 16), ball(17.2, 16),
      P(9, 16), ball(10.2, 16),
    ],
    actions: [
      dribble([9, 9], [11, 6], "dribbel"),
      run([12, 12], [10.5, 8], "tik!"),
    ],
  },

  // ---- Aanvallen (ATTACK) --------------------------------------------------
  {
    title: "Positiespel 4-tegen-2 naar een klein doel",
    type: "EXERCISE",
    theme: "ATTACK",
    ageMin: 13,
    ageMax: 17,
    fieldType: "QUARTER",
    footprintX: 28,
    footprintY: 20,
    minPlayers: 6,
    idealPlayers: 7,
    maxPlayers: 8,
    durationMin: 15,
    description:
      "Vier baltbezitters houden de bal vast tegen twee verdedigers; na genoeg passes scoren op het kleine doel.",
    setup:
      "Vak 28×20 m met een klein doel aan de bovenkant. Vier aanvallers (blauw) rond het vak, één aanspeelpunt bij het doel, twee verdedigers (oranje) in het midden. Ballen bij de aanvallers.",
    steps: [
      "De vier aanvallers spelen de bal rond en zoeken steeds de vrije man.",
      "De twee verdedigers proberen de bal te veroveren of aan te raken.",
      "Na 6 passes op rij mag er ingespeeld worden op het aanspeelpunt bij het doel.",
      "Het aanspeelpunt legt klaar of scoort in het kleine doel; daarna wisselen.",
    ],
    rules: "Aanvallers maximaal 2× raken. Bij balverlies wisselt de foutmaker met een verdediger.",
    coachingPoints: "Hoeken opzoeken, breedte en diepte geven, derde man aanspelen.",
    progressions: "Verhoog het aantal verdedigers naar drie.",
    simplifications: "Vergroot de ruimte of speel 4-tegen-1.",
    aids: [
      smallGoal(14, 0, "doel"),
      P(4, 14, "A"), P(24, 14, "B"), P(8, 6, "C"), P(20, 6, "D"),
      P(14, 3, "E"),
      O(12, 11, "1"), O(16, 9, "2"),
      ball(5.5, 14),
    ],
    actions: [
      pass([4, 14], [20, 6], "1"),
      pass([20, 6], [14, 4], "2"),
      shot([14, 3], [14, 0.6], "scoren"),
    ],
  },
  {
    title: "Combineren en afronden op groot doel",
    type: "EXERCISE",
    theme: "ATTACK",
    ageMin: 14,
    ageMax: 18,
    fieldType: "QUARTER",
    footprintX: 30,
    footprintY: 25,
    minPlayers: 6,
    idealPlayers: 8,
    maxPlayers: 9,
    durationMin: 18,
    description:
      "Via een vaste combinatie (pass–terug–diep) afronden op het grote doel met keeper. Wissel van kant na elke poging.",
    setup:
      "Groot doel met keeper aan de bovenkant. Startpylon met de ballen onderin (A), een kaatser (B) centraal en een afmaker-startpunt rechts (C). Overige spelers wachten achter A.",
    steps: [
      "Speler A speelt in op kaatser B.",
      "B kaatst de bal terug in de loop van A.",
      "A speelt een dieptepass op C, die naar binnen komt.",
      "C neemt mee en werkt af op doel; daarna doorschuiven A→B→C.",
    ],
    rules: "In één keer kaatsen (B), afronden in maximaal 2 contacten.",
    coachingPoints: "Timing van de inloop, scherpe passing, bewust afronden (plaatsen of hard).",
    progressions: "Voeg een passieve en daarna actieve verdediger toe.",
    simplifications: "Zonder verdediger, kortere afstand tot het doel.",
    aids: [
      bigGoal(15, 1.2),
      P(15, 3.4, "K"),
      ...queue(8, 19, 4, "A"),
      disc(6.5, 19),
      P(15, 13, "B"),
      P(22, 17, "C"),
      P(22, 20, "D"),
      disc(23.5, 17),
      ball(9.4, 18),
    ],
    actions: [
      pass([8, 19], [15, 13], "1"),
      pass([15, 13], [9, 18.5], "2 kaats"),
      pass([9, 18], [22, 17], "3 diep"),
      carry([22, 16.5], [17, 7], "meenemen"),
      shot([17, 7], [15, 3.6], "schot"),
    ],
  },

  // ---- Verdedigen (DEFEND) -------------------------------------------------
  {
    title: "Druk zetten 3-tegen-3 met steunpunten",
    type: "EXERCISE",
    theme: "DEFEND",
    ageMin: 13,
    ageMax: 17,
    fieldType: "QUARTER",
    footprintX: 28,
    footprintY: 20,
    minPlayers: 6,
    idealPlayers: 8,
    maxPlayers: 8,
    durationMin: 15,
    description:
      "3-tegen-3 met twee steunpunten op de zijkant. Het verdedigende team zet druk, verovert de bal en scoort op een klein doeltje.",
    setup:
      "Vak 28×20 m met twee kleine doeltjes aan de bovenkant. Balbezittend team (blauw) met twee steunpunten langs de zijlijn, verdedigend team (oranje) in het midden.",
    steps: [
      "Blauw speelt de bal rond en gebruikt de steunpunten op de zijkant.",
      "Oranje zet samen druk op de baldrager en knijpt de ruimte dicht.",
      "Wint oranje de bal, dan schakelen ze om en scoren op een van de doeltjes.",
      "Na balverovering of doelpunt wisselen de teams van rol.",
    ],
    rules: "Steunpunten spelen maximaal 2× raken en mogen niet zelf scoren.",
    coachingPoints: "Druk op de baldrager, kantelen, dekkingsschaduw, samen verdedigen.",
    progressions: "Steunpunten worden actief meespelend.",
    simplifications: "Geef het verdedigende team een extra speler.",
    aids: [
      smallGoal(6, 0), smallGoal(22, 0),
      P(8, 15, "A"), P(14, 17, "B"), P(20, 15, "C"),
      P(1.5, 10, "S"), P(26.5, 10, "S"),
      O(10, 9, "1"), O(14, 7, "2"), O(18, 9, "3"),
      ball(15.4, 17),
    ],
    actions: [
      pass([14, 17], [1.5, 11], "steunpunt"),
      run([14, 7], [13, 13], "druk"),
    ],
  },
  {
    title: "Zone verdedigen 4-tegen-4",
    type: "EXERCISE",
    theme: "DEFEND",
    ageMin: 14,
    ageMax: 18,
    fieldType: "QUARTER",
    footprintX: 32,
    footprintY: 24,
    minPlayers: 8,
    idealPlayers: 8,
    maxPlayers: 10,
    durationMin: 16,
    description:
      "Vier verdedigers verdedigen als linie hun zone tegen vier aanvallers. Bal veroveren en uitverdedigen naar een steunpunt = punt.",
    setup:
      "Vak 32×24 m; twee kleine doeltjes aan de onderkant die de verdedigers (oranje) verdedigen. Vier aanvallers (blauw) starten bovenin met de bal.",
    steps: [
      "Blauw valt aan en probeert door de zone te scoren op een doeltje.",
      "De oranje linie blijft op onderlinge afstand en schuift mee met de bal.",
      "De speler dichtst bij de bal knijpt erop; de rest dekt de ruimte.",
      "Na balwinst verdedigt oranje uit naar een steunpunt = punt.",
    ],
    rules: "De verdedigende linie mag niet verder dan 3 m uit elkaar staan.",
    coachingPoints: "Onderlinge afstanden, knijpen naar de bal, op het juiste moment doorschuiven.",
    progressions: "Voeg een spits toe (4v5) om de linie te belasten.",
    simplifications: "Verklein de breedte van de zone.",
    aids: [
      smallGoal(8, 24), smallGoal(24, 24),
      ...rowP(16, 6, 4, 24, "P"),
      ...rowP(16, 15, 4, 22, "O"),
      ball(5.6, 6),
    ],
    actions: [
      pass([4, 6], [16, 6], "verplaatsen"),
      run([16, 15], [14, 10], "knijpen"),
    ],
  },

  // ---- Omschakelen (TRANSITION) -------------------------------------------
  {
    title: "Omschakelen 4-tegen-4 op vier doeltjes",
    type: "EXERCISE",
    theme: "TRANSITION",
    ageMin: 13,
    ageMax: 18,
    fieldType: "QUARTER",
    footprintX: 30,
    footprintY: 22,
    minPlayers: 8,
    idealPlayers: 8,
    maxPlayers: 8,
    durationMin: 15,
    description:
      "4-tegen-4 met aan beide kanten twee kleine doeltjes. Bij balverlies of balwinst direct omschakelen.",
    setup:
      "Vak 30×22 m met twee kleine doeltjes aan élke korte zijde. Blauw en oranje verdeeld over het vak; blauw start met de bal.",
    steps: [
      "Blauw valt aan op de twee doeltjes aan één kant.",
      "Oranje verdedigt en probeert de bal te veroveren.",
      "Bij balwinst schakelt oranje direct om naar de doeltjes aan de andere kant.",
      "De eerste actie na balverlies/balwinst is het belangrijkst — meteen handelen.",
    ],
    rules: "Na balwinst mag er pas gescoord worden nadat de bal één keer is rondgespeeld.",
    coachingPoints: "Snel handelen na balverlies/balwinst, eerste actie is de belangrijkste.",
    progressions: "Beperk het aantal keer raken bij balbezit.",
    simplifications: "Vergroot de ruimte zodat er meer tijd is.",
    aids: [
      smallGoal(8, 0), smallGoal(22, 0), smallGoal(8, 22), smallGoal(22, 22),
      P(9, 7, "A"), P(6, 12, "B"), P(14, 11, "C"), P(9, 16, "D"),
      O(21, 7, "1"), O(24, 12, "2"), O(17, 11, "3"), O(21, 16, "4"),
      ball(12.6, 11),
    ],
    actions: [
      pass([14, 11], [9, 7], "opbouw"),
      run([17, 11], [14.5, 11], "omschakelen"),
    ],
  },
  {
    title: "Counteren na balwinst — 3v3 + spits",
    type: "EXERCISE",
    theme: "TRANSITION",
    ageMin: 14,
    ageMax: 18,
    fieldType: "QUARTER",
    footprintX: 32,
    footprintY: 22,
    minPlayers: 7,
    idealPlayers: 8,
    maxPlayers: 9,
    durationMin: 16,
    description:
      "Na balwinst direct omschakelen en de diepgaande spits vinden om te counteren op het grote doel.",
    setup:
      "Groot doel met keeper aan de bovenkant, twee kleine doeltjes onderin. 3 blauw tegen 3 oranje in het midden, met een blauwe spits vooraan.",
    steps: [
      "Oranje is in balbezit en probeert te scoren op de kleine doeltjes.",
      "Blauw verovert de bal en schakelt direct om.",
      "Blauw speelt zo snel mogelijk diep op de spits.",
      "De spits neemt mee of werkt in één keer af op het grote doel.",
    ],
    rules: "Na balwinst binnen 8 seconden afronden, anders begint oranje opnieuw.",
    coachingPoints: "Diepte kiezen, tempo in de omschakeling, keuze pass of dribbel.",
    progressions: "Verklein de tijd om af te ronden na balwinst.",
    simplifications: "Zonder tijdslimiet, extra aanvaller.",
    aids: [
      bigGoal(16, 1.2),
      O(16, 3.4, "K"),
      smallGoal(8, 22), smallGoal(24, 22),
      P(10, 12, "A"), P(16, 14, "B"), P(22, 12, "C"),
      P(19, 6, "S"),
      O(10, 9, "1"), O(16, 8, "2"), O(22, 9, "3"),
      ball(17.4, 14),
    ],
    actions: [
      pass([16, 14], [19, 7], "counter"),
      shot([19, 5.5], [16, 1.8], "afronden"),
    ],
  },

  // ---- Partijvormen (MATCHFORM) -------------------------------------------
  {
    title: "Partij 8-tegen-8 op grote doelen",
    type: "MATCHFORM",
    theme: "NEUTRAL",
    ageMin: 13,
    ageMax: 19,
    fieldType: "HALF",
    footprintX: 50,
    footprintY: 35,
    minPlayers: 12,
    idealPlayers: 16,
    maxPlayers: 18,
    durationMin: 20,
    description:
      "Afsluitende partij op twee grote doelen met keepers. Laat het thema van de training terugkomen met een korte extra regel.",
    setup:
      "Half veld met aan beide korte zijden een groot doel en keeper. Twee teams van 8 (incl. keeper) met hesjes. Reserveballen bij de doelen.",
    steps: [
      "Vrije partij 8 tegen 8 op de twee grote doelen.",
      "Speel wat er is getraind; probeer het thema van vandaag terug te laten komen.",
      "Bij een dode bal snel doorspelen met een reservebal.",
      "Coach kort en positief; laat de kinderen vooral voetballen.",
    ],
    rules: "Voeg een themaregel toe (bijv. punt voor druk zetten binnen 5 sec).",
    coachingPoints: "Speel wat is getraind; coach kort en positief op het thema.",
    progressions: "Voeg een themaregel toe (bijv. punt voor druk zetten binnen 5 sec).",
    simplifications: "Speel met minder spelers en meer ruimte.",
    aids: [
      bigGoal(25, 1.2), bigGoal(25, 33.8),
      P(25, 3.4, "K"), ...rowP(25, 10, 3, 30), ...rowP(25, 16, 3, 24), P(25, 21),
      O(25, 31.6, "K"), ...rowP(25, 25, 3, 30, "O"), ...rowP(25, 20, 3, 24, "O"), O(25, 15),
      ball(26.4, 15),
    ],
    actions: [
      pass([25, 16], [37, 16], "opbouw"),
      pass([37, 16], [31, 23], "diep"),
    ],
  },
  {
    title: "Partij met accent aanvallen 7-tegen-7",
    type: "MATCHFORM",
    theme: "ATTACK",
    ageMin: 13,
    ageMax: 19,
    fieldType: "HALF",
    footprintX: 48,
    footprintY: 34,
    minPlayers: 10,
    idealPlayers: 14,
    maxPlayers: 16,
    durationMin: 20,
    description:
      "Partij waarin aanvallen wordt beloond: een doelpunt na een flankaanval of combinatie telt dubbel.",
    setup:
      "Half veld met twee grote doelen en keepers. Twee teams van 7 (incl. keeper). Reserveballen bij de doelen zodat het spel doorgaat.",
    steps: [
      "Vrije partij 7 tegen 7 met de opdracht om te blijven aanvallen.",
      "Zoek breedte via de flanken en versnel op het juiste moment.",
      "Een doelpunt na een flankaanval of combinatie telt dubbel.",
      "Blijf na balverlies niet hangen: druk zetten of terug organiseren.",
    ],
    rules: "Doelpunt na flankaanval / combinatie = 2 punten.",
    coachingPoints: "Breedte en diepte in de aanval, durf te versnellen, afronden.",
    progressions: "Beperk het aantal keer raken van het verdedigende team.",
    simplifications: "Geef het aanvallende team een extra speler.",
    aids: [
      bigGoal(24, 1.2), bigGoal(24, 32.8),
      P(24, 3.4, "K"), ...rowP(24, 10, 3, 30), P(16, 15), P(32, 15), P(24, 14),
      O(24, 30.6, "K"), ...rowP(24, 25, 3, 30, "O"), O(16, 19), O(32, 19), O(24, 20),
      ball(25.4, 14),
    ],
    actions: [
      pass([24, 14], [32, 15], "breed"),
      pass([32, 15], [30, 22], "voorzet"),
    ],
  },

  // ==== extra warming-ups ===================================================
  {
    title: "Rondo 5-tegen-2",
    type: "WARMUP", theme: "NEUTRAL", ageMin: 13, ageMax: 18,
    fieldType: "QUARTER", footprintX: 12, footprintY: 12,
    minPlayers: 7, idealPlayers: 10, maxPlayers: 14, durationMin: 10,
    description:
      "Vijf spelers houden de bal rond, twee in het midden proberen te onderscheppen.",
    setup:
      "Vijfhoek van pylonen (±10 m). Vijf spelers op de punten (blauw), twee pakkers in het midden (oranje). Overige spelers wisselen in bij balverlies.",
    steps: [
      "De vijf buitenspelers spelen de bal rond, laag over de grond.",
      "De twee pakkers in het midden jagen samen op de bal.",
      "Wie balverlies veroorzaakt of onderschept wordt, gaat het midden in.",
      "Speel zoveel mogelijk in één keer; kaats op de eerste vrije man.",
    ],
    rules: "Maximaal 2× raken; alleen over de grond spelen.",
    coachingPoints: "Aanspeelbaar staan, eerste raak spelen, tempo hoog houden.",
    progressions: "Beperk tot 1× raken; verklein de vijfhoek.",
    simplifications: "Vergroot de ruimte of speel 5-tegen-1.",
    aids: [
      P(2, 2, "A"), P(10, 2, "B"), P(11.5, 7.5, "C"), P(6, 11, "D"), P(0.5, 7.5, "E"),
      O(5, 6, "1"), O(8, 6.5, "2"),
      ball(3.6, 2),
    ],
    actions: [
      pass([2, 2], [10, 2], "1"),
      pass([10, 2], [6, 11], "2"),
    ],
  },
  {
    title: "Dribbelparcours met richtingsveranderingen",
    type: "WARMUP", theme: "NEUTRAL", ageMin: 13, ageMax: 18,
    fieldType: "QUARTER", footprintX: 22, footprintY: 16,
    minPlayers: 8, idealPlayers: 12, maxPlayers: 16, durationMin: 10,
    ballScaling: "PER_PLAYER",
    description:
      "Spelers dribbelen door een pylonparcours met kap- en draaibewegingen; op tempo terug in de rij.",
    setup:
      "Slalom van drie pylonen in het midden. Twee rijen spelers (start links, aankomst rechts), iedereen een bal.",
    steps: [
      "Eerste speler dribbelt slalommend langs de pylonen, bal dicht aan de voet.",
      "Bij elke pylon kappen met de binnen- of buitenkant en versnellen.",
      "Na de laatste pylon uitdribbelen en aansluiten in de rij rechts.",
      "Volgende speler vertrekt zodra de vorige de eerste pylon voorbij is.",
    ],
    rules: "Gebruik afwisselend links en rechts om te kappen.",
    coachingPoints: "Bal dicht bij de voet, kijk op na elke actie, gebruik beide voeten.",
    progressions: "Voeg een schijnbeweging bij elke pylon toe.",
    simplifications: "Grotere afstand tussen de pylonen; rustiger tempo.",
    aids: [
      cone(8, 8), cone(11, 8), cone(14, 8),
      ...queue(2, 3, 5, "start"),
      P(9, 12), P(15, 5),
      P(20, 3), P(20, 6), P(20, 9), P(20, 12), P(20, 15),
      ball(3.3, 3),
    ],
    actions: [
      dribble([3, 3], [8, 7], "dribbel"),
      dribble([8, 8.5], [14, 8.5], "slalom"),
    ],
  },
  {
    title: "Passen in tweetallen met beweging",
    type: "WARMUP", theme: "NEUTRAL", ageMin: 13, ageMax: 18,
    fieldType: "QUARTER", footprintX: 24, footprintY: 18,
    minPlayers: 8, idealPlayers: 12, maxPlayers: 16, durationMin: 10,
    ballScaling: "PER_PAIR",
    description:
      "In tweetallen inpassen en bewegen: aan- en afgeven, wandje leggen, diep sturen.",
    setup:
      "Zes tweetallen verspreid over het vak, elk tweetal één bal, op ±5 m van elkaar.",
    steps: [
      "Speler A speelt in op B en beweegt daarna mee naar een nieuwe plek.",
      "B kaatst in één keer terug of legt een wandje.",
      "Wandel/jog samen door het vak terwijl je blijft overspelen.",
      "Wissel na enkele minuten van partner.",
    ],
    rules: "Maximaal 2× raken; blijf in beweging, niet stilstaan.",
    coachingPoints: "Zuivere pass, meebewegen, communiceren.",
    progressions: "Alles in één keer; vergroot de onderlinge afstand.",
    simplifications: "Sta stil tegenover elkaar en pass rustig heen en weer.",
    aids: [
      P(4, 4, "A"), P(8, 4, "B"), ball(6, 4),
      P(15, 4), P(20, 5), ball(17.5, 4.5),
      P(4, 10), P(9, 11), ball(6.5, 10.5),
      P(15, 10), P(20, 10), ball(17.5, 10),
      P(5, 15), P(9, 16), ball(7, 15.5),
      P(15, 15), P(20, 15), ball(17.5, 15),
    ],
    actions: [
      pass([4, 4], [8, 4], "inspelen"),
      pass([8, 4.6], [4.8, 4.6], "kaats"),
    ],
  },
  {
    title: "Dynamische warming-up met bal",
    type: "WARMUP", theme: "NEUTRAL", ageMin: 13, ageMax: 18,
    fieldType: "QUARTER", footprintX: 20, footprintY: 15,
    minPlayers: 8, idealPlayers: 14, maxPlayers: 18, durationMin: 8,
    ballScaling: "PER_PLAYER",
    description:
      "Loopscholing en mobiliteit over een korte baan, afgewisseld met balcontacten. Rustig opbouwen.",
    setup:
      "Twee lijnen op ±12 m van elkaar (met pylonen gemarkeerd). Spelers in twee rijen achter de startlijn, iedereen een bal aan de kant.",
    steps: [
      "Heen: hoge knieheffing (skippen), rustig terug joggen.",
      "Heen: hakken-billen, terug joggen.",
      "Heen: zijwaartse schaatssprongen, terug joggen.",
      "Heen: versnellen over de laatste 5 m; daarna 5 balcontacten (tik-tik).",
    ],
    rules: "Nette uitvoering vóór snelheid; steeds volledig terug herstellen.",
    coachingPoints: "Rechte romp, actieve armen, geleidelijk versnellen.",
    progressions: "Voeg een sprong of draai halverwege toe.",
    simplifications: "Kortere baan, lager tempo.",
    aids: [
      cone(0.6, 7.5), cone(19.4, 7.5),
      ...rowP(10.5, 13, 7, 16),
      ...rowP(10.5, 2, 7, 16),
      ball(6, 14.5), ball(15, 14.5),
    ],
    actions: [
      run([3, 13], [3, 2.5], "skippen"),
      run([7.5, 2.5], [7.5, 13], "terug joggen"),
    ],
  },

  // ==== extra ATTACK exercises =============================================
  {
    title: "Positiespel 5-tegen-3 met kantspelers",
    type: "EXERCISE", theme: "ATTACK", ageMin: 13, ageMax: 18,
    fieldType: "QUARTER", footprintX: 32, footprintY: 24,
    minPlayers: 8, idealPlayers: 9, maxPlayers: 10, durationMin: 16,
    description: "Balbezit met twee vrije kantspelers; via de zijkant een doeltje aanvallen.",
    setup: "Vak 32×24 m met twee kleine doeltjes bovenaan. Vier balbezitters centraal (blauw) plus twee kantspelers op de zijlijn, drie verdedigers (oranje) in het midden.",
    steps: [
      "De vier centrale spelers spelen rond en betrekken de kantspelers.",
      "De kantspelers geven breedte en spelen in één keer terug of diep.",
      "Zoek de derde man om de drie verdedigers te ontwijken.",
      "Na genoeg passes een doeltje aanvallen; bij balverlies wisselen.",
    ],
    rules: "Kantspelers maximaal 2× raken en scoren niet zelf.",
    coachingPoints: "Breedte benutten, derde man inschakelen, tempo van de pass.",
    progressions: "Verklein de ruimte of geef de verdedigers een extra speler.",
    simplifications: "Vergroot de ruimte of speel 5-tegen-2.",
    aids: [
      smallGoal(8, 0), smallGoal(24, 0),
      P(10, 15, "A"), P(22, 15, "B"), P(12, 9, "C"), P(20, 9, "D"),
      P(1.5, 12, "K"), P(30.5, 12, "K"),
      O(14, 12, "1"), O(18, 13, "2"), O(16, 8, "3"),
      ball(11.4, 15),
    ],
    actions: [pass([10, 15], [1.5, 12], "kant"), pass([1.5, 12], [20, 9], "derde man")],
  },
  {
    title: "Aanvallen over de flank met voorzet",
    type: "EXERCISE", theme: "ATTACK", ageMin: 13, ageMax: 18,
    fieldType: "QUARTER", footprintX: 34, footprintY: 26,
    minPlayers: 8, idealPlayers: 9, maxPlayers: 10, durationMin: 18,
    description: "Opbouw via de flank, voorzet en inloop van twee spelers op het grote doel.",
    setup: "Groot doel met keeper. Startpositie centraal (A) met de ballen, vleugelspeler rechts (B), twee inlopers centraal (C en D). Wissel per beurt van kant.",
    steps: [
      "A speelt de bal naar vleugelspeler B op de flank.",
      "B neemt mee tot de achterlijn en geeft een lage voorzet.",
      "C loopt naar de eerste paal, D naar de tweede paal.",
      "Een van de inlopers werkt de voorzet in één keer af.",
    ],
    rules: "Voorzet laag en hard; afronden in één contact.",
    coachingPoints: "Timing van de voorzet, scherpe inloop, bewust afronden.",
    progressions: "Voeg een verdediger in het gebied toe.",
    simplifications: "Hogere, langzamere voorzet; controle toegestaan.",
    aids: [
      bigGoal(17, 1.2), P(17, 3.4, "K"),
      ...queue(6, 20, 3, "A"), disc(4.5, 20),
      P(30, 16, "B"), disc(31.5, 16),
      P(14, 11, "C"), P(20, 11, "D"),
      O(24, 9, "1"),
      ball(7.4, 19),
    ],
    actions: [
      pass([6, 20], [30, 16], "1 naar flank"),
      carry([30, 15.5], [30, 7], "meenemen"),
      pass([30, 6.5], [16, 7], "voorzet"),
      run([14, 11], [16, 7], "inloop"),
      shot([16, 6.5], [17, 3.6], "afronden"),
    ],
  },
  {
    title: "Passeren en scoren 2-tegen-1",
    type: "EXERCISE", theme: "ATTACK", ageMin: 13, ageMax: 18,
    fieldType: "QUARTER", footprintX: 26, footprintY: 20,
    minPlayers: 6, idealPlayers: 7, maxPlayers: 8, durationMin: 15,
    description: "Twee aanvallers tegen één verdediger richting klein doel: zelf gaan of de vrije man spelen.",
    setup: "Klein doel bovenaan. Twee aanvallers (A met bal, B) starten onderin, één verdediger (oranje) ervoor. Overige spelers wachten achter A en B.",
    steps: [
      "A dribbelt in op de verdediger en dwingt hem te kiezen.",
      "Kiest de verdediger voor A, dan legt A af op de vrije B.",
      "Blijft de verdediger op B, dan gaat A zelf door en scoort.",
      "Na de poging schuiven de wachtende spelers door.",
    ],
    rules: "Maximaal 4 seconden om af te ronden.",
    coachingPoints: "Beslissing op tijd, tempo in de actie, oog voor de medespeler.",
    progressions: "Verklein de tijd; verdediger start actiever.",
    simplifications: "Grotere ruimte of passieve verdediger.",
    aids: [
      smallGoal(13, 0),
      P(9, 15, "A"), P(17, 15, "B"),
      O(13, 9, "1"),
      P(9, 17.5), P(17, 17.5),
      P(6, 19), P(20, 19),
      ball(10.4, 15),
    ],
    actions: [pass([9, 15], [17, 13], "pass"), shot([16, 9], [13, 0.8], "scoren")],
  },
  {
    title: "Overtal aanvallen 4-tegen-3 naar groot doel",
    type: "EXERCISE", theme: "ATTACK", ageMin: 13, ageMax: 18,
    fieldType: "QUARTER", footprintX: 34, footprintY: 26,
    minPlayers: 7, idealPlayers: 8, maxPlayers: 9, durationMin: 18,
    description: "Vier aanvallers benutten de overtalsituatie tegen drie verdedigers en ronden af op het grote doel.",
    setup: "Groot doel met keeper (oranje). Vier aanvallers (blauw) starten onderin, drie verdedigers (oranje) ervoor.",
    steps: [
      "De vier aanvallers vallen snel aan en houden breedte.",
      "Speel de overtal uit: trek een verdediger uit en speel de vrije man.",
      "Zoek zo snel mogelijk een goede afrondkans.",
      "Bij balverlies stopt de aanval; nieuwe groep start.",
    ],
    rules: "Binnen 10 seconden afronden.",
    coachingPoints: "Overtal uitspelen, breedte houden, snel afronden.",
    progressions: "Maak er 4-tegen-4 van.",
    simplifications: "Verdedigers verdedigen passief.",
    aids: [
      bigGoal(17, 1.2), O(17, 3.4, "K"),
      P(8, 16, "A"), P(26, 16, "B"), P(14, 11, "C"), P(20, 11, "D"),
      O(12, 7, "1"), O(22, 7, "2"), O(17, 12, "3"),
      ball(9.4, 16),
    ],
    actions: [pass([8, 16], [20, 11], "overtal"), shot([20, 10], [17, 3.6], "afronden")],
  },
  {
    title: "Combineren door het centrum",
    type: "EXERCISE", theme: "ATTACK", ageMin: 13, ageMax: 18,
    fieldType: "QUARTER", footprintX: 28, footprintY: 22,
    minPlayers: 6, idealPlayers: 8, maxPlayers: 8, durationMin: 15,
    description: "Via snelle één-tweetjes door het midden een dieptepass op de spits bereiken.",
    setup: "Twee kleine doeltjes bovenaan. Baltbezitter A onderin, kaatsers B en C centraal, spits D voorin; twee verdedigers (oranje).",
    steps: [
      "A speelt in op B en loopt mee (één-tweetje).",
      "B kaatst terug; A speelt door op C.",
      "C legt de bal in de diepte op spits D.",
      "D draait open en scoort op een van de doeltjes.",
    ],
    rules: "Kaatsen in één keer; maximaal 2 verdedigers erdoor.",
    coachingPoints: "Eén-tweetjes, inspeelmoment, dieptepass op het juiste moment.",
    progressions: "Voeg een derde verdediger toe.",
    simplifications: "Verdedigers passief; kortere afstanden.",
    aids: [
      smallGoal(8, 0), smallGoal(20, 0),
      ...queue(14, 17, 3, "A"),
      P(9, 12, "B"), P(19, 12, "C"), P(14, 7, "D"),
      O(11, 9, "1"), O(17, 9, "2"),
      ball(15.4, 17),
    ],
    actions: [
      pass([14, 17], [9, 12], "1"),
      pass([9, 12], [13, 15], "2 kaats"),
      pass([13, 15], [14, 8], "3 diep"),
      shot([14, 7], [8, 0.8], "scoren"),
    ],
  },
  {
    title: "Dieptepass en inloop 4-tegen-2",
    type: "EXERCISE", theme: "ATTACK", ageMin: 13, ageMax: 18,
    fieldType: "QUARTER", footprintX: 30, footprintY: 22,
    minPlayers: 6, idealPlayers: 7, maxPlayers: 8, durationMin: 16,
    description: "Vier tegen twee in balbezit; op het juiste moment diep spelen en inlopen om te scoren.",
    setup: "Klein doel bovenaan. Vier balbezitters (blauw) rond twee verdedigers (oranje); één blauwe speler wacht om in te lopen.",
    steps: [
      "De vier houden de bal vast en zoeken het inspeelmoment.",
      "Zodra de ruimte achter de verdedigers openligt: dieptepass.",
      "Een medespeler loopt op het juiste moment in op de bal.",
      "De inloper werkt af op het kleine doel.",
    ],
    rules: "De dieptepass moet in de loop worden gegeven, niet in de voeten.",
    coachingPoints: "Aanspeelbaar staan, dieptepass herkennen, inlopen.",
    progressions: "Beperk het aantal keer raken.",
    simplifications: "Vergroot de ruimte of speel 4-tegen-1.",
    aids: [
      smallGoal(15, 0),
      P(7, 16, "A"), P(23, 16, "B"), P(11, 11, "C"), P(19, 11, "D"),
      O(13, 9, "1"), O(17, 9, "2"),
      P(15, 19, "E"),
      ball(8.4, 16),
    ],
    actions: [
      pass([7, 16], [19, 11], "rondspelen"),
      pass([19, 11], [15, 5], "diep"),
      run([11, 11], [15, 6], "inloop"),
      shot([15, 5], [15, 0.8], "scoren"),
    ],
  },

  // ==== extra DEFEND exercises =============================================
  {
    title: "1-tegen-1 verdedigen naar twee doeltjes",
    type: "EXERCISE", theme: "DEFEND", ageMin: 13, ageMax: 18,
    fieldType: "QUARTER", footprintX: 20, footprintY: 16,
    minPlayers: 6, idealPlayers: 8, maxPlayers: 8, durationMin: 14,
    description: "Verdediger verdedigt twee kleine doeltjes tegen één aanvaller. Bij balwinst mag hij zelf scoren.",
    setup: "Twee kleine doeltjes bovenaan. Aanvaller (blauw) met bal onderin, verdediger (oranje) ertussen. Wachtende aanvallers links, verdedigers rechts.",
    steps: [
      "De aanvaller probeert via een van de twee doeltjes te scoren.",
      "De verdediger neemt een goede uitgangshouding aan (zijwaarts).",
      "Hij stuurt de aanvaller naar buiten en kiest zijn moment om te duelleren.",
      "Wint de verdediger de bal, dan scoort hij zelf; daarna wisselen.",
    ],
    rules: "De aanvaller heeft maximaal 8 seconden.",
    coachingPoints: "Goede uitgangshouding, sturen naar buiten, geduld en timing.",
    progressions: "Verklein de ruimte tussen de doeltjes.",
    simplifications: "Grotere ruimte; verdediger start dichterbij.",
    aids: [
      smallGoal(6, 0), smallGoal(14, 0),
      P(10, 13, "A"), O(10, 8, "V"),
      P(2, 10), P(2, 13), P(2, 15.5),
      O(18, 10), O(18, 13), O(18, 15.5),
      ball(11.4, 13),
    ],
    actions: [dribble([10, 13], [7, 4], "uitspelen"), run([10, 8], [8.5, 11], "sturen")],
  },
  {
    title: "Kantelen in de linie 4-tegen-2",
    type: "EXERCISE", theme: "DEFEND", ageMin: 13, ageMax: 18,
    fieldType: "QUARTER", footprintX: 32, footprintY: 20,
    minPlayers: 6, idealPlayers: 7, maxPlayers: 8, durationMin: 15,
    description: "Een linie van vier kantelt met de bal mee tegen twee aanvallers en verovert de bal.",
    setup: "Twee kleine doeltjes onderaan die de linie verdedigt. Vier verdedigers (oranje) als linie, twee/drie aanvallers (blauw) bovenin met de bal.",
    steps: [
      "De aanvallers verplaatsen de bal van links naar rechts.",
      "De hele oranje linie kantelt mee met de bal (schuin naar de bal).",
      "De speler dichtst bij de bal knijpt erop, de rest schuift aan.",
      "Bij balwinst verdedigen ze uit richting een doeltje.",
    ],
    rules: "De linie blijft op gelijke onderlinge afstand.",
    coachingPoints: "Onderlinge afstanden, kantelen, druk op de bal.",
    progressions: "Voeg een derde aanvaller toe.",
    simplifications: "Kleiner veld, langzamere balverplaatsing.",
    aids: [
      smallGoal(8, 20), smallGoal(24, 20),
      ...rowP(16, 12, 4, 26, "O"),
      P(10, 5, "A"), P(22, 5, "B"), P(16, 4, "C"),
      ball(11.4, 5),
    ],
    actions: [pass([10, 5], [22, 5], "verplaatsen"), run([16, 12], [21, 11], "kantelen")],
  },
  {
    title: "Verdedigen van de voorzet",
    type: "EXERCISE", theme: "DEFEND", ageMin: 13, ageMax: 18,
    fieldType: "QUARTER", footprintX: 30, footprintY: 24,
    minPlayers: 8, idealPlayers: 9, maxPlayers: 10, durationMin: 16,
    description: "Verdedigers verdedigen voorzetten vanaf de flank; koppen of onderscheppen en uitverdedigen.",
    setup: "Groot doel met keeper. Drie/vier verdedigers (blauw) in het gebied, een vleugelspeler (oranje) met bal op de flank en twee inlopers (oranje).",
    steps: [
      "De vleugelspeler neemt mee tot de achterlijn en geeft een voorzet.",
      "De verdedigers houden zicht op bal én tegenstander (open staan).",
      "De verdediger bij de bal kort dekt, de rest dekt de ruimte.",
      "Kop of onderschep de voorzet en verdedig uit naar buiten.",
    ],
    rules: "Uitverdedigen mag alleen naar de zijkant, niet door het midden.",
    coachingPoints: "Positie t.o.v. bal en tegenstander, druk op de voorzet, kort dekken bij de eerste paal.",
    progressions: "Twee voorzetgevers (beide flanken) om en om.",
    simplifications: "Langzamere voorzet, minder aanvallers.",
    aids: [
      bigGoal(15, 1.2), P(15, 3.4, "K"),
      P(9, 8, "1"), P(15, 9, "2"), P(21, 8, "3"), P(15, 5, "4"),
      O(27, 11), disc(28.5, 11),
      O(12, 13), O(18, 13), O(22, 11),
      ball(27, 9.5),
    ],
    actions: [
      carry([27, 11], [27, 6], "naar lijn"),
      pass([27, 5.5], [16, 7], "voorzet"),
      run([15, 9], [16, 7], "kort dekken"),
    ],
  },
  {
    title: "Compact blok 6-tegen-4",
    type: "EXERCISE", theme: "DEFEND", ageMin: 13, ageMax: 18,
    fieldType: "QUARTER", footprintX: 34, footprintY: 26,
    minPlayers: 9, idealPlayers: 10, maxPlayers: 11, durationMin: 18,
    description: "Zes verdedigers houden een compact blok tegen vier aanvallers. Bal veroveren = punt.",
    setup: "Twee kleine doeltjes onderaan. Zes verdedigers (oranje) in twee compacte linies, vier aanvallers (blauw) bovenin met de bal.",
    steps: [
      "De aanvallers proberen door het blok te combineren of te scoren.",
      "Oranje houdt twee linies compact bij elkaar (klein blok).",
      "Kies samen het moment om druk te zetten op de bal.",
      "Bal veroverd? = punt; daarna weer opnieuw organiseren.",
    ],
    rules: "De twee linies blijven binnen 10 m van elkaar.",
    coachingPoints: "Compact blijven, samen verdedigen, moment van druk kiezen.",
    progressions: "Geef de aanvallers een extra speler.",
    simplifications: "Verklein het veld zodat het blok makkelijker compact blijft.",
    aids: [
      smallGoal(10, 26), smallGoal(24, 26),
      ...rowP(17, 14, 3, 26, "O"),
      ...rowP(17, 19, 3, 20, "O"),
      ...rowP(17, 7, 4, 26, "P"),
      ball(6.3, 7),
    ],
    actions: [pass([4, 7], [30, 7], "rondspelen"), run([17, 14], [19, 10], "druk kiezen")],
  },
  {
    title: "Onderscheppen en uitverdedigen 4-tegen-4",
    type: "EXERCISE", theme: "DEFEND", ageMin: 13, ageMax: 18,
    fieldType: "QUARTER", footprintX: 30, footprintY: 22,
    minPlayers: 8, idealPlayers: 8, maxPlayers: 10, durationMin: 16,
    description: "Vier tegen vier; onderscheppen en de bal rustig uitverdedigen naar een doeltje.",
    setup: "Twee kleine doeltjes onderaan. Twee teams van vier; blauw start met de bal bovenin.",
    steps: [
      "Blauw probeert op te bouwen richting de doeltjes.",
      "Oranje sluit de passlijnen (dekkingsschaduw) en onderschept.",
      "Na balwinst niet direct wegtrappen: rustig uitverdedigen.",
      "Speel de eerste pass na balwinst naar een vrije medespeler.",
    ],
    rules: "Na balwinst eerst één keer overspelen vóór er gescoord mag worden.",
    coachingPoints: "Dekkingsschaduw, onderscheppen, eerste pass na balwinst.",
    progressions: "Beperk het aantal keer raken.",
    simplifications: "Extra verdediger (4-tegen-3).",
    aids: [
      smallGoal(8, 22), smallGoal(22, 22),
      ...rowP(15, 6, 4, 22, "P"),
      ...rowP(15, 13, 4, 20, "O"),
      ball(12.7, 6),
    ],
    actions: [pass([4, 6], [18.67, 6], "opbouw"), run([11.67, 13], [11, 9], "onderscheppen")],
  },
  {
    title: "Duel om de tweede bal",
    type: "EXERCISE", theme: "DEFEND", ageMin: 13, ageMax: 18,
    fieldType: "QUARTER", footprintX: 24, footprintY: 20,
    minPlayers: 8, idealPlayers: 8, maxPlayers: 10, durationMin: 14,
    description: "Na een lange bal strijden twee teams om de tweede bal en proberen die te behouden.",
    setup: "Klein doel aan beide korte zijden. Twee teams van vier verspreid in het midden; de trainer speelt een lange bal in.",
    steps: [
      "De trainer speelt een hoge bal in het midden.",
      "Beide teams anticiperen op waar de bal neerkomt.",
      "Duelleer om de tweede bal en probeer hem te veroveren.",
      "Bij balbezit meteen doorspelen naar het eigen doeltje.",
    ],
    rules: "Gecontroleerd duelleren; schouder aan schouder, niet duwen.",
    coachingPoints: "Anticiperen op de tweede bal, agressief maar gecontroleerd duelleren.",
    progressions: "Verklein de ruimte zodat duels intenser worden.",
    simplifications: "Lagere ingespeelde bal, meer ruimte.",
    aids: [
      smallGoal(6, 0), smallGoal(18, 20),
      P(7, 7, "A"), P(13, 6, "B"), P(10, 13, "C"), P(16, 12, "D"),
      O(12, 9, "1"), O(17, 7, "2"), O(9, 10, "3"), O(14, 14, "4"),
      ball(12, 3),
    ],
    actions: [pass([12, 18], [12, 5], "lange bal"), run([10, 13], [12, 8], "tweede bal")],
  },

  // ==== extra TRANSITION exercises =========================================
  {
    title: "Balverovering en snel scoren",
    type: "EXERCISE", theme: "TRANSITION", ageMin: 13, ageMax: 18,
    fieldType: "QUARTER", footprintX: 30, footprintY: 22,
    minPlayers: 8, idealPlayers: 8, maxPlayers: 9, durationMin: 16,
    description: "Direct na balwinst zo snel mogelijk scoren op het grote doel, vóór de tegenstander staat.",
    setup: "Groot doel met keeper bovenaan, twee kleine doeltjes onderaan. Vier tegen vier (blauw/oranje) in het middenveld.",
    steps: [
      "De teams spelen om balbezit in het middenveld.",
      "Blauw verovert de bal en schakelt meteen om richting het grote doel.",
      "Speel de eerste bal na winst vooruit, niet terug.",
      "Rond zo snel mogelijk af; oranje verdedigt de doeltjes.",
    ],
    rules: "Na balwinst binnen 6 seconden een schot.",
    coachingPoints: "Eerste actie na balwinst, tempo, vooruit durven spelen.",
    progressions: "Verklein de tijd naar 5 seconden.",
    simplifications: "Zonder tijdslimiet; extra aanvaller.",
    aids: [
      bigGoal(15, 1.2), O(15, 3.4, "K"),
      smallGoal(8, 22), smallGoal(22, 22),
      P(8, 14, "A"), P(22, 14, "B"), P(12, 10, "C"), P(18, 10, "D"),
      O(12, 7, "1"), O(18, 7, "2"), O(15, 13, "3"),
      ball(13.4, 10),
    ],
    actions: [pass([12, 10], [18, 10], "balwinst"), shot([18, 9], [15, 3.6], "snel scoren")],
  },
  {
    title: "Omschakelen 3-tegen-3-tegen-3",
    type: "EXERCISE", theme: "TRANSITION", ageMin: 13, ageMax: 18,
    fieldType: "QUARTER", footprintX: 26, footprintY: 24,
    minPlayers: 9, idealPlayers: 9, maxPlayers: 9, durationMin: 16,
    description: "Drie teams van drie; het balverliezende team wisselt met het wachtende team. Constant omschakelen.",
    setup: "Klein doel linksboven en rechtsonder. Twee teams spelen (blauw/oranje), het derde team wacht langs de zijlijn.",
    steps: [
      "Twee teams spelen 3-tegen-3 op de twee doeltjes.",
      "Het team dat de bal verliest, gaat er direct uit.",
      "Het wachtende team komt onmiddellijk in en neemt de bal over.",
      "Herken snel welke fase je bent: aanvallen, verdedigen of instappen.",
    ],
    rules: "Wisselen gaat vliegend door: geen onderbreking.",
    coachingPoints: "Direct herkennen van de fase, snel handelen, communiceren.",
    progressions: "Beperk het aantal keer raken.",
    simplifications: "Groter veld, meer tijd.",
    aids: [
      smallGoal(8, 0), smallGoal(18, 24),
      P(8, 10, "A"), P(14, 8, "B"), P(11, 14, "C"),
      O(12, 16, "1"), O(18, 14, "2"), O(15, 10, "3"),
      P(1.5, 6, "W"), P(1.5, 12, "W"), P(1.5, 18, "W"),
      ball(9.4, 10),
    ],
    actions: [pass([8, 10], [14, 8], "balbezit"), run([15, 10], [12.5, 11], "omschakelen")],
  },
  {
    title: "Counter na hoge druk",
    type: "EXERCISE", theme: "TRANSITION", ageMin: 13, ageMax: 18,
    fieldType: "QUARTER", footprintX: 34, footprintY: 26,
    minPlayers: 8, idealPlayers: 9, maxPlayers: 10, durationMin: 18,
    description: "Eén team zet hoog druk; bij balwinst counteren op het grote doel, anders scoren op de doeltjes.",
    setup: "Groot doel met keeper bovenaan, twee kleine doeltjes onderaan. Blauw zet druk, oranje probeert op te bouwen.",
    steps: [
      "Oranje bouwt op vanaf de doeltjes onderin.",
      "Blauw zet als team hoog druk om de bal te veroveren.",
      "Wint blauw de bal hoog, dan counteren ze direct op het grote doel.",
      "Lukt de druk niet, dan verdedigt blauw terug naar eigen doeltjes.",
    ],
    rules: "Counter binnen 8 seconden afronden.",
    coachingPoints: "Druk zetten als team, balwinst benutten, keuze in de counter.",
    progressions: "Verklein de counter-tijd.",
    simplifications: "Minder aanvallers voor oranje.",
    aids: [
      bigGoal(17, 1.2), O(17, 3.4, "K"),
      smallGoal(10, 26), smallGoal(24, 26),
      P(10, 12, "A"), P(24, 12, "B"), P(14, 16, "C"), P(20, 16, "D"),
      O(12, 20, "1"), O(22, 20, "2"), O(17, 22, "3"),
      ball(18.4, 20),
    ],
    actions: [run([14, 16], [16, 19], "hoge druk"), shot([17, 12], [17, 3.6], "counter")],
  },
  {
    title: "Snelle omschakeling naar de flanken",
    type: "EXERCISE", theme: "TRANSITION", ageMin: 13, ageMax: 18,
    fieldType: "QUARTER", footprintX: 32, footprintY: 24,
    minPlayers: 8, idealPlayers: 8, maxPlayers: 9, durationMin: 16,
    description: "Na balwinst zo snel mogelijk de bal naar de vrije flank spelen om ruimte te benutten.",
    setup: "Twee kleine doeltjes bovenaan. Vier tegen vier in het midden; blauw start met de bal.",
    steps: [
      "De teams spelen om de bal in het centrum.",
      "Bij balwinst: kop op en zoek meteen de vrije flank.",
      "Verplaats de bal snel en breed naar de open ruimte.",
      "Val via de flank aan op een van de doeltjes.",
    ],
    rules: "Na balwinst moet de bal binnen 3 passes de flank bereiken.",
    coachingPoints: "Spelverplaatsing, tempo, timing van de flankaanval.",
    progressions: "Beperk het aantal keer raken.",
    simplifications: "Groter veld voor meer ruimte.",
    aids: [
      smallGoal(8, 0), smallGoal(24, 0),
      P(8, 14, "A"), P(24, 14, "B"), P(16, 10, "C"), P(16, 16, "D"),
      O(12, 11, "1"), O(20, 11, "2"), O(10, 7, "3"), O(22, 7, "4"),
      ball(17.4, 16),
    ],
    actions: [pass([16, 16], [24, 14], "naar flank"), carry([24, 14], [24, 5], "aanvallen")],
  },
  {
    title: "Positiespel met omschakelmoment",
    type: "EXERCISE", theme: "TRANSITION", ageMin: 13, ageMax: 18,
    fieldType: "QUARTER", footprintX: 28, footprintY: 22,
    minPlayers: 8, idealPlayers: 8, maxPlayers: 9, durationMin: 15,
    description: "Balbezit 5-tegen-3; bij balverlies schakelen de drie direct om en proberen te scoren.",
    setup: "Klein doel linksboven en rechtsonder. Vijf balbezitters (blauw), drie jagers (oranje).",
    steps: [
      "De vijf houden rustig de bal vast tegen de drie.",
      "De drie jagen samen en proberen te onderscheppen.",
      "Winnen de drie de bal, dan schakelen ze direct om naar een doeltje.",
      "Verliest blauw de bal, dan jagen zij meteen terug.",
    ],
    rules: "Balbezitters maximaal 3× raken.",
    coachingPoints: "Rust in balbezit, direct omschakelen bij balverlies.",
    progressions: "Balbezitters 2× raken.",
    simplifications: "Groter veld; 5-tegen-2.",
    aids: [
      smallGoal(8, 0), smallGoal(20, 22),
      P(7, 14, "A"), P(21, 14, "B"), P(9, 9, "C"), P(19, 9, "D"), P(14, 12, "E"),
      O(12, 11, "1"), O(16, 10, "2"), O(14, 7, "3"),
      ball(15.4, 12),
    ],
    actions: [pass([7, 14], [19, 9], "rust in balbezit"), run([14, 7], [14, 10], "omschakelen")],
  },
  {
    title: "Twee kleuren omschakelspel",
    type: "EXERCISE", theme: "TRANSITION", ageMin: 13, ageMax: 18,
    fieldType: "QUARTER", footprintX: 28, footprintY: 20,
    minPlayers: 8, idealPlayers: 10, maxPlayers: 10, durationMin: 15,
    description: "Twee teams spelen op vier doeltjes; elke balwinst is een direct omschakelmoment.",
    setup: "Vier kleine doeltjes (twee aan elke korte zijde). Twee teams van vijf, blauw start met de bal.",
    steps: [
      "Blauw valt aan op de twee doeltjes aan één kant.",
      "Oranje verdedigt en jaagt op de bal.",
      "Elke balwinst is meteen een aanval de andere kant op.",
      "Eerste pass na balwinst altijd vooruit.",
    ],
    rules: "Na balwinst mag pas gescoord worden na één pass.",
    coachingPoints: "Snel schakelen, eerste pass vooruit, samen jagen.",
    progressions: "Beperk het aantal keer raken.",
    simplifications: "Groter veld, meer tijd.",
    aids: [
      smallGoal(8, 0), smallGoal(20, 0), smallGoal(8, 20), smallGoal(20, 20),
      P(6, 6, "A"), P(12, 7, "B"), P(8, 12, "C"), P(14, 13, "D"), P(10, 10, "E"),
      O(22, 6, "1"), O(16, 7, "2"), O(20, 12, "3"), O(24, 13, "4"), O(18, 11, "5"),
      ball(11.4, 10),
    ],
    actions: [pass([6, 6], [14, 13], "balbezit"), run([18, 11], [12, 10], "omschakelen")],
  },

  // ==== extra partijvormen (MATCHFORM) =====================================
  {
    title: "Partij met accent verdedigen 7-tegen-7",
    type: "MATCHFORM", theme: "DEFEND", ageMin: 13, ageMax: 19,
    fieldType: "HALF", footprintX: 48, footprintY: 34,
    minPlayers: 10, idealPlayers: 14, maxPlayers: 16, durationMin: 20,
    description: "Partij op grote doelen waarbij goed verdedigen wordt beloond.",
    setup: "Half veld met twee grote doelen en keepers. Twee teams van 7 (incl. keeper).",
    steps: [
      "Vrije partij 7 tegen 7 op de grote doelen.",
      "Bij balverlies meteen samen druk zetten om de bal terug te winnen.",
      "De bal binnen 6 seconden heroveren levert een extra punt op.",
      "Blijf compact en dek de gevaarlijke ruimtes.",
    ],
    rules: "Bal binnen 6 sec heroveren = 1 extra punt.",
    coachingPoints: "Druk zetten, compact blok, samen verdedigen.",
    progressions: "Verlaag naar 5 seconden.",
    simplifications: "Groter veld; meer hersteltijd.",
    aids: [
      bigGoal(24, 1.2), bigGoal(24, 32.8),
      P(24, 3.4, "K"), ...rowP(24, 10, 3, 30), P(16, 15), P(32, 15), P(24, 14),
      O(24, 30.6, "K"), ...rowP(24, 25, 3, 30, "O"), O(16, 19), O(32, 19), O(24, 20),
      ball(25.4, 14),
    ],
    actions: [run([24, 14], [24, 20], "druk zetten"), pass([16, 19], [24, 20], "onder druk")],
  },
  {
    title: "Partij met omschakelaccent 8-tegen-8",
    type: "MATCHFORM", theme: "TRANSITION", ageMin: 13, ageMax: 19,
    fieldType: "HALF", footprintX: 50, footprintY: 35,
    minPlayers: 12, idealPlayers: 16, maxPlayers: 18, durationMin: 20,
    description: "Partij op grote doelen; een doelpunt binnen 8 seconden na balwinst telt dubbel.",
    setup: "Half veld met twee grote doelen en keepers. Twee teams van 8 (incl. keeper).",
    steps: [
      "Vrije partij 8 tegen 8 op de grote doelen.",
      "Bij balwinst zo snel mogelijk vooruit spelen en counteren.",
      "Een doelpunt binnen 8 seconden na balwinst telt dubbel.",
      "Ook bij balverlies direct schakelen: meteen druk of terug.",
    ],
    rules: "Doelpunt binnen 8 sec na balwinst = 2 punten.",
    coachingPoints: "Snel schakelen na balwinst én balverlies, tempo.",
    progressions: "Verlaag naar 6 seconden.",
    simplifications: "Zonder tijdslimiet; groter veld.",
    aids: [
      bigGoal(25, 1.2), bigGoal(25, 33.8),
      P(25, 3.4, "K"), ...rowP(25, 10, 3, 30), ...rowP(25, 16, 3, 24), P(25, 21),
      O(25, 31.6, "K"), ...rowP(25, 25, 3, 30, "O"), ...rowP(25, 20, 3, 24, "O"), O(25, 15),
      ball(26.4, 15),
    ],
    actions: [pass([25, 16], [37, 16], "balwinst"), pass([37, 16], [31, 24], "snel diep")],
  },
  {
    title: "Positiepartij 8-tegen-8 op balbezit",
    type: "MATCHFORM", theme: "NEUTRAL", ageMin: 13, ageMax: 19,
    fieldType: "HALF", footprintX: 50, footprintY: 35,
    minPlayers: 12, idealPlayers: 16, maxPlayers: 18, durationMin: 18,
    description: "Partij met accent op balbezit: passes op rij leveren punten op, scoren op doeltjes telt dubbel.",
    setup: "Half veld met vier kleine doeltjes (twee aan elke korte zijde), geen keepers. Twee teams van 8.",
    steps: [
      "Speel rustig rond en houd de bal in de ploeg.",
      "Zes passes op rij levert een punt op.",
      "Scoren op een van de kleine doeltjes telt dubbel.",
      "Zorg dat je altijd aanspeelbaar staat (hoekjes maken).",
    ],
    rules: "6 passes = 1 punt; doelpunt = 2 punten.",
    coachingPoints: "Rust en overzicht in balbezit, aanspeelbaar staan.",
    progressions: "Maximaal 2× raken.",
    simplifications: "Minder passes voor een punt (4).",
    aids: [
      smallGoal(12, 0), smallGoal(38, 0), smallGoal(12, 35), smallGoal(38, 35),
      ...rowP(25, 8, 4, 36), P(18, 15), P(32, 15), P(25, 13), P(25, 18),
      ...rowP(25, 27, 4, 36, "O"), O(18, 21), O(32, 21), O(25, 23), O(25, 25),
      ball(26.4, 13),
    ],
    actions: [pass([25, 13], [19, 8], "rondspelen"), pass([19, 8], [31, 8], "verplaatsen")],
  },
  {
    title: "Linie-partij 6-tegen-6 op klein doel",
    type: "MATCHFORM", theme: "NEUTRAL", ageMin: 13, ageMax: 19,
    fieldType: "HALF", footprintX: 44, footprintY: 32,
    minPlayers: 10, idealPlayers: 12, maxPlayers: 14, durationMin: 18,
    description: "Partij zonder keepers op kleine doelen; ideaal om linies en onderlinge afstanden te trainen.",
    setup: "Veld met een klein doel aan elke korte zijde, geen keepers. Twee teams van 6, opgesteld in linies.",
    steps: [
      "Speel een normale partij op de twee kleine doelen.",
      "Houd je linies (verdediging – middenveld) op goede onderlinge afstand.",
      "Schuif als team mee met de bal, samen op en samen terug.",
      "Bij balverlies eerst je linie herstellen, dan pas druk.",
    ],
    rules: "Geen speler mag uit zijn linie wegblijven bij balverlies.",
    coachingPoints: "Organisatie in linies, onderlinge afstanden, omschakelen.",
    progressions: "Voeg een themaregel toe (bijv. alleen scoren na een spelverplaatsing).",
    simplifications: "Groter veld voor meer ruimte tussen de linies.",
    aids: [
      smallGoal(22, 0), smallGoal(22, 32),
      ...rowP(22, 9, 3, 32), P(14, 15), P(30, 15), P(22, 13),
      ...rowP(22, 23, 3, 32, "O"), O(14, 17), O(30, 17), O(22, 19),
      ball(23.4, 13),
    ],
    actions: [pass([22, 13], [38, 9], "verplaatsen"), run([22, 9], [22, 12], "linie schuift")],
  },

  // ==== STANDAARDSITUATIES (set pieces — library-only theme) ================
  // Combine attack and defence, need the full goal, so they are their own theme
  // (SET_PIECE) and are added to a session by hand, not by the auto-generator.
  {
    title: "Aanvallende hoekschop op de tweede paal",
    type: "EXERCISE", theme: "SET_PIECE", subTheme: "Aanvallende hoekschop",
    ageMin: 13, ageMax: 18,
    fieldType: "QUARTER", footprintX: 34, footprintY: 24,
    minPlayers: 8, idealPlayers: 10, maxPlayers: 12, durationMin: 15,
    description: "Ingestudeerde hoekschop met blokactie en scherpe inloop op de tweede paal.",
    setup: "Groot doel met keeper. A neemt de hoekschop rechtsboven. B (eerste paal), C (penaltystip), D (tweede paal) en F (rand zestien) staan klaar; drie verdedigers dekken de ruimte.",
    steps: [
      "A draait de hoekschop met snelheid richting de tweede paal.",
      "B loopt naar de eerste paal en neemt de dichtstbijzijnde verdediger mee.",
      "D maakt een schijnbeweging en komt scherp voor bij de tweede paal.",
      "C of D werkt de voorzet ineens af op doel; F blijft achter voor de rebound.",
    ],
    rules: "Voorzet in één keer afronden; F dekt de counter af.",
    coachingPoints: "Timing van de inloop, snelheid op de bal, bewust koppen naar de hoek.",
    progressions: "Voeg een korte variant toe (kort spelen op B).",
    simplifications: "Verdedigers passief; hogere, langzamere voorzet.",
    aids: [
      bigGoal(17, 1.2), P(17, 3.4, "K"),
      P(32.5, 2.8, "A"), ball(30.9, 3.2),
      P(12, 6, "B"), P(18, 9, "C"), P(24, 6.5, "D"), P(17, 16, "F"),
      O(14.5, 5, "1"), O(20, 6, "2"), O(22, 4.5, "3"), O(17, 12, "4"),
    ],
    actions: [
      pass([30.9, 3.2], [18, 8.5], "voorzet"),
      run([24, 6.5], [21, 5], "inloop 2e paal"),
      shot([18, 8.5], [17, 3.6], "koppen"),
    ],
  },
  {
    title: "Verdedigen van de hoekschop — zone en man",
    type: "EXERCISE", theme: "SET_PIECE", subTheme: "Verdedigen van de hoekschop",
    ageMin: 13, ageMax: 18,
    fieldType: "QUARTER", footprintX: 34, footprintY: 24,
    minPlayers: 8, idealPlayers: 10, maxPlayers: 12, durationMin: 15,
    description: "Combinatie van zoneverdediging op de palen en mandekking op de gevaarlijkste aanvallers.",
    setup: "Groot doel met keeper. A dekt de korte hoek, B de tweede paal. C en D pikken man-op-man op, E verdedigt de ruimte voor het doel. De tegenstander neemt de hoekschop rechtsboven.",
    steps: [
      "Bezet de korte hoek (A) en de tweede paal (B) vast op de lijn.",
      "C en D nemen de gevaarlijkste aanvallers man-op-man over.",
      "Op het moment van de voorzet knijpt E naar binnen en verdedigt de ruimte.",
      "Kop de bal ver en breed weg en schuif direct samen naar buiten.",
    ],
    rules: "Niemand verlaat zijn taak vóór de bal is weggewerkt.",
    coachingPoints: "Vaste postbezetting, actief blijven bewegen, ver en breed wegwerken.",
    progressions: "Laat de aanvaller korte varianten spelen.",
    simplifications: "Vaste voorzet op één zone zodat de organisatie went.",
    aids: [
      bigGoal(17, 1.2), P(17, 3.4, "K"),
      P(12.5, 4, "A"), P(21, 4.5, "B"), P(16, 8, "C"), P(19.5, 9, "D"), P(17, 13, "E"),
      O(31.5, 2.8, "1"), ball(29.9, 3.2),
      O(14.5, 6, "2"), O(19.5, 6.5, "3"), O(23, 5, "4"),
    ],
    actions: [
      pass([29.9, 3.2], [18, 7.5], "hoekschop"),
      run([17, 13], [17, 9.5], "knijpen"),
      pass([18, 7.5], [6, 15], "wegwerken"),
    ],
  },
  {
    title: "Aanvallende vrije trap rond de zestien",
    type: "EXERCISE", theme: "SET_PIECE", subTheme: "Aanvallende vrije trap",
    ageMin: 13, ageMax: 18,
    fieldType: "QUARTER", footprintX: 30, footprintY: 24,
    minPlayers: 8, idealPlayers: 9, maxPlayers: 12, durationMin: 15,
    description: "Ingestudeerde directe vrije trap met afleggen en schot langs de muur.",
    setup: "Groot doel met keeper en een muur van vier verdedigers. A en B staan allebei bij de bal op ongeveer 20 meter; C loopt in op de rebound.",
    steps: [
      "A en B staan bij de bal; A doet alsof hij zelf schiet.",
      "A rolt de bal opzij naar B.",
      "B schiet ineens op de verre hoek, langs de muur.",
      "C loopt in op een mogelijke rebound of afvallende bal.",
    ],
    rules: "Snelle uitvoering: leggen en schieten binnen twee contacten.",
    coachingPoints: "Vaste afspraak, strak afleggen, schot laag in de hoek.",
    progressions: "Voeg een tweede variant toe (direct over de muur krullen).",
    simplifications: "Kortere afstand of lagere muur.",
    aids: [
      bigGoal(15, 1.2), P(15, 3.4, "K"),
      O(11.5, 6, "1"), O(13.5, 6, "2"), O(15.5, 6, "3"), O(17.5, 6, "4"),
      O(21, 9, "5"),
      P(14, 19, "A"), P(17.5, 19, "B"), ball(15.8, 20),
      P(9, 17, "C"),
    ],
    actions: [
      pass([15.8, 19.5], [17.5, 18.5], "leggen"),
      shot([17.5, 18.5], [12, 3.6], "schot langs de muur"),
      run([9, 17], [12, 8], "rebound"),
    ],
  },
  {
    title: "Verdedigen van de vrije trap — muur zetten",
    type: "EXERCISE", theme: "SET_PIECE", subTheme: "Verdedigen van de vrije trap",
    ageMin: 13, ageMax: 18,
    fieldType: "QUARTER", footprintX: 30, footprintY: 24,
    minPlayers: 8, idealPlayers: 10, maxPlayers: 12, durationMin: 15,
    description: "Muur zetten op aanwijzing van de keeper en de vrije aanvallers man-op-man dekken.",
    setup: "Groot doel met keeper. A t/m D vormen de muur, E en F dekken de aanvallers. De tegenstander neemt een directe vrije trap op ongeveer 20 meter.",
    steps: [
      "De keeper bepaalt het aantal spelers in de muur en de plaats ervan.",
      "A t/m D zetten de muur schouder aan schouder op één lijn.",
      "E en F dekken de vrijlopende aanvallers man-op-man.",
      "Na het schot knijpt iedereen mee naar buiten en verdedig de tweede bal.",
    ],
    rules: "De muur springt pas op het moment van het schot; niemand draait weg.",
    coachingPoints: "Communicatie van de keeper, gesloten muur, agressief op de tweede bal.",
    progressions: "Laat de aanvaller kort afleggen zodat de muur moet uitknijpen.",
    simplifications: "Vaste vrije trap zodat de organisatie went.",
    aids: [
      bigGoal(15, 1.2), P(15, 3.4, "K"),
      P(12, 6, "A"), P(14, 6, "B"), P(16, 6, "C"), P(18, 6, "D"),
      P(21, 9, "E"), P(10, 10, "F"),
      O(15, 19, "1"), ball(15.8, 19.5),
      O(20, 14, "2"), O(11, 14, "3"),
    ],
    actions: [
      pass([15.8, 19.5], [20, 14], "vrije trap"),
      run([21, 9], [20, 12], "knijpen op speler"),
      pass([20, 14], [7, 17], "wegwerken"),
    ],
  },
  {
    title: "Strafschop nemen en verdedigen",
    type: "EXERCISE", theme: "SET_PIECE", subTheme: "Strafschop nemen en verdedigen",
    ageMin: 12, ageMax: 18,
    fieldType: "QUARTER", footprintX: 20, footprintY: 22,
    minPlayers: 2, idealPlayers: 6, maxPlayers: 14, durationMin: 12,
    description: "Strafschoppen nemen tegen een keeper; nemer en keeper wisselen elke beurt.",
    setup: "Groot doel met keeper. A legt de bal op de stip, de overige nemers wachten in een rij achter de stip.",
    steps: [
      "Leg de bal stil op de stip en kies vooraf je hoek.",
      "De keeper blijft op de lijn tot de bal geraakt wordt.",
      "A neemt een vaste aanloop en schiet beheerst in de hoek.",
      "Wissel na elke poging van nemer en keeper.",
    ],
    rules: "Eén contact; keeper mag pas bij de aanraking van de lijn.",
    coachingPoints: "Vaste routine, blik op de bal, beheerst en gericht raken.",
    progressions: "Nemer kiest hoek pas na de blik van de keeper.",
    simplifications: "Keeper blijft passief in het midden staan.",
    aids: [
      bigGoal(10, 1.2), P(10, 3.4, "K"),
      P(10, 12, "A"), ball(11.4, 12),
      ...queue(4, 15, 4, "B"),
    ],
    actions: [
      shot([11.4, 12], [13, 3.4], "laag in de hoek"),
    ],
  },
  {
    title: "Inworp uitspelen naar de diepte",
    type: "EXERCISE", theme: "SET_PIECE", subTheme: "Inworp",
    ageMin: 12, ageMax: 18,
    fieldType: "QUARTER", footprintX: 26, footprintY: 20,
    minPlayers: 5, idealPlayers: 6, maxPlayers: 10, durationMin: 12,
    description: "Correcte inworp uitspelen via een korte aanname en meteen de diepte zoeken.",
    setup: "A gooit in vanaf de zijlijn. B en C lopen tegengesteld vrij, D komt kort tegen de bal in. Twee tegenstanders knijpen de ruimte dicht; een klein doel dient als richtpunt.",
    steps: [
      "A gooit correct in: beide voeten op de grond, bal achter het hoofd.",
      "B en C lopen tegengesteld vrij; D komt kort tegen de bal in.",
      "A gooit in op de vrije man en loopt direct het veld in.",
      "Speel snel door via de één-twee en zoek de diepte richting doel.",
    ],
    rules: "Maximaal twee contacten na de inworp; direct de diepte in.",
    coachingPoints: "Correcte techniek, tegengestelde looplijnen, snel doorspelen.",
    progressions: "Voeg een extra verdediger toe die de diepte afdekt.",
    simplifications: "Meer ruimte; verdedigers houden afstand.",
    aids: [
      P(1, 10, "A"), ball(2.6, 10.5),
      P(7, 6, "B"), P(7, 14, "C"), P(13, 10, "D"),
      O(10, 7, "1"), O(10, 13, "2"),
      smallGoal(24, 10),
    ],
    actions: [
      pass([2.6, 10.5], [7, 6], "inworp op B"),
      run([13, 10], [10, 8], "kort tegen de bal"),
      pass([7, 6], [13, 10], "terug op D"),
    ],
  },
  {
    title: "Aftrap met ingestudeerde combinatie",
    type: "EXERCISE", theme: "SET_PIECE", subTheme: "Aftrap",
    ageMin: 12, ageMax: 18,
    fieldType: "QUARTER", footprintX: 30, footprintY: 22,
    minPlayers: 6, idealPlayers: 7, maxPlayers: 11, durationMin: 12,
    description: "Vaste combinatie na de aftrap: opzij, breed en meteen de diepte langs de lijn.",
    setup: "A en B staan bij de bal op de middenstip. Vleugelspelers C en D staan breed; drie tegenstanders staan op afstand tot de aftrap.",
    steps: [
      "A tikt de bal bij de aftrap opzij naar B.",
      "B legt de bal breed op vleugelspeler C.",
      "C neemt mee in de diepte langs de lijn; D kantelt mee naar binnen.",
      "Zoek meteen na de aftrap de vrije ruimte achter de tegenstander.",
    ],
    rules: "Vaste volgorde; snel spelen voordat de tegenstander opschuift.",
    coachingPoints: "Tempo direct na de aftrap, breedte benutten, diepte zoeken.",
    progressions: "Laat de tegenstander na de aftrap direct druk zetten.",
    simplifications: "Rustiger spelen zodat de looplijnen duidelijk worden.",
    aids: [
      P(14, 11, "A"), P(17, 11, "B"), ball(15.5, 11.7),
      P(6, 9, "C"), P(24, 9, "D"),
      O(10, 14, "1"), O(15, 14.5, "2"), O(20, 14, "3"),
    ],
    actions: [
      pass([14, 11], [17, 11], "aftrap opzij"),
      pass([17, 11], [6, 9], "breed op C"),
      run([6, 9], [6, 4], "diepte langs de lijn"),
    ],
  },

  // ==== CONDITIE / ATLETISCH VERMOGEN (selectable session theme) ============
  // Fitness/athletic drills that fit the standard session shape; footprints stay
  // within a half-pitch so split blocks can use them as parallel stations.
  {
    title: "Interval-loopscholing met bal",
    type: "EXERCISE", theme: "CONDITIE", subTheme: "Uithoudingsvermogen met bal",
    ageMin: 13, ageMax: 18,
    fieldType: "CIRCUIT", footprintX: 24, footprintY: 16,
    minPlayers: 4, idealPlayers: 6, maxPlayers: 12, durationMin: 14,
    ballScaling: "PER_PLAYER",
    description: "Intervaltraining met bal: hoge dribbeltempo's afgewisseld met actief herstel.",
    setup: "Zet met pylonen een rechthoek van 20×12 m uit met een pylon in het midden. Iedere speler heeft een bal en start bij pylon 1.",
    steps: [
      "Dribbel in hoog tempo van pylon 1 naar pylon 2 (ongeveer 20 seconden).",
      "Herstel actief: jog rustig met de bal terug naar de start.",
      "Herhaal 6 tot 8 keer en wissel het dribbeltempo per ronde af.",
      "Houd de bal steeds dicht bij de voet, ook bij hoge intensiteit.",
    ],
    rules: "In de sprintfase vol tempo, in de herstelfase bewust rustig.",
    coachingPoints: "Balcontrole onder vermoeidheid, actief herstel, gelijkmatig tempo.",
    progressions: "Verkort de hersteltijd of verleng de sprintafstand.",
    simplifications: "Langere hersteltijd; lager basistempo.",
    aids: [
      cone(2, 2), cone(22, 2), cone(22, 14), cone(2, 14), cone(12, 8),
      ...queue(3, 3, 6, "A"),
    ],
    actions: [
      dribble([3, 4], [22, 2], "sprintdribbel"),
      carry([22, 3], [3, 5], "herstel met bal"),
    ],
  },
  {
    title: "Sprint- en acceleratieparcours",
    type: "EXERCISE", theme: "CONDITIE", subTheme: "Snelheid en acceleratie",
    ageMin: 13, ageMax: 18,
    fieldType: "CIRCUIT", footprintX: 26, footprintY: 18,
    minPlayers: 4, idealPlayers: 6, maxPlayers: 12, durationMin: 12,
    description: "Explosieve starts en versnellingen over korte afstanden met volledig herstel.",
    setup: "Zet vier pylonen op één lijn op 0, 8, 16 en 22 meter. De spelers wachten in een rij achter de eerste pylon.",
    steps: [
      "Start explosief op teken van de trainer vanaf pylon 1.",
      "Versnel maximaal tot de laatste pylon en loop rustig uit.",
      "Wandel terug naar de start voor volledig herstel.",
      "Doe 6 tot 8 herhalingen met steeds volledige rust.",
    ],
    rules: "Elke sprint maximaal; herstel volledig voor de volgende poging.",
    coachingPoints: "Lage start, krachtige eerste passen, ontspannen uitlopen.",
    progressions: "Start liggend of vanuit een draai voor extra reactie.",
    simplifications: "Kortere afstanden; minder herhalingen.",
    aids: [
      cone(2, 4), cone(10, 4), cone(18, 4), cone(24, 4),
      ...queue(2, 6.5, 6, "A"),
    ],
    actions: [
      run([2, 6.5], [10, 4], "explosieve start"),
      run([10, 4], [24, 4], "doorsprinten"),
    ],
  },
  {
    title: "Coördinatie- en wendbaarheidscircuit",
    type: "EXERCISE", theme: "CONDITIE", subTheme: "Coördinatie en wendbaarheid",
    ageMin: 12, ageMax: 18,
    fieldType: "CIRCUIT", footprintX: 20, footprintY: 14,
    minPlayers: 4, idealPlayers: 6, maxPlayers: 12, durationMin: 12,
    description: "Slalom met snelle richtingsveranderingen, afgesloten met een korte sprint.",
    setup: "Zet vier pylonen in een slalom van links naar rechts. De spelers wachten in een rij bij de start.",
    steps: [
      "Loop met korte pasjes door de slalom langs de pylonen.",
      "Zet bij elke pylon scherp af en verander laag van richting.",
      "Sluit het circuit af met een korte sprint na de laatste pylon.",
      "Herstel rustig terug naar de start en herhaal.",
    ],
    rules: "Kleine snelle passen; niet tegen de pylonen aankomen.",
    coachingPoints: "Laag zwaartepunt, actieve armen, snelle voetenbeweging.",
    progressions: "Voeg een bal toe of maak de slalom smaller.",
    simplifications: "Grotere afstanden tussen de pylonen; lager tempo.",
    aids: [
      cone(4, 3), cone(8, 5), cone(12, 3), cone(16, 5),
      ...queue(2, 5, 6, "A", [0, 1.5]),
    ],
    actions: [
      dribble([2, 5], [16, 5], "slalom"),
      run([16, 5], [18, 10], "afsluiten met sprint"),
    ],
  },
  {
    title: "Kracht- en stabiliteitscircuit",
    type: "EXERCISE", theme: "CONDITIE", subTheme: "Kracht en stabiliteit",
    ageMin: 13, ageMax: 18,
    fieldType: "CIRCUIT", footprintX: 18, footprintY: 14,
    minPlayers: 4, idealPlayers: 6, maxPlayers: 12, durationMin: 14,
    description: "Rompstabiliteit- en krachtoefeningen met eigen lichaamsgewicht in stationsvorm.",
    setup: "Zet vier stations uit met een pylon per hoek en een pylon in het midden. Verdeel de spelers over de stations.",
    steps: [
      "Station 1: plank met afwisselend been optillen (30 seconden).",
      "Station 2: squats met rustig tempo (12 herhalingen).",
      "Station 3: uitvalspassen links en rechts (10 per been).",
      "Roteer op teken door naar het volgende station; herhaal de ronde.",
    ],
    rules: "Techniek gaat vóór tempo; rustige, gecontroleerde uitvoering.",
    coachingPoints: "Rechte rug, gespannen romp, gecontroleerde beweging.",
    progressions: "Verleng de tijd per station of voeg een extra ronde toe.",
    simplifications: "Kortere werktijd en langere rust tussen de stations.",
    aids: [
      cone(4, 3), cone(14, 3), cone(4, 11), cone(14, 11), cone(9, 7),
      P(4, 5, "A"), P(14, 5, "B"), P(4, 10, "C"), P(14, 10, "D"),
      P(9, 4), P(9, 11),
    ],
    actions: [
      run([4, 5], [14, 5], "wissel van station"),
      run([14, 5], [14, 11], "volgende oefening"),
    ],
  },
];

// KNVB sub-theme (leerdoel) per drill title. See SUB_THEMES in lib/enums.
const SUB_THEME_BY_TITLE: Record<string, string> = {
  // ATTACK
  "Afwerken via de 1-2": "Scoren verbeteren",
  "Dieptepass en voorzet afronden": "Creëren van kansen",
  "Partij 6-6 met accent op diepte": "Dieptespel in opbouw verbeteren",
  "Positiespel 4-tegen-2 naar een klein doel": "Positiespel in opbouw verbeteren",
  "Combineren en afronden op groot doel": "Scoren verbeteren",
  "Partij met accent aanvallen 7-tegen-7": "Creëren van kansen",
  "Positiespel 5-tegen-3 met kantspelers": "Positiespel in opbouw verbeteren",
  "Aanvallen over de flank met voorzet": "Creëren van kansen",
  "Passeren en scoren 2-tegen-1": "Uitspelen van één tegen één situatie verbeteren",
  "Overtal aanvallen 4-tegen-3 naar groot doel": "Creëren van kansen",
  "Combineren door het centrum": "Dieptespel in opbouw verbeteren",
  "Dieptepass en inloop 4-tegen-2": "Dieptespel in opbouw verbeteren",
  // DEFEND
  "Druk zetten 3-tegen-3 met steunpunten": "Storen en veroveren van de bal verbeteren",
  "Zone verdedigen 4-tegen-4": "Verdedigen van dieptespel verbeteren",
  "1-tegen-1 verdedigen naar twee doeltjes": "Verdedigen van één tegen één situatie verbeteren",
  "Kantelen in de linie 4-tegen-2": "Verdedigen wanneer de tegenstander kansen creëert verbeteren",
  "Verdedigen van de voorzet": "Voorkomen van doelpunten verbeteren",
  "Compact blok 6-tegen-4": "Verdedigen wanneer de tegenstander kansen creëert verbeteren",
  "Onderscheppen en uitverdedigen 4-tegen-4": "Storen en veroveren van de bal verbeteren",
  "Duel om de tweede bal": "Storen en veroveren van de bal verbeteren",
  "Partij met accent verdedigen 7-tegen-7": "Storen en veroveren van de bal verbeteren",
  // TRANSITION
  "Omschakelen 4-tegen-4 op vier doeltjes": "Omschakelen bij veroveren van de bal verbeteren",
  "Counteren na balwinst — 3v3 + spits": "Omschakelen bij veroveren van de bal verbeteren",
  "Balverovering en snel scoren": "Omschakelen bij veroveren van de bal verbeteren",
  "Omschakelen 3-tegen-3-tegen-3": "Omschakelen op moment van balverlies verbeteren",
  "Counter na hoge druk": "Omschakelen bij veroveren van de bal verbeteren",
  "Snelle omschakeling naar de flanken": "Omschakelen bij veroveren van de bal verbeteren",
  "Positiespel met omschakelmoment": "Omschakelen op moment van balverlies verbeteren",
  "Twee kleuren omschakelspel": "Omschakelen bij veroveren van de bal verbeteren",
  "Partij met omschakelaccent 8-tegen-8": "Omschakelen bij veroveren van de bal verbeteren",
  // NEUTRAL
  "Passruit — pass en volg": "Passen en aannemen",
  "Passen en bewegen in het vierkant": "Passen en aannemen",
  "Tikspel met bal — iedereen aan de bal": "Balgewenning en baltechniek",
  "Rondo 5-tegen-2": "Positiespel en balbezit",
  "Dribbelparcours met richtingsveranderingen": "Dribbelen en richtingsverandering",
  "Passen in tweetallen met beweging": "Passen en aannemen",
  "Dynamische warming-up met bal": "Warming-up en activeren",
  "Partij 8-tegen-8 op grote doelen": "Partijspel (vrije wedstrijdvorm)",
  "Positiepartij 8-tegen-8 op balbezit": "Positiespel en balbezit",
  "Linie-partij 6-tegen-6 op klein doel": "Partijspel (vrije wedstrijdvorm)",
};

// Final library: sub-theme applied + any overlapping figures nudged apart.
export const SEED_DRILLS: SeedDrill[] = RAW_SEED_DRILLS.map((d) => ({
  ...d,
  subTheme: d.subTheme ?? SUB_THEME_BY_TITLE[d.title],
  aids: declutter(d.aids, d.footprintX, d.footprintY),
}));
