'use client';
import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;
const mono = "'Space Mono','Courier New',monospace";
const ibm  = "'IBM Plex Mono','Courier New',monospace";

const COMMANDS = [
  { cmd: 'summary: <your notes>',  desc: 'Get a 5-bullet summary of any text' },
  { cmd: 'flashcard: <your notes>',desc: 'Generate 5 Q&A flashcard pairs' },
  { cmd: 'ask: <your question>',   desc: 'Get a direct answer to any study question' },
  { cmd: 'plan: <subjects>',       desc: 'Get a quick 3-day study plan' },
  { cmd: 'anything else',          desc: 'General study help from AI' },
];

const STEPS = [
  { n:'01', title:'CREATE_TWILIO_ACCOUNT', detail:'Go to twilio.com/try-twilio → Sign up free → Verify phone number' },
  { n:'02', title:'ENABLE_WHATSAPP_SANDBOX', detail:'Twilio Console → Messaging → Try it out → WhatsApp → Follow instructions' },
  { n:'03', title:'ADD_ENV_VARS', detail:'TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886' },
  { n:'04', title:'SET_WEBHOOK_URL', detail:'Twilio Console → WhatsApp Sandbox → "When a message comes in" → POST → your-backend.com/api/whatsapp/webhook' },
  { n:'05', title:'INSTALL_TWILIO_PKG', detail:'In your backend folder: npm install twilio → commit & push to GitHub' },
];

export default function WhatsAppBot() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API}/api/whatsapp/status`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setStatus).catch(() => {});
  }, []);

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: mono, fontSize: 10, color: '#4ADE80', letterSpacing: '0.15em', marginBottom: 6 }}>// CONNECT</div>
        <h2 style={{ fontFamily: mono, fontSize: 22, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          WHATSAPP<span style={{ color: '#4ADE80' }}>_BOT</span>
        </h2>
        <p style={{ fontFamily: ibm, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Study help delivered to your WhatsApp — powered by Gemini AI.</p>
      </div>

      {/* Status */}
      <div style={{ border: `1px solid ${status?.configured ? 'rgba(74,222,128,0.3)' : 'rgba(251,255,72,0.2)'}`, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, background: status?.configured ? 'rgba(74,222,128,0.05)' : 'rgba(251,255,72,0.04)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: status?.configured ? '#4ADE80' : '#FBFF48', flexShrink: 0, boxShadow: status?.configured ? '0 0 8px #4ADE80' : '0 0 8px #FBFF48' }} />
        <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: status?.configured ? '#4ADE80' : '#FBFF48' }}>
          {status?.configured ? 'BOT_STATUS: LIVE' : 'BOT_STATUS: SETUP_REQUIRED'}
        </span>
      </div>

      {/* Setup steps */}
      {!status?.configured && (
        <div style={{ border: '1px solid rgba(255,255,255,0.08)', marginBottom: 28, background: '#0d0d0d' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily: mono, fontSize: 10, color: '#FBFF48', letterSpacing: '0.12em', fontWeight: 700 }}>// SETUP_GUIDE (~10 min, free)</div>
          </div>
          <div style={{ padding: '4px 0' }}>
            {STEPS.map(({ n, title, detail }) => (
              <div key={n} style={{ display: 'flex', gap: 16, padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontFamily: mono, fontSize: 10, color: '#FBFF48', flexShrink: 0, width: 24, paddingTop: 2, letterSpacing: '0.06em' }}>{n}</div>
                <div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: '#fff', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4 }}>{title}</div>
                  <div style={{ fontFamily: ibm, fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Commands */}
      <div style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#0d0d0d', marginBottom: 24 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em' }}>// AVAILABLE_COMMANDS</div>
        </div>
        {COMMANDS.map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '13px 18px', borderBottom: i < COMMANDS.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'flex-start' }}>
            <code style={{ fontFamily: mono, fontSize: 11, color: '#4ADE80', flexShrink: 0, letterSpacing: '0.04em', paddingTop: 1 }}>{c.cmd}</code>
            <span style={{ fontFamily: ibm, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{c.desc}</span>
          </div>
        ))}
      </div>

      {/* Webhook URL */}
      {status?.webhookUrl && (
        <div style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '14px 18px', background: '#0d0d0d' }}>
          <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', marginBottom: 8 }}>// WEBHOOK_URL</div>
          <code style={{ fontFamily: mono, fontSize: 12, color: '#FBFF48', wordBreak: 'break-all' }}>{status.webhookUrl}</code>
        </div>
      )}
    </div>
  );
}
