
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
  }
  else{
  }
});


chrome.contextMenus.removeAll();
chrome.contextMenus.create({
      id: "root",
      title: "SARA",
      contexts: ["all"]
});
chrome.contextMenus.create({
      id: "paste",
      title: "Paste",
      contexts: ["all"],
      parentId: "root"
});
chrome.contextMenus.create({
      id: "info",
      title: "Info",
      contexts: ["all"],
      parentId: "root"
});
chrome.contextMenus.create({
      id: "clip",
      title: "To Clipboard",
      contexts: ["all"],
      parentId: "root"
});
chrome.contextMenus.create({
      id: "lvl1",
      title: "level1",
      contexts: ["all"],
      parentId: "paste"
});


chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {          
  if (changeInfo.status == 'complete') {   
    chrome.contextMenus.onClicked.addListener(function(info, tabs) {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
      chrome.tabs.sendMessage(tabs[0].id, {action: "getEl"}, function(response) { console.log("======bg===>>"); console.log(response);});  
      });
    });
  }
});


//listen to changes on applyLst reparse if changes exist
//chrome.storage.onChanged.addListener(function(c,n){
//});


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

