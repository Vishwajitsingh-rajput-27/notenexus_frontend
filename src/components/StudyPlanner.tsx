'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';
import { apiGetNotes } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL;
const mono = "'Space Mono','Courier New',monospace";
const ibm  = "'IBM Plex Mono','Courier New',monospace";
const srcIcon = (t:string) => t==='pdf'?'PDF':t==='image'?'IMG':t==='voice'?'MIC':t==='youtube'?'YT':'TXT';

const typeColors: Record<string,string> = { study:'#60A5FA', revision:'#A78BFA', practice:'#4ADE80', rest:'rgba(255,255,255,0.3)' };

export default function StudyPlanner({ preloadSubject = '' }: { preloadSubject?: string }) {
  const [subjects, setSubjects]       = useState(preloadSubject || '');
  const [examDate, setExamDate]       = useState('');
  const [dailyHours, setDailyHours]   = useState(4);
  const [weakTopics, setWeakTopics]   = useState('');
  const [plan, setPlan]               = useState<any>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [notes, setNotes]             = useState<any[]>([]);
  const [showNotes, setShowNotes]     = useState(false);
  const [loadedFrom, setLoadedFrom]   = useState('');
  const minDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  useEffect(() => { apiGetNotes().then((d:any) => setNotes(d.notes||[])).catch(()=>{}); }, []);

  const loadFromNote = (note: any) => {
    if (note.subject) setSubjects(note.subject);
    if (note.keywords?.length) setWeakTopics(note.keywords.slice(0,3).join(', '));
    setLoadedFrom(`${srcIcon(note.sourceType)} ${note.title}`);
    setShowNotes(false); setPlan(null);
  };

  const generate = async () => {
    const subArr = subjects.split(',').map((s:string) => s.trim()).filter(Boolean);
    if (!subArr.length) { setError('Add at least one subject'); return; }
    if (!examDate) { setError('Select your exam date'); return; }
    setError(''); setLoading(true); setPlan(null);
    try {
      const token = Cookies.get('nn_token');
      const res = await fetch(`${API}/api/planner/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subjects: subArr, examDate, dailyHours, weakTopics, aiModel: 'groq' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPlan(data); setExpandedDay(1);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const inp: React.CSSProperties = { width:'100%', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.12)', padding:'10px 14px', color:'#fff', fontFamily:ibm, fontSize:13, outline:'none' };

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: mono, fontSize: 10, color: '#A78BFA', letterSpacing: '0.15em', marginBottom: 6 }}>// AI_TOOLS</div>
        <h2 style={{ fontFamily: mono, fontSize: 22, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          STUDY<span style={{ color: '#A78BFA' }}>_PLANNER</span>
        </h2>
        <p style={{ fontFamily: ibm, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>AI builds a personalized revision schedule for your exam.</p>
      </div>

      <div style={{ border: '1px solid rgba(255,255,255,0.08)', padding: 24, background: '#0d0d0d', display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 24 }}>
        {/* Note selector */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em' }}>// LOAD_FROM_NOTE</div>
            <button onClick={() => setShowNotes(v => !v)}
              style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.08em', padding: '4px 10px', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.4)', background: 'none', cursor: 'pointer', transition: 'all 0.18s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='#A78BFA'; (e.currentTarget as HTMLElement).style.color='#A78BFA' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.4)' }}>
              SELECT_NOTE {showNotes ? '▲' : '▼'}
            </button>
          </div>
          {showNotes && (
            <div style={{ border: '1px solid rgba(255,255,255,0.08)', maxHeight: 160, overflowY: 'auto', background: 'rgba(0,0,0,0.3)', marginBottom: 8 }}>
              {notes.map(note => (
                <button key={note._id} onClick={() => loadFromNote(note)}
                  style={{ width:'100%', textAlign:'left', padding:'9px 14px', background:'none', border:'none', borderBottom:'1px solid rgba(255,255,255,0.05)', cursor:'pointer', transition:'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background='none')}>
                  <div style={{ fontFamily:ibm, fontSize:12, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{note.title}</div>
                  <div style={{ fontFamily:mono, fontSize:9, color:'rgba(255,255,255,0.3)', marginTop:2 }}>{note.subject}</div>
                </button>
              ))}
            </div>
          )}
          {loadedFrom && <div style={{ fontFamily:ibm, fontSize:11, color:'#A78BFA' }}>● Loaded: {loadedFrom}</div>}
        </div>

        {/* Subjects */}
        <div>
          <div style={{ fontFamily:mono, fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:'0.12em', marginBottom:6 }}>// SUBJECTS (comma-separated) *</div>
          <input value={subjects} onChange={e => setSubjects(e.target.value)} placeholder="Physics, Maths, History"
            style={inp} onFocus={e => e.currentTarget.style.borderColor='#A78BFA'} onBlur={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'} />
        </div>

        {/* Exam date */}
        <div>
          <div style={{ fontFamily:mono, fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:'0.12em', marginBottom:6 }}>// EXAM_DATE *</div>
          <input type="date" value={examDate} min={minDate} onChange={e => setExamDate(e.target.value)}
            style={{ ...inp, colorScheme:'dark' }} onFocus={e => e.currentTarget.style.borderColor='#A78BFA'} onBlur={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'} />
        </div>

        {/* Daily hours */}
        <div>
          <div style={{ fontFamily:mono, fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:'0.12em', marginBottom:8 }}>// DAILY_HOURS: {dailyHours}h</div>
          <input type="range" min={1} max={12} value={dailyHours} onChange={e => setDailyHours(Number(e.target.value))} style={{ width:'100%', accentColor:'#A78BFA' }} />
        </div>

        {/* Weak topics */}
        <div>
          <div style={{ fontFamily:mono, fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:'0.12em', marginBottom:6 }}>// WEAK_TOPICS (optional)</div>
          <input value={weakTopics} onChange={e => setWeakTopics(e.target.value)} placeholder="e.g. Integration, Thermodynamics"
            style={inp} onFocus={e => e.currentTarget.style.borderColor='#A78BFA'} onBlur={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'} />
        </div>
      </div>

      {error && <div style={{ fontFamily:ibm, fontSize:12, color:'#FF3B3B', padding:'8px 12px', border:'1px solid rgba(255,59,59,0.25)', marginBottom:16 }}>{error}</div>}

      <motion.button onClick={generate} disabled={loading} whileHover={{ opacity:0.85 }} whileTap={{ scale:0.97 }}
        style={{ width:'100%', background:'#A78BFA', color:'#000', border:'none', padding:'13px', fontFamily:mono, fontSize:12, fontWeight:700, letterSpacing:'0.1em', opacity:loading?0.6:1, cursor:'pointer', marginBottom:28 }}>
        {loading ? 'GENERATING PLAN...' : 'GENERATE_STUDY_PLAN →'}
      </motion.button>

      {plan && (
        <div>
          {/* Summary */}
          {plan.summary && (
            <div style={{ border:'1px solid rgba(167,139,250,0.2)', padding:16, marginBottom:20, background:'rgba(167,139,250,0.04)' }}>
              <div style={{ fontFamily:mono, fontSize:9, color:'#A78BFA', letterSpacing:'0.12em', marginBottom:8 }}>// PLAN_SUMMARY</div>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:10 }}>
                {[['DAYS',plan.summary.totalDays],['HOURS',plan.summary.totalHours],['SUBJECTS',plan.summary.subjects?.join(', ')]].map(([l,v]) => (
                  <div key={l as string} style={{ fontFamily:mono, fontSize:9, padding:'4px 12px', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.5)', letterSpacing:'0.08em' }}>{l}: {v}</div>
                ))}
              </div>
              {plan.summary.strategy && <div style={{ fontFamily:ibm, fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>{plan.summary.strategy}</div>}
            </div>
          )}
          {/* Daily plan */}
          <div style={{ display:'flex', flexDirection:'column', gap:1, background:'rgba(255,255,255,0.04)' }}>
            {plan.dailyPlan?.map((day: any) => (
              <div key={day.day} style={{ background:'#0d0d0d', borderLeft: expandedDay===day.day ? '2px solid #A78BFA' : '2px solid transparent', transition:'border-color 0.18s' }}>
                <button onClick={() => setExpandedDay(expandedDay===day.day ? null : day.day)}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'13px 16px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
                  <span style={{ fontFamily:mono, fontSize:10, color:'#A78BFA', letterSpacing:'0.08em', flexShrink:0 }}>DAY_{day.day}</span>
                  <span style={{ fontFamily:ibm, fontSize:13, color:'rgba(255,255,255,0.7)', flex:1 }}>{day.date}</span>
                  <span style={{ fontFamily:mono, fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:'0.08em' }}>{day.sessions?.length||0} SESSIONS</span>
                  <span style={{ fontFamily:mono, fontSize:10, color:'rgba(255,255,255,0.2)' }}>{expandedDay===day.day?'▲':'▼'}</span>
                </button>
                <AnimatePresence>
                  {expandedDay===day.day && (
                    <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} style={{ overflow:'hidden' }}>
                      <div style={{ padding:'0 16px 16px 16px' }}>
                        {day.sessions?.map((s: any, si: number) => (
                          <div key={si} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'10px 0', borderBottom:si<day.sessions.length-1?'1px solid rgba(255,255,255,0.05)':'none' }}>
                            <div style={{ width:3, height:3, borderRadius:'50%', background:typeColors[s.type]||'rgba(255,255,255,0.3)', marginTop:8, flexShrink:0 }} />
                            <div style={{ flex:1 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                                <span style={{ fontFamily:mono, fontSize:9, color:typeColors[s.type]||'rgba(255,255,255,0.3)', letterSpacing:'0.08em' }}>{s.type?.toUpperCase()}</span>
                                <span style={{ fontFamily:mono, fontSize:9, color:'rgba(255,255,255,0.25)' }}>{s.duration}min</span>
                              </div>
                              <div style={{ fontFamily:ibm, fontSize:13, color:'#fff', marginBottom:3 }}>{s.subject}</div>
                              {s.topic && <div style={{ fontFamily:ibm, fontSize:12, color:'rgba(255,255,255,0.45)' }}>{s.topic}</div>}
                              {s.description && <div style={{ fontFamily:ibm, fontSize:12, color:'rgba(255,255,255,0.35)', marginTop:4, lineHeight:1.6 }}>{s.description}</div>}
                            </div>
                          </div>
                        ))}
                        {day.totalHours && <div style={{ fontFamily:mono, fontSize:9, color:'rgba(255,255,255,0.25)', marginTop:10, letterSpacing:'0.08em' }}>TOTAL: {day.totalHours}h</div>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
