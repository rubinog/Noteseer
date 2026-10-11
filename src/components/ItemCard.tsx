'use client';

import React, { useState } from 'react';
import { Item, Tag } from '@/lib/db';
import { 
  Star, 
  Archive, 
  Trash2, 
  BookOpen, 
  ExternalLink, 
  Sparkles, 
  FileText, 
  Globe, 
  Loader2,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ItemCardProps {
  item: Item;
  viewMode: 'grid' | 'list';
  onToggleFavorite: (id: string, current: number) => void;
  onToggleArchive: (id: string, current: number) => void;
  onDelete: (id: string) => void;
  onOpenReader: (item: Item) => void;
  onTriggerAi: (id: string) => Promise<void>;
  onTagClick: (tagName: string) => void;
}

export function ItemCard({
  item,
  viewMode,
  onToggleFavorite,
  onToggleArchive,
  onDelete,
  onOpenReader,
  onTriggerAi,
  onTagClick,
}: ItemCardProps) {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showFullSummary, setShowFullSummary] = useState(false);
  const isLink = item.type === 'link';

  const domain = item.url
    ? (() => {
        try {
          return new URL(item.url).hostname.replace(/^www\./, '');
        } catch {
          return item.url;
        }
      })()
    : null;

  const handleAiClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAiLoading(true);
    try {
      await onTriggerAi(item.id);
    } finally {
      setIsAiLoading(false);
    }
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
  };

  if (viewMode === 'list') {
    return (
      <div
        className="glass-panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '12px 18px',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Favicon or Note Icon */}
        <div style={{ flexShrink: 0 }}>
          {isLink ? (
            item.favicon_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.favicon_url}
                alt=""
                style={{ width: '22px', height: '22px', borderRadius: '4px' }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Globe size={20} color="var(--text-muted)" />
            )
          ) : (
            <FileText size={20} color="var(--accent-emerald)" />
          )}
        </div>

        {/* Title and Domain */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3
              onClick={() => isLink && item.readable_html ? onOpenReader(item) : undefined}
              style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                cursor: isLink && item.readable_html ? 'pointer' : 'default',
              }}
            >
              {item.title}
            </h3>
            {domain && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                ({domain})
              </span>
            )}
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
              {item.tags.map((t) => (
                <span
                  key={t.id}
                  onClick={() => onTagClick(t.name)}
                  style={{
                    fontSize: '0.7rem',
                    color: t.color || 'var(--text-muted)',
                    background: `${t.color || '#6366f1'}18`,
                    border: `1px solid ${t.color || '#6366f1'}35`,
                    borderRadius: 'var(--radius-pill)',
                    padding: '1px 7px',
                    cursor: 'pointer',
                  }}
                >
                  #{t.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {isLink && item.readable_html && (
            <button
              onClick={() => onOpenReader(item)}
              title="Apri Reader Mode"
              className="btn-icon"
              style={{ width: '32px', height: '32px' }}
            >
              <BookOpen size={15} />
            </button>
          )}

          <button
            onClick={handleAiClick}
            disabled={isAiLoading}
            title={item.summary ? "Rigenera riassunto e tag AI" : "Genera riassunto e tag AI"}
            className="btn-icon"
            style={{ width: '32px', height: '32px', color: item.summary ? 'var(--accent-primary)' : 'inherit' }}
          >
            {isAiLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          </button>

          <button
            onClick={() => onToggleFavorite(item.id, item.is_favorite)}
            title={item.is_favorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
            className="btn-icon"
            style={{ width: '32px', height: '32px', color: item.is_favorite ? '#fbbf24' : 'inherit' }}
          >
            <Star size={15} fill={item.is_favorite ? '#fbbf24' : 'none'} />
          </button>

          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-icon"
              style={{ width: '32px', height: '32px' }}
              title="Apri sito originale"
            >
              <ExternalLink size={15} />
            </a>
          )}

          <button
            onClick={() => onToggleArchive(item.id, item.is_archived)}
            title={item.is_archived ? 'Ripristina da archivio' : 'Archivia'}
            className="btn-icon"
            style={{ width: '32px', height: '32px' }}
          >
            <Archive size={15} />
          </button>

          <button
            onClick={() => onDelete(item.id)}
            title="Elimina"
            className="btn-icon"
            style={{ width: '32px', height: '32px', color: '#f43f5e' }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    );
  }

  // Grid / Masonry card view
  return (
    <div
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.45)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        e.currentTarget.style.borderColor = 'var(--border-card)';
      }}
    >
      {/* Hero Preview Image if link */}
      {isLink && item.image_url && (
        <div
          onClick={() => item.readable_html ? onOpenReader(item) : item.url ? window.open(item.url, '_blank') : null}
          style={{
            height: '160px',
            width: '100%',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-secondary)',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image_url}
            alt={item.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.4s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onError={(e) => {
              (e.target as HTMLElement).parentElement!.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Card Content Area */}
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', flex: 1, gap: '10px' }}>
        {/* Domain & Type Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            {isLink ? (
              item.favicon_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.favicon_url}
                  alt=""
                  style={{ width: '16px', height: '16px', borderRadius: '3px', flexShrink: 0 }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Globe size={14} color="var(--text-muted)" />
              )
            ) : (
              <FileText size={14} color="var(--accent-emerald)" />
            )}

            <span style={{
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--text-muted)',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}>
              {domain || 'Nota Personale'}
            </span>
          </div>

          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={12} />
            {formatDate(item.created_at)}
          </span>
        </div>

        {/* Title */}
        <h3
          onClick={() => isLink && item.readable_html ? onOpenReader(item) : undefined}
          style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            lineHeight: 1.35,
            color: '#ffffff',
            cursor: isLink && item.readable_html ? 'pointer' : 'default',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.title}
        </h3>

        {/* Description or Excerpt */}
        {item.description && !item.summary && (
          <p style={{
            fontSize: '0.84rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {item.description}
          </p>
        )}

        {/* Note Content preview */}
        {!isLink && item.content && (
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            whiteSpace: 'pre-wrap',
            fontFamily: 'var(--font-sans)',
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
          }}>
            {item.content}
          </p>
        )}

        {/* AI Summary Banner */}
        {item.summary && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              fontSize: '0.8rem',
              color: '#cbd5e1',
              marginTop: '4px',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '4px',
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 700,
                color: 'var(--accent-text, #a5b4fc)',
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                <Sparkles size={13} color="#a5b4fc" />
                AI Summary
              </span>
              {item.summary.length > 120 && (
                <button
                  onClick={() => setShowFullSummary(!showFullSummary)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    fontSize: '0.72rem',
                  }}
                >
                  {showFullSummary ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              )}
            </div>
            <p style={{
              lineHeight: 1.45,
              display: showFullSummary ? 'block' : '-webkit-box',
              WebkitLineClamp: showFullSummary ? 'unset' : 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {item.summary}
            </p>
          </div>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: 'auto', paddingTop: '8px' }}>
            {item.tags.map((tag) => (
              <span
                key={tag.id}
                onClick={() => onTagClick(tag.name)}
                style={{
                  fontSize: '0.7rem',
                  color: tag.color || '#a5b4fc',
                  background: `${tag.color || '#6366f1'}15`,
                  border: `1px solid ${tag.color || '#6366f1'}30`,
                  borderRadius: 'var(--radius-pill)',
                  padding: '2px 8px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.15s ease',
                }}
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(0, 0, 0, 0.18)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isLink && item.readable_html && (
            <button
              onClick={() => onOpenReader(item)}
              title="Leggi in modalità Reader"
              className="btn-icon"
              style={{ width: '30px', height: '30px' }}
            >
              <BookOpen size={14} />
            </button>
          )}

          <button
            onClick={handleAiClick}
            disabled={isAiLoading}
            title={item.summary ? "Rigenera riassunto AI" : "Genera riassunto e tag AI"}
            className="btn-icon"
            style={{
              width: '30px',
              height: '30px',
              color: item.summary ? 'var(--accent-primary)' : 'inherit',
            }}
          >
            {isAiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          </button>

          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-icon"
              style={{ width: '30px', height: '30px' }}
              title="Apri link originale"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => onToggleFavorite(item.id, item.is_favorite)}
            title={item.is_favorite ? 'Rimuovi preferito' : 'Aggiungi a preferiti'}
            className="btn-icon"
            style={{
              width: '30px',
              height: '30px',
              color: item.is_favorite ? '#fbbf24' : 'inherit',
            }}
          >
            <Star size={14} fill={item.is_favorite ? '#fbbf24' : 'none'} />
          </button>

          <button
            onClick={() => onToggleArchive(item.id, item.is_archived)}
            title={item.is_archived ? 'Ripristina' : 'Archivia'}
            className="btn-icon"
            style={{ width: '30px', height: '30px' }}
          >
            <Archive size={14} />
          </button>

          <button
            onClick={() => onDelete(item.id)}
            title="Elimina"
            className="btn-icon"
            style={{ width: '30px', height: '30px', color: '#f43f5e' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
