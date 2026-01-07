// app.js – Nonno Text Card Editor v1.1 Deploy
// Using Google Fonts CDN (7 fonts)

// ============================================
// 1. THEMES DATA
// ============================================
const themes = [
    { id: "minimal", name: "極簡編輯", category: "light", bg: "#FFFFFF", fg: "#1A1A1A", accent: null, shadow: "0 8px 24px rgba(0,0,0,0.06)", tagStyle: "none", typography: { weight: 500, lineHeight: 1.3, letterSpacing: "0.02em" } },
    { id: "kawaii", name: "柔和可愛", category: "light", bg: "#FFF1F4", fg: "#FF7A8A", accent: "#FFD6DC", shadow: "0 10px 28px rgba(255,122,138,0.18)", tagStyle: "none", typography: { weight: 600, lineHeight: 1.35, letterSpacing: "0.03em" } },
    { id: "soft-pastel", name: "淡雅色調", category: "light", bg: "#F6F7FB", fg: "#6B6F8A", accent: "#D8DBF0", shadow: "0 12px 30px rgba(0,0,0,0.08)", tagStyle: "none", typography: { weight: 500, lineHeight: 1.4, letterSpacing: "0.02em" } },
    { id: "youth-pop", name: "青春活力", category: "light", bg: "#FFF8E6", fg: "#FF9F1C", accent: "#FFD48A", shadow: "0 10px 26px rgba(255,159,28,0.22)", tagStyle: "none", typography: { weight: 700, lineHeight: 1.25, letterSpacing: "0.04em" } },
    { id: "nature-calm", name: "自然恬靜", category: "light", bg: "#EFF6F2", fg: "#4E6B5C", accent: "#CFE4DA", shadow: "0 10px 28px rgba(78,107,92,0.18)", tagStyle: "none", typography: { weight: 500, lineHeight: 1.45, letterSpacing: "0.02em" } },
    { id: "editorial-serif", name: "雜誌內文", category: "neutral", bg: "#FAFAF8", fg: "#2B2B2B", accent: null, shadow: "0 14px 36px rgba(0,0,0,0.1)", tagStyle: "none", typography: { weight: 400, lineHeight: 1.55, letterSpacing: "0.01em" } },
    { id: "business-clean", name: "商務簡潔", category: "neutral", bg: "#F2F4F7", fg: "#1F2A37", accent: "#CBD5E1", shadow: "0 12px 30px rgba(31,42,55,0.18)", tagStyle: "none", typography: { weight: 600, lineHeight: 1.35, letterSpacing: "0.02em" } },
    { id: "travel-mood", name: "旅行氛圍", category: "neutral", bg: "#EEF3F7", fg: "#334155", accent: "#CBD5E1", shadow: "0 12px 32px rgba(51,65,85,0.18)", tagStyle: "none", typography: { weight: 500, lineHeight: 1.45, letterSpacing: "0.03em" } },
    { id: "handwritten-note", name: "手寫筆記", category: "neutral", bg: "#FFFDF7", fg: "#6B4E3D", accent: "#EAD9C6", shadow: "0 10px 24px rgba(107,78,61,0.18)", tagStyle: "none", typography: { weight: 400, lineHeight: 1.5, letterSpacing: "0.04em" } },
    { id: "dark-chic", name: "深色時尚", category: "dark", bg: "#0F172A", fg: "#F8FAFC", accent: "#64748B", shadow: "0 18px 40px rgba(0,0,0,0.5)", tagStyle: "none", typography: { weight: 600, lineHeight: 1.35, letterSpacing: "0.03em" } },
    { id: "starry-tech", name: "科技星空", category: "dark", bg: "radial-gradient(circle at top, #1E293B, #020617)", fg: "#38BDF8", accent: "#0EA5E9", shadow: "0 20px 48px rgba(0,0,0,0.65)", tagStyle: "none", typography: { weight: 600, lineHeight: 1.3, letterSpacing: "0.05em" } },
    { id: "trend-gradient", name: "潮流漸層", category: "dark", bg: "linear-gradient(135deg, #FF7A9E 0%, #7C83FF 50%, #2ED3C6 100%)", fg: "#FFFFFF", accent: "rgba(255,255,255,0.85)", shadow: "0 20px 48px rgba(0,0,0,0.35)", tagStyle: "none", typography: { weight: 600, lineHeight: 1.35, letterSpacing: "0.04em" } }
];

