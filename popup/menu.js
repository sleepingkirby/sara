
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

  var p=prf;
  if(typeof p !="string"){
  p=false;
  }

  var tmp=null;
  var slct=document.getElementById(id);
  slct.textContent=null;
    for(let i of arr){
    tmp=document.createElement("option");
    tmp.innerText=i;
    tmp.value=i;
      if(p && i==p){
      tmp.selected=true;
      }
    slct.appendChild(tmp);
    }
}


function startListen(){
var act=null;
  document.addEventListener("click", (e) => {
  act=e.target.getAttribute("act");
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
      case 'setPgPrfl':
        chrome.storage.local.get(null, (d)=>{
          chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, {action: 'setPgPrfl', msg:{val:e.target.value}});
          });
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
    if(typeof str !="string"){
    console.log("not strin?");
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
    if(typeof str !="string"){
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


  /*---------------------------------------------------
  pre:
  post:
  returns which profile to use. this version is for 
  popup only.

  all actions by right click menu or popup menu needs to send the current/proper profile to the content script
  ---------------------------------------------------*/
  function dtrmnPrfl(cur, def, hst, hsh, mrk, prfls, curDef){

    //if no profiles exist,do nothing. Nothing can be done.
    if(Object.keys(hsh).length<=0 || Object.keys(prfls).length<=0){
    return false;
    }
    
    var curPrfl=null;

    //else if applist domain profile marker exists and host in applyList, use cur,
    if(mrk==true){
    curPrfl=cur;
    }
    //else if applylist domain profile marker doesn't exist but host in applyList, user applist prof.
    else if(hsh.hasOwnProperty(hst)){
    curPrfl=hsh[hst];
    }
    //all other conditions, use current or default based on choice
    else{
    curPrfl=curDef?cur:def;
    }


    //the below does sanity checks. Makes sure the profile actually exists.And, if it doesn't tries to find the best alternative
    //if current profile (which can the default profile) doesn't exist, use the default profile
    if(!prfls.hasOwnProperty(curPrfl)){
    curPrfl=def;
    }

    //if the default profile doesn't exist, get the first available profile.
    if(!prfls.hasOwnProperty(curPrfl)){
    curPrfl=Object.keys(prfls[0]);
    }


  return curPrfl;
  }



//================================ main ==========================
var host=""
var ignrHsh={};
var applyHsh={};
var curPrfl=null;

//variable checks
chrome.storage.local.get( null,(d) => {
  


var af=document.getElementById("atFllId");
af.checked=d.settings.autoFill;

var hov=document.getElementById("hvrId");
hov.checked=d.settings.hoverId;

//fill div with domain and the buttons that match
getCurHost(populDmn, {id:"dmn", ignrId:"dmnTypeIgnr", applyId:"dmnTypeApply", "d":d});

/*
there are 3 selected profile possibilities and a marker. applylist domain profile marker,  current profile, default profile and applylist domain profile.
if no profiles exist,do nothing. Nothing can be done.
else if applist domain profile marker exists for domain, use that,
else if current profile exists as profile, use that,
else if default profile exist, use that
else, no profile selected, pick first one.

all actions by right click menu or popup menu needs to send the current/proper profile to the content script
*/
  chrome.tabs.query({active: true, currentWindow: true},(tabs) => {
  
  let h=hostFromURL(tabs[0].url);
  let aHsh=strToApplyLst(d.settings.applyLst);
  
    chrome.tabs.sendMessage(tabs[0].id, {action: 'getPgPrfl', msg:{}}, function(e){
    curPrfl=dtrmnPrfl(d.settings.cur_profile, d.settings.def_profile, h, aHsh, e, d.profiles, d.settings.curDef);
    console.log(e);
    console.log(curPrfl);

    fillSlct("prflSlct", Object.keys(d.profiles),curPrfl); 
    });
  });


startListen();
});
