'use client'
import { useState, useEffect, useCallback } from 'react'
import { useTheme, mono, ibm } from '@/lib/useTheme'
import Cookies from 'js-cookie'

const API = 'https://notenexus-backend-y20v.onrender.com'

const AI_COMMANDS = [
  { cmd: 'summary: <your notes>',   desc: 'Get a 5-bullet summary of any text' },
  { cmd: 'flashcard: <your notes>', desc: 'Generate 5 Q&A flashcard pairs' },
  { cmd: 'ask: <your question>',    desc: 'Get a direct answer to any study question' },
  { cmd: 'plan: <subjects>',        desc: 'Get a quick 3-day study plan' },
]

const DATA_COMMANDS = [
  { cmd: 'notes',                   desc: 'List all your saved notes (up to 20)' },
  { cmd: 'notes: <subject>',        desc: 'Filter notes by subject (e.g. notes: Biology)' },
  { cmd: 'saved',                   desc: 'List all your saved items (flashcards, plans…)' },
  { cmd: 'saved: flashcards',       desc: 'Filter saved items by type' },
  { cmd: '1  (or any number)',       desc: 'View a specific note or item from the last list' },
]

const STEPS = [
  { n: '01', title: 'CREATE_TWILIO_ACCOUNT',   detail: 'Go to twilio.com/try-twilio → Sign up free → Verify phone number' },
  { n: '02', title: 'ENABLE_WHATSAPP_SANDBOX', detail: 'Twilio Console → Messaging → Try it out → WhatsApp → Follow instructions' },
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

  const pct = (left / seconds) * 100
  const color = left < 60 ? '#f87171' : left < 120 ? '#FBFF48' : '#4ADE80'
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')

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
  const [status, setStatus]       = useState<any>(null)
  const [linkStatus, setLinkStatus] = useState<any>(null)
  const [linkCode, setLinkCode]   = useState<string | null>(null)
  const [codeLoading, setCodeLoading] = useState(false)
  const [unlinkLoading, setUnlinkLoading] = useState(false)
  const [copied, setCopied]       = useState(false)

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

  useEffect(() => {
    fetchStatus()
    fetchLinkStatus()
  }, [fetchStatus, fetchLinkStatus])

  async function generateCode() {
    setCodeLoading(true)
    setLinkCode(null)
    try {
      const r = await fetch(`${API}/api/whatsapp/generate-link-code`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const d = await r.json()
      if (d.code) setLinkCode(d.code)
    } finally {
      setCodeLoading(false)
    }
  }

  async function unlink() {
    setUnlinkLoading(true)
    try {
      await fetch(`${API}/api/whatsapp/unlink`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setLinkStatus({ linked: false, phone: null })
      setLinkCode(null)
    } finally {
      setUnlinkLoading(false)
    }
  }

  function copyCode() {
    if (!linkCode) return
    navigator.clipboard.writeText(`link ${linkCode}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const codeBlock: React.CSSProperties = {
    background: t.bg3,
    border: `1px solid ${t.border}`,
    color: t.fg,
  }

  const btn: React.CSSProperties = {
    fontFamily: mono,
    fontSize: 11,
    letterSpacing: '0.08em',
    fontWeight: 700,
    padding: '8px 16px',
    border: 'none',
    cursor: 'pointer',
  }

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: mono, fontSize: 10, color: '#4ADE80', letterSpacing: '0.15em', marginBottom: 6 }}>// CONNECT</div>
        <h2 style={{ fontFamily: mono, fontSize: 22, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.02em', color: t.fg }}>
          WHATSAPP<span style={{ color: '#4ADE80' }}>_BOT</span>
        </h2>
        <p style={{ fontFamily: ibm, fontSize: 12, color: t.fgDim, marginTop: 4 }}>
          Study help + access your notes & saved items — all on WhatsApp.
        </p>
      </div>

      {/* Bot status indicator */}
      <div style={{ border: `1px solid ${status?.configured ? 'rgba(74,222,128,0.3)' : 'rgba(251,255,72,0.2)'}`, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, background: status?.configured ? 'rgba(74,222,128,0.05)' : 'rgba(251,255,72,0.04)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: status?.configured ? '#4ADE80' : '#FBFF48', flexShrink: 0, boxShadow: status?.configured ? '0 0 8px #4ADE80' : '0 0 8px #FBFF48' }} />
        <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: status?.configured ? '#4ADE80' : '#FBFF48' }}>
          {status?.configured ? 'BOT_STATUS: LIVE' : 'BOT_STATUS: SETUP_REQUIRED'}
        </span>
      </div>

      {/* Setup guide (only if not configured) */}
      {!status?.configured && (
        <div style={{ ...codeBlock, marginBottom: 28 }}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.borderSub}` }}>
            <div style={{ fontFamily: mono, fontSize: 10, color: t.accent, letterSpacing: '0.12em', fontWeight: 700 }}>// SETUP_GUIDE (~10 min, free)</div>
          </div>
          <div style={{ padding: '4px 0' }}>
            {STEPS.map(({ n, title, detail }) => (
              <div key={n} style={{ display: 'flex', gap: 16, padding: '14px 18px', borderBottom: `1px solid ${t.borderSub}` }}>
                <div style={{ fontFamily: mono, fontSize: 10, color: t.accent, flexShrink: 0, width: 24, paddingTop: 2, letterSpacing: '0.06em' }}>{n}</div>
                <div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: t.fg, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4 }}>{title}</div>
                  <div style={{ fontFamily: ibm, fontSize: 12, color: t.fgDim, lineHeight: 1.6 }}>{detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Account Linking Panel ─────────────────────────────────────────── */}
      <div style={{ ...codeBlock, marginBottom: 24 }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.borderSub}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: t.accent, letterSpacing: '0.12em', fontWeight: 700 }}>// ACCOUNT_LINK</div>
          {linkStatus?.linked && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 6px #4ADE80' }} />
              <span style={{ fontFamily: mono, fontSize: 10, color: '#4ADE80', letterSpacing: '0.1em' }}>LINKED</span>
            </div>
          )}
        </div>

        <div style={{ padding: '18px' }}>
          {linkStatus?.linked ? (
            /* Already linked */
            <div>
              <div style={{ fontFamily: ibm, fontSize: 13, color: t.fg, marginBottom: 4 }}>
                Your account is linked to <strong>{linkStatus.phone}</strong>
              </div>
              <div style={{ fontFamily: mono, fontSize: 11, color: t.fgDim, marginBottom: 16 }}>
                You can now send <code style={{ color: '#4ADE80' }}>notes</code> or <code style={{ color: '#4ADE80' }}>saved</code> on WhatsApp to retrieve your data.
              </div>
              <button
                style={{ ...btn, background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}
                onClick={unlink}
                disabled={unlinkLoading}
              >
                {unlinkLoading ? 'UNLINKING...' : 'UNLINK_ACCOUNT'}
              </button>
            </div>
          ) : (
            /* Not linked */
            <div>
              <div style={{ fontFamily: ibm, fontSize: 13, color: t.fgDim, marginBottom: 16, lineHeight: 1.6 }}>
                Link your WhatsApp to access your notes and saved items from your phone. The code expires in 10 minutes.
              </div>
              <div style={{ fontFamily: mono, fontSize: 10, color: t.fgDim, letterSpacing: '0.1em', marginBottom: 10 }}>STEPS:</div>
              <div style={{ fontFamily: ibm, fontSize: 12, color: t.fgDim, lineHeight: 2, marginBottom: 18 }}>
                1. Click <em>Generate Link Code</em> below<br />
                2. Open WhatsApp and message the NoteNexus bot<br />
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
                      {copied ? '✓ COPIED!' : 'COPY  link ' + linkCode}
                    </button>
                    <button style={{ ...btn, background: 'transparent', color: t.fgDim, border: `1px solid ${t.border}` }} onClick={generateCode} disabled={codeLoading}>
                      REGENERATE
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  style={{ ...btn, background: '#4ADE80', color: '#0a0a0a' }}
                  onClick={generateCode}
                  disabled={codeLoading}
                >
                  {codeLoading ? 'GENERATING...' : '⚡ GENERATE_LINK_CODE'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Commands ─────────────────────────────────────────────────────── */}
      <div style={{ ...codeBlock, marginBottom: 24 }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.borderSub}` }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: t.fgDim, letterSpacing: '0.12em' }}>// YOUR_DATA_COMMANDS (requires linked account)</div>
        </div>
        {DATA_COMMANDS.map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '13px 18px', borderBottom: i < DATA_COMMANDS.length - 1 ? `1px solid ${t.borderSub}` : 'none', alignItems: 'flex-start' }}>
            <code style={{ fontFamily: mono, fontSize: 11, color: '#4ADE80', flexShrink: 0, letterSpacing: '0.04em', paddingTop: 1, minWidth: 160 }}>{c.cmd}</code>
            <span style={{ fontFamily: ibm, fontSize: 12, color: t.fgDim }}>{c.desc}</span>
          </div>
        ))}
      </div>

      <div style={{ ...codeBlock, marginBottom: 24 }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.borderSub}` }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: t.fgDim, letterSpacing: '0.12em' }}>// AI_COMMANDS (no account needed)</div>
        </div>
        {AI_COMMANDS.map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '13px 18px', borderBottom: i < AI_COMMANDS.length - 1 ? `1px solid ${t.borderSub}` : 'none', alignItems: 'flex-start' }}>
            <code style={{ fontFamily: mono, fontSize: 11, color: t.accent, flexShrink: 0, letterSpacing: '0.04em', paddingTop: 1, minWidth: 160 }}>{c.cmd}</code>
            <span style={{ fontFamily: ibm, fontSize: 12, color: t.fgDim }}>{c.desc}</span>
          </div>
        ))}
      </div>

      {/* Webhook URL */}
      {status?.webhookUrl && (
        <div style={{ ...codeBlock, padding: '14px 18px' }}>
          <div style={{ fontFamily: mono, fontSize: 9, color: t.fgDim, letterSpacing: '0.12em', marginBottom: 8 }}>// WEBHOOK_URL</div>
          <code style={{ fontFamily: mono, fontSize: 12, color: t.accent, wordBreak: 'break-all' }}>{status.webhookUrl}</code>
        </div>
      )}
    </div>
  )
}
