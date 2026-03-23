'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { apiRevision, apiGetNotes, apiGetNote } from '@/lib/api'

const mono = "'Space Mono','Courier New',monospace"
const ibm  = "'IBM Plex Mono','Courier New',monospace"
const PALETTE = ['#FBFF48','#4ADE80','#60A5FA','#FF3B3B','#A78BFA','#F97316','#06B6D4']
const sourceIcon = (t: string) => t==='pdf'?'PDF':t==='image'?'IMG':t==='voice'?'MIC':t==='youtube'?'YT':'TXT'

interface MNode { label: string; children?: MNode[] }
interface MMap  { root: string; children: MNode[] }

function Node({ node, depth = 0, color = '#FBFF48' }: { node: MNode; depth?: number; color?: string }) {
  const [open, setOpen] = useState(true)
  const hasKids = (node.children?.length ?? 0) > 0
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0' }}>
        {hasKids
          ? <button onClick={() => setOpen(o => !o)} style={{ fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', width: 16, flexShrink: 0 }}>{open ? '▼' : '▶'}</button>
          : <span style={{ width: 16, flexShrink: 0, fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>·</span>
        }
        <span style={{ fontFamily: ibm, fontSize: depth===0 ? 13 : 12, fontWeight: depth===0 ? 600 : 400, padding: '3px 12px', border: `1px solid ${color}40`, color, background: `${color}08`, opacity: Math.max(0.5, 1-depth*0.15) }}>
          {node.label}
        </span>
      </div>
      <AnimatePresence>
        {open && hasKids && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
            style={{ marginLeft: 24, borderLeft: `1px solid ${color}30`, paddingLeft: 12, overflow:'hidden' }}>
            {node.children!.map((child, i) => <Node key={i} node={child} depth={depth+1} color={color} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function MindMap({ preloadContent = '' }: { preloadContent?: string }) {
  const [text, setText]       = useState(preloadContent)
  const [map, setMap]         = useState<MMap | null>(null)
  const [loading, setLoading] = useState(false)
  const [notes, setNotes]     = useState<any[]>([])
  const [selectedNote, setSelectedNote] = useState('')
  const [loadedFrom, setLoadedFrom]     = useState('')

  useEffect(() => { if (preloadContent) { setText(preloadContent); setSelectedNote(''); setLoadedFrom('') } }, [preloadContent])
  useEffect(() => { apiGetNotes().then((d: any) => setNotes(d.notes || [])).catch(() => {}) }, [])

  const loadFromNote = async (noteId: string) => {
    if (!noteId) { setText(''); setSelectedNote(''); setLoadedFrom(''); return }
    setSelectedNote(noteId)
    try { const d = await apiGetNote(noteId); setText(d.content || ''); setLoadedFrom(`${sourceIcon(d.sourceType)} ${d.title}`); toast.success(`Loaded: ${d.title}`) }
    catch { toast.error('Could not load note') }
  }

  const generate = async () => {
    if (!text.trim()) { toast.error('Paste notes or load a saved note'); return }
    setLoading(true)
    try { const d = await apiRevision(text, 'mindmap'); setMap(d.result); toast.success('Mind map generated!') }
    catch { toast.error('Generation failed') }
    finally { setLoading(false) }
  }

  const sel: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.12)', padding: '10px 14px', color: '#fff', fontFamily: ibm, fontSize: 12, outline: 'none' }

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: mono, fontSize: 10, color: '#60A5FA', letterSpacing: '0.15em', marginBottom: 6 }}>// REVISION_TOOLS</div>
        <h2 style={{ fontFamily: mono, fontSize: 22, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          MIND<span style={{ color: '#60A5FA' }}>_MAP</span>
        </h2>
        <p style={{ fontFamily: ibm, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>AI generates a visual topic map from your notes.</p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', marginBottom: 6 }}>// LOAD_FROM_NOTE</div>
        <select value={selectedNote} onChange={e => loadFromNote(e.target.value)} style={sel}>
          <option value="">— Select a saved note —</option>
          {notes.map(n => <option key={n._id} value={n._id}>{sourceIcon(n.sourceType)} {n.title} · {n.subject}</option>)}
        </select>
        {loadedFrom && <div style={{ fontFamily: ibm, fontSize: 11, color: '#60A5FA', marginTop: 6 }}>● Loaded: {loadedFrom}</div>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        <span style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>OR PASTE MANUALLY</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
      </div>

      <textarea value={text} onChange={e => { setText(e.target.value); setSelectedNote(''); setLoadedFrom('') }}
        placeholder="Paste your notes here…"
        style={{ ...sel, height: 120, resize: 'none', display: 'block', marginBottom: 16, lineHeight: 1.7 }}
        onFocus={e => e.currentTarget.style.borderColor = '#60A5FA'}
        onBlur={e  => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
      />

      <motion.button onClick={generate} disabled={loading || !text.trim()} whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.97 }}
        style={{ width: '100%', background: '#60A5FA', color: '#000', border: 'none', padding: '13px', fontFamily: mono, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', opacity: (loading||!text.trim()) ? 0.5 : 1, marginBottom: 24, cursor: 'pointer' }}>
        {loading ? 'BUILDING MAP...' : 'GENERATE_MIND_MAP →'}
      </motion.button>

      <AnimatePresence>
        {map && (
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            style={{ border: '1px solid rgba(255,255,255,0.1)', padding: 24, background: '#0d0d0d' }}>
            {/* Root node */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 700, padding: '8px 20px', background: '#FBFF48', color: '#000' }}>
                {map.root}
              </div>
              <button onClick={() => setMap(null)} style={{ fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.08em', transition: 'color 0.18s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
                ↻ RESET
              </button>
            </div>
            <div style={{ borderLeft: '1px solid rgba(251,255,72,0.2)', paddingLeft: 16 }}>
              {map.children?.map((child, i) => (
                <Node key={i} node={child} depth={0} color={PALETTE[i % PALETTE.length]} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
