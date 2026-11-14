/**
 * main.js
 * Handles language persistence, localization loading, and shared utilities.
 */

const App = {
    state: {
        language: localStorage.getItem('time100_lang') || 'en',
        locales: ['en', 'zh-TW', 'zh-CN', 'ja', 'fr']
    },

    init() {
        this.setupLanguageSelector();
    },

    setLanguage(lang) {
        if (this.state.locales.includes(lang)) {
            this.state.language = lang;
            localStorage.setItem('time100_lang', lang);
            document.documentElement.lang = lang;

            // Dispatch event for other components
            window.dispatchEvent(new CustomEvent('languageChanged', {
                detail: { language: lang }
            }));

            // Update selector UI if present
            const selector = document.getElementById('lang-select');
            if (selector) selector.value = lang;
        }
    },

    setupLanguageSelector() {
        const selector = document.getElementById('lang-select');
        if (selector) {
            selector.value = this.state.language;
            selector.addEventListener('change', (e) => {
                this.setLanguage(e.target.value);
            });
        }
    },

    // Fetch localized content for a specific book
    async fetchBookData(personSlug) {
        try {
            // Need the current language i18n file + canonical pages.json
            const [pagesRes, i18nRes] = await Promise.all([
                fetch(`./books/${personSlug}/pages.json`),
                fetch(`./books/${personSlug}/i18n/${this.state.language}.json`)
            ]);

            const pages = await pagesRes.json();
            const i18n = await i18nRes.json();

            return { pages, i18n };
        } catch (error) {
            console.error("Failed to load book data:", error);
            return null;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
