# PomodoroFlow Design Notes

## App Store Badge Sizing Ratios

When displaying App Store and Google Play badges together, they need different sizes to appear visually balanced due to their different aspect ratios.

### Official Badge Dimensions:
- **App Store SVG**: 119.66 x 40 (aspect ratio ~3:1)
- **Google Play PNG**: 646 x 250 (aspect ratio ~2.6:1)

### Visual Balance Formula:
To make them look the same size, Google Play badge should be **~1.37x larger** than App Store badge.

### Tested & Approved Sizes:

#### Website (index.html):
- **App Store**: 50px height
- **Google Play**: 74px height
- **Ratio**: 1.48:1

#### Instagram Story (social/instagram-story.html):
- **App Store**: 90px height
- **Google Play**: 123px height
- **Ratio**: 1.37:1

### Quick Reference:
If you set App Store badge to any height, multiply by **1.37** to get Google Play height:
- 40px → 55px
- 60px → 82px
- 80px → 110px
- 100px → 137px

### Why This Works:
The App Store badge is wider/flatter, so it appears larger at the same height. The Google Play badge is more square-shaped, so it needs extra height to match the visual weight.

---

## Other Design Details

### Colors:
- Background: `#0f1115`
- Muted: `#1a1d24`
- Text: `#e6e7ea`
- Dim: `#a1a7b3`
- Accent (red): `#e6462f`
- Ring: `#2a2f39`

### Fonts:
- System fonts stack: `ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Helvetica, Arial`

### Border Radius:
- Default: `16px`
- Pills/badges: `999px` (fully rounded)

---

*Last updated: 2025-10-21*
