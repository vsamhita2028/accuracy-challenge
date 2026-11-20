import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { scenarios } from './scenarios';
import { LIMIT_MS, QUESTION_COUNT, makeRound, gradeRound, formatTime, rankEntries, validName } from './game';
import { getResults, saveResult } from './storage';
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
    setRemaining(LIMIT_MS); setResult(null); setName(''); setSaved(false); setNameError('');
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
  function goHome() {
    finished.current = true;
    setScreen('welcome');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
  const question = questions[index];
  const memoLines = ['“First clue! Let’s see what the brief actually says.”', '“Nice work, detective. Another slide needs your eyes.”', '“One last check before I step on stage!”'];
  const mascot = `${import.meta.env.BASE_URL}assets/memo-ai-v2.png`;
  const leaderboard = <section className="leaderboard" aria-labelledby="leader-heading"><div className="leader-title"><div><span className="kicker">MEMO’S FACT-CHECKING CREW</span><h2 id="leader-heading">Leaderboard <span>✦</span></h2></div><p>Good eyes. Quick thinking.<br/>See how the detectives did.</p></div><div className="leader-table"><div className="leader-labels"><span>RANK / DETECTIVE</span><span>POINTS</span><span>TIME</span></div>{entries.length === 0 ? <div className="empty"><span>✳</span><div><strong>No detectives yet.</strong><p>Help Memo and be the first on the board!</p></div></div> : <ol>{entries.map((entry, i) => <li key={entry.id}><span><b>{String(i + 1).padStart(2, '0')}</b> {entry.name}</span><strong>{entry.score}</strong><span>{formatTime(entry.time)}</span></li>)}</ol>}</div>{storageError && <p className="error" role="alert">Browser storage is unavailable. Scores may not be saved; check browser settings and try again.</p>}</section>;
  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#top"><img src={mascot} alt=""/><span>Memo’s Accuracy Challenge</span></a><span className="top-label"><i/> REZOOMEX <b>✦</b> REACT HYDERABAD UTSAVAM 2026</span></header>
    <main id="top">
      {screen === 'welcome' && <>
        <div className="landing">
          <section className="opening"><div className="opening-copy"><div className="opening-kicker"><span className="status-light"/> BACKSTAGE AT UTSAVAM &nbsp; / &nbsp; THE ACCURACY CHALLENGE</div><div className="opening-heading"><span className="opening-index">01 / 03<br/>FACT<br/>CHECK</span><h1 ref={heading} tabIndex="-1">The stage<br/>is set<span className="orange-dot">.</span><br/><em>Are the facts?</em></h1></div><p>Memo’s presentation is almost ready. But a few assumptions may have slipped into the slides. Help Memo find them before the show begins.</p><div className="opening-actions"><button className="primary opening-button" onClick={begin}>Go backstage with Memo <span>↗</span></button><span>NO SIGN-UP NEEDED<br/><strong>JUST A SHARP EYE.</strong></span></div><div className="opening-meta"><span>REZOOMEX <b>✳</b> REACT HYDERABAD</span><span>THE SHOW STARTS WITH THE TRUTH &nbsp; ↗</span></div></div><div className="opening-scene"><div className="scene-top"><span>LIVE FROM BACKSTAGE</span><span className="scene-onair"><i/> PRE-SHOW CHECK</span></div><div className="spotlight"/><div className="scene-label">THE PRESENTER <span>✦</span></div><img src={mascot} alt="Memo preparing for the presentation"/><div className="scene-quote"><span>MEMO SAYS</span><p>“Can you give my slides<br/><strong>one last look?</strong>”</p></div><div className="scene-bottom"><span>THE ACCURACY CHALLENGE</span><span>01 / 03</span></div></div></section>
          <section className="mission-brief"><div className="brief-title"><span className="kicker">YOUR BACKSTAGE PASS</span><h2>Three slides.<br/><em>One important job.</em></h2><p>Read what the team actually agreed to, then find the line that doesn’t belong.</p><div className="brief-stats"><span><strong>03</strong><small>SLIDES TO CHECK</small></span><span><strong>90</strong><small>SECONDS TOTAL</small></span><span><strong>300</strong><small>POINTS POSSIBLE</small></span></div></div><div className="mission-ticket"><div className="ticket-top"><span>MEMO’S SHOW NOTES</span><span>✳</span></div><div className="ticket-row"><span>01</span><div><h3>Read the source</h3><p>Start with the team’s project brief.</p></div><b>↗</b></div><div className="ticket-row"><span>02</span><div><h3>Catch the extra</h3><p>Pick the statement the brief doesn’t support.</p></div><b>↗</b></div><div className="ticket-row"><span>03</span><div><h3>Check the score</h3><p>Earn 100 per correct slide; incorrect or unanswered earns 0. Faster times break ties.</p></div><b>↗</b></div><div className="ticket-bottom"><span>READY WHEN YOU ARE</span><button onClick={begin}>START THE CHECK ↗</button></div></div></section>
          {leaderboard}
        </div>
        
      </>}
      {screen === 'game' && <section className="play-area"><div className="play-navigation"><button className="exit-game" onClick={goHome}>← Exit game</button></div><div className="play-top"><div><span className="kicker">MEMO’S PRESENTATION CHECK</span><h1 ref={heading} tabIndex="-1">One slide at a time<span>.</span></h1><p>Find the statement that goes beyond the project brief.</p></div><div className={'timer ' + (remaining <= 15000 ? 'urgent' : '')} aria-label={`${Math.ceil(remaining / 1000)} seconds remaining`}><span>TIME LEFT</span><strong>◷ &nbsp;{Math.floor(Math.ceil(remaining / 1000) / 60)}:{String(Math.ceil(remaining / 1000) % 60).padStart(2, '0')}</strong></div></div><div className="game-progress"><span>SLIDE {index + 1} OF {QUESTION_COUNT}</span><div className="progress" aria-label={`Question ${index + 1} of ${QUESTION_COUNT}`}>{questions.map((q,i) => <span key={q.id} className={i <= index ? 'filled' : ''}/>)}</div><span>THE TIMER IS RUNNING</span></div><div className="game-board"><section className="brief"><div className="slide-rail" aria-hidden="true"><span>DECK</span>{questions.map((q,i) => <div className={i === index ? 'slide-thumb active' : 'slide-thumb'} key={q.id}><b>0{i + 1}</b><i/><i/><i/></div>)}</div><div className="brief-inner"><div className="section-label"><span>SPEAKER NOTES / SOURCE</span><span>✎</span></div><h2>Project brief <span>✦</span></h2><p className="brief-caption">The team’s agreed requirements.</p><div className="brief-content"><span>SLIDE {String(index + 1).padStart(2, '0')}</span><h3>{question.title}</h3><p>{question.brief}</p></div><div className="source-note">✳ &nbsp; Keep this brief in view as you check the presentation draft.</div></div></section><section className="draft"><div className="deck-toolbar"><span>● &nbsp; ● &nbsp; ●</span><span>MEMO’S PRESENTATION &nbsp; / &nbsp; SLIDE {String(index + 1).padStart(2, '0')}</span><span>▶ PRESENT</span></div><div className="draft-heading"><div><span className="kicker">SLIDE CONTENT / DRAFT</span><h2>What made the slide? <span>✳</span></h2><p>One line was added without support from the brief. Select it.</p></div><div className="mini-memo"><img src={mascot} alt=""/><span>{memoLines[index]}</span></div></div><fieldset className="statements"><legend className="sr-only">Which statement is unsupported?</legend>{question.statements.map((s, i) => <label className={'statement statement-' + i + (answers[index] === s.id ? ' selected' : '')} key={s.id}><input type="radio" name="statement" value={s.id} checked={answers[index] === s.id} onChange={() => choose(s.id)}/><span className="letter">0{i + 1}</span><span className="statement-text">{s.text}</span><span className="radio-indicator" aria-hidden="true"/></label>)}</fieldset><div className="game-actions">{index > 0 && <button className="text-button" onClick={() => setIndex(index - 1)}>← Previous slide</button>}<button className="primary" disabled={!answers[index]} onClick={next}>{index === QUESTION_COUNT - 1 ? 'Finish the fact-check' : 'Check next slide'} <span>↗</span></button></div><p className="under-button">You can go back and change your answers before finishing.</p></section></div></section>}
      {screen === 'result' && <section className="result-area"><div className="result-hero"><div><span className="kicker">MEMO’S PRESENTATION CHECK / COMPLETE</span><h1 ref={heading} tabIndex="-1">{result.timedOut ? <>Time’s up<span>.</span></> : <>Ready for the <em>spotlight.</em></>}</h1><p>{result.score === 300 ? '“Three sharp catches! I’m ready for the stage. Thanks, detective!”' : '“Thanks for checking my slides! Let’s look at the clues together.”'}</p></div><img src={mascot} alt="Memo thanks you"/></div><div className="result-summary"><div><small>YOUR SCORE</small><strong>{result.score}<span> / 300</span></strong></div><div><small>YOUR TIME</small><strong>{formatTime(result.time)}</strong></div><div><small>SLIDES CHECKED</small><strong>{result.score / 100} <span>/ 3 CORRECT</span></strong></div></div><div className="result-content"><div><span className="kicker">PRESENTATION REVIEW</span><h2 className="review-heading">Slide-by-slide review <span>✳</span></h2><p className="review-intro">Here’s how the presentation draft compared with each project brief.</p>{result.results.map((r,i) => <article className="review-card" key={r.id}><div className="section-label"><span>SLIDE {i + 1} / {r.title.toUpperCase()}</span><span className={'verdict ' + r.status}>{r.status.toUpperCase()}</span></div><p><strong>The brief:</strong> {r.brief}</p><p><strong>Unsupported:</strong> {r.statements.find(s => s.id === r.correctAnswer).text}</p><p>{r.explanation}</p>{r.selected && r.status === 'incorrect' && <p className="your-answer">You selected: {r.statements.find(s => s.id === r.selected)?.text}</p>}</article>)}<p className="takeaway"><strong>Memo’s takeaway ✦</strong><br/>Check information against the source requirements before sharing it.</p></div><div className="result-side"><form className="save-form" onSubmit={save} noValidate><span className="kicker">JOIN MEMO’S CREW</span><h2>Leave your mark<span> ✳</span></h2><p>Add your score to the leaderboard.</p><label htmlFor="name">YOUR DISPLAY NAME</label><input id="name" maxLength="24" value={name} onChange={e => { setName(e.target.value); setNameError(''); }} placeholder="Enter your name" disabled={saved} aria-describedby={nameError ? 'name-error' : undefined}/><button className="primary" disabled={saved || saving}>{saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save my score ↗'}</button>{nameError && <p className="error" id="name-error" role="alert">{nameError}</p>}<p className="under-button" role="status">{saved ? 'Your result is on the leaderboard.' : 'Use a short name, up to 24 characters.'}</p></form><div className="actions"><button className="primary" onClick={goHome}>Play again <span>↗</span></button></div><div className="conversation"><span className="kicker">KEEP THE CONVERSATION GOING</span><p>Talk with the Rezoomex team about project context, requirement traceability, and verifying outcomes.</p></div></div></div>{leaderboard}</section>}
    </main><footer><span>REZOOMEX &nbsp; × &nbsp; REACT HYDERABAD</span><span>BUILT WITH CURIOSITY &nbsp; ✳</span></footer>
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
