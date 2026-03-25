'use client'
import { useState, useEffect, useCallback } from 'react'
import { useTheme, mono, ibm } from '@/lib/useTheme'
import Cookies from 'js-cookie'

const API = 'https://notenexus-backend-y20v.onrender.com'

const COMMAND_SECTIONS = [
  {
    id: 'notes',
    label: '// NOTES_&_SAVED_COMMANDS',
    color: '#79c0ff',
    badge: 'requires linked account',
    commands: [
      { cmd: 'notes',                 desc: 'List your 20 most recent notes' },
      { cmd: 'notes: Biology',        desc: 'Filter notes by subject name' },
      { cmd: 'saved',                 desc: 'List all saved items (flashcards, plans, mind maps, exam questions…)' },
      { cmd: 'saved: flashcards',     desc: 'Filter by type — flashcards / examquestions / mindmap / studyplan / quiz' },
      { cmd: '1  (or any number)',    desc: 'View item #1 from the last list — works for notes and saved items' },
    ],
  },
  {
    id: 'reminders',
    label: '// REMINDER_COMMANDS',
    color: '#c678dd',
    badge: 'requires linked account',
    commands: [
      { cmd: 'remind me: Calculus | Maths | today 18:00',              desc: 'One-shot reminder — fires once today at that time' },
      { cmd: 'remind me: Cell bio | Biology | every 3 days 09:00',     desc: 'Repeating reminder every N days at a set time' },
      { cmd: 'remind me: Vocab | English | every 30 minutes',          desc: 'Sprint mode — fires every N minutes' },
      { cmd: 'remind me: Past papers | Physics | on 2026-05-01 08:00', desc: 'One-shot on a specific future date' },
      { cmd: 'reminders',                                               desc: 'List all your active reminders (numbered)' },
      { cmd: 'cancel reminder 2',                                       desc: 'Cancel reminder #2 from the list' },
    ],
  },
  {
    id: 'ai',
    label: '// AI_COMMANDS',
    color: '#4ADE80',
    badge: 'no account needed',
    commands: [
      { cmd: 'summary: <your notes>',   desc: 'Get a 5-bullet summary of any text' },
      { cmd: 'flashcard: <your notes>', desc: 'Generate 5 Q&A flashcard pairs' },
      { cmd: 'ask: <your question>',    desc: 'Get a direct answer in under 150 words' },
      { cmd: 'plan: <subjects>',        desc: 'Get a quick 3-day study plan' },
      { cmd: 'anything else',           desc: 'General study help from AI' },
    ],
  },
]

const STEPS = [
  { n: '01', title: 'CREATE_TWILIO_ACCOUNT',   detail: 'Go to twilio.com/try-twilio → Sign up free → Verify phone number' },
  { n: '02', title: 'ENABLE_WHATSAPP_SANDBOX', detail: 'Twilio Console → Messaging → Try it out → WhatsApp → Follow instructions to join sandbox' },
  { n: '03', title: 'ADD_ENV_VARS',            detail: 'TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886' },
  { n: '04', title: 'SET_WEBHOOK_URL',         detail: 'Twilio Console → WhatsApp Sandbox → "When a message comes in" → POST → your-backend.com/api/whatsapp/webhook' },
  { n: '05', title: 'INSTALL_TWILIO_PKG',      detail: 'In your backend folder: npm install twilio → commit & push to GitHub' },
]

function CountdownTimer({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    if (left <= 0) { onExpire(); return }
    const t = setTimeout(() => setLeft(l => l - 1), 1000)
    return () => clearTimeout(t)
  }, [left, onExpire])
  const pct   = (left / seconds) * 100
  const color = left < 60 ? '#f87171' : left < 120 ? '#FBFF48' : '#4ADE80'
  const mm    = String(Math.floor(left / 60)).padStart(2, '0')
  const ss    = String(left % 60).padStart(2, '0')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
      <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 1s linear, background 0.3s' }} />
      </div>
      <span style={{ fontFamily: mono, fontSize: 11, color, minWidth: 36 }}>{mm}:{ss}</span>
    </div>
  )
}

