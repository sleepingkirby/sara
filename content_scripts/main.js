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

  //I can't believe that this function doesn't exist in javascript
  // makes O'Reily into O\'Reily or "air quotes" into \"air quotes\"
  function addslashes(str){
  return str.replace(/['"\\]/g, '\\$&');
  }

  //convert special characters to html entities.
  function toHtmlEnt(str){
  var rtrn=str;
  rtrn=rtrn.replace(/'/g, '&apos;');
  rtrn=rtrn.replace(/"/g, '&quot;');
  rtrn=rtrn.replace(/\\/g, '&bsol;');
  rtrn=rtrn.replace(/</g, '&lt;');
  rtrn=rtrn.replace(/>/g, '&gt;');
  rtrn=rtrn.replace(/&/g, '&amp;');
  return rtrn;
  }

  //convert special characters back from html entities
  function fromHtmlEnt(str){
  var rtrn=str;
  rtrn=rtrn.replace(/&apos;/g, '\'');
  rtrn=rtrn.replace(/&quot;/g, '"');
  rtrn=rtrn.replace(/&bsol;/g, '\\');
  rtrn=rtrn.replace(/&lt;/g, '<');
  rtrn=rtrn.replace(/&gt;/g, '>');
  rtrn=rtrn.replace(/&amp;/g, '&');
  return rtrn;
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
  pre: none
  post:
  sends events that makes forms that cache your input rather
  just reading the d*mn input forms for the values
  actually work and persist.
          onEl.dispatchEvent(new InputEvent('input',{inputType:'insertFromPaste'}));
        onEl.dispatchEvent(new Event('change',{bubbles:true}));
        onEl.value=ptr;
        onEl.dispatchEvent(new Event('change',{bubbles:true}));
  using:
  https://higherme.bamboohr.com/jobs/view.php?id=25&source=aWQ9MjY%3D
  as example
  ---------------------------------------------*/
  function smrtFill(el, val, type, flag=false){

  var vls='value';
    switch(type){
      case 'checked':
      vls='checked';
      break;
      default:
      vls='value';
      break;
    }  

    
    if(!flag){
    el[vls]=val;
    return 0;
    }

    el.dispatchEvent(new InputEvent('input',{inputType:'insertFromPaste'}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
    el[vls]=val;
    el.dispatchEvent(new Event('change',{bubbles:true}));
    el[vls]=val;
    return 0;
  }


  /*--------------------------------------------
  pre: global element onEl, copyHack(), smrtFill()
  post: element onEl filled
  takes the string from the message, find the 
  value from the settings via the string, fills
  the onEl with the value.
  ---------------------------------------------*/ 
  function pasteVal(str, flag=false){
  //console.log("SARA: starting pasteVal: "+str);
    if(typeof str!="string" || str==""){
    return null;
    }
  let prfl="";
  let tmp=str.split('|');
  prfl=tmp[1];
  tmp=tmp[0].split('-');

  let rtrn="";
  let ptr=null;
    chrome.storage.local.get(null, (d)=>{
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

    //console.log("found: "+ptr);
    copyHack(ptr);

      if(typeof ptr!="string" || typeof onEl!="object"){
      console.log("SARA: Attempt to paste value into field failed. Field either not an object or value not a string.");
      //console.log(onEl);
      //console.log(prt);
      return null;
      }

      console.log("SARA: pasting value \""+ptr+"\" into field");
      //console.log(onEl);      

      if(onEl.tagName.toLocaleLowerCase()=="input"){    
        switch(onEl.type){
        case "checkbox":
          if(ptr!=null&&ptr!=false){
          smrtFill(onEl, true, 'checked', flag);
          }
          else{
          smrtFill(onEl, false, 'checked', flag);
          }
        break;
        case "radio":
        let rds=document.getElementsByName(onEl.name);
        let m=rds.length;
          for(let i=0; i<m; i++){
            if(rds[i].value==ptr){
            rds[i].checked=true;
            smrtFill(rds[i], true, 'checked', flag);
            }
          }
        break;
        default:
        smrtFill(onEl, ptr, 'value', flag);
        break;
        }
      }
      else if(onEl.tagName.toLocaleLowerCase()=="option"){
      smrtFill(onEl.parentElement.value, ptr, 'value', flag);
      }
      else{
      smrtFill(onEl, ptr, 'value', flag);
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
  //console.log("SARA: Heard message from. Running action: "+request.action);
  //console.log(request);
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
        chrome.storage.local.get({'profiles':null, 'settings':null},(d)=>{
          if(d.profiles.hasOwnProperty(request.msg.val)){
          fillNMsg(d.profiles[request.msg.val], "Fields Filled: ##num##\r\nProfile: "+request.msg.val, d.settings.eventFill);
          }
          else{
          sendResponse(false);
          }
        });
        sendResponse(true);
      break;
      case 'pasteVal':
        chrome.storage.local.get(null,(d)=>{
        pasteVal(request.msg.path, d.settings.eventFill);
        });
      sendResponse(true);  
      break;
      case 'clip':
      copyHack(getValFrmElTyp(onEl));
      sendResponse(true);
      break;
      case 'fPnlTgl':
        chrome.storage.local.get(null,(d)=>{
        let prfl=getPgPrfl();
          if(!prfl){
          let applyHsh=strToApplyLst(d.settings.applyLst);
          prfl=dtrmnPrfl(window.location.host, d, applyHsh);
          }        
        floatPnlDt(d, request.msg.val, prfl);
        });
      sendResponse(true);
      break;
      case 'closeFltPnl':
        chrome.storage.local.get(null, (d)=>{
        floatPnlDt(d, d.settings.floatPnl, null);
        });
      sendResponse(true);
      break;
      default:
      //console.log(request);
      sendResponse("default");
      break;
    }
  }

  /*-------------------------
  pre: onEl exists, mouseover event passed down, elToObj()
  post: process mouseover event
  sends message current element as object to background script
  -------------------------*/
  function elObjToBG(e){
    if(e.path){
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
  }

  /*---------------------
  pre: elObjToBG()
  post: process mouseover event
  wrapper for mouseover events
  ---------------------*/
  function mouseOvrEvnt(e){
  var act="extIdNmSARAActCopy";
  
    if(e.target.getAttribute('act')==act){
    var vl=fromHtmlEnt(e.target.getAttribute('val'));
    //copyHack(vl);
    //using chrome clipboard copy here to prevent field from losing focus.
    navigator.clipboard.writeText(vl).then(
      (e)=>{
      setFPnlMsg('Copied "'+vl+'"');
      },
      (e)=>{
        if(e=="DOMException: Document is not focused."||e=="NotAllowedError: Document is not focused."){
        setFPnlMsg('Click on page to begin copying');
        }
        console.log('SARA: function mouseOvrEvnt() failed to copy. Error: "'+e+'"');
      });
    }
    else{
    elObjToBG(e);
    }
  }
  

  /*---------------------------------------------------
  pre: global variable onEl 
  post:
  function to capture what element was right-clicked on
  ---------------------------------------------------*/
  function rghtClckOnEl(e){
    if(e.path){
    onEl=e.path[0];
    }
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
    if(d.settings.hasOwnProperty("cur_profile") && d.profiles.hasOwnProperty(d.settings.cur_profile) && d.settings.hasOwnProperty("curDef") && d.settings.curDef==true){
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

  //gets value from the profile data according to the stack and leaf
  //see used in trvrsDrwPrfl()
  function getValTree(stk, meta, prf, leaf){
  var max=stk.length;
    if(max<=1){
    return '';
    }
  var i=0;
  var val='';
  var pos=prf;
    for(var i=0; i<max; i++){
      if(pos.hasOwnProperty(meta[stk[i].n].nm)){
      pos=pos[meta[stk[i].n].nm];
      }
    }
   
    if(pos.hasOwnProperty(leaf) && typeof pos[leaf]=="string"){
    return pos[leaf];
    }
  return '';
  }


  /*----------------------------
  pre: getVal()
  post: none
  generates html for the float panel
  ----------------------------*/
  //traverse and draw profile 
  function trvrsDrwPrfl(d,p){
  var act="extIdNmSARAActCopy";
  var stack=[];
  var prof=d.profiles[p];
  var meta=d.profile_meta[p];
  var settings=d.settings;
  var rtrn='';
  var path=[];
  stack.push({n:0,i:0});

    while(stack.length>0){
      //if the current id (stack[last].i) is beyond the last element in meta[curId].ord, pop the current entry in stack as we're done with it.
      if(stack[stack.length-1].i>(meta[stack[stack.length-1].n].ord.length-1)){
      stack.pop();
        if(stack.length>0){
        stack[stack.length-1].i = stack[stack.length-1].i +1;
        }
      rtrn+="    </div> \
            </div> \
            <div style=\"display: flex; width:100%; margin: 6px 0px 6px 0px; height:0px;\">&nbsp</div>\
            ";
      }
      else{
      var curId=meta[stack[stack.length-1].n].ord[stack[stack.length-1].i];
        //if the element exists in the profile_meta AND the element has sub elements, but also don't process the root node (stack.length<=1).
        if(meta.hasOwnProperty(curId) && ((meta[curId].ord.length>0 && Object.keys(meta[curId].hash).length>0)||stack.length<=1)){
        rtrn+="<div style=\"display: flex; flex-direction: column; align-items: flex-start; margin-top: 6px;\"> \
                <span style=\"font-weight: 900;\">"+meta[curId].nm.toUpperCase()+"</span> \
                <div style=\"display: flex; padding: 2px 0px 2px 20px; flex-direction: column; width:100%; box-sizing: border-box;\"> \
              ";
        stack.push({n:curId,i:0});
        }
        else{
        //else,it's a leaf node
        let val=getValTree(stack, meta, prof, meta[curId].nm);
        rtrn+='<div style="display:flex; flex-direction:row; justify-content:flex-start; align-items: center; margin: 0px 0px 4px 0px; padding: 0px 2px 0px 4px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; width: 100%; box-sizing: border-box; cursor: copy;" act="'+act+'" val="'+toHtmlEnt(val)+'"><div style=\"display: flex; margin-right: 6px;\">&bull;</div>'+meta[curId].nm+': <div style="text-overflow:ellipsis; overflow: hidden; border-radius: 4px; margin-left: 6px; white-space:nowrap; width: 100%;" type="text" act="'+act+'" val="'+toHtmlEnt(val)+'">'+val+'</div></div>';
        stack[stack.length-1].i = stack[stack.length-1].i +1;
        }
      }
    }
  return rtrn;
  }


  /*---------------------------------------------------
  ---------------------------------------------------*/
  function floatPnlDt(data, tgl, prfl){
  var id="extIdNmSARAFPnl";
  var ttlId="extIdNmSARAFPnlTtl";
    if(!tgl){
        data.settings['floatPnl']=false;
          chrome.storage.local.set(data,(e)=>{
          var el=document.getElementById(id);
            if(el && el.nodeType){
            document.body.removeChild(el);
            }
          });
    return 1;
    } 

    //if float panel is toggled, look to see if floating panel already exists, if so, do nothing
    var el=document.getElementById(id);
    if(el && el.nodeType){
    return 0;
    }

    data.settings['floatPnl']=true;
    chrome.storage.local.set(data,(e)=>{
    el=document.createElement("div");
    el.style.cssText="display: flex; flex-direction: column; justify-content: flex-start; align-items: stretch; top: 0px; left: 75vw; opacity: 0.75; color:#AAAAAA; background-color:black; border-radius:6px; box-sizing: border-box; border: 1px solid #AAAAAA; width: calc(25vw - 20px); height: calc(100vh - 50px); max-width:75vw; max-height: calc(100vh - 20px); min-height: 50px; min-width: 180px; font-family: sans-serif; cursor: grab; position: fixed; z-index: 9999999; resize: both; overflow: hidden;";
    el.id=id;
    el.draggable=true;

      el.addEventListener("dragstart", (e)=>{
      e.target.setAttribute("prevX", e.offsetX);
      e.target.setAttribute("prevY", e.offsetY);
      });
      el.addEventListener("dragend", (e)=>{
      var pos=e.target.getBoundingClientRect();
      var prevX=e.target.getAttribute("prevX");
      var prevY=e.target.getAttribute("prevY");
      e.target.style.top=(pos.y+e.offsetY-prevY)+"px";
      e.target.style.left=(pos.x+e.offsetX-prevX)+"px";
      });
  
    var hd=document.createElement("div");
    hd.style.cssText="display:flex; flex-direction:row; justify-content: stretch; align-items: stretch;";
 
    var ttl=document.createElement("div");
    ttl.style.cssText="display: flex; flex-direction: row; justify-content: flex-start; align-items: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-grow: 10; font-weight: 900; padding: 0px 4px 0px 6px;";
    ttl.id=ttlId;
    ttl.textContent="Quick Copy Panel";
    
    var cls=document.createElement("div");
    cls.style.cssText="display: flex;  border:1px solid #cccccc; margin: 4px 4px 4px 0px; padding: 2px 2px 2px 2px; border-radius: 6px; cursor: default;";
    cls.textContent='x';
      cls.addEventListener("click", (e)=>{
      data.settings['floatPnl']=false;
        chrome.storage.local.set(data,(e)=>{
        document.body.removeChild(el);
        });
      });

    hd.appendChild(ttl);
    hd.appendChild(cls);

    var bdy=document.createElement("div");
    bdy.style.cssText="display: flex; flex-direction: column; justify-content: flex-start; align-items: stretch; border-radius:6px; padding: 6px 6px 6px 10px; box-sizing: border-box; overflow: auto; font-family: sans-serif; cursor: grab; width: 100%; height: 100%;";
    bdy.innerHTML=trvrsDrwPrfl(data,prfl);

    el.appendChild(hd); 
    el.appendChild(bdy); 

    document.body.appendChild(el);
    });
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
  var trl="";
  var cm="";
  var rtrn=null;
    while(typeof h=="object" && ks.length>0 && rtrn==null){
    hsh_ind=ks.shift();
    let patt=new RegExp(hsh_ind, "i");
      if(patt.test(s)){
        //if the pattern matches and the pattern is an index for an object, traverse down
        if(typeof h[hsh_ind]=="object"){
        h=h[hsh_ind];
        ks=Object.keys(h);
        trl+=cm+hsh_ind;
        cm="->";
        }
        else{
        //if the pattern matches and the pattern is an index for not an object, it's the final value.
        rtrn=h[hsh_ind];
        trl+=hsh_ind;
        console.log("SARA: match found for \""+s+"\", with trial \""+trl+"\", with value \""+rtrn+"\"");
        return rtrn;
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
      try{
      document.body.removeChild(el);
      document.head.removeChild(sty);
      }
      catch(err){
      console.log("SARA: unable to remove element and/or style for the over page message. This is okay if the element doesn't exist. "+err);
      }
    };

  document.body.appendChild(el);

  };

  
  /*---------------------------
  pre: element with id
  post: sets content of element with id
  post sets element with id "id" with content of str
  ---------------------------*/
  function setFPnlMsg(str){
  var id="extIdNmSARAFPnlTtl";
  document.getElementById(id).textContent=str;
  return 0;
  }



  /*-------------------------------------------------------------------
  pre: mtchAgnstHsh(), smrtFill()
  post: html elements filled
  find elements and fill it with proper values.
  -------------------------------------------------------------------*/
  function fndNFll(hsh, flag=false){
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
          smrtFill(inpts[i], val, 'value', flag);
          cnt++;
          break;
          }
          else{
            if((inpts[i].type=="text"||inpts[i].type=="email"||inpts[i].type=="hidden"||inpts[i].type=="month"||inpts[i].type=="number"||inpts[i].type=="date"||inpts[i].type=="datetime-local"||inpts[i].type=="color"||inpts[i].type=="vol"||inpts[i].type=="image"||inpts[i].type=="password"||inpts[i].type=="tel"||inpts[i].type=="time"||inpts[i].type=="url"||inpts[i].type=="week")){
            smrtFill(inpts[i], val, 'value', flag);
            cnt++;
            break;
            }
            if(inpts[i].type=="radio"&&inpts[i].value==val){//why only if the value match? With radios, multiple inputs are linked together via name and has to provide a value to distinguish the choices from each other.
            //inpts[i].checked=true;
            smrtFill(inpts[i], true, 'checked', flag);
            cnt++;
            break;
            }
            if(inpts[i].type=="checkbox"){
              if(val!="false"&&val!=""){
              smrtFill(inpts[i], true, 'checked', flag);
              }
              else{
              smrtFill(inpts[i], false, 'checked', flag);
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
        smrtFill(tas[i], val, 'value', flag);
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
        smrtFill(slcts[i], val, 'value', flag);
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
function fillNMsg(hsh, msg, flag=false){
  if(typeof hsh!="object"){
  return false;
  }
let num=fndNFll(hsh, flag);
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
var curInpt=null;
var dmn=window.location.host;//domain of current page/

document.addEventListener("mouseover", mouseOvrEvnt);
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
//see if floating panel should exist
floatPnlDt(d, d.settings.floatPnl, curPrfl);

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
    fillNMsg(d.profiles[curPrfl], "Autofill ON\r\nFields Filled: ##num##\r\nProfile: "+curPrfl, d.settings.eventFill);
    }
  }
  //if auto fill not on, see if domain is apply list. If so, apply. If not, do nothing.
  else{
    if(isApply){
    //find and fill
    fillNMsg(d.profiles[curPrfl], "Apply List Fill\r\nFields Filled: ##num##\r\nProfile: "+curPrfl, d.settings.eventFill);
    }
  }


//get message from other parts
chrome.runtime.onMessage.addListener(runOnMsg);
});

})();
