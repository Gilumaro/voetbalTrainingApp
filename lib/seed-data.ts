import type { AidType, BallScaling, DrillType, FieldType, Theme } from "./enums";

export type SeedAid = {
  type: AidType;
  x: number; // metres from left edge of the drill footprint
  y: number; // metres from top edge of the drill footprint
  rotation?: number;
  label?: string;
};

export type SeedDrill = {
  title: string;
  type: DrillType;
  theme: Theme;
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
  coachingPoints?: string;
  progressions?: string;
  simplifications?: string;
  videoUrl?: string;
  aids: SeedAid[];
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

// Compact factory for the drills below (age U15-friendly by default).
function ex(
  type: DrillType,
  theme: Theme,
  title: string,
  footprintX: number,
  footprintY: number,
  minPlayers: number,
  idealPlayers: number,
  maxPlayers: number,
  durationMin: number,
  description: string,
  coachingPoints: string,
  aids: SeedAid[],
  ballScaling: BallScaling = "FIXED",
): SeedDrill {
  return {
    title,
    type,
    theme,
    ageMin: 13,
    ageMax: 18,
    fieldType: footprintX >= 44 ? "HALF" : "QUARTER",
    footprintX,
    footprintY,
    minPlayers,
    idealPlayers,
    maxPlayers,
    durationMin,
    ballScaling,
    description,
    coachingPoints,
    aids,
  };
}

// NOTE: this starter set is intentionally small (P1). It is expanded toward ~100
// U15 drills in P6. Every theme has >= 2 EXERCISE drills so a split block (two
// same-theme stations, groups rotating) can always be filled.
export const SEED_DRILLS: SeedDrill[] = [
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
      "Spelers passen in een vierkant en bewegen na de pass mee naar een nieuwe positie. Twee ballen tegelijk om het tempo hoog te houden.",
    coachingPoints:
      "Aanspeelbaar staan, inspeelmoment kiezen, pass met de juiste snelheid en op de goede voet.",
    progressions: "Beperk tot één of twee keer raken; voeg een derde bal toe.",
    simplifications: "Werk met één bal en een groter vierkant.",
    aids: [...box(20, 20), { type: "BALL", x: 6, y: 10 }, { type: "BALL", x: 14, y: 10 }],
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
      "Iedereen dribbelt met een bal in het vak. Twee tikkers (met hesje) proberen af te tikken; afgetikte spelers doen een taak en gaan verder.",
    coachingPoints: "Bal dicht bij de voet, hoofd omhoog, kappen en draaien om ruimte te vinden.",
    progressions: "Verklein het vak of voeg een tikker toe.",
    simplifications: "Vergroot het vak of tik zonder bal.",
    aids: [...box(25, 25)],
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
      "Vier aanvallers houden de bal in balbezit tegen twee verdedigers. Na een X-aantal passes mag er op het kleine doel worden gescoord.",
    coachingPoints: "Hoeken opzoeken, breedte en diepte geven, derde man aanspelen.",
    progressions: "Verhoog het aantal verdedigers naar drie.",
    simplifications: "Vergroot de ruimte of speel 4-tegen-1.",
    aids: [
      ...box(28, 20),
      { type: "SMALL_GOAL", x: 14, y: 0, label: "doel" },
      { type: "BALL", x: 14, y: 14 },
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
      "In twee groepjes wordt via een vaste combinatie (pass-terug-diep) afgerond op het grote doel met keeper. Wissel van kant na elke poging.",
    coachingPoints: "Timing van de inloop, scherpe passing, bewust afronden (plaatsen of hard).",
    progressions: "Voeg een passieve en daarna actieve verdediger toe.",
    simplifications: "Zonder verdediger, kortere afstand tot het doel.",
    aids: [
      ...box(30, 25),
      { type: "BIG_GOAL", x: 15, y: 0, label: "doel + keeper" },
      { type: "CONE", x: 8, y: 16 },
      { type: "CONE", x: 22, y: 16 },
      { type: "BALL", x: 8, y: 18 },
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
      "3-tegen-3 met twee steunpunten (jokers) op de zijkant. Het verdedigende team probeert druk te zetten en de bal te veroveren, en scoort daarna op één van de kleine doeltjes.",
    coachingPoints: "Druk op de baldrager, kantelen, dekkingsschaduw, samen verdedigen.",
    progressions: "Steunpunten worden actief meespelend.",
    simplifications: "Geef het verdedigende team een extra speler.",
    aids: [
      ...box(28, 20),
      { type: "SMALL_GOAL", x: 6, y: 0 },
      { type: "SMALL_GOAL", x: 22, y: 0 },
      { type: "BALL", x: 14, y: 10 },
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
      "Vier verdedigers verdedigen als linie hun zone tegen vier aanvallers. Bal veroveren en uitverdedigen naar een steunpunt levert een punt op.",
    coachingPoints: "Onderlinge afstanden, knijpen naar de bal, op het juiste moment doorschuiven.",
    progressions: "Voeg een spits toe (4v5) om de linie te belasten.",
    simplifications: "Verklein de breedte van de zone.",
    aids: [
      ...box(32, 24),
      { type: "SMALL_GOAL", x: 8, y: 24 },
      { type: "SMALL_GOAL", x: 24, y: 24 },
      { type: "BALL", x: 16, y: 2 },
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
      "4-tegen-4 met aan beide kanten twee kleine doeltjes. Bij balverlies of balwinst moet er direct worden omgeschakeld naar de andere fase.",
    coachingPoints: "Snel handelen na balverlies/balwinst, eerste actie is de belangrijkste.",
    progressions: "Beperk het aantal keer raken bij balbezit.",
    simplifications: "Vergroot de ruimte zodat er meer tijd is.",
    aids: [
      ...box(30, 22),
      { type: "SMALL_GOAL", x: 8, y: 0 },
      { type: "SMALL_GOAL", x: 22, y: 0 },
      { type: "SMALL_GOAL", x: 8, y: 22 },
      { type: "SMALL_GOAL", x: 22, y: 22 },
      { type: "BALL", x: 15, y: 11 },
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
      "Na balwinst schakelt het team direct om en zoekt de diepgaande spits om te counteren op het grote doel.",
    coachingPoints: "Diepte kiezen, tempo in de omschakeling, keuze pass of dribbel.",
    progressions: "Verklein de tijd om af te ronden na balwinst.",
    simplifications: "Zonder tijdslimiet, extra aanvaller.",
    aids: [
      ...box(32, 22),
      { type: "BIG_GOAL", x: 16, y: 0, label: "doel + keeper" },
      { type: "SMALL_GOAL", x: 8, y: 22 },
      { type: "SMALL_GOAL", x: 24, y: 22 },
      { type: "BALL", x: 16, y: 14 },
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
      "Afsluitende partij op twee grote doelen met keepers. Laat het thema van de training terugkomen door een korte regel toe te voegen.",
    coachingPoints: "Speel wat is getraind; coach kort en positief op het thema.",
    progressions: "Voeg een themaregel toe (bijv. punt voor druk zetten binnen 5 sec).",
    simplifications: "Speel met minder spelers en meer ruimte.",
    aids: [
      ...box(50, 35),
      { type: "BIG_GOAL", x: 25, y: 0, label: "doel + keeper" },
      { type: "BIG_GOAL", x: 25, y: 35, label: "doel + keeper" },
      { type: "BALL", x: 25, y: 17 },
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
      "Partij waarin het aanvallen wordt beloond: een doelpunt na een aanval over de flank of na een combinatie in het strafschopgebied telt dubbel.",
    coachingPoints: "Breedte en diepte in de aanval, durf te versnellen, afronden.",
    progressions: "Beperk het aantal keer raken van het verdedigende team.",
    simplifications: "Geef het aanvallende team een extra speler.",
    aids: [
      ...box(48, 34),
      { type: "BIG_GOAL", x: 24, y: 0, label: "doel + keeper" },
      { type: "BIG_GOAL", x: 24, y: 34, label: "doel + keeper" },
      { type: "BALL", x: 24, y: 17 },
    ],
  },

  // ==== extra warming-ups ===================================================
  ex("WARMUP", "NEUTRAL", "Rondo 5-tegen-2", 12, 12, 7, 10, 14, 10,
    "Vijf spelers houden de bal rond, twee in het midden proberen te onderscheppen. Wie balverlies veroorzaakt, gaat naar het midden.",
    "Aanspeelbaar staan, eerste raak spelen, tempo hoog houden.",
    [...box(12, 12), { type: "BALL", x: 6, y: 6 }]),
  ex("WARMUP", "NEUTRAL", "Dribbelparcours met richtingsveranderingen", 22, 16, 8, 12, 16, 10,
    "Spelers dribbelen door een parcours van pylonen met kap- en draaibewegingen; op tempo terug in de rij.",
    "Bal dicht bij de voet, kijk op na elke actie, gebruik beide voeten.",
    [...box(22, 16), { type: "CONE", x: 7, y: 8 }, { type: "CONE", x: 11, y: 8 }, { type: "CONE", x: 15, y: 8 }],
    "PER_PLAYER"),
  ex("WARMUP", "NEUTRAL", "Passen in tweetallen met beweging", 24, 18, 8, 12, 16, 10,
    "In tweetallen inpassen en bewegen: aan- en afgeven, wandje leggen, diep sturen. Wissel na enkele minuten van partner.",
    "Zuivere pass, meebewegen, communiceren.",
    [...box(24, 18), { type: "BALL", x: 8, y: 9 }, { type: "BALL", x: 16, y: 9 }],
    "PER_PAIR"),
  ex("WARMUP", "NEUTRAL", "Dynamische warming-up met bal", 20, 15, 8, 14, 18, 8,
    "Loop-, spring- en mobiliteitsoefeningen afgewisseld met korte balcontacten. Rustig opbouwen in intensiteit.",
    "Nette uitvoering, geleidelijk versnellen.",
    [...box(20, 15)],
    "PER_PLAYER"),

  // ==== extra ATTACK exercises =============================================
  ex("EXERCISE", "ATTACK", "Positiespel 5-tegen-3 met kantspelers", 32, 24, 8, 9, 10, 16,
    "Vijf tegen drie in balbezit met twee vrije kantspelers. Doel: de bal rondspelen en via de zijkant een doeltje aanvallen.",
    "Breedte benutten, derde man inschakelen, tempo van de pass.",
    [...box(32, 24), { type: "SMALL_GOAL", x: 8, y: 0 }, { type: "SMALL_GOAL", x: 24, y: 0 }, { type: "BALL", x: 16, y: 12 }]),
  ex("EXERCISE", "ATTACK", "Aanvallen over de flank met voorzet", 34, 26, 8, 9, 10, 18,
    "Opbouw via de flank, voorzet en inloop van twee spelers op het grote doel. Wissel van kant per beurt.",
    "Timing van de voorzet, scherpe inloop, bewust afronden.",
    [...box(34, 26), { type: "BIG_GOAL", x: 17, y: 0, label: "doel + keeper" }, { type: "CONE", x: 30, y: 12 }, { type: "BALL", x: 6, y: 18 }]),
  ex("EXERCISE", "ATTACK", "Passeren en scoren 2-tegen-1", 26, 20, 6, 7, 8, 15,
    "Twee aanvallers tegen één verdediger richting klein doel. Kies: zelf doorgaan of de vrije man aanspelen.",
    "Beslissing op tijd, tempo in de actie, oog voor de medespeler.",
    [...box(26, 20), { type: "SMALL_GOAL", x: 13, y: 0 }, { type: "BALL", x: 13, y: 15 }]),
  ex("EXERCISE", "ATTACK", "Overtal aanvallen 4-tegen-3 naar groot doel", 34, 26, 7, 8, 9, 18,
    "Vier aanvallers benutten de overtalsituatie tegen drie verdedigers en ronden af op het grote doel.",
    "Overtal uitspelen, breedte houden, snel afronden.",
    [...box(34, 26), { type: "BIG_GOAL", x: 17, y: 0, label: "doel + keeper" }, { type: "BALL", x: 17, y: 18 }]),
  ex("EXERCISE", "ATTACK", "Combineren door het centrum", 28, 22, 6, 8, 8, 15,
    "Door snelle combinaties (één-tweetjes) door het midden een dieptepass op een medespeler in de zone bereiken.",
    "Eén-tweetjes, inspeelmoment, dieptepass op het juiste moment.",
    [...box(28, 22), { type: "SMALL_GOAL", x: 8, y: 0 }, { type: "SMALL_GOAL", x: 20, y: 0 }, { type: "BALL", x: 14, y: 16 }]),
  ex("EXERCISE", "ATTACK", "Dieptepass en inloop 4-tegen-2", 30, 22, 6, 7, 8, 16,
    "Vier tegen twee in balbezit; op het juiste moment een dieptepass geven en inlopen om te scoren op een doeltje.",
    "Aanspeelbaar staan, dieptepass herkennen, inlopen.",
    [...box(30, 22), { type: "SMALL_GOAL", x: 15, y: 0 }, { type: "BALL", x: 15, y: 16 }]),

  // ==== extra DEFEND exercises =============================================
  ex("EXERCISE", "DEFEND", "1-tegen-1 verdedigen naar twee doeltjes", 20, 16, 6, 8, 8, 14,
    "Verdediger verdedigt twee kleine doeltjes tegen één aanvaller. Bij balwinst mag de verdediger zelf scoren.",
    "Goede uitgangshouding, sturen naar buiten, geduld en timing.",
    [...box(20, 16), { type: "SMALL_GOAL", x: 6, y: 0 }, { type: "SMALL_GOAL", x: 14, y: 0 }, { type: "BALL", x: 10, y: 14 }]),
  ex("EXERCISE", "DEFEND", "Kantelen in de linie 4-tegen-2", 32, 20, 6, 7, 8, 15,
    "Een linie van vier kantelt met de bal mee tegen twee aanvallers en probeert de bal te veroveren.",
    "Onderlinge afstanden, kantelen, druk op de bal.",
    [...box(32, 20), { type: "SMALL_GOAL", x: 8, y: 20 }, { type: "SMALL_GOAL", x: 24, y: 20 }, { type: "BALL", x: 16, y: 4 }]),
  ex("EXERCISE", "DEFEND", "Verdedigen van de voorzet", 30, 24, 8, 9, 10, 16,
    "Verdedigers verdedigen voorzetten vanaf de flank; koppen of onderscheppen en uitverdedigen naar een steunpunt.",
    "Positie t.o.v. bal en tegenstander, druk op de voorzet, kort dekken in het zestienmetergebied.",
    [...box(30, 24), { type: "BIG_GOAL", x: 15, y: 0, label: "doel + keeper" }, { type: "CONE", x: 27, y: 10 }, { type: "BALL", x: 27, y: 8 }]),
  ex("EXERCISE", "DEFEND", "Compact blok 6-tegen-4", 34, 26, 9, 10, 11, 18,
    "Zes verdedigers houden een compact blok tegen vier aanvallers plus rustspelers. Bal veroveren = punt.",
    "Compact blijven, samen verdedigen, moment van druk kiezen.",
    [...box(34, 26), { type: "SMALL_GOAL", x: 10, y: 26 }, { type: "SMALL_GOAL", x: 24, y: 26 }, { type: "BALL", x: 17, y: 4 }]),
  ex("EXERCISE", "DEFEND", "Onderscheppen en uitverdedigen 4-tegen-4", 30, 22, 8, 8, 10, 16,
    "Vier tegen vier; het verdedigende team probeert te onderscheppen en de bal rustig uit te verdedigen naar een doeltje.",
    "Dekkingsschaduw, onderscheppen, eerste pass na balwinst.",
    [...box(30, 22), { type: "SMALL_GOAL", x: 8, y: 22 }, { type: "SMALL_GOAL", x: 22, y: 22 }, { type: "BALL", x: 15, y: 4 }]),
  ex("EXERCISE", "DEFEND", "Duel om de tweede bal", 24, 20, 8, 8, 10, 14,
    "Na een lange bal strijden twee teams om de tweede bal en proberen die te veroveren en te behouden.",
    "Anticiperen op de tweede bal, agressief maar gecontroleerd duelleren.",
    [...box(24, 20), { type: "SMALL_GOAL", x: 6, y: 0 }, { type: "SMALL_GOAL", x: 18, y: 20 }, { type: "BALL", x: 12, y: 10 }]),

  // ==== extra TRANSITION exercises =========================================
  ex("EXERCISE", "TRANSITION", "Balverovering en snel scoren", 30, 22, 8, 8, 9, 16,
    "Twee teams; direct na balwinst zo snel mogelijk scoren op het grote doel voordat de tegenstander georganiseerd staat.",
    "Eerste actie na balwinst, tempo, vooruit durven spelen.",
    [...box(30, 22), { type: "BIG_GOAL", x: 15, y: 0, label: "doel + keeper" }, { type: "SMALL_GOAL", x: 8, y: 22 }, { type: "SMALL_GOAL", x: 22, y: 22 }, { type: "BALL", x: 15, y: 14 }]),
  ex("EXERCISE", "TRANSITION", "Omschakelen 3-tegen-3-tegen-3", 26, 24, 9, 9, 9, 16,
    "Drie teams van drie; het balverliezende team wisselt met het wachtende team. Constant om- en omschakelen.",
    "Direct herkennen van de fase, snel handelen, communiceren.",
    [...box(26, 24), { type: "SMALL_GOAL", x: 8, y: 0 }, { type: "SMALL_GOAL", x: 18, y: 24 }, { type: "BALL", x: 13, y: 12 }]),
  ex("EXERCISE", "TRANSITION", "Counter na hoge druk", 34, 26, 8, 9, 10, 18,
    "Het ene team zet hoog druk; bij balwinst counteren richting het grote doel, anders scoren op de doeltjes.",
    "Druk zetten als team, balwinst benutten, keuze in de counter.",
    [...box(34, 26), { type: "BIG_GOAL", x: 17, y: 0, label: "doel + keeper" }, { type: "SMALL_GOAL", x: 10, y: 26 }, { type: "SMALL_GOAL", x: 24, y: 26 }, { type: "BALL", x: 17, y: 20 }]),
  ex("EXERCISE", "TRANSITION", "Snelle omschakeling naar de flanken", 32, 24, 8, 8, 9, 16,
    "Na balwinst zo snel mogelijk de bal naar de vrije flank spelen om ruimte te benutten en aan te vallen.",
    "Spelverplaatsing, tempo, timing van de flankaanval.",
    [...box(32, 24), { type: "SMALL_GOAL", x: 8, y: 0 }, { type: "SMALL_GOAL", x: 24, y: 0 }, { type: "BALL", x: 16, y: 16 }]),
  ex("EXERCISE", "TRANSITION", "Positiespel met omschakelmoment", 28, 22, 8, 8, 9, 15,
    "Balbezit 5-tegen-3; bij balverlies moeten de drie direct omschakelen en proberen te scoren op een doeltje.",
    "Rust in balbezit, direct omschakelen bij balverlies.",
    [...box(28, 22), { type: "SMALL_GOAL", x: 8, y: 0 }, { type: "SMALL_GOAL", x: 20, y: 22 }, { type: "BALL", x: 14, y: 11 }]),
  ex("EXERCISE", "TRANSITION", "Twee kleuren omschakelspel", 28, 20, 8, 10, 10, 15,
    "Twee teams spelen op vier doeltjes; elke balwinst is een direct omschakelmoment naar de aanval.",
    "Snel schakelen, eerste pass vooruit, samen jagen.",
    [...box(28, 20), { type: "SMALL_GOAL", x: 8, y: 0 }, { type: "SMALL_GOAL", x: 20, y: 0 }, { type: "SMALL_GOAL", x: 8, y: 20 }, { type: "SMALL_GOAL", x: 20, y: 20 }, { type: "BALL", x: 14, y: 10 }]),

  // ==== extra partijvormen (MATCHFORM) =====================================
  ex("MATCHFORM", "DEFEND", "Partij met accent verdedigen 7-tegen-7", 48, 34, 10, 14, 16, 20,
    "Partij op grote doelen waarbij goed verdedigen wordt beloond: de bal binnen 6 seconden veroveren levert een extra punt op.",
    "Druk zetten, compact blok, samen verdedigen.",
    [...box(48, 34), { type: "BIG_GOAL", x: 24, y: 0, label: "doel + keeper" }, { type: "BIG_GOAL", x: 24, y: 34, label: "doel + keeper" }, { type: "BALL", x: 24, y: 17 }]),
  ex("MATCHFORM", "TRANSITION", "Partij met omschakelaccent 8-tegen-8", 50, 35, 12, 16, 18, 20,
    "Partij op grote doelen; een doelpunt binnen 8 seconden na balwinst telt dubbel. Beloont de omschakeling.",
    "Snel schakelen na balwinst én balverlies, tempo.",
    [...box(50, 35), { type: "BIG_GOAL", x: 25, y: 0, label: "doel + keeper" }, { type: "BIG_GOAL", x: 25, y: 35, label: "doel + keeper" }, { type: "BALL", x: 25, y: 17 }]),
  ex("MATCHFORM", "NEUTRAL", "Positiepartij 8-tegen-8 op balbezit", 50, 35, 12, 16, 18, 18,
    "Partij met accent op balbezit: een X-aantal passes op rij levert een punt op, scoren op de kleine doeltjes telt dubbel.",
    "Rust en overzicht in balbezit, aanspeelbaar staan.",
    [...box(50, 35), { type: "SMALL_GOAL", x: 12, y: 0 }, { type: "SMALL_GOAL", x: 38, y: 0 }, { type: "SMALL_GOAL", x: 12, y: 35 }, { type: "SMALL_GOAL", x: 38, y: 35 }, { type: "BALL", x: 25, y: 17 }]),
  ex("MATCHFORM", "NEUTRAL", "Linie-partij 6-tegen-6 op klein doel", 44, 32, 10, 12, 14, 18,
    "Partij zonder keepers op kleine doelen; ideaal om linies en onderlinge afstanden te trainen.",
    "Organisatie in linies, onderlinge afstanden, omschakelen.",
    [...box(44, 32), { type: "SMALL_GOAL", x: 22, y: 0 }, { type: "SMALL_GOAL", x: 22, y: 32 }, { type: "BALL", x: 22, y: 16 }]),
];
