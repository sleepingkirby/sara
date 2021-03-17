//loading external files and settings.
(function() {

/*-------------------------------------------------- from common.js ---------------------------------------------------*/
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
/*-------------------------------------------------- from common.js ---------------------------------------------------*/



  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;

  

  
  /*--------------------------
  pre: none
  post: none
  new fangled wait function 
  https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
  ---------------------------*/
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  /*-----------------------
  pre: pageDone()
  post: none
  runs pageDone after "secs" amount of time
  -----------------------*/
  async function delayRun(secs=6500) {
    await sleep(secs);
    pageDone();
  }

  /*--------------------
  pre: everything above here
  post: everything modified as a result of running functions above here
  the main logic for what to do when a message comes in from the popup menu
  ---------------------*/
  function runOnMsg(request, sender, sendResponse){
    switch(request.action){
      default:
      break;
    }
  }


/*------------------------------------------------ 
pre: validStr
post: breaks javascript
No, really, this functions just runs broken 
javascript code. This is the *nuclear* option for
pages that are really smart about running their 
javascript code.
------------------------------------------------*/
function breakJs(str){
var msg=validStr(str);

console.log("PSJS: Breaking javascript as requested "+msg);

var injectedCode = '(' + function() {
rasdfasdfasdfasdfasdfasdfasdfeqwer();
} + ')();';
var s = document.createElement('script');
s.textContent = injectedCode;
(document.head || document.documentElement).appendChild(s);

}

/*------------------------------------------------ 
pre: none
post: throws error
attempts to stop all JS by throwing an error. 
Should do the trick most of the time. If it doesn't...
that's what breakJs() is for.
param: str to append to message.
------------------------------------------------*/
function stopJs(str){
var msg=validStr(str);
 
console.log("PSJS: Gracefully stopping all JS as requested. "+msg);
var injectedCode = '(' + function() {
throw new Error("PSJS: Gracefully stopping all JS. ");
} + ')();';
var s = document.createElement('script');
s.textContent = injectedCode;
(document.head || document.documentElement).appendChild(s);

}

/*------------------------------------------------ 
pre: none
post: assigns null function to addEventListener
assigns null function addEventListener function
to prevent any new eventlisteners from being added
------------------------------------------------*/
function preventEventListener(str){
var msg=validStr(str);

//window.addEventListener('contextmenu',function(e){e.stopPropagation();}, true);
//window.addEventListener=function(){}; //assigns a null function to event listener, stopping it to assign any new eventListener 

console.log("PSJS: Preventing all event listeners from running "+msg);
var injectedCode = '(' + function() {
  EventTarget.prototype.addEventListener=function(type,listener){
  console.log("PSJS: An attempt to add event listener of type: \""+type+"\", with listener: \""+listener+"\"");
  }
} + ')();';

var s = document.createElement('script');
s.textContent = injectedCode;
(document.head || document.documentElement).appendChild(s);
s.parentNode.removeChild(s);

}

/*------------------------------------------------ 
pre: none
post: assigns null function to xhr's send function
assigns null function send function
to prevent any new send from being added
------------------------------------------------*/
function preventXHRListener(str){
var msg=validStr(str);

console.log("PSJS: Preventing all AJAX listeners from running "+msg);
var injectedCode = '(' + function() {
  XMLHttpRequest.prototype.send = function(v) {
  console.log("PSJS: An attempt to send an AJAX call was made with value: \""+v+"\". And object:");
  console.log(this);
  }
} + ')();';

var s = document.createElement('script');
s.textContent = injectedCode;
(document.head || document.documentElement).appendChild(s);
s.parentNode.removeChild(s);

}

/*------------------------------------------------ 
pre: evntLst (list of type types to stop, from common.js) 
post: adds stopPropagation() to the listener of each type
goes through evntLst and assigns a stopPropagation() to each
type 
------------------------------------------------*/
function stopEventListeners(obj, str){
var msg=validStr(str);

console.log("PSJS: Starting event prevention on selected event types "+msg);
  if(typeof obj !== 'object' || obj === null){
  console.log("PSJS: Event list "+msg+"is empty or not an object. Quitting.");
  }

var k=Object.keys(obj);
  if(k.length<=0){
  console.log("PSJS: List of events types "+msg+"is empty. Doing nothing");
  return 1;
  }

  for(let t of k){
  console.log("PSJS: Stopping Event on type \""+t+"\"" + msg);
  window.addEventListener(t,function(e){e.stopPropagation();e.stopImmediatePropagation();}, true);
  }

}


//================================================= main code run ====================================================
var conf={};

chrome.storage.local.get(null, function(d){
console.log("PSJS: Starting...");

  if(!d.on){
  console.log("PSJS: Extension is turned off... Doing nothing.");
  return 0;
  }

  //setting up conf and hash
  parseApplyList(d.applyLst);//caching applyLst into easily findable hash
  parseIgnoreList(d.ignrLst);//caching applyLst into easily findable hash
  xhrLst=parseXHRList(d.xhrLst);//caching applyLst into easily findable hash
  evntLst=parseEventList(d.evntLst);//caching applyLst into easily findable hash
  var host=window.location.host;

  //-----global setting application-----
  if(!ignrLst.hasOwnProperty(host)){
    //breaking javascript
    if(d.breakJs){
    breakJs();
    }

    // stopping javascript
    if(d.stopJs){
    stopJs();
    }
    
    // preventing event listeners
    if(d.prvntEvnt){
    preventEventListener();
    }

    //prevent XHR's send function
    if(d.prvntXhr){
    preventXHRListener();
    }
    
    if(d.evntLstBool){
    stopEventListeners(evntLst);
    }

    //xhrLstBool/xhrLst handled in background.js

  }
  else{
  console.log("PSJS: Host name on ignore list: "+host);
  }

  //-----apply list-----


  /*
{www.youtube.com: {…}}
www.youtube.com:
applyLstBrkJs: "true"
applyLstEnbld: "true"
applyLstEvnt: "true"
applyLstEvntCst:
contextmenu: 1
scroll: 1
__proto__: Object
applyLstNtwrk:
ping: 1
xmlhttprequest: 1
__proto__: Object
applyLstStpJs: "true"
applyLstXHR: "true"
  */
  if(applyLst.hasOwnProperty(host) && applyLst[host].applyLstEnbld){
  console.log("PSJS: Domain \""+host+"\" in apply list. Applying custom settings.");
  //breakjs
    if(applyLst[host].applyLstBrkJs){
    breakJs("for apply list on domain: "+host);
    }

    // stopping javascript
    if(applyLst[host].applyLstStpJs){
    stopJs("for apply list on domain: "+host);
    }

    // preventing all event listeners
    if(applyLst[host].applyLstEvnt){
    preventEventListener("for apply list on domain: "+host);
    }

    //prevent XHR's send function
    if(applyLst[host].applyLstXHR){
    preventXHRListener("for apply list on domain: "+host);
    }


    if(Object.keys(applyLst[host].applyLstEvntCst).length > 0){
    stopEventListeners(applyLst[host].applyLstEvntCst, "for apply list on domain: \""+host+"\"");
    }
  }


});


chrome.runtime.onMessage.addListener(runOnMsg);
})();




