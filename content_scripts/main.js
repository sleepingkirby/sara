//loading external files and settings.
(function() {

/**
 * Check and set a global guard variable.
 * If this content script is injected into the same page again,
 * it will do nothing next time.
 */
if (window.hasRun) {
  return;
}
window.hasRun = true;


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

  /*----------------------
  pre: none
  post: none
  gets the attributes of an element and makes it into an obj
  ----------------------*/
  function elToObj(el){
  var rtrn={"tagName":"", "attr":{}};
  var arr=el.getAttributeNames();
  arr.forEach( (i,n)=>{rtrn.attr[i]=el.getAttribute(i);});
  rtrn["tagName"]=el.tagName.toLowerCase();
  return rtrn;
  }

  /*--------------------
  pre: everything above here
  post: everything modified as a result of running functions above here
  the main logic for what to do when a message comes in from the popup menu
  ---------------------*/
  function runOnMsg(request, sender, sendResponse){
    switch(request.action){
      case 'getEl':
      var obj=elToObj(onEl);
      sendResponse(JSON.stringify(obj));
      break;
      case 'sendInfo':
      var ta=document.createElement("textarea");
      ta.textContent=request.msg.val;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy', false, null);
      document.body.removeChild(ta);
      sendResponse(true);
      break;
      case 'saraUpgradeReload':
      console.log("Got message");
      location.reload();//reload page for all pages that has this content script AND the extension has reloaded
      break;
      default:
      sendResponse("clicked default");
      break;
    }
  }

  /*-------------------------
  pre: onEl exists, mouseover event passed down, elToObj()
  post: mouseover event listener addedi
  sends message current element as object to background script
  -------------------------*/
  function elObjToBG(e){
  onEl=e.path[0];
    try{
    chrome.runtime.sendMessage({'onEl':elToObj(e.path[0])});
    }
    catch(e){
      if(ignErr===null){
      ignErr=confirm("Hi, this is the extension \"SARA\". I've detected an error when trying to talk with another part of myself.\nThis is probably because I was upgraded, reloaded or removed. In order for me to run correctly, this page will have to be reloaded. \nClick \"OK\" to reload the page.\nClick \"Cancel\" to continue to work as it is. \n\n"+e);
      }
      if(ignErr){
      location.reload();
      }
      
    console.log(e);
    }
  }



//================================================= main code run ====================================================

var conf={};
var onEl;
var ignErr=null;

//set event so that right click will capture the element it's over
/* this doesn't work because context menu is render at the same time the code to update it is sent off.
as such, the contextmenu shown to the user is always one selection behind.
window.oncontextmenu=(e) => {
  onEl=e.path[0];
  chrome.runtime.sendMessage({'onEl':elToObj(e.path[0])});
};
*/
document.addEventListener("mouseover", elObjToBG);

chrome.storage.local.get(null, function(d){});


//get message from other parts
chrome.runtime.onMessage.addListener(runOnMsg);

})();
