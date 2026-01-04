// ratingEngine.js
// Verantwortlich NUR für numerische Bewertung und Tiers
// Keine Farben, kein UI, keine Darstellung

let STATS = {};

const OFFENSE_POS = ["QB", "RB", "WR", "TE", "FB"];
const DEFENSE_POS = ["DL", "LB", "DB", "CB", "S", "EDGE"];

function setStats(stats) {
  STATS = stats || {};
}


function ratePlayer(player) {
  if (!player || !player.id) return 0;

  const stats = STATS[player.id] || {};
  const position = player.position;

  let score = 0;

  // OFFENSE
  if (["QB", "RB", "WR", "TE"].includes(position)) {
    score += (stats.pass_yd || 0) / 25;
    score += (stats.pass_td || 0) * 4;
    score += (stats.rush_yd || 0) / 10;
    score += (stats.rush_td || 0) * 6;
    score += (stats.rec || 0);
    score += (stats.rec_td || 0) * 6;
  }

  // DEFENSE (IDP)
if (DEFENSE_POS.includes(position)) {
  score += (stats.idp_tkl || 0) * 1;
  score += (stats.idp_sack || 0) * 3;
  score += (stats.idp_int || 0) * 4;
  score += (stats.idp_ff || 0) * 3;
  score += (stats.idp_fr || 0) * 2;
  score += (stats.idp_td || 0) * 6;
  score += (stats.idp_pass_def || 0) * 1.5;
}

  return Math.round(score);
}

// Export
window.ratePlayer = ratePlayer;
window.ratePlayers = ratePlayers;
window.setStats = setStats;

function ratePlayers(players) {
  return players.map(p => ({
    ...p,
    rating: ratePlayer(p)
  }));
}

window.ratePlayers = ratePlayers;
