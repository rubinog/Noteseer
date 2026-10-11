'use client';

import React, { useEffect } from 'react';
import { Item } from '@/lib/db';
import { X, ExternalLink, Clock, Globe, Sparkles } from 'lucide-react';

interface ReaderModalProps {
  item: Item | null;
  onClose: () => void;
}

export function ReaderModal({ item, onClose }: ReaderModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const domain = item.url
    ? (() => {
        try {
          return new URL(item.url).hostname.replace(/^www\./, '');
        } catch {
          return item.url;
        }
      })()
    : null;

  // Calculate approximate read time
  const text = item.content || '';
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const readMinutes = Math.max(1, Math.round(wordCount / 200));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
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
          maxWidth: '840px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(0, 0, 0, 0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {domain && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
              }}>
                <Globe size={14} />
                {domain}
              </span>
            )}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}>
              <Clock size={14} />
              ~{readMinutes} min di lettura ({wordCount} parole)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                <ExternalLink size={14} />
                <span>Originale</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="btn-icon"
              style={{ width: '34px', height: '34px' }}
              aria-label="Chiudi reader"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Reader Body */}
        <div style={{
          padding: '36px 48px',
          overflowY: 'auto',
          flex: 1,
        }}>
          {/* Article Title */}
          <h1 style={{
            fontSize: '1.85rem',
            fontWeight: 800,
            lineHeight: 1.3,
            color: '#ffffff',
            marginBottom: '16px',
          }}>
            {item.title}
          </h1>

          {/* AI Summary Banner if present */}
          {item.summary && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              marginBottom: '28px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--accent-text, #a5b4fc)',
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px',
              }}>
                <Sparkles size={15} />
                Sintesi Intelligente AI
              </div>
              <p style={{ fontSize: '0.925rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                {item.summary}
              </p>
            </div>
          )}

          {/* Clean Readable Article Content */}
          {item.readable_html ? (
            <div
              className="article-content"
              dangerouslySetInnerHTML={{ __html: item.readable_html }}
            />
          ) : (
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#e2e8f0', fontSize: '1.05rem' }}>
              {item.content || item.description || 'Nessun contenuto estratto disponibile.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
