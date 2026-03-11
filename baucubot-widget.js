/**
 * BauCuBot Widget v1.0
 * Nhúng chat bot bầu cử vào bất kỳ website nào
 *
 * CÁCH DÙNG:
 * <script src="baucubot-widget.js"></script>
 * <script>
 *   BauCuBot.init({
 *     webapp_url : 'https://script.google.com/macros/s/.../exec',
 *     position   : 'bottom-right',   // hoặc 'bottom-left'
 *     color      : '#C8001A',         // màu nút & header
 *     logo       : 'https://...',     // URL ảnh logo (tuỳ chọn)
 *     title      : 'Hỏi đáp Bầu cử', // tiêu đề trên header
 *     subtitle   : 'Trợ lý AI · Luôn sẵn sàng',
 *     greeting   : 'Xin chào! Tôi có thể hỗ trợ gì cho bạn?',
 *     offset_x   : 24,               // px từ cạnh ngang
 *     offset_y   : 24,               // px từ cạnh dưới
 *   });
 * </script>
 */

(function (global) {
  'use strict';

  /* ─── Guard: chỉ init 1 lần ─── */
  if (global.BauCuBot && global.BauCuBot._ready) return;

  const BauCuBot = {};

  BauCuBot.init = function (cfg) {
    if (BauCuBot._ready) return;
    BauCuBot._ready = true;

    /* ─── Config defaults ─── */
    const C = {
      webapp_url : cfg.webapp_url || '',
      position   : cfg.position   || 'bottom-right',
      color      : cfg.color      || '#C8001A',
      logo       : cfg.logo       || '',
      title      : cfg.title      || 'Hỏi đáp Bầu cử 2026',
      subtitle   : cfg.subtitle   || 'Trợ lý AI · Luôn sẵn sàng',
      greeting   : cfg.greeting   || 'Xin chào Anh/Chị! Tôi có thể hỗ trợ gì ạ?',
      offset_x   : cfg.offset_x   !== undefined ? cfg.offset_x : 24,
      offset_y   : cfg.offset_y   !== undefined ? cfg.offset_y : 24,
      hide_header: cfg.hide_header !== false,
      width      : cfg.width      || 390,
      height     : cfg.height     || 620,
    };

    if (!C.webapp_url) {
      console.warn('[BauCuBot] Thiếu webapp_url — widget không thể khởi động.');
      return;
    }

    const isLeft  = C.position === 'bottom-left';
    const hx      = isLeft ? 'left' : 'right';
    let   isOpen  = false;
    let   greeted = false;

    /* ─── Inject CSS ─── */
    const style = document.createElement('style');
    style.textContent = `
      #bcb-root *, #bcb-root *::before, #bcb-root *::after { box-sizing: border-box; margin: 0; padding: 0; }

      /* ── BUBBLE BUTTON ── */
      #bcb-btn {
        position: fixed;
        ${hx}: ${C.offset_x}px;
        bottom: ${C.offset_y}px;
        z-index: 2147483646;
        width: 60px; height: 60px;
        border-radius: 50%;
        background: ${C.color};
        border: none; cursor: pointer;
        box-shadow: 0 4px 20px rgba(0,0,0,0.25), 0 0 0 0 ${C.color}66;
        display: flex; align-items: center; justify-content: center;
        transition: transform .2s ease, box-shadow .2s ease;
        animation: bcb-pulse 3s ease-in-out infinite;
      }
      #bcb-btn:hover {
        transform: scale(1.08);
        box-shadow: 0 6px 28px rgba(0,0,0,0.30);
        animation: none;
      }
      @keyframes bcb-pulse {
        0%, 100% { box-shadow: 0 4px 20px rgba(0,0,0,0.25), 0 0 0 0 ${C.color}55; }
        50%       { box-shadow: 0 4px 20px rgba(0,0,0,0.25), 0 0 0 10px ${C.color}00; }
      }
      #bcb-btn svg { width: 28px; height: 28px; fill: #fff; transition: opacity .2s; }
      #bcb-btn .bcb-ico-close { display: none; }
      #bcb-btn.open .bcb-ico-chat  { display: none; }
      #bcb-btn.open .bcb-ico-close { display: block; }
      #bcb-btn img.bcb-logo {
        width: 38px; height: 38px;
        border-radius: 50%; object-fit: cover;
      }

      /* ── GREETING BUBBLE ── */
      #bcb-greet {
        position: fixed;
        ${hx}: ${C.offset_x + 70}px;
        bottom: ${C.offset_y + 8}px;
        z-index: 2147483645;
        background: #fff;
        color: #1a1a2e;
        font-family: -apple-system, 'Segoe UI', sans-serif;
        font-size: 14px; line-height: 1.45;
        padding: 10px 14px 10px 16px;
        border-radius: 18px 18px ${isLeft ? '18px 4px' : '4px 18px'};
        box-shadow: 0 4px 20px rgba(0,0,0,0.13);
        max-width: 230px;
        display: flex; align-items: flex-start; gap: 8px;
        animation: bcb-slideIn .35s cubic-bezier(.22,.68,0,1.3) both;
      }
      #bcb-greet span { flex: 1; }
      #bcb-greet-close {
        cursor: pointer; opacity: .45; font-size: 18px; line-height: 1;
        flex-shrink: 0; margin-top: -1px;
        transition: opacity .15s;
      }
      #bcb-greet-close:hover { opacity: .8; }
      @keyframes bcb-slideIn {
        from { opacity: 0; transform: translateY(8px) scale(.95); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }

      /* ── CHAT WINDOW ── */
      #bcb-win {
        position: fixed;
        ${hx}: ${C.offset_x}px;
        bottom: ${C.offset_y + 72}px;
        z-index: 2147483647;
        width: ${C.width}px;
        height: min(${C.height}px, calc(100vh - ${C.offset_y + 90}px));
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 12px 48px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.1);
        background: #f5f3ee;
        display: flex; flex-direction: column;
        transform-origin: ${hx} bottom;
        transform: scale(.85) translateY(20px);
        opacity: 0;
        pointer-events: none;
        transition: transform .3s cubic-bezier(.22,.68,0,1.2), opacity .25s ease;
      }
      #bcb-win.open {
        transform: scale(1) translateY(0);
        opacity: 1;
        pointer-events: auto;
      }

      /* ── HEADER ── */
      #bcb-header {
        background: ${C.color};
        padding: 14px 16px;
        display: flex; align-items: center; gap: 12px;
        flex-shrink: 0;
        position: relative; overflow: hidden;
      }
      #bcb-header::after {
        content: '★';
        position: absolute; right: -8px; top: -18px;
        font-size: 90px; color: rgba(255,255,255,.05); line-height: 1;
        pointer-events: none;
      }
      #bcb-header-icon {
        width: 40px; height: 40px; flex-shrink: 0;
        border-radius: 50%; overflow: hidden;
        background: rgba(255,255,255,.2);
        display: flex; align-items: center; justify-content: center;
      }
      #bcb-header-icon img { width: 100%; height: 100%; object-fit: cover; }
      #bcb-header-icon .bcb-star-icon {
        width: 22px; height: 22px;
        clip-path: polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);
        background: #E8A020;
      }
      .bcb-header-text h3 {
        font-family: -apple-system,'Segoe UI',sans-serif;
        font-size: 15px; font-weight: 600; color: #fff; line-height: 1.2;
      }
      .bcb-header-text p {
        font-size: 12px; color: rgba(255,255,255,.72); margin-top: 2px;
        display: flex; align-items: center; gap: 5px;
      }
      .bcb-dot { width: 7px; height: 7px; border-radius: 50%; background: #5ef58a; flex-shrink: 0; }
      #bcb-close-win {
        margin-left: auto; background: none; border: none; cursor: pointer;
        color: rgba(255,255,255,.7); font-size: 22px; line-height: 1;
        padding: 4px; border-radius: 6px; transition: color .15s, background .15s;
      }
      #bcb-close-win:hover { color: #fff; background: rgba(255,255,255,.12); }

      /* ── IFRAME ── */
      #bcb-iframe {
        flex: 1; border: none; background: #f5f3ee;
        display: block; width: 100%;
      }

      /* ── MOBILE ── */
      @media (max-width: 480px) {
        #bcb-win {
          ${hx}: 0 !important;
          ${isLeft ? 'right' : 'left'}: 0 !important;
          bottom: 0 !important;
          width: 100% !important;
          height: 100% !important;
          border-radius: 0 !important;
        }
        #bcb-greet { display: none !important; }
      }
    `;
    document.head.appendChild(style);

    /* ─── Root container ─── */
    const root = document.createElement('div');
    root.id = 'bcb-root';
    document.body.appendChild(root);

    /* ─── Greeting bubble ─── */
    const greet = document.createElement('div');
    greet.id = 'bcb-greet';
    greet.innerHTML = `<span>${C.greeting}</span><span id="bcb-greet-close" title="Đóng">×</span>`;
    root.appendChild(greet);

    /* ─── Floating button ─── */
    const btn = document.createElement('button');
    btn.id = 'bcb-btn';
    btn.setAttribute('aria-label', 'Mở chat');
    btn.innerHTML = C.logo
      ? `<img class="bcb-logo" src="${C.logo}" alt="Logo" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <svg class="bcb-ico-chat" style="display:none" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>`
      : `<svg class="bcb-ico-chat" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>`;
    btn.innerHTML += `<svg class="bcb-ico-close" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;
    root.appendChild(btn);

    /* ─── Chat window ─── */
    const win = document.createElement('div');
    win.id = 'bcb-win';

    // Header
    const header = document.createElement('div');
    header.id = 'bcb-header';
    const iconHTML = C.logo
      ? `<img src="${C.logo}" alt="Logo" onerror="this.parentElement.innerHTML='<div class=bcb-star-icon></div>'">`
      : `<div class="bcb-star-icon"></div>`;
    header.innerHTML = `
      <div id="bcb-header-icon">${iconHTML}</div>
      <div class="bcb-header-text">
        <h3>${C.title}</h3>
        <p><span class="bcb-dot"></span>${C.subtitle}</p>
      </div>
      <button id="bcb-close-win" title="Thu nhỏ">&#8964;</button>
    `;
    win.appendChild(header);

    // iFrame
    const iframe = document.createElement('iframe');
    iframe.id = 'bcb-iframe';
    iframe.title = C.title;
    iframe.setAttribute('allow', 'clipboard-write');
    // Chưa set src — chỉ load khi mở lần đầu (lazy)
    win.appendChild(iframe);

    root.appendChild(win);

    /* ─── Toggle logic ─── */
    function openChat() {
      isOpen = true;
      win.classList.add('open');
      btn.classList.add('open');
      btn.setAttribute('aria-label', 'Đóng chat');
      greet.style.display = 'none';

      // Lazy load iframe
      if (!iframe.src) {
        iframe.src = C.webapp_url;
        if (C.hide_header) {
          iframe.addEventListener('load', function() {
            try { iframe.contentWindow.postMessage({ bauCuBotHideHeader: true }, '*'); } catch(e) {}
          }, { once: true });
        }
      }
    }

    function closeChat() {
      isOpen = false;
      win.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-label', 'Mở chat');
    }

    btn.addEventListener('click', function () {
      isOpen ? closeChat() : openChat();
    });

    document.getElementById('bcb-close-win').addEventListener('click', closeChat);

    document.getElementById('bcb-greet-close').addEventListener('click', function () {
      greet.style.display = 'none';
    });

    /* ─── Auto-hide greeting sau 8 giây ─── */
    setTimeout(function () {
      if (!isOpen && greet.style.display !== 'none') {
        greet.style.transition = 'opacity .4s';
        greet.style.opacity = '0';
        setTimeout(function () { greet.style.display = 'none'; }, 400);
      }
    }, 8000);

    /* ─── Đóng khi click outside (desktop) ─── */
    document.addEventListener('click', function (e) {
      if (isOpen && !win.contains(e.target) && !btn.contains(e.target)) {
        closeChat();
      }
    });

    /* ─── Expose API ─── */
    BauCuBot.open  = openChat;
    BauCuBot.close = closeChat;
  };

  global.BauCuBot = BauCuBot;

})(window);
