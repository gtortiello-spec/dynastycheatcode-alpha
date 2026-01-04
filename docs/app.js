// ===================
// DOM
// ===================
const loadBtn = document.getElementById("loadLeague");
const leagueInput = document.getElementById("leagueId");
const output = document.getElementById("output");
const POSITION_ORDER = {
  QB: 1,
  RB: 2,
  WR: 3,
  TE: 4,
  FLEX: 5,
  K: 6,
  DEF: 7
};

// ===================
// STATE
// ===================
let MY_TEAM_ID = null;     // wird aus Username + Liga ermittelt
let MY_USER_ID = null;     // Sleeper user_id
let LAST_DATA = null;


// ===================
// USER HELPERS
// ===================
async function fetchUserId(username) {
  const res = await fetch(`https://api.sleeper.app/v1/user/${username}`);
  if (!res.ok) throw new Error("User not found");
  const user = await res.json();
  return user.user_id;
}

async function resolveMyTeamId(userId, leagueId) {
  const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
  const rosters = await res.json();
  const myRoster = rosters.find(r => r.owner_id === userId);
  return myRoster ? myRoster.roster_id : null;
}



// ===================
// DEINE FARBLOGIK (p.color -> COLOR_STYLES[p.color])
// ===================
const COLOR_STYLES = {
  karminrot: "#8B0000",
  koralle: "#FF7F50",
  safran: "#F4C430",
  grün: "#6EDC3C",   
  himmelblau: "#87CEEB",
  malve: "#C71585",
};

// ===================
// LOAD LEAGUE
// ===================
loadBtn.addEventListener("click", async () => {
  const leagueId = leagueInput.value.trim();
  if (!leagueId) return;

  output.innerHTML = "Lade...";

// === NEU START ===
const username = document.getElementById("username").value.trim();
if (!username) {
  output.innerHTML = "Username fehlt";
  return;
}

MY_USER_ID = await fetchUserId(username);
MY_TEAM_ID = await resolveMyTeamId(MY_USER_ID, leagueId);

console.log("MY_TEAM_ID =", MY_TEAM_ID);
// === NEU ENDE ===


  try {
    const res = await fetch("/api/league/load", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leagueId }),
    });

    const data = await res.json();

    if (!data || !data.ok || !Array.isArray(data.teams)) {
      output.innerHTML = "Fehler";
      return;
    }


// Stats laden
try {
  // 1. Aktuellen NFL-State holen
  const stateRes = await fetch("https://api.sleeper.app/v1/state/nfl");
  const state = await stateRes.json();

  const SEASON = state.season;
  const SEASON_TYPE = state.season_type; // "regular", "post", "pre"

  // 2. Stats für aktuelle Season laden
  const statsUrl = `https://api.sleeper.app/v1/stats/nfl/${SEASON_TYPE}/${SEASON}`;
  const statsRes = await fetch(statsUrl);
  const stats = await statsRes.json();

  setStats(stats);
  console.log("STATS LOADED:", SEASON, SEASON_TYPE, Object.keys(stats).length);
} catch (err) {
  console.error("Fehler beim Laden der Stats", err);
}

    LAST_DATA = data;
    renderAll();
  } catch (e) {
    output.innerHTML = "Netzwerkfehler";
    console.error(e);
  }
});

// ===================
// RENDER ALL (Info + Teams) - damit nichts überschrieben wird
// ===================
function renderAll() {
  if (!LAST_DATA) return;

  output.innerHTML = "";

  renderLeagueInfo(LAST_DATA);
  renderTeams(LAST_DATA.teams);
}

// ===================
// LEAGUE INFO
// ===================
function renderLeagueInfo(data) {
  const info = document.createElement("div");
  info.style.fontWeight = "bold";
  info.style.marginBottom = "12px";

  const type = data.settings?.type || "Dynasty";
  const superflex = data.settings?.superflex ? "Superflex" : "1QB";
  const teams = data.total_rosters || data.rosters?.length || "?";

  info.textContent = `${type} | ${superflex} | ${teams} Teams`;
  output.appendChild(info);
}

// ===================
// RENDER TEAMS
// ===================
function renderTeams(teams) {
  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridAutoFlow = "column";
  grid.style.gridTemplateRows = "repeat(2, auto)";
  grid.style.gap = "12px";
  grid.style.justifyContent = "start";
  grid.style.alignItems = "start";

  teams.forEach(team => {
    const box = document.createElement("div");

    box.style.border = "1px solid #ccc";
    box.style.padding = "8px";
    box.style.minWidth = "220px";

    const teamId = String(team.owner_id ?? team.team_id ?? team.roster_id ?? "");

    const isMine = MY_TEAM_ID && teamId && String(MY_TEAM_ID) === teamId;
    if (isMine) {
      box.style.background = "#2a2a2a";
      box.style.border = "2px solid #00ff99";
    }

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.justifyContent = "space-between";
    header.style.gap = "8px";

    const title = document.createElement("a");
    title.href = "#";
    title.style.fontWeight = "bold";
    title.textContent = `${team.team_name || "(kein Teamname)"} - ${team.owner_name || ""}${isMine ? " (MEIN TEAM)" : ""}`;

    const setMineBtn = document.createElement("button");
    setMineBtn.type = "button";
    setMineBtn.textContent = "Mein Team";
    setMineBtn.style.padding = "2px 6px";
    setMineBtn.style.cursor = "pointer";

    setMineBtn.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      if (!teamId) return;

      MY_TEAM_ID = teamId;
      localStorage.setItem("MY_TEAM_ID", teamId);
      renderAll();
    });

    header.appendChild(title);
    header.appendChild(setMineBtn);

    const rosterDiv = document.createElement("div");
    rosterDiv.style.marginTop = "6px";
    rosterDiv.style.display = "none";

    title.addEventListener("click", e => {
      e.preventDefault();
      rosterDiv.style.display = rosterDiv.style.display === "none" ? "block" : "none";
    });

    if (Array.isArray(team.players)) {
      const ul = document.createElement("ul");

      // SORTIERUNG NACH POSITION
      team.players.sort((a, b) => {
        const pa = POSITION_ORDER[a.position] ?? 99;
        const pb = POSITION_ORDER[b.position] ?? 99;
        return pa - pb;
      });

      team.players.forEach(p => {
  const rating = ratePlayer(p);
  const isOwnPlayer = (team.roster_id === MY_TEAM_ID);
  const color = mapColor(p, rating,);

  p.color = color;

  const li = document.createElement("li");
li.textContent = p.name;

/* Kachel-Styling */
li.style.background = p.color;
li.style.color = "#FFFFFF";
li.style.padding = "8px 12px";
li.style.margin = "4px 0";
li.style.borderRadius = "6px";
li.style.listStyle = "none";
li.style.fontWeight = "500";

if (isOwnPlayer) {
  li.style.outline = "2px solid rgba(255,255,255,0.7)";
  li.style.outlineOffset = "2px";
}

ul.appendChild(li);

});

// 🔽 HIER RICHTIG
window.DEBUG_PLAYERS = team.players;
console.log("DEBUG_PLAYERS SET", team.players);

      rosterDiv.appendChild(ul);
    }

    box.appendChild(header);
    box.appendChild(rosterDiv);
    grid.appendChild(box);
  });

  output.appendChild(grid);
}
