// ==UserScript==
// @name         Shelf-Life Monitor: send the BIP Buyer ID back
// @namespace    https://teerawatsinlee2543-art.github.io/makro-finder/
// @version      1.3
// @description  (1) Reads "Buyer ID" off the BIP Item Enquiry report and sends it back to the Shelf-Life Monitor page that opened this window (nothing is sent anywhere else). (2) On the Daily_StockMovement_Store_14_Days report opened from the "Stock Movement 14 วัน" button, fills in Store 42 and the Item No. and presses Apply. (3) A small zoom bar (− + ⤢ fit width) in both BIP windows.
// @match        http://bip-app.siammakro.co.th:9714/*
// @match        http://raadw-app.siammakro.co.th:7777/*
// @grant        none
// @run-at       document-idle
// @downloadURL  https://teerawatsinlee2543-art.github.io/makro-finder/bip-buyer.user.js
// @updateURL    https://teerawatsinlee2543-art.github.io/makro-finder/bip-buyer.user.js
// ==/UserScript==
(function () {
  'use strict';
  function slmBipSender(origin,once){
    var seen='',chip=null;
    function say(m,ok){if(!document.body)return;if(!chip){chip=document.createElement('div');chip.style.cssText='position:fixed;right:8px;bottom:8px;z-index:99999;padding:5px 12px;border-radius:8px;font:13px sans-serif;color:#fff;box-shadow:0 2px 8px #0005';document.body.appendChild(chip)}chip.style.background=ok?'#1f7a45':'#555';chip.textContent=m}
    function texts(){var o=[document.body?document.body.innerText:''],f=document.querySelectorAll('iframe'),i,d;for(i=0;i<f.length;i++){try{d=f[i].contentDocument;if(d&&d.body)o.push(d.body.innerText)}catch(e){}}return o.join('\n')}
    function read(){var t=texts(),b=t.match(/Buyer ID:?\s*([A-Za-z0-9]{2,12})\b/),m=t.match(/(?:^|\n)\s*Item:\s*(\d{3,9})\b/);if(!b||!m)return null;var u=b[1].toUpperCase();if(u==='BUYER'||u==='NAME')return null;return{item:m[1],buyerId:u}}
    function send(){
      var r=read();
      if(!r){say('Shelf-Life: รอรายงานโหลด — ยังไม่พบ Buyer ID ในหน้านี้');return false}
      var k=r.item+':'+r.buyerId;
      if(k!==seen){
        seen=k;
        if(!window.opener){say('Shelf-Life: หน้านี้ไม่ได้ถูกเปิดจากปุ่ม Item Enquiry (ไม่มีหน้าต้นทางให้ส่งค่ากลับ) — Buyer ID = '+r.buyerId);return true}
        try{window.opener.postMessage({type:'slm-bip-buyer',v:1,item:r.item,buyerId:r.buyerId},origin);say('Shelf-Life: ส่ง Buyer ID '+r.buyerId+' (Item '+r.item+') แล้ว ✓',true)}catch(e){say('Shelf-Life: ส่งไม่สำเร็จ '+e)}
      }
      return true;
    }
    say('Shelf-Life: สคริปต์ทำงานแล้ว — รอรายงานโหลด…');
    if(once){send();return}
    var n=0,iv=setInterval(function(){send();if(++n>400)clearInterval(iv)},1500);
  }
  /* Stock Movement report: the Shelf-Life Monitor opens it as ...Daily_StockMovement_Store_14_Days.xdo#slm=<Item No>. The part after # never leaves this browser.
     Store "42 …" is chosen, the Item No. typed into the "Item (*)" box and Apply pressed, once per Item No. (and again when the button is pressed for another item). */
  function slmFillReport(){
    var chip=null,done='',tries=0,iv=null;
    function say(m,ok){if(!document.body)return;if(!chip){chip=document.createElement('div');chip.style.cssText='position:fixed;right:8px;bottom:8px;z-index:99999;padding:5px 12px;border-radius:8px;font:13px sans-serif;color:#fff;box-shadow:0 2px 8px #0005';document.body.appendChild(chip)}chip.style.background=ok?'#1f7a45':'#555';chip.textContent=m}
    function wanted(){var m=String(location.hash).match(/slm=(\d{3,9})\b/);return m?m[1]:''}
    function docs(){var o=[document],f=document.querySelectorAll('iframe'),i;for(i=0;i<f.length;i++){try{if(f[i].contentDocument&&f[i].contentDocument.body)o.push(f[i].contentDocument)}catch(e){}}return o}
    /* the first field after a label whose own text is e.g. "Item (*)" */
    function fieldAfter(d,re,sel){
      var all=d.querySelectorAll('td,th,label,span,div,b'),i,e,t,j,c,lab=null;
      for(i=0;i<all.length&&!lab;i++){e=all[i];t='';for(j=0;j<e.childNodes.length;j++)if(e.childNodes[j].nodeType===3)t+=e.childNodes[j].nodeValue;if(re.test(t.replace(/\s+/g,' ').trim()))lab=e}
      if(!lab)return null;
      c=d.querySelectorAll(sel);
      for(i=0;i<c.length;i++)if(lab.compareDocumentPosition(c[i])&4)return c[i];
      return null}
    function setVal(el,v){
      var proto=el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,d=Object.getOwnPropertyDescriptor(proto,'value');
      if(d&&d.set)d.set.call(el,v);else el.value=v;
      ['input','change','blur'].forEach(function(n){el.dispatchEvent(new Event(n,{bubbles:true}))})}
    function applyBtn(d){
      var b=d.querySelectorAll('input[type=button],input[type=submit],button,a'),i,t;
      for(i=0;i<b.length;i++){t=(b[i].value||b[i].textContent||'').replace(/\s+/g,' ').trim();if(/^Apply$/i.test(t))return b[i]}
      return d.getElementById('reportViewApply')||null}
    function attempt(item){
      var ds=docs(),i,d,box=null,st=null,btn=null;
      for(i=0;i<ds.length&&!box;i++){d=ds[i];box=fieldAfter(d,/^Item\s*\(\*\)\s*:?$/i,'input[type=text],input:not([type])');if(box){st=fieldAfter(d,/^Store\s*\(\*\)\s*:?$/i,'select');btn=applyBtn(d)}}
      if(!box)return false;
      if(st){var k,o=st.options;for(k=0;k<o.length;k++)if(/^\s*42\b/.test(o[k].text)){if(st.selectedIndex!==k)setVal(st,o[k].value);break}}
      setVal(box,item);
      /* give the page a moment to react to the changes (a Store change can reload the Item field) before pressing Apply */
      setTimeout(function(){var b2=btn;if(!b2)for(var j=0;j<ds.length&&!b2;j++)b2=applyBtn(ds[j]);
        var box2=null;for(var q=0;q<ds.length&&!box2;q++)box2=fieldAfter(ds[q],/^Item\s*\(\*\)\s*:?$/i,'input[type=text],input:not([type])');
        if(box2&&box2.value!==item)setVal(box2,item);
        if(b2){b2.click();say('Shelf-Life: กรอก Item '+item+' แล้ว และกด Apply ให้ ✓',true)}else say('Shelf-Life: กรอก Item '+item+' แล้ว — กด Apply เอง (ไม่พบปุ่ม Apply)',true)},900);
      return true}
    function tick(){
      var item=wanted();if(!item){say('Shelf-Life: สคริปต์ทำงานแล้ว — เปิดหน้านี้จากปุ่ม “Stock Movement 14 วัน” เพื่อให้กรอก Item ให้เอง');return}
      if(done===item)return;
      if(attempt(item)){done=item;tries=0;return}
      if(++tries<60)say('Shelf-Life: รอฟอร์มรายงานโหลด — จะกรอก Item '+item+' ให้');else say('Shelf-Life: ไม่พบช่อง “Item (*)” ในหน้านี้ — พิมพ์ Item '+item+' เอง')}
    window.addEventListener('hashchange',function(){done='';tries=0});
    tick();iv=setInterval(function(){tick();if(done&&!/slm=/.test(location.hash))clearInterval(iv)},700);
  }
  /* a small zoom bar (− 100% + ⤢) in the corner of both BIP windows: the reports are wide, so the right side (Buyer ID block, contacts) is cut off in the side window.
     "⤢" shrinks the page until its width fits the window; the level is remembered for the next time. Pinch / Ctrl + wheel / Ctrl +− of Chrome still work as usual. */
  function slmZoomBar(){
    var KEY='slmZoom',z=1,bar,pct;
    try{var s=parseFloat(localStorage.getItem(KEY));if(s>=.25&&s<=3)z=s}catch(e){}
    function apply(v){
      z=Math.max(.25,Math.min(3,Math.round(v*100)/100));
      document.documentElement.style.zoom=z===1?'':String(z);
      if(bar)bar.style.zoom=String(1/z);   // the bar itself keeps its size
      if(pct)pct.textContent=Math.round(z*100)+'%';
      try{localStorage.setItem(KEY,String(z))}catch(e){}}
    function fit(){
      var de=document.documentElement,old=de.style.zoom;de.style.zoom='';
      var w=Math.max(de.scrollWidth,document.body?document.body.scrollWidth:0),vw=window.innerWidth;
      de.style.zoom=old;
      apply(w>vw?Math.floor(vw/w*20)/20:1)}
    function btn(t,title,fn){var b=document.createElement('button');b.type='button';b.textContent=t;b.title=title;b.style.cssText='border:0;background:transparent;color:#fff;font:700 15px sans-serif;min-width:28px;height:26px;cursor:pointer;border-radius:6px';b.onmouseenter=function(){b.style.background='#fff3'};b.onmouseleave=function(){b.style.background='transparent'};b.onclick=fn;return b}
    function build(){
      if(!document.body||bar)return;
      bar=document.createElement('div');
      bar.style.cssText='position:fixed;left:8px;bottom:8px;z-index:99999;display:flex;align-items:center;gap:2px;padding:3px 6px;border-radius:10px;background:#000b;box-shadow:0 2px 8px #0005;font:13px sans-serif;color:#fff;user-select:none';
      pct=document.createElement('span');pct.style.cssText='min-width:42px;text-align:center;cursor:pointer';pct.title='กลับเป็น 100%';pct.onclick=function(){apply(1)};
      bar.appendChild(btn('−','ซูมออก',function(){apply(z-.1)}));bar.appendChild(pct);bar.appendChild(btn('+','ซูมเข้า',function(){apply(z+.1)}));bar.appendChild(btn('⤢','พอดีความกว้างหน้าต่าง',fit));
      document.body.appendChild(bar);apply(z)}
    build();var n=0,iv=setInterval(function(){build();if(bar||++n>40)clearInterval(iv)},500);
  }
  slmZoomBar();
  if(/raadw-app/i.test(location.hostname)){
    slmFillReport();
  }else{
    // the Shelf-Life Monitor page is the only recipient
    slmBipSender('https://teerawatsinlee2543-art.github.io', false);
  }
})();
