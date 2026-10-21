// ==UserScript==
// @name         Shelf-Life Monitor: send the BIP Buyer ID back
// @namespace    https://teerawatsinlee2543-art.github.io/makro-finder/
// @version      1.1
// @description  Reads "Buyer ID" off the BIP Item Enquiry report and sends it back to the Shelf-Life Monitor page that opened this window (nothing is sent anywhere else).
// @match        http://bip-app.siammakro.co.th:9714/*
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
  // the Shelf-Life Monitor page is the only recipient
  slmBipSender('https://teerawatsinlee2543-art.github.io', false);
})();
