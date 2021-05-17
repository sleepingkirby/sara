//loading external files and settings.
(function() {

/**
 * Check and set a global guard variable.
 * If this content script is injected into the same page again,
 * it will do nothing next time.
 */
if (window.hasRun) {
  return true;
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

  //a hack function to copy to clipboard
  function copyHack(str){
  var ta=document.createElement("textarea");
  ta.textContent=str;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy', false, null);
  document.body.removeChild(ta);
  }

  /*--------------------------------------------
  pre: global element onEl, copyHack()
  post: element onEl filled
  takes the string from the message, find the 
  value from the settings via the string, fills
  the onEl with the value.
  ---------------------------------------------*/ 
  function pasteVal(str){
    if(typeof str!="string" || str==""){
    return null;
    }
  let prfl="";
  let tmp=str.split('|');
  prfl=tmp[1];
  tmp=tmp[0].split('-');

  let rtrn="";
  let ptr=null;
    chrome.storage.local.get({"profiles":null, "profile_meta":null}, (d)=>{
    let max=tmp.length;
    ptr=d.profiles[prfl];
    //skipping 0 as that's root, skipping 1 as that's always category
      if(max<=2){
      return rtrn;
      }

      for(let i=2; i<max; i++){
        if(d.profile_meta[prfl].hasOwnProperty(tmp[i])){
        let nm=d.profile_meta[prfl][tmp[i]].nm;
          if(typeof ptr=="object" && ptr && ptr.hasOwnProperty(nm)){
          ptr=ptr[nm];
          }
        }
      }

      if(typeof ptr!="string" || typeof onEl!="object"){
      return null;
      }

      console.log("SARA: pasting value \""+ptr+"\" into field");
      
      copyHack(ptr);

      if(onEl.tagName.toLocaleLowerCase()=="input"){    
        switch(onEl.type){
        case "checkbox":
          if(ptr!=null&&ptr!=false){
          onEl.checked=true;
          }
          else{
          onEl.checked=false;
          }
        break;
        case "radio":
        let rds=document.getElementsByName(onEl.name);
        let m=rds.length;
          for(let i=0; i<m; i++){
            if(rds[i].value==ptr){
            rds[i].checked=true;
            }
          }
        break;
        default:
        onEl.value=ptr;
        break;
        }
      }
      else if(onEl.tagName.toLocaleLowerCase()=="option"){
      onEl.parentElement.value=ptr;
      }
      else{
      onEl.value=ptr;
      }

    }); 
  }

  /*---------------------------------------------------------
  pre: element
  post:
  extract proper value from element in accordance to what kind
  of element it is
  ----------------------------------------------------------*/
  function getValFrmElTyp(el){
    if(typeof el!="object"){
    return null;
    }

    if(el.tagName.toLocaleLowerCase()=="input"){
      switch(el.type){
      case "checkbox":
        return el.checked;
      break;
      case "radio":
      let arr=document.getElementsByName(el.name);
      let m=arr.length;
        for(let i=0; i<m; i++){
          if(arr[i].checked==true){
          return arr[i].value;
          }
        }
      break;
      default:
      return el.value;
      break;
      }
    }
    else if(el.tagName.toLocaleLowerCase()=="option"){
    return el.parentElement.value;
    }
    else{
    //both textarea and select should fall here
    return el.value;
    }

  return null;
  }

  /*--------------------
  pre: everything above here
  post: everything modified as a result of running functions above here
  the main logic for what to do when a message comes in from the popup menu
  ---------------------*/
  function runOnMsg(request, sender, sendResponse){
  console.log("SARA: Setting up listeners for popup menu and background services");
    switch(request.action){
      /*
      case 'getEl':
      //sends current hovered over element to the background script to populate the right click menu
      var obj=elToObj(onEl);
      console.log(obj); 
      sendResponse(JSON.stringify(obj));
      break;
      */
      case 'sendInfo':
      //copies the proper attribute of the desire element into the clipboard
      copyHack(request.msg.val);
      sendResponse(true);
      break;
      case 'setPgPrfl':
      rcrdPgPrfl(request.msg.val);
      sendResponse(true);
      break;
      case 'getPgPrfl':
      sendResponse(getPgPrfl());
      break;
      case 'fillForm':
        chrome.storage.local.get({'profiles':null},(d)=>{
          if(d.profiles.hasOwnProperty(request.msg.val)){
          fillNMsg(d.profiles[request.msg.val], "Fields Filled: ##num##\r\nProfile: "+request.msg.val);
          }
          else{
          sendResponse(false);
          }
        });
        sendResponse(true);
      break;
      case 'pasteVal':
      pasteVal(request.msg.path);
      sendResponse(true);  
      break;
      case 'clip':
      copyHack(getValFrmElTyp(onEl));
      sendResponse(true);
      break;
      default:
      console.log(request);
      sendResponse("default");
      break;
    }
  }

  /*-------------------------
  pre: onEl exists, mouseover event passed down, elToObj()
  post: mouseover event listener added
  sends message current element as object to background script
  -------------------------*/
  function elObjToBG(e){
    try{
    chrome.runtime.sendMessage({'onEl':elToObj(e.path[0])});
    }
    catch(err){
      var frames=document.getElementsByTagName("iframe");
      if(ignErr===null&&frames.length<=0){
      ignErr=confirm("Hi, this is the extension \"SARA\". I've detected an error when trying to talk with another part of myself.\nThis is most likely because I was upgraded, reloaded or removed. In order for me to run correctly, this page will have to be reloaded. If this continues even after a reload, something is blocking me. Please troubleshoot by turning off other extensions, antivirus, firewalls or the like that might do this. \nClick \"OK\" to reload the page.\nClick \"Cancel\" to continue to work as it is. \n\n"+err);
      }
      if(ignErr){
      location.reload();
      }
    }
  }

  /*---------------------------------------------------
  pre: global variable onEl 
  post:
  function to capture what element was right-clicked on
  ---------------------------------------------------*/
  function rghtClckOnEl(e){
  onEl=e.path[0];
  }


  /*---------------------------------------------------
  pre:
  post: html element that is not visible.
  adds an invisible element to the page to keep track 
  of what profile was set for this page.
  ---------------------------------------------------*/
  function rcrdPgPrfl(prfl){
    if(typeof prfl != "string" || prfl=="" ||!prfl){
    return false;
    }

  var id="extIdNmSARAPgPrfl";
  var el=document.getElementById(id);
    if(el){
    el.setAttribute("profile",prfl);
    return true;
    }

  el=document.createElement("div");
  el.style.cssText="display:none;max-height: 0px; max-width: 0px; opacity:0;";
  el.setAttribute("profile",prfl);
  el.id=id;
  document.body.appendChild(el);
  return true;
  }

  /*-------------------------------------------------
  pre:
  post:
  checks if page profile marker was set
  --------------------------------------------------*/
  function getPgPrfl(){
  let el=document.getElementById("extIdNmSARAPgPrfl");
    if(el){
    return el.getAttribute("profile");
    }
  return null;
  }

  /*---------------------------------------------------
  pre:
  post:
  returns which profile to use. Meant for first time 
  the page is ran. Subsequent changes depend on popup 
  to tell us (content_script) which profile to use.
  ---------------------------------------------------*/
  function dtrmnPrfl(dmn, d, hsh){
    //if that doesn't exist, return error, ask to create new profile or reinstall (outside of this function). Nothing is done until then
    if(Object.keys(d).length<=0 || Object.keys(d.profiles).length<=0 ){
    return false;
    }

    //since always runs on page start and only on page start, the profile marker is NEVER set
    //if in applyHsh, get profile name
    if(Object.keys(hsh).length>=1&&hsh.hasOwnProperty(dmn)&&d.profiles.hasOwnProperty(hsh[dmn])){
    return hsh[dmn];
    }

    //if that profile doesn't exist/workout, use current profile.
    if(d.settings.hasOwnProperty("cur_profile") && d.profiles.hasOwnProperty(d.settings.cur_profile)){
    return d.settings.cur_profile;
    }

    //if that profile doesn't exist/workout, use default profile.
    if(d.settings.hasOwnProperty("def_profile") && d.profiles.hasOwnProperty(d.settings.def_profile)){
    return d.settings.def_profile;
    }

    //if default doesn't exist, set to first profile in list. 
  return Object.keys(d.profiles)[0];
  }

  /*---------------------------------------------------
  pre: hoverId(value to know if it needs to run)
  post: hoverId added or removed.
  the main logic for the hover Id'ing element. This 
  generates the element, adds listeners to know when to
  add the element, when to remove the element, when to
  start adding, etc.
  ---------------------------------------------------*/
  function hoverId(hoverId){
  var rnFlg=hoverId;
    if(typeof rnFlg != "boolean"){
    rnFlg=false;
    }

  var mrgn=16;
  var el=document.createElement("div");
  el.style.cssText="display:inline-block;position:fixed;color:#cccccc;background-color:black;left:0px;top:0px;border:1px solid #cccccc;border-radius:6px;padding: 6px 6px 6px 6px;opacity:.75;z-index:999999999;margin:"+mrgn+"px;white-space:pre-wrap;word-break:break-all;max-width:"+window.innerWidth+"px;min-width:50px;"
  el.textContent="loading...";
  el.id="extIdNmSARA";

    chrome.storage.onChanged.addListener(function(c,n){
      if(c.hasOwnProperty("settings")){
      rnFlg=c.settings.hasOwnProperty("newValue")?c.settings.newValue.hoverId:false;
      oldFlg=c.settings.hasOwnProperty("oldValue")?c.settings.oldValue.hoverId:false;
        if(!rnFlg && document.getElementById(el.id)){
        document.body.removeChild(el);
        }
      }
    });

    document.onmousemove=function(e){
      if(rnFlg){
      document.body.appendChild(el);
        if(!el.isEqualNode(e.target)){
        el.textContent=e.target.tagName.toLowerCase();
        var arr=e.target.getAttributeNames();
        arr.forEach( (i,n)=>{el.textContent+="\r\n"+i+": "+e.target.getAttribute(i);});
        }
          
        if((e.clientX + el.clientWidth + mrgn) > window.innerWidth){
        el.style.maxWidth=window.innerWidth+"px";
        el.style.left= (e.clientX - mrgn - 10 - el.clientWidth) +"px";
        }
        else{
        el.style.maxWidth=window.innerWidth+"px";
        el.style.left=e.clientX+"px";
        }

        if((e.clientY + el.clientHeight + mrgn) > window.innerHeight){
        el.style.maxHeight=window.innerHeight+"px";
        el.style.top= (e.clientY - mrgn - 10 - el.clientHeight) +"px";
        }
        else{
        el.style.maxHeight=window.innerHeight+"px";
        el.style.top=e.clientY+"px";
        }
      }
    };
    //when mouse leaves the webpage, remove hover
    document.onmouseout=function(e){
      if(document.getElementById(el.id)){
      document.body.removeChild(el);
      }
    };
  }

  /*--------------------------------------------------------
  pre:
  post:
  splits strings with new lines into objects
  --------------------------------------------------------*/
  function strToHsh(str){
    if(typeof str !="string"){
    return null;
    }
  var s=str;
  var arr=s.trim().split("\n");
  var rtrn={};
  var max=arr.length;
    for(let i=0; i<max; i++){
    rtrn[arr[i]]=true;
    }
  return rtrn;
  }

  /*--------------------------------------------------------------
  pre: none
  post: none
  convert string to Apply List object
  --------------------------------------------------------------*/
  function strToApplyLst(str){
    if(typeof str !="string"){
    return {};
    }
  var s=str;
    if(s.trim()==""){
    return {};
    }
  var arr=s.trim().split("\n");
  var rtrn={};
  var max=arr.length;
    for(let i=0; i<max; i++){
    let pos=arr[i].indexOf("|");
    rtrn[arr[i].substr(0,pos)]=arr[i].substr(pos+1);
    }
  return rtrn;
  }

  //match string to the hash
  function mtchAgnstHsh(str, hsh){
    if(!str || str=="" || typeof str !="string"){
    return false;
    }

    if(typeof hsh!="object" || Object.keys(hsh).length <= 0){
    return false;
    } 

  var h=hsh;
  var s=str;
  var ks=Object.keys(h);
  var hsh_ind="";
  var rtrn=null;
    while(typeof h=="object" && ks.length>0 && rtrn==null){
    hsh_ind=ks.shift();
    let patt=new RegExp(hsh_ind, "i");
      if(patt.test(s)){
        //if the pattern matches and the pattern is an index for an object, traverse down
        if(typeof h[hsh_ind]=="object"){
        h=h[hsh_ind];
        ks=Object.keys(h);
        }
        else{
        //if the pattern matches and the pattern is an index for not an object, it's the final value.
        rtrn=h[hsh_ind];
        }
      }
    }
  return rtrn;
  }


  /*----------------------------------------------------------
  pre:
  post:

  ----------------------------------------------------------*/
  function setMsg(msg){

  var sty=document.createElement("style");
  sty.type="text/css";
  sty.className="extIdNmSARAMsgSty";
  sty.textContent="@keyframes extIdNmSARAMsgStyAni{0%{opacity:0.85;}100%{opacity:0;}}";
  sty.id=sty.className;

  document.head.appendChild(sty);

  var id="extIdNmSARAMsg";
  el=document.createElement("div");
  el.style.cssText="position:fixed; box-sizing: border-box; top: 0px; left: 0px; width:100%; display:flex; justify-content: center; opacity: 0.85; z-index:999999; animation: extIdNmSARAMsgStyAni 1.5s ease-in-out 3.5s forwards;";
  el.id=id;
  
  el.appendChild(document.createElement("div"));
  el.firstChild.style.cssText="padding: 8px 12px 8px 12px; border-radius: 0px 0px 6px 6px; background-color:#606060; color:#ffffff; font-weight:700; font-size: x-large; white-space:pre-wrap; ";
  el.firstChild.textContent=msg;

    el.onanimationend=(e)=>{
    document.body.removeChild(el);
    document.head.removeChild(sty);
    };

  document.body.appendChild(el);

  };

  /*-------------------------------------------------------------------
  pre: mtchAgnstHsh()
  post: html elements filled
  find elements and fill it with proper values.
  -------------------------------------------------------------------*/
  function fndNFll(hsh){
    if(typeof hsh!="object" || Object.keys(hsh) <=0){
    return false;
    }
  var h=hsh;
  var inpts=document.getElementsByTagName("input");
  var tas=document.getElementsByTagName("textarea");
  var slcts=document.getElementsByTagName("select");


  //inputs
  var val=null;
  let max=inpts.length;
  var cnt=0;
    for(let i=0;i<max;i++){
    let arr=inpts[i].getAttributeNames();
    let arrm=arr.length;
    //console.log("===============>>");
    //console.log(inpts[i]);
    //console.log(arr);
      //iterating through attributes of the element
      for(let j=0;j<arrm;j++){ 

      //console.log("inputs "+" "+arr[j]+" "+inpts[i].getAttribute(arr[j]));
      //value when type=text, email, hidden, month, number, date, datetime-local,color,vol, image, password,tel, time,url, week
      //checked when value=checkbox, radio
      val=mtchAgnstHsh(inpts[i].getAttribute(arr[j]),hsh);
        if(val!=null&&val!=false){//if val is null or false, the hash doesn't have an entry for this. Don't fill stuff in
        //if, for some bizarre reason, the input element doens't have a type, assume value
          if(!inpts[i].hasAttribute("type")){
          inpts[i].value=val;
          cnt++;
          break;
          }
          else{
            if((inpts[i].type=="text"||inpts[i].type=="email"||inpts[i].type=="hidden"||inpts[i].type=="month"||inpts[i].type=="number"||inpts[i].type=="date"||inpts[i].type=="datetime-local"||inpts[i].type=="color"||inpts[i].type=="vol"||inpts[i].type=="image"||inpts[i].type=="password"||inpts[i].type=="tel"||inpts[i].type=="time"||inpts[i].type=="url"||inpts[i].type=="week")){
            inpts[i].value=val;
            cnt++;
            break;
            }
            if(inpts[i].type=="radio"&&inpts[i].value==val){//why only if the value match? With radios, multiple inputs are linked together via name and has to provide a value to distinguish the choices from each other.
            inpts[i].checked=true;
            cnt++;
            break;
            }
            if(inpts[i].type=="checkbox"){
              if(val!="false"&&val!=""){
              inpts[i].checked=true;
              }
              else{
              inpts[i].checked=false;
              }
              cnt++;
              break;
            }
          }
        }
      }
    }     

  //textarea value 
  val=null;
  max=tas.length;
    for(let i=0;i<max;i++){
    let arr=tas[i].getAttributeNames();
    let arrm=arr.length;
      for(let j=0;j<arrm;j++){ 
      //value when type=text, email, hidden, month, number, date, datetime-local,color,vol, image, password,tel, time,url, week
      //checked when value=checkbox, radio
      val=mtchAgnstHsh(tas[i].getAttribute(arr[j]),hsh);
        if(val!=null&&val!=false){//if val is null or false, the hash doesn't have an entry for this. Don't fill stuff in
        tas[i].value=val;
        cnt++;
        }
      }
    }

  //select
  val=null;
  max=slcts.length;
    for(let i=0;i<max;i++){
    let arr=slcts[i].getAttributeNames();
    let arrm=arr.length;
      for(let j=0;j<arrm;j++){ 
      //value when type=text, email, hidden, month, number, date, datetime-local,color,vol, image, password,tel, time,url, week
      //checked when value=checkbox, radio
      val=mtchAgnstHsh(slcts[i].getAttribute(arr[j]),hsh);
        if(val!=null&&val!=false){//if val is null or false, the hash doesn't have an entry for this. Don't fill stuff in
        slcts[i].value=val;
        cnt++;
        }
      }
    }
  return cnt;
  }

/*---------------------------------------------------
pre: fndNFll(),setMsg()
post:html forms filled, message set (##num##)
params: hash for fndNFll and profile for message
wrapper for fndNFll and setMsg so only 1 
function needs to be called to both fill and setMsg
---------------------------------------------------*/
function fillNMsg(hsh, msg){
  if(typeof hsh!="object"){
  return false;
  }
let num=fndNFll(hsh);
let m=msg.replace("##num##", num);
setMsg(m);
return true;
}

//================================================= main code run ====================================================

var onEl;
var ignErr=null;
var ignrHsh={}; //hash for ignore list
var applyHsh={}; //hash for apply list
var isApply=false; //is this domain in apply list?
var curPrfl=null; //profile name to apply for this page 
var dmn=window.location.host;//domain of current page/

document.addEventListener("mouseover", elObjToBG);
document.addEventListener("contextmenu", rghtClckOnEl);

chrome.storage.local.get(null, function(d){
  if(Object.keys(d).length<=0){
  console.log("SARA: No settings found. Not able to do anything. Reinstall recommended.");
  return false;
  }

//set the hashs for east access
ignrHsh=strToHsh(d.settings.ignrLst);
applyHsh=strToApplyLst(d.settings.applyLst);

//see if need to make hoverid. element.
hoverId(d.settings.hoverId);

isApply=applyHsh.hasOwnProperty(dmn); //current page's domain in applyHsh?


curPrfl=dtrmnPrfl(dmn, d, applyHsh);
  //if this fails, we can't do the rest. Stop here
  if(curPrfl==false){
  console.log("SARA: No profiles found. Nothing to do.");
  chrome.runtime.onMessage.addListener(runOnMsg);
  return false;
  }


  //if auto fill on see if domain is not in ignore list, if true, do nothing, if not, find fields and apply
  if(d.settings.autoFill){
    if(!ignrHsh.hasOwnProperty(dmn)){
    //find and fill
    fillNMsg(d.profiles[curPrfl], "Autofill ON\r\nFields Filled: ##num##\r\nProfile: "+curPrfl);
    }
  }
  //if auto fill not on, see if domain is apply list. If so, apply. If not, do nothing.
  else{
    if(isApply){
    //find and fill
    fillNMsg(d.profiles[curPrfl], "Apply List Fill\r\nFields Filled: ##num##\r\nProfile: "+curPrfl);
    }
  }


//get message from other parts
chrome.runtime.onMessage.addListener(runOnMsg);
});

})();
