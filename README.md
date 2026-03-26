# claude-m365-dashboard

> An interactive Microsoft 365 tenant health dashboard powered by Claude AI + Microsoft Graph MCP — built as a Claude Interactive MCP App.

![Health Score](https://img.shields.io/badge/health_score-live-22c55e?style=flat-square)
![MCP](https://img.shields.io/badge/MCP-Microsoft_Graph-0ea5e9?style=flat-square)
![Claude](https://img.shields.io/badge/Claude-Sonnet-6366f1?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-slate?style=flat-square)

---

## What It Does

This app lets you inspect the health of your Microsoft 365 tenant in real time — directly inside Claude. Instead of stitching together PowerShell scripts, admin center tabs, and Excel reports, you get a single interactive dashboard that queries the **Microsoft Graph API via MCP** and surfaces actionable insights across four areas:

| Section | What It Monitors |
|---|---|
| 🗂️ **SharePoint** | Site count, storage utilization, stale sites |
| ☁️ **OneDrive** | Active vs. inactive users, sync issues, license waste |
| ✨ **Copilot** | Adoption rate by department and app, weekly trend |
| 🔐 **Permissions** | External sharing, orphaned permissions, risky sites |

Each section returns a **health score (0–100)** and labels data as `live`, `partial`, or `mock` based on what Graph endpoints are accessible with your account's permissions.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Claude.ai / Claude App                  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              React Artifact (this app)               │   │
│  │                                                      │   │
│  │   Tab Nav → Section Panel → Score Ring + Charts      │   │
│  │                    │                                 │   │
│  │      fetch("https://api.anthropic.com/v1/messages")  │   │
│  └────────────────────┼─────────────────────────────────┘   │
│                       │                                     │
└───────────────────────┼─────────────────────────────────────┘
                        │  HTTPS + Anthropic API Key
                        ▼
          ┌─────────────────────────┐
          │   Anthropic Messages    │
          │   API (Claude Sonnet)   │
          │                         │
          │   mcp_servers: [        │
          │     msgraph MCP         │
          │   ]                     │
          └────────────┬────────────┘
                       │  MCP Protocol
                       ▼
          ┌─────────────────────────┐
          │  Microsoft Graph MCP    │
          │  mcp.microsoft.com/     │
          │  msgraph                │
          └────────────┬────────────┘
                       │  Graph API calls
                       ▼
          ┌─────────────────────────┐
          │   Microsoft Graph API   │
          │   graph.microsoft.com   │
          │                         │
          │  /sites                 │
          │  /reports/...           │
          │  /users                 │
          │  /admin/sharepoint/...  │
          └─────────────────────────┘
```

**How it works:**

1. The React app calls the Anthropic Messages API with a structured prompt for each dashboard section
2. The API call includes the Microsoft Graph MCP server URL
3. Claude uses the MCP server to make live Graph API calls against your tenant
4. Claude returns structured JSON which the app renders as charts, tables, and health scores
5. Data source badges (`live` / `partial` / `mock`) show exactly what came from Graph vs. was estimated

---

## Prerequisites

- **Claude.ai Pro or Team** account (for MCP connector support)
- **Microsoft 365 tenant** with one of the following roles:
  - SharePoint Administrator
  - Reports Reader
  - Global Reader (read-only access across all sections)
- **Microsoft Graph MCP** connected in Claude.ai Settings → Integrations

---

## Setup

### 1. Connect the Microsoft Graph MCP in Claude.ai

1. Open [claude.ai](https://claude.ai) → Settings → Integrations
2. Add a new MCP server:
   - **Name:** `msgraph`
   - **URL:** `https://mcp.microsoft.com/msgraph`
3. Authenticate with your Microsoft 365 account when prompted
4. Confirm the integration shows as connected

### 2. Open the App in Claude

**Option A — Paste directly:**
1. Copy the contents of [`App.jsx`](./App.jsx)
2. Start a new Claude conversation
3. Ask Claude: *"Run this React artifact for me"* and paste the code

**Option B — Ask Claude to load from GitHub:**
> "Load and run the React artifact from this repository's `App.jsx` on its default branch."

### 3. Use the Dashboard

- The **SharePoint** tab loads automatically on first open
- Click any tab to lazy-load that section's Graph data
- Use the **↻** button per section or **Refresh All** in the header to re-query
- Health scores update in the tab nav as each section loads

---

## Required Graph API Scopes

The app queries the following endpoints. Your MCP connection must have consent for these scopes:

| Endpoint | Scope Required |
|---|---|
| `GET /sites` | `Sites.Read.All` |
| `GET /admin/sharepoint/settings` | `SharePoint.Read.All` |
| `GET /reports/getOneDriveUsageAccountDetail` | `Reports.Read.All` |
| `GET /users` | `User.Read.All` |
| `GET /reports/getMicrosoft365CopilotUsageUserDetail` | `Reports.Read.All` |
| `GET /sites/{id}/permissions` | `Sites.FullControl.All` |
| `GET /groups` | `Group.Read.All` |

> **Note:** If your account lacks certain scopes, the app gracefully falls back to `partial` or `mock` data and labels it clearly. You won't see errors for missing permissions — just reduced fidelity.

---

## Customization

### Add a new section

1. Add an entry to the `SECTIONS` array in `App.jsx`
2. Write a Graph-querying prompt in the `PROMPTS` object
3. Create a new `Panel` component for rendering
4. Register it in the `PANELS` map

### Adjust health score thresholds

Health score colors default to:
- 🟢 Green: ≥ 80
- 🟡 Amber: 60–79
- 🔴 Red: < 60

Edit the `ScoreRing` component's `color` logic to change thresholds.

### Point at a different MCP server

Replace the `mcp_servers` URL in `fetchSectionData()` with any MCP-compatible Graph proxy you operate internally.

---

## Project Structure

```
claude-m365-dashboard/
├── App.jsx              # Full single-file React app
├── README.md
├── CONTRIBUTING.md
└── LICENSE
```

---

## Anthropic API Best Practices

When adapting this artifact to run outside Claude's artifact environment:

- Send `anthropic-version` on every request
- Keep your API key server-side whenever possible (avoid exposing browser keys)
- Use deterministic settings (`temperature: 0`) for dashboard JSON responses
- Validate and handle non-JSON or partial responses defensively
- Pin model names in one config location so upgrades are deliberate

---

## Limitations

- Requires an active Claude.ai session with MCP connected (no standalone deploy)
- Report endpoints (e.g. Copilot usage) require a Microsoft 365 E3/E5 or Copilot license on the tenant
- Graph data is point-in-time; this is not a live-polling monitor
- The Anthropic API key is handled by Claude.ai — no key management needed when running as an artifact

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## License

MIT — see [LICENSE](./LICENSE).

---

## Acknowledgments

Built as a response to [@TobinSouth](https://x.com/TobinSouth)'s challenge:
> *"go build an interactive mcp app and dm me, we'll put it in claude"*

Inspired by the friction of managing M365 tenants across PowerShell, the SharePoint admin center, and the Microsoft 365 admin portal — all at once.
