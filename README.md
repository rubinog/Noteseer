# 👁️ Noteseer

> **Smart, self-hosted bookmark and note-taking hub powered by local AI and instant full-text search.**  
> An ultra-lightweight alternative to services like Pocket, Raindrop, and Karakeep, designed specifically for home servers and homelabs (*muletto*).

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](https://www.docker.com/)
[![SQLite](https://img.shields.io/badge/SQLite-FTS5%20WAL-003B57?style=flat&logo=sqlite)](https://www.sqlite.org/)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20AI-white?style=flat)](https://ollama.com/)

---

## ✨ Features

* 🔗 **Universal Bookmark Archiving:** Paste any URL to auto-extract OpenGraph images, titles, descriptions, favicons, and the complete article text.
* 📖 **Distraction-Free Reader Mode:** Read archived articles without clutter, ads, or cookie banners, with estimated reading times and offline preservation.
* 📝 **Markdown Notes:** Capture ideas, code snippets, and thoughts with Markdown formatting and custom tags.
* 🦙 **Privacy-First AI (Ollama Local or Cloud):**
  * Connect directly to local models running on your home server (e.g. `llama3.2:3b`, `phi3:mini`, `mistral`) via **Ollama**.
  * Auto-generates concise 2-3 sentence summaries and 3-5 categorized color tags.
  * Also supports OpenAI, Groq, or OpenRouter compatible APIs.
* ⚡ **Lightning-Fast Full-Text Search (SQLite FTS5):**
  * Native SQLite FTS5 indexing across all titles, article bodies, notes, and AI summaries.
  * Instant search without heavy dependencies (no Elasticsearch, Meilisearch, or PostgreSQL required).
* 🛡️ **Ultra-Lightweight on Resources:**
  * Uses less than 100MB of RAM.
  * SQLite WAL mode enables zero-loss instant hot backups.
* 🎨 **Obsidian Glassmorphic UI:**
  * Dark mode theme with sleek micro-interactions.
  * Shortcuts: <kbd>Ctrl</kbd>+<kbd>K</kbd> to search, <kbd>Ctrl</kbd>+<kbd>N</kbd> to create.
  * Grid and list views, tag cloud, favorites, and archive filters.

---

## 🚀 Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/rubinog/Noteseer.git
cd Noteseer

# Start container
docker compose up -d --build
```

Access the app in your browser at `http://localhost:3000` (or `http://<YOUR-SERVER-IP>:3000`).

---

## 📚 Documentazione in Italiano

Se stai allestendo un **muletto** o un home-server domestico (Ubuntu/Debian) da zero:

👉 **[Consulta la Guida Completa all'Installazione (GUIDA_INSTALLAZIONE.md)](./GUIDA_INSTALLAZIONE.md)**  
Include:
1. Come installare Docker e Docker Compose ufficiale su Linux.
2. Come installare e configurare **Ollama** per accettare connessioni dai container (`OLLAMA_HOST=0.0.0.0`).
3. I modelli AI consigliati per il muletto (`llama3.2:3b` o `1b`).
4. Collegamento, backup automatico e accesso remoto (Tailscale / Cloudflare Tunnel).

---

## ⚙️ Configuration & Environment

Configuration is managed directly in the web UI under **Settings (⚙️)** or via Docker volumes:

| Parameter | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port exposed |
| `DATA_DIR` | `/app/data` | SQLite database directory (mounted as `./data:/app/data`) |
| `Ollama Host` | `http://host.docker.internal:11434` | Reaches host Ollama from within Docker container |

---

## 🛠️ Local Development (without Docker)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 💾 Data Persistence & Backups

All data and FTS indexes are stored in a single SQLite file:
```
./data/karakeep.db
```
Thanks to SQLite's **WAL (Write-Ahead Logging)** mode, you can safely create hot backups at any time:
```bash
cp ./data/karakeep.db ~/backups/noteseer-$(date +%F).db
```

---

## 📄 License

MIT License. Free and open source for personal and homelab use.
