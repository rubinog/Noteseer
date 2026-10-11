'use client';

import React from 'react';
import { Layers, Link2, FileText, Star, Archive, Tag as TagIcon, Server, Cpu, Database } from 'lucide-react';
import { Tag } from '@/lib/db';

export interface TagWithCount extends Tag {
  count: number;
}

interface SidebarProps {
  filter: 'all' | 'favorites' | 'archived';
  onFilterChange: (filter: 'all' | 'favorites' | 'archived') => void;
  typeFilter: string;
  onTypeFilterChange: (type: string) => void;
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
  tags: TagWithCount[];
  counts: {
    all: number;
    links: number;
    notes: number;
    favorites: number;
    archived: number;
  };
}

export function Sidebar({
  filter,
  onFilterChange,
  typeFilter,
  onTypeFilterChange,
  selectedTag,
  onTagSelect,
  tags,
  counts,
}: SidebarProps) {
  const navItemStyle = (isActive: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
    color: isActive ? '#ffffff' : 'var(--text-secondary)',
    border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
    fontSize: '0.885rem',
    fontWeight: (isActive ? 600 : 500) as any,
    transition: 'all 0.18s ease',
    marginBottom: '3px',
  });

  const countBadgeStyle = (isActive: boolean) => ({
    fontSize: '0.725rem',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '12px',
    background: isActive ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.07)',
    color: isActive ? '#ffffff' : 'var(--text-muted)',
  });

  return (
    <aside style={{
      width: '260px',
      flexShrink: 0,
      background: 'rgba(10, 14, 23, 0.75)',
      backdropFilter: 'blur(16px)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 67px)',
      position: 'sticky',
      top: '67px',
      padding: '20px 16px',
      overflowY: 'auto',
    }}>
      {/* Category Navigation */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          marginBottom: '10px',
          paddingLeft: '6px',
        }}>
          Libreria
        </p>

        <div
          style={navItemStyle(filter === 'all' && typeFilter === '' && !selectedTag)}
          onClick={() => {
            onFilterChange('all');
            onTypeFilterChange('');
            onTagSelect(null);
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={17} color={filter === 'all' && !typeFilter ? '#818cf8' : 'currentColor'} />
            <span>Tutti gli elementi</span>
          </div>
          <span style={countBadgeStyle(filter === 'all' && !typeFilter && !selectedTag)}>
            {counts.all}
          </span>
        </div>

        <div
          style={navItemStyle(typeFilter === 'link' && filter === 'all')}
          onClick={() => {
            onFilterChange('all');
            onTypeFilterChange('link');
            onTagSelect(null);
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link2 size={17} color={typeFilter === 'link' ? '#38bdf8' : 'currentColor'} />
            <span>Link e Articoli</span>
          </div>
          <span style={countBadgeStyle(typeFilter === 'link')}>
            {counts.links}
          </span>
        </div>

        <div
          style={navItemStyle(typeFilter === 'note' && filter === 'all')}
          onClick={() => {
            onFilterChange('all');
            onTypeFilterChange('note');
            onTagSelect(null);
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={17} color={typeFilter === 'note' ? '#34d399' : 'currentColor'} />
            <span>Note rapide</span>
          </div>
          <span style={countBadgeStyle(typeFilter === 'note')}>
            {counts.notes}
          </span>
        </div>

        <div
          style={navItemStyle(filter === 'favorites')}
          onClick={() => {
            onFilterChange('favorites');
            onTypeFilterChange('');
            onTagSelect(null);
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Star size={17} color={filter === 'favorites' ? '#fbbf24' : 'currentColor'} />
            <span>Preferiti</span>
          </div>
          <span style={countBadgeStyle(filter === 'favorites')}>
            {counts.favorites}
          </span>
        </div>

        <div
          style={navItemStyle(filter === 'archived')}
          onClick={() => {
            onFilterChange('archived');
            onTypeFilterChange('');
            onTagSelect(null);
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Archive size={17} color={filter === 'archived' ? '#94a3b8' : 'currentColor'} />
            <span>Archivio</span>
          </div>
          <span style={countBadgeStyle(filter === 'archived')}>
            {counts.archived}
          </span>
        </div>
      </div>

      {/* Tags Section */}
      <div style={{ flex: 1, marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          paddingLeft: '6px',
        }}>
          <p style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
          }}>
            Tag AI e Personalizzati
          </p>
          {selectedTag && (
            <button
              onClick={() => onTagSelect(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-primary)',
                fontSize: '0.72rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Reset
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {tags.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '8px', fontStyle: 'italic' }}>
              Nessun tag creato. I tag verranno generati automaticamente dall&apos;AI o manualmente.
            </p>
          ) : (
            tags.map((tag) => {
              const isSelected = selectedTag === tag.name;
              return (
                <div
                  key={tag.id}
                  onClick={() => onTagSelect(isSelected ? null : tag.name)}
                  style={navItemStyle(isSelected)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: tag.color || '#6366f1',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}>
                      #{tag.name}
                    </span>
                  </div>
                  <span style={countBadgeStyle(isSelected)}>
                    {tag.count}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Muletto / Server Status Card */}
      <div style={{
        marginTop: 'auto',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Server size={15} color="var(--accent-emerald)" />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Self-Hosted Home Server
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-emerald)',
            boxShadow: '0 0 8px var(--accent-emerald)',
          }} />
          <span>SQLite WAL attivo</span>
          <span>•</span>
          <span>FTS5 Search</span>
        </div>
      </div>
    </aside>
  );
}