// ============================================
// 2. STATE
// ============================================
const CardState = {
    text: "",
    themeId: "minimal",
    fontFamily: "'Noto Sans TC', sans-serif",
    fontSizePx: 32,
    letterSpacingPreset: "normal",
    radiusPx: 20,
    paddingPx: 32
};

// ============================================
// 3. CONSTANTS
// ============================================
const letterSpacingMap = {
    tight: "0em",
    normal: "0.02em",
    loose: "0.05em"
};

const RANGE = {
    fontSizePx: { min: 24, max: 56 },
    radiusPx: { min: 8, max: 28 },
    paddingPx: { min: 24, max: 64 }
};

// 7 Google Fonts
const fontOptions = [
    { family: "'Noto Sans TC', sans-serif", label: "思源黑體 TC" },
    { family: "'Noto Serif TC', serif", label: "思源宋體 TC" },
    { family: "'Noto Sans JP', sans-serif", label: "Noto Sans JP" },
    { family: "'Noto Serif JP', serif", label: "Noto Serif JP" },
    { family: "'M PLUS 2', sans-serif", label: "M PLUS 2" },
    { family: "'Zen Maru Gothic', sans-serif", label: "Zen Maru Gothic" },
    { family: "'Klee One', cursive", label: "Klee One" }
];

// ============================================
// 4. DOM REFERENCES
// ============================================
const $ = (sel) => document.querySelector(sel);

const previewCard = $("#card-preview");
const previewText = $("#card-text-preview");
const previewTag = $("#card-tag-preview");

const textInput = $("#card-text");
const styleSelector = $("#style-selector");
const fontSelect = $("#font-selector");

const fontSizeSlider = $("#font-size");
const fontSizeValue = $("#font-size-value");

const radiusSlider = $("#radius");
const radiusValue = $("#radius-value");

const paddingSlider = $("#padding");
const paddingValue = $("#padding-value");

const lsButtons = Array.from(document.querySelectorAll(".ls-btn[data-ls]"));
const exportBtn = $("#export-btn");

// ============================================
// 5. UTILITIES
// ============================================
function clamp(n, min, max) {
    const v = Number(n);
    if (Number.isNaN(v)) return min;
    return Math.min(max, Math.max(min, v));
}

function resolveTheme() {
    return themes.find((t) => t.id === CardState.themeId) || themes[0];
}

function updateState(patch) {
    Object.assign(CardState, patch);
    render();
}

// ============================================
// 6. RENDER
// ============================================
function render() {
    const theme = resolveTheme();
    const typo = theme.typography;

    // Card styles
    previewCard.style.background = theme.bg;
    previewCard.style.color = theme.fg;
    previewCard.style.boxShadow = theme.shadow;
    previewCard.style.borderRadius = CardState.radiusPx + "px";
    previewCard.style.padding = CardState.paddingPx + "px";

    // Typography
    previewText.style.fontFamily = CardState.fontFamily;
    previewText.style.fontSize = CardState.fontSizePx + "px";
    previewText.style.fontWeight = String(typo.weight);
    previewText.style.lineHeight = String(typo.lineHeight);
    previewText.style.letterSpacing = letterSpacingMap[CardState.letterSpacingPreset] || "0.02em";

    // Text
    const txt = (CardState.text || "").trim();
    previewText.textContent = txt.length > 0 ? txt : "請輸入卡片文字";

    // Tag (hidden for clean design)
    if (previewTag) {
        previewTag.style.display = "none";
    }

    // Update UI states
    applyActiveStates();
}

