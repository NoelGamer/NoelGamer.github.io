// Add, remove or edit games here.
// "image" is optional: put a picture in the images/ folder and set its path, e.g. "images/kukirin-life.png".
// Without one, the site tries to load the game's icon from Roblox automatically.
const GAMES = [
  {
    name: "Kukirin Life",
    placeId: "122840796290491",
    url: "https://www.roblox.com/games/122840796290491/Kukirin-Life",
    description: "Live the Kukirin life: explore, hang out and make the world yours.",
    image: "",
    colors: ["#ff4d6d", "#ff9f1c"],
  },
  {
    name: "RNG Cart Ride",
    placeId: "81343980131462",
    url: "https://www.roblox.com/games/81343980131462/RNG-Cart-Ride",
    description: "Hop in a cart and let luck decide the ride. Every run is different.",
    image: "",
    colors: ["#3a86ff", "#8338ec"],
  },
  {
    name: "just a game",
    placeId: "136521158139381",
    url: "https://www.roblox.com/games/136521158139381/just-a-game",
    description: "It's just a game. Or is it? Jump in and find out.",
    image: "",
    colors: ["#06d6a0", "#118ab2"],
  },
];

// Public CORS-friendly mirrors of the Roblox API. If they are down, the site still works,
// it just shows the coloured cards and hides the live numbers.
const API = "roproxy.com";

const list = document.getElementById("game-list");

function formatNumber(n) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

function renderGames() {
  list.innerHTML = GAMES.map((g) => `
    <a class="card" href="${g.url}" target="_blank" rel="noopener" data-place="${g.placeId}">
      <div class="thumb" style="--c1:${g.colors[0]};--c2:${g.colors[1]}">
        <span class="thumb-title">${g.name}</span>
        ${g.image ? `<img src="${g.image}" alt="${g.name}" loading="lazy">` : ""}
      </div>
      <div class="card-body">
        <h3>${g.name}</h3>
        <p>${g.description}</p>
        <div class="meta">
          <span class="live" hidden><i></i><b class="playing">0</b> playing</span>
          <span class="visits" hidden><b>0</b> visits</span>
        </div>
        <span class="play">Play on Roblox &rarr;</span>
      </div>
    </a>`).join("");
}

function setThumb(placeId, src) {
  const thumb = list.querySelector(`[data-place="${placeId}"] .thumb`);
  if (!thumb || thumb.querySelector("img")) return;
  const img = new Image();
  img.alt = "";
  img.onload = () => thumb.appendChild(img);
  img.src = src;
}

async function loadRobloxData() {
  const ids = GAMES.map((g) => g.placeId);

  // Game icons
  try {
    const res = await fetch(`https://thumbnails.${API}/v1/places/gameicons?placeIds=${ids.join(",")}&size=512x512&format=Png&isCircular=false`);
    const { data } = await res.json();
    data.forEach((t) => t.state === "Completed" && setThumb(String(t.targetId), t.imageUrl));
  } catch (e) { /* keep the coloured placeholder */ }

  // Live player counts and visits
  try {
    const universes = await Promise.all(ids.map(async (id) => {
      const res = await fetch(`https://apis.${API}/universes/v1/places/${id}/universe`);
      return (await res.json()).universeId;
    }));
    const res = await fetch(`https://games.${API}/v1/games?universeIds=${universes.join(",")}`);
    const { data } = await res.json();

    let totalVisits = 0;
    let totalPlaying = 0;
    data.forEach((game) => {
      const card = list.querySelector(`[data-place="${game.rootPlaceId}"]`);
      totalVisits += game.visits;
      totalPlaying += game.playing;
      if (!card) return;
      const live = card.querySelector(".live");
      const visits = card.querySelector(".visits");
      live.querySelector("b").textContent = formatNumber(game.playing);
      visits.querySelector("b").textContent = formatNumber(game.visits);
      live.hidden = false;
      visits.hidden = false;
    });
    document.getElementById("stat-visits").textContent = formatNumber(totalVisits);
    document.getElementById("stat-playing").textContent = formatNumber(totalPlaying);
  } catch (e) { /* numbers stay as dashes */ }
}

document.getElementById("year").textContent = new Date().getFullYear();
document.getElementById("stat-games").textContent = GAMES.length;
renderGames();
loadRobloxData();
