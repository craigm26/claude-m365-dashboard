# Microsoft's Official MCP Servers: A Complete Inventory

Microsoft has published **20+ official MCP servers** across its entire stack. This document catalogs every server, its status, authentication requirements, and how to configure it with Claude Code.

---

## Table of Contents

- [Azure MCP Server (GA)](#azure-mcp-server)
- [Microsoft Graph MCP Server for Enterprise (Preview)](#microsoft-graph-mcp-server-for-enterprise)
- [Azure DevOps MCP Server (Preview)](#azure-devops-mcp-server)
- [Microsoft 365 Work IQ Servers](#microsoft-365-work-iq-servers)
- [Other Official Microsoft MCP Servers](#other-official-microsoft-mcp-servers)
- [Integration Tiers](#integration-tiers)

---

## Azure MCP Server

**Status:** Generally Available (1.0)
**Monorepo:** https://github.com/microsoft/mcp (under `servers/Azure.Mcp.Server`)
**Packages:** npm `@azure/mcp` | NuGet `Azure.Mcp` | PyPI `msmcp-azure` | Docker `mcr.microsoft.com/azure-sdk/azure-mcp`
**Docs:** https://learn.microsoft.com/en-us/azure/developer/azure-mcp-server/overview

The flagship server: **200+ tools across 40+ Azure services**, with namespace-based filtering to keep tool counts manageable.

### Claude Code Setup

```bash
claude mcp add "azure" -- npx -y @azure/mcp@latest server start

# Read-only mode (recommended for automated commands):
claude mcp add "azure-readonly" -- npx -y @azure/mcp@latest server start --read-only
```

### Claude Desktop / settings.json

```json
{
  "mcpServers": {
    "Azure MCP Server": {
      "command": "npx",
      "args": ["-y", "@azure/mcp@latest", "server", "start"]
    }
  }
}
```

### Namespace Inventory (47 namespaces)

The server runs in **namespace mode** by default. Filter with `--namespace storage,keyvault,cosmos` or expose everything with `--mode all`.

| Category | Service | Namespace |
|----------|---------|-----------|
| **AI & ML** | Azure AI Foundry | `foundry` |
| | Azure AI Search | `search` |
| | Azure AI Speech | `speech` |
| **Analytics** | Azure App Lens | `applens` |
| | Azure Data Explorer (Kusto) | `kusto` |
| | Azure Event Hubs | `eventhubs` |
| **Compute** | Azure App Service | `appservice` |
| | Azure Functions | `functionapp` |
| | Azure Kubernetes Service | `aks` |
| | Azure Virtual Desktop | `virtualdesktop` |
| **Containers** | Azure Container Registry | `acr` |
| **Databases** | Azure Cosmos DB | `cosmos` |
| | Azure Database for MySQL | `mysql` |
| | Azure Database for PostgreSQL | `postgres` |
| | Azure Redis Cache | `redis` |
| | Azure SQL | `sql` |
| **Developer Tools** | Application Insights | `applicationinsights` |
| | Azure App Configuration | `appconfig` |
| | Azure CLI / Dev CLI | `extension` |
| | Azure Load Testing | `loadtesting` |
| | Azure Deploy | `deploy` |
| **DevOps & IaC** | Bicep Schema | `bicepschema` |
| | Azure Monitor | `monitor` |
| | Azure Managed Grafana | `grafana` |
| | Azure Workbooks | `workbooks` |
| **Identity** | Azure RBAC | `role` |
| **Integration** | Azure Event Grid | `eventgrid` |
| | Azure Service Bus | `servicebus` |
| | Azure SignalR | `signalr` |
| | Azure Communication Services | `communication` |
| | Azure Native ISV (Datadog) | `datadog` |
| **Governance** | Azure Policy | `policy` |
| | Azure Quotas | `quota` |
| | Azure Resource Health | `resourcehealth` |
| | Resource Groups | `group` |
| | Subscriptions | `subscription` |
| | Cloud Architect | `cloudarchitect` |
| **Security** | Azure Key Vault | `keyvault` |
| | Azure Confidential Ledger | `confidentialledger` |
| **Storage** | Azure Storage (Blob) | `storage` |
| | Azure File Shares | `fileshares` |
| | Azure File Sync | `storagesync` |
| | Azure Managed Lustre | `managedlustre` |
| **Best Practices** | Azure Best Practices | `get_bestpractices` |
| | Terraform for Azure | `azureterraformbestpractices` |
| **Marketplace** | Azure Marketplace | `marketplace` |

### Authentication

Uses the **Azure Identity SDK** credential chain (no stored tokens). In local (stdio) mode, the chain tries in order:

1. Interactive Browser
2. Azure CLI (`az login`)
3. VS Code Azure Extension
4. Azure PowerShell
5. Environment Variables (service principal)
6. Managed Identity (only when `AZURE_MCP_INCLUDE_PRODUCTION_CREDENTIALS=true`)

For Docker, set `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, and `AZURE_CLIENT_SECRET` as environment variables.

### Permissions

Governed entirely by the authenticated user's **existing Azure RBAC roles**. Recommended least-privilege roles:

- **Reader** for general read operations
- **Storage Blob Data Reader** for storage
- **Key Vault Secrets User** for secrets

Tools handling sensitive data use an "elicitation" mechanism requiring explicit user consent.

### Rate Limits

Standard Azure Resource Manager throttling: ~12,000 reads and ~1,200 writes per subscription per hour. Individual resource providers add their own limits.

### Sovereign Clouds

Supported via `--cloud AzureChinaCloud` or `--cloud AzureUSGovernment`.

---

## Microsoft Graph MCP Server for Enterprise

**Status:** Public Preview (not GA)
**Endpoint:** `https://mcp.svc.cloud.microsoft/enterprise`
**App ID:** `e8c77dc2-69b3-43f4-bc51-3213c9d915b4`
**GitHub:** https://github.com/microsoft/EnterpriseMCP
**Docs:** https://learn.microsoft.com/en-us/graph/mcp-server/overview

Instead of one tool per Graph endpoint, this server uses **RAG over 500+ curated API examples** and exposes only **three tools**:

| Tool | Purpose |
|------|---------|
| `microsoft_graph_suggest_queries` | Semantic search to convert natural language into candidate Graph API calls |
| `microsoft_graph_get` | Executes read-only Graph API requests under the user's delegated permissions |
| `microsoft_graph_list_properties` | Returns entity schemas so the LLM can construct valid queries |

### Supported Scenarios

The preview is **narrowly scoped to Entra ID / identity and directory management**. It does not cover SharePoint, OneDrive, Teams, Exchange, Calendar, Planner, Intune policies, Copilot, or Compliance APIs.

| Scenario Area | What It Covers |
|---------------|---------------|
| **Security posture** | Authentication methods, Conditional Access policies, Security Defaults |
| **Privileged access** | Directory role assignments, PIM eligibility and activation status |
| **Application risk** | App/service principal inventory, ownership, permissions, SSO, ownerless/external apps |
| **Access governance** | Entitlement management packages, access review decisions, lifecycle workflows |
| **Device readiness** | Managed/compliant status, join state, OS distribution, stale devices |
| **Investigation** | Sign-in logs, audit logs, provisioning logs, network access logs, health alerts |
| **Hygiene & spending** | License counts/usage, unused apps/groups, domain config, contacts |

### OAuth Scopes (34 total)

Every scope follows the `MCP.{graph-permission}` pattern and is **delegated only** (no app-only). Admin consent from an Application Administrator or Cloud Application Administrator is required.

<details>
<summary>Full list of 34 scopes</summary>

- `MCP.AccessReview.Read.All`
- `MCP.AdministrativeUnit.Read.All`
- `MCP.Application.Read.All`
- `MCP.AuditLog.Read.All`
- `MCP.AuthenticationContext.Read.All`
- `MCP.Device.Read.All`
- `MCP.DirectoryRecommendations.Read.All`
- `MCP.Domain.Read.All`
- `MCP.EntitlementManagement.Read.All`
- `MCP.GroupMember.Read.All`
- `MCP.GroupSettings.Read.All`
- `MCP.HealthMonitoringAlert.Read.All`
- `MCP.IdentityRiskEvent.Read.All`
- `MCP.IdentityRiskyServicePrincipal.Read.All`
- `MCP.IdentityRiskyUser.Read.All`
- `MCP.LicenseAssignment.Read.All`
- `MCP.LifecycleWorkflows.Read.All`
- `MCP.LifecycleWorkflows-CustomExt.Read.All`
- `MCP.LifecycleWorkflows-Reports.Read.All`
- `MCP.LifecycleWorkflows-Workflow.Read.All`
- `MCP.LifecycleWorkflows-Workflow.ReadBasic.All`
- `MCP.NetworkAccess.Read.All`
- `MCP.NetworkAccess-Reports.Read.All`
- `MCP.Organization.Read.All`
- `MCP.Policy.Read.All`
- `MCP.Policy.Read.ConditionalAccess`
- `MCP.ProvisioningLog.Read.All`
- `MCP.Reports.Read.All`
- `MCP.RoleAssignmentSchedule.Read.Directory`
- `MCP.RoleEligibilitySchedule.Read.Directory`
- `MCP.RoleManagement.Read.Directory`
- `MCP.Synchronization.Read.All`
- `MCP.User.Read.All`
- `MCP.UserAuthenticationMethod.Read.All`

</details>

### Provisioning for Claude Code

Requires PowerShell and Entra ID app registration:

```powershell
Install-Module Microsoft.Entra.Beta -Force -AllowClobber
Connect-Entra -Scopes 'Application.ReadWrite.All','DelegatedPermissionGrant.ReadWrite.All'

# Grant permissions for your custom MCP client:
Grant-EntraBetaMCPServerPermission -ApplicationId "<your-app-client-id>" \
  -Scopes "MCP.User.Read.All","MCP.GroupMember.Read.All","MCP.Application.Read.All"
```

You must register your own Entra ID app (single tenant), configure redirect URIs, and request the `MCP.*` scopes you need. Dynamic Client Registration is not yet supported.

**Rate limit:** 100 requests per minute per user to the MCP server, plus standard Graph throttling on downstream API calls.

---

## Azure DevOps MCP Server

**Status:** Public Preview (local); Remote MCP also in Public Preview
**GitHub:** https://github.com/microsoft/azure-devops-mcp
**npm:** `@azure-devops/mcp`
**Remote endpoint:** `https://mcp.dev.azure.com/{organization}`
**Docs:** https://learn.microsoft.com/en-us/azure/devops/mcp-server/mcp-server-overview

### Claude Code Setup

```bash
claude mcp add azure-devops -- npx -y @azure-devops/mcp {YourOrg}
```

### Remote Server Configuration

Supports read-only mode and toolset filtering:

```json
{
  "mcpServers": {
    "ado-remote": {
      "url": "https://mcp.dev.azure.com/{organization}",
      "type": "http",
      "headers": {
        "X-MCP-Toolsets": "repos,wiki,wit",
        "X-MCP-Readonly": "true"
      }
    }
  }
}
```

### Capabilities

| Domain | Namespace | Capabilities |
|--------|-----------|-------------|
| Projects & teams | `core` | Organization structure, project listing |
| Work items | `work` / `work-items` | Create/query work items, sprint management |
| Repositories | `repositories` | Repo operations, branch management, PRs |
| Pipelines | `pipelines` | Build pipeline management, status |
| Wiki | `wiki` | Wiki page CRUD |
| Code search | `search` | Full-text code search |
| Test plans | `test-plans` | Test plan management |
| Advanced security | `advanced-security` | Security scanning features |

### Authentication

Uses **Microsoft Entra ID** (browser-based OAuth) for Azure DevOps Services, with PAT fallback supported.

---

## Microsoft 365 Work IQ Servers

**Requirement:** Microsoft 365 Copilot license
**Endpoint base:** `https://agent365.svc.cloud.microsoft/...`
**Docs:** https://learn.microsoft.com/en-us/microsoft-agent-365/tooling-servers-overview

The broader M365 APIs (mail, calendar, Teams, SharePoint, OneDrive) are **not** in the Graph Enterprise MCP server. They live in a separate family of remote MCP servers under the **Work IQ / Agent 365** brand.

| Server | Key Capabilities |
|--------|-----------------|
| **Work IQ Mail** | Create, read, update, delete messages; reply/reply-all; semantic search |
| **Work IQ Calendar** | Full event CRUD; accept/decline; conflict resolution |
| **Work IQ Teams** | Chat/channel CRUD; post messages; add members |
| **Work IQ SharePoint** | File upload; metadata; search; list management |
| **Work IQ OneDrive** | Personal file and folder management |
| **Work IQ User** | Manager chain, direct reports, profile, user search |
| **Work IQ Word** | Document creation; read; comment threads |
| **Work IQ Copilot** | Multi-turn chat with M365 Copilot; file grounding |
| **Dataverse & Dynamics 365** | CRUD plus domain-specific ERP/CRM actions |

These are currently accessible through **Copilot Studio** and **Microsoft Foundry** — not directly configurable in Claude Code without a custom integration layer. IT admins govern access via the M365 admin center under "Agents and Tools."

---

## Other Official Microsoft MCP Servers

| Server | Package / URL | Status | Purpose |
|--------|--------------|--------|---------|
| **Microsoft Learn Docs** | `https://learn.microsoft.com/api/mcp` | GA | Real-time access to all Microsoft documentation |
| **Playwright** | npm `@playwright/mcp` | Active | Browser automation via accessibility snapshots |
| **Microsoft Sentinel** | Remote (`sentinel.microsoft.com/mcp/...`) | Preview | Security data exploration, KQL queries |
| **Microsoft Fabric** | In monorepo | Preview | Fabric APIs, item definitions, analytics |
| **Fabric RTI** | In monorepo | Preview | Real-time intelligence services |
| **Microsoft Foundry** | In monorepo | Preview | AI model management, knowledge, agents |
| **Microsoft Dev Box** | In monorepo | Preview | Dev Box environment management |
| **SQL Database** | In monorepo | Available | Query any SQL database via connection string |
| **MarkItDown** | npm `@microsoft/mcp-markitdown` | Available | Convert PDF/DOCX/PPTX/Excel to Markdown |
| **Dynamics 365 ERP** | Via Copilot Studio | Preview | Finance, Supply Chain, hundreds of ERP functions |

### Claude Code Quick-Adds

```bash
# Azure (GA)
claude mcp add azure -- npx -y @azure/mcp@latest server start --read-only

# Azure DevOps (Preview)
claude mcp add azure-devops -- npx -y @azure-devops/mcp {YourOrg}

# Microsoft Learn Docs (GA, remote)
claude mcp add microsoft-learn --url https://learn.microsoft.com/api/mcp

# Playwright (browser automation)
claude mcp add playwright -- npx -y @playwright/mcp@latest

# MarkItDown (document conversion)
claude mcp add markitdown -- npx -y @microsoft/mcp-markitdown@latest
```

---

## Integration Tiers

For planning which servers to integrate with Claude Code:

### Tier 1 — Plug and Play

Standard Azure CLI auth or no auth required.

- Azure MCP Server (47 namespaces, 200+ tools)
- Azure DevOps MCP Server (8 domains)
- Microsoft Learn Docs
- Playwright
- MarkItDown
- SQL Database MCP

### Tier 2 — Requires Entra ID Provisioning

Admin consent + app registration required.

- Microsoft Graph MCP Server for Enterprise (34 scopes, read-only identity scenarios)

### Tier 3 — Requires M365 Copilot License + Foundry/Studio

Not directly Claude Code-configurable yet.

- All nine Work IQ servers
- Dynamics 365 ERP
- Sentinel

---

## Relevance to This Project

This project (`claude-m365-dashboard`) currently uses the **Microsoft Graph MCP server** configured at `https://mcp.microsoft.com/msgraph` in `.claude/settings.json`. This is the general-purpose Graph MCP endpoint that provides direct access to Microsoft Graph API endpoints for querying SharePoint, OneDrive, Copilot, and permissions data.

For expanding report coverage, consider:

- **Azure MCP Server** — for Azure resource health, storage accounts, and infrastructure monitoring
- **Graph Enterprise MCP** — for deeper Entra ID security posture and access governance reporting
- **Work IQ servers** — for Teams, Exchange, and broader M365 productivity suite metrics (requires Copilot license)

---

## References

- Microsoft MCP monorepo: https://github.com/microsoft/mcp
- Graph Enterprise MCP: https://github.com/microsoft/EnterpriseMCP
- Azure DevOps MCP: https://github.com/microsoft/azure-devops-mcp
- Azure MCP docs: https://learn.microsoft.com/en-us/azure/developer/azure-mcp-server/overview
- Graph MCP docs: https://learn.microsoft.com/en-us/graph/mcp-server/overview
- Work IQ docs: https://learn.microsoft.com/en-us/microsoft-agent-365/tooling-servers-overview