function applyActiveStates() {
    // Style selector
    const styleItems = styleSelector.querySelectorAll(".style-item");
    for (const el of styleItems) {
        el.classList.toggle("is-active", el.dataset.themeId === CardState.themeId);
    }

    // Letter spacing buttons
    for (const btn of lsButtons) {
        btn.classList.toggle("is-active", btn.dataset.ls === CardState.letterSpacingPreset);
    }

    // Slider values
    fontSizeValue.textContent = CardState.fontSizePx + "px";
    radiusValue.textContent = CardState.radiusPx + "px";
    paddingValue.textContent = CardState.paddingPx + "px";

    fontSizeSlider.value = String(CardState.fontSizePx);
    radiusSlider.value = String(CardState.radiusPx);
    paddingSlider.value = String(CardState.paddingPx);

    // Font select - find the matching option
    for (let i = 0; i < fontSelect.options.length; i++) {
        if (fontSelect.options[i].value === CardState.fontFamily) {
            fontSelect.selectedIndex = i;
            break;
        }
    }
}

// ============================================
// 7. BUILD UI
// ============================================
function buildStyleGrid() {
    styleSelector.innerHTML = "";
    for (const t of themes) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "style-item";
        btn.dataset.themeId = t.id;
        btn.style.background = t.bg;
        btn.style.color = t.fg;
        btn.textContent = t.name;
        btn.addEventListener("click", function () {
            updateState({ themeId: t.id });
        });
        styleSelector.appendChild(btn);
    }
}

function buildFontSelect() {
    fontSelect.innerHTML = "";
    for (const f of fontOptions) {
        const opt = document.createElement("option");
        opt.value = f.family;
        opt.textContent = f.label;
        opt.style.fontFamily = f.family;
        fontSelect.appendChild(opt);
    }
    fontSelect.value = CardState.fontFamily;
}

// ============================================
// 8. EXPORT PNG
// ============================================
async function exportPNG() {
    exportBtn.disabled = true;
    exportBtn.textContent = "Exporting...";

    try {
        if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
        }

        if (typeof htmlToImage === "undefined") {
            throw new Error("html-to-image library not loaded");
        }

        const dataUrl = await htmlToImage.toPng(previewCard, {
            pixelRatio: 2,
            cacheBust: true,
            backgroundColor: null
        });

        const link = document.createElement("a");
        link.download = "text-card-" + Date.now() + ".png";
        link.href = dataUrl;
        link.click();

    } catch (error) {
        console.error("Export failed:", error);
        alert("Export failed: " + error.message);
    } finally {
        exportBtn.disabled = false;
        exportBtn.textContent = "Download PNG";
    }
}

// ============================================
// 9. EVENT BINDINGS
// ============================================
function bindEvents() {
    textInput.addEventListener("input", (e) => updateState({ text: e.target.value }));

    fontSelect.addEventListener("change", (e) => updateState({ fontFamily: e.target.value }));

    fontSizeSlider.addEventListener("input", (e) =>
        updateState({ fontSizePx: clamp(e.target.value, RANGE.fontSizePx.min, RANGE.fontSizePx.max) })
    );

    radiusSlider.addEventListener("input", (e) =>
        updateState({ radiusPx: clamp(e.target.value, RANGE.radiusPx.min, RANGE.radiusPx.max) })
    );

    paddingSlider.addEventListener("input", (e) =>
        updateState({ paddingPx: clamp(e.target.value, RANGE.paddingPx.min, RANGE.paddingPx.max) })
    );

    for (const btn of lsButtons) {
        btn.addEventListener("click", () => {
            const preset = btn.dataset.ls;
            if (preset && letterSpacingMap[preset] !== undefined) {
                updateState({ letterSpacingPreset: preset });
            }
        });
    }

    exportBtn.addEventListener("click", exportPNG);
}

// ============================================
// 10. INIT
// ============================================
(function init() {
    buildStyleGrid();
    buildFontSelect();
    bindEvents();
    render();
    console.log("Text Card Editor initialized");
})();
