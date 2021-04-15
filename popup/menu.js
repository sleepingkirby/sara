
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
var proto=rtrn.match(/^[a-z]+:\/\/+/g);
  if(proto==null){
  return false;
  }
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
var act=null;
  document.addEventListener("click", (e) => {
    switch(e.target.id){
      case 'settingsPage':
        chrome.runtime.openOptionsPage();     
      break;
      default:

      //console.log(e.target);
      break;
    }
  });
  document.addEventListener("change", (e) => {
  var obj={};
  act=e.target.getAttribute("act");
    switch(act){
      case "tglHvr":
        chrome.storage.local.get({"settings":null},(d)=>{
        d.settings.hoverId=e.target.checked;
        chrome.storage.local.set(d);
        });
      break;
      default:
      console.log(e.target);
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
    if(host==false){
    host="Domain Not Applicable";
    }

  fncPrms["host"]=host;
  fnc(fncPrms);
  });
}

  function strToHsh(str){
    if(typeof str !="string" || str=="" ||!str){
    return null;
    }
  var s=str;
  var arr=s.trim().split("\n");
  var rtrn={};
  var max=arr.length;
    for(let i=0; i<max; i++){
    rtrn[arr[i]]=true;
    }
  return rtrn;
  }


  //convert string to Apply List object
  function strToApplyLst(str){
    if(typeof str !="string" || str=="" ||!str){
    return null;
    }
  var s=str;
  var arr=s.trim().split("\n");
  var rtrn={};
  var max=arr.length;
    for(let i=0; i<max; i++){
    let pos=arr[i].indexOf("|");
    rtrn[arr[i].substr(0,pos)]=arr[i].substr(pos+1);
    }
  return rtrn;
  }

  //populates domain div as well as the "buttons" to say if it's in the ignore or apply list
  function populDmn(ps){
  document.getElementById(ps.id).textContent=ps.host;
  ignrHsh=strToHsh(ps.d.settings.ignrLst);
  applyHsh=strToApplyLst(ps.d.settings.applyLst);
    if(ignrHsh.hasOwnProperty(ps.host)){
    document.getElementById(ps.ignrId).checked=true; 
    }
    if(applyHsh.hasOwnProperty(ps.host)){
    document.getElementById(ps.applyId).checked=true; 
    }

  }

//================================ main ==========================
var host=""
var ignrHsh={};
var applyHsh={};

//variable checks
chrome.storage.local.get( null,(d) => {

var af=document.getElementById("atFllId");
af.checked=d.settings.autoFill;

var hov=document.getElementById("hvrId");
hov.checked=d.settings.hoverId;

//fill div with domain and the buttons that match
getCurHost(populDmn, {id:"dmn", ignrId:"dmnTypeIgnr", applyId:"dmnTypeApply", d:d});


/*
there are 4 selected profile possibilities. page selected profile, current profile, default profile and applylist domain profile.
if there is a page selected profile, use that.
else if applist domain profile exists for domain, use that,
else if current profile exists as profile, use that,
else use default profile.

*/

fillSlct("prflSlct", Object.keys(d.profiles),d.settings.def_profile); 
startListen();
});
