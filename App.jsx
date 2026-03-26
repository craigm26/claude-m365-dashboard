import { useState, useEffect, useRef } from "react";

const SECTIONS = [
  { id: "sharepoint", label: "SharePoint", icon: "🗂️" },
  { id: "onedrive", label: "OneDrive", icon: "☁️" },
  { id: "copilot", label: "Copilot", icon: "✨" },
  { id: "permissions", label: "Permissions", icon: "🔐" },
];

const PROMPTS = {
  sharepoint: `Use the Microsoft Graph API via MCP to fetch SharePoint tenant health data. 
Call these Graph endpoints:
- GET /sites?$select=id,displayName,storageUsed,storageAllocated,lastModifiedDateTime,webUrl
- GET /admin/sharepoint/settings if accessible

Return a JSON object with this exact structure (use real data where possible, label estimated fields clearly):
{
  "totalSites": number,
  "activeSites": number,
  "staleSites": number,
  "storageUsedGB": number,
  "storageAllocatedGB": number,
  "sites": [{ "name": string, "url": string, "storageGB": number, "lastModified": string, "status": "active"|"stale"|"warning" }],
  "healthScore": number (0-100),
  "issues": [string],
  "dataSource": "live"|"partial"|"mock"
}
Only return valid JSON, no markdown.`,

  onedrive: `Use the Microsoft Graph API via MCP to fetch OneDrive health data.
Call these Graph endpoints:
- GET /reports/getOneDriveUsageAccountDetail(period='D30')
- GET /users?$select=id,displayName,assignedLicenses,signInActivity&$top=50

Return a JSON object with this exact structure:
{
  "totalUsers": number,
  "activeUsers": number,
  "inactiveUsers": number,
  "syncIssues": number,
  "storageUsedTB": number,
  "storageAllocatedTB": number,
  "inactiveLicenses": [{ "user": string, "lastSignIn": string, "license": string }],
  "topConsumers": [{ "user": string, "storageGB": number }],
  "healthScore": number (0-100),
  "issues": [string],
  "dataSource": "live"|"partial"|"mock"
}
Only return valid JSON, no markdown.`,

  copilot: `Use the Microsoft Graph API via MCP to fetch Microsoft 365 Copilot adoption data.
Call these Graph endpoints:
- GET /reports/getMicrosoft365CopilotUsageUserDetail(period='D30') if available
- GET /reports/getMicrosoft365AppUserDetail(period='D30')
- GET /organization for department structure

Return a JSON object with this exact structure:
{
  "totalLicenses": number,
  "activeUsers": number,
  "adoptionRate": number (0-100 percent),
  "byDepartment": [{ "dept": string, "users": number, "activeUsers": number, "adoptionPct": number }],
  "byApp": [{ "app": string, "users": number }],
  "weeklyTrend": [{ "week": string, "users": number }],
  "healthScore": number (0-100),
  "issues": [string],
  "dataSource": "live"|"partial"|"mock"
}
Only return valid JSON, no markdown.`,

  permissions: `Use the Microsoft Graph API via MCP to fetch permissions and external sharing data.
Call these Graph endpoints:
- GET /sites/{site-id}/permissions for top sites
- GET /admin/sharepoint/settings for external sharing policy
- GET /identityGovernance/accessReviews/definitions if available
- GET /groups?$filter=groupTypes/any(c:c eq 'Unified')&$select=id,displayName,visibility

Return a JSON object with this exact structure:
{
  "externalSharingEnabled": boolean,
  "sitesWithExternalAccess": number,
  "totalExternalUsers": number,
  "orphanedPermissions": number,
  "publicGroups": number,
  "riskySites": [{ "name": string, "url": string, "risk": "high"|"medium"|"low", "issue": string }],
  "sharingPolicy": string,
  "healthScore": number (0-100),
  "issues": [string],
  "dataSource": "live"|"partial"|"mock"
}
Only return valid JSON, no markdown.`,
};

