'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { apiSearch } from '@/lib/api'

const mono = "'Space Mono','Courier New',monospace"
const ibm  = "'IBM Plex Mono','Courier New',monospace"

const EXAMPLES = ["What are Newton's Laws?","Explain photosynthesis","Key dates in WW2","What is the quadratic formula?","Explain osmosis and diffusion"]
const SOURCE_LABELS: Record<string,string> = { pdf:'PDF', image:'IMG', youtube:'YT', voice:'MIC', whatsapp:'WA' }
const scoreColor = (s: number) => s > 0.85 ? '#4ADE80' : s > 0.70 ? '#FBFF48' : 'rgba(255,255,255,0.4)'

export default function SearchBar() {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)

  const search = async (q?: string) => {
    const qStr = q ?? query
    if (!qStr.trim()) return
    setQuery(qStr); setLoading(true); setDone(true)
    try { const data = await apiSearch(qStr); setResults(data.results || []) }
    catch { toast.error('Search failed') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: mono, fontSize: 10, color: '#FBFF48', letterSpacing: '0.15em', marginBottom: 6 }}>// SEARCH_ENGINE</div>
        <h2 style={{ fontFamily: mono, fontSize: 22, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          SEMANTIC<span style={{ color: '#FBFF48' }}>_SEARCH</span>
        </h2>
        <p style={{ fontFamily: ibm, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Ask anything in plain English — powered by vector search.</p>
      </div>

      {/* Search input */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="e.g. What did I note about osmosis?"
          style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.12)', padding: '11px 14px', color: '#fff', fontFamily: ibm, fontSize: 13, outline: 'none', transition: 'border-color 0.2s' }}
          onFocus={e => e.currentTarget.style.borderColor = '#FBFF48'}
          onBlur={e  => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
        />
        <motion.button whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.97 }}
          onClick={() => search()} disabled={loading || !query.trim()}
          style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', padding: '0 20px', background: '#FBFF48', color: '#000', border: 'none', cursor: 'pointer', opacity: (loading || !query.trim()) ? 0.4 : 1 }}>
          {loading ? '...' : 'SEARCH'}
        </motion.button>
      </div>

      {/* Example chips */}
      {!done && (
        <div>
          <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', marginBottom: 8 }}>// TRY_THESE</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {EXAMPLES.map(ex => (
              <button key={ex} onClick={() => search(ex)}
                style={{ fontFamily: ibm, fontSize: 11, padding: '5px 12px', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)', background: 'none', cursor: 'pointer', transition: 'all 0.18s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#FBFF48'; (e.currentTarget as HTMLElement).style.color = '#FBFF48' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)' }}>
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {done && !loading && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>
            <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', marginBottom: 12, marginTop: 24 }}>
              // {results.length} RESULT{results.length !== 1 ? 'S' : ''} FOR "{query.toUpperCase()}"
            </div>
            {results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontFamily: ibm, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>No matches — try uploading more notes first.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'rgba(255,255,255,0.04)' }}>
                {results.map((r, i) => (
                  <motion.div key={i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.04 }}
                    style={{ background: '#0d0d0d', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontFamily: mono, fontSize: 9, color: '#FBFF48', border: '1px solid rgba(251,255,72,0.3)', padding: '2px 7px', letterSpacing: '0.1em', flexShrink: 0 }}>
                      {SOURCE_LABELS[r.metadata?.sourceType] || 'TXT'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: ibm, fontSize: 13, color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.metadata?.title || 'Untitled'}</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {r.metadata?.subject && <span style={{ fontFamily: mono, fontSize: 9, color: '#60A5FA', border: '1px solid rgba(96,165,250,0.25)', padding: '1px 7px' }}>{r.metadata.subject}</span>}
                        {r.metadata?.chapter && <span style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)', padding: '1px 7px' }}>{r.metadata.chapter}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, color: scoreColor(r.score) }}>{(r.score * 100).toFixed(0)}%</span>
                      {r.metadata?.fileUrl?.startsWith('http') && (
                        <a href={r.metadata.fileUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>↗</a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
