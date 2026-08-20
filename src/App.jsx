import React, { useEffect, useMemo, useState } from "react";
import api from "./api";
import AIAssistant from "./components/AIAssistant";

const emptyTask = {
  title: "",
  description: "",
  priority: "Medium",
  status: "Pending",
  dueDate: ""
};

function Auth({ onLogin }) {
  const params = new URLSearchParams(window.location.search);
  const resetToken = params.get("resetToken");

  const [mode, setMode] = useState(resetToken ? "reset" : "login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function changeMode(nextMode) {
    setMode(nextMode);
    setError("");
    setMessage("");
    setForm({ name: "", email: "", password: "", confirmPassword: "" });
    if (window.history?.replaceState) window.history.replaceState({}, "", "/");
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      if (mode === "forgot") {
        const { data } = await api.post("/auth/forgot-password", { email: form.email });
        setMessage(data.message + (data.developmentResetUrl ? ` Development link: ${data.developmentResetUrl}` : ""));
        return;
      }

      if (mode === "reset") {
        if (form.password !== form.confirmPassword) {
          setError("Passwords do not match.");
          return;
        }
        const { data } = await api.post("/auth/reset-password", {
          token: resetToken,
          password: form.password
        });
        setMessage(data.message);
        setTimeout(() => changeMode("login"), 900);
        return;
      }

      const { data } = await api.post(`/auth/${mode}`, form);
      localStorage.setItem("task_token", data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  }

  const title =
    mode === "login" ? "Welcome back" :
    mode === "register" ? "Create your account" :
    mode === "forgot" ? "Forgot your password?" : "Set a new password";

  const subtitle =
    mode === "login" ? "Sign in to manage your tasks." :
    mode === "register" ? "Start organizing your work today." :
    mode === "forgot" ? "Enter your email and we'll send you a secure reset link." :
    "Choose a new password for your TaskFlow account.";

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand"><span>✓</span> TaskFlow</div>
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>

        <form onSubmit={submit}>
          {mode === "register" && (
            <label>Name<input required value={form.name} onChange={e => setForm({...form, name:e.target.value})} /></label>
          )}

          {mode !== "reset" && (
            <label>Email<input required type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} /></label>
          )}

          {(mode === "login" || mode === "register" || mode === "reset") && (
            <label>Password
              <input required minLength="6" type="password" value={form.password}
                onChange={e => setForm({...form, password:e.target.value})} />
            </label>
          )}

          {mode === "reset" && (
            <label>Confirm password
              <input required minLength="6" type="password" value={form.confirmPassword}
                onChange={e => setForm({...form, confirmPassword:e.target.value})} />
            </label>
          )}

          {error && <div className="error">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <button className="primary full">
            {mode === "login" ? "Login" :
             mode === "register" ? "Register" :
             mode === "forgot" ? "Send reset link" : "Reset password"}
          </button>
        </form>

        {mode === "login" && (
          <button className="link-btn forgot-link" onClick={() => changeMode("forgot")}>
            Forgot password?
          </button>
        )}

        {mode === "forgot" && (
          <button className="link-btn" onClick={() => changeMode("login")}>
            ← Back to Login
          </button>
        )}

        {mode === "reset" && (
          <button className="link-btn" onClick={() => changeMode("login")}>
            ← Back to Login
          </button>
        )}

        {mode !== "forgot" && mode !== "reset" && (
          <button className="link-btn" onClick={() => changeMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Need an account? Register" : "Already have an account? Login"}
          </button>
        )}
      </section>
    </main>
  );
}

function TaskModal({ task, onClose, onSave }) {
  const [form, setForm] = useState(task || emptyTask);
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit}>
        <div className="modal-head"><h2>{task ? "Edit task" : "New task"}</h2><button type="button" className="icon-btn" onClick={onClose}>×</button></div>
        <label>Title<input required maxLength="120" value={form.title} onChange={e => setForm({...form, title:e.target.value})} /></label>
        <label>Description<textarea rows="4" value={form.description} onChange={e => setForm({...form, description:e.target.value})} /></label>
        <div className="form-grid">
          <label>Priority<select value={form.priority} onChange={e => setForm({...form, priority:e.target.value})}><option>Low</option><option>Medium</option><option>High</option></select></label>
          <label>Status<select value={form.status} onChange={e => setForm({...form, status:e.target.value})}><option>Pending</option><option>In Progress</option><option>Completed</option></select></label>
        </div>
        <label>Due date<input type="date" value={form.dueDate ? String(form.dueDate).slice(0,10) : ""} onChange={e => setForm({...form, dueDate:e.target.value})} /></label>
        <div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={saving}>{saving ? "Saving..." : "Save task"}</button></div>
      </form>
    </div>
  );
}


