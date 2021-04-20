
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
          title: "Copy Value",
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
var curEl=null;
mkCntxtMnu();

//making a rule here. profiles and meta depth should not exceed double digits
/*
why have profiles and a meta data for profiles and not just one large structure?
Because having it with a large structure with all that extra data (categories, for example)
 would increase the amount of work via tree traversal when parsing through the pages. This way
I can just grab the element's name (or other attributes) and apply to the top tier of 
the profiles tree. And if none of those matches, we're done. I wouldn't have to traverse 
down each categories, find the node, get the value and then see if it matches. Upfront 
complexity for long term efficiency... hopefully. I haven't done the math/Big O on each 
case yet
*/
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
        },
        "alt":{
          gmail:{
          prsnl_gmail: "",
          prof_gmail:"",
          hotmail:""
          }
        }
      },
      profile_meta:{ 
        "default":{
        0:{"ord":[1, 2, 3, 4], "hash":{"stat":1, "exp":2, "references":3, "others":4}, "nm":"root"},
        1:{"nm":"stat", "ord":[5, 6, 7, 8, 9, 10, 11, 12, 13],"hash":{"name":5, "addr":6, "city":7,"state":8, "province":9,"zip":10,"postal":11, "mail":12, "phone":13}},
        2:{"nm":"exp","ord":[21],"hash":{"job":21}},
        4:{"nm":"others","ord":[27],"hash":{"covers":27}},
        5:{"nm":"name","ord":[14, 15, 16],"hash":{"last":14,"first":15,"m":16}},
        6:{"nm":"addr","ord":[17,18],"hash":{"1":17, "2":18}},
        13:{"nm":"phone","ord":[19,20],"hash":{"cell":19,"home":20}},
        21:{"nm":"job","ord":[22,23],"hash":{"1":22,"2":23}},
        3:{"nm":"references","ord":[24],"hash":{"ref":24}},
        24:{"nm":"ref","ord":[25,26],"hash":{"1":25,"2":26}},
        27:{"nm":"covers","ord":[28],"hash":{"1":28}},
        7:{"nm":"city","ord":[], "hash":{}},
        8:{"nm":"state","ord":[], "hash":{}},
        9:{"nm":"province","ord":[], "hash":{}},
        10:{"nm":"zip","ord":[], "hash":{}},
        11:{"nm":"postal","ord":[], "hash":{}},
        12:{"nm":"mail","ord":[], "hash":{}},
        14:{"nm":"last","ord":[], "hash":{}},
        15:{"nm":"first","ord":[], "hash":{}},
        16:{"nm":"m","ord":[], "hash":{}},
        17:{"nm":"1","ord":[], "hash":{}},
        18:{"nm":"2","ord":[], "hash":{}},
        19:{"nm":"cell","ord":[], "hash":{}},
        20:{"nm":"home","ord":[], "hash":{}},
        22:{"nm":"1","ord":[], "hash":{}},
        23:{"nm":"2","ord":[], "hash":{}},
        25:{"nm":"1","ord":[], "hash":{}},
        26:{"nm":"2","ord":[], "hash":{}},
        28:{"nm":"1","ord":[], "hash":{}},
        last:28
        },
        "alt":{
        0:{"nm":"root","ord":[1],"hash":{"mail":1}},
        1:{"nm":"mail","ord":[5],"hash":{"gmail":5}},
        5:{"nm":"gmail","ord":[2,3,4],"hash":{"prsnl_gmail":2, "prof_gmail":3, "hotmail":4}},
        2:{"nm":"prsnl_gmail","ord":[],"hash":{}},
        3:{"nm":"prof_gmail","ord":[],"hash":{}},
        4:{"nm":"hotmail","ord":[],"hash":{}},
        last:5
        }
      },
      settings:{
      autoFill: false,
      hoverId: false,
      def_profile: "default",
      cur_profile: "default",
      curDef: false,
      applyLst: "",
      ignrLst: ""
      }
    };
    chrome.storage.local.set(ind,(e)=>{});
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
        else{
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
          chrome.tabs.sendMessage(tabs[0].id, {action: "default"}, function(response) { console.log("======bg===>>"); console.log(info); console.log(response);});
          
          });
        }
        
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

