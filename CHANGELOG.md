# Changelog

## 1.0.0 — 2026-11-10

First release.

- `SKILL.md`: an 8-stage QA flow (setup, first glance, blind control reading, task walkthrough, state stress test, design craft, persona and accessibility pass, report)
- Blind-first rule: judge from screenshots before reading the accessibility tree or the code, plus a prompt template for a "fresh eyes" subagent that has no code context
- References: perception, comprehension, interaction, visual craft (adapted from unslop), personas, reference apps, voice of the user (Khalid et al. 2015 complaint taxonomy), scoring and report, sources
- Scripts: `perceive.js` (heuristic scan order, control inventory, signifier strength, fake buttons, false affordances, target sizes, contrast), `tokens.js` (design-token audit and AI-slop signals), `capture.mjs` (fallback when Playwright MCP is not installed)
- `examples/sloppy-dashboard.html` and `npm test`, which checks that the scripts detect its deliberate problems
