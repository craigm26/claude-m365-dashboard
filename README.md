# claude-m365-dashboard

> Microsoft 365 tenant health reports generated natively inside Claude Code — no browser, no React, no external app.

## What It Does

Run `/m365-report` inside Claude Code to generate a full M365 tenant health report as markdown. Claude queries the **Microsoft Graph API via MCP** directly and produces a detailed report covering:

| Section | What It Checks |
|---|---|
| SharePoint | Site count, storage utilization, stale sites |
| OneDrive | Active vs. inactive users, sync issues, license waste |
| Copilot | Adoption rate, usage by app |
| Permissions | External sharing policy, public groups, risky configurations |

Reports are saved to `reports/` as timestamped markdown files.

## Prerequisites

- **Claude Code** (CLI, VS Code extension, or desktop app)
- **Microsoft 365 tenant** with one of these roles:
  - SharePoint Administrator
  - Reports Reader
  - Global Reader
- **Microsoft Graph MCP** — authentication happens on first use

## Setup

1. Clone this repo and open it in Claude Code:
   ```
   git clone https://github.com/yourusername/claude-m365-dashboard.git
   cd claude-m365-dashboard
   ```

2. The Microsoft Graph MCP server is pre-configured in `.claude/settings.json`. On first use, you'll be prompted to authenticate with your Microsoft 365 account.

3. Generate a report:
   ```
   /m365-report
   ```

## Required Graph API Scopes

| Scope | Used For |
|---|---|
| `Sites.Read.All` | SharePoint site inventory |
| `SharePoint.Read.All` | Tenant sharing/storage settings |
| `Reports.Read.All` | OneDrive and Copilot usage reports |
| `User.Read.All` | User sign-in activity |
| `Group.Read.All` | M365 group visibility audit |

If your account lacks certain scopes, the report marks those sections as "unavailable" rather than failing.

## Project Structure

```
claude-m365-dashboard/
├── .claude/
│   ├── settings.json          # MCP server configuration
│   └── commands/
│       └── m365-report.md     # /m365-report slash command
├── reports/                   # Generated reports (gitignored)
├── CLAUDE.md                  # Project context for Claude
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

## How It Works

1. You run `/m365-report` in Claude Code
2. Claude reads the command template and queries Microsoft Graph endpoints via the MCP server
3. Data is collected across all four sections, with graceful fallback for inaccessible endpoints
4. A formatted markdown report is generated and saved to `reports/`

No API keys to manage, no build step, no browser — it runs entirely within Claude Code.

## Microsoft MCP Server Ecosystem

This project uses the Microsoft Graph MCP server, one of **20+ official MCP servers** Microsoft publishes. For a complete inventory covering Azure, Graph Enterprise, Azure DevOps, Work IQ (M365), and more — including setup commands, authentication details, and integration tiers — see:

**[docs/microsoft-mcp-servers.md](./docs/microsoft-mcp-servers.md)**

## License

MIT — see [LICENSE](./LICENSE).
