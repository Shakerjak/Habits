/* Ali’s Golden Bite – kleine Verbesserungen per JavaScript.
   Ohne JavaScript funktioniert alles über normale Links (Sprung zu #bestellen bzw. zur Fußzeilen-Navigation). */
(function () {
  'use strict';

  var doc = document;
  var dialogMoeglich = typeof HTMLDialogElement === 'function' && 'showModal' in HTMLDialogElement.prototype;
  var wenigBewegung = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Dialoge (Bestellen, Navigation) ---------- */
  function sichtbar(el) {
    return el && el.isConnected && el.getClientRects().length > 0;
  }

  function oeffne(id, quelle) {
    var dialog = doc.getElementById('dialog-' + id);
    if (!dialog || !dialogMoeglich) return false;
    var rueckfokus = quelle;
    var eltern = quelle && quelle.closest('dialog[open]');
    if (eltern) {
      // Aus einem offenen Dialog heraus: diesen schließen, Fokus später an dessen Auslöser zurückgeben.
      rueckfokus = eltern._rueckfokus || null;
      eltern._ohneFokus = true;
      eltern.close();
    }
    dialog._rueckfokus = rueckfokus;
    dialog.showModal();
    return true;
  }

  if (dialogMoeglich) {
    Array.prototype.forEach.call(doc.querySelectorAll('a[data-dialog-open]'), function (a) {
      a.setAttribute('role', 'button');
      a.setAttribute('aria-haspopup', 'dialog');
      a.setAttribute('aria-controls', 'dialog-' + a.getAttribute('data-dialog-open'));
    });

    Array.prototype.forEach.call(doc.querySelectorAll('dialog'), function (dialog) {
      dialog.addEventListener('close', function () {
        var ziel = dialog._rueckfokus;
        dialog._rueckfokus = null;
        if (dialog._ohneFokus) {
          dialog._ohneFokus = false;
          return;
        }
        if (sichtbar(ziel)) ziel.focus({ preventScroll: true });
      });
    });
  }

  doc.addEventListener('click', function (e) {
    var ziel = e.target;
    if (!(ziel instanceof Element)) return;

    var oeffner = ziel.closest('[data-dialog-open]');
    if (oeffner) {
      if (oeffne(oeffner.getAttribute('data-dialog-open'), oeffner)) e.preventDefault();
      return;
    }

    var schliesser = ziel.closest('[data-dialog-close]');
    if (schliesser) {
      schliesser.closest('dialog').close();
      return;
    }

    // Klick auf den abgedunkelten Hintergrund schließt den Dialog.
    if (ziel.tagName === 'DIALOG' && ziel.open) {
      ziel.close();
      return;
    }

    // Links im Navigationsdialog schließen den Dialog, bevor gesprungen wird.
    var navLink = ziel.closest('#dialog-navigation a[href]');
    if (navLink) {
      var nav = navLink.closest('dialog');
      nav._rueckfokus = null;
      nav.close();
    }
  });

  // Leertaste löst Links aus, die per JavaScript wie Buttons arbeiten.
  doc.addEventListener('keydown', function (e) {
    if (e.key === ' ' && e.target instanceof Element && e.target.matches('a[data-dialog-open][role="button"]')) {
      e.preventDefault();
      e.target.click();
    }
  });

  /* ---------- Öffnungszeiten: heutigen Tag hervorheben ---------- */
  var zeitenText = doc.body.getAttribute('data-zeiten');
  if (zeitenText) {
    var zeiten = null;
    try {
      zeiten = JSON.parse(zeitenText);
    } catch (fehler) {
      zeiten = null;
    }
    var kurz = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'Europe/Vienna' }).format(new Date());
    var index = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(kurz);
    if (zeiten && index >= 0) {
      Array.prototype.forEach.call(doc.querySelectorAll('tr[data-tag="' + index + '"]'), function (zeile) {
        zeile.classList.add('ist-heute');
        var th = zeile.querySelector('th');
        if (th) {
          var hinweis = doc.createElement('span');
          hinweis.className = 'visually-hidden';
          hinweis.textContent = ' (heute)';
          th.appendChild(hinweis);
        }
      });
      Array.prototype.forEach.call(doc.querySelectorAll('[data-heute]'), function (el) {
        var fenster = zeiten[index];
        var text = fenster && fenster.length
          ? fenster.map(function (f) { return f[0] + '–' + f[1]; }).join(', ') + ' ' + el.getAttribute('data-label-uhr')
          : el.getAttribute('data-label-geschlossen');
        el.textContent = el.getAttribute('data-label-heute') + ': ' + text;
      });
    }
  }

  /* ---------- Speisekarte: aktuelle Kategorie in der Sprungnavigation markieren ---------- */
  var katNav = doc.querySelector('.kat-nav');
  if (katNav && 'IntersectionObserver' in window) {
    var liste = katNav.querySelector('ul');
    var links = Array.prototype.slice.call(katNav.querySelectorAll('a[href^="#"]'));
    var abschnitte = links
      .map(function (a) { return doc.getElementById(a.getAttribute('href').slice(1)); })
      .filter(Boolean);
    var aktiv = null;
    var imBild = {};

    var setzeAktiv = function (id) {
      if (id === aktiv) return;
      aktiv = id;
      links.forEach(function (a) {
        var ist = a.getAttribute('href') === '#' + id;
        if (ist) {
          a.setAttribute('aria-current', 'true');
          if (liste.scrollWidth > liste.clientWidth) {
            var links_ = liste.scrollLeft + a.getBoundingClientRect().left - liste.getBoundingClientRect().left - 16;
            liste.scrollTo({ left: links_, behavior: wenigBewegung ? 'auto' : 'smooth' });
          }
        } else {
          a.removeAttribute('aria-current');
        }
      });
    };

    var beobachter = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) { imBild[e.target.id] = e.isIntersecting; });
      for (var i = 0; i < abschnitte.length; i++) {
        if (imBild[abschnitte[i].id]) {
          setzeAktiv(abschnitte[i].id);
          break;
        }
      }
    }, { rootMargin: '-30% 0px -65% 0px' });
    abschnitte.forEach(function (a) { beobachter.observe(a); });
  }
})();
