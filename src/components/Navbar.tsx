'use client';

import React from 'react';
import { Bookmark, Sparkles, Plus, Settings, Search, LayoutGrid, List } from 'lucide-react';

interface NavbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onOpenAddModal: () => void;
  onOpenSettingsModal: () => void;
  viewMode: 'grid' | 'list';
  onToggleViewMode: () => void;
  totalCount: number;
}

export function Navbar({
  search,
  onSearchChange,
  onOpenAddModal,
  onOpenSettingsModal,
  viewMode,
  onToggleViewMode,
  totalCount,
}: NavbarProps) {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      background: 'rgba(7, 9, 14, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '14px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
    }}>
      {/* Brand & Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
        }}>
          <Bookmark size={20} color="#ffffff" strokeWidth={2.4} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff' }}>
              Noteseer
            </h1>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              background: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--accent-text, #a5b4fc)',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid rgba(99, 102, 241, 0.3)',
            }}>
              Self-Host
            </span>
          </div>
          <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
            {totalCount} elementi salvati
          </p>
        </div>
      </div>

      {/* Instant Search Bar */}
      <div style={{
        flex: '1',
        maxWidth: '540px',
        position: 'relative',
      }}>
        <Search
          size={18}
          color="var(--text-muted)"
          style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cerca per titolo, contenuto, riassunto AI o link... (Ctrl+K)"
          style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-pill)',
            padding: '10px 42px 10px 40px',
            fontSize: '0.9rem',
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'all 0.2s ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(99, 102, 241, 0.25)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-card)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={onToggleViewMode}
          title={viewMode === 'grid' ? 'Passa alla vista lista' : 'Passa alla vista griglia'}
          className="btn-icon"
          aria-label="Toggle view"
        >
          {viewMode === 'grid' ? <List size={18} /> : <LayoutGrid size={18} />}
        </button>

        <button
          onClick={onOpenSettingsModal}
          title="Impostazioni AI e Server"
          className="btn-icon"
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>

        <button
          onClick={onOpenAddModal}
          className="btn-primary"
          style={{ whiteSpace: 'nowrap' }}
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Nuovo</span>
        </button>
      </div>
    </header>
  );
}
