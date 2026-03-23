'use client'
import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import UploadNote        from '@/components/notes/UploadNote'
import NotesList         from '@/components/notes/NotesList'
import SearchBar         from '@/components/notes/SearchBar'
import Flashcards        from '@/components/revision/Flashcards'
import MindMap           from '@/components/revision/MindMap'
import ClassHub          from '@/components/notes/ClassHub'
import Profile           from '@/components/profile/Profile'
import { useSocket }     from '@/hooks/useSocket'
import ExamPredictor     from '@/components/ExamPredictor'
import StudyPlanner      from '@/components/StudyPlanner'
import AiTutor           from '@/components/AiTutor'
import RevisionReminders from '@/components/RevisionReminders'
import WhatsAppBot       from '@/components/WhatsAppBot'

const mono = "'Space Mono','Courier New',monospace"
const ibm  = "'IBM Plex Mono','Courier New',monospace"

const TABS = [
  { id: 'upload',     label: 'UPLOAD',       tag: 'notes'    },
  { id: 'notes',      label: 'MY_NOTES',     tag: 'notes'    },
  { id: 'search',     label: 'SEARCH',       tag: 'notes'    },
  { id: 'flashcards', label: 'FLASHCARDS',   tag: 'revision' },
  { id: 'mindmap',    label: 'MIND_MAP',     tag: 'revision' },
  { id: 'class',      label: 'CLASS_HUB',    tag: 'collab'   },
  { id: 'tutor',      label: 'AI_TUTOR',     tag: 'ai'       },
  { id: 'exam',       label: 'EXAM_PRED',    tag: 'ai'       },
  { id: 'planner',    label: 'STUDY_PLAN',   tag: 'ai'       },
  { id: 'reminders',  label: 'REMINDERS',    tag: 'ai'       },
  { id: 'whatsapp',   label: 'WHATSAPP',     tag: 'connect'  },
  { id: 'profile',    label: 'PROFILE',      tag: 'account'  },
]

const TAG_COLORS: Record<string, string> = {
  notes:    '#FBFF48',
  revision: '#4ADE80',
  collab:   '#60A5FA',
  ai:       '#FF3B3B',
  connect:  '#A78BFA',
  account:  'rgba(255,255,255,0.4)',
}

export default function DashboardPage() {
  const [tab, setTab] = useState('upload')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const socket = useSocket()
  const [activeNote, setActiveNote] = useState<{ content: string; subject: string; title: string } | null>(null)

  useEffect(() => {
    if (!socket) return
    socket.on('shared-note-alert', ({ title, sharedBy }: any) => {
      toast(`${sharedBy} shared: "${title}"`, { duration: 4000 })
    })
    return () => { socket.off('shared-note-alert') }
  }, [socket])

  const handleLogout = () => {
    logout()
    router.push('/')
    toast.success('Signed out')
  }

  const handleSendToAI = useCallback((targetTab: string, note: any) => {
    setActiveNote({
      content: note.content || note.rawText || note.summary || '',
      subject: note.subject || '',
      title:   note.title   || '',
    })
    setTab(targetTab)
  }, [])

  const currentTab = TABS.find(t => t.id === tab)!

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #0a0a0a; color: #fff; font-family: ${ibm}; }
        ::selection { background: #FBFF48; color: #000; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); }
        input, textarea, select { font-family: ${ibm} !important; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0a0a0a' }}>

        {/* ── SIDEBAR ── */}
        <aside style={{
          width: sidebarOpen ? 220 : 56,
          background: '#0d0d0d',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', flexDirection: 'column',
          transition: 'width 0.25s ease',
          flexShrink: 0, overflow: 'hidden',
        }}>

          {/* Logo row */}
          <div style={{ padding: '18px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden' }}>
              {sidebarOpen ? <>NN<span style={{ color: '#FBFF48' }}>.exe</span></> : <span style={{ color: '#FBFF48' }}>N</span>}
            </span>
            <button
              onClick={() => setSidebarOpen(o => !o)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontFamily: mono, fontSize: 12, padding: '2px 4px', flexShrink: 0 }}
            >
              {sidebarOpen ? '←' : '→'}
            </button>
          </div>

          {/* Nav items grouped by tag */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
            {TABS.map(t => {
              const isActive = tab === t.id
              const color = TAG_COLORS[t.tag]
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  title={t.label}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', marginBottom: 2,
                    background: isActive ? 'rgba(251,255,72,0.07)' : 'transparent',
                    border: isActive ? `1px solid rgba(251,255,72,0.2)` : '1px solid transparent',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                    fontFamily: mono, fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.08em', textAlign: 'left',
                    transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                    whiteSpace: 'nowrap', overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = '#fff' }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)' }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  {sidebarOpen && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.label}</span>}
                </button>
              )
            })}
          </nav>

          {/* User row */}
          <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {sidebarOpen && (
              <div style={{ padding: '8px 10px', marginBottom: 4 }}>
                <div style={{ fontFamily: mono, fontSize: 10, color: '#FBFF48', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name?.toUpperCase()}
                </div>
                <div style={{ fontFamily: ibm, fontSize: 10, color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email}
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px',
                background: 'transparent', border: '1px solid transparent',
                color: 'rgba(255,255,255,0.3)',
                fontFamily: mono, fontSize: 10, letterSpacing: '0.08em',
                transition: 'color 0.15s, border-color 0.15s',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#FF3B3B'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,59,59,0.2)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'; (e.currentTarget as HTMLElement).style.borderColor = 'transparent' }}
            >
              <span>⏻</span>
              {sidebarOpen && 'SIGN_OUT'}
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Top bar */}
          <div style={{
            background: 'rgba(10,10,10,0.95)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            padding: '0 24px', height: 52,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: mono, fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>{'>'}</span>
              <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em' }}>
                {currentTab.label}
              </span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: TAG_COLORS[currentTab.tag] }} />
              {activeNote && ['exam','planner','tutor','flashcards','mindmap'].includes(tab) && (
                <span style={{
                  fontFamily: ibm, fontSize: 10,
                  border: '1px solid rgba(251,255,72,0.25)',
                  color: '#FBFF48', padding: '3px 10px',
                  letterSpacing: '0.06em',
                }}>
                  {activeNote.title}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: ibm, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                {user?.name?.split(' ')[0].toUpperCase()}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 6px #4ADE80' }} />
                <span style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>LIVE</span>
              </div>
            </div>
          </div>

          {/* Content area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.16 }}
                >
                  {tab === 'upload'     && <UploadNote />}
                  {tab === 'notes'      && <NotesList onSendToAI={handleSendToAI} />}
                  {tab === 'search'     && <SearchBar />}
                  {tab === 'flashcards' && <Flashcards preloadContent={activeNote?.content} />}
                  {tab === 'mindmap'    && <MindMap preloadContent={activeNote?.content} />}
                  {tab === 'class'      && <ClassHub />}
                  {tab === 'profile'    && <Profile />}
                  {tab === 'exam'       && <ExamPredictor preloadContent={activeNote?.content || ''} preloadSubject={activeNote?.subject || ''} />}
                  {tab === 'planner'    && <StudyPlanner preloadSubject={activeNote?.subject || ''} />}
                  {tab === 'tutor'      && <AiTutor preloadSubject={activeNote?.subject || ''} />}
                  {tab === 'reminders'  && <RevisionReminders />}
                  {tab === 'whatsapp'   && <WhatsAppBot />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
