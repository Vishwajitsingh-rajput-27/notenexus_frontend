'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Cookies from 'js-cookie';
import { apiGetNotes, apiGetNote } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL;
const mono = "'Space Mono','Courier New',monospace";
const ibm  = "'IBM Plex Mono','Courier New',monospace";
const srcIcon = (t:string) => t==='pdf'?'PDF':t==='image'?'IMG':t==='voice'?'MIC':t==='youtube'?'YT':'TXT';

const diffColor: Record<string,string> = { Easy:'#4ADE80', Medium:'#FBFF48', Hard:'#FF3B3B' };

function Collapsible({ open, children }: { open: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  useEffect(() => { if (ref.current) setHeight(ref.current.scrollHeight); }, [open, children]);
  return (
    <motion.div animate={{ height: open ? height : 0, opacity: open ? 1 : 0 }} initial={false} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
      <div ref={ref}>{children}</div>
    </motion.div>
  );
}

export default function ExamPredictor({ preloadContent='', preloadSubject='' }: { preloadContent?:string; preloadSubject?:string }) {
  const [noteContent, setNoteContent] = useState(preloadContent);
  const [subject, setSubject]         = useState(preloadSubject);
  const [examType, setExamType]       = useState('mixed');
  const [count, setCount]             = useState(10);
  const [questions, setQuestions]     = useState<any[]>([]);
  const [meta, setMeta]               = useState<any>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [subjects, setSubjects]       = useState<string[]>([]);
  const [openIdx, setOpenIdx]         = useState<number | null>(null);
  const [notes, setNotes]             = useState<any[]>([]);
  const [showNotes, setShowNotes]     = useState(false);
  const [loadedFrom, setLoadedFrom]   = useState('');

  useEffect(() => { if (preloadContent) setNoteContent(preloadContent); }, [preloadContent]);
  useEffect(() => { if (preloadSubject) setSubject(preloadSubject); }, [preloadSubject]);
  useEffect(() => { apiGetNotes().then((d:any) => setNotes(d.notes||[])).catch(()=>{}); }, []);
  useEffect(() => {
    const token = Cookies.get('nn_token');
    fetch(`${API}/api/notes/subjects`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setSubjects(d.subjects||[])).catch(()=>{});
  }, []);

  const loadFromNote = async (note: any) => {
    try { const d = await apiGetNote(note._id); setNoteContent(d.content||''); setSubject(note.subject||''); setLoadedFrom(`${srcIcon(note.sourceType)} ${note.title}`); setShowNotes(false); }
    catch {}
  };

  const generate = async () => {
    setError(''); setLoading(true); setQuestions([]); setMeta(null);
    try {
      const token = Cookies.get('nn_token');
      const res = await fetch(`${API}/api/exam/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ noteContent, subject, examType, count, aiModel: 'groq' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuestions(data.questions||[]); setMeta(data.meta||null);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const EXAM_TYPES = ['multiple_choice','short_answer','long_answer','mixed'];
  const inp: React.CSSProperties = { width:'100%', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.12)', padding:'10px 14px', color:'#fff', fontFamily:ibm, fontSize:13, outline:'none' };

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: mono, fontSize: 10, color: '#FF3B3B', letterSpacing: '0.15em', marginBottom: 6 }}>// AI_TOOLS</div>
        <h2 style={{ fontFamily: mono, fontSize: 22, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          EXAM<span style={{ color: '#FF3B3B' }}>_PREDICTOR</span>
        </h2>
        <p style={{ fontFamily: ibm, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Generate likely exam questions from your notes using AI.</p>
      </div>

      <div style={{ border: '1px solid rgba(255,255,255,0.08)', padding: 24, background: '#0d0d0d', display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 24 }}>
        {/* Note selector */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em' }}>// LOAD_FROM_NOTE</div>
            <button onClick={() => setShowNotes(v => !v)}
              style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.08em', padding: '4px 10px', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.4)', background: 'none', cursor: 'pointer', transition: 'all 0.18s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#FBFF48'; (e.currentTarget as HTMLElement).style.color = '#FBFF48' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)' }}>
              SELECT_NOTE {showNotes ? '▲' : '▼'}
            </button>
          </div>
          {showNotes && (
            <div style={{ border: '1px solid rgba(255,255,255,0.08)', maxHeight: 160, overflowY: 'auto', background: 'rgba(0,0,0,0.3)', marginBottom: 8 }}>
              {notes.map(note => (
                <button key={note._id} onClick={() => loadFromNote(note)}
                  style={{ width: '100%', textAlign: 'left', padding: '9px 14px', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  <div style={{ fontFamily: ibm, fontSize: 12, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.title}</div>
                  <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{note.subject}</div>
                </button>
              ))}
            </div>
          )}
          {loadedFrom && <div style={{ fontFamily: ibm, fontSize: 11, color: '#FF3B3B' }}>● Loaded: {loadedFrom}</div>}
        </div>

        {/* Subject */}
        <div>
          <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', marginBottom: 6 }}>// SUBJECT</div>
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Physics, History"
            style={inp} onFocus={e => e.currentTarget.style.borderColor = '#FF3B3B'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'} />
          {subjects.length > 0 && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
              {subjects.map(s => (
                <button key={s} onClick={() => setSubject(s)}
                  style={{ fontFamily: mono, fontSize: 9, padding: '3px 10px', border: `1px solid ${subject===s ? '#FF3B3B' : 'rgba(255,255,255,0.1)'}`, color: subject===s ? '#FF3B3B' : 'rgba(255,255,255,0.35)', background: 'none', cursor: 'pointer', transition: 'all 0.18s' }}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Exam type */}
        <div>
          <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', marginBottom: 8 }}>// EXAM_TYPE</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {EXAM_TYPES.map(t => (
              <button key={t} onClick={() => setExamType(t)}
                style={{ fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', padding: '6px 12px', textTransform: 'uppercase', background: examType===t ? '#FF3B3B' : 'transparent', color: examType===t ? '#fff' : 'rgba(255,255,255,0.35)', border: `1px solid ${examType===t ? '#FF3B3B' : 'rgba(255,255,255,0.12)'}`, cursor: 'pointer', transition: 'all 0.18s' }}>
                {t.replace('_',' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <div>
          <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', marginBottom: 8 }}>// QUESTION_COUNT: {count}</div>
          <input type="range" min={3} max={20} value={count} onChange={e => setCount(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#FF3B3B' }} />
        </div>

        {/* Note content */}
        <div>
          <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', marginBottom: 6 }}>// NOTE_CONTENT (optional)</div>
          <textarea value={noteContent} onChange={e => setNoteContent(e.target.value)}
            placeholder="Paste note content or load from a saved note…"
            style={{ ...inp, height: 100, resize: 'none', display: 'block', lineHeight: 1.7 }}
            onFocus={e => e.currentTarget.style.borderColor = '#FF3B3B'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'} />
        </div>
      </div>

      {error && <div style={{ fontFamily: ibm, fontSize: 12, color: '#FF3B3B', padding: '8px 12px', border: '1px solid rgba(255,59,59,0.25)', marginBottom: 16 }}>{error}</div>}

      <motion.button onClick={generate} disabled={loading} whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.97 }}
        style={{ width: '100%', background: '#FF3B3B', color: '#fff', border: 'none', padding: '13px', fontFamily: mono, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', opacity: loading ? 0.6 : 1, cursor: 'pointer', marginBottom: 28 }}>
        {loading ? 'GENERATING...' : 'PREDICT_EXAM_QUESTIONS →'}
      </motion.button>

      {questions.length > 0 && (
        <div>
          {meta && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              {[['SUBJECT', meta.subject],['DIFFICULTY', meta.difficulty],['COUNT', questions.length]].map(([l,v]) => (
                <div key={l as string} style={{ fontFamily: mono, fontSize: 9, padding: '4px 12px', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>
                  {l}: {v}
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'rgba(255,255,255,0.04)' }}>
            {questions.map((q: any, i: number) => (
              <div key={i} style={{ background: '#0d0d0d', borderLeft: openIdx===i ? `2px solid ${diffColor[q.difficulty]||'#FBFF48'}` : '2px solid transparent', transition: 'border-color 0.18s' }}>
                <button onClick={() => setOpenIdx(openIdx===i ? null : i)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontFamily: mono, fontSize: 9, color: diffColor[q.difficulty]||'rgba(255,255,255,0.3)', border: `1px solid ${diffColor[q.difficulty]||'rgba(255,255,255,0.15)'}30`, padding: '2px 8px', flexShrink: 0 }}>{q.difficulty||'—'}</span>
                  <span style={{ fontFamily: ibm, fontSize: 13, color: '#fff', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.question}</span>
                  <span style={{ fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{openIdx===i?'▲':'▼'}</span>
                </button>
                <Collapsible open={openIdx===i}>
                  <div style={{ padding: '0 16px 16px 16px', paddingLeft: 54 }}>
                    {q.type && <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: 10 }}>TYPE: {q.type.toUpperCase().replace('_',' ')}</div>}
                    {q.options && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                        {q.options.map((opt: string) => (
                          <div key={opt} style={{ fontFamily: ibm, fontSize: 12, padding: '6px 12px', border: `1px solid ${opt===q.answer ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.06)'}`, color: opt===q.answer ? '#4ADE80' : 'rgba(255,255,255,0.5)', background: opt===q.answer ? 'rgba(74,222,128,0.06)' : 'transparent' }}>{opt}</div>
                        ))}
                      </div>
                    )}
                    {q.answer && <div style={{ fontFamily: ibm, fontSize: 12, color: '#4ADE80', padding: '8px 12px', border: '1px solid rgba(74,222,128,0.2)', background: 'rgba(74,222,128,0.06)', marginBottom: 8 }}>{q.answer}</div>}
                    {q.explanation && <div style={{ fontFamily: ibm, fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{q.explanation}</div>}
                    {q.marks && <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 8, letterSpacing: '0.08em' }}>MARKS: {q.marks}</div>}
                  </div>
                </Collapsible>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