export default function WhatsAppBot() {
  const t = useTheme()
  const [status,        setStatus]        = useState<any>(null)
  const [linkStatus,    setLinkStatus]    = useState<any>(null)
  const [linkCode,      setLinkCode]      = useState<string | null>(null)
  const [codeLoading,   setCodeLoading]   = useState(false)
  const [unlinkLoading, setUnlinkLoading] = useState(false)
  const [copied,        setCopied]        = useState(false)
  const [openSection,   setOpenSection]   = useState<string | null>('notes')

  const token = Cookies.get('nn_token')

  const fetchStatus = useCallback(() => {
    fetch(`${API}/api/whatsapp/status`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setStatus).catch(() => {})
  }, [token])

  const fetchLinkStatus = useCallback(() => {
    if (!token) return
    fetch(`${API}/api/whatsapp/link-status`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setLinkStatus).catch(() => {})
  }, [token])

  useEffect(() => { fetchStatus(); fetchLinkStatus() }, [fetchStatus, fetchLinkStatus])

  async function generateCode() {
    setCodeLoading(true); setLinkCode(null)
    try {
      const r = await fetch(`${API}/api/whatsapp/generate-link-code`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      const d = await r.json()
      if (d.code) setLinkCode(d.code)
    } finally { setCodeLoading(false) }
  }

  async function unlink() {
    setUnlinkLoading(true)
    try {
      await fetch(`${API}/api/whatsapp/unlink`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      setLinkStatus({ linked: false, phone: null }); setLinkCode(null)
    } finally { setUnlinkLoading(false) }
  }

  function copyCode() {
    if (!linkCode) return
    navigator.clipboard.writeText(`link ${linkCode}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const card: React.CSSProperties = { background: t.bg3, border: `1px solid ${t.border}` }
  const btn:  React.CSSProperties = { fontFamily: mono, fontSize: 11, letterSpacing: '0.08em', fontWeight: 700, padding: '8px 16px', border: 'none', cursor: 'pointer' }

  return (
    <div style={{ maxWidth: 700 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: mono, fontSize: 10, color: '#4ADE80', letterSpacing: '0.15em', marginBottom: 6 }}>// CONNECT</div>
        <h2 style={{ fontFamily: mono, fontSize: 22, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.02em', color: t.fg, margin: 0 }}>
          WHATSAPP<span style={{ color: '#4ADE80' }}>_BOT</span>
        </h2>
        <p style={{ fontFamily: ibm, fontSize: 12, color: t.fgDim, marginTop: 6 }}>
          Access notes, saved items, reminders and AI study tools — all from WhatsApp.
        </p>
      </div>

      {/* Bot status */}
      <div style={{ border: `1px solid ${status?.configured ? 'rgba(74,222,128,0.3)' : 'rgba(251,255,72,0.2)'}`, padding: '12px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, background: status?.configured ? 'rgba(74,222,128,0.05)' : 'rgba(251,255,72,0.04)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: status?.configured ? '#4ADE80' : '#FBFF48', flexShrink: 0, boxShadow: status?.configured ? '0 0 8px #4ADE80' : '0 0 8px #FBFF48' }} />
        <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: status?.configured ? '#4ADE80' : '#FBFF48' }}>
          {status?.configured ? 'BOT_STATUS: LIVE' : 'BOT_STATUS: SETUP_REQUIRED'}
        </span>
        {status?.configured && (
          <span style={{ fontFamily: mono, fontSize: 10, color: t.fgDim, marginLeft: 'auto' }}>+1 415 523 8886</span>
        )}
      </div>

      {/* Setup guide — only if not configured */}
      {!status?.configured && (
        <div style={{ ...card, marginBottom: 24 }}>
          <div style={{ padding: '12px 18px', borderBottom: `1px solid ${t.border}` }}>
            <span style={{ fontFamily: mono, fontSize: 10, color: t.accent, letterSpacing: '0.12em', fontWeight: 700 }}>// SETUP_GUIDE (~10 min, free)</span>
          </div>
          {STEPS.map(({ n, title, detail }) => (
            <div key={n} style={{ display: 'flex', gap: 16, padding: '12px 18px', borderBottom: `1px solid ${t.border}` }}>
              <div style={{ fontFamily: mono, fontSize: 10, color: t.accent, flexShrink: 0, width: 24, paddingTop: 2 }}>{n}</div>
              <div>
                <div style={{ fontFamily: mono, fontSize: 11, color: t.fg, fontWeight: 700, marginBottom: 3 }}>{title}</div>
                <div style={{ fontFamily: ibm, fontSize: 12, color: t.fgDim, lineHeight: 1.6 }}>{detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Account link panel */}
      <div style={{ ...card, marginBottom: 24 }}>
        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: mono, fontSize: 10, color: t.accent, letterSpacing: '0.12em', fontWeight: 700 }}>// ACCOUNT_LINK</span>
          {linkStatus?.linked && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 6px #4ADE80' }} />
              <span style={{ fontFamily: mono, fontSize: 10, color: '#4ADE80', letterSpacing: '0.1em' }}>LINKED</span>
            </div>
          )}
        </div>
        <div style={{ padding: 18 }}>
          {linkStatus?.linked ? (
            <div>
              <div style={{ fontFamily: ibm, fontSize: 13, color: t.fg, marginBottom: 4 }}>
                Linked to <strong>{linkStatus.phone}</strong>
              </div>
              <div style={{ fontFamily: ibm, fontSize: 12, color: t.fgDim, marginBottom: 16, lineHeight: 1.6 }}>
                Your account is connected. All commands below are available from WhatsApp.
              </div>
              <button style={{ ...btn, background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }} onClick={unlink} disabled={unlinkLoading}>
                {unlinkLoading ? 'UNLINKING...' : 'UNLINK_ACCOUNT'}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontFamily: ibm, fontSize: 13, color: t.fgDim, marginBottom: 14, lineHeight: 1.6 }}>
                Link your WhatsApp to use notes, saved items and reminders commands. Code expires in 10 minutes.
              </div>
              <div style={{ fontFamily: ibm, fontSize: 12, color: t.fgDim, lineHeight: 2, marginBottom: 18 }}>
                1. Click <em>Generate Link Code</em> below<br />
                2. Open WhatsApp → message <strong>+1 415 523 8886</strong><br />
                3. Send: <code style={{ fontFamily: mono, color: '#4ADE80', background: 'rgba(74,222,128,0.08)', padding: '1px 6px' }}>link {'<'}CODE{'>'}</code>
              </div>
              {linkCode ? (
                <div>
                  <div style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', padding: '16px 18px', marginBottom: 12 }}>
                    <div style={{ fontFamily: mono, fontSize: 10, color: t.fgDim, letterSpacing: '0.12em', marginBottom: 8 }}>YOUR_LINK_CODE</div>
                    <div style={{ fontFamily: mono, fontSize: 28, fontWeight: 700, color: '#4ADE80', letterSpacing: '0.25em' }}>{linkCode}</div>
                    <CountdownTimer seconds={600} onExpire={() => setLinkCode(null)} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button style={{ ...btn, background: '#4ADE80', color: '#0a0a0a' }} onClick={copyCode}>
                      {copied ? '✓ COPIED!' : `COPY  link ${linkCode}`}
                    </button>
                    <button style={{ ...btn, background: 'transparent', color: t.fgDim, border: `1px solid ${t.border}` }} onClick={generateCode} disabled={codeLoading}>
                      REGENERATE
                    </button>
                  </div>
                </div>
              ) : (
                <button style={{ ...btn, background: '#4ADE80', color: '#0a0a0a' }} onClick={generateCode} disabled={codeLoading}>
                  {codeLoading ? 'GENERATING...' : '⚡ GENERATE_LINK_CODE'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Command sections — accordion */}
      <div style={{ fontFamily: mono, fontSize: 10, color: t.fgDim, letterSpacing: '0.12em', marginBottom: 12 }}>// ALL_COMMANDS</div>
      {COMMAND_SECTIONS.map(section => {
        const open = openSection === section.id
        return (
          <div key={section.id} style={{ ...card, marginBottom: 10 }}>
            <div
              onClick={() => setOpenSection(open ? null : section.id)}
              style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', gap: 8 } as any}>
                <span style={{ fontFamily: mono, fontSize: 10, color: section.color, letterSpacing: '0.12em', fontWeight: 700 }}>{section.label}</span>
                <span style={{ fontFamily: mono, fontSize: 9, color: t.fgDim, background: t.bg, border: `1px solid ${t.border}`, padding: '2px 8px', letterSpacing: '0.06em' }}>{section.badge}</span>
              </div>
              <span style={{ fontFamily: mono, fontSize: 11, color: t.fgDim, marginLeft: 12 }}>{open ? '▲' : '▼'}</span>
            </div>

            {open && (
              <div style={{ borderTop: `1px solid ${t.border}` }}>
                {section.commands.map((c, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', padding: '12px 18px', borderBottom: i < section.commands.length - 1 ? `1px solid ${t.border}` : 'none', gap: 4 }}>
                    <code style={{ fontFamily: mono, fontSize: 11, color: section.color, wordBreak: 'break-all', lineHeight: 1.5 }}>{c.cmd}</code>
                    <span style={{ fontFamily: ibm, fontSize: 12, color: t.fgDim, lineHeight: 1.5 }}>{c.desc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Webhook URL */}
      {status?.webhookUrl && (
        <div style={{ ...card, padding: '12px 18px', marginTop: 12 }}>
          <div style={{ fontFamily: mono, fontSize: 9, color: t.fgDim, letterSpacing: '0.12em', marginBottom: 6 }}>// WEBHOOK_URL</div>
          <code style={{ fontFamily: mono, fontSize: 11, color: t.accent, wordBreak: 'break-all' }}>{status.webhookUrl}</code>
        </div>
      )}

    </div>
  )
}
