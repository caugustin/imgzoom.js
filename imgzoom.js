/* imgzoom.js -- (C) 2014-02-15, Christian Augustin (caugustin.de) */
/*
    == Dependencies ==

    - imgzoom.css
    
    
    == ToDo ==
    
    - Configurable img preload (via CSS classes).
    - Configurable delays and times (via CSS classes).
    - Load-spinner for image (using data URL).
    - Make use of link title, img title and img alt.
    - Make all img zoom links known to the zoom object for prev/next option.
    - Get data from DOM when needed?
    - Extract additional classes from link and img (framing, shadows etc.)?
    - Special CSS classes to modify imgzoom behavior (e.g. imgzoom-gallery).

    Don't:
    - Configuration via JS (creates dependency), use CSS classes instead!

    == History ==

    2014-02-15 caugustin.de   Close button is back (can use z-index)!
    2014-02-15 caugustin.de   Trying to include fixed img height.
    2014-02-13 caugustin.de   Utility functions refactored.
    2014-02-11 caugustin.de   Print only zoomed image if visible.
    2014-02-11 caugustin.de   Utility functions extended, FF 4+5 bugfix.
    2014-02-06 caugustin.de   FP style refactoring, CSS optimization.
    2014-02-05 caugustin.de   First fully functional version, first CSS.
    2014-02-04 caugustin.de   Initial setup.

*/

