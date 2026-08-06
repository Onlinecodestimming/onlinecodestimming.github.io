"use strict";
const API_URL="https://music-backend-production-10bd.up.railway.app";
const $=id=>document.getElementById(id),audio=$("audio"),fallback="https://via.placeholder.com/400/24242a/ffffff?text=Musicfy";
let tracks=[], queue=[], current=-1, featured=null, shuffleOn=false, repeatOn=false, animFrame=null;
const clean=value=>String(value||"Untitled").replace(/\.[^/.]+$/,""),art=t=>t.artwork||fallback;
const saved=()=>{try{return JSON.parse(localStorage.getItem("musicfy-favorites")||"[]")}catch{return[]}};
const isFavorite=t=>saved().includes(String(t.id));
const toggleFavorite=t=>{const ids=saved(),id=String(t.id),next=ids.includes(id)?ids.filter(x=>x!==id):[...ids,id];localStorage.setItem("musicfy-favorites",JSON.stringify(next));renderAll();updateFavoriteButton()};

// PLAYLIST LOGIC (No backend required)
const getPlaylists = () => { try { return JSON.parse(localStorage.getItem("musicfy-playlists")||"[]") } catch { return [] }};
const savePlaylists = (p) => localStorage.setItem("musicfy-playlists", JSON.stringify(p));

function card(track,{artist=false, playlist=false}={}){
  const el=document.createElement("article");
  el.className="card"+(artist?" artist-card":"");
  el.innerHTML=`<img alt=""><div class="title"></div><div class="sub"></div>`;
  el.querySelector("img").src=playlist ? fallback : art(track);
  el.querySelector(".title").textContent=clean(artist?track.artist:(playlist?track.name:track.title));
  el.querySelector(".sub").textContent=artist?"Artist":(playlist?`${track.tracks.length} tracks`:track.artist||"Unknown artist");
  el.onclick=()=>artist?showArtist(track.artist):(playlist?showPlaylist(track):play(track, tracks));
  return el;
}

function trackRow(track, trackList){
  const row=document.createElement("article");
  row.className="track";
  const tNum = track.trackNumber ? `<span class="t-num">${track.trackNumber}</span>` : '';
  row.innerHTML=`
    ${tNum}
    <img alt="">
    <div class="meta"><strong></strong><small></small></div>
    <div class="track-actions" style="display:flex; align-items:center; gap:4px;">
      <button class="like" aria-label="Favorite"></button>
      <button class="track-options-btn" aria-label="More options">…</button>
    </div>
  `;
  row.querySelector("img").src=art(track);
  row.querySelector("strong").textContent=clean(track.title);
  row.querySelector("small").textContent=[track.artist,track.album,track.genre].filter(Boolean).join(" · ");
  
  const like=row.querySelector(".like");
  like.textContent=isFavorite(track)?"♥":"♡";
  like.classList.toggle("on",isFavorite(track));
  like.onclick=e=>{e.stopPropagation();toggleFavorite(track)};
  
  const optionsBtn=row.querySelector(".track-options-btn");
  optionsBtn.onclick=e=>{
    e.stopPropagation();
    openContextMenu(e,track);
  };

  row.onclick=()=>play(track, trackList);
  return row;
}

