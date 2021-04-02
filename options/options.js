
function setMsg(id,txt){
  document.getElementById(id).innerText+="- "+txt+"\n";
  document.getElementById(id).style.cssText="animation: opac 5s;";
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

//updates the checkbox based off of the select html element
function updtChckBx(selectEl, checkEl){
  if(!selectEl || selectEl=="" || !checkEl|| checkEl==""){
  return null;
  }

  chrome.storage.local.get("settings", (e)=>{
  document.getElementById(checkEl).checked=(e.hasOwnProperty("settings") && e.settings.hasOwnProperty("def_profile") && document.getElementById(selectEl).value==e.settings.def_profile);
  });
}

//requires drawProfiles();
function addPath(arr,val,prf){
  if(!arr||!Array.isArray(arr)){
  return null;
  }

  var err=false;
  //category empty. It's required.
  if(arr[0]==null||arr[0]==""){
  setMsg("msgPrfl", "Category not set in adding new field. Category is required.");
  err=true;
  }

  //if no pattern and there's a value, that's not valid. 
  if((arr[1]==null||arr[1]=="")&&(arr[2]==null||arr[2]=="")&&(arr[3]==null||arr[3]=="")&&val!=null&&val!=""){
  setMsg("msgPrfl", "Value entered for new field, but no pattern was set. At least 1 pattern must accompany value.");
  err=true;
  }

  if(err){
  return null;
  }

//sanitizing the end value
var v=val;
  if(!v||v==null){
  v="";
  }

  

//"sanitizing" the array. Which means removing the empty stuff and adding "root" to the top
var a=["root"];
var i=0;
var max=arr.length;
  while(i<max){
    if(arr[i] && arr[i]!="" && arr[i]!=null){
    a.push(arr[i]);
    }
  i++;
  }

//console.log("=========== starting =========>>");
//console.log(a);
  chrome.storage.local.get({"profiles":null, "profile_meta":null},(d)=>{
  var ref=null;
  //---------------- profiles: adding something new to the profiles tree. traverse and add only when something new is created ---------------
  //profiles the first 2 items is always the root and category, the last is always the value. do nothing on 0,1 and 4
  var i=2;
  var max=a.length;
  var ref=d.profiles[prf];
  var nw=false;
    while(i<max){
      //console.log("================ "+ i +"/"+max+": "+ a[i]+"============>>");
      //console.log(ref);
      if(!ref.hasOwnProperty(a[i])){
      //console.log("created new tier/array");
      ref[a[i]]={};
      //console.log(ref);
      nw=true;
      }
      
      //if it's last item in the array, then apply value v
      //*note* if this path is old, do nothing. Making a rule to not allow redefining old paths or old leaf nodes.
      if(i+1>=max && nw){
      //console.log("applying value: \""+v+"\" to ref");
      //console.log(typeof v);
      ref[a[i]]=v;
      }    
    ref=ref[a[i]];
    i++;
    }

  
  //------------------ profile_meta: do only when something new is added -----------------
  i=0;
  max=a.length-1; //because we're always looking one step ahead
  mnw=false;
  var pos=0; //starting at root
  //d.profile_meta[prf].last; the last index number
  //ex. root0 stat1 car2 model3 --> ""
    while(i<max){
    //console.log("================ "+ i +"/"+max+" \""+pos+"\":"+ a[i]+" next: "+a[i+1]+"============>>");
      //if nw is false, this means that the path provided via patterns is NOT unique. Hence, nothing was done in profiles.
      //as such, short of creating the category, if that's new, we do nothing
      if(i>=1 && !nw){
      //console.log("pattern path not unique. Exitting meta population loop");
      break;
      }
      //if the current location's hash doesn't have the item. Add item to hash and append to ord
      if(!d.profile_meta[prf][pos].hash.hasOwnProperty(a[i+1])){
      //console.log("meta: current pos: "+pos+"'s hash doesn't have \""+a[i+1]+"\"... adding to hash and ord.");

      d.profile_meta[prf].last++; //new index

      //new meta in current node
      d.profile_meta[prf][pos].hash[a[i+1]]=d.profile_meta[prf].last;
      d.profile_meta[prf][pos].ord.push(d.profile_meta[prf].last);
     
      //console.log(d.profile_meta[prf][pos]);
      //new obj for new meta
      d.profile_meta[prf][d.profile_meta[prf].last]={"nm":a[i+1],"ord":[],"hash":{}}; //brand new obj. Nothing in it
      //console.log(d.profile_meta[prf][d.profile_meta[prf].last]);
      mnw=true;
      }
    pos=d.profile_meta[prf][pos].hash[a[i+1]];
    i++;
    }
    /*
    console.log("----------- end --------------");
    console.log(d.profiles[prf]);
    console.log(d.profile_meta[prf]);
    */
    
    chrome.storage.local.set(d,(e)=>{
    drawProfiles(prf);
      if(nw){
      setMsg("msgPrfl", "New field added");
      return null;
      }
      if(mnw){
      setMsg("msgPrfl", "New category added.");
      return null;
      }
      setMsg("msgPrfl", "New field and/or category already exists.");
    });
  });
}

//deletes the field and/or value and/or path
//requires drawProfile() 
function delPath(path, prf){
  
  if(!path || path==null || path==""||!prf||prf==null||prf==""){
  return null;
  }
var p=path;
var arrm=p.split("|"); //turning path into an array
var arr=arrm.slice(2); //removing the first element as that's the category.

  //end if there are no path in meta. Why not profile? In case they're deleting JUST category
  if(arrm.length<=0){
  setMsg("msgPrfl", "No information provided to delete data.");
  return null;
  }

  chrome.storage.local.get({"profiles":null, "profile_meta":null},(d)=>{
  var prof=d.profiles[prf];
  var meta=d.profile_meta[prf];

    //exit if there's nothing to delete
    if(meta.length<=0||Object.keys(prof).length<=0){
    setMsg("msgPrfl", "No data available to delete.");
    return null;
    }

    //translate arr from id's into names for the profiles tree;
    var max=arr.length;
    for(let i=0; i<max; i++){
    arr[i]=meta[arr[i]].nm;
    }

    //this is if just category is being deleted. Natrually, that will mean there's not a path
    //for profiles to delete, but a lot needs to be deleted. This prepares for that.
  var prfBuff=[];
    if(arrm.length==2){
    prfBuff=meta[arrm[1]].ord.slice(0);
    var max=prfBuff.length;
      for(let i=0; i<max; i++){
      prfBuff[i]=meta[prfBuff[i]].nm;
      }
    }

  //================== remove from meta ============================
  var id="";
  var nm="";
    //if arrm has more 2 or more elements, need to modify parent.
    if(arrm.length>=2){
    id=arrm[arrm.length-1];
    nm=meta[arrm[arrm.length-1]].nm;
      if(meta[arrm[arrm.length-2]].hash.hasOwnProperty(nm)){
      //console.log("meta: ====> deleting from parent's id:"+arrm[arrm.length-2]+", parent:"+meta[arrm[arrm.length-2]].nm+", from hash name:"+nm);
      delete meta[arrm[arrm.length-2]].hash[nm];
      //console.log(meta[arrm[arrm.length-2]].hash);
      }
    var max=meta[arrm[arrm.length-2]].ord.length;
      for(let i=0; i<max; i++){
      //console.log("======= meta i:"+i+"/"+max+", "+meta[arrm[arrm.length-2]].ord[i]+" looking for "+id+"   ========");
        if(meta[arrm[arrm.length-2]].ord[i]==id){
        //console.log("matched. Deleting id:"+id+" at index:"+i);
        meta[arrm[arrm.length-2]].ord.splice(i,1); //deleting from array.
        //console.log(meta[arrm[arrm.length-2]]);
        break;//done
        }
      }
    }

    //delete the node in meta and all it's children.
    if(meta.hasOwnProperty(arrm[arrm.length-1]) && arrm[arrm.length-1]!=0){
    //console.log("deleting from meta:"+arrm[arrm.length-1]);
    var buff=[];
    var i=null;
    buff=buff.concat(meta[arrm[arrm.length-1]].ord);
    //console.log(" initial buff:");
    //console.log(arrm);
    //console.log(buff);
    delete meta[arrm[arrm.length-1]];
      while(buff.length>=1){
      i=buff.shift();
      //console.log("adding id:"+i+", name:"+meta[i].nm+"'s children to buffer. Deleting said node");
      buff=buff.concat(meta[i].ord);
      delete meta[i];
      }
    }

  //================== removing from profiles ======================
  var ref=prof;
  var pRef=prof;
  var pId="";
  var max=arr.length;
  //console.log(ref);
    for(let i=0;i<max;i++){
    //console.log("======= profiles i:"+i+"/"+max+", "+arr[i]+" ========");
    //console.log(arr);
    //console.log(ref);
      if((i+1)==max&&ref.hasOwnProperty(arr[i])){
      delete ref[arr[i]];
      console.log(ref);
      console.log(Object.keys(ref).length);
        if(Object.keys(ref).length<=0 && max>=2){
        pRef[pId]="";
        }
      //console.log(prof);
      break;
      }
      if(ref.hasOwnProperty(arr[i])){
      pId=arr[i];
      pRef=ref;
      ref=ref[arr[i]];
      }
    } 

  //removing from profiles when only category was deleted
  //console.log(prfBuff);
  var max=prfBuff.length;
    for(let i=0;i<max;i++){
    delete prof[prfBuff[i]];
    }

    chrome.storage.local.set(d,(e)=>{
    drawProfiles(prf); 
    });
  });
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

//msg div listener
var msgPrfl=document.getElementById("msgPrfl");
  msgPrfl.addEventListener("animationend", ()=>{
  msgPrfl.innerText="";
  msgPrfl.style.cssText="";
  });


  document.addEventListener("click", (e)=>{
    switch(e.target.getAttribute("act")){
      case "newPrfl":
      //add new profile to chrome.storage. Redraw page.
      var el=document.getElementById(e.target.getAttribute("forEl"));
        if(el && el.value && el.value!=""){
          chrome.storage.local.get({"profiles":null, "profile_meta":null}, (d)=>{
          d.profiles[el.value]={};
          d.profile_meta[el.value]={0:{"nm":"root","ord":[],"hash":{}},last:0};
            chrome.storage.local.set(d,(e)=>{
            fillSlct("prflSlct", getURLVar());
            alert("New Profile Added.");
            });
          });
        }
      break;
      case "delPrfl":
        chrome.storage.local.get({"profiles":null, "profile_meta":null},(d)=>{
        var el=document.getElementById(e.target.getAttribute("forEl"));
        var ans=confirm("Are you sure you want to delete the profile: \""+el.value+"\"");
          if(ans){
            delete d.profiles[el.value];
            delete d.profile_meta[el.value];
              chrome.storage.local.set(d, (e)=>{
              fillSlct("prflSlct", getURLVar());
              drawProfiles();
              });
            }
        });
      break;
      case "newDflt":
      //updates settings for def_profile to new profile name
      let fr=e.target.getAttribute("forEl");
      let val=document.getElementById(fr).value;
        chrome.storage.local.get("settings", (e)=>{
          e.settings.def_profile=val;
          chrome.storage.local.set({"settings":e.settings});
        });
      break;
      case "newFld":
      //adds new Fld to profiles, update meta_profile, redraw page.
      var el=document.getElementById("prflNewFrm");
      var cllct=el.getElementsByTagName("input");
      var i=0;
      var max=cllct.length;
      var obj={};
        while(i<max){
        obj[cllct[i].name]=cllct[i].value;
        i++;
        }
      var arr=[obj["new[categ]"],obj["new[patt1]"],obj["new[patt2]"],obj["new[patt3]"]]; 
      var curPrf=document.getElementById("prflSlct").value;
      addPath(arr, obj["new[val]"], curPrf); 
      break;
      case "rmFld":
      //removes field from profiles, remove from meta_profile, redraw page.
      var curPrf=document.getElementById("prflSlct").value;
      delPath(e.target.getAttribute("forInpt"),curPrf); 
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
      case "updtDrwPrfl":
      drawProfiles(e.target.value);
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
    if(!e.hasOwnProperty("profiles") || e.profiles==null){
    return 0;
    }

    //if(prf=="" && e.settings!=null && e.settings.hasOwnProperty("def_profile")){ I tried to check like this but this gives an error. that e.settings
    if(prf=="" && e.settings!=null && e.settings.hasOwnProperty("def_profile")){
    prof=e.settings.def_profile;
    }
  var arr=Object.keys(e.profiles);
  var tmp=null;
  var slct=document.getElementById(id);
  slct.textContent=null;
    for(let i of arr){
    tmp=document.createElement("option");
    tmp.innerText=i;
    tmp.value=i;
      if(i==prof){
      tmp.selected=true;
      }
    slct.appendChild(tmp);
    }
  
  updtChckBx("prflSlct", "prflDflt");
  });
}

//get value from profile data object and stack
function getVal(prf, meta, stk, leaf){
  if(!prf || !meta || !stk || !leaf){
  
  return null;
  }

  //root should always be there. Assume that
  //if there is only root or less, do nothing  
  if(stk.length<1){
  return null;
  }


var val=prf;
  for(i=1; i<stk.length; i++){
    if(val.hasOwnProperty(meta[stk[i].n].nm)){
    val=val[meta[stk[i].n].nm];
    }
  }
 
  if(val.hasOwnProperty(meta[leaf].nm)){
  return val[meta[leaf].nm];
  }

return null;
}

/*---------------------------------
pre: stack structured by drawProfiles()
post: none
generate path string. For the javascript to know where the items is in the hash trees.
---------------------------------*/ 
function genStkPath(stk, leaf){
var tkn="|";
var rtrn="";
//assume root is there. if not, return nothing.
  if(!leaf || leaf=="" || !stk || stk.length<=0||stk[0].n!="0"){
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
  stack.push({n:0,i:0});

    if(!prof || prof==""){
    p=settings.def_profile;
    }

    document.getElementById("prflFrm").textContent="";

    if(Object.keys(prof).length<=0||Object.keys(meta).length<=0){
    return 0;
    }

    var tmp=null;
    //this is a depth first tree traversal. Not using recursive due to the high memory involved in recursive functison.
    //using the tail end of stack as the current location 
    var i=0;
    var idNum=1;
    var idPre="stdPath";
    while(stack.length>0){

      //if current location's index is beyond the arr.length, pop the stack
      if(stack[stack.length-1].i>(meta[stack[stack.length-1].n].ord.length-1)){
      stack.pop();
        if(stack.length>0){
        stack[stack.length-1].i = stack[stack.length-1].i +1;
        }
      rtrn+="    </div> \
            </div> \
            ";
      }
      else{
        //if the current location and index is object and hash and ord is not empty, push to stack.
        //assume first item is always a category
        var curId=meta[stack[stack.length-1].n].ord[stack[stack.length-1].i];
        if(meta.hasOwnProperty(curId) && ((meta[curId].ord.length>0 && Object.keys(meta[curId].hash).length>0)||stack.length<=1)){
        idNum++;
        var pathId=genStkPath(stack, curId);
        //idObj[pathIndx]=pathTtl;
        var ttlVal=meta[curId].nm;
        rtrn+="<div class=\"prflCtg\"> \
                <div class=\"prflCtgTtlWrap\"> \
                  <div class=\"prflCtgTtl\"> \
                    <input id=\""+pathId+"\" type=\"text\" value=\""+ttlVal+"\" /> \
                  </div> \
                  <button act=\"rmFld\" forInpt=\""+pathId+"\">-</button> \
                </div> \
                <div class=\"prflGrp\"> \
              ";
        stack.push({n:curId,i:0});
        }
        else{
        //else,it's a leaf node
        //console.log(meta[stack[stack.length-1].n][stack[stack.length-1].i]);
        idNum++;
        var pathId=genStkPath(stack, curId);
        var ttlVal=meta[curId].nm;
        rtrn+="<div class=\"prflInpt\"><div class=\"prflInptTtl\"><input id=\""+pathId+"\" type=\"text\" value=\""+ttlVal+"\" /></div> <input forInpt=\""+pathId+"\" type=\"text\" name=\""+curId+"\" value=\""+getVal(prof,meta,stack,curId)+"\" /> <button act=\"rmFld\" forInpt=\""+pathId+"\">-</button></div>";
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
