
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



//draw Profiles page
function drawProfiles(prof){
var p=prof;
var elId="prflFrm";
var stack=[];
stack.push({n:"root",i:0});
  if(!prof || prof==""){
  p="default";
  }

  chrome.storage.local.get({profiles:p, profile_meta:p},function(d){
    var prof=d.profiles[p];
    var meta=d.profile_meta[p];
    
    var tmp=null;
    //this is a depth first tree traversal. Not using recursive due to the high memory involved in recursive functison.
    //using the tail end of stack as the current location 
    //while(stack.length>0){
    while(stack.length>0){

      //if current location's index is beyond the arr.length, pop the stack
      if(stack[stack.length-1].i>(meta[stack[stack.length-1].n].length-1)){
      stack.pop();
        if(stack.length>0){
        stack[stack.length-1].i = stack[stack.length-1].i +1;
        }
      }
      else{
        //if the current location and index is object, push to stack.
        if(meta.hasOwnProperty(meta[stack[stack.length-1].n][stack[stack.length-1].i])){
        stack.push({n:meta[stack[stack.length-1].n][stack[stack.length-1].i],i:0});
        }
        else{
        //else,it's a leaf node
        console.log(meta[stack[stack.length-1].n][stack[stack.length-1].i]);
        stack[stack.length-1].i = stack[stack.length-1].i +1;
        }
      }
    }
  });
}

drawProfiles();
startListen();
