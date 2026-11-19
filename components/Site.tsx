'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { field, RUN_STEPS } from '@/lib/store';

const CodeField = dynamic(() => import('./CodeField'), { ssr: false });

function B({ en, fr }: { en: React.ReactNode; fr: React.ReactNode }) {
  return (<><span className="en">{en}</span><span className="fr">{fr}</span></>);
}

const CHECK = <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5L20 7" /></svg>;
const CROSS = <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 6l12 12M18 6L6 18" /></svg>;
const GH = <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" /></svg>;
const LI = <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" /></svg>;
const ARROW = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 5v14M5 12l7 7 7-7" /></svg>;

const WORDS = {
  en: ['open pull requests', 'run servers over SSH', 'match offers', 'remember the people they help', 'ask before they act'],
  fr: ['ouvrent des pull requests', 'opèrent des serveurs', 'rapprochent des offres', 'se souviennent des gens', "demandent avant d'agir"],
};


export default function Site() {
  const [step, setStep] = useState(0);
  const [approved, setApproved] = useState(false);
  const [word, setWord] = useState(WORDS.en[0]);
  const approvedRef = useRef(false);
  const hudBar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.registerPlugin(ScrollTrigger);
    const lang = () => (root.dataset.lang === 'fr' ? 'fr' : 'en');

    /* language */
    const langBtn = document.getElementById('lang')!;
    const syncLang = () => { langBtn.textContent = lang() === 'fr' ? 'EN' : 'FR'; };
    syncLang();
    const onLang = () => {
      const l = lang() === 'fr' ? 'en' : 'fr';
      root.dataset.lang = l; root.lang = l;
      try { localStorage.setItem('lang', l); } catch { /* private mode */ }
      syncLang(); setWord(WORDS[l][0]);
    };
    langBtn.addEventListener('click', onLang);

    /* pause (WCAG 2.2.2) */
    field.paused = root.classList.contains('paused');
    const motionBtn = document.getElementById('motion')!;
    const onMotion = () => {
      field.paused = !field.paused;
      root.classList.toggle('paused', field.paused);
      try { localStorage.setItem('motion', field.paused ? 'paused' : 'on'); } catch { /* ignore */ }
    };
    motionBtn.addEventListener('click', onMotion);

    /* typer */
    let wi = 0, ci = WORDS[lang()][0].length, del = false, typerT: ReturnType<typeof setTimeout>;
    setWord(WORDS[lang()][0]);
    const tick = () => {
      if (field.paused || reduce) { typerT = setTimeout(tick, 500); return; }
      const list = WORDS[lang()], w = list[wi % list.length];
      let delay = del ? 26 : 52;
      if (!del && ci >= w.length) { del = true; delay = 1900; }
      else if (del && ci === 0) { del = false; wi++; delay = 260; }
      else { ci += del ? -1 : 1; setWord(w.slice(0, ci)); }
      typerT = setTimeout(tick, delay);
    };
    typerT = setTimeout(tick, 2200);

    /* clocks */
    const fmt = (tz: string) => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(new Date());
    const clocks = () => {
      const a = document.getElementById('t-lyon'), b = document.getElementById('t-tana');
      if (a) a.textContent = fmt('Europe/Paris'); if (b) b.textContent = fmt('Indian/Antananarivo');
    };
    clocks(); const clockI = setInterval(clocks, 30000);

    /* nav state */
    const bar = document.getElementById('top-bar')!;
    const onScroll = () => {
      bar.classList.toggle('scrolled', scrollY > 30);
      const p = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
      hudBar.current?.style.setProperty('--p', `${Math.round(p * 100)}%`);
    };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();

    /* smooth scroll */
    let lenis: Lenis | null = null;
    const raf = (t: number) => lenis?.raf(t * 1000);
    if (!reduce) {
      lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
        const id = a.getAttribute('href')!; const el = id.length > 1 ? document.querySelector(id) : null;
        if (el) { e.preventDefault(); lenis!.scrollTo(el as HTMLElement, { offset: -20 }); }
      }));
    }

    const ctx = gsap.context(() => {
      /* stage + run step per section (created after the pin so positions include its spacer) */
      function createStages() {
      document.querySelectorAll<HTMLElement>('[data-stage]').forEach((sec) => {
        const enter = () => {
          let s = Number(sec.dataset.stage);
          if (sec.id === 'contact' && approvedRef.current) s = 5;
          if (sec.id === 'contact') document.querySelector('.close')?.classList.add('lit');
          gsap.to(field, { stage: s, opacity: Number(sec.dataset.op ?? 1), duration: reduce ? 0 : 1.6, ease: 'power3.inOut', overwrite: true });
          setStep(Number(sec.dataset.step));
        };
        ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 45%', onEnter: enter, onEnterBack: enter });
      });

      }
      if (reduce) { createStages(); return; }

      /* hero kinetic intro + scroll stretch */
      gsap.from('.hero h1 .line', { '--w': 40, '--wg': 200, opacity: 0, yPercent: 30, duration: 1.4, ease: 'expo.out', stagger: 0.12, delay: 0.15 });
      gsap.from('.hero .reveal', { opacity: 0, y: 24, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.7 });
      gsap.to('.hero h1 .l1', { '--w': 150, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero h1 .l2', { '--w': 62, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero h1 .l3', { '--w': 125, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

      /* section titles breathe in width as they enter */
      gsap.utils.toArray<HTMLElement>('.head h2, .merge h2').forEach((h) => {
        gsap.fromTo(h, { '--w': 52, opacity: 0.2 }, { '--w': 100, opacity: 1, ease: 'none', scrollTrigger: { trigger: h, start: 'top 92%', end: 'top 45%', scrub: true } });
      });

      /* key figures count up once */
      gsap.utils.toArray<HTMLElement>('.proof .count').forEach((el) => {
        const to = Number(el.dataset.to), o = { v: 0 };
        gsap.to(o, { v: to, duration: 1.6, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' },
          onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('en-US'); } });
      });

      /* staggered reveals */
      gsap.utils.toArray<HTMLElement>('.grid, .rules, .list, .more, .jobs, .creds').forEach((g) => {
        gsap.from(g.children, { opacity: 0, y: 40, duration: 0.9, ease: 'power3.out', stagger: 0.07, scrollTrigger: { trigger: g, start: 'top 82%' } });
      });

      /* mockups tell their story */
      gsap.utils.toArray<HTMLElement>('.steps').forEach((s) => {
        gsap.from(s.children, { opacity: 0.1, x: -10, duration: 0.45, stagger: 0.28, ease: 'power2.out', scrollTrigger: { trigger: s, start: 'top 80%' } });
      });
      gsap.utils.toArray<HTMLElement>('.chat').forEach((c) => {
        gsap.from(c.children, { opacity: 0, y: 16, duration: 0.5, stagger: 0.6, ease: 'power2.out', scrollTrigger: { trigger: c, start: 'top 80%' } });
      });
      gsap.utils.toArray<HTMLElement>('.variants .score').forEach((sc, i) => {
        gsap.from(sc, { scale: 1.9, rotate: -8, opacity: 0, duration: 0.45, ease: 'back.out(2)', delay: 0.5 + (i % 3) * 0.3, scrollTrigger: { trigger: sc, start: 'top 85%' } });
      });

      /* agents: horizontal pinned track on wide screens */
      const mm = gsap.matchMedia();
      mm.add('(min-width: 1024px)', () => {
        const track = document.querySelector<HTMLElement>('.track')!;
        const dist = () => track.scrollWidth - innerWidth;
        gsap.to(track, {
          x: () => -dist(), ease: 'none',
          scrollTrigger: { trigger: '.agents-pin', start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 },
        });
      });

      createStages();

      /* product tilt */
      document.querySelectorAll<HTMLElement>('.product').forEach((el) => {
        el.addEventListener('pointermove', (e) => {
          const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
          el.style.setProperty('--mx', `${px * 100}%`); el.style.setProperty('--my', `${py * 100}%`);
          if (!field.paused) el.style.transform = `perspective(900px) rotateY(${(px - 0.5) * 6}deg) rotateX(${(0.5 - py) * 6}deg)`;
        });
        el.addEventListener('pointerleave', () => { el.style.transform = ''; });
      });
    });

    const refresh = setTimeout(() => ScrollTrigger.refresh(), 600);
    return () => {
      clearTimeout(typerT); clearInterval(clockI); clearTimeout(refresh);
      removeEventListener('scroll', onScroll);
      langBtn.removeEventListener('click', onLang); motionBtn.removeEventListener('click', onMotion);
      ctx.revert(); if (lenis) { gsap.ticker.remove(raf); lenis.destroy(); }
    };
  }, []);

  const approve = () => {
    if (approvedRef.current) return;
    approvedRef.current = true;
    setApproved(true);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { field.stage = 5; return; }
    gsap.timeline()
      .to(field, { burst: 1, duration: 0.45, ease: 'power2.in' })
      .add(() => { field.stage = 5; field.opacity = 1; })
      .to(field, { burst: 0, duration: 1.6, ease: 'expo.out' });
  };

  const hudState = (i: number) => {
    if (i === RUN_STEPS.length - 1) return approved ? 'approved' : step === i ? 'refused' : '';
    if (i < step) return 'done';
    if (i === step) return 'active';
    return '';
  };

  return (
    <>
      <a className="skip" href="#main"><B en="Skip to content" fr="Aller au contenu" /></a>
      <CodeField approvedWord="APPROVED" />
      <div className="vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <header className="top" id="top-bar">
        <div className="wrap">
          <a className="brand" href="#main"><img src="/assets/avatar-dark.png" alt="" width={30} height={30} /><b><span className="full">Orlando Rasolofoniaina</span><span className="short">Orlando R.</span></b></a>
          <nav className="nav run" aria-label="Sections">
            {[['#main', 'spec', 'Intro', 'Intro'], ['#agents', 'tests', 'Agents', 'Agents'], ['#principles', 'gates', 'Method', 'Méthode'], ['#products', 'review', 'Products', 'Produits'], ['#experience', 'PR', 'Experience', 'Parcours'], ['#contact', 'merge', 'Contact', 'Contact']].map(([href, code, en, fr], i) => (
              <a key={code} href={href} className={hudState(i)} aria-current={step === i ? 'step' : undefined}>
                <i aria-hidden="true" /><B en={en} fr={fr} />
              </a>
            ))}
          </nav>
          <button className="pill" id="lang" type="button">FR</button>
        </div>
        <div className="runbar" ref={hudBar}><i /></div>
      </header>


      <main id="main">
        {/* HERO · spec */}
        <section className="hero" data-stage="0" data-op="0.55" data-step="0">
          <div className="wrap">
            <div className="hero-copy">
              <h1 className="k en" aria-label="I build AI agents that ship real work.">
                <span className="line l1" aria-hidden="true">Agents</span>
                <span className="line l2" aria-hidden="true">that ship</span>
                <span className="line l3 accent" aria-hidden="true">real work<span className="dot" /></span>
              </h1>
              <h1 className="k fr" aria-label="Je construis des agents IA qui livrent vraiment.">
                <span className="line l1" aria-hidden="true">Des agents</span>
                <span className="line l2" aria-hidden="true">qui livrent</span>
                <span className="line l3 accent" aria-hidden="true">vraiment<span className="dot" /></span>
              </h1>
              <p className="who reveal"><b>Orlando Rasolofoniaina</b> · AI Engineer · Lyon</p>
              <p className="typer reveal" aria-live="off"><B en="Agents that " fr="Des agents qui " /><span className="word">{word}</span></p>
              <p className="lede reveal"><B en={<>Ten years keeping production running. Now I build LLM agents <b>whose guardrails live in code</b>, so your team can trust them with production.</>} fr={<>Dix ans à faire tourner la production. Aujourd&apos;hui, je construis des agents LLM <b>dont les garde-fous vivent dans le code</b>, pour que votre équipe puisse leur confier la prod.</>} /></p>
              <div className="ctas reveal">
                <a className="btn primary" href="#agents"><B en="See the agents" fr="Voir les agents" />{ARROW}</a>
                <a className="btn ghost" href="https://github.com/raorla" target="_blank" rel="noopener">{GH}GitHub</a>
                <a className="btn ghost" href="https://www.linkedin.com/in/orlandoras/" target="_blank" rel="noopener">{LI}LinkedIn</a>
              </div>
            </div>
          </div>
        </section>

        <section className="proof" data-stage="0" data-op="0.6" data-step="0" aria-label="Key figures">
          <div className="wrap">
            {[
              ['10', '+', ['years in tech, from infrastructure to AI agents', "ans dans la tech, de l'infra aux agents IA"]],
              ['1300', '+', ['automated tests across my agents', 'tests automatisés sur mes agents']],
              ['8', '', ['products built, most for Madagascar and its diaspora', 'produits conçus, surtout pour Madagascar et sa diaspora']],
              ['15', 'k+', ['LinkedIn followers, posting on crypto since 2018', 'abonnés LinkedIn, veille crypto depuis 2018']],
            ].map(([n, suf, lbl]) => (
              <div key={n as string}>
                <strong className="k"><span className="count" data-to={n as string}>{Number(n).toLocaleString('en-US')}</span><sup>{suf as string}</sup></strong>
                <span><B en={(lbl as string[])[0]} fr={(lbl as string[])[1]} /></span>
              </div>
            ))}
          </div>
        </section>

        {/* AGENTS · tests */}
        <section className="block" id="agents" data-stage="1" data-op="0.35" data-step="1">
          <div className="wrap">
            <div className="head">
              <div>
                <p className="step"><B en="AI agents" fr="Agents IA" /></p>
                <h2 className="k"><B en={<>Promises <span className="hl">kept in code.</span></>} fr={<>Des promesses <span className="hl">tenues par le code.</span></>} /></h2>
              </div>
              <p><B en="A prompt can be talked out of a rule. Code can't. For every agent I write down what it guarantees, where that guarantee is enforced, and the tests that prove it." fr="On peut convaincre un prompt d'oublier une règle, pas du code. Pour chaque agent, j'écris ce qu'il garantit, où c'est appliqué, et les tests qui le prouvent." /></p>
            </div>
          </div>
          <div className="agents-pin">
            <div className="track">
              <article className="agent">
                <div>
                  <span className="idx">AGENT 01 / 03</span>
                  <h3 className="k">Jules</h3>
                  <span className="tag"><B en="Self-hosted AI dev team" fr="Équipe de dev IA auto-hébergée" /></span>
                  <p className="desc"><B en={<>A self-hosted team of three agents. The <b>developer</b> takes an issue from spec to pull request, tests first, then a second model reviews it. <b>DevOps</b> runs servers over SSH. <b>Security</b> tracks every flaw to its fix.</>} fr={<>Une équipe de trois agents, auto-hébergée. Le <b>développeur</b> mène une issue de la spec à la pull request, tests d&apos;abord, puis un second modèle relit. Le <b>DevOps</b> opère les serveurs en SSH. La <b>sécurité</b> suit chaque faille jusqu&apos;à sa correction.</>} /></p>
                  <dl className="contract">
                    <div className="promise"><dt><B en="Promise" fr="Promesse" /></dt><dd><B en="No agent merges. None ever sees a secret." fr="Aucun agent ne merge. Aucun ne voit un secret." /></dd></div>
                    <div><dt><B en="Enforced by" fr="Appliquée par" /></dt><dd><B en="A policy engine in the worker. The agent runs keyless in a throwaway gVisor sandbox and can only ask." fr="Un moteur de règles dans le worker. L'agent tourne sans clé dans un sandbox gVisor jetable et ne peut que demander." /></dd></div>
                    <div className="proofrow"><dt><B en="Proof" fr="Preuve" /></dt><dd><b>11 milestones</b> shipped · 5 apps · 18 packages</dd></div>
                  </dl>
                  <div className="foot"><div className="chips"><span>Claude Agent SDK</span><span>Rust · Tauri</span><span>gVisor</span></div><a className="link" href="https://github.com/raorla/Jules" target="_blank" rel="noopener"><B en="Read the code" fr="Lire le code" /> ↗</a></div>
                </div>
                <div className="mock" aria-label="Example run of the Jules developer agent">
                  <div className="mock-bar"><span className="dots"><i /><i /><i /></span>jules · run 2041<span className="sp">acme/api #118</span></div>
                  <ol className="steps">
                    <li><i className="d">{CHECK}</i><time>00:41</time><div><b>spec</b> <span><B en="· approved by a human" fr="· validée par un humain" /></span></div></li>
                    <li><i className="d">{CHECK}</i><time>03:02</time><div><b>tests</b> <span><B en="· 9 written first, all red" fr="· 9 écrits d'abord, tous rouges" /></span></div></li>
                    <li><i className="d">{CHECK}</i><time>07:45</time><div><b>gates</b> <span>· lint · types · 214 tests · cov 96%</span></div></li>
                    <li><i className="d">{CHECK}</i><time>08:12</time><div><b>scans</b> <span>· gitleaks · semgrep · osv · trivy</span></div></li>
                    <li><i className="d">{CHECK}</i><time>09:30</time><div><b>review</b> <span><B en="· second model, 2 fixes" fr="· second modèle, 2 corrections" /></span></div></li>
                    <li><i className="d">{CHECK}</i><time>09:58</time><div><b>PR #119</b> <span><B en="· opened as draft" fr="· ouverte en brouillon" /></span></div></li>
                    <li className="no"><i className="d">{CROSS}</i><time>09:58</time><div><b>merge</b> <span><B en="· refused: agents never merge" fr="· refusé : un agent ne merge jamais" /></span></div></li>
                  </ol>
                  <div className="await"><span className="h"><i /><B en="Awaiting human review" fr="En attente de relecture humaine" /></span><span className="c">$0.61 · 9m58s</span></div>
                  <div className="mock-note"><B en="Example run, following Jules' real workflow and gates." fr="Exemple d'exécution, selon le vrai workflow de Jules." /></div>
                </div>
              </article>

              <article className="agent">
                <div>
                  <span className="idx">AGENT 02 / 03</span>
                  <h3 className="k">Koto</h3>
                  <span className="tag"><B en="Personal agent on Telegram" fr="Agent personnel sur Telegram" /></span>
                  <p className="desc"><B en={<>An agent that learns what you work on and what matters to you. <b>Long-term memory</b>, reminders, a morning brief, Gmail and Calendar through MCP, web tasks in a real browser, missions that run for days.</>} fr={<>Un agent qui apprend sur quoi vous travaillez et ce qui compte pour vous. <b>Mémoire longue</b>, rappels, brief du matin, Gmail et Agenda via MCP, tâches web dans un vrai navigateur, missions qui tournent des jours.</>} /></p>
                  <dl className="contract">
                    <div className="promise"><dt><B en="Promise" fr="Promesse" /></dt><dd><B en="Nothing leaves without your approval." fr="Rien ne part sans votre accord." /></dd></div>
                    <div><dt><B en="Enforced by" fr="Appliquée par" /></dt><dd><B en="Emails, events and payments are prepared as Confirm / Cancel cards. Passwords come from 1Password, never the model." fr="Mails, rendez-vous et paiements sont préparés en cartes Confirmer / Annuler. Les mots de passe viennent de 1Password, jamais du modèle." /></dd></div>
                    <div className="proofrow"><dt><B en="Proof" fr="Preuve" /></dt><dd><b>285 tests</b> · unit · integration · system · live</dd></div>
                  </dl>
                  <div className="foot"><div className="chips"><span>Claude</span><span>MCP</span><span>SQLite FTS5</span></div><a className="link" href="https://github.com/raorla/Koto" target="_blank" rel="noopener"><B en="Read the code" fr="Lire le code" /> ↗</a></div>
                </div>
                <div className="mock" aria-label="Example Koto conversation">
                  <div className="mock-bar"><span className="dots"><i /><i /><i /></span>Koto<span className="sp">Telegram</span></div>
                  <div className="chat">
                    <div className="bub me"><B en="Tell Rado I approve the quote, and remind me Thursday to send the deposit." fr="Dis à Rado que je valide le devis, et rappelle-moi jeudi d'envoyer l'acompte." /></div>
                    <div className="bub bot"><B en="Reminder set for Thursday 9:00. Here's the email, ready to go:" fr="Rappel posé jeudi à 9 h. Voici le mail, prêt à partir :" /></div>
                    <div className="card-mail">
                      <div className="mh"><b>To</b> rado@… · <b>Subject</b> <B en="Quote approved" fr="Devis validé" /></div>
                      <div className="mb"><B en="Hi Rado, I approve the quote you sent on Monday. The deposit follows on Thursday." fr="Bonjour Rado, je valide le devis envoyé lundi. L'acompte suit jeudi." /></div>
                      <div className="act"><span>{CHECK}<B en="Confirm" fr="Confirmer" /></span><span>{CROSS}<B en="Cancel" fr="Annuler" /></span></div>
                    </div>
                    <div className="waiting"><B en="Nothing sent yet: waiting for your tap" fr="Rien n'est parti : en attente de votre geste" /></div>
                  </div>
                  <div className="mock-note"><B en="Illustration of Koto's real confirmation flow." fr="Illustration du vrai flux de confirmation de Koto." /></div>
                </div>
              </article>

              <article className="agent">
                <div>
                  <span className="idx">AGENT 03 / 03</span>
                  <h3 className="k">Swarm</h3>
                  <span className="tag"><B en="Multi-agent browser copilot" fr="Copilote multi-agents" /></span>
                  <p className="desc"><B en={<>Seven agents for one X account, inside a Chrome extension: a scout, a qualifier, a writer that drafts three variants in your voice, a <b>critic with a veto</b>, a publisher and an analyst that measures real results.</>} fr={<>Sept agents pour un compte X, dans une extension Chrome : éclaireur, trieur, rédacteur qui écrit trois variantes dans votre voix, <b>critique avec droit de veto</b>, éditeur et analyste qui mesure les vrais résultats.</>} /></p>
                  <dl className="contract">
                    <div className="promise"><dt><B en="Promise" fr="Promesse" /></dt><dd><B en="Nothing leaves your browser except the LLM call." fr="Rien ne quitte votre navigateur, sauf l'appel au LLM." /></dd></div>
                    <div><dt><B en="Enforced by" fr="Appliquée par" /></dt><dd><B en="A test reads the sources and rejects any network call outside the LLM module. Auto-posting code doesn't exist." fr="Un test lit les sources et refuse tout appel réseau hors du module LLM. Le code de publication automatique n'existe pas." /></dd></div>
                    <div className="proofrow"><dt><B en="Proof" fr="Preuve" /></dt><dd><b>1,023 tests</b> · 68 files · hermetic</dd></div>
                  </dl>
                  <div className="foot"><div className="chips"><span>Chrome MV3</span><span>XState</span><span>Ollama</span></div><a className="link" href="https://github.com/raorla/SWARM" target="_blank" rel="noopener"><B en="Read the code" fr="Lire le code" /> ↗</a></div>
                </div>
                <div className="mock" aria-label="Example SWARM critic panel">
                  <div className="mock-bar"><span className="dots"><i /><i /><i /></span>SWARM · critic<span className="sp"><B en="side panel" fr="panneau" /></span></div>
                  <div className="variants">
                    <div className="ctx-post"><small>@builder · 2h</small><B en="Anyone actually running agents in production? What broke first?" fr="Quelqu'un fait vraiment tourner des agents en prod ? Qu'est-ce qui a cassé en premier ?" /></div>
                    <div className="var pass"><B en="Cost, before quality. Price every call from the API's own usage and give the agent a daily cap that actually cuts." fr="Le coût, avant la qualité. Chiffrer chaque appel depuis l'usage renvoyé par l'API, et un plafond du jour qui coupe vraiment." /><span className="score">0.86</span></div>
                    <div className="var fail"><B en="Honestly everything breaks lol, agents are hype 🚀" fr="Franchement tout casse lol, les agents c'est du hype 🚀" /><span className="score">0.41 veto</span></div>
                    <div className="var fail"><B en="Great question! Here are 10 tips to…" fr="Excellente question ! Voici 10 astuces pour…" /><span className="score">0.58 veto</span></div>
                    <div className="thresh"><B en="Threshold 0.75, enforced in code · pre-filled in X, you click Post" fr="Seuil 0,75, appliqué dans le code · pré-rempli dans X, c'est vous qui publiez" /></div>
                  </div>
                  <div className="mock-note"><B en="Illustration of SWARM's critic veto." fr="Illustration du veto du critique de SWARM." /></div>
                </div>
              </article>
            </div>
          </div>
          <div className="wrap">
            <div className="more">
              <div className="mini"><h4 className="k">Bastien <small><B en="On request" fr="Sur demande" /></small></h4><p><B en="An AI companion for older people and their families: reminders, daily organisation and someone to talk to." fr="Un compagnon IA pour les personnes âgées et leurs proches : rappels, organisation du quotidien et une présence." /></p></div>
              <div className="mini"><h4 className="k">agentWSB <small><B en="On request" fr="Sur demande" /></small></h4><p><B en="An autonomous agent that manages an on-chain USDG vault on Robinhood Chain." fr="Un agent autonome qui gère un vault USDG on-chain sur Robinhood Chain." /></p></div>
              <div className="mini"><h4 className="k">Soulkey <small><B en="On request" fr="Sur demande" /></small></h4><p><B en="A proof-of-human layer for the AI-agent economy, as a Telegram Mini App on TON." fr="Une preuve d'humanité pour l'économie des agents IA, en Telegram Mini App sur TON." /></p></div>
              <div className="mini"><h4 className="k">Hypertrade <small><B en="On request" fr="Sur demande" /></small></h4><p><B en="Claude skills and a decision engine for crypto trades: screener, 4-layer validation, backtest. Analysis only: never places orders, never holds keys." fr="Des skills Claude et un moteur de décision pour le trading crypto : screener, validation en 4 couches, backtest. Analyse seulement : aucun ordre, aucune clé." /></p></div>
            </div>
          </div>
        </section>

        {/* PRINCIPLES · gates */}
        <section className="block" id="principles" data-stage="2" data-op="0.42" data-step="2">
          <div className="wrap">
            <div className="head">
              <div>
                <p className="step"><B en="How I build" fr="Ma méthode" /></p>
                <h2 className="k"><B en={<>Four rules. <span className="hl">No exceptions.</span></>} fr={<>Quatre règles. <span className="hl">Aucune exception.</span></>} /></h2>
              </div>
              <p><B en="They come from ten years of running production systems, before agents existed." fr="Elles viennent de dix ans à faire tourner des systèmes en production, avant les agents." /></p>
            </div>
            <div className="rules">
              <div><span className="n">deny_by_default</span><h4 className="k"><B en="Rules live in code" fr="Les règles vivent dans le code" /></h4><p><B en="Permissions, limits and gates are evaluated by tested code. Anything not allowed is refused." fr="Permissions, plafonds et gates sont évalués par du code testé. Tout ce qui n'est pas autorisé est refusé." /></p></div>
              <div><span className="n">require_approval</span><h4 className="k"><B en="A human approves the irreversible" fr="Un humain valide l'irréversible" /></h4><p><B en="Merges, payments, emails and production changes always wait for a person." fr="Merge, paiement, mail, changement en production : tout attend une personne." /></p></div>
              <div><span className="n">daily_budget</span><h4 className="k"><B en="Real costs, hard budgets" fr="Coûts réels, budgets fermes" /></h4><p><B en="Every call is priced from what the API returns, and the daily cap cuts." fr="Chaque appel est chiffré depuis ce que renvoie l'API, et le plafond du jour coupe." /></p></div>
              <div><span className="n">test:live</span><h4 className="k"><B en="Test at every level" fr="Tester à chaque niveau" /></h4><p><B en="Unit, integration, system, then a live run with real keys, kept separate and named." fr="Unitaires, intégration, système, puis un passage réel avec de vraies clés, séparé et nommé." /></p></div>
            </div>
          </div>
        </section>

        {/* WEB3 · gates */}
        <section className="block" id="web3" data-stage="2" data-op="0.3" data-step="2">
          <div className="wrap">
            <div className="head">
              <div>
                <p className="step"><B en="Web3" fr="Web3" /></p>
                <h2 className="k"><B en={<>Confidential, <span className="hl">by design.</span></>} fr={<>Confidentiel, <span className="hl">par conception.</span></>} /></h2>
              </div>
              <p><B en="Every day I help developers build on iExec. Here is what I built on it myself." fr="Chaque jour, j'aide les développeurs qui construisent sur iExec. Voici ce que j'ai construit moi-même dessus." /></p>
            </div>
            <div className="list">
              <a href="https://raorla.github.io/CRYPTOWORDLE/" target="_blank" rel="noopener"><h3 className="k">CryptoWordle</h3><p><B en="A Wordle nobody can cheat: the word stays encrypted, hints are computed on ciphertext, the pot pays out on-chain." fr="Un Wordle impossible à tricher : le mot reste chiffré, les indices sont calculés sur le chiffré, le gain est versé on-chain." /></p><span className="meta"><B en="Live · 78 tests" fr="En ligne · 78 tests" /> ↗</span></a>
              <a href="https://github.com/raorla/DarkPool" target="_blank" rel="noopener"><h3 className="k">DarkPool</h3><p><B en="Private order matching inside an enclave, confidential tokens and gasless stealth trading." fr="Appariement d'ordres privé en enclave, tokens confidentiels et trading furtif sans gas." /></p><span className="meta">Sepolia · 47 tests ↗</span></a>
              <a href="https://dashboard-tdx.vercel.app" target="_blank" rel="noopener"><h3 className="k">DashboardTDX</h3><p><B en="Real-time analytics for iExec TDX workerpools on Arbitrum, from GraphQL subgraphs." fr="Statistiques temps réel des workerpools TDX d'iExec sur Arbitrum, via GraphQL." /></p><span className="meta"><B en="Live" fr="En ligne" /> ↗</span></a>
            </div>
          </div>
        </section>

        {/* PRODUCTS · review */}
        <section className="block" id="products" data-stage="3" data-op="0.4" data-step="3">
          <div className="wrap">
            <div className="head">
              <div>
                <p className="step"><B en="Products" fr="Produits" /></p>
                <h2 className="k"><B en={<>Lyon to <span className="hl">Antananarivo.</span></>} fr={<>De Lyon à <span className="hl">Antananarivo.</span></>} /></h2>
                <div className="clocks" aria-label="Local times"><span>Lyon <b id="t-lyon">--:--</b></span><span>Antananarivo <b id="t-tana">--:--</b></span></div>
              </div>
              <p><B en={<>Mobile money instead of cards, patchy networks, a diaspora sending money home. Through my studio <a href="https://lyrify.studio/" target="_blank" rel="noopener">Lyrify Studio</a>, I design and ship products for those conditions.</>} fr={<>Du mobile money plutôt que des cartes, un réseau qui tombe, une diaspora qui envoie de l&apos;argent au pays. Avec mon studio <a href="https://lyrify.studio/" target="_blank" rel="noopener">Lyrify Studio</a>, je conçois et livre des produits pour ces conditions.</>} /></p>
            </div>
            <div className="grid">
              {[
                ['Myvola', 'https://github.com/myVolaApp', ['Diaspora FX', 'Change diaspora'], ['A personal AI agent to swap euros or dollars for ariary, person to person.', 'Un agent IA personnel pour échanger euros ou dollars contre des ariary, de personne à personne.'], ['A deterministic SQL matching engine, and a product that never holds money.', "Un moteur de rapprochement SQL déterministe, et un produit qui ne détient jamais d'argent."]],
                ['MGLive', 'https://github.com/Lychee-teams', ['Live shopping', 'Live shopping'], ['Buy during a live video, pay by mobile money, the seller is paid on delivery.', 'On achète pendant un live, on paie en mobile money, la vendeuse est payée à la livraison.'], ['Escrow on a double-entry ledger that must balance after every order.', "Un séquestre sur une comptabilité en partie double qui doit s'équilibrer après chaque commande."]],
                ['Briisa', 'https://github.com/BriisaApp', ['Ticketing', 'Billetterie'], ['The event app delivered with your ticket: map, programme, emergency screen, staff gate app.', "L'app de l'événement livrée avec le billet : plan, programme, écran d'urgence, app de contrôle."], ['It works offline: a Bluetooth and Wi-Fi mesh with end-to-end encrypted chat.', 'Elle marche hors ligne : un mesh Bluetooth et Wi-Fi avec chat chiffré de bout en bout.']],
                ['ZAP', 'https://zap.zapew.com', ['Anonymous chat', 'Chat anonyme'], ['Meet strangers in seconds, keep the conversations that click.', 'Rencontrer des inconnus en quelques secondes, garder les conversations qui comptent.'], ['An AI companion when no human is free, and every message moderated before relay.', 'Un compagnon IA quand personne n\'est libre, et chaque message modéré avant relais.']],
                ['Lyrify', 'https://github.com/MozikaApp', ['Music app', 'App musicale'], ['Malagasy music, from salegy to tsapiky, with karaoke lyrics in three languages.', 'La musique malgache, du salegy au tsapiky, avec paroles karaoké en trois langues.'], ['Offline downloads for expensive data, and a pass paid by mobile money.', 'Le hors ligne quand les données coûtent cher, et un pass payé en mobile money.']],
                ['PixStock', 'https://github.com/PixStock/pixstock', ['Hackathon · Solana', 'Hackathon · Solana'], ['An old phone in airplane mode becomes a hardware-grade signer for tokenized stocks.', 'Un vieux téléphone en mode avion devient un signataire matériel pour actions tokenisées.'], ['A real mainnet swap signed offline, from a vault that never held a lamport.', "Un vrai swap mainnet signé hors ligne, depuis un vault qui n'a jamais détenu un lamport."]],
              ].map(([name, href, kind, desc, hard]) => (
                <a key={name as string} className="product" href={href as string} target="_blank" rel="noopener">
                  <header><h3 className="k">{name as string}</h3><span className="kind"><B en={(kind as string[])[0]} fr={(kind as string[])[1]} /></span></header>
                  <p><B en={(desc as string[])[0]} fr={(desc as string[])[1]} /></p>
                  <div className="hard"><span className="lbl"><B en="The hard part" fr="Le plus dur" /></span><B en={(hard as string[])[0]} fr={(hard as string[])[1]} /></div>
                </a>
              ))}
            </div>
            <p className="also"><B en="Also built:" fr="Aussi :" /> <a href="https://github.com/DegenFamily" target="_blank" rel="noopener">DegenRank</a> <B en="(staked token ranking on Solana)" fr="(classement de tokens par mise réelle)" /> · <a href="https://github.com/LooviApp" target="_blank" rel="noopener">Loovi</a> <B en="(dating with verified profiles)" fr="(rencontres avec profils vérifiés)" /></p>
          </div>
        </section>

        {/* EXPERIENCE · PR */}
        <section className="block" id="experience" data-stage="4" data-op="0.3" data-step="4">
          <div className="wrap">
            <div className="head">
              <div>
                <p className="step"><B en="Experience" fr="Parcours" /></p>
                <h2 className="k"><B en={<>Ten years of prod, <span className="hl">then agents.</span></>} fr={<>Dix ans de prod, <span className="hl">puis les agents.</span></>} /></h2>
              </div>
              <p><B en="Industry, consulting, a SaaS scale-up and a Web3 platform. Two companies co-founded along the way. Open a role for the details." fr="Industrie, conseil, scale-up SaaS et plateforme Web3. Deux entreprises cofondées en chemin. Ouvrez un poste pour le détail." /></p>
            </div>
            <div className="jobs">
              {[
                { t: '01/2024 · now', now: true, title: ['Web3 Support Engineer', 'Web3 Support Engineer'], at: 'iExec', sub: ['L2/L3 support on a confidential computing platform, international team.', "Support N2/N3 d'une plateforme de calcul confidentiel, équipe internationale."], open: true,
                  en: ['L2/L3 support for the platform and its blockchain products: REST APIs, JavaScript and TypeScript SDKs, smart contracts, developer tools.', 'Incident diagnosis on a distributed, event-driven architecture: on-chain transactions and events, off-chain services, confidential computing.', 'Support for developers and partners integrating the stack; the link between users, product and engineering.', 'API management and continuous improvement: documentation, support processes, product feedback.'],
                  fr: ['Support N2/N3 de la plateforme et des produits blockchain : APIs REST, SDK JavaScript et TypeScript, smart contracts, outils développeurs.', 'Diagnostic d\'incidents sur une architecture distribuée et événementielle : transactions et événements on-chain, services off-chain, calcul confidentiel.', 'Accompagnement des développeurs et partenaires qui intègrent la stack ; interface entre utilisateurs, produit et équipes techniques.', 'API Management et amélioration continue : documentation, processus de support, remontées produit.'] },
                { t: '04/2022 · 12/2023', title: ['IT Systems & Cloud Engineer', 'Ingénieur systèmes et cloud'], at: 'Agicap', sub: ['The IT stack of a SaaS scale-up in hypergrowth.', "Le SI d'une scale-up SaaS en hypercroissance."],
                  en: ['Designed and maintained the IT SaaS stack and the integrations between apps: SSO (SAML, OIDC), identity and access management, API automations.', 'Administered Azure and Entra ID, Microsoft 365, Google Workspace and Okta; device provisioning with Intune; infrastructure monitoring.', 'Incident management and continuous improvement of IT services.'],
                  fr: ['Conception et maintien des solutions SaaS de la DSI ; intégration entre applications : SSO (SAML, OIDC), gestion des identités et des accès, automatisations via API.', 'Administration Azure et Entra ID, Microsoft 365, Google Workspace, Okta ; provisioning des postes via Intune ; monitoring de l\'infrastructure.', 'Gestion des incidents et amélioration continue des services de la DSI.'] },
                { t: '03/2020 · 02/2022', title: ['IT Engineer', 'Ingénieur informatique'], at: 'POP-IT', sub: ['Open-source integration and managed services for clients.', 'Intégration open source et infogérance chez les clients.'],
                  en: ['Client projects integrating open-source solutions, from scoping and deployment to fully managed IT.', 'Interconnection of systems and networks; internal management and monitoring tools.'],
                  fr: ['Missions clients d\'intégration de solutions open source, du cadrage et du déploiement jusqu\'à l\'infogérance complète du SI.', 'Interconnexion de systèmes et de réseaux, outils internes de gestion et de supervision.'] },
                { t: '02/2017 · 11/2019', title: ['Systems & Infrastructure Engineer', 'Ingénieur systèmes et infrastructures'], at: 'STAR', sub: ['Multi-site IT of an industrial group in Madagascar.', "SI multi-sites d'un groupe industriel à Madagascar."],
                  en: ['Windows Server, Active Directory, Linux, VMware; LAN/WAN networks; Oracle and SQL databases; Exchange and Office 365.', 'Backups (Veeam), monitoring (SolarWinds, GLPI/OCS), infrastructure security, Shell automation.'],
                  fr: ['Windows Server, Active Directory, Linux, VMware ; réseaux LAN/WAN ; bases Oracle et SQL ; Exchange et Office 365.', 'Sauvegardes (Veeam), supervision (SolarWinds, GLPI/OCS), sécurité des infrastructures, automatisation Shell.'] },
                { t: '2016 · 2021', title: ['Co-founder, then founder', 'Cofondateur, puis fondateur'], at: 'Startcheme, ACTIVE 101', sub: ['A web and mobile agency, then an IT consultancy.', 'Une agence web et mobile, puis un cabinet de conseil IT.'],
                  en: ['Built the offer, ran business development and managed the delivery team (co-founder and business developer, then founder and CTO).'],
                  fr: ['Construction de l\'offre, développement commercial et encadrement de l\'équipe de production (cofondateur et business developer, puis fondateur et directeur technique).'] },
              ].map((j) => (
                <details key={j.at} className="job" open={j.open}>
                  <summary>
                    <time className={j.now ? 'now' : undefined}>{j.t}</time>
                    <span className="chev" aria-hidden="true" />
                    <span className="jt k"><B en={j.title[0]} fr={j.title[1]} /> <span className="at">· {j.at}</span><span className="sub"><B en={j.sub[0]} fr={j.sub[1]} /></span></span>
                  </summary>
                  <ul className="en">{j.en.map((l) => <li key={l}>{l}</li>)}</ul>
                  <ul className="fr">{j.fr.map((l) => <li key={l}>{l}</li>)}</ul>
                </details>
              ))}
              <p className="early"><B en="2013 · 2017 · Support Engineer at EASYTECH for Neocles / Orange Business Services, helpdesk at Eufonie, web integration at Web Services OI, internship at the Civil Aviation of Madagascar." fr="2013 · 2017 · Ingénieur support chez EASYTECH pour Neocles / Orange Business Services, helpdesk chez Eufonie, intégration web chez Web Services OI, stage à l'Aviation Civile de Madagascar." /></p>
            </div>
          </div>
        </section>

        {/* SKILLS · PR */}
        <section className="block" id="skills" data-stage="4" data-op="0.22" data-step="4">
          <div className="wrap">
            <div className="head">
              <div>
                <p className="step"><B en="Skills" fr="Compétences" /></p>
                <h2 className="k"><B en={<>The toolbox, <span className="hl">sorted by use.</span></>} fr={<>La boîte à outils, <span className="hl">par usage.</span></>} /></h2>
              </div>
              <p><B en="Highlighted: what I use every day." fr="En surbrillance : ce que je pratique au quotidien." /></p>
            </div>
            <div className="creds">
              <div className="skillset">
                <div><h4><B en="AI & agents" fr="IA et agents" /></h4><div className="tags"><span className="on">Claude Agent SDK</span><span className="on">MCP</span><span className="on"><B en="Multi-agent systems" fr="Multi-agents" /></span><span className="on">Prompt engineering</span><span>OpenRouter</span><span>Ollama</span><span>Whisper</span></div></div>
                <div><h4>Code</h4><div className="tags"><span className="on">TypeScript</span><span className="on">Node.js</span><span className="on">Python</span><span>Rust</span><span>Go</span><span>C# / .NET</span><span>Dart / Flutter</span><span>Solidity</span><span>NestJS</span><span>React / Next.js</span><span>PostgreSQL</span></div></div>
                <div><h4><B en="Integration & APIs" fr="Intégration et APIs" /></h4><div className="tags"><span className="on">REST</span><span className="on">WebSocket</span><span className="on">SDK JS / TS</span><span className="on">API Management</span><span>Webhooks</span><span>SSO SAML / OIDC</span><span>IAM</span><span>GraphQL</span></div></div>
                <div><h4><B en="Cloud & ops" fr="Cloud et exploitation" /></h4><div className="tags"><span className="on">Docker</span><span className="on">CI/CD</span><span className="on">Linux</span><span>Azure</span><span>Entra ID</span><span>Intune</span><span>Okta</span><span>Microsoft 365</span><span>Windows Server</span><span>VMware</span></div></div>
                <div><h4>Web3</h4><div className="tags"><span className="on">Ethereum</span><span className="on">TEE</span><span>Smart contracts</span><span>Arbitrum</span><span>Solana</span><span>TON</span></div></div>
              </div>
              <div>
                <h3>Certifications</h3>
                <div className="rows">
                  <div><span><b>Claude Code 101</b> · Anthropic</span><time>2026</time></div>
                  <div><span><b><B en="Professional Certificate in AI" fr="Certificat pro en IA" /></b> · Microsoft</span><time>2026</time></div>
                  <div><span><b>Security Essentials</b> · Microsoft</span><time>2025</time></div>
                  <div><span><b>Cloud Computing</b> · IBM</span><time>2024</time></div>
                  <div><span><b><B en="Security Risk Mgmt" fr="Risques de sécurité" /></b> · Google</span><time>2024</time></div>
                  <div><span><b>Web3 Professional</b> · IMTF</span><time>2024</time></div>
                  <div><span><b>Blockchain Professional</b> · IMTF</span><time>2024</time></div>
                  <div><span><b>CTO Executive</b> · IMTF</span><time>2024</time></div>
                </div>
              </div>
              <div className="edu">
                <h3><B en="Education & languages" fr="Formation et langues" /></h3>
                <p><b><B en="MSc in Computer Science" fr="Master 2 Informatique" /></b><B en="AI track, ISPM Madagascar, 2016. Level 7 (ENIC-NARIC France)." fr="Spécialité IA, ISPM Madagascar, 2016. Niveau 7 (ENIC-NARIC France)." /></p>
                <p><b><B en="BSc in Computer Science" fr="Licence en informatique" /></b>ISPM Madagascar, 2013.</p>
                <p><b>Executive Diploma in Business Administration</b>IMTF, 2024.</p>
                <p><b><B en="Languages" fr="Langues" /></b><B en="French fluent · English professional · Malagasy native" fr="Français courant · anglais professionnel · malgache maternel" /></p>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT · merge */}
        <section className="close" id="contact" data-stage="4" data-op="0.65" data-step="5">
          <div className="wrap">
            <div className="merge">
              <p className={`refused${approved ? ' ok' : ''}`} role="status">
                {approved
                  ? <B en="Merge approved by a human. Thank you." fr="Merge approuvé par un humain. Merci." />
                  : <B en="Merge refused: agents never merge. A human has to approve." fr="Merge refusé : un agent ne merge jamais. Un humain doit approuver." />}
              </p>
              <h2 className="k"><B en={<>Your turn, <span className="hl">human.</span></>} fr={<>À vous, <span className="hl">l&apos;humain.</span></>} /></h2>
              <p><B en="Open to AI Engineer, Forward Deployed Engineer and Web3 roles, in Lyon or remote. Approve the run, then get in touch. LinkedIn is the fastest way to reach me." fr="Ouvert aux postes d'AI Engineer, de Forward Deployed Engineer et Web3, à Lyon ou à distance. Approuvez le run, puis écrivez-moi. LinkedIn est le moyen le plus rapide." /></p>
              <button className="approve" type="button" aria-pressed={approved} onClick={approve}>
                <span className="key">{CHECK}</span>
                {approved ? <B en="Approved" fr="Approuvé" /> : <B en="Approve as a human" fr="Approuver en tant qu'humain" />}
              </button>
              <div className="contact-links">
                <a className="btn primary" href="https://www.linkedin.com/in/orlandoras/" target="_blank" rel="noopener">{LI}<B en="Message me on LinkedIn" fr="M'écrire sur LinkedIn" /></a>
                <a className="btn ghost" href="https://github.com/raorla" target="_blank" rel="noopener">{GH}GitHub</a>
                <a className="btn ghost" href="https://lyrify.studio/" target="_blank" rel="noopener">Lyrify Studio</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <span>© 2026 Orlando Rasolofoniaina</span>
          <button className="motion-link" id="motion" type="button"><span className="m-pause"><B en="Pause animations" fr="Mettre les animations en pause" /></span><span className="m-play"><B en="Play animations" fr="Relancer les animations" /></span></button>
        </div>
      </footer>
    </>
  );
}
