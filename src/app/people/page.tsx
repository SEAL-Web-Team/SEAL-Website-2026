import people from "@/data/people.json";

type Person = typeof people[number];

// Maps role number prefix → team
const ROLE_TEAM: Record<string, string> = {
  "1.": "ITAC",
  "2.": "Embedded",
  "3.": "Plasma",
  "5.": "Sudoku",
  "6.": "Teaching",
  "7.": "Biz/Tech",
  "8.1": "Lab Exec",
  "7.1": "Lab Exec",
};

const TEAM_ORDER = ["Lab Exec", "ITAC", "Embedded", "Plasma", "Sudoku", "Teaching", "Biz/Tech"];

const TEAM_COLORS: Record<string, { label: string; bar: string }> = {
  "Lab Exec":  { label: "text-slate-400", bar: "bg-white/20" },
  "ITAC":      { label: "text-slate-400", bar: "bg-white/20" },
  "Embedded":  { label: "text-slate-400", bar: "bg-white/20" },
  "Plasma":    { label: "text-slate-400", bar: "bg-white/20" },
  "Sudoku":    { label: "text-slate-400", bar: "bg-white/20" },
  "Teaching":  { label: "text-slate-400", bar: "bg-white/20" },
  "Biz/Tech":  { label: "text-slate-400", bar: "bg-white/20" },
};

function roleToTeam(role: string): string | null {
  // Check 8.1 and 7.1 before generic 7. / 8.
  if (role.startsWith("8.1") || role.toLowerCase().includes("lab director") || role.toLowerCase().includes("clan lead")) return "Lab Exec";
  if (role.startsWith("7.1")) return "Lab Exec";
  for (const [prefix, team] of Object.entries(ROLE_TEAM)) {
    if (role.startsWith(prefix)) return team;
  }
  return null;
}

function roleRank(role: string): number {
  const r = role.toLowerCase();
  if (r.includes("group lead") || r.includes("director") || r.includes("clan lead")) return 0;
  if (r.includes("team lead")) return 1;
  return 2;
}

function teamsForPerson(person: Person): string[] {
  const teams = new Set<string>();
  for (const role of person.roles) {
    const team = roleToTeam(role);
    if (team) teams.add(team);
  }
  return Array.from(teams);
}

function rolesForTeam(person: Person, team: string): string[] {
  return person.roles.filter((r) => roleToTeam(r) === team);
}

function bestRankForTeam(person: Person, team: string): number {
  return Math.min(...rolesForTeam(person, team).map(roleRank));
}

function PersonCard({ person, large = false }: {
  person: Person;
  large?: boolean;
}) {
  const titles = person.roles
    .map((r) => r.replace(/^\d+\.\d+\.?\s*/, "").trim())
    .join(", ");

  return (
    <div className="group flex flex-col">
      <div className={`surface-card relative w-full overflow-hidden ${large ? "rounded-2xl" : "rounded-xl"} mb-4`}>
        <div className="aspect-square">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={person.image}
            alt={person.name}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>
      <p className={`text-white font-semibold leading-snug mb-1 ${large ? "text-xl" : "text-base"}`}>{person.name}</p>
      <p className={`text-slate-300 leading-snug ${large ? "text-base" : "text-sm"}`}>{titles}</p>
    </div>
  );
}

export default function PeoplePage() {
  const grouped = TEAM_ORDER.map((team) => {
    const members = people
      .filter((p) => teamsForPerson(p).includes(team))
      .sort((a, b) => bestRankForTeam(a, team) - bestRankForTeam(b, team));
    return { team, members };
  });

  const [leadership, ...teams] = grouped;

  return (
    <div className="page-shell">
      <div className="page-container">

        <div className="page-header">
          <h1 className="page-title">People</h1>
          <p className="page-subtitle">The researchers, engineers, and students driving SEAL Lab forward.</p>
        </div>

        {/* ── Lab Leadership ── */}
        <div className="mb-28 pb-28 border-b border-white/[0.06]">
          <div className="flex items-center gap-4 mb-10">
            <div className={`w-8 h-px ${TEAM_COLORS["Lab Exec"].bar}`} />
            <h2 className={`text-sm font-semibold uppercase tracking-widest ${TEAM_COLORS["Lab Exec"].label}`}>Lab Leadership</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {leadership.members.map((p) => (
              <PersonCard key={p.name} person={p} large />
            ))}
          </div>
        </div>

        {/* ── Teams ── */}
        <div className="flex flex-col gap-24">
          {teams.map(({ team, members }) => {
            const colors = TEAM_COLORS[team];
            return (
              <div key={team}>
                <div className="flex items-center gap-4 mb-10">
                  <div className={`w-8 h-px ${colors.bar}`} />
                  <h2 className={`text-sm font-semibold uppercase tracking-widest ${colors.label}`}>{team}</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                  {members.map((p) => (
                    <PersonCard key={p.name} person={p} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
