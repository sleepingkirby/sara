
//============================== main code ran ====================================

chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });


//listener for contentScript
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if(msg.hasOwnProperty('bdgNm')) {
    chrome.browserAction.setBadgeText({text: msg.bdgNm});
  }
});

//initializing the extension settings if no settings exists
chrome.storage.local.get(null, (d) => {
  if(Object.keys(d).length <= 0){
  var obj={"applyLst": "","breakJs": false,"evntLst": "contextmenu","evntLstBool": true,"ignrLst": "","on": true,"prvntEvnt": false,"prvntXhr": false,"stopJs": false,"xhrLst": "","xhrLstBool": false};
    chrome.storage.local.set(obj,(e)=>{
    console.log("PSJS: No settings found for extension. Initializing settings.");
    conf=obj;
    //the 2 functions below *should* run, if it were not for the fact that we 100% know both ingrLst and applyLst is empty; If the default ever changes, we can uncomment these
    //parseApplyList(obj.applyLst);
    //parseIgnoreList(obj.ignrLst);
    //xhrLst=parseXHRList(obj.xhrLst);
    //evntList=parseEventList(obj.evntLst);
    });
  }
  else{
  //doing this twice as there's no telling that the previouvs set will happen before this runs
  parseApplyList(d.applyLst);//caching applyLst into easily findable hash
  parseIgnoreList(d.ignrLst);//caching applyLst into easily findable hash
  xhrLst=parseXHRList(d.xhrLst);//caching applyLst into easily findable hash
  evntLst=parseEventList(d.evntLst);//caching applyLst into easily findable hash
  conf=d;
  }
});


//listen to changes on applyLst reparse if changes exist
chrome.storage.onChanged.addListener(function(c,n){
  if(n=="local"){
    if(c.hasOwnProperty("applyLst")){
    parseApplyList(c.applyLst.newValue);
    }
    if(c.hasOwnProperty("ignrLst")){
    parseIgnoreList(c.ignrLst.newValue);
    }
    if(c.hasOwnProperty("xhrLst")){
    xhrLst=parseXHRList(c.xhrLst.newValue);
    }
    if(c.hasOwnProperty("evntLst")){
    evntLst=parseEventList(c.evntLst.newValue);
    }
    var arr=Object.keys(c);
    for(let i of arr){
    conf[i]=c[i].newValue;
    }
  }

});


chrome.runtime.onInstalled.addListener(function() {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {urlMatches: '(http|https|file):/+[a-z]*'},
      })],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});

