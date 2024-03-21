const cssDflt="./menu.css";
const cssLght="./menulight.css";

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

/*---------------------------------------------------------------------
pre: none 
post: updates browser.storage.local
function to set up listeners for events.
---------------------------------------------------------------------*/
function startListen(){
var act=null;
  document.addEventListener("click", (e) => {
  act=e.target.getAttribute("act");
    switch(e.target.id){
      case "clrMdId":
        browser.storage.local.get().then((d)=>{
        d.settings.clrMd=typeof d.settings.clrMd=="boolean"?!d.settings.clrMd:false;
        browser.storage.local.set(d);
        document.getElementById("cssPath").href=d.settings.clrMd?cssLght:cssDflt;
        }, onError);
      break;
      case 'settingsPage':
      browser.runtime.openOptionsPage();     
      break;
      case 'donate':
      browser.tabs.create({url: 'https://b3spage.sourceforge.io/index.html?sara'});
      break;
      case 'btnFllId':
      browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
        browser.tabs.sendMessage(tabs[0].id, {action: 'fillForm', msg:{val:document.getElementById("prflSlct").value}});
      });
      break;
      default:
      break;
    }
  });
  document.addEventListener("change", (e) => {
  var obj={};
  var prfl="";
  var dmn="";
  act=e.target.getAttribute("act");
    switch(act){
      case 'tglAtFll':
        browser.storage.local.get("settings").then((d)=>{
          d.settings.autoFill=document.getElementById("atFllId").checked;
          browser.storage.local.set(d);
        },onError);
      break;
      case 'tglAtFll':
        browser.storage.local.get("settings").then((d)=>{
          d.settings.autoFill=document.getElementById("atFllId").checked;
          browser.storage.local.set(d);
        },onError);
      break;
      case 'tglEvntFll':
        browser.storage.local.get("settings").then((d)=>{
          d.settings.eventFill=document.getElementById("evntFllId").checked;
          browser.storage.local.set(d);
        },onError);
      break;
      case "tglHvr":
        browser.storage.local.get("settings").then((d)=>{
        d.settings.hoverId=e.target.checked;
        browser.storage.local.set(d);
        },onError);
      break;
      //this is when the drop down in the popup for profiles is set.
      case 'setPgPrfl':
        browser.storage.local.get("settings").then((d)=>{
          browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
            //send message to page to set profile
            browser.tabs.sendMessage(tabs[0].id, {action: 'setPgPrfl', msg:{val:e.target.value}}).then((r)=>{
              if(r){
              d.settings.cur_profile=e.target.value;
              //send message to background to set the contextmenu for which profile to set up for user to paste from
              browser.runtime.sendMessage({'setPrfl':e.target.value});
              browser.storage.local.set(d);
              }
            });
          });
        },onError);
      break;
      case 'addDmnIgnr':
      dmn=document.getElementById("dmn");
        browser.storage.local.get("settings").then((d)=>{
          if(e.target.checked){
            if(d.settings.ignrLst.trim()==""){
            d.settings.ignrLst=dmn.textContent;
            }
            else{
            d.settings.ignrLst+="\n"+dmn.textContent;
            }
          browser.storage.local.set(d);
          }
          else{
            if(d.settings.ignrLst.indexOf("\n"+dmn.textContent)>=0){
            d.settings.ignrLst=d.settings.ignrLst.replace("\n"+dmn.textContent,"");
            browser.storage.local.set(d);
            }
            else if(d.settings.ignrLst.indexOf(dmn.textContent)>=0){
            d.settings.ignrLst=d.settings.ignrLst.replace(dmn.textContent,"").trim();
            browser.storage.local.set(d);
            }
          }
        });
      break;
      case 'addDmnApply':
      prfl=document.getElementById("prflSlct");
      dmn=document.getElementById("dmn");
        browser.storage.local.get("settings").then((d)=>{
        let aHsh=strToApplyLst(d.settings.applyLst);
          if(e.target.checked){
            if(d.settings.applyLst.trim()==""){
            d.settings.applyLst=dmn.textContent+"|"+prfl.value;
            }
            else{
            d.settings.applyLst+="\n"+dmn.textContent+"|"+prfl.value;
            }
          browser.storage.local.set(d);
          }
          else{
            if(!aHsh.hasOwnProperty(dmn.textContent)){
            return false;
            }
            if(d.settings.applyLst.indexOf("\n"+dmn.textContent+"|"+aHsh[dmn.textContent])>=0){
            d.settings.applyLst=d.settings.applyLst.replace("\n"+dmn.textContent+"|"+aHsh[dmn.textContent],"");
            browser.storage.local.set(d);
            }
            else if(d.settings.applyLst.indexOf(dmn.textContent+"|"+aHsh[dmn.textContent])>=0){
            d.settings.applyLst=d.settings.applyLst.replace(dmn.textContent+"|"+aHsh[dmn.textContent],"").trim();
            browser.storage.local.set(d);
            }
          }
        });
      break;
      case 'tglCurDef':
        browser.storage.local.get("settings").then((d)=>{
        d.settings.curDef=document.getElementById("curDefId").checked;
          if(!e.target.checked){
          d.settings.cur_profile=d.settings.def_profile;
          browser.runtime.sendMessage({'setPrfl':d.settings.def_profile});
          }
        browser.storage.local.set(d);
        });
      break;
      case 'fPnl':
          browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
            browser.tabs.sendMessage(tabs[0].id, {action: 'fPnlTgl', msg:{val:e.target.checked}});
          });
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
  browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
  
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
    //console.log("not strin?");
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
    if(mrk!=null){
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


function browserSendMsgErrHndl(action, tabs){
  if(browser.runtime.lastError){
  console.log("SARA: Received the following error: \n\n"+browser.runtime.lastError.message+"\n\nTrying to send a \""+action+"\" to\ntab: "+tabs[0].id+"\ntitled: \""+tabs[0].title+"\"\nurl: \""+tabs[0].url+"\"");
  }
}


//================================ main ==========================
var host=""
var ignrHsh={};
var applyHsh={};
var curPrfl=null;

//variable checks
browser.storage.local.get( null,(d) => {
  

var link=document.getElementById("cssPath");
link.href=d.settings.clrMd?cssLght:cssDflt;

var af=document.getElementById("atFllId");
af.checked=d.settings.autoFill;

var ef=document.getElementById("evntFllId");
ef.checked=d.settings.eventFill;

var hov=document.getElementById("hvrId");
hov.checked=d.settings.hoverId;

var hov=document.getElementById("fPnlId");
hov.checked=d.settings.floatPnl;

var curDef=document.getElementById("curDefId");
curDef.checked=d.settings.curDef;


//fill div with domain and the buttons that match
getCurHost(populDmn, {id:"dmn", ignrId:"dmnTypeIgnr", applyId:"dmnTypeApply", "d":d});


  //figure out what profile to have in the profiles drop down as well as fill the drop down. 
  browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {

  let h=hostFromURL(tabs[0].url);
  let aHsh=strToApplyLst(d.settings.applyLst);
    browser.tabs.sendMessage(tabs[0].id, {action: 'getPgPrfl', msg:{}}).then(function(e){
    browserSendMsgErrHndl("getPgPrfl", tabs);
    curPrfl=dtrmnPrfl(d.settings.cur_profile, d.settings.def_profile, h, aHsh, e, d.profiles, d.settings.curDef);

    fillSlct("prflSlct", Object.keys(d.profiles),curPrfl); 
    });
  });



startListen();
});
