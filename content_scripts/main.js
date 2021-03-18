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
  function elAttrToObj(el){
  var rtrn={};
  var arr=el.getAttributeNames();
  arr.forEach( (i,n)=>{rtrn[i]=el.getAttribute(i);});
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
      var obj=elAttrToObj(onEl);
      console.log(JSON.stringify(obj));
      sendResponse(JSON.stringify(obj));
      break;
      default:
      break;
    }
  }



//================================================= main code run ====================================================
var conf={};
var onEl;

//set event so that right click will capture the element it's over
window.oncontextmenu=(e) => {onEl=e.path[0];};


chrome.storage.local.get(null, function(d){
});


//get message from other parts
chrome.runtime.onMessage.addListener(runOnMsg);

})();
