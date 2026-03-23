'use client'
import { useDropzone, type Accept } from 'react-dropzone'
import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { apiUploadNote } from '@/lib/api'

const mono = "'Space Mono','Courier New',monospace"
const ibm  = "'IBM Plex Mono','Courier New',monospace"

const TYPES = [
  { value: 'pdf',     label: 'PDF',         accept: { 'application/pdf': ['.pdf'] } },
  { value: 'image',   label: 'IMAGE',       accept: { 'image/*': ['.jpg','.jpeg','.png','.webp'] } },
  { value: 'voice',   label: 'VOICE',       accept: { 'audio/*': ['.mp3','.wav','.m4a','.webm'] } },
  { value: 'youtube', label: 'YOUTUBE_URL', accept: {} },
]

const inp: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.12)',
  padding: '11px 14px', color: '#fff',
  fontFamily: ibm, fontSize: 13, outline: 'none',
  transition: 'border-color 0.2s',
}

export default function UploadNote() {
  const [type, setType]       = useState('pdf')
  const [file, setFile]       = useState<File | null>(null)
  const [ytUrl, setYtUrl]     = useState('')
  const [title, setTitle]     = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<any>(null)

  const curr = TYPES.find(t => t.value === type)!
  const onDrop = useCallback((files: File[]) => { if (files[0]) setFile(files[0]) }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: curr.accept as Accept, multiple: false })

  const handleUpload = async () => {
    if (type !== 'youtube' && !file) { toast.error('Select a file first'); return }
    if (type === 'youtube' && !ytUrl.trim()) { toast.error('Enter a YouTube URL'); return }
    setLoading(true); setResult(null)
    try {
      const form = new FormData()
      form.append('sourceType', type)
      if (title) form.append('title', title)
      if (file) form.append('file', file)
      if (ytUrl) form.append('youtubeUrl', ytUrl)
      const data = await apiUploadNote(form)
      setResult(data)
      toast.success('Note saved and organised!')
      setFile(null); setYtUrl(''); setTitle('')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Upload failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: mono, fontSize: 10, color: '#FBFF48', letterSpacing: '0.15em', marginBottom: 8 }}>// UPLOAD_MODULE</div>
        <h2 style={{ fontFamily: mono, fontSize: 22, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: 6 }}>Upload<span style={{ color: '#FBFF48' }}>_Note</span></h2>
        <p style={{ fontFamily: ibm, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>AI will auto-detect subject, chapter and keywords.</p>
      </div>

      {/* Type selector */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {TYPES.map(t => (
          <button key={t.value} onClick={() => { setType(t.value); setFile(null) }}
            style={{
              fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              padding: '7px 14px',
              background: type === t.value ? '#FBFF48' : 'transparent',
              color: type === t.value ? '#000' : 'rgba(255,255,255,0.4)',
              border: `1px solid ${type === t.value ? '#FBFF48' : 'rgba(255,255,255,0.12)'}`,
              transition: 'all 0.18s', cursor: 'pointer',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Title */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', marginBottom: 6 }}>// TITLE_OPTIONAL</div>
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="AI will generate one if left blank"
          style={inp}
          onFocus={e => e.currentTarget.style.borderColor = '#FBFF48'}
          onBlur={e  => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
        />
      </div>

      {/* File drop or YouTube */}
      {type === 'youtube' ? (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', marginBottom: 6 }}>// YOUTUBE_URL</div>
          <input value={ytUrl} onChange={e => setYtUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            style={inp}
            onFocus={e => e.currentTarget.style.borderColor = '#FBFF48'}
            onBlur={e  => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
          />
        </div>
      ) : (
        <div {...getRootProps()} style={{
          border: `1px dashed ${isDragActive ? '#FBFF48' : 'rgba(255,255,255,0.15)'}`,
          padding: '48px 24px', marginBottom: 16, textAlign: 'center',
          background: isDragActive ? 'rgba(251,255,72,0.04)' : 'rgba(255,255,255,0.02)',
          transition: 'all 0.2s', cursor: 'pointer',
          position: 'relative',
        }}>
          <input {...getInputProps()} />
          {file ? (
            <div>
              <div style={{ fontFamily: mono, fontSize: 11, color: '#4ADE80', letterSpacing: '0.1em', marginBottom: 4 }}>● FILE_SELECTED</div>
              <div style={{ fontFamily: ibm, fontSize: 13, color: '#fff' }}>{file.name}</div>
              <div style={{ fontFamily: ibm, fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{(file.size/1024).toFixed(0)} KB</div>
            </div>
          ) : (
            <div>
              <div style={{ fontFamily: mono, fontSize: 28, marginBottom: 12, color: 'rgba(255,255,255,0.2)' }}>+</div>
              <div style={{ fontFamily: ibm, fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                Drag & drop or <span style={{ color: '#FBFF48' }}>click to browse</span>
              </div>
              <div style={{ fontFamily: ibm, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                {type === 'pdf' ? '.PDF' : type === 'image' ? '.JPG .PNG .WEBP' : '.MP3 .WAV .M4A'}
              </div>
            </div>
          )}
        </div>
      )}

      <motion.button onClick={handleUpload} disabled={loading}
        whileHover={{ opacity: 0.88 }} whileTap={{ scale: 0.97 }}
        style={{
          width: '100%', background: '#FBFF48', color: '#000', border: 'none',
          padding: '13px', fontFamily: mono, fontSize: 12, fontWeight: 700,
          letterSpacing: '0.1em', opacity: loading ? 0.6 : 1,
        }}>
        {loading ? 'AI PROCESSING...' : 'UPLOAD & AUTO-ORGANISE →'}
      </motion.button>

      {/* Result */}
      {result && (
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
          style={{ marginTop: 24, border: '1px solid rgba(74,222,128,0.25)', padding: 20, background: 'rgba(74,222,128,0.04)' }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: '#4ADE80', letterSpacing: '0.15em', marginBottom: 16 }}>● NOTE_SAVED</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            {[['SUBJECT', result.subject, '#FBFF48'],['CHAPTER', result.chapter, '#60A5FA']].map(([l,v,c]) => (
              <div key={l as string} style={{ border: `1px solid ${c}30`, padding: '10px 14px', background: `${c}08` }}>
                <div style={{ fontFamily: mono, fontSize: 9, color: c as string, letterSpacing: '0.12em', marginBottom: 4 }}>{l}</div>
                <div style={{ fontFamily: ibm, fontSize: 13, color: '#fff' }}>{v}</div>
              </div>
            ))}
          </div>
          {result.keywords?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {result.keywords.map((k: string) => (
                <span key={k} style={{ fontFamily: ibm, fontSize: 11, padding: '3px 10px', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}>{k}</span>
              ))}
            </div>
          )}
          <div style={{ fontFamily: ibm, fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>{result.preview}…</div>
          <div style={{ fontFamily: ibm, fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>{result.wordCount} words extracted</div>
        </motion.div>
      )}
    </div>
  )
}
