'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/store'
// apiMe available if needed

const API = process.env.NEXT_PUBLIC_API_URL
const mono = "'Space Mono','Courier New',monospace"
const ibm  = "'IBM Plex Mono','Courier New',monospace"
const srcIcon = (t:string) => t==='pdf'?'PDF':t==='image'?'IMG':t==='voice'?'MIC':t==='youtube'?'YT':'TXT'
const formatDate = (d:string) => new Date(d).toLocaleDateString('en-US',{ day:'numeric', month:'short', year:'numeric' })
type Tab = 'stats' | 'history' | 'profile' | 'password'

const TABS: {id:Tab; label:string}[] = [
  { id:'stats',    label:'STATS'    },
  { id:'history',  label:'HISTORY'  },
  { id:'profile',  label:'PROFILE'  },
  { id:'password', label:'PASSWORD' },
]

export default function Profile() {
  const { user: storeUser, token } = useAuthStore()
  const [user, setUser] = useState(storeUser)
  const [tab, setTab] = useState<Tab>('stats')
  const [stats, setStats]     = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName]   = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saving, setSaving] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw]         = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [changingPw, setChangingPw] = useState(false)
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API}/api/auth/stats`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        setStats(data.stats); setHistory(data.history || [])
      } catch { toast.error('Could not load stats') }
      finally { setLoading(false) }
    }
    fetchStats()
  }, [])

  const saveProfile = async () => {
    if (!name.trim()||!email.trim()) { toast.error('Name and email required'); return }
    setSaving(true)
    try {
      const res = await fetch(`${API}/api/auth/profile`, { method:'PATCH', headers, body: JSON.stringify({ name, email }) })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message); return }
      setUser(u => u ? { ...u, name: data.name, email: data.email } : u)
      toast.success('Profile updated!')
    } catch { toast.error('Could not update profile') }
    finally { setSaving(false) }
  }

  const changePassword = async () => {
    if (!currentPw||!newPw||!confirmPw) { toast.error('All fields required'); return }
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return }
    if (newPw.length < 6) { toast.error('Min 6 characters'); return }
    setChangingPw(true)
    try {
      const res = await fetch(`${API}/api/auth/password`, { method:'PATCH', headers, body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }) })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message); return }
      toast.success('Password changed!')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch { toast.error('Failed') }
    finally { setChangingPw(false) }
  }

  const inp: React.CSSProperties = { width:'100%', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.12)', padding:'10px 14px', color:'#fff', fontFamily:ibm, fontSize:13, outline:'none', transition:'border-color 0.2s' }

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily:mono, fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'0.15em', marginBottom:6 }}>// ACCOUNT</div>
        <h2 style={{ fontFamily:mono, fontSize:22, fontWeight:700, textTransform:'uppercase', letterSpacing:'-0.02em' }}>
          USER<span style={{ color:'#FBFF48' }}>_PROFILE</span>
        </h2>
        <div style={{ fontFamily:ibm, fontSize:12, color:'rgba(255,255,255,0.35)', marginTop:4 }}>{user?.email}</div>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, marginBottom:28, borderBottom:'1px solid rgba(255,255,255,0.07)', paddingBottom:0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              fontFamily:mono, fontSize:10, fontWeight:700, letterSpacing:'0.1em',
              padding:'9px 16px',
              background: tab===t.id ? '#FBFF48' : 'transparent',
              color: tab===t.id ? '#000' : 'rgba(255,255,255,0.35)',
              border:'none', borderBottom: tab===t.id ? '2px solid #FBFF48' : '2px solid transparent',
              cursor:'pointer', transition:'all 0.18s', marginBottom:'-1px',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.15 }}>

          {/* STATS */}
          {tab === 'stats' && (
            loading ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
                {[...Array(4)].map((_,i) => <div key={i} style={{ height:80, border:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.02)', animation:'pulse 1.5s infinite' }} />)}
              </div>
            ) : stats ? (
              <div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginBottom:20 }}>
                  {[
                    ['TOTAL_NOTES',   stats.totalNotes,    '#FBFF48'],
                    ['SUBJECTS',      stats.totalSubjects, '#60A5FA'],
                    ['SHARED_NOTES',  stats.sharedNotes,   '#4ADE80'],
                    ['ACCOUNT_AGE',   stats.accountAge ? `${stats.accountAge}d` : '—', 'rgba(255,255,255,0.5)'],
                  ].map(([l,v,c]) => (
                    <div key={l as string} style={{ border:`1px solid ${(c as string)}20`, padding:'16px 18px', background:`${(c as string)}06` }}>
                      <div style={{ fontFamily:mono, fontSize:9, color:c as string, letterSpacing:'0.12em', marginBottom:8 }}>{l}</div>
                      <div style={{ fontFamily:mono, fontSize:28, fontWeight:700, color:'#fff' }}>{v ?? '—'}</div>
                    </div>
                  ))}
                </div>
                {stats.subjectBreakdown?.length > 0 && (
                  <div style={{ border:'1px solid rgba(255,255,255,0.08)', background:'#0d0d0d' }}>
                    <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontFamily:mono, fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:'0.12em' }}>// SUBJECT_BREAKDOWN</div>
                    </div>
                    {stats.subjectBreakdown.map((s: any) => (
                      <div key={s.subject} style={{ display:'flex', alignItems:'center', gap:14, padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ fontFamily:ibm, fontSize:13, color:'#fff', flex:1 }}>{s.subject}</div>
                        <div style={{ fontFamily:mono, fontSize:11, fontWeight:700, color:'#FBFF48' }}>{s.count}</div>
                        <div style={{ width:80, height:4, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
                          <div style={{ height:'100%', background:'#FBFF48', width:`${Math.min(100,(s.count/stats.totalNotes)*100)}%`, transition:'width 0.5s' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontFamily:ibm, fontSize:13, color:'rgba(255,255,255,0.35)', padding:'40px 0', textAlign:'center' }}>No stats available.</div>
            )
          )}

          {/* HISTORY */}
          {tab === 'history' && (
            loading ? (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {[...Array(5)].map((_,i) => <div key={i} style={{ height:60, border:'1px solid rgba(255,255,255,0.06)', animation:'pulse 1.5s infinite' }} />)}
              </div>
            ) : history.length === 0 ? (
              <div style={{ fontFamily:ibm, fontSize:13, color:'rgba(255,255,255,0.35)', padding:'40px 0', textAlign:'center' }}>No upload history yet.</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:1, background:'rgba(255,255,255,0.04)' }}>
                {history.map((h: any, i: number) => (
                  <div key={i} style={{ background:'#0d0d0d', padding:'13px 16px', display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontFamily:mono, fontSize:9, color:'#FBFF48', border:'1px solid rgba(251,255,72,0.25)', padding:'2px 7px', flexShrink:0 }}>
                      {srcIcon(h.sourceType)}
                    </span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:ibm, fontSize:13, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.title}</div>
                      <div style={{ display:'flex', gap:6, marginTop:3 }}>
                        <span style={{ fontFamily:mono, fontSize:9, color:'#60A5FA', letterSpacing:'0.08em' }}>{h.subject}</span>
                        <span style={{ fontFamily:mono, fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'0.08em' }}>{h.chapter}</span>
                      </div>
                    </div>
                    <div style={{ fontFamily:mono, fontSize:9, color:'rgba(255,255,255,0.25)', flexShrink:0, letterSpacing:'0.06em' }}>{h.createdAt ? formatDate(h.createdAt) : ''}</div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* PROFILE EDIT */}
          {tab === 'profile' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16, maxWidth:440 }}>
              <div>
                <div style={{ fontFamily:mono, fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:'0.12em', marginBottom:6 }}>// FULL_NAME</div>
                <input value={name} onChange={e=>setName(e.target.value)} style={inp}
                  onFocus={e=>e.currentTarget.style.borderColor='#FBFF48'} onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'} />
              </div>
              <div>
                <div style={{ fontFamily:mono, fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:'0.12em', marginBottom:6 }}>// EMAIL</div>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} style={inp}
                  onFocus={e=>e.currentTarget.style.borderColor='#FBFF48'} onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'} />
              </div>
              <motion.button onClick={saveProfile} disabled={saving} whileHover={{ opacity:0.85 }} whileTap={{ scale:0.97 }}
                style={{ background:'#FBFF48', color:'#000', border:'none', padding:'12px', fontFamily:mono, fontSize:11, fontWeight:700, letterSpacing:'0.1em', opacity:saving?0.6:1, cursor:'pointer', marginTop:8 }}>
                {saving ? 'SAVING...' : 'SAVE_PROFILE →'}
              </motion.button>
            </div>
          )}

          {/* PASSWORD */}
          {tab === 'password' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16, maxWidth:440 }}>
              {[['CURRENT_PASSWORD',currentPw,setCurrentPw],['NEW_PASSWORD',newPw,setNewPw],['CONFIRM_PASSWORD',confirmPw,setConfirmPw]].map(([label, val, setter]) => (
                <div key={label as string}>
                  <div style={{ fontFamily:mono, fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:'0.12em', marginBottom:6 }}>// {label}</div>
                  <input type="password" value={val as string} onChange={e=>(setter as any)(e.target.value)} style={inp}
                    onFocus={e=>e.currentTarget.style.borderColor='#FBFF48'} onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'} />
                </div>
              ))}
              <motion.button onClick={changePassword} disabled={changingPw} whileHover={{ opacity:0.85 }} whileTap={{ scale:0.97 }}
                style={{ background:'#FF3B3B', color:'#fff', border:'none', padding:'12px', fontFamily:mono, fontSize:11, fontWeight:700, letterSpacing:'0.1em', opacity:changingPw?0.6:1, cursor:'pointer', marginTop:8 }}>
                {changingPw ? 'CHANGING...' : 'CHANGE_PASSWORD →'}
              </motion.button>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  )
}
