//loading external files and settings.
(function() {

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


  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;

  var onEl;

  window.oncontextmenu=(e) => {onEl=e.path[0];};
  

  
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
      case 'getEl':
      console.log(request.action);
      console.log("=====>");
      console.log(onEl);
      sendResponse("Message Received");
      break;
      default:
      break;
    }
  }



//================================================= main code run ====================================================
var conf={};

chrome.storage.local.get(null, function(d){

});


//get message from other parts
chrome.runtime.onMessage.addListener(runOnMsg);

})();
