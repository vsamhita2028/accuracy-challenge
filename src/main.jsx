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
  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#top"><span className="brand-mark">R<span>✳</span></span><span>REZOOMEX <small>REACT HYDERABAD UTSAVAM ’26</small></span></a><span className="top-label">MEMO’S FIELD NOTES <span>✳</span></span></header>
    <main id="top" className="layout">
      <section className="main-column">
        {screen === 'welcome' && <>
          <div className="eyebrow"><span className="live-dot"/> A LITTLE MISSION WITH MEMO</div>
          <h1 ref={heading} tabIndex="-1">Memo’s AI<br/><em>Accuracy</em><br/>Challenge<span className="period">.</span></h1>
          <p className="intro">Three slides. A few sneaky assumptions. One big presentation.</p>
          <div className="memo-note"><span className="quote-icon">“</span><p>Hi, detective! My AI assistant helped prepare my slides, but some details don’t match the briefs. Will you help me fact-check before I go on stage?</p><span className="note-sign">— MEMO</span></div>
          <div className="how"><div><span className="number">01</span><p>Read each<br/><strong>project brief</strong></p></div><div><span className="number">02</span><p>Find the<br/><strong>unsupported claim</strong></p></div><div><span className="number">03</span><p>Check all three<br/><strong>before time’s up</strong></p></div></div>
          <button className="primary" onClick={begin}>Help Memo <span>↗</span></button>
          <p className="fineprint">3 QUESTIONS <span>✳</span> 90 SECONDS TOTAL <span>✳</span> 100 POINTS PER CORRECT ANSWER<br/>INCORRECT OR UNANSWERED = 0 <span>✳</span> FASTER TIMES BREAK TIES</p>
        </>}
        {screen === 'game' && <>
          <div className="game-head"><div><div className="eyebrow"><span className="live-dot"/> MEMO’S FACT-CHECK MISSION</div><div className="progress-label">SLIDE {index + 1} OF {QUESTION_COUNT}</div></div><div className={'timer ' + (remaining <= 15000 ? 'urgent' : '')} aria-label={`${Math.ceil(remaining / 1000)} seconds remaining`}><span>TIME LEFT</span><strong>{Math.floor(Math.ceil(remaining / 1000) / 60)}:{String(Math.ceil(remaining / 1000) % 60).padStart(2, '0')}</strong></div></div>
          <div className="progress" aria-label={`Question ${index + 1} of ${QUESTION_COUNT}`}>{questions.map((q,i) => <span key={q.id} className={i <= index ? 'filled' : ''}/>)}</div>
          <h1 className="game-title" ref={heading} tabIndex="-1">Check this <em>clue.</em></h1>
          <p className="story-line">{memoLines[index]}</p>
          <div className="brief"><div className="section-label"><span>MEMO’S PROJECT BRIEF</span><span>THE SOURCE ↗</span></div><h2>{question.title}</h2><p>{question.brief}</p></div>
          <fieldset className="statements"><legend><span>WHICH STATEMENT IS UNSUPPORTED?</span><span>SELECT ONE</span></legend>{question.statements.map((s, i) => <label className={'statement ' + (answers[index] === s.id ? 'selected' : '')} key={s.id}><input type="radio" name="statement" value={s.id} checked={answers[index] === s.id} onChange={() => choose(s.id)}/><span className="letter">{String.fromCharCode(65 + i)}</span><span className="statement-text">{s.text}</span><span className="radio-indicator" aria-hidden="true"/></label>)}</fieldset>
          <div className="game-actions">{index > 0 && <button className="text-button" onClick={() => setIndex(index - 1)}>← Previous slide</button>}<button className="primary submit" disabled={!answers[index]} onClick={next}>{index === QUESTION_COUNT - 1 ? 'Finish mission' : 'Next slide'} <span>↗</span></button></div><p className="under-button">You can change your answers before finishing. The timer keeps running.</p>
        </>}
        {screen === 'result' && <>
          <div className="eyebrow"><span className="live-dot"/> MISSION COMPLETE</div>
          <h1 className="game-title result-title" ref={heading} tabIndex="-1">{result.timedOut ? <>Time’s up<span className="period">.</span></> : <>That’s a <em>wrap!</em></>}</h1>
          <p className="intro">{result.score === 300 ? 'Memo says: “Three sharp catches! I’m ready for the stage.”' : 'Memo says: “Thanks, detective! Let’s check the clues together.”'}</p>
          <div className="result-summary"><div><small>YOUR SCORE</small><strong>{result.score}<span> / 300</span></strong></div><div><small>YOUR TIME</small><strong>{formatTime(result.time)}</strong></div><div><small>CORRECT</small><strong>{result.score / 100} / 3</strong></div></div>
          <h2 className="review-heading">The case notes <span>✳</span></h2>
          {result.results.map((r,i) => <article className="review-card" key={r.id}><div className="section-label"><span>SLIDE {i + 1} / {r.title.toUpperCase()}</span><span className={'verdict ' + r.status}>{r.status.toUpperCase()}</span></div><p className="review-brief"><strong>Brief:</strong> {r.brief}</p><p className="review-answer"><strong>Unsupported:</strong> {r.statements.find(s => s.id === r.correctAnswer).text}</p><p>{r.explanation}</p>{r.selected && r.status === 'incorrect' && <p className="your-answer">You selected: {r.statements.find(s => s.id === r.selected)?.text}</p>}</article>)}
          <p className="takeaway"><strong>Memo’s takeaway</strong> · Check AI-generated information against the source requirements before sharing it.</p>
          <form className="save-form" onSubmit={save} noValidate><label htmlFor="name">Add your score to the local leaderboard</label><div className="save-row"><input id="name" maxLength="24" value={name} onChange={e => { setName(e.target.value); setNameError(''); }} placeholder="Your display name" disabled={saved} aria-describedby={nameError ? 'name-error' : undefined}/><button className="dark-button" disabled={saved || saving}>{saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save score ↗'}</button></div>{nameError && <p className="error" id="name-error" role="alert">{nameError}</p>}<p className="under-button" role="status">{saved ? 'Your result is on this browser’s leaderboard.' : 'Use a short name, up to 24 characters.'}</p></form>
          <div className="actions"><button className="primary" onClick={begin}>Play again <span>↗</span></button><button className="text-button" onClick={() => { setScreen('welcome'); setConfirmClear(false); }}>New participant <span>→</span></button></div>
          <div className="conversation"><span>KEEP THE CONVERSATION GOING ↗</span><p>Talk with the Rezoomex team about project context, requirement traceability, and verifying AI-generated outcomes.</p></div>
        </>}
      </section>
      <aside className="side-column"><div className="mascot-panel"><div className="side-top"><span>YOUR MISSION PARTNER</span><span>✳</span></div><img src={`${import.meta.env.BASE_URL}assets/memo-ai-v2.png`} alt="Memo, your friendly challenge guide"/><div className="mascot-caption"><span>MEET MEMO</span><strong>Curious mind.<br/><em>Sharp eye.</em></strong><span className="caption-star">✳</span></div></div>
        <section className="leaderboard" aria-labelledby="leader-heading"><div className="leader-head"><div><span className="section-kicker">THREE-SLIDE HALL OF FAME</span><h2 id="leader-heading">Leaderboard<span>.</span></h2></div><span className="leader-icon">↗</span></div><p>Big points. Sharp eyes. Quick thinking.</p><div className="leader-table"><div className="leader-labels"><span>RANK / NAME</span><span>POINTS</span><span>TIME</span></div>{entries.length === 0 ? <p className="empty">No scores yet. Be the first detective!</p> : <ol>{entries.map((entry, i) => <li key={entry.id}><span><b>{String(i + 1).padStart(2, '0')}</b> {entry.name}</span><strong>{entry.score}</strong><span>{formatTime(entry.time)}</span></li>)}</ol>}</div><p className="local-note">Results are stored locally in this browser and aren’t shared across devices. Scores from the earlier one-question game aren’t ranked here.</p>{storageError && <p className="error" role="alert">Browser storage is unavailable. Scores may not be saved; check browser settings and try again.</p>}<div className="volunteer"><span>FOR BOOTH VOLUNTEERS</span>{confirmClear ? <div className="confirm"><p>Clear all scores, including older scores, from this browser?</p><button onClick={clear}>Yes, clear scores</button><button onClick={() => setConfirmClear(false)}>Cancel</button></div> : <button onClick={() => setConfirmClear(true)}>Clear local leaderboard ↗</button>}</div></section>
      </aside>
    </main><footer><span>REZOOMEX <span>✳</span> REACT HYDERABAD UTSAVAM 2026</span><span>MEMO’S FACT-CHECK MISSION</span></footer>
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
