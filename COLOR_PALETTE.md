# Brain Flows Color Palette

Reference for all theme colors. Updated to match the minimal dark mode palette.

---

## Light Mode

| Role | Token | Hex | Usage |
|------|-------|-----|-------|
| Main background | cream-50 | `#FEFCF8` | App root, header, distraction-free |
| Surface | cream-100 | `#FAF7F0` | Main layout, widget zones |
| Inputs / hover | white, sage-100 | `#FFFFFF`, `#E8F5E8` | Form inputs, hover states |
| Primary text | neutral-900 | `#2C2C2C` | Headings, body text |
| Secondary text | neutral-500/600 | `#6B7280` | Hints, timestamps, labels |
| Borders | neutral-300 | `#D1D5DB` | Dividers, panel handles |
| Primary button | sage-900 | `#2D5A3D` | CTAs, primary actions |
| Button hover | sage-700 | `#4A7C59` | Button hover state |
| Highlights | sage-100 | `#E8F5E8` | Selected states, accents |

---

## Dark Mode

| Role | Token | Hex | Usage |
|------|-------|-----|-------|
| Main background | neutral-950 | `#050608` | App root |
| Surface | neutral-surface | `#0B0E10` | Modals, cards, widget zones, header |
| Inputs / hover | neutral-800 | `#151A1F` | Form inputs, hover states |
| Primary text | neutral-text | `#F5F5F6` | Headings, body text |
| Secondary text | neutral-textMuted | `#C3C7CF` | Hints, timestamps |
| Borders | neutral-700 | `#232A32` | Dividers, panel handles |
| Primary button | sage-600 | `#3D7A52` | CTAs |
| Button hover | sage-500 | `#4E8C63` | Button hover |
| Accent / links | sage-400 | `#76B892` | Links, accent text, selected labels |
| Cream highlight | cream-200-dark | `#3A3225` | Occasional warm highlight |

---

## Usage Tips

- **Sage only where interactive**: Primary buttons, links, toggles, key icons
- **Large surfaces neutral**: Avoid tinting whole panels green
- **Primary text contrast**: neutral-text on neutral-950 passes WCAG
- **Minimal color in dark**: Use 2–3 roles—primary button (sage-600), accent (sage-400), occasional cream highlight (cream-200-dark)

---

## Tailwind Config Reference

```js
// tailwind.config.js
cream: {
  50: '#FEFCF8',
  100: '#FAF7F0',
  '200-dark': '#3A3225',
},
sage: {
  900: '#2D5A3D',
  700: '#4A7C59',
  600: '#3D7A52',
  500: '#4E8C63',
  400: '#76B892',
  100: '#E8F5E8',
  200: '#C8E6C9',
},
neutral: {
  950: '#050608',
  800: '#151A1F',
  700: '#232A32',
  surface: '#0B0E10',
  text: '#F5F5F6',
  textMuted: '#C3C7CF',
  // Light mode
  50: '#FAFAFA',
  100: '#F5F5F6',
  300: '#D1D5DB',
  500: '#6B7280',
  900: '#2C2C2C',
},
```