async function fetchSectionData(sectionId) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      mcp_servers: [
        {
          type: "url",
          url: "https://mcp.microsoft.com/msgraph",
          name: "msgraph",
        },
      ],
      messages: [{ role: "user", content: PROMPTS[sectionId] }],
    }),
  });
  const data = await response.json();
  const textBlock = data.content?.find((b) => b.type === "text");
  if (!textBlock) throw new Error("No text response from API");
  const raw = textBlock.text.replace(/```json|```/g, "").trim();
  return JSON.parse(raw);
}

function ScoreRing({ score, size = 80 }) {
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e293b" strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={size * 0.22} fontWeight="700"
        style={{ transform: "rotate(90deg)", transformOrigin: "center", fontFamily: "monospace" }}>
        {score}
      </text>
    </svg>
  );
}

function StatusBadge({ label }) {
  const colors = {
    live:    { bg: "#052e16", text: "#86efac", dot: "#22c55e" },
    partial: { bg: "#422006", text: "#fcd34d", dot: "#f59e0b" },
    mock:    { bg: "#1e1b4b", text: "#a5b4fc", dot: "#818cf8" },
  };
  const c = colors[label] || colors.mock;
  return (
    <span style={{ background: c.bg, color: c.text, borderRadius: 4, padding: "2px 8px",
      fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5,
      fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, display: "inline-block" }} />
      {label}
    </span>
  );
}

function IssueList({ issues }) {
  if (!issues?.length) return <p style={{ color: "#22c55e", fontSize: 13 }}>✓ No issues detected</p>;
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
      {issues.map((i, idx) => (
        <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 8,
          padding: "6px 0", borderBottom: "1px solid #1e293b", fontSize: 13, color: "#cbd5e1" }}>
          <span style={{ color: "#f59e0b", marginTop: 1 }}>⚠</span> {i}
        </li>
      ))}
    </ul>
  );
}

