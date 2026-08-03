"use strict";

/*
====================================
 MUSICFY FRONTEND
 GitHub Pages -> Railway API -> R2
====================================
*/


const API_URL =
"https://music-backend-production-10bd.up.railway.app";


let tracks = [];

let currentIndex = -1;



const $ = id =>
document.getElementById(id);



const audio =
$("audio");




/*
========================
 LOAD LIBRARY
========================
*/


async function loadLibrary(){

try{

const res =
await fetch(
`${API_URL}/api/library`
);


const data =
await res.json();


tracks =
data.tracks || [];


renderHome();

renderLibrary();


}

catch(err){

console.error(
"Library loading failed:",
err
);

}

}







/*
========================
 HOME
========================
*/


function renderHome(){


const recent =
$("recentRow");


recent.innerHTML="";



tracks
.slice()
.reverse()
.slice(0,10)
.forEach(track=>{


recent.appendChild(
createCard(track)
);


});



renderAlbums();

renderArtists();



if(tracks.length){


$("heroTitle").textContent =
tracks.at(-1).title;


$("heroArtist").textContent =
tracks.at(-1).artist;


}


}






function createCard(track){


const card =
document.createElement("div");


card.className =
"card";


card.innerHTML = `

<img src="${track.artwork || 'https://via.placeholder.com/300'}">

<div class="card-title">
${track.title}
</div>

<div class="card-sub">
${track.artist}
</div>

`;



card.onclick =
()=>playTrack(track);



return card;

}







function renderAlbums(){


const box =
$("albumRow");


box.innerHTML="";


const albums =
[...new Set(
tracks.map(t=>t.album)
)];


albums.forEach(album=>{


const track =
tracks.find(
t=>t.album===album
);


box.appendChild(
createCard({

...track,

title:album

})

);


});


}








function renderArtists(){


const box =
$("artistRow");


box.innerHTML="";


const artists =
[...new Set(
tracks.map(t=>t.artist)
)];


artists.forEach(artist=>{


const track =
tracks.find(
t=>t.artist===artist
);


box.appendChild(
createCard({

...track,

title:artist

})

);


});


}







/*
========================
 LIBRARY
========================
*/


function renderLibrary(list=tracks){


const box =
$("libraryList");


box.innerHTML="";



list.forEach(track=>{


const row =
document.createElement("div");


row.className =
"track";


row.innerHTML = `

<img src="${track.artwork || 'https://via.placeholder.com/100'}">

<div>

<strong>
${track.title}
</strong>

<br>

<span>
${track.artist}
</span>

</div>

`;



row.onclick =
()=>playTrack(track);


box.appendChild(row);


});


}








/*
========================
 PLAYER
========================
*/


function playTrack(track){


currentIndex =
tracks.findIndex(
x=>x.id===track.id
);



audio.src =
track.url;


audio.play();



$("songTitle").textContent =
track.title;


$("songArtist").textContent =
track.artist;


$("playerArt").src =
track.artwork ||
"https://via.placeholder.com/300";


$("play").textContent =
"⏸";


}






$("play").onclick=()=>{


if(audio.paused){

audio.play();

$("play").textContent="⏸";

}

else{

audio.pause();

$("play").textContent="▶";

}


};







$("progress").oninput=e=>{


audio.currentTime =
audio.duration *
(e.target.value/100);


};



audio.ontimeupdate=()=>{


if(audio.duration){

$("progress").value =
(audio.currentTime /
audio.duration)*100;

}


};







$("next").onclick=()=>{


currentIndex++;


if(currentIndex>=tracks.length)

currentIndex=0;



playTrack(
tracks[currentIndex]
);


};





$("previous").onclick=()=>{


currentIndex--;


if(currentIndex<0)

currentIndex =
tracks.length-1;



playTrack(
tracks[currentIndex]
);


};








/*
========================
 SEARCH
========================
*/


$("search").oninput=e=>{


const q =
e.target.value.toLowerCase();



renderLibrary(

tracks.filter(t=>

t.title.toLowerCase().includes(q)

||

t.artist.toLowerCase().includes(q)

||

t.album.toLowerCase().includes(q)

)

);


};









/*
========================
 NAVIGATION
========================
*/


document
.querySelectorAll(".nav-item")
.forEach(button=>{


button.onclick=()=>{


document
.querySelectorAll(".nav-item")
.forEach(
b=>b.classList.remove("active")
);


button.classList.add("active");



document
.querySelectorAll(".page")
.forEach(
p=>p.classList.remove("active")
);



$(button.dataset.page)
.classList.add("active");


};


});








/*
========================
 PWA SERVICE WORKER
========================
*/


if(
"serviceWorker" in navigator
){

navigator.serviceWorker.register(
"/service-worker.js"
)

.then(()=>{

console.log(
"Musicfy offline mode enabled"
);

})

.catch(err=>{

console.error(
"Service worker error:",
err
);

});


}





/*
========================
 START
========================
*/


loadLibrary();
