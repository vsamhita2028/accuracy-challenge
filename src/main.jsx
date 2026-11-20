import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { scenarios } from './scenarios';
import { LIMIT_MS, shuffle, outcome, formatTime, rankEntries, validName } from './game';
import { getResults, saveResult, clearResults } from './storage';
import './style.css';

function App() {
  const [screen, setScreen] = useState('welcome');
  const [game, setGame] = useState(null);
  const [selected, setSelected] = useState('');
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
  const heading = useRef(null);

  async function refresh() {
    try { setEntries(rankEntries(await getResults())); setStorageError(false); }
    catch { setStorageError(true); }
  }
  useEffect(() => { refresh(); }, []);
  useEffect(() => { heading.current?.focus(); }, [screen]);
  function begin() {
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    setGame({ ...scenario, statements: shuffle(scenario.statements) });
    setSelected(''); setRemaining(LIMIT_MS); setResult(null); setName(''); setSaved(false); setNameError(''); setConfirmClear(false);
    finished.current = false; started.current = Date.now(); setScreen('game');
  }
  function finish(choice, elapsed) {
    if (finished.current) return;
    finished.current = true;
    setResult(outcome(choice, game.correctAnswer, elapsed)); setScreen('result');
  }
  useEffect(() => {
    if (screen !== 'game') return;
    const tick = () => {
      const elapsed = Date.now() - started.current;
      setRemaining(Math.max(0, LIMIT_MS - elapsed));
      if (elapsed >= LIMIT_MS) finish('', elapsed);
    };
    tick(); const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [screen, game]);
  async function save(e) {
    e.preventDefault();
    if (!validName(name)) { setNameError('Please enter a name between 1 and 24 characters.'); return; }
    if (saving || saved) return;
    setSaving(true); setNameError('');
    try { await saveResult({ name: name.trim(), score: result.score, time: result.time, createdAt: Date.now() }); setSaved(true); await refresh(); }
    catch { setStorageError(true); }
    finally { setSaving(false); }
  }
  async function clear() {
    try { await clearResults(); setEntries([]); setStorageError(false); setConfirmClear(false); }
    catch { setStorageError(true); setConfirmClear(false); }
  }
  const answer = game?.statements.find(s => s.id === game.correctAnswer);
  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#top" aria-label="Rezoomex booth home"><span className="brand-mark">R<span>✳</span></span><span>REZOOMEX <small>AT REACT HYDERABAD UTSAVAM ’26</small></span></a><span className="top-label">THE BOOTH CHALLENGE <span>✳</span></span></header>
    <main id="top" className="layout">
      <section className="main-column">
        {screen === 'welcome' && <>
          <div className="eyebrow"><span className="live-dot"/> A LITTLE GAME ABOUT GETTING IT RIGHT</div>
          <h1 ref={heading} tabIndex="-1">Memo’s AI<br/><em>Accuracy</em><br/>Challenge<span className="period">.</span></h1>
          <p className="intro">AI can sound convincing. Can you spot the detail it made up?</p>
          <div className="memo-note"><span className="quote-icon">“</span><p>Hey, context detective! I’m about to present a feature. Help me check the facts before I step on stage.</p><span className="note-sign">— MEMO</span></div>
          <div className="how"><div><span className="number">01</span><p>Read the<br/><strong>project brief</strong></p></div><div><span className="number">02</span><p>Spot the<br/><strong>unsupported claim</strong></p></div><div><span className="number">03</span><p>Submit before<br/><strong>time runs out</strong></p></div></div>
          <button className="primary" onClick={begin}>Let’s play <span>↗</span></button>
          <p className="fineprint">90 SECONDS MAX <span>✳</span> CORRECT = 100 POINTS <span>✳</span> INCORRECT OR UNANSWERED = 0 <span>✳</span> FASTER TIMES BREAK TIES</p>
        </>}
        {screen === 'game' && <>
          <div className="game-head"><div className="eyebrow"><span className="live-dot"/> THE CHALLENGE IS ON</div><div className={'timer ' + (remaining <= 15000 ? 'urgent' : '')} aria-label={`${Math.ceil(remaining / 1000)} seconds remaining`}><span>TIME LEFT</span><strong>{Math.floor(Math.ceil(remaining / 1000) / 60)}:{String(Math.ceil(remaining / 1000) % 60).padStart(2, '0')}</strong></div></div>
          <h1 className="game-title" ref={heading} tabIndex="-1">Find the <em>fiction.</em></h1>
          <p className="intro">One statement goes beyond the brief. Which one?</p>
          <div className="brief"><div className="section-label"><span>01 / PROJECT BRIEF</span><span>THE SOURCE OF TRUTH ↗</span></div><h2>{game.title}</h2><p>{game.brief}</p></div>
          <fieldset className="statements"><legend><span>02 / AI-GENERATED STATEMENTS</span><span>SELECT ONE</span></legend>{game.statements.map((s, i) => <label className={'statement ' + (selected === s.id ? 'selected' : '')} key={s.id}><input type="radio" name="statement" value={s.id} checked={selected === s.id} onChange={() => setSelected(s.id)}/><span className="letter">{String.fromCharCode(65 + i)}</span><span className="statement-text">{s.text}</span><span className="radio-indicator" aria-hidden="true"/></label>)}</fieldset>
          <button className="primary submit" disabled={!selected} onClick={() => finish(selected, Date.now() - started.current)}>Lock in my answer <span>↗</span></button><p className="under-button">You can change your choice before submitting.</p>
        </>}
        {screen === 'result' && <>
          <div className="eyebrow"><span className="live-dot"/> CASE CLOSED</div>
          <h1 className="game-title result-title" ref={heading} tabIndex="-1">{result.status === 'correct' ? <>Nice catch<span className="period">!</span></> : result.status === 'incorrect' ? <>Good try<span className="period">.</span></> : <>Time’s up<span className="period">.</span></>}</h1>
          <p className="intro">{result.status === 'correct' ? 'Memo says: “You saved my presentation!”' : result.status === 'incorrect' ? 'Memo says: “Every good detective checks the evidence.”' : 'Memo says: “Let’s take a look at the evidence together.”'}</p>
          <div className="result-card"><div className="section-label"><span>THE UNSUPPORTED STATEMENT</span><span>THE VERDICT ✳</span></div><h2>“{answer.text}”</h2><p>{game.explanation}</p><div className="score-row"><div><small>YOUR SCORE</small><strong>{result.score} <span>PTS</span></strong></div><div><small>YOUR TIME</small><strong>{formatTime(result.time)}</strong></div><div><small>RESULT</small><strong className="status">{result.status}</strong></div></div></div>
          <p className="takeaway"><strong>The takeaway</strong> · Check AI-generated information against the source requirements before sharing it.</p>
          <form className="save-form" onSubmit={save} noValidate><label htmlFor="name">Add your score to the local leaderboard</label><div className="save-row"><input id="name" maxLength="24" value={name} onChange={e => { setName(e.target.value); setNameError(''); }} placeholder="Your display name" disabled={saved} aria-describedby={nameError ? 'name-error' : undefined}/><button className="dark-button" disabled={saved || saving}>{saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save score ↗'}</button></div>{nameError && <p className="error" id="name-error" role="alert">{nameError}</p>}<p className="under-button" role="status">{saved ? 'Your result is on this browser’s leaderboard.' : 'Use a short name, up to 24 characters.'}</p></form>
          <div className="actions"><button className="primary" onClick={begin}>Play again <span>↗</span></button><button className="text-button" onClick={() => { setScreen('welcome'); setConfirmClear(false); }}>New participant <span>→</span></button></div>
          <div className="conversation"><span>KEEP THE CONVERSATION GOING ↗</span><p>Talk with the Rezoomex team about project context, requirement traceability, and verifying AI-generated outcomes.</p></div>
        </>}
      </section>
      <aside className="side-column"><div className="mascot-panel"><div className="side-top"><span>YOUR GUIDE FOR TODAY</span><span>✳</span></div><img src={`${import.meta.env.BASE_URL}assets/memo-ai-v2.png`} alt="Memo, your friendly challenge guide"/><div className="mascot-caption"><span>MEET MEMO</span><strong>Curious mind.<br/><em>Sharp eye.</em></strong><span className="caption-star">✳</span></div></div>
        <section className="leaderboard" aria-labelledby="leader-heading"><div className="leader-head"><div><span className="section-kicker">THE LOCAL SCOREBOARD</span><h2 id="leader-heading">Leaderboard<span>.</span></h2></div><span className="leader-icon">↗</span></div><p>Big points. Sharp eyes. Quick thinking.</p><div className="leader-table"><div className="leader-labels"><span>RANK / NAME</span><span>POINTS</span><span>TIME</span></div>{entries.length === 0 ? <p className="empty">No scores yet. Be the first detective!</p> : <ol>{entries.map((entry, i) => <li key={entry.id}><span><b>{String(i + 1).padStart(2, '0')}</b> {entry.name}</span><strong>{entry.score}</strong><span>{formatTime(entry.time)}</span></li>)}</ol>}</div><p className="local-note">Results are stored locally in this browser and aren’t shared across devices.</p>{storageError && <p className="error" role="alert">Browser storage is unavailable. Scores may not be saved; check browser settings and try again.</p>}<div className="volunteer"><span>FOR BOOTH VOLUNTEERS</span>{confirmClear ? <div className="confirm"><p>Clear all scores from this browser?</p><button onClick={clear}>Yes, clear scores</button><button onClick={() => setConfirmClear(false)}>Cancel</button></div> : <button onClick={() => setConfirmClear(true)}>Clear local leaderboard ↗</button>}</div></section>
      </aside>
    </main><footer><span>REZOOMEX <span>✳</span> REACT HYDERABAD UTSAVAM 2026</span><span>MADE FOR CURIOUS MINDS / 01</span></footer>
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
