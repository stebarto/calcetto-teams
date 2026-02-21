// Sistema di versioning automatico per KickSplit
// Genera una versione basata su timestamp per evitare problemi di cache

class VersionManager {
    constructor() {
        // Versione basata su data/ora per cache busting
        this.version = this.generateVersion();
        this.buildDate = new Date().toISOString();
    }

    generateVersion() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');
        
        return `${year}.${month}.${day}.${hour}${minute}`;
    }

    getVersion() {
        return this.version;
    }

    getBuildDate() {
        return this.buildDate;
    }

    // Aggiunge parametri di versione agli script
    addVersionToScripts() {
        const scripts = document.querySelectorAll('script[src*="js/"]');
        scripts.forEach(script => {
            const src = script.getAttribute('src');
            if (src && !src.includes('?v=')) {
                script.setAttribute('src', `${src}?v=${this.version}`);
            }
        });
    }

    // Mostra info versione nella console
    logVersionInfo() {
        console.log(`%c🚀 KickSplit v${this.version}`, 'color: #4A90E2; font-weight: bold');
        console.log(`📅 Build: ${this.buildDate}`);
        console.log(`🔄 Cache version: ${this.version}`);
    }
}

// Istanza globale
const versionManager = new VersionManager();

// Auto-inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    versionManager.logVersionInfo();
});