'use client';

import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  itemTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteModal({ isOpen, itemTitle, onConfirm, onCancel }: DeleteModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={onCancel}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          padding: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(244, 63, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={22} color="#f43f5e" />
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
              Elimina elemento
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Sei sicuro di voler eliminare definitivamente questo elemento?
            </p>
            <p
              style={{
                fontSize: '0.85rem',
                color: '#f8fafc',
                fontWeight: 600,
                marginTop: '6px',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              &quot;{itemTitle}&quot;
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            style={{ padding: '8px 16px' }}
          >
            Annulla
          </button>

          <button
            type="button"
            onClick={onConfirm}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#e11d48',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#be123c')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#e11d48')}
          >
            <Trash2 size={15} />
            <span>Elimina definitivamente</span>
          </button>
        </div>
      </div>
    </div>
  );
}
