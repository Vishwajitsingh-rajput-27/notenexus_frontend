'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Cookies from 'js-cookie';
import { apiGetNotes } from '@/lib/api';
import { useTheme, mono, ibm } from '@/lib/useTheme';

const API = 'https://notenexus-backend-y20v.onrender.com';
const PRESET_INTERVALS = [1, 3, 7, 14, 30];
const TIME_PRESETS = [
  { label: 'DAWN',    value: '06:00', icon: '🌅' },
  { label: 'MORNING', value: '09:00', icon: '☀️' },
  { label: 'NOON',    value: '12:00', icon: '🌤' },
  { label: 'EVENING', value: '18:00', icon: '🌇' },
  { label: 'NIGHT',   value: '21:00', icon: '🌙' },
];
const srcIcon = (t:string) => t==='pdf'?'PDF':t==='image'?'IMG':t==='voice'?'MIC':t==='youtube'?'YT':'TXT';

export default function RevisionReminders() {
  const t = useTheme();
  const [reminders, setReminders]       = useState<any[]>([]);
  const [subject, setSubject]           = useState('');
  const [topic, setTopic]               = useState('');
  const [email, setEmail]               = useState('');
  const [intervalDays, setIntervalDays] = useState<number | ''>(7);
  const [customInterval, setCustomInterval] = useState('');
  const [useCustomInterval, setUseCustomInterval] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [fetching, setFetching]         = useState(true);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [notes, setNotes]               = useState<any[]>([]);
  const [showNotes, setShowNotes]       = useState(false);
  const [loadedFrom, setLoadedFrom]     = useState('');
  const token = () => Cookies.get('nn_token') ?? '';

  const fetchReminders = async () => {
    try {
      const res = await fetch(`${API}/api/reminders`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setReminders(data.reminders || []);
    } catch {} finally { setFetching(false); }
  };

  useEffect(() => { fetchReminders(); }, []);
  useEffect(() => { apiGetNotes().then((d:any) => setNotes(d.notes||[])).catch(()=>{}); }, []);

  const loadFromNote = (note: any) => {
    setSubject(note.subject||''); setTopic(note.chapter||note.title||'');
    setLoadedFrom(`${srcIcon(note.sourceType)} ${note.title}`); setShowNotes(false);
  };

  const effectiveInterval = (): number => {
    if (useCustomInterval) {
      const v = parseInt(customInterval);
      return isNaN(v) || v < 1 ? 1 : v;
    }
    return Number(intervalDays) || 7;
  };

  const createReminder = async () => {
    if (!subject.trim() || !topic.trim() || !email.trim()) { setError('All fields required'); return; }
    if (useCustomInterval && (!customInterval || parseInt(customInterval) < 1)) {
      setError('Enter a valid custom interval (min 1 day)'); return;
    }
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/api/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ subject, topic, email, intervalDays: effectiveInterval(), reminderTime }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      setSuccess('Reminder set! First email sent.'); setReminders(p => [data.reminder, ...p]);
      setSubject(''); setTopic(''); setEmail(''); setLoadedFrom('');
      setCustomInterval(''); setUseCustomInterval(false);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err:any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const deleteReminder = async (id: string) => {
    try {
      await fetch(`${API}/api/reminders/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
      setReminders(p => p.filter(r => r._id !== id));
    } catch {}
  };

  const formatTime = (val: string) => {
    if (!val) return '';
    const [h, m] = val.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${((h % 12) || 12).toString().padStart(2,'0')}:${m.toString().padStart(2,'0')} ${ampm}`;
  };

  const inp: React.CSSProperties = {
    width:'100%', background: t.inpBg, border: `1px solid ${t.inpBorder}`,
    padding:'10px 14px', color: t.inpText, fontFamily: ibm, fontSize:13, outline:'none',
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: mono, fontSize: 10, color: t.accent, letterSpacing: '0.15em', marginBottom: 6 }}>// AI_TOOLS</div>
        <h2 style={{ fontFamily: mono, fontSize: 22, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.02em', color: t.fg }}>
          REVISION<span style={{ color: t.accent }}>_REMINDERS</span>
        </h2>
        <p style={{ fontFamily: ibm, fontSize: 12, color: t.fgDim, marginTop: 4 }}>Spaced repetition reminders sent to your email.</p>
      </div>

      <div style={{ border: `1px solid ${t.border}`, padding: 24, background: t.bg3, display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>

        {/* Note selector */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontFamily: mono, fontSize: 9, color: t.fgMuted, letterSpacing: '0.12em' }}>// LOAD_FROM_NOTE</div>
            <button onClick={() => setShowNotes(v => !v)}
              style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.08em', padding: '4px 10px', border: `1px solid ${t.border}`, color: t.fgDim, background: 'none', cursor: 'pointer', transition: 'all 0.18s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = t.accent; (e.currentTarget as HTMLElement).style.color = t.accent }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = t.border; (e.currentTarget as HTMLElement).style.color = t.fgDim }}>
              SELECT_NOTE {showNotes ? '▲' : '▼'}
            </button>
          </div>
          {showNotes && (
            <div style={{ border: `1px solid ${t.borderSub}`, maxHeight: 160, overflowY: 'auto', background: t.bg2, marginBottom: 8 }}>
              {notes.map(note => (
                <button key={note._id} onClick={() => loadFromNote(note)}
                  style={{ width: '100%', textAlign: 'left', padding: '9px 14px', background: 'none', border: 'none', borderBottom: `1px solid ${t.borderSub}`, cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = t.inpBg)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  <div style={{ fontFamily: ibm, fontSize: 12, color: t.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.title}</div>
                  <div style={{ fontFamily: mono, fontSize: 9, color: t.fgMuted, marginTop: 2 }}>{note.subject}</div>
                </button>
              ))}
            </div>
          )}
          {loadedFrom && <div style={{ fontFamily: ibm, fontSize: 11, color: '#FF3B3B' }}>● Loaded: {loadedFrom}</div>}
        </div>

        {/* Subject */}
        <div>
          <div style={{ fontFamily: mono, fontSize: 9, color: t.fgMuted, letterSpacing: '0.12em', marginBottom: 6 }}>// SUBJECT *</div>
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Physics" style={inp}
            onFocus={e => e.currentTarget.style.borderColor = t.accent}
            onBlur={e => e.currentTarget.style.borderColor = t.inpBorder} />
        </div>

        {/* Topic */}
        <div>
          <div style={{ fontFamily: mono, fontSize: 9, color: t.fgMuted, letterSpacing: '0.12em', marginBottom: 6 }}>// TOPIC *</div>
          <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Newton's Laws" style={inp}
            onFocus={e => e.currentTarget.style.borderColor = t.accent}
            onBlur={e => e.currentTarget.style.borderColor = t.inpBorder} />
        </div>

        {/* Email */}
        <div>
          <div style={{ fontFamily: mono, fontSize: 9, color: t.fgMuted, letterSpacing: '0.12em', marginBottom: 6 }}>// EMAIL *</div>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" type="email" style={inp}
            onFocus={e => e.currentTarget.style.borderColor = t.accent}
            onBlur={e => e.currentTarget.style.borderColor = t.inpBorder} />
        </div>

        {/* Reminder time */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontFamily: mono, fontSize: 9, color: t.fgMuted, letterSpacing: '0.12em' }}>// REMINDER_TIME</div>
            <button onClick={() => setUseCustomTime(v => !v)}
              style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.08em', padding: '3px 8px', border: `1px solid ${useCustomTime ? t.accent : t.border}`, color: useCustomTime ? t.accent : t.fgDim, background: 'none', cursor: 'pointer' }}>
              {useCustomTime ? 'USE_PRESETS' : 'CUSTOM_TIME'}
            </button>
          </div>

          {!useCustomTime ? (
            <div style={{ display: 'flex', gap: 6 }}>
              {TIME_PRESETS.map(preset => {
                const active = reminderTime === preset.value;
                return (
                  <button key={preset.value} onClick={() => setReminderTime(preset.value)}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 4px', background: active ? t.inpBg : 'transparent', border: `1px solid ${active ? t.accent : t.border}`, cursor: 'pointer' }}>
                    <span style={{ fontSize: 14 }}>{preset.icon}</span>
                    <span style={{ fontFamily: mono, fontSize: 8, color: active ? t.accent : t.fgDim }}>{preset.label}</span>
                    <span style={{ fontFamily: ibm, fontSize: 9, color: active ? t.accent : t.fgMuted }}>{formatTime(preset.value)}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value)}
                style={{ ...inp, width: 'auto', flex: 1, cursor: 'pointer' }}
                onFocus={e => e.currentTarget.style.borderColor = t.accent}
                onBlur={e => e.currentTarget.style.borderColor = t.inpBorder} />
              <div style={{ fontFamily: mono, fontSize: 10, color: t.accent, letterSpacing: '0.08em', whiteSpace: 'nowrap', padding: '10px 14px', border: `1px solid ${t.accentBorder}`, background: t.inpBg }}>
                {formatTime(reminderTime)}
              </div>
            </div>
          )}

          <div style={{ fontFamily: mono, fontSize: 9, color: t.fgMuted, marginTop: 5, letterSpacing: '0.06em' }}>
            Email arrives at <span style={{ color: t.accent }}>{formatTime(reminderTime)}</span>
          </div>
        </div>

        {/* Interval */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontFamily: mono, fontSize: 9, color: t.fgMuted, letterSpacing: '0.12em' }}>// INTERVAL</div>
            <button onClick={() => { setUseCustomInterval(v => !v); setCustomInterval(''); }}
              style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.08em', padding: '3px 8px', border: `1px solid ${useCustomInterval ? t.accent : t.border}`, color: useCustomInterval ? t.accent : t.fgDim, background: 'none', cursor: 'pointer', transition: 'all 0.18s' }}>
              {useCustomInterval ? 'USE_PRESET' : 'CUSTOM'}
            </button>
          </div>

          {!useCustomInterval ? (
            <div style={{ display: 'flex', gap: 4 }}>
              {PRESET_INTERVALS.map(d => (
                <button key={d} onClick={() => setIntervalDays(d)}
                  style={{ flex: 1, fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', padding: '7px 4px', background: intervalDays===d ? t.accent : 'transparent', color: intervalDays===d ? '#000' : t.fgDim, border: `1px solid ${intervalDays===d ? t.accent : t.border}`, cursor: 'pointer', transition: 'all 0.18s' }}>
                  {d}d
                </button>
              ))}
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="number" min={1} max={365} value={customInterval} onChange={e => setCustomInterval(e.target.value)}
                  placeholder="e.g. 5" style={{ ...inp, flex: 1 }}
                  onFocus={e => e.currentTarget.style.borderColor = t.accent}
                  onBlur={e => e.currentTarget.style.borderColor = t.inpBorder} />
                <div style={{ fontFamily: mono, fontSize: 10, color: t.fgDim, whiteSpace: 'nowrap', padding: '10px 14px', border: `1px solid ${t.border}` }}>DAYS</div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {[2, 5, 10, 21, 45, 60, 90].map(d => (
                  <button key={d} onClick={() => setCustomInterval(String(d))}
                    style={{ fontFamily: mono, fontSize: 8, padding: '4px 8px', background: customInterval === String(d) ? t.inpBg : 'transparent', color: customInterval === String(d) ? t.accent : t.fgMuted, border: `1px solid ${customInterval === String(d) ? t.accentBorder : t.borderSub}`, cursor: 'pointer' }}>
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ fontFamily: mono, fontSize: 9, color: t.fgMuted, marginTop: 6, letterSpacing: '0.06em' }}>
            Remind every{' '}
            <span style={{ color: t.accent }}>
              {useCustomInterval ? (customInterval || '?') : intervalDays} day{effectiveInterval() !== 1 ? 's' : ''}
            </span>
            {reminderTime && <> at <span style={{ color: t.accent }}>{formatTime(reminderTime)}</span></>}
          </div>
        </div>
      </div>

      {error   && <div style={{ fontFamily: ibm, fontSize: 12, color: '#FF3B3B', padding: '8px 12px', border: '1px solid rgba(255,59,59,0.25)', marginBottom: 16 }}>{error}</div>}
      {success && <div style={{ fontFamily: ibm, fontSize: 12, color: '#4ADE80', padding: '8px 12px', border: '1px solid rgba(74,222,128,0.25)', marginBottom: 16 }}>{success}</div>}

      <motion.button onClick={createReminder} disabled={loading} whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.97 }}
        style={{ width: '100%', background: t.accent, color: '#000', border: 'none', padding: '13px', fontFamily: mono, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', opacity: loading ? 0.6 : 1, cursor: 'pointer', marginBottom: 32 }}>
        {loading ? 'SETTING REMINDER...' : 'SET_REMINDER →'}
      </motion.button>

      {!fetching && reminders.length > 0 && (
        <div>
          <div style={{ fontFamily: mono, fontSize: 9, color: t.fgMuted, letterSpacing: '0.12em', marginBottom: 12 }}>// ACTIVE_REMINDERS ({reminders.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: t.cardBg }}>
            {reminders.map(r => (
              <div key={r._id} style={{ background: t.bg2, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: ibm, fontSize: 13, color: t.fg, marginBottom: 5 }}>{r.subject} — {r.topic}</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: mono, fontSize: 9, color: t.fgMuted, letterSpacing: '0.08em' }}>EVERY {r.intervalDays}d</span>
                    {r.reminderTime && (
                      <span style={{ fontFamily: mono, fontSize: 9, color: t.fgMuted, letterSpacing: '0.08em' }}>@ {formatTime(r.reminderTime)}</span>
                    )}
                    <span style={{ fontFamily: mono, fontSize: 9, color: t.fgMuted }}>→ {r.email}</span>
                  </div>
                </div>
                <button onClick={() => deleteReminder(r._id)}
                  style={{ fontFamily: mono, fontSize: 10, color: t.fgMuted, background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.18s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#FF3B3B')}
                  onMouseLeave={e => (e.currentTarget.style.color = t.fgMuted)}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
