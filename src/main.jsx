import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { scenarios } from './scenarios';
import { LIMIT_MS, QUESTION_COUNT, makeRound, gradeRound, formatTime, rankEntries, validName } from './game';
import { getResults, saveResult, clearResults } from './storage';
import './style.css';

function App() {
  const [screen, setScreen] = useState('welcome');
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [remaining, setRemaining] = useState(LIMIT_MS);
  const [result, setResult] = useState(null);
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState([]);
  const [storageError, setStorageError] = useState(false);
  const [nameError, setNameError] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const started = useRef(0);
  const finished = useRef(false);
  const answersRef = useRef([]);
  const heading = useRef(null);
  async function refresh() {
    // Older one-question scores are preserved in storage, but excluded from this new format.
    try { setEntries(rankEntries((await getResults()).filter(entry => entry.format === 'three-question-v1'))); setStorageError(false); }
    catch { setStorageError(true); }
  }
  useEffect(() => { refresh(); }, []);
  useEffect(() => { heading.current?.focus(); }, [screen, index]);
  function begin() {
    setQuestions(makeRound(scenarios)); setIndex(0); setAnswers([]); answersRef.current = [];
    setRemaining(LIMIT_MS); setResult(null); setName(''); setSaved(false); setNameError(''); setConfirmClear(false);
    finished.current = false; started.current = Date.now(); setScreen('game');
  }
  function choose(value) {
    const next = [...answersRef.current]; next[index] = value;
    answersRef.current = next; setAnswers(next);
  }
  function finish(elapsed, finalAnswers = answersRef.current) {
    if (finished.current) return;
    finished.current = true;
    setResult(gradeRound(questions, finalAnswers, elapsed)); setScreen('result');
  }
  function next() {
    const elapsed = Date.now() - started.current;
    if (elapsed >= LIMIT_MS) { finish(elapsed); return; }
    if (index === QUESTION_COUNT - 1) finish(elapsed);
    else setIndex(index + 1);
  }
  useEffect(() => {
    if (screen !== 'game') return;
    const tick = () => {
      const elapsed = Date.now() - started.current;
      setRemaining(Math.max(0, LIMIT_MS - elapsed));
      if (elapsed >= LIMIT_MS) finish(elapsed);
    };
    tick(); const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [screen, questions]);
  async function save(e) {
    e.preventDefault();
    if (!validName(name)) { setNameError('Please enter a name between 1 and 24 characters.'); return; }
    if (saving || saved) return;
    setSaving(true); setNameError('');
    try { await saveResult({ name: name.trim(), score: result.score, time: result.time, createdAt: Date.now(), format: 'three-question-v1' }); setSaved(true); await refresh(); }
    catch { setStorageError(true); }
    finally { setSaving(false); }
  }
  async function clear() {
    try { await clearResults(); setEntries([]); setStorageError(false); setConfirmClear(false); }
    catch { setStorageError(true); setConfirmClear(false); }
  }
  const question = questions[index];
  const memoLines = ['“First clue! Let’s see what the brief actually says.”', '“Nice work, detective. Another slide needs your eyes.”', '“One last check before I step on stage!”'];
  const mascot = `${import.meta.env.BASE_URL}assets/memo-ai-v2.png`;
  const leaderboard = <section className="leaderboard" aria-labelledby="leader-heading"><div className="leader-title"><div><span className="kicker">MEMO’S FACT-CHECKING CREW</span><h2 id="leader-heading">Leaderboard <span>✦</span></h2></div><p>Good eyes. Quick thinking.<br/>Results stay on this device.</p></div><div className="leader-table"><div className="leader-labels"><span>RANK / DETECTIVE</span><span>POINTS</span><span>TIME</span></div>{entries.length === 0 ? <div className="empty"><span>✳</span><div><strong>No detectives yet.</strong><p>Help Memo and be the first on the board!</p></div></div> : <ol>{entries.map((entry, i) => <li key={entry.id}><span><b>{String(i + 1).padStart(2, '0')}</b> {entry.name}</span><strong>{entry.score}</strong><span>{formatTime(entry.time)}</span></li>)}</ol>}</div><p className="local-note">Scores are stored locally in this browser and aren’t shared across devices. Earlier one-question scores aren’t ranked here.</p>{storageError && <p className="error" role="alert">Browser storage is unavailable. Scores may not be saved; check browser settings and try again.</p>}<div className="volunteer"><span>FOR BOOTH VOLUNTEERS</span>{confirmClear ? <div className="confirm"><p>Clear all scores, including older scores, from this browser?</p><button onClick={clear}>Yes, clear scores</button><button onClick={() => setConfirmClear(false)}>Cancel</button></div> : <button onClick={() => setConfirmClear(true)}>Clear local leaderboard ↗</button>}</div></section>;
  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#top"><img src={mascot} alt=""/><span>Memo’s Accuracy Challenge</span></a><span className="top-label"><i/> REZOOMEX <b>✦</b> REACT HYDERABAD UTSAVAM 2026</span></header>
    <main id="top">
      {screen === 'welcome' && <>
        <section className="hero"><div className="hero-copy"><div className="eyebrow"><span/> A MISSION FOR MEMO’S CONTEXT DETECTIVE</div><h1 ref={heading} tabIndex="-1">A big presentation.<br/><em>A little fact-check.</em></h1><p className="intro">Memo’s almost ready for the Utsavam stage. An AI assistant helped write the slides, but a few details don’t quite match the project briefs. Can you help Memo spot them?</p><div className="hero-tags"><span>◷ &nbsp; 90 SECONDS</span><span>▦ &nbsp; 3 SLIDES</span><span>✳ &nbsp; ONE MISSION</span></div><button className="primary" onClick={begin}>Help Memo check the slides <span>↗</span></button><p className="small-print">No sign-up needed. Just bring your detective eyes.</p></div><div className="hero-art"><div className="art-label"><span>MEMO’S BACKSTAGE</span><span>01 / 03</span></div><div className="art-circle"/><img src={mascot} alt="Memo getting ready to present"/><div className="speech">“I’m on stage soon!<br/><strong>Can you check my slides?</strong>” <span>✳</span></div><span className="art-sparkle">✳</span></div></section>
        <section className="mission"><div className="mission-heading"><span className="kicker">THE MISSION</span><h2>Help Memo get<br/>the story straight<span>.</span></h2></div><div className="mission-step"><span>01</span><h3>Read the brief</h3><p>Every slide starts with the team’s actual requirements.</p></div><div className="mission-step"><span>02</span><h3>Spot the extra</h3><p>Find the one AI statement the brief doesn’t support.</p></div><div className="mission-step"><span>03</span><h3>Save the show</h3><p>Earn 100 points per correct answer, up to 300. Incorrect or unanswered slides earn 0. Faster times break ties.</p></div></section>{leaderboard}
      </>}
      {screen === 'game' && <section className="play-area"><div className="play-top"><div><span className="kicker">MEMO’S PRESENTATION CHECK</span><h1 ref={heading} tabIndex="-1">One slide at a time<span>.</span></h1><p>Find the statement that goes beyond the project brief.</p></div><div className={'timer ' + (remaining <= 15000 ? 'urgent' : '')} aria-label={`${Math.ceil(remaining / 1000)} seconds remaining`}><span>TIME LEFT</span><strong>◷ &nbsp;{Math.floor(Math.ceil(remaining / 1000) / 60)}:{String(Math.ceil(remaining / 1000) % 60).padStart(2, '0')}</strong></div></div><div className="game-progress"><span>SLIDE {index + 1} OF {QUESTION_COUNT}</span><div className="progress" aria-label={`Question ${index + 1} of ${QUESTION_COUNT}`}>{questions.map((q,i) => <span key={q.id} className={i <= index ? 'filled' : ''}/>)}</div><span>THE TIMER IS RUNNING</span></div><div className="game-board"><section className="brief"><div className="paper-holes" aria-hidden="true">○<br/>○<br/>○</div><div className="brief-inner"><div className="section-label"><span>THE TEAM’S NOTES</span><span>✎</span></div><h2>Project brief <span>✦</span></h2><p className="brief-caption">This is what the team agreed to.</p><div className="brief-content"><span>SLIDE {String(index + 1).padStart(2, '0')}</span><h3>{question.title}</h3><p>{question.brief}</p></div><div className="source-note">✳ &nbsp; Keep this brief in view as you check the AI’s draft.</div></div></section><section className="draft"><div className="draft-heading"><div><span className="kicker">THE AI’S DRAFT</span><h2>Spot the extra <span>✳</span></h2><p>One statement isn’t supported by the brief. Tap to select it.</p></div><div className="mini-memo"><img src={mascot} alt=""/><span>{memoLines[index]}</span></div></div><fieldset className="statements"><legend className="sr-only">Which statement is unsupported?</legend>{question.statements.map((s, i) => <label className={'statement statement-' + i + (answers[index] === s.id ? ' selected' : '')} key={s.id}><input type="radio" name="statement" value={s.id} checked={answers[index] === s.id} onChange={() => choose(s.id)}/><span className="letter">0{i + 1}</span><span className="statement-text">{s.text}</span><span className="radio-indicator" aria-hidden="true"/></label>)}</fieldset><div className="game-actions">{index > 0 && <button className="text-button" onClick={() => setIndex(index - 1)}>← Previous slide</button>}<button className="primary" disabled={!answers[index]} onClick={next}>{index === QUESTION_COUNT - 1 ? 'Finish the fact-check' : 'Check next slide'} <span>↗</span></button></div><p className="under-button">You can go back and change your answers before finishing.</p></section></div></section>}
      {screen === 'result' && <section className="result-area"><div className="result-hero"><div><span className="kicker">MEMO’S PRESENTATION CHECK / COMPLETE</span><h1 ref={heading} tabIndex="-1">{result.timedOut ? <>Time’s up<span>.</span></> : <>Ready for the <em>spotlight.</em></>}</h1><p>{result.score === 300 ? '“Three sharp catches! I’m ready for the stage. Thanks, detective!”' : '“Thanks for checking my slides! Let’s look at the clues together.”'}</p></div><img src={mascot} alt="Memo thanks you"/></div><div className="result-summary"><div><small>YOUR SCORE</small><strong>{result.score}<span> / 300</span></strong></div><div><small>YOUR TIME</small><strong>{formatTime(result.time)}</strong></div><div><small>SLIDES CHECKED</small><strong>{result.score / 100} <span>/ 3 CORRECT</span></strong></div></div><div className="result-content"><div><span className="kicker">THE FACT-CHECK</span><h2 className="review-heading">Memo’s case notes <span>✳</span></h2><p className="review-intro">Here’s how the AI’s draft compared with each project brief.</p>{result.results.map((r,i) => <article className="review-card" key={r.id}><div className="section-label"><span>SLIDE {i + 1} / {r.title.toUpperCase()}</span><span className={'verdict ' + r.status}>{r.status.toUpperCase()}</span></div><p><strong>The brief:</strong> {r.brief}</p><p><strong>Unsupported:</strong> {r.statements.find(s => s.id === r.correctAnswer).text}</p><p>{r.explanation}</p>{r.selected && r.status === 'incorrect' && <p className="your-answer">You selected: {r.statements.find(s => s.id === r.selected)?.text}</p>}</article>)}<p className="takeaway"><strong>Memo’s takeaway ✦</strong><br/>Check AI-generated information against the source requirements before sharing it.</p></div><div className="result-side"><form className="save-form" onSubmit={save} noValidate><span className="kicker">JOIN MEMO’S CREW</span><h2>Leave your mark<span> ✳</span></h2><p>Add your score to the local leaderboard.</p><label htmlFor="name">YOUR DISPLAY NAME</label><input id="name" maxLength="24" value={name} onChange={e => { setName(e.target.value); setNameError(''); }} placeholder="Enter your name" disabled={saved} aria-describedby={nameError ? 'name-error' : undefined}/><button className="primary" disabled={saved || saving}>{saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save my score ↗'}</button>{nameError && <p className="error" id="name-error" role="alert">{nameError}</p>}<p className="under-button" role="status">{saved ? 'Your result is on this browser’s leaderboard.' : 'Use a short name, up to 24 characters.'}</p></form><div className="actions"><button className="primary" onClick={begin}>Play again <span>↗</span></button><button className="text-button" onClick={() => { setScreen('welcome'); setConfirmClear(false); }}>New participant →</button></div><div className="conversation"><span className="kicker">KEEP THE CONVERSATION GOING</span><p>Talk with the Rezoomex team about project context, requirement traceability, and verifying AI-generated outcomes.</p></div></div></div>{leaderboard}</section>}
    </main><footer><span>REZOOMEX &nbsp; × &nbsp; REACT HYDERABAD</span><span>BUILT WITH CURIOSITY &nbsp; ✳</span></footer>
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
