// colorMapper.js

const COLOR_MAP = {
  karminrot: "#8B0000",    // schlecht
  safran: "#F4C430",       // besser
  grün: "#6EDC3C",   // Durchschnitt
  himmelblau: "#87CEEB",   // sehr gut
  malve: "#C17DBA"         // unantastbar
};

function mapColor(player, rating) {
  if (rating >= 100) return COLOR_MAP.malve;        // unantastbar
  if (rating >= 80)  return COLOR_MAP.himmelblau;   // sehr gut
  if (rating >= 50)  return COLOR_MAP.grün;   // Durchschnitt
  if (rating >= 30)  return COLOR_MAP.safran;       // besser
  return COLOR_MAP.karminrot;                         // schlecht
}

window.mapColor = mapColor;
