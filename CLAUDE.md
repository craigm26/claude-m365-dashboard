# M365 Tenant Health Dashboard

This project generates Microsoft 365 tenant health reports as markdown, using the Microsoft Graph MCP server directly from within Claude Code.

## How It Works

Claude connects to the Microsoft Graph API via the `msgraph` MCP server (configured in `.claude/settings.json`). When the user asks for a report, Claude queries Graph endpoints, collects the data, and outputs a formatted markdown report.

## Usage

To generate a full tenant health report, run:

```
/m365-report
```

This will query all four sections (SharePoint, OneDrive, Copilot, Permissions) and write the results to `reports/` as a timestamped markdown file.

## Graph API Endpoints Used

| Section | Endpoints |
|---|---|
| SharePoint | `GET /sites`, `GET /admin/sharepoint/settings` |
| OneDrive | `GET /reports/getOneDriveUsageAccountDetail(period='D30')`, `GET /users` |
| Copilot | `GET /reports/getMicrosoft365CopilotUsageUserDetail(period='D30')` |
| Permissions | `GET /sites/{id}/permissions`, `GET /groups`, `GET /admin/sharepoint/settings` |

## Required Scopes

The MCP connection needs consent for: `Sites.Read.All`, `SharePoint.Read.All`, `Reports.Read.All`, `User.Read.All`, `Group.Read.All`.

If an endpoint is inaccessible, the report marks that section as "partial" or "unavailable" rather than failing.

## Report Output

Reports are saved to `reports/YYYY-MM-DD_HHmmss_m365-health.md` and printed to the conversation.
