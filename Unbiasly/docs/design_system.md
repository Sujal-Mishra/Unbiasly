# 🎨 Unbiasly AI - Premium UI/UX Design System

Unbiasly AI features a startup-grade, highly engaging **Dark Matte Laboratory** aesthetic. It is custom-designed using Vanilla CSS and Tailwind-standard HSL spacing tokens to produce a premium SaaS visual workspace for advanced text analysis.

---

## 🎨 Color Palette & Theming

The interface leverages rich, high-contrast matte shades alongside harmonized semantic accents to direct user focus without causing eye strain.

| Token | Class / Value | Hex | Visual Use Case |
|-------|---------------|-----|-----------------|
| **Base Background** | `bg-slate-950` | `#020617` | Overall workspace viewport background |
| **Surface Card** | `bg-slate-900/40` | `#0f172a` (with opacity) | Glassmorphic cards with border highlights |
| **Accent Cyan** | `text-cyan-400` | `#22d3ee` | Interactive controls, tooltips, and primary headers |
| **Accent Emerald** | `text-emerald-400` | `#34d399` | Low-risk bias indicators and objective sentences |
| **Accent Amber** | `text-amber-400` | `#fbbf24` | Medium-risk flags and emotional framing warnings |
| **Accent Rose** | `text-rose-400` | `#f87171` | High-risk bias indicators and overgeneralizations |

---

## 📐 Layout Architecture

The application is structured as a **single-page dashboard** divided into two core operational states:

```
┌─────────────────────────────────────────────────────────┐
│                    UNBIASLY AI PIPELINE                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   [ TEXT INPUT VIEWPORT ]                               │
│   ┌─────────────────────────────────────────────────┐   │
│   │ "Enter text to analyze..."                      │   │
│   │ [Chip Samples]                   [Initialize]   │   │
│   └─────────────────────────────────────────────────┘   │
│                                                         │
│   ─ ─ ─ ─ ─ ─ ─ ─  (Analysis Run)  ─ ─ ─ ─ ─ ─ ─ ─ ─    │
│                                                         │
│   [ DUAL PANEL INTERACTIVE DASHBOARD ]                  │
│   ┌────────────────────────┬────────────────────────┐   │
│   │   Classification       │   LIME Token Heatmap   │   │
│   │   (Gauges & Metrics)   │   (Attention tokens)   │   │
│   ├────────────────────────┼────────────────────────┤   │
│   │   Sentence Breakdown   │   Neutral Rewrite      │   │
│   │   (Detailed list)      │   (One-click Rephrase) │   │
│   └────────────────────────┴────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ⚡ Interactive Micro-Animations

To provide a satisfying, state-of-the-art interactive feedback loop, several microinteractions are implemented:

### 1. Dynamic SVG Progress Gauge
The overall bias score is represented by a semi-circular SVG ring. On analysis load, the ring animates dynamically using CSS transition properties:
```css
.gauge-ring-fill {
    transition: stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 2. Attention Heatmap Token Staggering
LIME attention tokens are highlighted inside the parsed text viewport. To make the interface feel alive, each token fades in sequentially with a staggered CSS animation delay calculated dynamically:
```javascript
const delay = (delayCounter * 0.15).toFixed(2);
// Injects: style="animation-delay: ${delay}s"
```

### 3. Smooth Card Accordion Shutter
The sentence breakdown accordion and the copy-to-clipboard elements slide open using dynamic height and opacity transition animations:
```css
.accordion-content {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.4s ease-out, opacity 0.3s ease;
}
```
