types:'use strict';

var applyLst={};
var ignrLst={};
var xhrLst={};
var evntLst={};
var conf={};

var eTypes={"abort": 1, "afterprint": 1, "animationend": 1, "animationiteration": 1, "animationstart": 1, "beforeprint": 1, "beforeunload": 1, "blur": 1, "canplay": 1, "canplaythrough": 1, "change": 1, "click": 1, "contextmenu": 1, "copy": 1, "cut": 1, "dblclick": 1, "drag": 1, "dragend": 1, "dragenter": 1, "dragleave": 1, "dragover": 1, "dragstart": 1, "drop": 1, "durationchange": 1, "ended": 1, "error": 1, "focus": 1, "focusin": 1, "focusout": 1, "fullscreenchange": 1, "fullscreenerror": 1, "hashchange": 1, "input": 1, "invalid": 1, "keydown": 1, "keypress": 1, "keyup": 1, "load": 1, "loadeddata": 1, "loadedmetadata": 1, "loadstart": 1, "message": 1, "mousedown": 1, "mouseenter": 1, "mouseleave": 1, "mousemove": 1, "mouseover": 1, "mouseout": 1, "mouseup": 1, "mousewheel": 1, "offline": 1, "online": 1, "open": 1, "pagehide": 1, "pageshow": 1, "paste": 1, "pause": 1, "play": 1, "playing": 1, "popstate": 1, "progress": 1, "ratechange": 1, "resize": 1, "reset": 1, "scroll": 1, "search": 1, "seeked": 1, "seeking": 1, "select": 1, "show": 1, "stalled": 1, "storage": 1, "submit": 1, "suspend": 1, "timeupdate": 1, "toggle": 1, "touchcancel": 1, "touchend": 1, "touchmove": 1, "touchstart": 1, "transitionend": 1, "unload": 1, "volumechange": 1, "waiting": 1, "wheel": 1};

var xTypes={"main_frame": 1, "sub_frame": 1, "stylesheet": 1, "script": 1, "image": 1, "font": 1, "object": 1, "xmlhttprequest": 1, "ping": 1, "csp_report": 1, "media": 1, "websocket": 1, "other": 1};


//validate Str
function validStr(str){
  if( str && (typeof str === 'string' || str instanceof String) && str!=""){
  return str;
  }
return "";
}

function strToBool(str){
  if(str.toLocaleLowerCase()=="true"){
    return true
  }
return false;
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


//parses pipe list 
function parsePipeList(str, cmp){
  if(!str || str==""){
  return {};
  }

var tmpLst= str.split("|");
var rtrn={};
  for(let v of tmpLst){
    if(cmp.hasOwnProperty(v)){
    rtrn[v]=1;
    }
  }
return rtrn;
}

function parseXHRList(str, msg=""){
console.log("PSJS: Caching Network List "+msg);
var rtrn=parsePipeList(str, xTypes);
return rtrn;
}

function parseEventList(str, msg=""){
console.log("PSJS: Caching Event List "+msg);
var rtrn=parsePipeList(str, eTypes);
return rtrn;
}


//puts ignore list into hash for easy search
function parseIgnoreList(str){
  if(!str || str==""){
  ignrLst={};
  return 1;
  }
console.log("PSJS: Caching Ignore List");
var tmpLst=str.split("\n");
  for(let v of tmpLst){
    ignrLst[v]=1;
  }
return 0;
}

//parses the string for applyLst in chrome.storage.local into a hash that's easily searchable
function parseApplyList(str){
  if(!str || str==""){
  return 1;
  }

console.log("PSJS: Parsing and caching custom apply list...");
var arr=str.trim().split("\n");
var tmpl=['applyLstDmn','applyLstEnbld', 'applyLstBrkJs', 'applyLstStpJs', 'applyLstEvnt', 'applyLstXHR', 'applyLstEvntCst', 'applyLstNtwrk'];
applyLst={};
 
  for(let ln of arr){
  var set=ln.split(",");
  var m=set.length;
  applyLst[set[0]]={};
  applyLst[set[0]][tmpl[1]]=strToBool(set[1]);
  applyLst[set[0]][tmpl[2]]=strToBool(set[2]);
  applyLst[set[0]][tmpl[3]]=strToBool(set[3]);
  applyLst[set[0]][tmpl[4]]=strToBool(set[4]);
  applyLst[set[0]][tmpl[5]]=strToBool(set[5]);
  applyLst[set[0]][tmpl[6]]={};
  applyLst[set[0]][tmpl[7]]={};

    if(set.length>=7){
    applyLst[set[0]][tmpl[6]]=parseEventList(set[6], "for apply list"); 
    }

    if(set.length>=8){
    applyLst[set[0]][tmpl[7]]=parseXHRList(set[7], "for apply list"); 
    }
  }
return 0;
}

