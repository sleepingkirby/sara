
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


function compileOpts(){
var dmn=document.getElementById('applyLstDmn').value;
  if(!dmn || dmn==""){
  return ['',''];
  }
var arr=['applyLstEnbld', 'applyLstBrkJs', 'applyLstStpJs', 'applyLstEvnt', 'applyLstXHR', 'applyLstEvntCst', 'applyLstNtwrk'];
var kv={};
var str=dmn;
var v="";
  for(let idStr of arr){
    var tmpEl=document.getElementById(idStr);
    v=tmpEl.type=="checkbox"?tmpEl.checked:tmpEl.value;
    str+=","+v;
  }
return [dmn,str];
}

//main function
function startListen(){
  document.addEventListener("click", (e) => {
    switch(e.target.getAttribute("act")){
      case 'save':
        //save self
        if( !e.target.hasAttribute("actFor") || e.target.getAttribute("actFor")=="self"){
        var obj={};
        obj[e.target.name]=e.target.type=="checkbox"?e.target.checked:e.target.value;
          chrome.storage.local.set(obj, function(){
            //chrome.storage.local.get(null, function(e){console.log(e);});
          }); 
        break;
        }
    
        //save for element
        var tmpEl=document.getElementById(e.target.getAttribute("actFor"));
        var value=tmpEl.type=="checkbox"?tmpEl.checked:tmpEl.value;
        if(tmpEl.hasAttribute("name")){
        var obj={};
        obj[tmpEl.name]=value;
          chrome.storage.local.set(obj, function(){
            //chrome.storage.local.get(null, function(e){});
            if(e.target.classList.contains("btnChng")){
            e.target.classList.remove("btnChng");
            }
          });
        }
      break;
      case 'convAndAdd':
      var arr=compileOpts();
      var el=document.getElementById("applyLstTA");
      var str=el.value;
     
        if(el.value.includes(arr[0])){
          document.getElementById("applyLstSvMsg").innerText="[x] Domain already exists in list.";
          document.getElementById("applyLstSvMsg").classList.add("toolTipFull");
        break;
        }
 
        if(arr[0]!=""){
        el.value=str+arr[1]+"\n";
        document.getElementById(e.target.getAttribute("savebtn")).classList.add("btnChng");
        }
      break;
      case 'rmClass':
      e.target.classList.remove(e.target.getAttribute("actFor"));
      break;
      case 'clrApply':
      clearApplySetting();
      break;
      case 'pllApply':
      getApplySetting();
      break;
      default:
      break;
    }
  });

  document.addEventListener("input", (e) => {
    switch(e.target.type){
      case 'text':
      var el=e.target;
        if(el.getAttribute("savebtn")){
          document.getElementById(el.getAttribute("savebtn")).classList.add("btnChng");
        }
      break;
      case 'textarea':
      var el=e.target;
        if(el.getAttribute("savebtn")){
          document.getElementById(el.getAttribute("savebtn")).classList.add("btnChng");
        }
      break;
      default:
      break;
    }
  });

  document.addEventListener("mouseover", (e) => {
    switch(e.target.name){
      default:
         if(e.target.hasAttribute('mMsgId') && e.target.hasAttribute('info') ){
          document.getElementById(e.target.getAttribute("mMsgId")).innerText=e.target.getAttribute("info");
          document.getElementById(e.target.getAttribute("mMsgId")).classList.add(e.target.getAttribute("msgClass"));
        }
      break;
    }
  });

  document.addEventListener("mouseout", (e) => {
    switch(e.target.name){
      default:
         if(e.target.hasAttribute('mMsgId') && e.target.hasAttribute('info') ){
          document.getElementById(e.target.getAttribute("mMsgId")).classList.remove(e.target.getAttribute("msgClass"));
        }
      break;
    }
  });

}

//sets the form to values stored in chrome.storage.local
function getSettings(){
  chrome.storage.local.get(null,function(d){
  var tmpEl;
    for(let k in d){
    tmpEl=document.getElementsByName(k);
    
      if(tmpEl.length>=1){
      tmpEl=tmpEl[0];
        if(tmpEl.hasAttribute("type") && tmpEl.type=="checkbox"){
        tmpEl.checked=d[k];
        }
        else{
        tmpEl.value=d[k];
        }
      }
    } 
  });
}

//clears the form in applyList
function getApplySetting(){
document.getElementById("applyLstEnbld").checked=document.getElementById("inptAddOnEn").checked;
document.getElementById("applyLstBrkJs").checked=document.getElementById("breakJs").checked;
document.getElementById("applyLstStpJs").checked=document.getElementById("stopJs").checked;
document.getElementById("applyLstEvnt").checked=document.getElementById("prvntEventLstnr").checked;
document.getElementById("applyLstXHR").checked=document.getElementById("prvntXHR").checked;
document.getElementById("applyLstEvntCst").value=document.getElementById("addLstnTxtInpt").value;
document.getElementById("applyLstNtwrk").value=document.getElementById("addNtwrkTxtInpt").value;
}


//clears the form in applyList
function clearApplySetting(){
document.getElementById("applyLstEnbld").checked=true;
document.getElementById("applyLstDmn").value="";
document.getElementById("applyLstBrkJs").checked=false;
document.getElementById("applyLstStpJs").checked=false;
document.getElementById("applyLstEvnt").checked=false;
document.getElementById("applyLstXHR").checked=false;
document.getElementById("applyLstEvntCst").value="";
document.getElementById("applyLstNtwrk").value="";
}

getSettings();
//running main function
startListen();
