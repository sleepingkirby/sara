
function mkCntxtMnu(func){
  browser.menus.removeAll().then(
  () => {
    browser.menus.create({
          id: "root",
          title: "SARA",
          contexts: ["all"]
    });
    browser.menus.create({
          id: "paste",
          title: "Paste",
          contexts: ["all"],
          parentId: "root"
    });
    browser.menus.create({
          id: "clip",
          title: "Copy Field to Clipboard",
          contexts: ["all"],
          parentId: "root"
    });
    browser.menus.create({
          id: "info",
          title: "Element: none",
          contexts: ["all"],
          parentId: "root"
    });
  });
}

//generates id path from prtnIdHsh from mkPstCntxtMnu()
function genHshPth(prfl, obj, num){
  if(typeof obj!="object"){
  return "";
  }

let n=num;
let hd="paste";
let tkn='-';
let tkn2='|';
let tk='';
var rtrn="";
 
  while(obj.hasOwnProperty(n)){
  n=obj[n];
    if(n==0){
    rtrn=hd+tkn+rtrn;
    }
    else{
    rtrn=n+tkn+rtrn;
    }

  }
  rtrn=rtrn+num;

    if(rtrn==0){
    return hd;
    }
return rtrn+tkn2+prfl;
}

/*---------------------------------------
pre: genHshPth, profile_meta existing, profile name, cntxtMnuCchPst (caching variable for these context menu items)
post: cntxtMnuCchPst is updated
generate context menu via profile name and filles out the cache variable cntxtMnuCchPst
---------------------------------------*/
function mkPstCntxtMnu(prfl){
  if(typeof prfl !="string" || !prfl || prfl==""){
  return null;
  }
  browser.storage.local.get(["profile_meta"]).then((d)=>{
    var p=d.profile_meta[prfl];
    var buff=[0];
    var prntIdHsh={};
    var pos=0;
    var defPrnt="paste";

    while(buff.length>0){
    pos=buff.shift();
    //console.log("=============>>"+pos);
    //prntIdHsh.hasOwnProperty(pos)?console.log("my parent: "+genHshPth(prfl,prntIdHsh,prntIdHsh[pos])):console.log("no parent");

      //if not root, make menu
      if(pos!=0){
      //console.log("my id:"+genHshPth(prfl,prntIdHsh,pos));
        let id=genHshPth(prfl,prntIdHsh,pos);
        let prnt=genHshPth(prfl,prntIdHsh,prntIdHsh[pos])
        browser.menus.create({
        id: id,
        title: p[pos].nm,
        contexts: ["all"],
        parentId: prnt
        },
        (e)=>{
          if(browser.runtime.lastError){
          console.log("SARA: Unable to generate context menu for paste-* on profile "+prfl+". Error: "+browser.runtime.lastError.message);
          }
        });
        //console.log("pusing into cntxtCchPst[] id:"+id);
        cntxtCchPst.unshift(id);
      }

      //add to prntIdHsh as well add to buffer.
      let max=p[pos].ord.length-1;
      if(max>=0){
        for(let i=max; i>=0;i--){
        prntIdHsh[p[pos].ord[i]]=pos;
        //console.log(p[pos].ord[i]+"-->"+pos);
        buff.unshift(p[pos].ord[i]);
        }
      }
    }
    
    browser.menus.update("paste",{
      title: "Paste from profile: "+prfl
    });
    
  });
}


