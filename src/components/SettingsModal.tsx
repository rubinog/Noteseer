'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, AlertCircle, Loader2, Save, Terminal, Server } from 'lucide-react';
import { AiSettings } from '@/lib/ai';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'ai' | 'docker'>('ai');
  const [settings, setSettings] = useState<AiSettings>({
    ai_provider: 'ollama',
    ollama_url: 'http://localhost:11434',
    ollama_model: 'llama3.2',
    openai_key: '',
    openai_base_url: 'https://api.openai.com/v1',
    openai_model: 'gpt-4o-mini',
    auto_ai_enrich: 'true',
  });

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/settings')
        .then((res) => res.json())
        .then((data) => {
          if (data.settings) setSettings(data.settings);
        })
        .catch(console.error);
      setTestResult(null);
      setSaveSuccess(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/settings/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ ok: false, message: err.message || 'Errore di rete' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 22px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeTab === 'ai' ? 'var(--accent-primary)' : 'transparent',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Sparkles size={15} />
              <span>Configurazione AI</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('docker')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeTab === 'docker' ? 'var(--accent-primary)' : 'transparent',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Server size={15} />
              <span>Info Muletto & Docker</span>
            </button>
          </div>

          <button onClick={onClose} className="btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'ai' ? (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Provider Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Provider Intelligenza Artificiale
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, ai_provider: 'ollama' })}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      background: settings.ai_provider === 'ollama' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      border: settings.ai_provider === 'ollama' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      color: '#ffffff',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '2px' }}>
                      🦙 Ollama (Locale)
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      100% privato sul tuo server/muletto
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, ai_provider: 'openai' })}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      background: settings.ai_provider === 'openai' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      border: settings.ai_provider === 'openai' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      color: '#ffffff',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '2px' }}>
                      ⚡ Cloud API (Groq/OpenAI)
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Ultra-veloce, zero consumo hardware
                    </div>
                  </button>
                </div>
              </div>

              {settings.ai_provider === 'ollama' ? (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Endpoint Ollama URL
                    </label>
                    <input
                      type="text"
                      value={settings.ollama_url}
                      onChange={(e) => setSettings({ ...settings, ollama_url: e.target.value })}
                      placeholder="http://localhost:11434 o http://host.docker.internal:11434"
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-card)',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 14px',
                        color: '#ffffff',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Suggerimento Docker: se Ollama gira sull&apos;host Linux, usa l&apos;IP locale o <code>http://host.docker.internal:11434</code>.
                    </p>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Nome Modello Ollama
                    </label>
                    <input
                      type="text"
                      value={settings.ollama_model}
                      onChange={(e) => setSettings({ ...settings, ollama_model: e.target.value })}
                      placeholder="llama3.2, mistral, gemma2, phi3..."
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-card)',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 14px',
                        color: '#ffffff',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Consigliati per muletto leggero: <code>llama3.2</code> (1B o 3B) oppure <code>phi3:mini</code>.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Base URL API (compatibile OpenAI / Groq / OpenRouter)
                    </label>
                    <input
                      type="text"
                      value={settings.openai_base_url}
                      onChange={(e) => setSettings({ ...settings, openai_base_url: e.target.value })}
                      placeholder="https://api.openai.com/v1 oppure https://api.groq.com/openai/v1"
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-card)',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 14px',
                        color: '#ffffff',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      API Key
                    </label>
                    <input
                      type="password"
                      value={settings.openai_key}
                      onChange={(e) => setSettings({ ...settings, openai_key: e.target.value })}
                      placeholder="gsk_... oppure sk-proj-..."
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-card)',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 14px',
                        color: '#ffffff',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Modello
                    </label>
                    <input
                      type="text"
                      value={settings.openai_model}
                      onChange={(e) => setSettings({ ...settings, openai_model: e.target.value })}
                      placeholder="gpt-4o-mini oppure llama-3.3-70b-versatile"
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-card)',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 14px',
                        color: '#ffffff',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </>
              )}

              {/* Auto Enrich Toggle */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#ffffff' }}>
                    Elaborazione automatica al salvataggio
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Genera istantaneamente riassunto e tag AI per ogni nuovo elemento aggiunto.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.auto_ai_enrich === 'true'}
                  onChange={(e) =>
                    setSettings({ ...settings, auto_ai_enrich: e.target.checked ? 'true' : 'false' })
                  }
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
              </div>

              {/* Test Result feedback banner */}
              {testResult && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: testResult.ok ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  border: `1px solid ${testResult.ok ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                  color: testResult.ok ? '#a7f3d0' : '#fecdd3',
                  fontSize: '0.825rem',
                }}>
                  {testResult.ok ? <CheckCircle2 size={16} color="#10b981" /> : <AlertCircle size={16} color="#f43f5e" />}
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="btn-secondary"
                >
                  {testing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  <span>Test Connessione</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {saveSuccess && (
                    <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={14} /> Salvato!
                    </span>
                  )}
                  <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    <span>Salva Modifiche</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
              }}>
                <h4 style={{ fontSize: '0.95rem', color: '#ffffff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Terminal size={16} color="var(--accent-primary)" />
                  Avvio rapido con Docker Compose
                </h4>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
                  Sul tuo muletto Linux, basta posizionare il file <code>docker-compose.yml</code> ed eseguire:
                </p>
                <pre style={{
                  background: '#04060a',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#38bdf8',
                  overflowX: 'auto',
                }}>
                  docker compose up -d
                </pre>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
              }}>
                <h4 style={{ fontSize: '0.95rem', color: '#ffffff', marginBottom: '6px' }}>
                  Persistenza dei Dati (Zero Perdita)
                </h4>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Il database SQLite e i file archiviati sono salvati nel volume locale <code>./data</code> (file <code>karakeep.db</code>). Puoi fare backup con un semplice comando di copia <code>cp ./data/karakeep.db /backup/</code> anche a caldo grazie alla modalità <strong>SQLite WAL</strong>.
                </p>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
              }}>
                <h4 style={{ fontSize: '0.95rem', color: '#ffffff', marginBottom: '6px' }}>
                  Integrazione con Ollama sul Muletto
                </h4>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Se Ollama è già installato direttamente sull&apos;host o in un altro container Docker, imposta l&apos;URL su <code>http://host.docker.internal:11434</code> (o l&apos;IP locale del server come <code>http://192.168.1.xxx:11434</code>) e ricordati di avviare Ollama con la variabile <code>OLLAMA_HOST=0.0.0.0</code> per accettare connessioni dalla rete del container.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
