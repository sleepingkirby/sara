
function setMsg(el){
    document.getElementById(el.getAttribute("msgId")).innerText=el.getAttribute("info");
    document.getElementById(el.getAttribute("msgId")).style=el.getAttribute("msgStyl");
}

function clearMsg(el){
    document.getElementById(el.getAttribute("msgId")).innerText="";
    document.getElementById(el.getAttribute("msgId")).style="";
}


//gets hostname from url
function hostFromURL(str){
var rtrn=str;
var proto=rtrn.match(/[a-z]+:\/\/+/g);
rtrn=rtrn.substr(proto[0].length,rtrn.length);
var end=rtrn.search('/');
  if(end<0){
  rtrn=rtrn.substr(0,end);
  }
return rtrn;
}

function getURLVar(){
var url=window.location.href;
var i=url.indexOf("?");
  if(i<0){
  return "";
  }
var vNm=url.substr(i+1);
return vNm;
}


function tabSwitch(e){
var el=e.target;
var id=el.getAttribute("tabMain");
var nm=document.getElementsByName("switchTab");
var max=nm.length;
  for(i=0;i<max;i++){
  document.getElementById(nm[i].getAttribute("tabMain")).classList.remove("mainOn");
  }
document.getElementById(id).classList.toggle("mainOn");
}

//
function updtChckBx(selectEl, checkEl){
  if(!selectEl || selectEl=="" || !checkEl|| checkEl==""){
  return null;
  }


  if(settings && settings.hasOwnProperty("def_profile")){
    document.getElementById(checkEl).checked=(settings.hasOwnProperty("def_profile") && document.getElementById(selectEl).value==settings.def_profile);
  }
  else{
    chrome.storage.local.get("settings", (e)=>{
    document.getElementById(checkEl).checked=(e.hasOwnProperty("settings") && e.settings.hasOwnProperty("def_profile") && document.getElementById(selectEl).value==e.settings.def_profile);
    });
  }
}

//main function
function startListen(){
var swtchTbs=document.getElementsByClassName("swtchTb");
var max=swtchTbs.length;
  for(i=0; i<max; i++){
  swtchTbs[i].addEventListener("change",tabSwitch);
  }
var prflSlct=document.getElementById("prflSlct");
//for indicating the drop down for profiles is currently selected as the default profile.
prflSlct.addEventListener("change", (e)=>{updtChckBx("prflSlct", "prflDflt");});

  document.addEventListener("click", (e)=>{
    switch(e.target.getAttribute("act")){
      case "newPrfl":
      //add new profile to chrome.storage. Redraw page.
      break;
      case "newDflt":
      //updates settings for def_profile to new profile name
      break;
      case "newFld":
      //adds new Fld to profiles, update meta_profile, redraw page.
      break;
      case "rmFld":
      //removes field from profiles, remove from meta_profile, redraw page.
      break;
      case "imprtClr":
      //clear textarea
      break;
      case "imprtExprt":
      //post JSON.stringify of chrome storage
      break;
      case "imprtImprt":
      //convert json to object and import to chrome storage
      break;
      default:
      break;
    }
  });

  document.addEventListener("input", (e)=>{
    switch(e.target.getAttribute("act")){
      case "updtFld":
      //updates value for field in updates. 
      break;
      case "rnFld":
      //path was renamed. copy old to new name. 
      break;
      default:
      break;
    }
  });
}

//fill out the select element 
function fillSlct(id, prf){
  if(!id || id==""){
  return 0; 
  }

  var prof=prf;

  var tmp=null;
  chrome.storage.local.get({"profiles":null, "settings":null}, (e)=>{
    if(!e.hasOwnProperty("profiles")){
    return 0;
    }
    if(prf==""){
    prof=e.settings.def_profile;
    }
  var arr=Object.keys(e.profiles);
  var tmp=null;
  var slct=document.getElementById(id);
    for(let i of arr){
    tmp=document.createElement("option");
    tmp.innerText=i;
    tmp.value=i;
      if(i==prof){
      tmp.selected=true;
      }
    slct.appendChild(tmp);
    }
  });
}

//get value from profile data object and stack
function getVal(prf, stk, leaf){
  if(!prf || !stk || !leaf){
  return null;
  }

  //root should always be there. Assume that
  //if there is only root or less, do nothing  
  if(stk.length<1){
  return null;
  }


var val=prf;
  for(i=1; i<stk.length; i++){
    if(val.hasOwnProperty(stk[i].n)){
    val=val[stk[i].n];
    }
  }
 
  if(val.hasOwnProperty(leaf)){
  return val[leaf];
  }

return null;
}

