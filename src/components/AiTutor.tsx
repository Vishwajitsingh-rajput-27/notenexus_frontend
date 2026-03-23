'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';
import { apiGetNotes } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL;
const LEVELS = ['beginner', 'intermediate', 'advanced'];
const SUGGESTED = ['Explain this topic from scratch', "Give me an example", "I don't understand", 'Quiz me', "Summarise what we've covered"];
const mono = "'Space Mono','Courier New',monospace";
const ibm  = "'IBM Plex Mono','Courier New',monospace";

const sourceIcon = (type: string) => {
  if (type === 'pdf')     return 'PDF';
  if (type === 'image')   return 'IMG';
  if (type === 'voice')   return 'MIC';
  if (type === 'youtube') return 'YT';
  return 'TXT';
};

export default function AiTutor({ preloadSubject = '' }: { preloadSubject?: string }) {
  const [subject, setSubject]   = useState(preloadSubject || '');
  const [level, setLevel]       = useState('beginner');
  const [started, setStarted]   = useState(false);
  const [history, setHistory]   = useState<any[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [quiz, setQuiz]         = useState<any>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizChecked, setQuizChecked] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [notes, setNotes]           = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [showNotes, setShowNotes]   = useState(false);
  const [loadedFrom, setLoadedFrom] = useState('');

  useEffect(() => { if (preloadSubject) setSubject(preloadSubject); }, [preloadSubject]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history, loading]);
  useEffect(() => {
    setLoadingNotes(true);
    apiGetNotes().then((d: any) => setNotes(d.notes || [])).catch(() => {}).finally(() => setLoadingNotes(false));
  }, []);

  const loadFromNote = (note: any) => {
    setSubject(note.subject || note.title || '');
    setLoadedFrom(`${sourceIcon(note.sourceType)} ${note.title}`);
    setShowNotes(false);
  };

  const sendMessage = async (msg = input) => {
    const text = msg.trim();
    if (!text || loading) return;
    setInput(''); setError('');
    const userMsg = { role: 'user', content: text };
    const newHistory = [...history, userMsg];
    setHistory(newHistory);
    setLoading(true);
    try {
      const token = Cookies.get('nn_token');
      const res = await fetch(`${API}/api/tutor/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text, history, subject, level, aiModel: 'groq' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setHistory([...newHistory, { role: 'assistant', content: data.reply }]);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const fetchQuiz = async () => {
    if (!subject) return;
    setQuiz(null); setQuizAnswers({}); setQuizChecked(false);
    try {
      const token = Cookies.get('nn_token');
      const lastTopic = history.filter(h => h.role === 'assistant').slice(-1)[0]?.content?.slice(0, 60) || subject;
      const res = await fetch(`${API}/api/tutor/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject, topic: lastTopic, level }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuiz(data.quiz);
    } catch (err: any) { setError(err.message); }
  };

  const score = quiz ? quiz.filter((q: any, i: number) => quizAnswers[i] === q.answer).length : 0;
  const inp: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.12)', padding: '10px 14px', color: '#fff', fontFamily: ibm, fontSize: 13, outline: 'none' };

  // ── Start screen ───────────────────────────────────────────────────────────
  if (!started) return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: mono, fontSize: 10, color: '#FF3B3B', letterSpacing: '0.15em', marginBottom: 6 }}>// AI_TOOLS</div>
        <h2 style={{ fontFamily: mono, fontSize: 22, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          AI<span style={{ color: '#FF3B3B' }}>_TUTOR</span>
        </h2>
        <p style={{ fontFamily: ibm, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Explains clearly, checks understanding, adapts to your level.</p>
      </div>

      <div style={{ border: '1px solid rgba(255,255,255,0.10)', padding: 28, background: '#0d0d0d', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Select note */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em' }}>// START_FROM_NOTE</div>
            <button onClick={() => setShowNotes(v => !v)}
              style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.08em', padding: '4px 12px', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.45)', background: 'none', cursor: 'pointer', transition: 'all 0.18s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#FBFF48'; (e.currentTarget as HTMLElement).style.color = '#FBFF48' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)' }}>
              SELECT_NOTE {showNotes ? '▲' : '▼'}
            </button>
          </div>
          {showNotes && (
            <div style={{ border: '1px solid rgba(255,255,255,0.08)', maxHeight: 180, overflowY: 'auto', background: 'rgba(0,0,0,0.3)', marginBottom: 8 }}>
              {loadingNotes
                ? <div style={{ fontFamily: ibm, fontSize: 12, color: 'rgba(255,255,255,0.3)', padding: 16, textAlign: 'center' }}>Loading...</div>
                : notes.length === 0
                  ? <div style={{ fontFamily: ibm, fontSize: 12, color: 'rgba(255,255,255,0.3)', padding: 16, textAlign: 'center' }}>No saved notes</div>
                  : notes.map(note => (
                    <button key={note._id} onClick={() => loadFromNote(note)}
                      style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                      <div style={{ fontFamily: ibm, fontSize: 12, color: '#fff', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.title}</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span style={{ fontFamily: mono, fontSize: 9, color: '#FF3B3B', letterSpacing: '0.08em' }}>{note.subject}</span>
                        <span style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em' }}>{note.chapter}</span>
                      </div>
                    </button>
                  ))
              }
            </div>
          )}
          {loadedFrom && <div style={{ fontFamily: ibm, fontSize: 11, color: '#FF3B3B' }}>● Loaded: {loadedFrom}</div>}
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>OR TYPE SUBJECT</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Subject input */}
        <div>
          <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', marginBottom: 6 }}>// SUBJECT *</div>
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Photosynthesis, Calculus, WW2"
            style={inp}
            onFocus={e => e.currentTarget.style.borderColor = '#FF3B3B'}
            onBlur={e  => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'} />
        </div>

        {/* Level */}
        <div>
          <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', marginBottom: 8 }}>// LEVEL</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {LEVELS.map(l => (
              <button key={l} onClick={() => setLevel(l)}
                style={{ flex: 1, fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', padding: '8px', textTransform: 'uppercase', background: level===l ? '#FF3B3B' : 'transparent', color: level===l ? '#fff' : 'rgba(255,255,255,0.35)', border: `1px solid ${level===l ? '#FF3B3B' : 'rgba(255,255,255,0.12)'}`, cursor: 'pointer', transition: 'all 0.18s' }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <motion.button onClick={() => { if(subject.trim()) setStarted(true) }} disabled={!subject.trim()}
          whileHover={{ opacity: 0.88 }} whileTap={{ scale: 0.97 }}
          style={{ background: '#FF3B3B', color: '#fff', border: 'none', padding: '13px', fontFamily: mono, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', opacity: !subject.trim() ? 0.4 : 1, cursor: 'pointer' }}>
          START_SESSION →
        </motion.button>
      </div>
    </div>
  );

  // ── Chat screen ────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 720, height: 'calc(100vh - 160px)' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => { setStarted(false); setHistory([]); setQuiz(null) }}
          style={{ fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.08em', transition: 'color 0.18s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>← BACK</button>
        <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: '#FF3B3B', letterSpacing: '0.06em' }}>{subject.toUpperCase()}</div>
        <div style={{ fontFamily: mono, fontSize: 9, border: '1px solid rgba(255,59,59,0.3)', color: 'rgba(255,59,59,0.7)', padding: '2px 8px', letterSpacing: '0.1em' }}>{level.toUpperCase()}</div>
        <button onClick={fetchQuiz}
          style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.08em', padding: '5px 12px', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.45)', background: 'none', cursor: 'pointer', marginLeft: 'auto', transition: 'all 0.18s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#FBFF48'; (e.currentTarget as HTMLElement).style.color = '#FBFF48' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)' }}>
          GENERATE_QUIZ
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {history.length === 0 && (
          <div style={{ fontFamily: ibm, fontSize: 13, color: 'rgba(255,255,255,0.25)', padding: '20px 0' }}>
            Ask anything about <span style={{ color: '#FF3B3B' }}>{subject}</span>...
          </div>
        )}
        {history.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role==='user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%',
              padding: '12px 16px',
              background: msg.role==='user' ? 'rgba(255,59,59,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${msg.role==='user' ? 'rgba(255,59,59,0.25)' : 'rgba(255,255,255,0.08)'}`,
              fontFamily: ibm, fontSize: 13, color: '#fff', lineHeight: 1.7,
            }}>
              <div style={{ fontFamily: mono, fontSize: 9, color: msg.role==='user' ? '#FF3B3B' : 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: 6 }}>
                {msg.role==='user' ? '// YOU' : '// AI_TUTOR'}
              </div>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '12px 16px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
              <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: 6 }}>// THINKING</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, background: '#FF3B3B', borderRadius: '50%', animation: `pulse ${0.6+i*0.2}s infinite` }} />)}
              </div>
            </div>
          </div>
        )}
        {error && <div style={{ fontFamily: ibm, fontSize: 12, color: '#FF3B3B', padding: '8px 12px', border: '1px solid rgba(255,59,59,0.25)' }}>{error}</div>}

        {/* Quiz */}
        {quiz && (
          <div style={{ border: '1px solid rgba(251,255,72,0.2)', padding: 20, background: 'rgba(251,255,72,0.03)', marginTop: 8 }}>
            <div style={{ fontFamily: mono, fontSize: 10, color: '#FBFF48', letterSpacing: '0.12em', marginBottom: 16 }}>// QUIZ — {subject.toUpperCase()}</div>
            {quiz.map((q: any, i: number) => (
              <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i<quiz.length-1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ fontFamily: ibm, fontSize: 13, color: '#fff', marginBottom: 8, lineHeight: 1.6 }}>{i+1}. {q.question}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {q.options?.map((opt: string) => (
                    <button key={opt} onClick={() => !quizChecked && setQuizAnswers(a => ({ ...a, [i]: opt }))}
                      style={{ textAlign: 'left', padding: '8px 12px', fontFamily: ibm, fontSize: 12, cursor: quizChecked ? 'default' : 'pointer',
                        background: quizChecked ? (opt===q.answer ? 'rgba(74,222,128,0.1)' : quizAnswers[i]===opt ? 'rgba(255,59,59,0.1)' : 'transparent') : quizAnswers[i]===opt ? 'rgba(251,255,72,0.08)' : 'transparent',
                        border: `1px solid ${quizChecked ? (opt===q.answer ? '#4ADE80' : quizAnswers[i]===opt ? '#FF3B3B' : 'rgba(255,255,255,0.06)') : quizAnswers[i]===opt ? '#FBFF48' : 'rgba(255,255,255,0.08)'}`,
                        color: quizChecked ? (opt===q.answer ? '#4ADE80' : quizAnswers[i]===opt ? '#FF3B3B' : 'rgba(255,255,255,0.4)') : quizAnswers[i]===opt ? '#FBFF48' : 'rgba(255,255,255,0.5)',
                        transition: 'all 0.15s' }}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {!quizChecked
              ? <button onClick={() => setQuizChecked(true)} style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', padding: '10px 20px', background: '#FBFF48', color: '#000', border: 'none', cursor: 'pointer' }}>CHECK_ANSWERS</button>
              : <div style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: score >= quiz.length*0.7 ? '#4ADE80' : '#FF3B3B' }}>SCORE: {score}/{quiz.length}</div>
            }
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {history.length < 2 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {SUGGESTED.map(s => (
            <button key={s} onClick={() => sendMessage(s)}
              style={{ fontFamily: ibm, fontSize: 11, padding: '5px 12px', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', background: 'none', cursor: 'pointer', transition: 'all 0.18s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#FF3B3B'; (e.currentTarget as HTMLElement).style.color = '#FF3B3B' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask anything…"
          style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.12)', padding: '11px 14px', color: '#fff', fontFamily: ibm, fontSize: 13, outline: 'none' }}
          onFocus={e => e.currentTarget.style.borderColor = '#FF3B3B'}
          onBlur={e  => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'} />
        <motion.button onClick={() => sendMessage()} disabled={!input.trim() || loading} whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.97 }}
          style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', padding: '0 20px', background: '#FF3B3B', color: '#fff', border: 'none', cursor: 'pointer', opacity: (!input.trim()||loading) ? 0.4 : 1 }}>
          SEND
        </motion.button>
      </div>
    </div>
  );
}
