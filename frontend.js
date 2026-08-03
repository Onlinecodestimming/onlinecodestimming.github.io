"use strict";


/*
====================================
 MUSICFY FRONTEND
 GitHub Pages -> Railway API -> R2
====================================
*/


const API_URL =
"https://music-backend-production-10bd.up.railway.app";


const ADMIN_KEY =
"moneyman";



let tracks = [];

let currentIndex = -1;

let favorites =
JSON.parse(
localStorage.getItem("favorites") || "[]"
);



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


try {


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

console.error(err);

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
tracks[tracks.length-1].title;


$("heroArtist").textContent =
tracks[tracks.length-1].artist;


}


}





/*
========================
 CARDS
========================
*/


function createCard(track){


const div =
document.createElement("div");


div.className =
"card";


div.innerHTML = `

<img src="${track.artwork || 'https://via.placeholder.com/300'}">

<div class="card-title">
${track.title}
</div>

<div class="card-sub">
${track.artist}
</div>

`;



div.onclick = () =>
playTrack(track);



return div;

}






/*
========================
 ALBUMS
========================
*/


function renderAlbums(){


const box =
$("albumRow");


box.innerHTML="";


const albums =
[...new Set(
tracks.map(
t=>t.album
)
)];


albums.forEach(album=>{


const track =
tracks.find(
t=>t.album===album
);


const card =
createCard({

...track,

title:album

});


box.appendChild(card);


});

}





/*
========================
 ARTISTS
========================
*/


function renderArtists(){


const box =
$("artistRow");


box.innerHTML="";


const artists =
[...new Set(
tracks.map(
t=>t.artist
)
)];


artists.forEach(name=>{


const track =
tracks.find(
t=>t.artist===name
);


box.appendChild(
createCard({

...track,

title:name

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


row.innerHTML=`

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



row.onclick=()=>playTrack(track);


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
t=>t.id===track.id
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






audio.ontimeupdate=()=>{


if(!audio.duration)
return;


$("progress").value =
(audio.currentTime /
audio.duration)*100;


};



$("progress").oninput=e=>{


audio.currentTime =
(e.target.value/100)
*
audio.duration;


};






/*
NEXT/PREVIOUS
*/


$("next").onclick=()=>{


if(!tracks.length)
return;


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


$("search")
.oninput=e=>{


const q =
e.target.value
.toLowerCase();



const result =
tracks.filter(t=>

t.title.toLowerCase().includes(q)

||

t.artist.toLowerCase().includes(q)

||

t.album.toLowerCase().includes(q)

);



renderLibrary(result);



};







/*
========================
 UPLOAD
========================
*/


$("uploadBtn").onclick =
async()=>{


const files =
$("fileInput").files;


if(!files.length)
return;



$("uploadStatus")
.textContent =
"Uploading...";



for(const file of files){


const form =
new FormData();


form.append(
"file",
file
);



form.append(
"artist",
$("artistInput").value
);



form.append(
"album",
$("albumInput").value
);



form.append(
"artwork",
$("artInput").value
);



await fetch(

`${API_URL}/upload`,

{

method:"POST",

headers:{

"X-Admin-Key":
ADMIN_KEY

},

body:form

}

);



}



$("uploadStatus")
.textContent =
"Done!";


loadLibrary();


};









/*
========================
 NAVIGATION
========================
*/


document
.querySelectorAll(".nav-item")
.forEach(btn=>{


btn.onclick=()=>{


document
.querySelectorAll(".nav-item")
.forEach(x=>
x.classList.remove("active")
);


btn.classList.add("active");



document
.querySelectorAll(".page")
.forEach(p=>
p.classList.remove("active")
);



$(btn.dataset.page)
.classList.add("active");


};


});








/*
========================
 START
========================
*/


loadLibrary();