/*---------------------------------
pre: stack structured by drawProfiles()
post: none
generate path string. For the javascript to know where the items is in the hash trees.
---------------------------------*/ 
function genStkPath(stk, leaf){
var tkn="|||";
var rtrn="";
 
//assume root is there. if not, return nothing.
  if(!leaf || leaf=="" || !stk || stk.length<=0||stk[0].n!="root"){
  return "";
  }

var i=0;
var max=stk.length
var t="";
  while(i<max){
    rtrn+=t+stk[i].n;
    t=tkn;
  i++;
  }
return rtrn+t+leaf;
}



//draw Profiles page
function drawProfiles(prof){
var p=prof;
var elId="prflFrm";
var stack=[];
var rtrn="";
stack.push({n:"root",i:0});
  if(!prof || prof==""){
  p="default";
  }

  chrome.storage.local.get(null,function(d){
    
    if(!d.hasOwnProperty("profiles")||!d.hasOwnProperty("profile_meta")){
    return 0;
    }
    if(d.profiles.length<=0||d.profile_meta.length<=0){
    return 0;
    }
    if(!d.profiles.hasOwnProperty(p) || !d.profile_meta.hasOwnProperty(p)){
    return 0;
    }

    prof=d.profiles[p];
    meta=d.profile_meta[p];
    settings=d.settings; 

    var tmp=null;
    //this is a depth first tree traversal. Not using recursive due to the high memory involved in recursive functison.
    //using the tail end of stack as the current location 
    var i=0;
    var idNum=1;
    var idPre="stdPath";
    while(stack.length>0){

      //if current location's index is beyond the arr.length, pop the stack
      if(stack[stack.length-1].i>(meta[stack[stack.length-1].n].length-1)){
      stack.pop();
        if(stack.length>0){
        stack[stack.length-1].i = stack[stack.length-1].i +1;
        }
      rtrn+="    </div> \
            </div> \
            ";
      }
      else{
        //if the current location and index is object, push to stack.
        if(meta.hasOwnProperty(meta[stack[stack.length-1].n][stack[stack.length-1].i])){
        var pathIndx=idPre+idNum;
        idNum++;
        var pathTtl=genStkPath(stack, meta[stack[stack.length-1].n][stack[stack.length-1].i]);
        idObj[pathIndx]=pathTtl;
        rtrn+="<div class=\"prflCtg\"> \
                <div class=\"prflCtgTtlWrap\"> \
                  <div class=\"prflCtgTtl\"> \
                    <input id=\""+pathIndx+"\" type=\"text\" value=\""+meta[stack[stack.length-1].n][stack[stack.length-1].i]+"\" /> \
                  </div> \
                  <button action=\"remove\" forInpt=\""+pathIndx+"\">-</button> \
                </div> \
                <div class=\"prflGrp\"> \
              ";
        stack.push({n:meta[stack[stack.length-1].n][stack[stack.length-1].i],i:0});
        }
        else{
        //else,it's a leaf node
        //console.log(meta[stack[stack.length-1].n][stack[stack.length-1].i]);
        var pathIndx=idPre+idNum;
        idNum++;
        var pathVar=genStkPath(stack, meta[stack[stack.length-1].n][stack[stack.length-1].i]);
        idObj[pathIndx]=pathVar;
        rtrn+="<div class=\"prflInpt\"><div class=\"prflInptTtl\"><input id=\""+pathIndx+"\" type=\"text\" value=\""+meta[stack[stack.length-1].n][stack[stack.length-1].i]+"\" /></div> <input forInpt=\""+pathIndx+"\" type=\"text\" name=\""+meta[stack[stack.length-1].n][stack[stack.length-1].i]+"\" value=\""+getVal(prof,stack,meta[stack[stack.length-1].n][stack[stack.length-1].i])+"\" /> <button action=\"remove\" forInpt=\""+pathIndx+"\">-</button></div>";
        stack[stack.length-1].i = stack[stack.length-1].i +1;
        }
      }
    }
    document.getElementById("prflFrm").innerHTML=rtrn;
  });
}

var urlPrf=getURLVar();
var meta=null;
var prof=null;
var settings=null;
var idObj={};

fillSlct("prflSlct", urlPrf);
updtChckBx("prflSlct", "prflDflt");
drawProfiles(urlPrf);
startListen();
