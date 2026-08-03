"use strict";


const API_URL =
"https://music-backend-production-10bd.up.railway.app";



const $ =
(id)=>document.getElementById(id);





$("uploadBtn").onclick = async()=>{


const files =
$("fileInput").files;


const key =
$("adminKey").value.trim();



if(!files.length){

$("status").textContent =
"Select at least one file.";

return;

}



if(!key){

$("status").textContent =
"Enter admin key.";

return;

}



$("status").textContent =
"Uploading...";



try {


for(const file of files){


const form =
new FormData();



form.append(
"file",
file
);



form.append(
"title",
$("title").value
);



form.append(
"artist",
$("artist").value
);



form.append(
"album",
$("album").value
);



form.append(
"artwork",
$("artwork").value
);





const response =
await fetch(

`${API_URL}/upload`,

{

method:"POST",

headers:{

"X-Admin-Key": key

},

body:form

}

);





const data =
await response.json();



if(!response.ok){

throw new Error(
data.error ||
"Upload failed"
);

}


}




$("status").textContent =
"✅ Upload complete!";



}

catch(error){


console.error(error);


$("status").textContent =
"❌ " + error.message;


}



};