function Analytics({ onBack }) {
  const [range, setRange] = useState("30");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAnalytics(selectedRange = range) {
    setLoading(true);
    setError("");
    try {
      const { data: result } = await api.get("/tasks/analytics", { params: { range: selectedRange } });
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load analytics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAnalytics(); }, [range]);

  function exportCSV() {
    if (!data) return;
    const rows = [
      ["Metric", "Value"],
      ["Date range", `Last ${data.range} days`],
      ["Total Tasks", data.summary.total],
      ["Completed", data.summary.completed],
      ["In Progress", data.summary.inProgress],
      ["Pending", data.summary.pending],
      ["Overdue", data.summary.overdue],
      ["Completion Rate", `${data.summary.completionRate}%`],
      [],
      ["Priority", "Count"],
      ...data.priority.map(x => [x.name, x.count]),
      [],
      ["Status", "Count"],
      ...data.status.map(x => [x.name, x.count]),
      [],
      ["Period", "Created", "Completed", "Productivity"],
      ...data.trend.map(x => [x.label, x.created, x.completed, `${x.productivity}%`])
    ];
    const csv = rows.map(row => row.map(v => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `taskflow-analytics-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const summary = data?.summary || { total: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0, completionRate: 0 };
  const trend = data?.trend || [];
  const priority = data?.priority || [];
  const status = data?.status || [];
  const maxTrend = Math.max(1, ...trend.flatMap(x => [x.created, x.completed]));
  const maxProductivity = Math.max(1, ...trend.map(x => x.productivity));

  const priorityTotal = Math.max(1, priority.reduce((sum, x) => sum + x.count, 0));
  const statusTotal = Math.max(1, status.reduce((sum, x) => sum + x.count, 0));
  const priorityStops = priority.reduce((acc, item) => {
    const start = acc.end;
    const end = start + (item.count / priorityTotal) * 100;
    acc.parts.push(`${item.name === "High" ? "#d23e3e" : item.name === "Medium" ? "#C59132" : "#22a06b"} ${start}% ${end}%`);
    acc.end = end;
    return acc;
  }, { parts: [], end: 0 }).parts.join(", ");
  const statusStops = status.reduce((acc, item) => {
    const start = acc.end;
    const end = start + (item.count / statusTotal) * 100;
    const color = item.name === "Completed" ? "#22a06b" : item.name === "In Progress" ? "#4f83cc" : "#aeb6c4";
    acc.parts.push(`${color} ${start}% ${end}%`);
    acc.end = end;
    return acc;
  }, { parts: [], end: 0 }).parts.join(", ");

  const insights = [];
  if (summary.total === 0) {
    insights.push({ icon: "📊", text: "Create tasks in this period and your analytics will populate automatically." });
  } else {
    insights.push({ icon: "💡", text: `You completed ${summary.completed} of ${summary.total} tasks — a ${summary.completionRate}% completion rate.` });
    if (summary.overdue) insights.push({ icon: "⚠️", text: `${summary.overdue} task${summary.overdue === 1 ? " is" : "s are"} overdue. Prioritize these before starting lower-priority work.` });
    else insights.push({ icon: "✅", text: "No overdue tasks in this period. Great job staying on schedule!" });
    if (data?.productivity?.mostProductive) insights.push({ icon: "🔥", text: `${data.productivity.mostProductive.label} was your most productive period at ${data.productivity.mostProductive.value}%.` });
    if (summary.pending > summary.completed) insights.push({ icon: "🎯", text: "Pending work is higher than completed work. Consider clearing a few quick wins first." });
    else insights.push({ icon: "🚀", text: "Completed work is keeping pace with your open workload. Keep the momentum going." });
  }

  return (
    <main className="content analytics-page">
      <header className="topbar analytics-topbar">
        <div>
          <p className="eyebrow">INSIGHTS</p>
          <h1>Advanced Analytics</h1>
          <p className="muted analytics-subtitle">Measure workload, progress, productivity and deadlines from your real tasks.</p>
        </div>
        <div className="analytics-actions">
          <select value={range} onChange={e => setRange(e.target.value)} aria-label="Analytics date range">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last 1 year</option>
          </select>
          <button className="secondary" onClick={exportCSV} disabled={!data}>↓ Export CSV</button>
          <button className="primary" onClick={onBack}>← Dashboard</button>
        </div>
      </header>

      {loading && <div className="analytics-loading">Calculating your analytics...</div>}
      {error && <div className="error">{error} <button className="link-btn" onClick={() => loadAnalytics()}>Try again</button></div>}

      {!loading && !error && data && <>
        <section className="analytics-kpis">
          <div className="analytics-kpi"><span className="kpi-icon gold">▦</span><div><small>Total Tasks</small><strong>{summary.total}</strong><em>created in period</em></div></div>
          <div className="analytics-kpi"><span className="kpi-icon green">✓</span><div><small>Completed</small><strong>{summary.completed}</strong><em>finished tasks</em></div></div>
          <div className="analytics-kpi"><span className="kpi-icon blue">◷</span><div><small>In Progress</small><strong>{summary.inProgress}</strong><em>currently active</em></div></div>
          <div className="analytics-kpi"><span className="kpi-icon gray">○</span><div><small>Pending</small><strong>{summary.pending}</strong><em>not started</em></div></div>
          <div className="analytics-kpi"><span className="kpi-icon red">!</span><div><small>Overdue</small><strong>{summary.overdue}</strong><em>{summary.overdue ? "needs attention" : "on track"}</em></div></div>
          <div className="analytics-kpi"><span className="kpi-icon purple">◉</span><div><small>Completion Rate</small><strong>{summary.completionRate}%</strong><em>completed / total</em></div></div>
        </section>

        <section className="analytics-grid analytics-grid-main">
          <div className="analytics-card wide">
            <div className="analytics-card-head"><div><h2>📈 Created vs Completed</h2><p>Task flow for the selected date range</p></div><span className="chart-legend"><i className="dot-created"></i>Created <i className="dot-completed"></i>Completed</span></div>
            {trend.length ? <div className="line-chart">
              <div className="y-labels"><span>{maxTrend}</span><span>{Math.ceil(maxTrend / 2)}</span><span>0</span></div>
              <svg viewBox="0 0 700 220" preserveAspectRatio="none" role="img" aria-label="Created versus completed tasks">
                <line x1="0" y1="40" x2="700" y2="40" className="grid-line"/><line x1="0" y1="110" x2="700" y2="110" className="grid-line"/><line x1="0" y1="180" x2="700" y2="180" className="grid-line"/>
                <polyline points={trend.map((d,i) => `${trend.length === 1 ? 350 : i * (660 / (trend.length - 1)) + 20},${180 - (d.created / maxTrend) * 140}`).join(" ")} className="line-created"/>
                <polyline points={trend.map((d,i) => `${trend.length === 1 ? 350 : i * (660 / (trend.length - 1)) + 20},${180 - (d.completed / maxTrend) * 140}`).join(" ")} className="line-completed"/>
                {trend.map((d,i) => { const x = trend.length === 1 ? 350 : i * (660 / (trend.length - 1)) + 20; return <g key={d.key}><circle cx={x} cy={180-(d.created/maxTrend)*140} r="4" className="point-created"/><circle cx={x} cy={180-(d.completed/maxTrend)*140} r="4" className="point-completed"/></g>; })}
              </svg>
              <div className="x-labels">{trend.map(d => <span key={d.key}>{d.label}</span>)}</div>
            </div> : <div className="chart-empty">No trend data for this period.</div>}
          </div>

          <div className="analytics-card">
            <div className="analytics-card-head"><div><h2>🍩 Tasks by Priority</h2><p>High, medium and low workload</p></div></div>
            <div className="donut-wrap">
              <div className="donut priority-donut" style={{background:`conic-gradient(${priorityStops || "#e9ecef 0 100%"})`}}><div><strong>{summary.total}</strong><small>tasks</small></div></div>
              <div className="donut-legend">{priority.map(x => <div key={x.name}><i className={`legend-${x.name.toLowerCase()}`}></i><span>{x.name}</span><b>{x.count}</b></div>)}</div>
            </div>
          </div>
        </section>

        <section className="analytics-grid analytics-grid-secondary">
          <div className="analytics-card">
            <div className="analytics-card-head"><div><h2>🍩 Tasks by Status</h2><p>Current state of work</p></div></div>
            <div className="donut-wrap">
              <div className="donut status-donut" style={{background:`conic-gradient(${statusStops || "#e9ecef 0 100%"})`}}><div><strong>{summary.completionRate}%</strong><small>done</small></div></div>
              <div className="donut-legend">{status.map(x => <div key={x.name}><i className={`legend-${x.name.toLowerCase().replaceAll(" ", "-")}`}></i><span>{x.name}</span><b>{x.count}</b></div>)}</div>
            </div>
          </div>

          <div className="analytics-card wide">
            <div className="analytics-card-head"><div><h2>📊 Daily Productivity</h2><p>Completion percentage per analytics bucket</p></div><strong className="big-score">{data.productivity.average}% avg</strong></div>
            <div className="bar-chart">
              {trend.map(d => <div className="bar-col" key={d.key}><span>{d.productivity}%</span><div className="bar-track"><div className="bar-fill" style={{height:`${Math.min(100, (d.productivity / maxProductivity) * 100)}%`}}></div></div><small>{d.label}</small></div>)}
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-card-head"><div><h2>💡 Productivity Insights</h2><p>Automatic recommendations from your data</p></div></div>
            <div className="insights">{insights.map((item, i) => <div key={i}><span>{item.icon}</span><span>{item.text}</span></div>)}</div>
          </div>
        </section>

        <section className="analytics-card overdue-panel">
          <div className="analytics-card-head"><div><h2>⚠️ Overdue Tasks</h2><p>Open tasks whose due date has passed</p></div><span className="overdue-count">{summary.overdue}</span></div>
          {data.overdueTasks.length ? data.overdueTasks.map(t => (
            <div className="overdue-row" key={t._id}>
              <span className="overdue-dot"></span>
              <div><b>{t.title}</b><small>{t.priority} priority · {t.status}</small></div>
              <span className="overdue-date">{t.daysOverdue} day{t.daysOverdue === 1 ? "" : "s"} overdue</span>
            </div>
          )) : <div className="no-overdue">🎉 No overdue tasks in this period.</div>}
        </section>

        <div className="analytics-footnote">Showing analytics for the <b>last {range === "365" ? "1 year" : `${range} days`}</b>. Change the filter above to recalculate every card and chart.</div>
      </>}
    </main>
  );
}

function Dashboard({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });
  const [filters, setFilters] = useState({ search: "", status: "All", priority: "All" });
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [showAI, setShowAI] = useState(false);
  const [view, setView] = useState("dashboard");

  async function load() {
    try {
      const [taskRes, statRes] = await Promise.all([
        api.get("/tasks", { params: filters }),
        api.get("/tasks/stats")
      ]);
      setTasks(taskRes.data);
      setStats(statRes.data);
    } catch (err) {
      if (err.response?.status === 401) onLogout();
    }
  }

  useEffect(() => { load(); }, [filters.search, filters.status, filters.priority]);

async function saveTask(form) {
  try {
    if (modal?._id) {
      await api.put(`/tasks/${modal._id}`, form);
    } else {
      await api.post("/tasks", form);
    }

    setModal(null);
    setToast("Task saved successfully");
    await load();
  } catch (err) {
    setToast(err.response?.data?.message || "Could not save task");
  }
}



  
  // async function saveTask(form) {
  //   try {
  //     if (modal) await api.put(`/tasks/${modal._id}`, form);
  //     else await api.post("/tasks", form);
  //     setModal(null); setToast("Task saved successfully"); load();
  //   } catch (err) { setToast(err.response?.data?.message || "Could not save task"); }
  // }

  async function removeTask(id) {
    if (!confirm("Delete this task?")) return;
    try { await api.delete(`/tasks/${id}`); setToast("Task deleted"); load(); }
    catch { setToast("Could not delete task"); }
  }

  const greeting = useMemo(() => user.name?.split(" ")[0] || "there", [user.name]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span>✓</span> TaskFlow</div>
        <nav>
          <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}>▦ Dashboard</button>
          <button className={view === "analytics" ? "active" : ""} onClick={() => setView("analytics")}>▥ Analytics</button>
          <button className="ai-nav" onClick={() => setShowAI(true)}>✨ AI Assistant</button>
        </nav>
        <div className="side-bottom">
          <div className="user-mini"><div className="avatar">{user.name[0]}</div><div><b>{user.name}</b><small>{user.email}</small></div></div>
          <button className="logout" onClick={onLogout}>↪ Logout</button>
        </div>
      </aside>

      {view === "analytics" ? (
        <Analytics onBack={() => setView("dashboard")} />
      ) : (
      <main className="content">
        <header className="topbar">
          <div><p className="eyebrow">WORKSPACE</p><h1>Good to see you, {greeting} </h1></div>
          <button className="primary" onClick={() => setModal({create:true})}>+ New task</button>
        </header>

        <section className="stats">
          <div className="stat"><span className="stat-icon">▦</span><div><small>Total tasks</small><strong>{stats.total}</strong></div></div>
          <div className="stat"><span className="stat-icon">◷</span><div><small>Pending</small><strong>{stats.pending}</strong></div></div>
          <div className="stat"><span className="stat-icon">✓</span><div><small>Completed</small><strong>{stats.completed}</strong></div></div>
        </section>

        <section className="panel">
          <div className="panel-head"><div><h2>Your tasks</h2><p className="muted">Search, filter and manage your work.</p></div></div>
          <div className="filters">
            <div className="search">⌕<input placeholder="Search tasks..." value={filters.search} onChange={e => setFilters({...filters, search:e.target.value})}/></div>
            <select value={filters.status} onChange={e => setFilters({...filters,status:e.target.value})}><option>All</option><option>Pending</option><option>In Progress</option><option>Completed</option></select>
            <select value={filters.priority} onChange={e => setFilters({...filters,priority:e.target.value})}><option>All</option><option>Low</option><option>Medium</option><option>High</option></select>
          </div>

          <div className="task-list">
            {tasks.length === 0 ? <div className="empty"><div>✓</div><h3>No tasks found</h3><p>Create a task or change your filters.</p></div> :
              tasks.map(task => (
                <article className="task-row" key={task._id}>
                  <div className="task-main">
                    <div className={`status-dot ${task.status === "Completed" ? "done" : ""}`}></div>
                    <div><h3 className={task.status === "Completed" ? "strike" : ""}>{task.title}</h3><p>{task.description || "No description"}</p></div>
                  </div>
                  <div className="task-meta">
                    <span className={`badge ${task.priority.toLowerCase()}`}>{task.priority}</span>
                    <span className={`status ${task.status === "Completed" ? "completed" : ""}`}>{task.status}</span>
                    <span className="due">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}</span>
                    <button className="icon-btn" title="Edit" onClick={() => setModal(task)}>✎</button>
                    <button className="icon-btn danger" title="Delete" onClick={() => removeTask(task._id)}>⌫</button>
                  </div>
                </article>
              ))
            }
          </div>
        </section>
      </main>
      )}

      {modal && <TaskModal task={modal._id ? modal : null} onClose={() => setModal(null)} onSave={saveTask}/>}
      {showAI && (
        <AIAssistant
          onClose={() => setShowAI(false)}
          onUseTask={(task) => {
            setShowAI(false);
            setModal({ create: true, ...task });
          }}
        />
      )}
      {toast && <button className="toast" onClick={() => setToast("")}>{toast}</button>}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("task_token");
    if (!token) { setChecking(false); return; }
    api.get("/auth/me").then(r => setUser(r.data.user)).catch(() => localStorage.removeItem("task_token")).finally(() => setChecking(false));
  }, []);

  function logout() {
    localStorage.removeItem("task_token");
    setUser(null);
  }

  if (checking) return <div className="loading">Loading TaskFlow...</div>;
  return user ? <Dashboard user={user} onLogout={logout}/> : <Auth onLogin={setUser}/>;
}