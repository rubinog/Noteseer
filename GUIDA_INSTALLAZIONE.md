# 📖 Guida Completa all'Installazione sul tuo Muletto
### Docker, Docker Compose, Ollama & Noteseer

Questa guida passo-passo ti mostrerà come configurare il tuo server domestico (**muletto** con Ubuntu Server, Debian o simile) partendo da zero fino ad avere **Noteseer** attivo con intelligenza artificiale locale (**Ollama**) senza dipendere da servizi esterni o cloud a pagamento.

---

## 📌 Requisiti del Muletto

* **Sistema Operativo:** Ubuntu Server 22.04 / 24.04 LTS, Debian 12, o qualsiasi distribuzione Linux moderna a 64-bit.
* **CPU & RAM:**
  * Minimo per Noteseer: 1 vCPU, 512 MB di RAM.
  * Consigliato per far girare anche Ollama in locale: 4 core CPU e almeno 4-8 GB di RAM (o una scheda video anche modesta con supporto CUDA).
* **Archiviazione:** ~10-15 GB liberi (il container è leggero, ma i modelli AI pesano tra 1.5GB e 4GB).

---

## 🔹 PASSO 1: Installare Docker e Docker Compose

Se non hai ancora Docker sul tuo muletto, installa la versione ufficiale di Docker Engine e del plugin Compose.

### 1.1 Aggiorna i pacchetti di sistema
Collegati via SSH al tuo muletto ed esegui:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg lsb-release
```

### 1.2 Aggiungi il repository ufficiale Docker
```bash
# Crea la cartella per i portachiavi
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Aggiungi il repository apt
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```
*(Nota: se usi Debian anziché Ubuntu, sostituisci `/ubuntu` con `/debian` nel comando sopra).*

### 1.3 Installa Docker Engine e Compose Plugin
```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 1.4 Abilita l'esecuzione senza `sudo`
Per poter eseguire i comandi docker senza anteporre `sudo` ogni volta:
```bash
sudo usermod -aG docker $USER
```
> ⚠️ **Importante:** Disconnettiti dalla sessione SSH e riconnettiti (`exit` e poi rientra) per applicare l'aggiunta al gruppo.

### 1.5 Verifica l'installazione
```bash
docker --version
docker compose version
```

---

## 🔹 PASSO 2: Installare e Configurare Ollama

Ollama eseguirà i modelli linguistici (LLM) direttamente sulla CPU o GPU del tuo muletto, garantendo la totale privacy dei tuoi appunti e segnalibri.

### 2.1 Installa Ollama con lo script ufficiale
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 2.2 Configura Ollama per accettare connessioni dai container Docker
Per impostazione predefinita, Ollama risponde solo su `localhost:11434` dell'host. Dobbiamo istruirlo ad accettare richieste dalla rete interna di Docker (`OLLAMA_HOST=0.0.0.0`).

1. Apri la configurazione del servizio systemd di Ollama:
```bash
sudo systemctl edit ollama.service
```

2. Nella schermata che si apre, inserisci esattamente queste righe:
```ini
[Service]
Environment="OLLAMA_HOST=0.0.0.0"
```

3. Salva e chiudi (se usa `nano`, premi `Ctrl+O`, `Invio`, poi `Ctrl+X`).

4. Ricarica e riavvia il servizio:
```bash
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

5. Verifica che il servizio sia attivo e in ascolto:
```bash
sudo systemctl status ollama
curl http://localhost:11434/
# Dovrebbe rispondere: "Ollama is running"
```

### 2.3 Scarica un Modello AI Leggero per il Muletto
Per i muletti con risorse hardware standard (CPU senza GPU potente), consigliamo **Llama 3.2** (disponibile in versione ultraleggera 1B o 3B):

```bash
# Consigliato: ottimo compromesso tra velocità e intelligenza (circa 2.0 GB)
ollama pull llama3.2:3b

# Alternativa per muletti con pochissima RAM o CPU deboli (circa 1.3 GB)
# ollama pull llama3.2:1b
```

---

## 🔹 PASSO 3: Installare Noteseer con Docker Compose

Ora che Docker e Ollama sono pronti, cloniamo il progetto da GitHub e avviamo il container.

### 3.1 Clona la repository GitHub
```bash
# Puoi metterlo ad esempio nella tua cartella home o in /opt
cd ~
git clone https://github.com/rubinog/Noteseer.git
cd Noteseer
```

### 3.2 Avvia Noteseer in background
Esegui semplicemente:
```bash
docker compose up -d --build
```

Docker scaricherà l'ambiente Node, compilerà l'applicazione e avvierà il container. Questo richiederà circa 1-2 minuti al primo avvio.

### 3.3 Verifica che sia attivo
```bash
docker compose ps
```
Dovresti vedere il container `noteseer` con stato `Up` sulla porta `0.0.0.0:3000->3000`.

---

## 🔹 PASSO 4: Primo Accesso e Collegamento ad Ollama

1. Apri il browser dal tuo computer o smartphone (connesso alla stessa rete locale) e digita:
   ```
   http://<IP-DEL-MULETTO>:3000
   ```
   *(Puoi trovare l'indirizzo IP del tuo muletto dando il comando `hostname -I` sul server, ad esempio `http://192.168.1.50:3000`).*

2. Clicca sull'icona delle **Impostazioni (⚙️)** in alto a destra.

3. Nella scheda **Configurazione AI**:
   * Assicurati che sia selezionato **🦙 Ollama (Locale)**.
   * **Endpoint Ollama URL:** Lascia `http://host.docker.internal:11434` (oppure inserisci l'IP locale del muletto `http://192.168.1.xxx:11434`).
   * **Nome Modello Ollama:** Inserisci `llama3.2:3b` (o il modello scaricato).
   * Spunta **"Elaborazione automatica al salvataggio"**.

4. Clicca sul pulsante **Test Connessione**:
   * Vedrai apparire un badge verde: *`Connected to Ollama! Model 'llama3.2:3b' is available.`*

5. Clicca su **Salva Modifiche**.

🎉 **Congratulazioni!** Noteseer è pronto. Quando incollerai un link o creerai una nota, Noteseer estrarrà il testo ed effettuerà il riassunto e il tagging automatico tramite il tuo Ollama locale.

---

## 🔹 PASSO 5: Gestione, Aggiornamenti e Backup

### Come aggiornare Noteseer
Quando ci saranno nuove modifiche sul repository GitHub, aggiornare è immediato:
```bash
cd ~/Noteseer
git pull
docker compose up -d --build
```

### Dove sono salvati i dati e come fare il backup
Tutti i dati, le note, i link salvati e gli indici di ricerca full-text sono archiviati in un singolo file SQLite:
```
~/Noteseer/data/karakeep.db
```
Poiché SQLite è configurato in modalità **WAL** (*Write-Ahead Logging*), puoi fare copie di backup istantanee anche a container acceso:
```bash
cp ~/Noteseer/data/karakeep.db /percorso/al/tuo/backup/noteseer-$(date +%F).db
```

### Accesso da Fuori Casa (Remoto)
Se vuoi accedere a Noteseer anche quando sei fuori dalla rete Wi-Fi di casa, le due opzioni più sicure e raccomandate sono:
1. **Tailscale:** Installa Tailscale sul muletto e sui tuoi dispositivi. Avrai una VPN privata istantanea a costo zero.
2. **Cloudflare Tunnel:** Crea un tunnel Cloudflare gratuito collegato a un tuo dominio senza dover aprire porte sul router.
