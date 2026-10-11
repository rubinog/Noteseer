'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar, TagWithCount } from '@/components/Sidebar';
import { ItemCard } from '@/components/ItemCard';
import { ReaderModal } from '@/components/ReaderModal';
import { AddItemModal } from '@/components/AddItemModal';
import { SettingsModal } from '@/components/SettingsModal';
import { DeleteModal } from '@/components/DeleteModal';
import { Item } from '@/lib/db';
import { Plus, Bookmark, Loader2, Filter } from 'lucide-react';

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites' | 'archived'>('all');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [readerItem, setReaderItem] = useState<Item | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  // Global counts for all library sections
  const [counts, setCounts] = useState({
    all: 0,
    links: 0,
    notes: 0,
    favorites: 0,
    archived: 0,
  });

  // Load items
  const loadItems = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      if (selectedTag) params.set('tag', selectedTag);
      if (filter) params.set('filter', filter);

      const res = await fetch(`/api/items?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, selectedTag, filter]);

  // Load tags
  const loadTags = useCallback(async () => {
    try {
      const res = await fetch('/api/tags');
      if (res.ok) {
        const data = await res.json();
        setTags(data.tags || []);
      }
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  // Keyboard shortcut listener (Ctrl+K for search, Ctrl+N for new)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsAddModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Action handlers
  const handleToggleFavorite = async (id: string, current: number) => {
    const nextVal = current ? 0 : 1;
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, is_favorite: nextVal } : it))
    );

    try {
      await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_favorite: nextVal }),
      });
      loadItems();
    } catch (err) {
      console.error(err);
      loadItems();
    }
  };

  const handleToggleArchive = async (id: string, current: number) => {
    const nextVal = current ? 0 : 1;
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, is_archived: nextVal } : it))
    );

    try {
      await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived: nextVal }),
      });
      loadItems();
      loadTags();
    } catch (err) {
      console.error(err);
      loadItems();
    }
  };

  const handleDeleteClick = (item: Item) => {
    setItemToDelete(item);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete.id;
    setItemToDelete(null);

    // Optimistically remove from list
    setItems((prev) => prev.filter((it) => it.id !== id));

    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadItems();
        loadTags();
      } else {
        loadItems();
      }
    } catch (err) {
      console.error('Delete error:', err);
      loadItems();
    }
  };

  const handleTriggerAi = async (id: string) => {
    try {
      const res = await fetch(`/api/items/${id}/ai`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) =>
          prev.map((it) => (it.id === id ? data.item : it))
        );
        loadTags();
        loadItems();
      } else {
        const error = await res.json();
        alert(`Errore AI: ${error.error || 'Verifica la configurazione nelle impostazioni'}`);
      }
    } catch (err: any) {
      alert(`Errore AI: ${err.message}`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <Navbar
        search={search}
        onSearchChange={setSearch}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
        totalCount={counts.all}
      />

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Left Sidebar */}
        <Sidebar
          filter={filter}
          onFilterChange={setFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          selectedTag={selectedTag}
          onTagSelect={setSelectedTag}
          tags={tags}
          counts={counts}
        />

        {/* Main Content Area */}
        <main style={{
          flex: 1,
          padding: '24px 32px',
          overflowY: 'auto',
          maxWidth: '1600px',
        }}>
          {/* Active Filter Bar if tag or search is active */}
          {(selectedTag || search || filter !== 'all' || typeFilter) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              padding: '10px 16px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <Filter size={15} color="var(--accent-primary)" />
                <span style={{ color: 'var(--text-muted)' }}>Filtro attivo:</span>
                {filter !== 'all' && (
                  <span style={{ fontWeight: 600, color: '#ffffff' }}>
                    {filter === 'favorites' ? 'Preferiti' : 'Archivio'}
                  </span>
                )}
                {typeFilter && (
                  <span style={{ fontWeight: 600, color: 'var(--accent-text, #a5b4fc)' }}>
                    • {typeFilter === 'link' ? 'Solo Link' : 'Solo Note'}
                  </span>
                )}
                {selectedTag && (
                  <span style={{
                    fontWeight: 600,
                    color: 'var(--accent-primary)',
                    background: 'rgba(99, 102, 241, 0.15)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                  }}>
                    #{selectedTag}
                  </span>
                )}
                {search && (
                  <span style={{ color: 'var(--text-secondary)' }}>
                    • Cerca &quot;{search}&quot;
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  setSearch('');
                  setSelectedTag(null);
                  setTypeFilter('');
                  setFilter('all');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancella tutti i filtri
              </button>
            </div>
          )}

          {/* Items Display */}
          {loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '350px',
              gap: '12px',
              color: 'var(--text-muted)',
            }}>
              <Loader2 size={32} className="animate-spin" color="var(--accent-primary)" />
              <p style={{ fontSize: '0.9rem' }}>Caricamento elementi da SQLite...</p>
            </div>
          ) : items.length === 0 ? (
            /* Empty State */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '420px',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed var(--border-card)',
              borderRadius: 'var(--radius-xl)',
              padding: '40px 20px',
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}>
                <Bookmark size={28} color="var(--accent-primary)" />
              </div>
              <h2 style={{ fontSize: '1.3rem', color: '#ffffff', marginBottom: '8px' }}>
                Nessun elemento trovato
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '420px', lineHeight: 1.5, marginBottom: '20px' }}>
                {search || selectedTag || filter !== 'all' || typeFilter
                  ? 'Nessun risultato corrisponde ai criteri di ricerca attuali.'
                  : 'Inizia a salvare i tuoi articoli, link preferiti o note personali sul tuo server.'}
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn-primary"
                style={{ padding: '10px 22px' }}
              >
                <Plus size={18} strokeWidth={2.5} />
                <span>Aggiungi il tuo primo elemento</span>
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid / Masonry Layout */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '22px',
            }}>
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  viewMode="grid"
                  onToggleFavorite={handleToggleFavorite}
                  onToggleArchive={handleToggleArchive}
                  onDelete={handleDeleteClick}
                  onOpenReader={(it) => setReaderItem(it)}
                  onTriggerAi={handleTriggerAi}
                  onTagClick={(tag) => setSelectedTag(tag)}
                />
              ))}
            </div>
          ) : (
            /* List Layout */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  viewMode="list"
                  onToggleFavorite={handleToggleFavorite}
                  onToggleArchive={handleToggleArchive}
                  onDelete={handleDeleteClick}
                  onOpenReader={(it) => setReaderItem(it)}
                  onTriggerAi={handleTriggerAi}
                  onTagClick={(tag) => setSelectedTag(tag)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Reader Modal */}
      <ReaderModal
        item={readerItem}
        onClose={() => setReaderItem(null)}
      />

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onItemAdded={() => {
          loadItems();
          loadTags();
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* Custom Delete Confirmation Modal */}
      <DeleteModal
        isOpen={!!itemToDelete}
        itemTitle={itemToDelete?.title || ''}
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}