/*----------------------------------
pre: everything mkPstCntxtMnu() requires
post: everything mkPstCntctMnu() needs
wrapper for mkPstCntxtMnu() to both erase existing context menu 
and remake it
---------------------------------*/
function remakePstCntxtMnu(prfl){
//build contextmenu 
let max=cntxtCchPst.length;
  if(max>0){
    for(let i=0; i<max; i++){
      browser.menus.remove(cntxtCchPst[i],(e)=>{
        if(browser.runtime.lastError){
          console.log("SARA: Unable to populate remove context item: \""+cntxtCchPst[i]+"\" Error: "+browser.runtime.lastError.message);
        }
      });
    }
  cntxtCchPst=[];
  }  

mkPstCntxtMnu(prfl);
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

//to handle browser.runtime/tabs.sendMessage errors
function chromeSendMsgErrHndl(action, tabs){
  if(browser.runtime.lastError){
  console.log("SARA: Received the following error: \n\n"+browser.runtime.lastError.message+"\n\nTrying to send a \""+action+"\" to\ntab: "+tabs[0].id+"\ntitled: \""+tabs[0].title+"\"\nurl: \""+tabs[0].url+"\"");
  return true;
  }
return false;
}

function chromeSendMsgErrHndlDtl(action, details){
  if(browser.runtime.lastError){
  console.log("SARA: Received the following error: \n\n"+browser.runtime.lastError.message+"\n\nTrying to send a \""+action+"\" to\ntab: "+details.tabId+"\nurl: \""+details.url+"\"");
  return true;
  }
return false;
}


//condition to enable or disable the browser action
function browserActionOn(str){
  if(str.match(/(http|https|file):\//)){
  browser.browserAction.enable();
  }
  else{
  browser.browserAction.disable();
  }
}


//======================== functional code =============================

var cntxtCch={};//cache for the context menu id's
var cntxtCchPst=[]; //cache for context menu -> paste
var curEl=null;
browser.menus.removeAll();
mkCntxtMnu();
var cntxtMnsEvntLstnrAdded=false;


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
//-------checking for empty install and initializing values-----------
browser.storage.local.get().then((d)=>{
  if(Object.keys(d).length <= 0){
    var ind={
      profiles: {
        "default":{
          name:{
          l: "Surname",
          f: "FirstName"
          },
          addr:"123 street road apt. A123",
        city: "",
        state: "",
        province: "",
        zip: "11001",
        postal: "101",
        mail: "name@email.com",
          phone: {
          cell: "1234567",
          home: "8901234"
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
        5:{"nm":"name","ord":[14, 15],"hash":{"l":14,"f":15}},
        6:{"nm":"addr","ord":[],"hash":{}},
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
        14:{"nm":"l","ord":[], "hash":{}},
        15:{"nm":"f","ord":[], "hash":{}},
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
      eventFill: true,
      hoverId: false,
      floatPnl: false,
      def_profile: "default",
      cur_profile: "default",
      curDef: false,
      applyLst: "",
      ignrLst: ""
      }
    };
    browser.storage.local.set(ind).then((e)=>{
    remakePstCntxtMnu(ind.settings.def_profile);
    });
  }
  else{
  remakePstCntxtMnu(d.settings.def_profile); //on startup, default the paste context menu to default profile
  }

});


//browser.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });

//--------------- listener for messages from other parts of the extension -------------------------
browser.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  /*
  if(msg.hasOwnProperty('bdgNm')) {
    browser.browserAction.setBadgeText({text: msg.bdgNm});
  }
  */
  if(msg.hasOwnProperty('onEl') && msg.onEl.hasOwnProperty('tagName') && msg.onEl.hasOwnProperty('attr')){
  var arr=Object.keys(msg.onEl.attr);
    //change the menu item title
    browser.menus.update("info",{
      title: "Element Properties: "+msg.onEl.tagName
    });
    
    //removes previous entry
    var ids=Object.keys(cntxtCch);
    var tmp=ids.shift();
      while(tmp){
        browser.menus.remove(tmp,(e)=>{
          if(browser.runtime.lastError){
          console.log("SARA: Unable to populate remove context item: \""+tmp+"\" Error: "+browser.runtime.lastError.message);
          }
        });
      tmp=ids.shift();
      }
    cntxtCch={};
    //populates the context menu
    arr.forEach((val, i) => {
    cntxtCch["info-"+val]={"val":msg.onEl.attr[val], "attr":val};
        browser.menus.create({
        id: "info-"+val,
        title: val+": \""+msg.onEl.attr[val]+"\"",
        contexts: ["all"],
        parentId: "info"
        }, (e)=>{
          if(browser.runtime.lastError){
          console.log("SARA: Unable to populate info-* context menu. Error: "+browser.runtime.lastError.message); 
          }
        });
    });
  }
  //on popup menu profile set, do the following
  else if(msg.hasOwnProperty('setPrfl')){
    browser.storage.local.get(['profile_meta']).then((d)=>{
      if(d && typeof d=="object" && d.hasOwnProperty('profile_meta') && typeof d.profile_meta =="object" && d.profile_meta.hasOwnProperty(msg.setPrfl)){
      //build contextmenu 
      remakePstCntxtMnu(msg.setPrfl);
      }
    }); 
  }
  else{
  //console.log(msg);
  }
});


//----determines how to evaluate which profile to use (for the paste context menu) when changing existing tabs--
browser.tabs.onActivated.addListener(function(activeInfo) {
  browser.tabs.query({active: true, currentWindow: true}, function(tabs){
    //console.log(tabs);
    if(!tabs||tabs.length<=0||!tabs.hasOwnProperty(0)||tabs[0].url==""||tabs[0].url.indexOf("chrome")==0){
    //url not loaded or not a valid URL do nothing.
    return null;
    }
    browser.storage.local.get().then((d)=>{
    let h=hostFromURL(tabs[0].url);
    let aHsh=strToApplyLst(d.settings.applyLst);
      // this can return an error if the extension was reloaded or updated and you go back to a page.
      // I tried try-catch, but that won't catch async calls. .catch() doesn't work and you can't supply
      // a function to deal with errors. It turns out, just by calling "browser.runtime.lastError" you can
      // "catch" the error and it won't report to the console on the background.js. WTH?
      // Whatever, it works. I'm running with it.
      browser.tabs.sendMessage(tabs[0].id,{action: "getPgPrfl"},(e)=>{
      //console.log(e);
      chromeSendMsgErrHndl("getPgPrfl", tabs);
        if(e!=null&&e!=false&&e!=undefined&&browser.runtime.lastError==undefined){
        let curPrfl=dtrmnPrfl(d.settings.cur_profile, d.settings.def_profile, h, aHsh, e, d.profiles, d.settings.curDef);
        //console.log("applying profile:"+ curPrfl);
        remakePstCntxtMnu(curPrfl);
        }
      });

      //determines if floating panel should be there on new and/or old tabs.
      browser.tabs.sendMessage(tabs[0].id,{action: "closeFltPnl"},(e)=>{
      chromeSendMsgErrHndl("closeFltPnl", tabs);
      });
    });
  });
});


//------------ adding contextMenu listener on click ----------------------------
//browser.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {          
//no longer using tabs.onUpdated because of iframes. it loads the onUpdated for each iframe and does each step within ths logic asynchronously. Hence
// remakePstCntxtMnu()'s mkPstCntxtMnu() call happen at the same time, before cntxtPstCch gets updated, causing it to make a contextmenu that already exists.
//which causes a non-stopping error.
browser.webNavigation.onCompleted.addListener(function(details){
  
  if(details.url.indexOf("chrome")==0){
  return null;
  }

  //cntxtMnsEvntLstnrAdded is to prevent the listener from being added multiple times
  if(!cntxtMnsEvntLstnrAdded){
    //adds listeners for the right click/context menu so we know what to do if something is clicked
    browser.menus.onClicked.addListener(function(info, tabs) {
        // if info.menuItemId starts with "info-", the action is to copy the data into the clipboard
        console.log(info.menuItemId);
        if(info.menuItemId.substr(0,5) == "info-"){
          if(cntxtCch.hasOwnProperty(info.menuItemId) && cntxtCch[info.menuItemId].hasOwnProperty("attr") && cntxtCch[info.menuItemId].hasOwnProperty("val")){
            browser.tabs.query({active: true, currentWindow: true}).then(function(tabs){
              browser.tabs.sendMessage(tabs[0].id, {action: "sendInfo", msg:{attr:cntxtCch[info.menuItemId].attr,val:cntxtCch[info.menuItemId].val}}).then((e)=>{chromeSendMsgErrHndlDtl("sendInfo", details);});
            });
          }
        }
        else if(info.menuItemId.substr(0,6) == "paste-"){
          browser.tabs.sendMessage(tabs.id, {action: "pasteVal", msg:{path:info.menuItemId}},(e)=>{chromeSendMsgErrHndlDtl("pasteVal", details);});
        }
        else if(info.menuItemId=="clip"){
          browser.tabs.sendMessage(tabs.id, {action: "clip", msg:{}},(e)=>{chromeSendMsgErrHndlDtl("clip", details);});
        }
        else{
        }
    });
  cntxtMnsEvntLstnrAdded=true;
  }

  //============set proper paste context menu on page load/reload=====
  if(details.url!=""&&details.url.indexOf("about")!=0&&details.frameId==0){
    browser.storage.local.get().then((d)=>{
    let h=hostFromURL(details.url);
    let aHsh=strToApplyLst(d.settings.applyLst);
        browser.tabs.sendMessage(details.tabId,{action: "getPgPrfl"},(e)=>{
        chromeSendMsgErrHndlDtl("getPgPrfl on page reload", details);
        let curPrfl=dtrmnPrfl(d.settings.cur_profile, d.settings.def_profile, h, aHsh, e, d.profiles, d.settings.curDef);
        remakePstCntxtMnu(curPrfl);
        });
    });
  }
});

/*------- enables toolbar icon when conditions are met. Doesn't need/not supported for firefox------------
browser.runtime.onInstalled.addListener(function() {
  browser.declarativeContent.onPageChanged.removeRules(undefined, function() {
    browser.declarativeContent.onPageChanged.addRules([{
      conditions: [new browser.declarativeContent.PageStateMatcher({
        pageUrl: {urlMatches: '(http|https|file):/+[a-z]*'},
      })],
      actions: [new browser.declarativeContent.ShowPageAction()]
    }]);
  });
});
--------------------------------------------------------------------------------------------------------*/

//enable or disable toolbar/browser action on new tab
browser.tabs.onUpdated.addListener((tabId, changeInfo, tabInfo)=>{
  if(tabInfo.active){
  browserActionOn(tabInfo.url);
  }
});

//enable or diable toolbar/browser action on tab switch
browser.tabs.onActivated.addListener((tabInfo)=>{
  browser.tabs.get(tabInfo.tabId).then((tab)=>{
  browserActionOn(tab.url);
  });
});