function openContextMenu(event, track) {
  document.querySelectorAll('.context-menu').forEach(m => m.remove());
  const menu = document.createElement("div");
  menu.className = "context-menu";
  menu.innerHTML = `
    <button id="cm-play-next">Play Next</button>
    <button id="cm-add-queue">Add to Queue</button>
    <button id="cm-add-playlist">Add to Playlist</button>
    <button id="cm-share">Share Link</button>
  `;
  menu.style.top = `${event.clientY}px`;
  menu.style.left = `${event.clientX - 150}px`;
  document.body.appendChild(menu);

  menu.querySelector("#cm-play-next").onclick = () => {
    queue.splice(current + 1, 0, track);
    alert("Added to play next");
    menu.remove();
  };
  
  menu.querySelector("#cm-add-queue").onclick = () => {
    queue.push(track);
    alert("Added to queue");
    menu.remove();
  };

  menu.querySelector("#cm-add-playlist").onclick = () => {
    let myPlaylists = getPlaylists();
    if (myPlaylists.length === 0) {
      alert("Create a playlist from the sidebar first!");
    } else {
      myPlaylists[0].tracks.push(track);
      savePlaylists(myPlaylists);
      alert(`Added to ${myPlaylists[0].name}`);
    }
    menu.remove();
  };

  menu.querySelector("#cm-share").onclick = () => {
    const shareUrl = `${window.location.origin}/#track/${track.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => alert("Link copied to clipboard!"));
    menu.remove();
  };

  document.addEventListener("click", () => menu.remove(), { once: true });
}

$("createPlaylistBtn").onclick = (e) => {
  e.preventDefault();
  const name = prompt("Name your new playlist:");
  if (name) {
    let myPlaylists = getPlaylists();
    myPlaylists.push({ id: Date.now().toString(), name: name, tracks: [] });
    savePlaylists(myPlaylists);
    renderAll();
    go("playlists");
  }
};

function fill(id,items,fn,listArg){const box=$(id);if(!box)return;box.replaceChildren();if(!items.length){box.innerHTML='<p class="empty">Nothing here yet.</p>';return}items.forEach(x=>box.append(fn(x, listArg)))}
function uniqueBy(key){return [...new Map(tracks.filter(t=>t[key]).map(t=>[t[key],t])).values()]}
function shuffle(list){return list.slice().sort(()=>Math.random()-.5)}

function renderHome(){
  const latest=tracks.slice(-10).reverse();
  fill("recentRow",latest,card);
  fill("heavyRotationRow", shuffle(tracks).slice(0, 5), card);
  fill("suggestionsRow", shuffle(tracks).slice(0, 5), card);
  fill("albumRow",uniqueBy("album"),t=>{const c=card({...t,title:t.album});c.onclick=()=>showAlbum(t.album);return c});
  fill("artistRow",uniqueBy("artist"),t=>card(t,{artist:true}));
  
  if(featured){
    $("heroTitle").textContent=clean(featured.title);
    $("heroArtist").textContent=featured.artist||"Unknown artist";
    $("heroArt").src=art(featured);
  }
}

function renderAll(){
  renderHome();
  fill("libraryList",tracks,trackRow,tracks);
  fill("albumsPage",uniqueBy("album"),t=>{const c=card({...t,title:t.album});c.onclick=()=>showAlbum(t.album);return c});
  fill("artistsPage",uniqueBy("artist"),t=>card(t,{artist:true}));
  fill("favoritesList",tracks.filter(isFavorite),trackRow,tracks.filter(isFavorite));
  fill("playlistsPage",getPlaylists(),t=>{const c=card(t,{playlist:true}); return c;});
}

function showPage(id){document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===id));document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.page===id));window.scrollTo(0,0)}
function go(route){location.hash=route}
function showAlbum(name){go(`album/${encodeURIComponent(name)}`)};
function showArtist(name){go(`artist/${encodeURIComponent(name)}`)};
function showPlaylist(p){go(`playlist/${p.id}`)};

function applyRoute(){
  const route=location.hash.replace(/^#\/?/,"")||"home",parts=route.split("/").filter(Boolean),kind=parts[0];
  
  if (kind === "recover-playlist") {
    const name = decodeURIComponent(parts[1]), ids = parts[2].split(',');
    const pTracks = tracks.filter(t => ids.includes(String(t.id)));
    let myPlaylists = getPlaylists();
    myPlaylists.push({ id: Date.now().toString(), name: name, tracks: pTracks });
    savePlaylists(myPlaylists);
    alert(`Recovered playlist "${name}"!`);
    go("playlists");
    renderAll();
    return;
  }

  if(kind==="artist"||kind==="album"){
    const name=decodeURIComponent(parts.slice(1).join("/"));
    const matches=tracks.filter(t=>kind==="artist"?t.artist===name:t.album===name);
    if(kind==="album") matches.sort((a,b)=>(a.trackNumber||0)-(b.trackNumber||0));
    $("detailEyebrow").textContent=kind.toUpperCase();
    $("detailTitle").textContent=name||"Collection";
    fill("detailList",matches,trackRow,matches);
    showPage("detail");
    return;
  }
  
  if (kind==="playlist") {
    const p = getPlaylists().find(x=>x.id===parts[1]);
    if(p) {
      $("detailEyebrow").textContent="PLAYLIST";
      $("detailTitle").innerHTML=`${p.name} <button onclick="sharePlaylist('${p.id}')" style="font-size:12px; margin-left:10px; cursor:pointer;">Share</button>`;
      fill("detailList",p.tracks,trackRow,p.tracks);
      showPage("detail");
      return;
    }
  }
  showPage(["home","library","albums","artists","playlists","favorites"].includes(kind)?kind:"home")
}

window.sharePlaylist = function(id) {
  const p = getPlaylists().find(x => x.id === id);
  if (!p) return;
  const trackIds = p.tracks.map(t => t.id).join(',');
  const url = `${window.location.origin}/#recover-playlist/${encodeURIComponent(p.name)}/${trackIds}`;
  navigator.clipboard.writeText(url).then(() => alert("Recoverable link copied to clipboard!"));
}

function play(track, trackList = null){
  if (trackList) queue = [...trackList];
  if (queue.length === 0) queue = [track];
  
  current=queue.findIndex(t=>String(t.id)===String(track.id));
  if(current<0) { queue.push(track); current=queue.length-1; }
  
  audio.src=track.url;
  audio.play().catch(()=>{});
  $("songTitle").textContent=clean(track.title);
  $("songArtist").textContent=track.artist||"Unknown artist";
  $("playerArt").src=art(track);
  $("playerArt").hidden=false;
  $("play").textContent="❚❚";
  updateFavoriteButton();

  // am-lyrics integration
  const amLyrics = $("amLyricsEl");
  if(amLyrics) {
    amLyrics.setAttribute("song-title", track.title || "");
    amLyrics.setAttribute("song-artist", track.artist || "");
    amLyrics.setAttribute("song-album", track.album || "");
  }
}

// Lyrics Sync Frame
function syncLyrics() {
  const amLyrics = $("amLyricsEl");
  if (amLyrics && !audio.paused) {
    amLyrics.currentTime = audio.currentTime * 1000;
  }
  animFrame = requestAnimationFrame(syncLyrics);
}

function updateFavoriteButton(){const t=queue[current],b=$("favorite");b.textContent=t&&isFavorite(t)?"♥":"♡";b.classList.toggle("on",Boolean(t&&isFavorite(t)))}
function next(delta){if(!queue.length)return;if(shuffleOn&&delta>0){let pick=Math.floor(Math.random()*queue.length);if(queue.length>1)while(pick===current)pick=Math.floor(Math.random()*queue.length);current=pick}else current=(current+delta+queue.length)%queue.length;play(queue[current])}

$("play").onclick=()=>{if(!queue.length&&tracks.length)play(featured||tracks[0],tracks);else if(audio.paused)audio.play().then(()=>$("play").textContent="❚❚");else audio.pause()};
$("previous").onclick=()=>next(-1);
$("next").onclick=()=>next(1);
$("shuffle").onclick=()=>{shuffleOn=!shuffleOn;$("shuffle").classList.toggle("on",shuffleOn)};
$("repeat").onclick=()=>{repeatOn=!repeatOn;$("repeat").classList.toggle("on",repeatOn)};
$("volume").oninput=e=>audio.volume=e.target.value/100;
$("heroPlay").onclick=()=>featured&&play(featured, tracks);
$("favorite").onclick=()=>queue[current]&&toggleFavorite(queue[current]);
$("fullscreenToggle").onclick=()=>$("playerEl").classList.toggle("fullscreen");

audio.onpause=()=>{ $("play").textContent="▶"; cancelAnimationFrame(animFrame); };
audio.onplay=()=>{ $("play").textContent="❚❚"; animFrame = requestAnimationFrame(syncLyrics); };
audio.onended=()=>repeatOn?audio.play():next(1);
audio.ontimeupdate=()=>{if(audio.duration){$("progress").value=audio.currentTime/audio.duration*100;$("currentTime").textContent=format(audio.currentTime)}};
audio.onloadedmetadata=()=>$("duration").textContent=format(audio.duration);
$("progress").oninput=e=>{if(audio.duration)audio.currentTime=audio.duration*e.target.value/100};
function format(s){if(!Number.isFinite(s))return"0:00";return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`}

document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>b.dataset.action==="search"?$("sidebarSearch").focus():go(b.dataset.page));
$("sidebarSearch").oninput=e=>{const q=e.target.value.toLowerCase().trim();fill("libraryList",tracks.filter(t=>[t.title,t.artist,t.album].some(v=>String(v||"").toLowerCase().includes(q))),trackRow,tracks);go("library")};

async function load(){
  try{
    const r=await fetch(`${API_URL}/api/library`);
    if(!r.ok)throw Error("Library unavailable");
    const data=await r.json();
    tracks=data.tracks||[];
    featured=tracks[Math.floor(Math.random()*tracks.length)]||null;
    renderAll();
    applyRoute()
  }catch(err){
    console.error(err);
    ["recentRow","heavyRotationRow","suggestionsRow","albumRow","artistRow","libraryList","albumsPage","artistsPage","playlistsPage","favoritesList","detailList"].forEach(id=>{if($(id))$(id).innerHTML='<p class="empty">Your library could not be loaded right now.</p>'});
    $("heroArtist").textContent="Try again in a moment."
  }
}
window.addEventListener("hashchange",applyRoute);if("serviceWorker"in navigator)navigator.serviceWorker.register("/service-worker.js").catch(()=>{});load();
