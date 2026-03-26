# Contributing to claude-m365-dashboard

Thanks for your interest in contributing! This is a small, focused project — contributions that improve reliability, add new M365 sections, or improve the report output are very welcome.

---

## Ways to Contribute

### Bug Reports
Open an issue with:
- What section was being queried
- What Graph endpoint returned an error
- Your M365 license tier (E3, E5, Business Premium, etc.) if relevant

### New Report Sections
Good candidates for new sections:
- **Exchange Online** — mailbox sizes, shared mailbox sprawl, mail flow rules
- **Teams** — inactive teams, guest access, channel health
- **Intune / Endpoint** — device compliance, stale enrollments
- **Entra ID** — MFA adoption, stale app registrations, guest users

To add a section, edit `.claude/commands/m365-report.md`:
1. Add a new numbered section with the Graph endpoints to query
2. Describe what data to collect
3. Add a corresponding section to the report template

### Documentation
- Improve setup instructions for specific M365 configurations
- Add troubleshooting entries for common Graph permission errors
- Document which endpoints require which license tiers

---

## Development Workflow

This project runs natively inside Claude Code — there's no build step or external app.

1. Edit the slash command in `.claude/commands/m365-report.md`
2. Run `/m365-report` in Claude Code to test
3. Verify Graph calls work and the report output is correct
4. Open a PR with your changes

---

## Code Style

- The slash command in `m365-report.md` should:
  - List the exact Graph endpoints being called per section
  - Describe the expected data to collect
  - Include error handling guidance for inaccessible endpoints
  - Maintain the markdown report template structure
- Keep the report template clean and scannable

---

## Pull Request Guidelines

- Keep PRs focused — one section or fix per PR
- Include a brief description of what Graph endpoints the new section uses
- Note what M365 license/role is required for the new data
- Test with at least one real M365 tenant if possible

---

## Questions

Open an issue or reach out via GitHub Discussions.
