
function mkCntxtMnu(func){
  chrome.contextMenus.removeAll(
  () => {
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
          id: "clip",
          title: "To Clipboard",
          contexts: ["all"],
          parentId: "root"
    });
    chrome.contextMenus.create({
          id: "info",
          title: "Element: none",
          contexts: ["all"],
          parentId: "root"
    },func);
  });
}

//======================== functional code =============================

var cntxtCch={};//cache for the context menu id's
mkCntxtMnu();

chrome.storage.local.get(null,(d)=>{
  if(Object.keys(d).length <= 0){
    var ind={
      profiles: {
        "default":{
          name:{
          last: "",
          first: "",
          m: ""
          },
          addr:{
          1:"",
          2:""
          },
        city: "",
        state: "",
        province: "",
        zip: "",
        postal: "",
        mail: "",
          phone: {
          cell: "",
          home: ""
          },
          job:{
          1:"",
          2:""
          },
          ref:{
          1: "",
          2: ""
          },
          covers:{
          1:""
          }
        }
      },
      profile_meta:{
        "default":{
        root:["stat", "exp", "references", "others"],
        stat:["name","addr", "city", "state", "province", "zip", "postal", "mail", "phone"],
        exp:["job"],
        others:["covers"],
        name:["last", "first", "m"],
        addr:["1", "2"],
        phone:["cell","home"],
        "job":["1","2"],
        "references":["ref"],
        "ref":["1","2"],
        covers:["1"]
        }
      },
      settings:{
      autofill: false,
      hoverId: false
      }
    };
    chrome.storage.local.set(ind,(e)=>{console.log(e);});
  }
});



chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });

//listener for contentScript
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if(msg.hasOwnProperty('bdgNm')) {
    chrome.browserAction.setBadgeText({text: msg.bdgNm});
  }
  else if(msg.hasOwnProperty('onEl') && msg.onEl.hasOwnProperty('tagName') && msg.onEl.hasOwnProperty('attr')){
  var arr=Object.keys(msg.onEl.attr);
    //change the menu item title
    chrome.contextMenus.update("info",{
      title: "Copy Element Attr: "+msg.onEl.tagName
    });
    
    //removes previous entry
    var ids=Object.keys(cntxtCch);
    var tmp=ids.shift();
      while(tmp){
      chrome.contextMenus.remove(tmp);
      tmp=ids.shift();
      }
    cntxtCch={};
    //populates the context menu
    arr.forEach((val, i) => {
    cntxtCch["info-"+val]={"val":msg.onEl.attr[val], "attr":val};
        chrome.contextMenus.create({
        id: "info-"+val,
        title: val+": \""+msg.onEl.attr[val]+"\"",
        contexts: ["all"],
        parentId: "info"
        });
    });
  }
});


//initializing the extension settings if no settings exists
chrome.storage.local.get(null, (d) => {
  if(Object.keys(d).length <= 0){
  }
  else{
  }
});


chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {          
  if (changeInfo.status == 'complete') {   
    //adds listeners for the right click/context menu so we know what to do if something is clicked
    chrome.contextMenus.onClicked.addListener(function(info, tabs) {
        // if info.menuItemId starts with "info-", the action is to copy the data into the clipboard
        if(info.menuItemId.substr(0,5) == "info-"){
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
          chrome.tabs.sendMessage(tabs[0].id, {action: "sendInfo", msg:{attr:cntxtCch[info.menuItemId].attr,val:cntxtCch[info.menuItemId].val}});  
          });
        }
        /*
        else if(){
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
          chrome.tabs.sendMessage(tabs[0].id, {action: "paste"}, function(response) { console.log("======bg===>>"); console.log(response);});  
          });
        }
        */
    });
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

