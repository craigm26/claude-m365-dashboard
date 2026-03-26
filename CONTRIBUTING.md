# Contributing to claude-m365-dashboard

Thanks for your interest in contributing! This is a small, focused project — contributions that improve reliability, add new M365 sections, or improve the MCP integration are very welcome.

---

## Ways to Contribute

### 🐛 Bug Reports
Open an issue with:
- What section/tab was open
- What Graph endpoint was being queried
- The error message or unexpected behavior
- Your M365 license tier (E3, E5, Business Premium, etc.) if relevant

### ✨ New Dashboard Sections
Good candidates for new sections:
- **Exchange Online** — mailbox sizes, shared mailbox sprawl, mail flow rules
- **Teams** — inactive teams, guest access, channel health
- **Intune / Endpoint** — device compliance, stale enrollments
- **Entra ID** — MFA adoption, stale app registrations, guest users

To add a section, follow the pattern in `App.jsx`:
1. Add to `SECTIONS` array
2. Write a Graph-querying prompt in `PROMPTS`
3. Create a `<SectionNamePanel />` component
4. Register in `PANELS`

### 📖 Documentation
- Improve setup instructions for specific M365 configurations
- Add troubleshooting entries for common Graph permission errors
- Document which endpoints require which license tiers

---

## Development Workflow

Since this app runs as a Claude artifact (not a standalone npm project), the dev loop is:

1. Edit `src/App.jsx`
2. Paste into a Claude conversation as a React artifact
3. Verify it renders and Graph calls work as expected
4. Open a PR with your changes

There's no local build step — the artifact runs directly in Claude's sandbox.

---

## Code Style

- Keep `App.jsx` as a **single file** (artifact constraint)
- Inline styles only — no CSS files or Tailwind (artifact constraint)
- All Graph prompts should:
  - List the exact endpoints being called
  - Specify the exact JSON response shape
  - Instruct Claude to label data as `"live"`, `"partial"`, or `"mock"`
  - End with `"Only return valid JSON, no markdown."`
- Components should handle `undefined`/`null` data gracefully (use `?? "—"` patterns)

---

## Pull Request Guidelines

- Keep PRs focused — one section or fix per PR
- Include a brief description of what Graph endpoints the new section uses
- Note what M365 license/role is required for the new data
- Test with at least one real M365 tenant if possible

---

## Questions

Open an issue or reach out via GitHub Discussions.
