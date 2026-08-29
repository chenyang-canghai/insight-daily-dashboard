# Design QA

## Source truth

- Selected reference: `C:\Users\1\AppData\Local\Temp\codex-clipboard-057af8ce-9060-44bf-986d-4735febfed05.png`
- Stable reference copy: `C:\Users\1\.codex\generated_images\01a04ccd-b105-79a3-864f-fccbb914018a\exec-0f7edfb9-0ee9-4aa6-ba9b-99ca22c38e08.png`
- Reference pixels: 1487 × 1058.
- Target state: light editorial homepage with a full header, wide briefing column, narrow action rail, three signal rows, and restrained jade/gold accents.

## Implementation capture

- Screenshot method: Codex in-app browser bound to the existing local tab; no separate Playwright browser was launched.
- Runtime: production static export served locally from `out`.
- Desktop viewport: 1488 × 1060 CSS pixels at DPR 1.
- Saved desktop bitmap: 1473 × 1049 pixels (the in-app browser capture excludes its scrollbar/chrome edge).
- Desktop screenshot: `C:\Users\1\.codex\visualizations\2026\08\29\01a04ccd-b105-79a3-864f-fccbb914018a\home-editorial-desktop-final.png`
- Mobile viewport: 390 × 844 CSS pixels at DPR 1.
- Mobile screenshots: `home-editorial-mobile-final.png` and `home-editorial-mobile-full-final.png` in the same visualization folder.
- Dark-mode screenshot: `home-editorial-desktop-dark-final.png` in the same visualization folder.
- Full normalized comparison: `home-editorial-comparison-final.png` (both sides scaled to 1488 × 1060).
- Focused hero comparison: `home-editorial-hero-comparison-final.png` (top 650 pixels of both normalized images).

## Visual comparison

1. Header: 80-pixel visual band, square jade brand mark, four text navigation items, active underline, Beijing clock, and three utility icons match the reference hierarchy.
2. Page geometry: the implementation uses the same generous outer gutter, wide-left/narrow-right split, and single vertical rule separating the action rail.
3. Hero: the freshness marker, green “今日判断” eyebrow, large Song-style serif headline, two-line dek, green primary action, and three-step learning flow occupy the same above-fold rhythm.
4. Signal list: the section rule, two-digit ranks, vertical rank divider, serif titles, gold categories, short supporting copy, source/time metadata, chevrons, and centered “查看全部信号” affordance mirror the reference structure.
5. Right rail: the next action, learning streak, A-share state, and daily prompt keep the same green/gold icon logic and rule-separated vertical sequence.
6. Density: the final implementation keeps the first three signals and the complete action rail visible at the reference viewport; spacing remains slightly adaptive because live titles have different lengths.
7. Responsive behavior: at 390 × 844 the desktop navigation and clock collapse, the hero and rail stack, CTA targets expand to full width, the five-item bottom navigation remains usable, and there is no horizontal content overflow.

## Above-fold copy diff

- Reference headline and news rows were concept copy; implementation uses the current verified digest headline and its three highest-priority real entries.
- Reference “3 天” learning streak is replaced with the actual IndexedDB-derived value (`0 天` in the clean QA browser).
- Reference next-trading-day wording is replaced with the actual `2026-08-29` non-trading-day status and the configured `18:25` review link.
- The header shows the current Beijing time while the freshness row preserves the scheduled `07:15` news update.
- The implementation dek adds a clear logic chain: identify today’s themes, verify policy/data wording, then track execution, industry transmission, and employment impact.

## Findings and fixes

- Pass 1, high: the system theme produced a dark first capture. Fixed by exercising the real theme control and capturing the selected light state.
- Pass 1, high: the main gutter, headline scale, CTA width, and single-line dek were visibly tighter than the reference. Fixed with measured desktop spacing, larger editorial type, a 240-pixel primary CTA, and a two-line dek.
- Pass 1, medium: signal summaries read like technical data cards. Fixed by presenting the concise `why_it_matters` field and a clearer editorial synthesis above them.
- Pass 1, medium: the next-step, row-arrow, and prompt icons diverged from the reference. Fixed with the closest matching Lucide check-circle, chevron, and notebook icons.
- Pass 2, medium: the account popover remained open in the capture. Fixed by closing it before the final light screenshot; menu position was separately checked on mobile.
- Pass 2, low: header clock and utility icons were undersized. Fixed with a minute-level Beijing date/time format and reference-proportioned icons.
- Production check, high: a first visit on a dark operating-system theme opened in dark mode, which did not match the selected light reference. Fixed by making light the first-visit default while retaining explicit light, dark, and system controls.

## Functional and browser checks

- Primary “开始今日研判” link opened `/news/news-2026-08-29-01/` and rendered the selected article title.
- “开始训练” opened `/exam/` and rendered “公考学习”.
- Mobile bottom navigation “研判” opened `/news/` and rendered “全球重点议题”.
- Theme control successfully changed `data-theme` from light to dark and back to light.
- Mobile account popover stayed inside the 390-pixel viewport (`left 171`, `right 361`).
- Desktop and mobile browser console error logs: none.
- Automated checks: format, ESLint, TypeScript, 8 Vitest tests, data validation, PWA validation, static build, 19 Python tests, and Playwright core flow all passed (5 passed, 1 desktop-only mobile test skipped by design).

final result: passed
