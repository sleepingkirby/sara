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

  //a hack function to copy to clipboard
  function copyHack(str){
  var ta=document.createElement("textarea");
  ta.textContent=str;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy', false, null);
  document.body.removeChild(ta);
  }

  /*--------------------
  pre: everything above here
  post: everything modified as a result of running functions above here
  the main logic for what to do when a message comes in from the popup menu
  ---------------------*/
  function runOnMsg(request, sender, sendResponse){
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
      default:
      sendResponse("default");
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
      
    }
  }


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
    rnFlg=c.settings.hasOwnProperty("newValue")?c.settings.newValue.hoverId:false;
    oldFlg=c.settings.hasOwnProperty("oldValue")?c.settings.oldValue.hoverId:false;
      if(!rnFlg && document.getElementById(el.id)){
      document.body.removeChild(el);
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

  function strToHsh(str){
    if(typeof str !="string" || str=="" ||!str){
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


  //convert string to Apply List object
  function strToApplyLst(str){
    if(typeof str !="string" || str=="" ||!str){
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
    let patt=new RegExp(hsh_ind);
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


  //find elements and fill it with proper values.
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
    for(let i=0;i<max;i++){
    let arr=inpts[i].getAttributeNames();
    let arrm=arr.length;
    //console.log("===============>>");
    //console.log(inpts[i]);
    //console.log(arr);
      for(let j=0;j<arrm;j++){ 

        //console.log("inputs "+" "+arr[j]+" "+inpts[i].getAttribute(arr[j]));
      //value when type=text, email, hidden, month, number, date, datetime-local,color,vol, image, password,tel, time,url, week
      //checked when value=checkbox, radio
      val=mtchAgnstHsh(inpts[i].getAttribute(arr[j]),hsh);
        if(val!=null&&val!=false){//if val is null or false, the hash doesn't have an entry for this. Don't fill stuff in
        //if, for some bizarre reason, the input element doens't have a type, assume value
          if(!inpts[i].hasOwnProperty("type")){
          inpts[i].value=val;
          break;
          }
          else{
            if((inpts[i].type=="text"||inpts[i].type=="email"||inpts[i].type=="hidden"||inpts[i].type=="month"||inpts[i].type=="number"||inpts[i].type=="date"||inpts[i].type=="datetime-local"||inpts[i].type=="color"||inpts[i].type=="vol"||inpts[i].type=="image"||inpts[i].type=="password"||inpts[i].type=="tel"||inpts[i].type=="time"||inpts[i].type=="url"||inpts[i].type=="week")){
            inpts[i].value=val;
            break;
            }
            if(inpts[i].type=="radio"&&inpts[i].value==val){//why only if the value match? With radios, multiple inputs are linked together via name and has to provide a value to distinguish the choices from each other.
            inpts[i].checked=true;
            break;
            }
            if(inpts[i].type=="checkbox"&&val!="false"&&val!=""){
            inpts[i].checked=true;
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
        }
      }
    }
  return true;
  }


//================================================= main code run ====================================================

var conf={};
var onEl;
var ignErr=null;
var ignrHsh={};
var applyHsh={};

//set event so that right click will capture the element it's over
/* this doesn't work because context menu is render at the same time the code to update it is sent off.
as such, the contextmenu shown to the user is always one selection behind.
window.oncontextmenu=(e) => {
  onEl=e.path[0];
  chrome.runtime.sendMessage({'onEl':elToObj(e.path[0])});
};
*/
document.addEventListener("mouseover", elObjToBG);

chrome.storage.local.get(null, function(d){
//generate domain hashs
var curPrfl=""; //current profile.

ignrHsh=strToHsh(d.settings.ignrLst);
applyHsh=strToApplyLst(d.settings.applyLst);

var dmn=window.location.host;

curPrfl=applyHsh.hasOwnProperty(dmn)?applyHsh[dmn]:d.settings.def_profile;
//need to add function to change curPrfl based off of popup menu

//see if need to make hoverid. element.
hoverId(d.settings.hoverId);


  //if auto fill on see if domain is not in ignore list, if true, do nothing, if not, find fields and apply
  if(d.settings.autoFill){
    if(!ignrHsh.hasOwnProperty(dmn)){
    //find and fill
    console.log("auto fill on, not in ignore list");
    console.log(fndNFll(d.profiles[dmn]));
    }
  }
  //if auto fill not on, see if domain is apply list. If so, apply. If not, do nothing.
  else{
    if(applyHsh.hasOwnProperty(dmn)){
    //find and fill
    console.log("autofill off, in apply list");
    console.log(fndNFll(d.profiles[curPrfl]));
    }
  }

});






//get message from other parts
chrome.runtime.onMessage.addListener(runOnMsg);

})();
