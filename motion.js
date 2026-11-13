'use strict';

// Site motion. Everything here is decoration: the page reads the same without it,
// and nothing runs for visitors who ask their system for reduced motion.
(() => {
  // Visitors who turned motion down in their system (for example Windows "Animation effects")
  // get a gentler site: no automatic entrance animations, but the ticker and the
  // pointer interactions still work.
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  if (!calm) root.classList.add('has-motion');

  // 1. Reveal content as it scrolls into view. Only things below the first screen
  //    start lowered, so the opening view is complete straight away.
  const revealTargets = '.project-card, .case-row, .case-motion, .about-copy, .portrait, .work-heading, .contact-inner, .case-navigation';
  if (!calm && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      let position = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.style.setProperty('--reveal-delay', `${Math.min(position++, 5) * 70}ms`);
        entry.target.classList.add('motion-in');
        entry.target.classList.remove('motion-wait');
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -6% 0px' });

    const arm = () => document.querySelectorAll(revealTargets).forEach(el => {
      if (el.dataset.motionArmed) return;
      el.dataset.motionArmed = '1';
      if (el.getBoundingClientRect().top > innerHeight) {
        el.classList.add('motion-wait');
        observer.observe(el);
      }
    });
    arm();
    // project.js and site.js build some of these after load; catch late arrivals.
    new MutationObserver(arm).observe(document.body, { childList: true, subtree: true });
  }

  // 2. Hero tiles drift toward the pointer, very slightly (desktop only).
  const hero = document.querySelector('.hero');
  if (hero && matchMedia('(hover: hover) and (min-width: 651px)').matches) {
    let frame = 0;
    hero.addEventListener('pointermove', event => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = hero.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width - 0.5;
        const y = (event.clientY - box.top) / box.height - 0.5;
        hero.querySelectorAll('.tile').forEach((tile, index) => {
          const depth = [14, 22, 10, 18][index % 4];
          tile.style.setProperty('--px', `${(x * depth).toFixed(1)}px`);
          tile.style.setProperty('--py', `${(y * depth).toFixed(1)}px`);
        });
      });
    });
    hero.addEventListener('pointerleave', () => hero.querySelectorAll('.tile').forEach(tile => {
      tile.style.setProperty('--px', '0px');
      tile.style.setProperty('--py', '0px');
    }));
  }

  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // 4. Headings made of letters that hop when the pointer touches them.
  const splitLetters = heading => {
    if (!heading || heading.dataset.split) return;
    heading.dataset.split = '1';
    heading.setAttribute('aria-label', heading.innerText.replace(/\s+/g, ' ').trim());
    const walk = node => {
      for (const child of [...node.childNodes]) {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          for (const part of child.textContent.split(/(\s+)/)) {
            if (!part) continue;
            if (/^\s+$/.test(part)) { frag.append(document.createTextNode(part)); continue; }
            const word = document.createElement('span');
            word.className = 'word';
            for (const ch of part) {
              const letter = document.createElement('span');
              letter.className = 'letter';
              letter.textContent = ch;
              word.append(letter);
            }
            frag.append(word);
          }
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
          walk(child);
        }
      }
    };
    walk(heading);
    heading.querySelectorAll('.word, .letter').forEach(el => el.setAttribute('aria-hidden', 'true'));
    if (!finePointer) return;
    heading.addEventListener('pointerover', event => {
      const letter = event.target.closest('.letter');
      if (!letter || letter.classList.contains('hop')) return;
      letter.classList.add('hop');
      letter.addEventListener('animationend', () => letter.classList.remove('hop'), { once: true });
    });
  };
  document.querySelectorAll('#hero-heading, .work h2, .contact h2, .about h2').forEach(splitLetters);

  if (finePointer) {
    // 5. A lime cursor that follows the pointer and opens into "View" over projects.
    const cursor = document.createElement('div');
    cursor.className = 'cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<span>View</span>';
    document.body.append(cursor);
    root.classList.add('has-cursor');
    let tx = -100, ty = -100, cx = -100, cy = -100, running = false;
    const follow = () => {
      cx += (tx - cx) * 0.2;
      cy += (ty - cy) * 0.2;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      if (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.3) requestAnimationFrame(follow);
      else running = false;
    };
    addEventListener('pointermove', event => {
      tx = event.clientX; ty = event.clientY;
      cursor.classList.add('is-on');
      const target = event.target.closest?.('a, button');
      cursor.classList.toggle('is-view', !!target?.matches('.project-card, .tile'));
      cursor.classList.toggle('is-link', !!target && !target.matches('.project-card, .tile'));
      if (!running) { running = true; requestAnimationFrame(follow); }
    }, { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));
    addEventListener('pointerdown', () => cursor.classList.add('is-down'));
    addEventListener('pointerup', () => cursor.classList.remove('is-down'));

    // 6. Cards and the portrait tilt toward the pointer, with a soft light on top.
    const tilt = (el, max) => {
      el.classList.add('tilt');
      el.addEventListener('pointermove', event => {
        const box = el.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width;
        const y = (event.clientY - box.top) / box.height;
        el.style.setProperty('--ry', `${((x - 0.5) * max * 2).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${((0.5 - y) * max * 2).toFixed(2)}deg`);
        el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
        el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
      });
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    };
    const tiltCards = () => document.querySelectorAll('.project-card:not(.tilt)').forEach(card => tilt(card, 5));
    tiltCards();
    new MutationObserver(tiltCards).observe(document.body, { childList: true, subtree: true });
    document.querySelectorAll('.portrait').forEach(el => tilt(el, 4));

    // 7. Buttons lean toward the pointer, like a light magnet.
    document.querySelectorAll('.button').forEach(button => {
      button.classList.add('magnet');
      button.addEventListener('pointermove', event => {
        const box = button.getBoundingClientRect();
        const x = event.clientX - (box.left + box.width / 2);
        const y = event.clientY - (box.top + box.height / 2);
        button.style.setProperty('--mx', `${(x * 0.22).toFixed(1)}px`);
        button.style.setProperty('--my', `${(y * 0.32).toFixed(1)}px`);
      });
      button.addEventListener('pointerleave', () => {
        button.style.setProperty('--mx', '0px');
        button.style.setProperty('--my', '0px');
      });
    });
  }

  // 8. The services ticker speeds up while you scroll, and runs backwards when you scroll up.
  const track = document.querySelector('.ticker-track');
  const tickerAnimation = track?.getAnimations?.()[0];
  if (tickerAnimation) {
    let lastY = scrollY, boost = 0, rafId = 0;
    const settle = () => {
      boost *= 0.92;
      tickerAnimation.playbackRate = 1 + boost;
      if (Math.abs(boost) > 0.02) rafId = requestAnimationFrame(settle);
      else { tickerAnimation.playbackRate = 1; rafId = 0; }
    };
    addEventListener('scroll', () => {
      const dy = scrollY - lastY;
      lastY = scrollY;
      boost = Math.max(-6, Math.min(6, boost + dy * 0.04));
      if (!rafId) rafId = requestAnimationFrame(settle);
    }, { passive: true });
  }

  // 3. Reading progress on case study pages.
  if (document.body.classList.contains('project-page')) {
    const bar = document.createElement('div');
    bar.className = 'read-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.append(bar);
    let ticking = false;
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
      ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', update);
    update();
  }
})();
