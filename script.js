(function(){
  'use strict';

  var FLIP_MS = 300; // duration of each half-flip

  var clockEl = document.getElementById('clock');
  var secondsLabel = document.getElementById('secondsLabel');

  function pad(n){ return n < 10 ? '0' + n : '' + n; }

  function makeDigit(initial){
    var wrap = document.createElement('div');
    wrap.className = 'digit';

    var cardStatic = document.createElement('div');
    cardStatic.className = 'card-static';

    var top = document.createElement('div');
    top.className = 'num top';
    var topSpan = document.createElement('span');
    topSpan.textContent = initial;
    top.appendChild(topSpan);

    var bottom = document.createElement('div');
    bottom.className = 'num bottom';
    var bottomSpan = document.createElement('span');
    bottomSpan.textContent = initial;
    bottom.appendChild(bottomSpan);

    cardStatic.appendChild(top);
    cardStatic.appendChild(bottom);

    var leafFront = document.createElement('div');
    leafFront.className = 'leaf front';
    var frontSpan = document.createElement('span');
    frontSpan.textContent = initial;
    leafFront.appendChild(frontSpan);
    leafFront.style.transition = 'none';
    leafFront.style.transform = 'rotateX(0deg)';

    var leafBack = document.createElement('div');
    leafBack.className = 'leaf back';
    var backSpan = document.createElement('span');
    backSpan.textContent = initial;
    leafBack.appendChild(backSpan);
    leafBack.style.transition = 'none';
    leafBack.style.transform = 'rotateX(90deg)';

    wrap.appendChild(cardStatic);
    wrap.appendChild(leafFront);
    wrap.appendChild(leafBack);

    wrap._value = initial;
    wrap._topSpan = topSpan;
    wrap._bottomSpan = bottomSpan;
    wrap._frontSpan = frontSpan;
    wrap._backSpan = backSpan;
    wrap._leafFront = leafFront;
    wrap._leafBack = leafBack;
    wrap._busy = false;

    return wrap;
  }

  function setInstant(el, transform){
    el.style.transition = 'none';
    el.style.transform = transform;
    // force reflow so the next transition change is picked up fresh
    void el.offsetHeight;
  }

  function flipDigit(digitEl, newVal){
    if (digitEl._value === newVal || digitEl._busy) {
      digitEl._value = newVal;
      return;
    }
    digitEl._busy = true;
    var oldVal = digitEl._value;
    digitEl._value = newVal;

    digitEl._frontSpan.textContent = oldVal;
    digitEl._backSpan.textContent = newVal;
    digitEl._topSpan.textContent = newVal;

    setInstant(digitEl._leafFront, 'rotateX(0deg)');
    setInstant(digitEl._leafBack, 'rotateX(90deg)');

    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        digitEl._leafFront.style.transition = 'transform ' + FLIP_MS + 'ms cubic-bezier(.37,0,.63,1)';
        digitEl._leafFront.style.transform = 'rotateX(-90deg)';
      });
    });

    setTimeout(function(){
      digitEl._bottomSpan.textContent = newVal;
      digitEl._leafBack.style.transition = 'transform ' + FLIP_MS + 'ms cubic-bezier(.37,0,.63,1)';
      digitEl._leafBack.style.transform = 'rotateX(0deg)';
    }, FLIP_MS);

    setTimeout(function(){
      setInstant(digitEl._leafFront, 'rotateX(0deg)');
      digitEl._frontSpan.textContent = newVal;
      setInstant(digitEl._leafBack, 'rotateX(90deg)');
      digitEl._busy = false;
    }, FLIP_MS * 2 + 20);
  }

  function makeUnit(initialStr){
    var unit = document.createElement('div');
    unit.className = 'unit';
    var d1 = makeDigit(initialStr[0]);
    var d2 = makeDigit(initialStr[1]);
    unit.appendChild(d1);
    unit.appendChild(d2);
    unit._digits = [d1, d2];
    return unit;
  }

  function makeColon(){
    var c = document.createElement('div');
    c.className = 'colon';
    c.textContent = ':';
    return c;
  }

  var now = new Date();
  var hh = pad(now.getHours());
  var mm = pad(now.getMinutes());

  var hoursUnit = makeUnit(hh);
  var minutesUnit = makeUnit(mm);

  clockEl.appendChild(hoursUnit);
  clockEl.appendChild(makeColon());
  clockEl.appendChild(minutesUnit);

  function updateUnit(unit, str){
    flipDigit(unit._digits[0], str[0]);
    flipDigit(unit._digits[1], str[1]);
  }

  function tick(){
    var d = new Date();
    var h = pad(d.getHours());
    var m = pad(d.getMinutes());
    var s = pad(d.getSeconds());

    updateUnit(hoursUnit, h);
    updateUnit(minutesUnit, m);
    secondsLabel.textContent = s + ' \u0441\u0435\u043A';
  }

  tick();
  setInterval(tick, 1000);

  // keep screen awake if supported
  var wakeLock = null;
  function requestWake(){
    if ('wakeLock' in navigator){
      navigator.wakeLock.request('screen').then(function(lock){
        wakeLock = lock;
      }).catch(function(){});
    }
  }
  requestWake();
  document.addEventListener('visibilitychange', function(){
    if (document.visibilityState === 'visible') requestWake();
  });

  // Fullscreen + landscape lock. Browsers only allow entering fullscreen
  // and locking orientation from inside a real user gesture, so this runs
  // on the first tap/click (and again on every tap, harmlessly, in case
  // the user left fullscreen e.g. via the back gesture).
  function goFullscreenLandscape(){
    var el = document.documentElement;
    var request = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    var p;
    if (!document.fullscreenElement && request){
      p = request.call(el);
    } else {
      p = Promise.resolve();
    }
    (p || Promise.resolve()).then(function(){
      if (screen.orientation && screen.orientation.lock){
        screen.orientation.lock('landscape').catch(function(){});
      }
    }).catch(function(){});
  }

  // try right away (works automatically once installed/launched as a
  // standalone PWA on Android; silently no-ops otherwise until a tap)
  goFullscreenLandscape();

  // tap to go fullscreen/landscape and toggle the seconds label
  document.body.addEventListener('click', function(){
    goFullscreenLandscape();
    secondsLabel.style.display = (secondsLabel.style.display === 'none') ? 'flex' : 'none';
  });

  if ('serviceWorker' in navigator){
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('service-worker.js').catch(function(){});
    });
  }
})();