function BarRow({ label, value, max, color = "#3b82f6" }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
        <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        <span style={{ fontFamily: "monospace" }}>{value}</span>
      </div>
      <div style={{ height: 6, background: "#1e293b", borderRadius: 3 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

function SharePointPanel({ data }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Sites",  value: data.totalSites,  color: "#3b82f6" },
          { label: "Active Sites", value: data.activeSites, color: "#22c55e" },
          { label: "Stale Sites",  value: data.staleSites,  color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{s.value ?? "—"}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Storage Usage</div>
        <BarRow label="Used" value={data.storageUsedGB ?? 0} max={data.storageAllocatedGB ?? 100} color="#3b82f6" />
        <div style={{ fontSize: 11, color: "#475569", textAlign: "right" }}>{data.storageUsedGB} / {data.storageAllocatedGB} GB allocated</div>
      </div>
      {data.sites?.length > 0 && (
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Top Sites by Storage</div>
          {data.sites.slice(0, 5).map((s, i) => (
            <BarRow key={i} label={s.name} value={s.storageGB}
              max={Math.max(...data.sites.map(x => x.storageGB))}
              color={s.status === "stale" ? "#f59e0b" : s.status === "warning" ? "#ef4444" : "#3b82f6"} />
          ))}
        </div>
      )}
      <IssueList issues={data.issues} />
    </div>
  );
}

function OneDrivePanel({ data }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Users",  value: data.totalUsers,  color: "#3b82f6" },
          { label: "Active Users", value: data.activeUsers, color: "#22c55e" },
          { label: "Sync Issues",  value: data.syncIssues,  color: "#ef4444" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{s.value ?? "—"}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {data.inactiveLicenses?.length > 0 && (
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
            Inactive Licenses ({data.inactiveLicenses.length})
          </div>
          {data.inactiveLicenses.slice(0, 5).map((u, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1e293b", fontSize: 13 }}>
              <span style={{ color: "#e2e8f0" }}>{u.user}</span>
              <span style={{ color: "#64748b", fontFamily: "monospace", fontSize: 11 }}>Last: {u.lastSignIn}</span>
            </div>
          ))}
        </div>
      )}
      {data.topConsumers?.length > 0 && (
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Top Storage Consumers</div>
          {data.topConsumers.slice(0, 5).map((u, i) => (
            <BarRow key={i} label={u.user} value={u.storageGB}
              max={Math.max(...data.topConsumers.map(x => x.storageGB))} color="#06b6d4" />
          ))}
        </div>
      )}
      <IssueList issues={data.issues} />
    </div>
  );
}

function CopilotPanel({ data }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Licenses",     value: data.totalLicenses, color: "#8b5cf6" },
          { label: "Active Users", value: data.activeUsers,   color: "#22c55e" },
          { label: "Adoption %",   value: `${data.adoptionRate ?? 0}%`, color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{s.value ?? "—"}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {data.byDepartment?.length > 0 && (
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Adoption by Department</div>
          {data.byDepartment.map((d, i) => (
            <BarRow key={i} label={`${d.dept} (${d.activeUsers}/${d.users})`}
              value={d.adoptionPct} max={100} color="#8b5cf6" />
          ))}
        </div>
      )}
      {data.byApp?.length > 0 && (
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Usage by App</div>
          {data.byApp.map((a, i) => (
            <BarRow key={i} label={a.app} value={a.users}
              max={Math.max(...data.byApp.map(x => x.users))} color="#a78bfa" />
          ))}
        </div>
      )}
      <IssueList issues={data.issues} />
    </div>
  );
}

function PermissionsPanel({ data }) {
  const riskColor = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "External Users",            value: data.totalExternalUsers,      color: "#ef4444" },
          { label: "Sites w/ External Access",  value: data.sitesWithExternalAccess, color: "#f59e0b" },
          { label: "Orphaned Permissions",       value: data.orphanedPermissions,     color: "#f97316" },
          { label: "Public Groups",              value: data.publicGroups,            color: "#64748b" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{s.value ?? "—"}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {data.sharingPolicy && (
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
          <span style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Sharing Policy: </span>
          <span style={{ color: "#e2e8f0" }}>{data.sharingPolicy}</span>
        </div>
      )}
      {data.riskySites?.length > 0 && (
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Risky Sites</div>
          {data.riskySites.map((s, i) => (
            <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #1e293b" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#e2e8f0" }}>{s.name}</span>
                <span style={{ fontSize: 11, color: riskColor[s.risk], fontWeight: 700, textTransform: "uppercase" }}>{s.risk}</span>
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.issue}</div>
            </div>
          ))}
        </div>
      )}
      <IssueList issues={data.issues} />
    </div>
  );
}

const PANELS = {
  sharepoint: SharePointPanel,
  onedrive:   OneDrivePanel,
  copilot:    CopilotPanel,
  permissions: PermissionsPanel,
};

export default function App() {
  const [activeSection, setActiveSection] = useState("sharepoint");
  const [sectionData, setSectionData]     = useState({});
  const [loading, setLoading]             = useState({});
  const [errors, setErrors]               = useState({});
  const [lastRefresh, setLastRefresh]     = useState(null);
  const fetchedRef = useRef({});

  async function loadSection(id) {
    if (loading[id]) return;
    setLoading((l) => ({ ...l, [id]: true }));
    setErrors((e)  => ({ ...e,  [id]: null }));
    try {
      const data = await fetchSectionData(id);
      setSectionData((d) => ({ ...d, [id]: data }));
      setLastRefresh(new Date());
      fetchedRef.current[id] = true;
    } catch (err) {
      setErrors((e) => ({ ...e, [id]: err.message }));
    } finally {
      setLoading((l) => ({ ...l, [id]: false }));
    }
  }

  useEffect(() => {
    if (!fetchedRef.current[activeSection]) loadSection(activeSection);
  }, [activeSection]);

  const scores = Object.values(sectionData).map((d) => d.healthScore ?? 0);
  const overallScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  const Panel   = PANELS[activeSection];
  const data    = sectionData[activeSection];
  const isLoading = loading[activeSection];
  const error   = errors[activeSection];

  return (
    <div style={{ minHeight: "100vh", background: "#020617", color: "#e2e8f0", fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #0f172a", padding: "16px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "#020617", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg,#0ea5e9,#6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⬡</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: -0.3 }}>M365 Tenant Health</div>
            <div style={{ fontSize: 11, color: "#475569" }}>
              {lastRefresh ? `Last updated ${lastRefresh.toLocaleTimeString()}` : "Not yet loaded"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {overallScore !== null && (
            <div style={{ textAlign: "center" }}>
              <ScoreRing score={overallScore} size={52} />
              <div style={{ fontSize: 10, color: "#475569", marginTop: 2, textTransform: "uppercase", letterSpacing: 1 }}>Health</div>
            </div>
          )}
          <button onClick={() => { fetchedRef.current = {}; setSectionData({}); loadSection(activeSection); }}
            style={{ background: "#0f172a", border: "1px solid #1e293b", color: "#94a3b8",
              padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12,
              fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
            ↻ Refresh All
          </button>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: "flex", padding: "0 24px", borderBottom: "1px solid #0f172a", background: "#020617" }}>
        {SECTIONS.map((s) => {
          const score = sectionData[s.id]?.healthScore;
          const isActive = s.id === activeSection;
          return (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "12px 18px",
                borderBottom: isActive ? "2px solid #3b82f6" : "2px solid transparent",
                color: isActive ? "#e2e8f0" : "#64748b",
                fontSize: 13, fontWeight: isActive ? 600 : 400, fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 7, transition: "color 0.15s" }}>
              <span>{s.icon}</span>
              <span>{s.label}</span>
              {loading[s.id] && <span style={{ fontSize: 10, color: "#3b82f6" }}>⟳</span>}
              {score !== undefined && !loading[s.id] && (
                <span style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 700,
                  color: score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444",
                  background: "#0f172a", padding: "1px 5px", borderRadius: 3 }}>{score}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>
              {SECTIONS.find(s => s.id === activeSection)?.icon} {SECTIONS.find(s => s.id === activeSection)?.label} Health
            </h2>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>Microsoft 365 tenant · Live Graph data</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {data?.dataSource && <StatusBadge label={data.dataSource} />}
            {data?.healthScore !== undefined && <ScoreRing score={data.healthScore} size={64} />}
            <button onClick={() => { fetchedRef.current[activeSection] = false; loadSection(activeSection); }}
              style={{ background: "#0f172a", border: "1px solid #1e293b", color: "#94a3b8",
                padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>↻</button>
          </div>
        </div>

        {isLoading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, gap: 16 }}>
            <div style={{ width: 40, height: 40, border: "3px solid #1e293b",
              borderTop: "3px solid #3b82f6", borderRadius: "50%",
              animation: "spin 0.8s linear infinite" }} />
            <div style={{ color: "#475569", fontSize: 13 }}>Querying Microsoft Graph API via MCP...</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {error && !isLoading && (
          <div style={{ background: "#1a0a0a", border: "1px solid #7f1d1d", borderRadius: 8, padding: 20, color: "#fca5a5", fontSize: 13 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>⚠ Failed to load data</div>
            <div style={{ color: "#ef4444", fontFamily: "monospace", fontSize: 12 }}>{error}</div>
            <div style={{ marginTop: 12, color: "#94a3b8", fontSize: 12 }}>
              Ensure the Microsoft Graph MCP server is connected and your account has the required admin scopes (SharePoint Admin, Reports Reader).
            </div>
          </div>
        )}

        {data && !isLoading && Panel && <Panel data={data} />}
      </div>
    </div>
  );
}
