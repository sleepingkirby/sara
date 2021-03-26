
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


//main function
function startListen(){
var swtchTbs=document.getElementsByClassName("swtchTb");
var max=swtchTbs.length;
  for(i=0; i<max; i++){
  swtchTbs[i].addEventListener("change",tabSwitch);
  }
}

//fill out the select element 
function fillSlct(id, prof){
  if(!id || id==""){
  return 0; 
  }

  var tmp=null;
  chrome.storage.local.get("profiles", (e)=>{
    if(!e.hasOwnProperty("profiles")){
    return 0;
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

  chrome.storage.local.get({profiles:p, profile_meta:p},function(d){
    
    if(!d.hasOwnProperty("profiles")||!d.hasOwnProperty("profile_meta")){
    return 0;
    }
    if(d.profiles.length<=0||d.profile_meta.length<=0){
    return 0;
    }
    if(!d.profiles.hasOwnProperty(p) || !d.profile_meta.hasOwnProperty(p)){
    return 0;
    }

    var prof=d.profiles[p];
    var meta=d.profile_meta[p];
 
    var tmp=null;
    //this is a depth first tree traversal. Not using recursive due to the high memory involved in recursive functison.
    //using the tail end of stack as the current location 
    var i=0;
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
        rtrn+="<div class=\"prflCtg\"> \
                <div class=\"prflCtgTtl\"><input type=\"text\" value=\""+meta[stack[stack.length-1].n][stack[stack.length-1].i]+"\" /></div> \
                <div class=\"prflGrp\"> \
              ";
        stack.push({n:meta[stack[stack.length-1].n][stack[stack.length-1].i],i:0});
        }
        else{
        //else,it's a leaf node
        //console.log(meta[stack[stack.length-1].n][stack[stack.length-1].i]);
        rtrn+="<div class=\"prflInpt\"><div class=\"prflInptTtl\"><input type=\"text\" value=\""+meta[stack[stack.length-1].n][stack[stack.length-1].i]+"\" /></div> <input type=\"text\" name=\""+meta[stack[stack.length-1].n][stack[stack.length-1].i]+"\" value=\""+getVal(prof,stack,meta[stack[stack.length-1].n][stack[stack.length-1].i])+"\" /> <button>-</button></div>";
        stack[stack.length-1].i = stack[stack.length-1].i +1;
        }
      }
    }
    document.getElementById("prflFrm").innerHTML=rtrn;
  });
}

fillSlct("prflSlct", "");
drawProfiles();
startListen();
