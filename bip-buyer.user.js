// ==UserScript==
// @name         Shelf-Life Monitor: send the BIP Buyer ID back
// @namespace    https://teerawatsinlee2543-art.github.io/makro-finder/
// @version      1.0
// @description  Reads "Buyer ID" off the BIP Item Enquiry report and sends it back to the Shelf-Life Monitor page that opened this window (nothing is sent anywhere else).
// @match        http://bip-app.siammakro.co.th:9714/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
(function () {
  'use strict';
  var ORIGIN = 'https://teerawatsinlee2543-art.github.io'; // the Shelf-Life Monitor page (the only recipient)
  var seen = '';
  function note(m) {
    var d = document.createElement('div');
    d.textContent = m;
    d.style.cssText = 'position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:99999;background:#1f7a45;color:#fff;padding:6px 14px;border-radius:8px;font:14px sans-serif';
    document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 2600);
  }
  function texts() {
    var o = [document.body ? document.body.innerText : ''], f = document.querySelectorAll('iframe'), i, d;
    for (i = 0; i < f.length; i++) { try { d = f[i].contentDocument; if (d && d.body) o.push(d.body.innerText); } catch (e) {} }
    return o.join('\n');
  }
  function read() {
    var t = texts(), b = t.match(/Buyer ID:?\s*([A-Za-z0-9]{2,12})\b/), m = t.match(/(?:^|\n)\s*Item:\s*(\d{3,9})\b/);
    if (!b || !m) return null;
    var u = b[1].toUpperCase();
    if (u === 'BUYER' || u === 'NAME') return null;
    return { item: m[1], buyerId: u };
  }
  function send() {
    var r = read();
    if (!r) return false;
    var k = r.item + ':' + r.buyerId;
    if (k !== seen) {
      seen = k;
      if (window.opener) {
        try {
          window.opener.postMessage({ type: 'slm-bip-buyer', v: 1, item: r.item, buyerId: r.buyerId }, ORIGIN);
          note('Buyer ID ' + r.buyerId + ' → Shelf-Life Monitor');
        } catch (e) {}
      }
    }
    return true;
  }
  var n = 0, iv = setInterval(function () { send(); if (++n > 400) clearInterval(iv); }, 1500);
})();
