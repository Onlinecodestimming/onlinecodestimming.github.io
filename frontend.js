// Expand the trackRow function to include the ellipsis button
function trackRow(track) {
  const row = document.createElement("article");
  row.className = "track";
  row.style.position = "relative"; // For context menu positioning
  
  // Notice the added .track-actions div for the heart and ellipsis
  row.innerHTML = `
    <img alt="">
    <div class="meta"><strong></strong><small></small></div>
    <div class="track-actions" style="display:flex; align-items:center; gap:4px;">
      <button class="like" aria-label="Favorite"></button>
      <button class="track-options-btn" aria-label="More options">…</button>
    </div>
  `;
  
  row.querySelector("img").src = art(track);
  row.querySelector("strong").textContent = clean(track.title);
  // Assume backend will eventually send track.genre
  row.querySelector("small").textContent = [track.artist, track.album, track.genre].filter(Boolean).join(" · ");
  
  const like = row.querySelector(".like");
  like.textContent = isFavorite(track) ? "♥" : "♡";
  like.classList.toggle("on", isFavorite(track));
  like.onclick = e => { e.stopPropagation(); toggleFavorite(track); };

  const optionsBtn = row.querySelector(".track-options-btn");
  optionsBtn.onclick = e => {
    e.stopPropagation();
    openContextMenu(e, track);
  };
  
  row.onclick = () => play(track);
  return row;
}

// Function to handle the "..." context menu
function openContextMenu(event, track) {
  // Remove existing menus
  document.querySelectorAll('.context-menu').forEach(m => m.remove());
  
  const menu = document.createElement("div");
  menu.className = "context-menu";
  menu.innerHTML = `
    <button id="cm-play-next">Play Next</button>
    <button id="cm-add-playlist">Add to Playlist</button>
    <button id="cm-share">Share Track</button>
  `;
  
  menu.style.top = `${event.clientY}px`;
  menu.style.left = `${event.clientX - 150}px`;
  document.body.appendChild(menu);

  menu.querySelector("#cm-play-next").onclick = () => {
    tracks.splice(current + 1, 0, track); // Insert after current
    menu.remove();
  };

  // Close menu when clicking outside
  document.addEventListener("click", () => menu.remove(), { once: true });
}

// Mocking Auto-Generated Playlists for Home Page
function renderHome() {
  const latest = tracks.slice(-10).reverse();
  fill("recentRow", latest, card);
  
  // Mock Heavy Rotation (Randomized for now until backend tracks play counts)
  const heavyRotation = shuffle(tracks).slice(0, 5);
  fill("heavyRotationRow", heavyRotation, card);

  // Mock Suggestions
  const suggestions = shuffle(tracks).slice(0, 5);
  fill("suggestionsRow", suggestions, card);

  // ... rest of renderHome logic
}
