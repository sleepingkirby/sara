
function reportErr(error){
console.error('' + error.message);
}

function onError(item){
console.log("Error: " + error);
var notif=document.getElementsByClassName('notify')[0];

}

function doNothing(item, err){

}

//gets hostname from url
function hostFromURL(str){
var rtrn=str;
var proto=rtrn.match(/[a-z]+:\/\/+/g);
rtrn=rtrn.substr(proto[0].length,rtrn.length);

var end=rtrn.search('/');
  if(end>=0){
  rtrn=rtrn.substr(0,end);
  }

return rtrn;
}


/*--------------------------------------------------------------------
pre: none
post: fills select w/ "id" with options from arr,selected set to prf
inParam: element id, array to fill, option to be selected
fill out the select element
--------------------------------------------------------------------*/
function fillSlct(id, arr, prf){
  if(!id || id==""||typeof arr !="object" || Object.keys(arr) <= 0){
  return 0;
  }

  var tmp=null;
  var slct=document.getElementById(id);
  slct.textContent=null;
    for(let i of arr){
    tmp=document.createElement("option");
    tmp.innerText=i;
    tmp.value=i;
      if(i==prf){
      tmp.selected=true;
      }
    slct.appendChild(tmp);
    }
}


function startListen(){
  document.addEventListener("click", (e) => {
    switch(e.target.id){
      case 'settingsPage':
        chrome.runtime.openOptionsPage();     
      break;
      default:
      break;
    }
  });
  document.addEventListener("change", (e) => {
  var obj={};
    switch(e.target.type){
      default:
      break;
    }
  });
}

/*--------------------------------------
pre: hostFromUrl()
post: whatever cbFunc does
gets the host from the url of the current active tab
params:
lst=ignore list
cbFunc() Call back function
cbFuncPrms=should be an object
---------------------------------------*/
function getCurHost(fnc, fncPrms){
  chrome.tabs.query({active: true, currentWindow: true},(tabs) => {
  host=hostFromURL(tabs[0].url);

  fncPrms["host"]=host;
  fnc(fncPrms);
  });
}

//================================ main ==========================
var host=""

//variable checks
chrome.storage.local.get( null,(d) => {

getCurHost((e)=>{document.getElementById(e.id).textContent=e.host;}, {id:"dmn"});//fill div with domain

fillSlct("prflSlct", Object.keys(d.profiles),"alt"); 
startListen();
});


