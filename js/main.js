(function () {
    var header = document.querySelector('[data-sticky-header]');

    // Sticky-shrink header (templates/modules/sticky-header): sentinel + IntersectionObserver.
    if (header) {
        var sentinel = document.createElement('div');
        sentinel.style.cssText = 'position:absolute;top:0;width:1px;height:1px;pointer-events:none';
        document.body.prepend(sentinel);
        new IntersectionObserver(function (entries) {
            header.dataset.scrolled = String(!entries[0].isIntersecting);
        }, { rootMargin: '-1px 0px 0px 0px' }).observe(sentinel);

        var menuBtn = header.querySelector('.menu-btn');
        var setMenu = function (open) {
            document.documentElement.classList.toggle('menu-open', open);
            menuBtn.setAttribute('aria-expanded', String(open));
        };
        menuBtn.addEventListener('click', function () {
            setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
        });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
        header.querySelectorAll('.nav a').forEach(function (a) {
            a.addEventListener('click', function () { setMenu(false); });
        });
    }

    // Podcast set strip: prev / next
    document.querySelectorAll('[data-strip]').forEach(function (wrap) {
        var strip = wrap.querySelector('.strip');
        var prev = wrap.querySelector('[data-prev]');
        var next = wrap.querySelector('[data-next]');
        var step = function () { return strip.firstElementChild.getBoundingClientRect().width + 24; };
        var update = function () {
            prev.disabled = strip.scrollLeft < 8;
            next.disabled = strip.scrollLeft + strip.clientWidth > strip.scrollWidth - 8;
        };
        prev.addEventListener('click', function () { strip.scrollBy({ left: -step(), behavior: 'smooth' }); });
        next.addEventListener('click', function () { strip.scrollBy({ left: step(), behavior: 'smooth' }); });
        strip.addEventListener('scroll', update, { passive: true });
        update();
    });

    // WhatsApp booking form (book.html). Field ids and message format kept from V3.
    var waForm = document.getElementById('waForm');
    if (waForm) {
        waForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var val = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
            var text = encodeURIComponent(
                'Hi Studio by Char!\n\nNew Booking Request\nName: ' + val('waName') +
                '\nService: ' + val('waProject') +
                '\nDate: ' + (val('waDate') || 'Flexible') +
                '\nGuests: ' + val('waGuests') +
                '\nProject notes: ' + val('waMessage')
            );
            // Placeholder carried over from V3: replace 66000000000 with the real WhatsApp number.
            window.open('https://wa.me/66000000000?text=' + text, '_blank', 'noopener');
        });
    }
})();

/* CHAT WIDGET: ported from chiangmaiambassador.com (explicit chatOpen flag,
   zone set up on load, mobile pointer-events fix). Channels kept from V3. */
window.addEventListener('load', function () {
    var ico = function (bg, path) {
        return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="' + bg + '"/>' + path + '</svg>';
    };
    var channels = [
        ['Messenger', 'https://m.me/1BsJcmAYLn', ico('#0084FF', '<path d="M12 4C7.582 4 4 7.292 4 11.333c0 2.126 1.01 4.03 2.6 5.337V19l2.453-1.348A8.548 8.548 0 0012 17.667c4.418 0 8-3.293 8-7.334C20 7.292 16.418 4 12 4zm.8 9.867l-2.036-2.174-3.972 2.174 4.37-4.64 2.085 2.173 3.923-2.173-4.37 4.64z" fill="#fff"/>')],
        ['Instagram', 'https://www.instagram.com/studioby.char/', ico('#E4405F', '<rect x="6.5" y="6.5" width="11" height="11" rx="3.2" fill="none" stroke="#fff" stroke-width="1.4"/><circle cx="12" cy="12" r="2.6" fill="none" stroke="#fff" stroke-width="1.4"/><circle cx="15.4" cy="8.6" r=".8" fill="#fff"/>')],
        ['LinkedIn', 'https://www.linkedin.com/company/shot-by-char/', ico('#0A66C2', '<path d="M8.5 10H7v7h1.5v-7zM7.75 9a.875.875 0 100-1.75A.875.875 0 007.75 9zM17 12.5c0-1.5-.75-2.5-2.25-2.5-.75 0-1.5.5-1.75 1V10H11.5v7H13v-3.75c0-.75.375-1.5 1.25-1.5.875 0 1.25.625 1.25 1.5V17H17v-4.5z" fill="#fff"/>')]
    ];
    var links = channels.map(function (c) {
        return '<a class="sbc-ch" href="' + c[1] + '" target="_blank" rel="noopener" aria-label="' + c[0] + '">' + c[2] + '<span>' + c[0] + '</span></a>';
    }).join('');
    var bubble = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 5H5a1.5 1.5 0 00-1.5 1.5v9A1.5 1.5 0 005 17h3l4 3.5 4-3.5h3a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0019 5z" fill="#d4a896"/><circle cx="8.5" cy="11" r="1.1" fill="#2a2825"/><circle cx="12" cy="11" r="1.1" fill="#2a2825"/><circle cx="15.5" cy="11" r="1.1" fill="#2a2825"/></svg>';
    document.body.insertAdjacentHTML('beforeend',
        '<div id="sbc-widget"><div id="sbc-channels">' + links + '</div>' +
        '<div id="sbc-foot"><button id="sbc-btn" type="button" aria-label="Chat options">' + bubble + '</button><span id="sbc-label">Chat now</span></div></div>');

    var zone = null;
    var widget = document.getElementById('sbc-widget');
    var list = document.getElementById('sbc-channels');
    var btn = document.getElementById('sbc-btn');
    var scrollTimer = null;
    var inZone = false;
    var chatOpen = false;

    function clearScrollTimer() { if (scrollTimer) { clearTimeout(scrollTimer); scrollTimer = null; } }
    function showLabel() { inZone = true; widget.classList.add('active'); clearScrollTimer(); }
    function hideAll() { inZone = false; widget.classList.remove('active'); list.classList.remove('show'); clearScrollTimer(); }

    zone = document.createElement('div');
    zone.id = 'sbc-zone';
    document.body.appendChild(zone);
    zone.addEventListener('mouseenter', showLabel);
    zone.addEventListener('mouseleave', function (e) { if (!widget.contains(e.relatedTarget)) hideAll(); });

    widget.addEventListener('mouseenter', showLabel);
    widget.addEventListener('mouseleave', function (e) { if (!zone.contains(e.relatedTarget)) { hideAll(); chatOpen = false; } });
    btn.addEventListener('mouseenter', function () { list.classList.add('show'); });

    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (chatOpen) { hideAll(); chatOpen = false; }
        else { showLabel(); list.classList.add('show'); chatOpen = true; }
    });
    document.addEventListener('click', function (e) {
        if (chatOpen && !widget.contains(e.target)) { hideAll(); chatOpen = false; }
    });
    window.addEventListener('scroll', function () {
        if (inZone) { clearScrollTimer(); scrollTimer = setTimeout(hideAll, 10000); }
    }, { passive: true });
});