(function(){

    if (!document.querySelectorAll) return;
    
    var openDelay =  25,
        openTime  = 500,
        closeTime = 500;

    function createZoom() {
        var z       = create('div', 'iz-container iz-closed');
        z._overlay  = append(z, create('div', 'iz-overlay'));
        z._wrapper  = append(z, create('div', 'iz-wrapper'));
        z._frame    = append(z._wrapper, create('div', 'iz-frame'));
        z._img      = append(z._frame,   create('img'));
        z._close    = append(z, create('div', 'iz-close'));
        addEvent(z._overlay, 'click', function(){return close(z)});
        addEvent(z._close,   'click', function(){return close(z)});
        return hide(z);
    }
    function placeImage(z, url) {
        setAttr(z._img, 'src', '');
        var i = new Image();
        i.onload = function() {
            i._nw = i.width;
            i._nh = i.height;
            setAttr(z._img, 'src', url);
            addClass(z._frame, 'iz-frame-show');
        }
        setAttr(i, 'src', url);
        return i;
    }
    function open(z, url) {
        if (noSVG() && url && url.match(/\.svgz?$/i)) {
            url = url.replace(/\.svgz?$/i, '.png');
        }
        setStyle(z._wrapper, 'marginTop', getScroll().y + 'px');
        removeClass(z._frame, 'iz-frame-show');
        show(z);
        // Necessary for browsers to start a CSS transition:
        setTimeout(function(){placeImage(z, url)}, openDelay);
        setTimeout(function(){openBegin(z)}, openDelay);
        return false;
    }
    function openBegin(z) {
        replaceClass(z, 'iz-closed', 'iz-opening');
        addClass(document.documentElement, 'iz-visible');
        setTimeout(function(){return openEnd(z)}, openTime);
    }
    function openEnd(z) {
        replaceClass(z, 'iz-opening', 'iz-open');
    }
    function close(z) {
        replaceClass(z, 'iz-open', 'iz-closing');
        setTimeout(function(){return closeEnd(z)}, closeTime);
        return false;
    }
    function closeEnd(z) {
        replaceClass(z, 'iz-closing', 'iz-closed');
        removeClass(document.documentElement, 'iz-visible');
        hide(z);
    }
    
    
    
    /* -------------------------------------------
       Initialization
    */
    
    ready(function(){
        if (!document.documentElement || !document.body) return;
        if (!supports('transition')) openDelay = openTime = closeTime = 0;

        var zoom = append(document.body, createZoom());
        addClass(document.documentElement, 'iz-active');
        
        forEach(getElements(document, 'a.imgzoom'), function(zAnchor){
            zAnchor.onclick = function(){return open(zoom, zAnchor.href)};
            addClass(zAnchor, 'iz-attached');
        });
    });




    /* ------------------------------------------- 
       Utility functions ...
    */
    
    // General utilities:
    function forEach(l, f) { for (i = 0; i < l.length; i++) f(l[i], i) }
    function trim(s) { return s.replace(/^\s+|\s+$/g, '') }

    // Browser utilities:
    function noSVG() {
        return !document.implementation.hasFeature(
        'http://www.w3.org/TR/SVG11/feature#Image', '1.1')
    }
    function getScroll() {
        var de = document.documentElement, db = document.body, s = self;
        if (s.pageXOffset != null)
            return { x: s.pageXOffset, y: s.pageYOffset }; 
        if (de && de.scrollLeft != null)
            return { x: de.scrollLeft, y: de.scrollTop };
        if (db && db.scrollLeft != null)
            return { x: db.scrollLeft, y: db.scrollTop };
        return { x: 0, y: 0 };
    }
    function ready(fn) {
        if (document.addEventListener) {
            document.addEventListener('DOMContentLoaded', fn, false);
        }
        else if (document.attachEvent) {
            document.attachEvent('onreadystatechange', function(){
                if (document.readyState.match(/loaded|complete/)) fn();
            });
        }
    }
    var supports = (function() {
        var s = document.createElement('div').style,
            v = 'Khtml Ms O Moz Webkit'.split(' ');
        return function(p) {
            if (p in s) return true;
            p = p.replace(/^[a-z]/, function(c){return c.toUpperCase()});
            var l = v.length;
            while(l--) { if (v[l] + p in s) return true; }
            return false;
        };
    })();
    function getVisibleArea() {
        var html = document.documentElement;
        return { w: html.clientWidth || 0, h: html.clientHeight || 0 }
    }
    
    // Class string operations:
    function classNameHas(s, c) {
        return new RegExp('(^|\\b)' + c + '(\\b|$)').test(s);
    }
    function classNameAdd(s, c) {
        if (classNameHas(s, c)) return s;
        return (s) ? s + ' ' + c : c;
    }
    function classNameReplace(s, a, b) {
        return s.replace(
            new RegExp('(^|\\s+)' + a + '(\\s+|$)', 'g'),
            function(m, pe1, pe2){
                return ((b && pe1) ? ' ' : '') + b + ((b && pe2) ? ' ' : '')
            } 
        );
    }

    // Element operations:
    function create(n, c) {
        var e = document.createElement(n);
        if (c) e.className = c;
        return e;
    }
    function hide(e) { e.style.display = 'none'; return e; }
    function show(e) { e.style.display = ''; return e; }
    function append(p, e) { return p.appendChild(e) }
    function prepend(p, e) { return p.insertBefore(e, p.firstChild) }
    function parent(e) { return e.parentNode }
    function remove(e) { return e.parentNode.removeChild(e) }
    function getElements(e, sel) { return e.querySelectorAll(sel) }
    function addEvent(e, evt, fn) {
        if (e.addEventListener) e.addEventListener(evt, fn, false)
        else e.attachEvent('on'+evt, fn);
        return e;
    }
    function removeEvent(e, evt, fn) {
        if (e.removeEventListener) e.removeEventListener(evt, fn, false)
        else e.detachEvent('on'+evt, fn);
        return e;
    }
    function getAttr(e, attr) { return e[attr] }
    function setAttr(e, attr, val) {
        e[attr] = val;
        return e;
    }
    function setStyle(e, prop, val) {
        e.style[prop] = val;
        return e;
    }
    function getStyle(e, prop) { return e[prop] }
    function getComputedStyle(e, prop) {
        var s = e.currentStyle || window.getComputedStyle(e, null);
        return s[prop];
    }

    // Class operations:
    function hasClass(e, c) { return classNameHas(e.className, c) }
    function addClass(e, c) {
        if (!hasClass(e, c)) e.className += (e.className) ? ' ' + c : c;
        return e;
    }
    function replaceClass(e, o, n) {
        if (hasClass(e, o)) e.className = classNameReplace(e.className, o, n);
        return e;
    }
    function removeClass(e, c) {
        return replaceClass(e, c, '');
    }

    // Fade in/out:
    function fadeIn(e) {
        var opacity = 0;

        e.style.opacity = 0;
        e.style.filter = '';

        var last = +new Date();
        var tick = function() {
            opacity += (new Date() - last) / 400;
            e.style.opacity = opacity;
            e.style.filter = 'alpha(opacity=' + (100 * opacity) + ')';
            last = +new Date();

            if (opacity < 1) {
                (window.requestAnimationFrame && requestAnimationFrame(tick))
                || setTimeout(tick, 16);
            }
        };

        tick();
    }
    

}).call(this);

