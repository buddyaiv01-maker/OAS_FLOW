(() => {
  "use strict";

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const toastEl = $("#toast");
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 2200);
  }

  /* ---------- Theme (light / dark) ---------- */
  const root = document.documentElement;
  function setTheme(theme) {
    if (theme === "light") root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");
    try { localStorage.setItem("oasysflow-theme", theme); } catch (e) {}
  }
  let storedTheme = null;
  try { storedTheme = localStorage.getItem("oasysflow-theme"); } catch (e) {}
  if (storedTheme === "light") setTheme("light");

  $("#themeToggle").addEventListener("click", () => {
    const isLight = root.getAttribute("data-theme") === "light";
    setTheme(isLight ? "dark" : "light");
  });

  /* ---------- Sidebar collapse ---------- */
  const appEl = $(".app");
  $("#sidebarCollapseBtn").addEventListener("click", () => {
    appEl.classList.toggle("sidebar-collapsed");
  });

  /* ---------- Workflow list collapse ---------- */
  const wfListEl = $(".wf-list");
  $("#wfListChev").addEventListener("click", (e) => {
    e.stopPropagation();
    wfListEl.classList.toggle("is-collapsed");
  });
  $("#wfListAddBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    $(".btn-new-workflow").click();
  });

  /* ---------- Views: Workflows editor / Dashboard / Credentials ---------- */
  const workspaceView = $("#workspaceView");
  const dashboardView = $("#dashboardView");
  const credentialsView = $("#credentialsView");
  const floatbarDock = $("#floatbarDock");
  const topbarEl = $(".topbar");

  function setView(view) {
    const showEditor = view === "workflows";
    workspaceView.classList.toggle("is-hidden", !showEditor);
    floatbarDock.classList.toggle("is-hidden", !showEditor);
    topbarEl.classList.toggle("is-hidden", !showEditor);
    dashboardView.classList.toggle("is-hidden", view !== "dashboard");
    credentialsView.classList.toggle("is-hidden", view !== "credentials");
    if (view === "dashboard") renderDashboard();
    if (view === "credentials") renderCredentialsView();
  }

  $$(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
      $$(".nav-item").forEach(i => i.classList.remove("is-active"));
      item.classList.add("is-active");
      const view = item.dataset.view;
      if (view === "dashboard" || view === "workflows" || view === "credentials") setView(view);
    });
  });

  /* ---------- Workflow list (shared source of truth: sidebar + dashboard) ---------- */
  let workflows = [
    { id: "wf-demo", name: "Lead Capture Pipeline", status: "active", nodeCount: 5, blank: false, iconType: "webhook" },
  ];
  let currentWorkflowId = "wf-demo";
  let wfIdCounter = 0;

  function dashboardCardGradient(index) {
    const gradients = [
      "linear-gradient(135deg, var(--orange), #ffb347)",
      "linear-gradient(135deg, var(--blue), #6d93e8)",
      "linear-gradient(135deg, var(--purple), #8b46ba)",
      "linear-gradient(135deg, var(--orange), var(--purple))",
    ];
    return gradients[index % gradients.length];
  }

  const trashIconSvg = '<svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M7 7l1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function deleteWorkflow(id) {
    const idx = workflows.findIndex(w => w.id === id);
    if (idx === -1) return;
    workflows.splice(idx, 1);
    delete workflowCanvasData[id];

    if (currentWorkflowId === id) {
      currentWorkflowId = null; // clear first so selectWorkflow() below doesn't re-snapshot the deleted workflow
      if (workflows.length > 0) {
        selectWorkflow(workflows[0].id);
      } else {
        clearCanvas();
        resetHistory();
        $("#wfTitle").textContent = "No workflow selected";
        setActiveSwitch(false);
      }
    }
    renderWfList();
    renderDashboard();
    persist();
    toast("Workflow deleted");
  }

  function renderWfList() {
    const listEl = $("#wfList");
    listEl.innerHTML = "";
    workflows.forEach(wf => {
      const li = document.createElement("li");
      li.className = "wf-item" + (wf.id === currentWorkflowId ? " is-active" : "");
      li.dataset.id = wf.id;
      const dotClass = wf.status === "active" ? "dot dot-live" : "dot";
      li.innerHTML = `
        <span class="${dotClass}"></span>
        <span class="wf-item-name">${wf.name}</span>
        <button class="wf-item-delete" title="Delete workflow" data-id="${wf.id}">${trashIconSvg}</button>
      `;
      li.addEventListener("click", () => selectWorkflow(wf.id));
      li.querySelector(".wf-item-delete").addEventListener("click", (e) => {
        e.stopPropagation();
        deleteWorkflow(wf.id);
      });
      listEl.appendChild(li);
    });
    $("#wfListEmpty").classList.toggle("is-hidden", workflows.length > 0);
  }

  function renderDashboard() {
    const grid = $("#dashboardGrid");
    grid.innerHTML = "";
    workflows.forEach((wf, i) => {
      const meta = nodeTypeLibrary[wf.iconType] || nodeTypeLibrary.webhook;
      const card = document.createElement("div");
      card.className = "dashboard-card" + (wf.id === currentWorkflowId ? " is-current" : "");
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      const statusClass = wf.status === "active" ? "status-active" : wf.status === "draft" ? "status-draft" : "status-paused";
      const statusLabel = wf.status[0].toUpperCase() + wf.status.slice(1);
      card.innerHTML = `
        <button class="dashboard-card-delete" title="Delete workflow" data-id="${wf.id}">${trashIconSvg}</button>
        <div class="dashboard-card-head">
          <span class="dashboard-card-icon" style="background:${dashboardCardGradient(i)}"><svg viewBox="0 0 24 24" fill="none">${meta.icon}</svg></span>
          <span class="dashboard-card-title">${wf.name}</span>
        </div>
        <span class="dashboard-card-status ${statusClass}"><span class="dot"></span>${statusLabel}</span>
        <span class="dashboard-card-meta">${wf.nodeCount} node${wf.nodeCount === 1 ? "" : "s"} · Updated just now</span>
      `;
      card.addEventListener("click", () => {
        selectWorkflow(wf.id);
        $$(".nav-item").forEach(i2 => i2.classList.remove("is-active"));
        $('.nav-item[data-view="workflows"]').classList.add("is-active");
        setView("workflows");
      });
      card.querySelector(".dashboard-card-delete").addEventListener("click", (e) => {
        e.stopPropagation();
        deleteWorkflow(wf.id);
      });
      grid.appendChild(card);
    });
    $("#statTotal").textContent = workflows.length;
    $("#statActive").textContent = workflows.filter(w => w.status === "active").length;
    $("#statDraft").textContent = workflows.filter(w => w.status === "draft").length;
  }

  function selectWorkflow(id) {
    const wf = workflows.find(w => w.id === id);
    if (!wf) return;
    if (currentWorkflowId && currentWorkflowId !== id) snapshotCurrentCanvasInto(workflowCanvasData);
    currentWorkflowId = id;
    $("#wfTitle").textContent = wf.name;
    buildWorkflowCanvas(id);
    setActiveSwitch(wf.status === "active");
    renderWfList();
    renderDashboard();
    persist();
  }

  /* ---------- Canvas state ---------- */
  const canvasInner = $("#canvasInner");
  const edgesSvg = $("#edges");
  let nodeCounter = 0;
  let selectedNodeId = null;

  const nodeTypeLibrary = {
    webhook:  { badge: "badge-webhook",  label: "Webhook",       cat: "trigger", color: "#F79106",
      icon: '<circle cx="7" cy="17" r="2.6" stroke="currentColor" stroke-width="1.8"/><circle cx="17" cy="7" r="2.6" stroke="currentColor" stroke-width="1.8"/><circle cx="17" cy="17" r="2.6" stroke="currentColor" stroke-width="1.8"/><path d="M9 15.5 15 9M14.6 8 9.6 15.2" stroke="currentColor" stroke-width="1.8"/>',
      outputFields: [{ key: "payload", label: "Payload (JSON)" }, { key: "headers", label: "Headers" }] },
    schedule: { badge: "badge-schedule", label: "Schedule",      cat: "trigger", color: "#57177D",
      icon: '<circle cx="12" cy="13" r="7.5" stroke="currentColor" stroke-width="1.7"/><path d="M12 9v4l2.6 1.6M9 2.5h6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
      outputFields: [{ key: "triggerTime", label: "Trigger Time" }] },
    http:     { badge: "badge-http",     label: "HTTP Request",  cat: "integrations", color: "#3660B7",
      icon: '<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.7"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.7 5.4 3.7 8.5s-1.3 6.1-3.7 8.5c-2.4-2.4-3.7-5.4-3.7-8.5S9.6 5.9 12 3.5Z" stroke="currentColor" stroke-width="1.5"/>',
      params: [
        { key: "url", label: "URL", type: "text", required: true, mappable: true, placeholder: "https://api.example.com/endpoint" },
        { key: "method", label: "Method", type: "select", required: true, options: ["GET", "POST", "PUT", "PATCH", "DELETE"], default: "GET" },
        { key: "body", label: "Body", type: "textarea", mappable: true, placeholder: "Raw JSON body, or map one from an earlier step…" },
      ],
      outputFields: [{ key: "body", label: "Response Body" }, { key: "status", label: "Status Code" }] },
    ifelse:   { badge: "badge-ifelse",   label: "IF / Else",     cat: "logic", color: "#4CAF50",
      icon: '<path d="M4 8h5l4 4h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 5l3 3-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 16h5l3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="0.2 3.4"/><path d="M14 15l3 3 3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      branches: [
        { key: "yes", label: "1st", hint: "Take this route if…" },
        { key: "else", label: "Else", hint: "" },
      ] },
    set:      { badge: "badge-set",      label: "Set",           cat: "logic", color: "#F79106",
      icon: '<path d="m17 3 4 4-11 11-4.6 1 1-4.6L17 3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
      params: [
        { key: "name", label: "Field Name", type: "text", required: true, placeholder: "e.g. donor_email" },
        { key: "value", label: "Value", type: "textarea", required: true, mappable: true, placeholder: "A static value, or click Map to pull one from an earlier step…" },
      ],
      outputFields: [{ key: "value", label: "Set Value" }] },
    filter:   { badge: "badge-filter",   label: "Filter",        cat: "logic", color: "#3ABD8A",
      icon: '<path d="M4 5h16l-6 8v6l-4-2v-4L4 5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>' },
    email:    { badge: "badge-email",    label: "Email",         cat: "integrations", color: "#E95A78",
      icon: '<rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="m4 6.5 8 6 8-6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
      outputFields: [{ key: "subject", label: "Subject" }, { key: "body", label: "Body" }] },
    slack:    { badge: "badge-slack",    label: "Slack",         cat: "integrations", color: "#4A154B", brand: true,
      icon: '<path fill="currentColor" d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>',
      connection: { kind: "oauth", service: "Slack", account: "Oasys Flow Workspace (#new-leads)" },
      params: [
        { key: "channel", label: "Channel", type: "text", required: true, placeholder: "#new-leads" },
        { key: "message", label: "Message", type: "textarea", required: true, mappable: true, placeholder: "Write a message, or map one from an earlier step…" },
      ],
      outputFields: [{ key: "message", label: "Message Text" }, { key: "channel", label: "Channel" }] },
    sheet:    { badge: "badge-sheet",    label: "Google Sheets", cat: "integrations", color: "#0F9D58", brand: true,
      icon: '<path fill="currentColor" d="M11.318 12.545H7.91v-1.909h3.41v1.91zM14.728 0v6h6l-6-6zm1.363 10.636h-3.41v1.91h3.41v-1.91zm0 3.273h-3.41v1.91h3.41v-1.91zM20.727 6.5v15.864c0 .904-.732 1.636-1.636 1.636H4.909a1.636 1.636 0 0 1-1.636-1.636V1.636C3.273.732 4.005 0 4.909 0h9.318v6.5h6.5zm-3.273 2.773H6.545v7.909h10.91v-7.91zm-6.136 4.636H7.91v1.91h3.41v-1.91z"/>',
      connection: { kind: "oauth", service: "Google Sheets", account: "buddyai.v.01@gmail.com" },
      params: [
        { key: "sheetName", label: "Sheet Name", type: "text", required: true, placeholder: "Sheet1" },
        { key: "row", label: "Row Data", type: "textarea", required: true, mappable: true, placeholder: "Comma-separated values, or map a field from an earlier step…" },
      ],
      outputFields: [{ key: "row", label: "Row Data" }] },
    ai:       { badge: "badge-ai",       label: "AI Agent",      cat: "ai", color: "#4CAF7D", special: "agent",
      icon: '<rect x="5" y="8" width="14" height="11" rx="3" stroke="currentColor" stroke-width="1.6"/><path d="M12 8V5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="4" r="1.2" fill="currentColor"/><circle cx="9" cy="13" r="1" fill="currentColor"/><circle cx="15" cy="13" r="1" fill="currentColor"/><path d="M9 16.5h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M3 12h2M19 12h2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
      outputFields: [{ key: "output", label: "Agent Output" }] },
    delay:    { badge: "badge-delay",    label: "Delay",         cat: "trigger", color: "#8d8d98",
      icon: '<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.7"/><path d="M12 7.5V12l3.2 2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>' },
    instant:  { badge: "badge-instant",  label: "Instant Trigger", cat: "trigger", color: "#F79106",
      icon: '<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="currentColor" fill-opacity="0.18"/>',
      outputFields: [{ key: "payload", label: "Payload" }] },
    chatInterface: { badge: "badge-chat", label: "Chat Interface", cat: "trigger", color: "#3660B7",
      icon: '<path d="M4 5h16v10.5H10L5.5 19v-3.5H4V5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="8.3" cy="10" r="1" fill="currentColor"/><circle cx="12" cy="10" r="1" fill="currentColor"/><circle cx="15.7" cy="10" r="1" fill="currentColor"/>',
      params: [
        { key: "sampleQuestion", label: "Sample Question", type: "textarea", placeholder: "Type an example question to use when testing this workflow…" },
      ],
      outputFields: [{ key: "question", label: "Question" }] },
    errorTrigger: { badge: "badge-errortrigger", label: "Error Trigger", cat: "trigger", color: "#E5484D",
      icon: '<path d="M12 9v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="16.2" r="1" fill="currentColor"/><path d="M10.6 3.7 2.9 17.3a1.8 1.8 0 0 0 1.56 2.7h15.08a1.8 1.8 0 0 0 1.56-2.7L13.4 3.7a1.8 1.8 0 0 0-2.8 0Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
      outputFields: [
        { key: "errorMessage", label: "Error Message" },
        { key: "nodeName", label: "Failed Node" },
        { key: "workflowName", label: "Workflow Name" },
        { key: "timestamp", label: "Failed At" },
      ] },
    output:   { badge: "badge-output",   label: "Output",        cat: "logic", color: "#64748B",
      icon: '<path d="M13 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 12h12M11 8l4 4-4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
      params: [
        { key: "label", label: "Label", type: "text", placeholder: "e.g. Final Response" },
        { key: "value", label: "Value", type: "textarea", required: true, mappable: true, placeholder: "Map a field from an earlier step…" },
      ],
      outputFields: [{ key: "value", label: "Output Value" }] },
    openrouter: { badge: "badge-openrouter", label: "OpenRouter Chat Completion", cat: "ai", color: "#6467F2", brand: true,
      icon: '<path fill="currentColor" d="M16.778 1.844v1.919q-.569-.026-1.138-.032-.708-.008-1.415.037c-1.93.126-4.023.728-6.149 2.237-2.911 2.066-2.731 1.95-4.14 2.75-.396.223-1.342.574-2.185.798-.841.225-1.753.333-1.751.333v4.229s.768.108 1.61.333c.842.224 1.789.575 2.185.799 1.41.798 1.228.683 4.14 2.75 2.126 1.509 4.22 2.11 6.148 2.236.88.058 1.716.041 2.555.005v1.918l7.222-4.168-7.222-4.17v2.176c-.86.038-1.611.065-2.278.021-1.364-.09-2.417-.357-3.979-1.465-2.244-1.593-2.866-2.027-3.68-2.508.889-.518 1.449-.906 3.822-2.59 1.56-1.109 2.614-1.377 3.978-1.466.667-.044 1.418-.017 2.278.02v2.176L24 6.014Z"/>',
      connection: { kind: "apikey", service: "OpenRouter", placeholder: "sk-or-v1-••••••••••••••••••••••••••", helpUrl: "https://openrouter.ai/keys" },
      params: [
        { key: "content", label: "Content", type: "textarea", required: true, mappable: true, placeholder: "Ask anything…" },
        { key: "role", label: "Role", type: "select", required: true, mappable: true, options: ["user", "system", "assistant"], default: "user" },
        { key: "model", label: "Model", type: "select", required: true, mappable: true,
          options: ["OpenAI: GPT-4o-mini", "OpenAI: GPT-4o", "Anthropic: Claude 3.5 Sonnet", "Meta: Llama 3.1 70B", "Google: Gemini 1.5 Pro"],
          default: "OpenAI: GPT-4o-mini" },
      ],
      outputFields: [{ key: "response", label: "Model Response" }] },
    gmail:    { badge: "badge-gmail",    label: "Gmail",         cat: "integrations", color: "#EA4335", brand: true,
      icon: '<path fill="currentColor" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>',
      connection: { kind: "oauth", service: "Gmail", account: "Buddy's Gmail connection (buddyai.v.01@gmail.com)", reauth: "February 28th 2027, 12:05 PM (Sun)" },
      params: [
        { key: "to", label: "To", type: "text", required: true, mappable: true, placeholder: "recipient@example.com" },
        { key: "subject", label: "Subject", type: "text", required: true, mappable: true, placeholder: "Email subject…" },
        { key: "body", label: "Body", type: "textarea", required: true, mappable: true, placeholder: "Write the email, or map content from an earlier step…" },
      ],
      outputFields: [{ key: "subject", label: "Subject" }, { key: "from", label: "From" }, { key: "body", label: "Body" }] },
    printer:  { badge: "badge-printer",  label: "Printer",       cat: "integrations", color: "#2E8B92",
      icon: '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><rect x="6" y="14" width="12" height="8" rx="1" stroke="currentColor" stroke-width="1.8"/>',
      connection: { kind: "form", service: "Printer", submitLabel: "Add Printer",
        fields: [
          { name: "name", label: "Printer Name", placeholder: "Office Laser Printer" },
          { name: "address", label: "IP Address / Network Path", placeholder: "192.168.1.42" },
        ] },
      outputFields: [{ key: "status", label: "Print Status" }] },
    mysql:    { badge: "badge-mysql",    label: "MySQL",         cat: "integrations", color: "#00618A", brand: true,
      icon: '<path fill="currentColor" d="M16.405 5.501c-.115 0-.193.014-.274.033v.013h.014c.054.104.146.18.214.273.054.107.1.214.154.32l.014-.015c.094-.066.14-.172.14-.333-.04-.047-.046-.094-.08-.14-.04-.067-.126-.1-.18-.153zM5.77 18.695h-.927a50.854 50.854 0 00-.27-4.41h-.008l-1.41 4.41H2.45l-1.4-4.41h-.01a72.892 72.892 0 00-.195 4.41H0c.055-1.966.192-3.81.41-5.53h1.15l1.335 4.064h.008l1.347-4.064h1.095c.242 2.015.384 3.86.428 5.53zm4.017-4.08c-.378 2.045-.876 3.533-1.492 4.46-.482.716-1.01 1.073-1.583 1.073-.153 0-.34-.046-.566-.138v-.494c.11.017.24.026.386.026.268 0 .483-.075.647-.222.197-.18.295-.382.295-.605 0-.155-.077-.47-.23-.944L6.23 14.615h.91l.727 2.36c.164.536.233.91.205 1.123.4-1.064.678-2.227.835-3.483zm12.325 4.08h-2.63v-5.53h.885v4.85h1.745zm-3.32.135l-1.016-.5c.09-.076.177-.158.255-.25.433-.506.648-1.258.648-2.253 0-1.83-.718-2.746-2.155-2.746-.704 0-1.254.232-1.65.697-.43.508-.646 1.256-.646 2.245 0 .972.19 1.686.574 2.14.35.41.877.615 1.583.615.264 0 .506-.033.725-.098l1.325.772.36-.622zM15.5 17.588c-.225-.36-.337-.94-.337-1.736 0-1.393.424-2.09 1.27-2.09.443 0 .77.167.977.5.224.362.336.936.336 1.723 0 1.404-.424 2.108-1.27 2.108-.445 0-.77-.167-.978-.5zm-1.658-.425c0 .47-.172.856-.516 1.156-.344.3-.803.45-1.384.45-.543 0-1.064-.172-1.573-.515l.237-.476c.438.22.833.328 1.19.328.332 0 .593-.073.783-.22a.754.754 0 00.3-.615c0-.33-.23-.61-.648-.845-.388-.213-1.163-.657-1.163-.657-.422-.307-.632-.636-.632-1.177 0-.45.157-.81.47-1.085.315-.278.72-.415 1.22-.415.512 0 .98.136 1.4.41l-.213.476a2.726 2.726 0 00-1.064-.23c-.283 0-.502.068-.654.206a.685.685 0 00-.248.524c0 .328.234.61.666.85.393.215 1.187.67 1.187.67.433.305.648.63.648 1.168zm9.382-5.852c-.535-.014-.95.04-1.297.188-.1.04-.26.04-.274.167.055.053.063.14.11.214.08.134.218.313.346.407.14.11.28.216.427.31.26.16.555.255.81.416.145.094.293.213.44.313.073.05.12.14.214.172v-.02c-.046-.06-.06-.147-.105-.214-.067-.067-.134-.127-.2-.193a3.223 3.223 0 00-.695-.675c-.214-.146-.682-.35-.77-.595l-.013-.014c.146-.013.32-.066.46-.106.227-.06.435-.047.67-.106.106-.027.213-.06.32-.094v-.06c-.12-.12-.21-.283-.334-.395a8.867 8.867 0 00-1.104-.823c-.21-.134-.476-.22-.697-.334-.08-.04-.214-.06-.26-.127-.12-.146-.19-.34-.275-.514a17.69 17.69 0 01-.547-1.163c-.12-.262-.193-.523-.34-.763-.69-1.137-1.437-1.826-2.586-2.5-.247-.14-.543-.2-.856-.274-.167-.008-.334-.02-.5-.027-.11-.047-.216-.174-.31-.235-.38-.24-1.364-.76-1.644-.072-.18.434.267.862.422 1.082.115.153.26.328.34.5.047.116.06.235.107.356.106.294.207.622.347.897.073.14.153.287.247.413.054.073.146.107.167.227-.094.136-.1.334-.154.5-.24.757-.146 1.693.194 2.25.107.166.362.534.703.393.3-.12.234-.5.32-.835.02-.08.007-.133.048-.187v.015c.094.188.188.367.274.555.206.328.566.668.867.895.16.12.287.328.487.402v-.02h-.015c-.043-.058-.1-.086-.154-.133a3.445 3.445 0 01-.35-.4 8.76 8.76 0 01-.747-1.218c-.11-.21-.202-.436-.29-.643-.04-.08-.04-.2-.107-.24-.1.146-.247.273-.32.453-.127.288-.14.642-.188 1.01-.027.007-.014 0-.027.014-.214-.052-.287-.274-.367-.46-.2-.475-.233-1.238-.06-1.785.047-.14.247-.582.167-.716-.042-.127-.174-.2-.247-.303a2.478 2.478 0 01-.24-.427c-.16-.374-.24-.788-.414-1.162-.08-.173-.22-.354-.334-.513-.127-.18-.267-.307-.368-.52-.033-.073-.08-.194-.027-.274.014-.054.042-.075.094-.09.088-.072.335.022.422.062.247.1.455.194.662.334.094.066.195.193.315.226h.14c.214.047.455.014.655.073.355.114.675.28.962.46a5.953 5.953 0 012.085 2.286c.08.154.115.295.188.455.14.33.313.663.455.982.14.315.275.636.476.897.1.14.502.213.682.286.133.06.34.115.46.188.23.14.454.3.67.454.11.076.443.243.463.378z"/>',
      connection: { kind: "form", service: "MySQL", submitLabel: "Add Database",
        fields: [
          { name: "host", label: "Host", placeholder: "db.oasysflow.com" },
          { name: "port", label: "Port", placeholder: "3306" },
          { name: "database", label: "Database", placeholder: "production" },
          { name: "user", label: "Username", placeholder: "root" },
          { name: "password", label: "Password", placeholder: "••••••••", type: "password" },
        ] },
      params: [
        { key: "query", label: "SQL Query", type: "textarea", required: true, mappable: true, placeholder: "SELECT * FROM leads WHERE email = ?…" },
      ],
      outputFields: [{ key: "rows", label: "Query Result" }] },
    ollama:   { badge: "badge-ollama",   label: "Ollama",        cat: "ai", color: "#1a1a1a", brand: true,
      icon: '<path fill="currentColor" d="M16.361 10.26a.894.894 0 0 0-.558.47l-.072.148.001.207c0 .193.004.217.059.353.076.193.152.312.291.448.24.238.51.3.872.205a.86.86 0 0 0 .517-.436.752.752 0 0 0 .08-.498c-.064-.453-.33-.782-.724-.897a1.06 1.06 0 0 0-.466 0zm-9.203.005c-.305.096-.533.32-.65.639a1.187 1.187 0 0 0-.06.52c.057.309.31.59.598.667.362.095.632.033.872-.205.14-.136.215-.255.291-.448.055-.136.059-.16.059-.353l.001-.207-.072-.148a.894.894 0 0 0-.565-.472 1.02 1.02 0 0 0-.474.007Zm4.184 2c-.131.071-.223.25-.195.383.031.143.157.288.353.407.105.063.112.072.117.136.004.038-.01.146-.029.243-.02.094-.036.194-.036.222.002.074.07.195.143.253.064.052.076.054.255.059.164.005.198.001.264-.03.169-.082.212-.234.15-.525-.052-.243-.042-.28.087-.355.137-.08.281-.219.324-.314a.365.365 0 0 0-.175-.48.394.394 0 0 0-.181-.033c-.126 0-.207.03-.355.124l-.085.053-.053-.032c-.219-.13-.259-.145-.391-.143a.396.396 0 0 0-.193.032zm.39-2.195c-.373.036-.475.05-.654.086-.291.06-.68.195-.951.328-.94.46-1.589 1.226-1.787 2.114-.04.176-.045.234-.045.53 0 .294.005.357.043.524.264 1.16 1.332 2.017 2.714 2.173.3.033 1.596.033 1.896 0 1.11-.125 2.064-.727 2.493-1.571.114-.226.169-.372.22-.602.039-.167.044-.23.044-.523 0-.297-.005-.355-.045-.531-.288-1.29-1.539-2.304-3.072-2.497a6.873 6.873 0 0 0-.855-.031zm.645.937a3.283 3.283 0 0 1 1.44.514c.223.148.537.458.671.662.166.251.26.508.303.82.02.143.01.251-.043.482-.08.345-.332.705-.672.957a3.115 3.115 0 0 1-.689.348c-.382.122-.632.144-1.525.138-.582-.006-.686-.01-.853-.042-.57-.107-1.022-.334-1.35-.68-.264-.28-.385-.535-.45-.946-.03-.192.025-.509.137-.776.136-.326.488-.73.836-.963.403-.269.934-.46 1.422-.512.187-.02.586-.02.773-.002zm-5.503-11a1.653 1.653 0 0 0-.683.298C5.617.74 5.173 1.666 4.985 2.819c-.07.436-.119 1.04-.119 1.503 0 .544.064 1.24.155 1.721.02.107.031.202.023.208a8.12 8.12 0 0 1-.187.152 5.324 5.324 0 0 0-.949 1.02 5.49 5.49 0 0 0-.94 2.339 6.625 6.625 0 0 0-.023 1.357c.091.78.325 1.438.727 2.04l.13.195-.037.064c-.269.452-.498 1.105-.605 1.732-.084.496-.095.629-.095 1.294 0 .67.009.803.088 1.266.095.555.288 1.143.503 1.534.071.128.243.393.264.407.007.003-.014.067-.046.141a7.405 7.405 0 0 0-.548 1.873c-.062.417-.071.552-.071.991 0 .56.031.832.148 1.279L3.42 24h1.478l-.05-.091c-.297-.552-.325-1.575-.068-2.597.117-.472.25-.819.498-1.296l.148-.29v-.177c0-.165-.003-.184-.057-.293a.915.915 0 0 0-.194-.25 1.74 1.74 0 0 1-.385-.543c-.424-.92-.506-2.286-.208-3.451.124-.486.329-.918.544-1.154a.787.787 0 0 0 .223-.531c0-.195-.07-.355-.224-.522a3.136 3.136 0 0 1-.817-1.729c-.14-.96.114-2.005.69-2.834.563-.814 1.353-1.336 2.237-1.475.199-.033.57-.028.776.01.226.04.367.028.512-.041.179-.085.268-.19.374-.431.093-.215.165-.333.36-.576.234-.29.46-.489.822-.729.413-.27.884-.467 1.352-.561.17-.035.25-.04.569-.04.319 0 .398.005.569.04a4.07 4.07 0 0 1 1.914.997c.117.109.398.457.488.602.034.057.095.177.132.267.105.241.195.346.374.43.14.068.286.082.503.045.343-.058.607-.053.943.016 1.144.23 2.14 1.173 2.581 2.437.385 1.108.276 2.267-.296 3.153-.097.15-.193.27-.333.419-.301.322-.301.722-.001 1.053.493.539.801 1.866.708 3.036-.062.772-.26 1.463-.533 1.854a2.096 2.096 0 0 1-.224.258.916.916 0 0 0-.194.25c-.054.109-.057.128-.057.293v.178l.148.29c.248.476.38.823.498 1.295.253 1.008.231 2.01-.059 2.581a.845.845 0 0 0-.044.098c0 .006.329.009.732.009h.73l.02-.074.036-.134c.019-.076.057-.3.088-.516.029-.217.029-1.016 0-1.258-.11-.875-.295-1.57-.597-2.226-.032-.074-.053-.138-.046-.141.008-.005.057-.074.108-.152.376-.569.607-1.284.724-2.228.031-.26.031-1.378 0-1.628-.083-.645-.182-1.082-.348-1.525a6.083 6.083 0 0 0-.329-.7l-.038-.064.131-.194c.402-.604.636-1.262.727-2.04a6.625 6.625 0 0 0-.024-1.358 5.512 5.512 0 0 0-.939-2.339 5.325 5.325 0 0 0-.95-1.02 8.097 8.097 0 0 1-.186-.152.692.692 0 0 1 .023-.208c.208-1.087.201-2.443-.017-3.503-.19-.924-.535-1.658-.98-2.082-.354-.338-.716-.482-1.15-.455-.996.059-1.8 1.205-2.116 3.01a6.805 6.805 0 0 0-.097.726c0 .036-.007.066-.015.066a.96.96 0 0 1-.149-.078A4.857 4.857 0 0 0 12 3.03c-.832 0-1.687.243-2.456.698a.958.958 0 0 1-.148.078c-.008 0-.015-.03-.015-.066a6.71 6.71 0 0 0-.097-.725C8.997 1.392 8.337.319 7.46.048a2.096 2.096 0 0 0-.585-.041Zm.293 1.402c.248.197.523.759.682 1.388.03.113.06.244.069.292.007.047.026.152.041.233.067.365.098.76.102 1.24l.002.475-.12.175-.118.178h-.278c-.324 0-.646.041-.954.124l-.238.06c-.033.007-.038-.003-.057-.144a8.438 8.438 0 0 1 .016-2.323c.124-.788.413-1.501.696-1.711.067-.05.079-.049.157.013zm9.825-.012c.17.126.358.46.498.888.28.854.36 2.028.212 3.145-.019.14-.024.151-.057.144l-.238-.06a3.693 3.693 0 0 0-.954-.124h-.278l-.119-.178-.119-.175.002-.474c.004-.669.066-1.19.214-1.772.157-.623.434-1.185.68-1.382.078-.062.09-.063.159-.012z"/>',
      connection: { kind: "ollama", service: "Ollama", defaultHost: "http://localhost", defaultPort: "11434" },
      params: [
        { key: "prompt", label: "Prompt", type: "textarea", required: true, mappable: true, placeholder: "Ask the model anything, or map a field from an earlier step…" },
      ],
      outputFields: [{ key: "response", label: "Model Response" }] },
  };

  // Session-only store of named credential profiles (mock — no backend).
  // credentialStore[type] = [{ id, name, values: {...} }, ...] — supports multiple aliases per node type.
  const credentialStore = {
    gmail: [{ id: "default", name: "Buddy's Gmail connection (buddyai.v.01@gmail.com)", values: {} }],
    slack: [{ id: "default", name: "Oasys Flow Workspace (#new-leads)", values: {} }],
    sheet: [{ id: "default", name: "buddyai.v.01@gmail.com", values: {} }],
    ollama: [{ id: "default", name: "Local Ollama (localhost:11434)", values: { host: "http://localhost", port: "11434" } }],
  };
  const credSelectedId = Object.create(null); // credSelectedId[type] = which credential id the picker currently shows
  let credIdCounter = 0;

  const nodeData = Object.create(null);
  let edgeList = [];
  const SVG_NS = "http://www.w3.org/2000/svg";
  const edgesDefs = edgesSvg.querySelector("defs");
  let pendingConnectFrom = null;
  let pendingConnectBranch = null;

  function nodeColor(id) {
    const data = nodeData[id];
    const meta = data && nodeTypeLibrary[data.type];
    return (meta && meta.color) || "#F79106";
  }

  // A node's output branches are its type's static branches (Router/If-Else) plus, per instance,
  // a synthetic red "Error" branch when Settings > On Error is set to "use error output" (§6).
  function getNodeBranches(id) {
    const data = nodeData[id];
    const meta = data && nodeTypeLibrary[data.type];
    const branches = (meta && meta.branches) ? meta.branches.slice() : [];
    if (data && data.settings && data.settings.onError === "continueError") {
      branches.push({ key: "__error__", label: "Error", hint: "", isError: true });
    }
    return branches;
  }

  function nodeAnchor(id, side, branchKey) {
    const el = document.getElementById(id);
    const x = parseFloat(el.dataset.x);
    const y = parseFloat(el.dataset.y);
    const w = el.offsetWidth || 196;
    const h = el.offsetHeight || 58;
    if (side === "left") return { x, y: y + h / 2 };
    const branches = getNodeBranches(id);
    if (branches.length) {
      const n = branches.length;
      const idx = branchKey ? branches.findIndex(b => b.key === branchKey) : 0;
      const offset = (Math.max(idx, 0) - (n - 1) / 2) * 34;
      return { x: x + w, y: y + h / 2 + offset };
    }
    return { x: x + w, y: y + h / 2 };
  }

  function edgeGradientId(from, to) { return "edgegrad-" + from + "-" + to; }

  function ensureEdgeGradient(from, to) {
    const gid = edgeGradientId(from, to);
    let grad = document.getElementById(gid);
    if (!grad) {
      grad = document.createElementNS(SVG_NS, "linearGradient");
      grad.setAttribute("id", gid);
      grad.setAttribute("gradientUnits", "userSpaceOnUse");
      const stop1 = document.createElementNS(SVG_NS, "stop");
      stop1.setAttribute("offset", "0%");
      const stop2 = document.createElementNS(SVG_NS, "stop");
      stop2.setAttribute("offset", "100%");
      grad.appendChild(stop1);
      grad.appendChild(stop2);
      edgesDefs.appendChild(grad);
    }
    grad.children[0].setAttribute("stop-color", nodeColor(from));
    grad.children[1].setAttribute("stop-color", nodeColor(to));
    return gid;
  }

  function redrawEdges() {
    $$(".edge-hit", edgesSvg).forEach(hitEl => {
      const from = hitEl.dataset.from, to = hitEl.dataset.to, branch = hitEl.dataset.branch || "";
      if (!document.getElementById(from) || !document.getElementById(to)) return;
      const start = nodeAnchor(from, "right", branch);
      const end = nodeAnchor(to, "left");
      const dx = Math.max(40, (end.x - start.x) / 2);
      const d = `M ${start.x},${start.y} C ${start.x + dx},${start.y} ${end.x - dx},${end.y} ${end.x},${end.y}`;
      hitEl.setAttribute("d", d);
      const visEl = edgesSvg.querySelector(`.edge[data-from="${from}"][data-to="${to}"][data-branch="${branch}"]`);
      const gid = ensureEdgeGradient(from, to);
      if (visEl) { visEl.setAttribute("d", d); visEl.setAttribute("stroke", `url(#${gid})`); }
      const grad = document.getElementById(gid);
      grad.setAttribute("x1", start.x); grad.setAttribute("y1", start.y);
      grad.setAttribute("x2", end.x); grad.setAttribute("y2", end.y);
    });
    updateConnectorStubs();
    schedulePersist();
  }

  function createEdgePath(from, to, branch) {
    branch = branch || "";
    const hit = document.createElementNS(SVG_NS, "path");
    hit.setAttribute("class", "edge-hit");
    hit.setAttribute("data-from", from);
    hit.setAttribute("data-to", to);
    hit.setAttribute("data-branch", branch);
    hit.addEventListener("click", (e) => openEdgeMenu(e, from, to));
    edgesSvg.appendChild(hit);

    const vis = document.createElementNS(SVG_NS, "path");
    vis.setAttribute("class", "edge");
    vis.setAttribute("data-from", from);
    vis.setAttribute("data-to", to);
    vis.setAttribute("data-branch", branch);
    edgesSvg.appendChild(vis);

    edgeList.push({ from, to, branch: branch || null });
  }

  function removeEdge(from, to) {
    edgesSvg.querySelectorAll(`.edge[data-from="${from}"][data-to="${to}"], .edge-hit[data-from="${from}"][data-to="${to}"]`)
      .forEach(el => el.remove());
    const gradEl = document.getElementById(edgeGradientId(from, to));
    if (gradEl) gradEl.remove();
    edgeList = edgeList.filter(e => !(e.from === from && e.to === to));
  }

  /* ---------- Connector points: left "receiver" dot (input) + right "+" stub(s) (output, loose ends only) ---------- */
  function makeConnectorStub(anchor, id, branchKey, title, isError) {
    const stub = document.createElement("button");
    stub.className = "node-connector-stub" + (isError ? " is-error" : "");
    stub.style.left = anchor.x + "px";
    stub.style.top = anchor.y + "px";
    stub.style.background = isError ? "var(--danger)" : nodeColor(id);
    stub.title = title;
    stub.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="white" stroke-width="2.6" stroke-linecap="round"/></svg>';
    stub.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      e.preventDefault();
      connectDrag = { from: id, branch: branchKey || null, tempPath: null, ghostBtn: null, moved: false };
      stub.style.display = "none";
    });
    canvasInner.appendChild(stub);
  }

  function updateConnectorStubs() {
    $$(".node-connector-stub, .node-connector-receiver, .node-branch-label", canvasInner).forEach(s => s.remove());
    $$(".node", canvasInner).forEach(nodeEl => {
      const id = nodeEl.id;
      const data = nodeData[id];
      if (!data) return;
      const meta = nodeTypeLibrary[data.type];
      const x = parseFloat(nodeEl.dataset.x);
      const y = parseFloat(nodeEl.dataset.y);
      const h = nodeEl.offsetHeight || 58;

      const receiver = document.createElement("span");
      receiver.className = "node-connector-receiver";
      receiver.style.left = x + "px";
      receiver.style.top = (y + h / 2) + "px";
      receiver.style.background = nodeColor(id);
      receiver.title = "Input";
      canvasInner.appendChild(receiver);

      const branches = getNodeBranches(id);
      if (branches.length) {
        branches.forEach(branch => {
          const anchor = nodeAnchor(id, "right", branch.key);
          const chip = document.createElement("div");
          chip.className = "node-branch-label" + (branch.isError ? " is-error" : "");
          chip.style.left = (anchor.x + 16) + "px";
          chip.style.top = anchor.y + "px";
          chip.innerHTML = branch.hint
            ? `<span class="branch-num">${branch.label}</span><span class="branch-sep">|</span><span class="branch-hint">${branch.hint}</span>`
            : `<span class="branch-else${branch.isError ? " is-error" : ""}">${branch.label}</span>`;
          canvasInner.appendChild(chip);

          if (edgeList.some(e => e.from === id && e.branch === branch.key)) return;
          makeConnectorStub(anchor, id, branch.key, `Drag to connect "${branch.label}"`, branch.isError);
        });
        return;
      }

      if (edgeList.some(e => e.from === id)) return;
      const anchor = nodeAnchor(id, "right");
      makeConnectorStub(anchor, id, null, "Drag to connect, or click to add a node");
    });
  }

  /* ---------- Drag-to-connect: pull a line from a stub onto another node ---------- */
  let connectDrag = null;

  function clientToCanvasPoint(clientX, clientY) {
    const rect = canvasInner.getBoundingClientRect();
    return { x: (clientX - rect.left) / currentZoom, y: (clientY - rect.top) / currentZoom };
  }

  function findNodeUnderPoint(clientX, clientY, excludeId) {
    const els = document.elementsFromPoint(clientX, clientY);
    const nodeEl = els.find(el => el.classList && el.classList.contains("node") && el.id !== excludeId);
    return nodeEl ? nodeEl.id : null;
  }

  window.addEventListener("mousemove", (e) => {
    if (!connectDrag) return;
    connectDrag.moved = true;
    if (!connectDrag.tempPath) {
      const p = document.createElementNS(SVG_NS, "path");
      p.setAttribute("class", "edge-temp");
      edgesSvg.appendChild(p);
      connectDrag.tempPath = p;
    }
    if (!connectDrag.ghostBtn) {
      const g = document.createElement("div");
      g.className = "node-connector-stub node-connector-ghost";
      g.style.background = nodeColor(connectDrag.from);
      g.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="white" stroke-width="2.6" stroke-linecap="round"/></svg>';
      canvasInner.appendChild(g);
      connectDrag.ghostBtn = g;
    }
    const start = nodeAnchor(connectDrag.from, "right", connectDrag.branch);
    const end = clientToCanvasPoint(e.clientX, e.clientY);
    const dx = Math.max(40, (end.x - start.x) / 2);
    connectDrag.tempPath.setAttribute("d", `M ${start.x},${start.y} C ${start.x + dx},${start.y} ${end.x - dx},${end.y} ${end.x},${end.y}`);
    connectDrag.tempPath.setAttribute("stroke", nodeColor(connectDrag.from));
    connectDrag.ghostBtn.style.left = end.x + "px";
    connectDrag.ghostBtn.style.top = end.y + "px";

    const hoverId = findNodeUnderPoint(e.clientX, e.clientY, connectDrag.from);
    $$(".node").forEach(n => n.classList.toggle("is-drop-target", n.id === hoverId));
  });

  window.addEventListener("mouseup", (e) => {
    if (!connectDrag) return;
    const { from, branch, tempPath, ghostBtn, moved } = connectDrag;
    if (tempPath) tempPath.remove();
    if (ghostBtn) ghostBtn.remove();
    $$(".node").forEach(n => n.classList.remove("is-drop-target"));
    connectDrag = null;

    let targetFound = false;
    if (moved) {
      const targetId = findNodeUnderPoint(e.clientX, e.clientY, from);
      if (targetId) {
        targetFound = true;
        if (!edgeList.some(ed => ed.from === from && ed.to === targetId && (ed.branch || null) === (branch || null))) {
          pushUndo();
          createEdgePath(from, targetId, branch);
        }
      }
    }
    // Always rebuild connector stubs/receivers so the origin "+" reappears (or stays gone if now connected).
    redrawEdges();

    if (!targetFound) {
      // Dropped on empty canvas, or a plain click with no drag — fall back to add+connect.
      pendingConnectFrom = from;
      pendingConnectBranch = branch || null;
      openAddNodePopup(null);
    }
  });

  function clearCanvas() {
    $$(".node, .node-connector-stub, .node-connector-receiver, .node-branch-label", canvasInner).forEach(n => n.remove());
    $$(".edge, .edge-hit", edgesSvg).forEach(e => e.remove());
    $$('linearGradient[id^="edgegrad-"]', edgesDefs).forEach(g => g.remove());
    edgeList = [];
    Object.keys(nodeData).forEach(k => delete nodeData[k]);
    selectedNodeId = null;
    pendingConnectFrom = null;
    pendingConnectBranch = null;
    nodeCounter = 0;
    showEmptyState(true);
  }

  /* ---------- Edge context menu (click the link between two nodes) ---------- */
  const edgeMenuLabels = {
    filter: "Filter", unlink: "Unlink modules", router: "Router", module: "Module", note: "Note",
  };
  let edgeMenuTarget = null; // { from, to }
  const edgeMenuEl = $("#edgeMenu");

  function openEdgeMenu(e, from, to) {
    e.stopPropagation();
    edgeMenuTarget = { from, to };
    const menuW = 220, menuH = 260;
    const x = Math.min(e.clientX, window.innerWidth - menuW - 12);
    const y = Math.min(e.clientY, window.innerHeight - menuH - 12);
    edgeMenuEl.style.left = x + "px";
    edgeMenuEl.style.top = y + "px";
    edgeMenuEl.classList.add("is-open");
  }
  function closeEdgeMenu() {
    edgeMenuEl.classList.remove("is-open");
    edgeMenuTarget = null;
  }

  function selectBranchFrom(startId) {
    const visited = new Set([startId]);
    const queue = [startId];
    while (queue.length) {
      const cur = queue.shift();
      edgeList.filter(e => e.from === cur).forEach(e => {
        if (!visited.has(e.to)) { visited.add(e.to); queue.push(e.to); }
      });
    }
    $$(".node").forEach(n => n.classList.toggle("is-selected", visited.has(n.id)));
  }

  edgeMenuEl.addEventListener("click", (e) => {
    const item = e.target.closest(".edge-menu-item");
    if (!item || !edgeMenuTarget) return;
    const action = item.dataset.menuAction;
    const { from, to } = edgeMenuTarget;
    if (action === "unlink") {
      pushUndo();
      removeEdge(from, to);
      redrawEdges();
      toast("Modules unlinked");
    } else if (action === "select-branch") {
      selectBranchFrom(to);
      toast("Branch selected");
    } else {
      toast(`${edgeMenuLabels[action] || "That"} — coming soon`);
    }
    closeEdgeMenu();
  });
  document.addEventListener("mousedown", (e) => {
    if (edgeMenuEl.classList.contains("is-open") && !edgeMenuEl.contains(e.target)) closeEdgeMenu();
  });

  /* ---------- Node "configured" checkmark — real, tied to whether at least one named credential exists ---------- */
  function nodeIsConfigured(type) {
    const meta = nodeTypeLibrary[type];
    if (!meta || !meta.connection) return true;
    return !!(credentialStore[type] && credentialStore[type].length > 0);
  }

  function refreshNodeCheckmarks(onlyType) {
    $$(".node", canvasInner).forEach(el => {
      const data = nodeData[el.id];
      if (!data) return;
      if (onlyType && data.type !== onlyType) return;
      const shouldShow = nodeIsConfigured(data.type);
      let check = el.querySelector(".node-check");
      if (shouldShow && !check) {
        check = document.createElement("span");
        check.className = "node-check";
        check.textContent = "✓";
        check.title = "Connection configured";
        el.appendChild(check);
      } else if (!shouldShow && check) {
        check.remove();
      }
    });
  }

  function showEmptyState(show) {
    let el = $("#canvasEmptyState");
    if (show) {
      if (!el) {
        el = document.createElement("div");
        el.id = "canvasEmptyState";
        el.className = "canvas-empty-state";
        el.innerHTML = `
          <div class="canvas-empty-icon">
            <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </div>
          <h3>Blank canvas</h3>
          <p>Click the <strong>+</strong> button below to add your first node.</p>
        `;
        $(".canvas").appendChild(el);
      }
      el.style.display = "flex";
    } else if (el) {
      el.style.display = "none";
    }
  }

  function adjustColor(hex, amt) {
    let col = hex.replace("#", "");
    if (col.length === 3) col = col.split("").map(c => c + c).join("");
    const num = parseInt(col, 16);
    let r = (num >> 16) + amt, g = ((num >> 8) & 0x00ff) + amt, b = (num & 0x0000ff) + amt;
    r = Math.max(Math.min(255, r), 0);
    g = Math.max(Math.min(255, g), 0);
    b = Math.max(Math.min(255, b), 0);
    return "#" + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
  }

  function nodeGradient(color) {
    return `linear-gradient(135deg, ${adjustColor(color, 32)} 0%, ${color} 55%, ${adjustColor(color, -38)} 100%)`;
  }

  function createNode(type, x, y, opts) {
    const meta = nodeTypeLibrary[type];
    if (!meta) return null;
    opts = opts || {};
    let id = opts.id;
    if (!id) {
      nodeCounter += 1;
      id = "node-" + Date.now() + "-" + nodeCounter;
    }
    const isAgent = meta.special === "agent";
    const sub = opts.sub || (isAgent ? "Tools Agent" : "Untitled");
    const desc = opts.desc || `Configure this ${meta.label} node.`;
    const el = document.createElement("div");
    el.id = id;
    el.dataset.x = x;
    el.dataset.y = y;
    el.style.left = x + "px";
    el.style.top = y + "px";

    if (isAgent) {
      el.className = "node node-ai-agent";
      el.innerHTML = `
        <div class="node-badge ${meta.badge}"><svg viewBox="0 0 24 24" fill="none">${meta.icon}</svg></div>
        <div class="node-text"><span class="node-ai-title">${meta.label}</span><span class="node-ai-sub">${sub}</span></div>
        <div class="node-ai-ports">
          <span class="node-ai-port" title="Chat Model"></span>
          <span class="node-ai-port" title="Memory"></span>
          <span class="node-ai-port" title="Tool"></span>
        </div>
      `;
    } else {
      el.className = "node node-color-fill";
      el.style.background = nodeGradient(meta.color);
      el.innerHTML = `
        <div class="node-badge ${meta.badge}"><svg viewBox="0 0 24 24" fill="none">${meta.icon}</svg></div>
        <div class="node-text"><span class="node-step">${meta.label}</span><span class="node-name">${sub}</span></div>
      `;
    }
    canvasInner.appendChild(el);
    const params = {};
    (meta.params || []).forEach(p => { params[p.key] = { value: p.default || "", mapped: false }; });
    const settings = opts.settings || defaultNodeSettings();
    nodeData[id] = { id, type, name: meta.label, sub, desc, x, y, params, credentialId: opts.credentialId || null, settings };
    wireNode(el);
    showEmptyState(false);
    refreshNodeCheckmarks(type);
    return id;
  }

  function addNode(type, x, y) {
    return createNode(type, x, y);
  }

  /* ---------- Undo / Redo — real snapshot-based history of the current canvas ---------- */
  let undoStack = [];
  let redoStack = [];

  function snapshotCanvas() {
    return {
      nodes: $$(".node", canvasInner).map(el => {
        const data = nodeData[el.id] || {};
        return { id: el.id, type: data.type, x: parseFloat(el.dataset.x), y: parseFloat(el.dataset.y), sub: data.sub, desc: data.desc };
      }),
      edges: edgeList.map(e => ({ from: e.from, to: e.to, branch: e.branch })),
    };
  }

  function restoreCanvasSnapshot(snap) {
    clearCanvas();
    snap.nodes.forEach(n => createNode(n.type, n.x, n.y, { id: n.id, sub: n.sub, desc: n.desc }));
    snap.edges.forEach(e => createEdgePath(e.from, e.to, e.branch));
    redrawEdges();
  }

  function updateUndoRedoButtons() {
    [$("#undoBtn"), $("#fbUndo")].forEach(b => { if (b) b.disabled = undoStack.length === 0; });
    [$("#redoBtn"), $("#fbRedo")].forEach(b => { if (b) b.disabled = redoStack.length === 0; });
  }

  function pushUndo() {
    undoStack.push(snapshotCanvas());
    if (undoStack.length > 50) undoStack.shift();
    redoStack = [];
    updateUndoRedoButtons();
  }

  function resetHistory() {
    undoStack = [];
    redoStack = [];
    updateUndoRedoButtons();
  }

  function doUndo() {
    if (undoStack.length === 0) return;
    const prev = undoStack.pop();
    redoStack.push(snapshotCanvas());
    restoreCanvasSnapshot(prev);
    updateUndoRedoButtons();
    schedulePersist();
  }

  function doRedo() {
    if (redoStack.length === 0) return;
    const next = redoStack.pop();
    undoStack.push(snapshotCanvas());
    restoreCanvasSnapshot(next);
    updateUndoRedoButtons();
    schedulePersist();
  }

  /* ---------- Node selection + drag + click-to-open-modal ---------- */
  let dragState = null;
  let currentZoom = 1;

  function wireNode(node) {
    node.addEventListener("mousedown", (e) => {
      dragState = {
        node,
        startX: e.clientX,
        startY: e.clientY,
        origX: parseFloat(node.dataset.x),
        origY: parseFloat(node.dataset.y),
        moved: false,
        snapshotted: false,
      };
      e.preventDefault();
    });
  }

  window.addEventListener("mousemove", (e) => {
    if (!dragState) return;
    const dx = (e.clientX - dragState.startX) / currentZoom;
    const dy = (e.clientY - dragState.startY) / currentZoom;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      if (!dragState.snapshotted) { pushUndo(); dragState.snapshotted = true; }
      dragState.moved = true;
      dragState.node.classList.add("is-dragging");
    }
    if (!dragState.moved) return;
    const nx = Math.max(0, dragState.origX + dx);
    const ny = Math.max(0, dragState.origY + dy);
    dragState.node.dataset.x = nx;
    dragState.node.dataset.y = ny;
    dragState.node.style.left = nx + "px";
    dragState.node.style.top = ny + "px";
    redrawEdges();
  });

  window.addEventListener("mouseup", () => {
    if (!dragState) return;
    const { node, moved } = dragState;
    node.classList.remove("is-dragging");
    if (moved && nodeData[node.id]) {
      nodeData[node.id].x = parseFloat(node.dataset.x);
      nodeData[node.id].y = parseFloat(node.dataset.y);
    }
    if (!moved) {
      selectNode(node.id);
      openNodeModal(node.id);
    }
    dragState = null;
  });

  function selectNode(id) {
    $$(".node").forEach(n => n.classList.toggle("is-selected", n.id === id));
    selectedNodeId = id;
  }

  /* ---------- Node editor modal (n8n-style popup) ---------- */
  const overlay = $("#nodeModalOverlay");
  const modalTitle = $("#modalTitle");
  const modalSub = $("#modalSub");
  const modalBadge = $("#modalBadge");
  const modalDesc = $("#modalDesc");
  const modalConnectionSlot = $("#modalConnectionSlot");

  function credFieldsHtml(conn, values) {
    values = values || {};
    if (conn.kind === "oauth") {
      return `<p class="conn-help">Mock OAuth sign-in — name this connection above and save to simulate linking a ${conn.service} account.</p>`;
    }
    if (conn.kind === "apikey") {
      return `
        <label class="field">
          <span>${conn.service} API Key</span>
          <div class="conn-apikey-row">
            <input type="password" class="conn-form-input" data-field="key" placeholder="${conn.placeholder}" value="${values.key || ""}" />
            <button type="button" class="conn-apikey-toggle" data-action="toggle-key-visibility" title="Show/hide">
              <svg viewBox="0 0 24 24" fill="none"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/></svg>
            </button>
          </div>
        </label>
        <p class="conn-help">Get a key from the <a href="${conn.helpUrl}" target="_blank" rel="noopener">${conn.service} dashboard</a>.</p>`;
    }
    if (conn.kind === "form") {
      return `<div class="conn-form-fields">${conn.fields.map(f => `
        <label class="field">
          <span>${f.label}</span>
          <input type="${f.type || "text"}" class="conn-form-input" data-field="${f.name}" placeholder="${f.placeholder || ""}" value="${values[f.name] || ""}" />
        </label>`).join("")}</div>`;
    }
    if (conn.kind === "ollama") {
      const host = values.host || conn.defaultHost;
      const port = values.port || conn.defaultPort;
      const modelOptions = values.model
        ? `<option value="${values.model}" selected>${values.model}</option>`
        : `<option value="">Click "Fetch Models" to load…</option>`;
      return `
        <div class="field-row">
          <label class="field"><span>Host</span><input type="text" class="conn-form-input" data-field="host" value="${host}" /></label>
          <label class="field"><span>Port</span><input type="text" class="conn-form-input" data-field="port" value="${port}" /></label>
        </div>
        <div class="conn-ollama-fetch-row">
          <button type="button" class="conn-add-btn" data-action="fetch-ollama-models">
            <svg viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M18 4v4h-4M6 20v-4h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Fetch Available Models
          </button>
          <span class="conn-ollama-status" data-role="ollama-status"></span>
        </div>
        <label class="field">
          <span>Model</span>
          <select class="conn-form-input" data-field="model">${modelOptions}</select>
        </label>
        <p class="conn-help">Ollama listens locally on its default port. Keep it running, and if the browser blocks the request, set <code>OLLAMA_ORIGINS=*</code> before starting it.</p>`;
    }
    return "";
  }

  function renderConnectionBlock(type, meta, container, nodeId) {
    container = container || modalConnectionSlot;
    const conn = meta.connection;
    if (!conn) { container.innerHTML = ""; return; }
    container.dataset.nodeContext = nodeId || "";

    const list = credentialStore[type] || [];
    // Node-scoped context (the node modal): each node instance remembers its own chosen credential.
    // Type-scoped context (the standalone Credentials page): just browsing/managing credentials for a type.
    let selectedId = nodeId ? (nodeData[nodeId] && nodeData[nodeId].credentialId) : credSelectedId[type];
    if (!selectedId) selectedId = list.length ? list[0].id : "__new__";
    if (selectedId !== "__new__" && !list.some(c => c.id === selectedId)) selectedId = list.length ? list[0].id : "__new__";
    if (nodeId) { if (nodeData[nodeId]) nodeData[nodeId].credentialId = selectedId === "__new__" ? null : selectedId; }
    else credSelectedId[type] = selectedId;

    const selected = list.find(c => c.id === selectedId) || null;
    const optionsHtml = list.map(c => `<option value="${c.id}"${c.id === selectedId ? " selected" : ""}>${c.name}</option>`).join("");

    const warning = conn.reauth && selected ? `
      <div class="conn-warning">
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 16.5v.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/></svg>
        <span>You have until <strong>${conn.reauth}</strong> to reauthorize this connection.</span>
      </div>` : "";

    container.innerHTML = `
      <div class="conn-block">
        <div class="conn-head"><span class="conn-label">Connection <span class="req">*</span></span></div>
        <div class="conn-select-row">
          <select class="conn-cred-select" data-type="${type}">
            ${optionsHtml}
            <option value="__new__"${selectedId === "__new__" ? " selected" : ""}>+ New credential…</option>
          </select>
          ${selected ? `<button type="button" class="conn-icon-btn" data-action="delete-cred" data-type="${type}" data-id="${selected.id}" title="Delete this credential"><svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M7 7l1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></button>` : ""}
        </div>
        <label class="field">
          <span>Alias</span>
          <input type="text" class="conn-cred-name" placeholder="e.g. Personal ${conn.service}" value="${selected ? selected.name : ""}" />
        </label>
        ${credFieldsHtml(conn, selected ? selected.values : {})}
        ${warning}
        <button type="button" class="conn-add-btn conn-form-submit" data-action="save-cred" data-type="${type}">${selected ? "Update Credential" : "Save Credential"}</button>
      </div>`;
  }

  async function fetchOllamaModels(container, buttonEl) {
    const hostInput = container.querySelector('.conn-form-input[data-field="host"]');
    const portInput = container.querySelector('.conn-form-input[data-field="port"]');
    const modelSelect = container.querySelector('.conn-form-input[data-field="model"]');
    const statusEl = container.querySelector('[data-role="ollama-status"]');
    const host = (hostInput.value || "http://localhost").replace(/\/+$/, "");
    const port = (portInput.value || "11434").trim();
    const base = /^https?:\/\//.test(host) ? host : `http://${host}`;
    const url = `${base}:${port}/api/tags`;

    buttonEl.disabled = true;
    statusEl.textContent = "Connecting…";
    statusEl.className = "conn-ollama-status";
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      const models = (data.models || []).map(m => m.name).filter(Boolean);
      if (models.length === 0) {
        statusEl.textContent = "Connected, but no models are pulled yet.";
        modelSelect.innerHTML = `<option value="">No models installed</option>`;
      } else {
        const current = modelSelect.value;
        modelSelect.innerHTML = models.map(m => `<option value="${m}"${m === current ? " selected" : ""}>${m}</option>`).join("");
        statusEl.textContent = `Found ${models.length} model${models.length === 1 ? "" : "s"}.`;
        statusEl.classList.add("is-ok");
      }
    } catch (err) {
      statusEl.textContent = "Couldn't reach Ollama — is it running? (may also need OLLAMA_ORIGINS set)";
      statusEl.classList.add("is-error");
    } finally {
      buttonEl.disabled = false;
    }
  }

  function onConnectionAction(e) {
    const container = e.currentTarget;
    const nodeId = container.dataset.nodeContext || null;
    const actionEl = e.target.closest("[data-action]");
    if (!actionEl) return;
    const action = actionEl.dataset.action;

    if (action === "toggle-key-visibility") {
      const input = container.querySelector('.conn-form-input[data-field="key"]');
      if (input) input.type = input.type === "password" ? "text" : "password";
    } else if (action === "fetch-ollama-models") {
      fetchOllamaModels(container, actionEl);
    } else if (action === "save-cred") {
      const type = actionEl.dataset.type;
      const meta = nodeTypeLibrary[type];
      const nameInput = container.querySelector(".conn-cred-name");
      const name = (nameInput.value || "").trim() || `${meta.connection.service} credential`;
      const values = {};
      $$(".conn-form-input", container).forEach(input => { values[input.dataset.field] = input.value; });

      const list = credentialStore[type] = credentialStore[type] || [];
      const currentId = nodeId ? (nodeData[nodeId] && nodeData[nodeId].credentialId) : credSelectedId[type];
      const existing = currentId && currentId !== "__new__" ? list.find(c => c.id === currentId) : null;
      let savedId;
      if (existing) {
        existing.name = name;
        existing.values = values;
        savedId = existing.id;
      } else {
        credIdCounter += 1;
        savedId = "cred-" + Date.now() + "-" + credIdCounter;
        list.push({ id: savedId, name, values });
      }
      if (nodeId) { if (nodeData[nodeId]) nodeData[nodeId].credentialId = savedId; }
      else credSelectedId[type] = savedId;
      renderConnectionBlock(type, meta, container, nodeId);
      refreshNodeCheckmarks(type);
      schedulePersist();
      toast(`"${name}" saved`);
    } else if (action === "delete-cred") {
      const type = actionEl.dataset.type;
      const id = actionEl.dataset.id;
      const meta = nodeTypeLibrary[type];
      credentialStore[type] = (credentialStore[type] || []).filter(c => c.id !== id);
      const fallbackId = credentialStore[type].length ? credentialStore[type][0].id : "__new__";
      if (nodeId) { if (nodeData[nodeId]) nodeData[nodeId].credentialId = fallbackId === "__new__" ? null : fallbackId; }
      else credSelectedId[type] = fallbackId;
      renderConnectionBlock(type, meta, container, nodeId);
      refreshNodeCheckmarks(type);
      schedulePersist();
      toast("Credential deleted");
    }
  }

  function onConnectionChange(e) {
    if (!e.target.classList.contains("conn-cred-select")) return;
    const container = e.currentTarget;
    const nodeId = container.dataset.nodeContext || null;
    const type = e.target.dataset.type;
    const meta = nodeTypeLibrary[type];
    if (nodeId) { if (nodeData[nodeId]) nodeData[nodeId].credentialId = e.target.value === "__new__" ? null : e.target.value; }
    else credSelectedId[type] = e.target.value;
    renderConnectionBlock(type, meta, container, nodeId);
  }

  /* ---------- Node parameter mapping — "Map" toggle lets a field pull from an upstream node's output ---------- */
  function getUpstreamOutputFields(nodeId) {
    const visited = new Set();
    const queue = edgeList.filter(e => e.to === nodeId).map(e => e.from);
    const options = [];
    while (queue.length) {
      const id = queue.shift();
      if (visited.has(id)) continue;
      visited.add(id);
      const data = nodeData[id];
      const meta = data && nodeTypeLibrary[data.type];
      if (meta && meta.outputFields) {
        meta.outputFields.forEach(f => options.push({ nodeId: id, nodeName: data.sub || meta.label, fieldKey: f.key, fieldLabel: f.label }));
      }
      edgeList.filter(e => e.to === id).forEach(e => queue.push(e.from));
    }
    return options;
  }

  const modalParamsSlot = $("#modalParamsSlot");

  /* ---------- Expression engine ----------
     A mapped field's value is literal text that may contain one or more `{{NodeName.field...}}`
     references, optionally followed by a chain of transform calls, e.g.:
       "Hi {{Chat Interface.question.trim().upper()}}, thanks!"
     This is a small hand-rolled parser + evaluator (no eval()/Function() on user text — every
     token and function name is matched against a fixed allow-list) that:
       1. resolves a reference against the real upstream field list (so unresolvable/renamed-away
          references are visibly left as literal `{{...}}` text rather than silently guessed at), and
       2. runs the transform chain against representative sample data, so the field shows a live
          "Preview:" line before any real execution engine exists.
  */
  const EXPR_FUNCTIONS = {
    upper: (v) => String(v).toUpperCase(),
    lower: (v) => String(v).toLowerCase(),
    trim: (v) => String(v).trim(),
    length: (v) => String(String(v).length),
    toNumber: (v) => String(Number(v)),
    round: (v, args) => {
      const digits = Number(args[0]); const d = Number.isFinite(digits) ? digits : 0;
      const n = Number(v); if (!Number.isFinite(n)) return String(v);
      const f = Math.pow(10, d);
      return String(Math.round(n * f) / f);
    },
    default: (v, args) => (v === undefined || v === null || v === "" ? (args[0] ?? "") : v),
    split: (v, args) => String(v).split(args[0] || ",").join(" | "),
  };

  const SAMPLE_FIELD_VALUES = {
    question: "What's the best pizza topping?",
    payload: '{"id":482,"email":"sam@example.com"}',
    headers: "content-type: application/json",
    body: "Hi there — thanks for reaching out!",
    subject: "Welcome aboard!",
    from: "sam@example.com",
    message: "Deployment finished successfully",
    channel: "#general",
    row: "Row 42",
    triggerTime: "2026-09-02T09:00:00Z",
    status: "200 OK",
    value: "Sample value",
    response: "Sure — here's a summary of what I found…",
    rows: "3 rows returned",
    output: "The agent completed the requested task.",
    errorMessage: "Request timed out after 30s",
    nodeName: "HTTP Request",
    workflowName: "Lead Capture Pipeline",
    timestamp: "2026-09-02T14:32:00Z",
  };
  function sampleValueFor(fieldKey, fieldLabel) {
    return SAMPLE_FIELD_VALUES[fieldKey] || `Sample ${fieldLabel || fieldKey}`;
  }

  // Splits raw `{{ }}` inner text into { nodeName, fieldKey, fieldLabel, methods } by matching the
  // longest "NodeName.fieldKey" prefix against the real, current upstream field list.
  function resolveExpressionRef(raw, upstream) {
    const candidates = upstream
      .map(o => ({ ...o, prefix: `${o.nodeName}.${o.fieldKey}` }))
      .filter(o => raw === o.prefix || raw.startsWith(o.prefix + "."))
      .sort((a, b) => b.prefix.length - a.prefix.length);
    if (!candidates.length) return null;
    const match = candidates[0];
    const rest = raw.slice(match.prefix.length);
    const methods = [];
    const methodRe = /\.(\w+)\(([^)]*)\)/g;
    let mm;
    while ((mm = methodRe.exec(rest))) {
      const argsRaw = mm[2].trim();
      const args = argsRaw ? argsRaw.split(",").map(a => a.trim().replace(/^["']|["']$/g, "")) : [];
      methods.push({ fn: mm[1], args });
    }
    return { nodeName: match.nodeName, fieldKey: match.fieldKey, fieldLabel: match.fieldLabel, methods };
  }

  function parseFieldExpressions(text) {
    const re = /\{\{([^}]+)\}\}/g;
    const segments = [];
    let lastIndex = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > lastIndex) segments.push({ type: "literal", text: text.slice(lastIndex, m.index) });
      segments.push({ type: "expr", raw: m[1].trim() });
      lastIndex = re.lastIndex;
    }
    if (lastIndex < text.length) segments.push({ type: "literal", text: text.slice(lastIndex) });
    return segments;
  }

  function evaluateExpressionPreview(text, upstream) {
    if (!text) return "";
    return parseFieldExpressions(text).map(seg => {
      if (seg.type === "literal") return seg.text;
      const ref = resolveExpressionRef(seg.raw, upstream);
      if (!ref) return `{{${seg.raw}}}`; // unresolved reference — shown as-is, same as a broken link
      let val = sampleValueFor(ref.fieldKey, ref.fieldLabel);
      ref.methods.forEach(({ fn, args }) => {
        const impl = EXPR_FUNCTIONS[fn];
        if (impl) { try { val = impl(val, args); } catch (e) { /* leave val as-is on a bad call */ } }
      });
      return val;
    }).join("");
  }

  function updateParamPreview(id, key) {
    const data = nodeData[id];
    if (!data || !data.params[key]) return;
    const preview = document.querySelector(`.param-preview[data-node="${id}"][data-key="${key}"]`);
    if (!preview) return;
    const upstream = getUpstreamOutputFields(id);
    preview.querySelector("span").textContent = evaluateExpressionPreview(data.params[key].value, upstream) || "—";
  }

  function renderNodeParams(id, meta, container) {
    container = container || modalParamsSlot;
    if (!meta.params || !meta.params.length) { container.innerHTML = ""; return; }
    const data = nodeData[id];
    const upstream = getUpstreamOutputFields(id);

    container.innerHTML = meta.params.map(p => {
      const state = data.params[p.key] || { value: p.default || "", mapped: false, source: null };
      const mapToggle = p.mappable ? `
        <button type="button" class="param-map-toggle${state.mapped ? " is-on" : ""}" data-action="toggle-map" data-node="${id}" data-key="${p.key}">
          <span class="knob"></span>
        </button>
        <span class="param-map-label">Map</span>` : "";

      let fieldHtml;
      if (state.mapped) {
        const upstream = getUpstreamOutputFields(id);
        const previewText = evaluateExpressionPreview(state.value, upstream) || "—";
        fieldHtml = `
          <div class="param-mapped-wrap">
            <input type="text" class="param-input param-mapped-input" data-node="${id}" data-key="${p.key}" placeholder="Enter text or click a field to insert…" value="${state.value || ""}" />
            <button type="button" class="param-mapped-insert-btn" data-action="open-field-picker" data-node="${id}" data-key="${p.key}" title="Insert a field from an earlier step">
              <svg viewBox="0 0 24 24" fill="none"><path d="M8 4a3 3 0 0 0-3 3v3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v3a3 3 0 0 0 3 3M16 4a3 3 0 0 1 3 3v3a2 2 0 0 0 2 2 2 2 0 0 0-2 2v3a3 3 0 0 1-3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
          <p class="param-preview" data-node="${id}" data-key="${p.key}">Preview: <span>${previewText}</span></p>`;
      } else if (p.type === "textarea") {
        fieldHtml = `<textarea class="param-input" rows="2" data-node="${id}" data-key="${p.key}" placeholder="${p.placeholder || ""}">${state.value || ""}</textarea>`;
      } else if (p.type === "select") {
        const optionsHtml = p.options.map(o => `<option${o === state.value ? " selected" : ""}>${o}</option>`).join("");
        fieldHtml = `<select class="param-input" data-node="${id}" data-key="${p.key}">${optionsHtml}</select>`;
      } else {
        fieldHtml = `<input type="text" class="param-input" data-node="${id}" data-key="${p.key}" placeholder="${p.placeholder || ""}" value="${state.value || ""}" />`;
      }

      return `
        <label class="field param-field${state.mapped ? " is-mapped" : ""}">
          <div class="param-field-head">
            <span>${p.label}${p.required ? '<span class="req">*</span>' : ""}</span>
            <div class="param-map-row">${mapToggle}</div>
          </div>
          ${fieldHtml}
        </label>`;
    }).join("");
  }

  function onParamsAction(e) {
    const actionEl = e.target.closest("[data-action]");
    if (!actionEl) return;
    const id = actionEl.dataset.node, key = actionEl.dataset.key;
    const data = nodeData[id];
    if (!data) return;
    if (actionEl.dataset.action === "toggle-map") {
      data.params[key].mapped = !data.params[key].mapped;
      renderNodeParams(id, nodeTypeLibrary[data.type], e.currentTarget);
      schedulePersist();
    } else if (actionEl.dataset.action === "open-field-picker") {
      openFieldPicker(actionEl, id, key);
    }
  }
  function onParamsInput(e) {
    const el = e.target;
    if (!el.classList.contains("param-input")) return;
    const id = el.dataset.node, key = el.dataset.key;
    const data = nodeData[id];
    if (!data) return;
    data.params[key].value = el.value;
    if (el.classList.contains("param-mapped-input")) updateParamPreview(id, key);
    schedulePersist();
  }
  modalParamsSlot.addEventListener("click", onParamsAction);
  modalParamsSlot.addEventListener("input", onParamsInput);
  modalParamsSlot.addEventListener("change", onParamsInput);

  /* ---------- Floating field-picker panel — click chips to insert an upstream field into the focused input ---------- */
  const fieldPickerEl = $("#fieldPicker");
  const fieldPickerList = $("#fieldPickerList");
  const fieldPickerSearch = $("#fieldPickerSearch");
  let fieldPickerTarget = null; // { nodeId, key }

  function closeFieldPicker() {
    fieldPickerEl.classList.remove("is-open");
    fieldPickerTarget = null;
  }

  function buildFieldPickerList(query) {
    const q = (query || "").trim().toLowerCase();
    const upstream = getUpstreamOutputFields(fieldPickerTarget.nodeId);
    if (upstream.length === 0) {
      fieldPickerList.innerHTML = `<p class="field-picker-empty">No earlier steps produce mappable fields yet — connect a trigger like Chat Interface or Webhook upstream.</p>`;
      return;
    }
    const groups = new Map();
    upstream.forEach(o => {
      if (q && !o.fieldLabel.toLowerCase().includes(q) && !o.nodeName.toLowerCase().includes(q)) return;
      if (!groups.has(o.nodeId)) groups.set(o.nodeId, { nodeName: o.nodeName, color: nodeColor(o.nodeId), fields: [] });
      groups.get(o.nodeId).fields.push(o);
    });
    if (groups.size === 0) {
      fieldPickerList.innerHTML = `<p class="field-picker-empty">No fields match "${query}".</p>`;
      return;
    }
    fieldPickerList.innerHTML = Array.from(groups.values()).map(g => `
      <div class="field-picker-group">
        <div class="field-picker-group-head"><span class="field-picker-dot" style="background:${g.color}"></span>${g.nodeName}</div>
        <div class="field-picker-chips">
          ${g.fields.map(f => `<button type="button" class="field-picker-chip" style="background:${g.color}" data-token="{{${f.nodeName}.${f.fieldKey}}}">${f.fieldLabel}</button>`).join("")}
        </div>
      </div>`).join("");
  }

  function openFieldPicker(anchorEl, nodeId, key) {
    fieldPickerTarget = { nodeId, key };
    fieldPickerSearch.value = "";
    buildFieldPickerList("");
    const r = anchorEl.getBoundingClientRect();
    const panelW = 280;
    fieldPickerEl.style.left = Math.min(r.left, window.innerWidth - panelW - 12) + "px";
    fieldPickerEl.style.top = Math.min(r.bottom + 8, window.innerHeight - 340) + "px";
    fieldPickerEl.classList.add("is-open");
    setTimeout(() => fieldPickerSearch.focus(), 60);
  }

  fieldPickerSearch.addEventListener("input", () => buildFieldPickerList(fieldPickerSearch.value));
  fieldPickerList.addEventListener("click", (e) => {
    const chip = e.target.closest(".field-picker-chip");
    if (!chip || !fieldPickerTarget) return;
    const { nodeId, key } = fieldPickerTarget;
    const data = nodeData[nodeId];
    if (!data) return;
    const input = modalParamsSlot.querySelector(`.param-mapped-input[data-node="${nodeId}"][data-key="${key}"]`);
    const token = chip.dataset.token;
    const current = data.params[key].value || "";
    const next = current ? current + " " + token : token;
    data.params[key].value = next;
    if (input) input.value = next;
    updateParamPreview(nodeId, key);
    closeFieldPicker();
    schedulePersist();
  });

  // Functions strip — wraps whichever mapped expression is currently in the target field with a
  // transform call, e.g. clicking "UPPER" turns `{{Q.answer}}` into `{{Q.answer.upper()}}`.
  const fieldPickerFunctions = $("#fieldPickerFunctions");
  fieldPickerFunctions?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-fn]");
    if (!btn || !fieldPickerTarget) return;
    const { nodeId, key } = fieldPickerTarget;
    const data = nodeData[nodeId];
    if (!data) return;
    const current = data.params[key].value || "";
    const lastClose = current.lastIndexOf("}}");
    if (lastClose === -1) { toast("Insert a field first, then apply a function to it"); return; }
    const fnName = btn.dataset.fn;
    const argsText = fnName === "default" ? '"N/A"' : "";
    const next = current.slice(0, lastClose) + `.${fnName}(${argsText})` + current.slice(lastClose);
    data.params[key].value = next;
    const input = modalParamsSlot.querySelector(`.param-mapped-input[data-node="${nodeId}"][data-key="${key}"]`);
    if (input) input.value = next;
    updateParamPreview(nodeId, key);
    schedulePersist();
  });
  document.addEventListener("mousedown", (e) => {
    if (fieldPickerEl.classList.contains("is-open") && !fieldPickerEl.contains(e.target) && !e.target.closest('[data-action="open-field-picker"]')) closeFieldPicker();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && fieldPickerEl.classList.contains("is-open")) closeFieldPicker();
  });

  modalConnectionSlot.addEventListener("click", onConnectionAction);
  modalConnectionSlot.addEventListener("change", onConnectionChange);

  /* ---------- Credentials view — pick a node type, manage its connection ---------- */
  const credNodeSelect = $("#credNodeSelect");
  const credentialsDetail = $("#credentialsDetail");
  credentialsDetail.addEventListener("click", onConnectionAction);
  credentialsDetail.addEventListener("change", onConnectionChange);

  let credentialsPopulated = false;
  function renderCredentialsView() {
    if (!credentialsPopulated) {
      const entries = Object.entries(nodeTypeLibrary).filter(([, meta]) => meta.connection);
      credNodeSelect.innerHTML = entries.map(([type, meta]) => `<option value="${type}">${meta.label}</option>`).join("");
      credentialsPopulated = true;
    }
    const type = credNodeSelect.value;
    const meta = nodeTypeLibrary[type];
    if (!meta) { credentialsDetail.innerHTML = `<p class="credentials-empty">No node types define a connection.</p>`; return; }
    renderConnectionBlock(type, meta, credentialsDetail);
  }
  credNodeSelect.addEventListener("change", renderCredentialsView);

  /* ---------- Node Settings tab — per-node Retry on Fail + On Error (§6) ---------- */
  function defaultNodeSettings() {
    return { retryOnFail: false, maxTries: 3, waitBetween: 1, onError: "stop" };
  }

  const settingsRetryOnFail = $("#settingsRetryOnFail");
  const settingsRetryFields = $("#settingsRetryFields");
  const settingsMaxTries = $("#settingsMaxTries");
  const settingsWaitBetween = $("#settingsWaitBetween");
  const settingsOnError = $("#settingsOnError");
  const settingsErrorHint = $("#settingsErrorHint");

  function renderNodeSettings(id) {
    const data = nodeData[id];
    if (!data) return;
    if (!data.settings) data.settings = defaultNodeSettings();
    const s = data.settings;
    settingsRetryOnFail.checked = !!s.retryOnFail;
    settingsRetryFields.classList.toggle("is-hidden", !s.retryOnFail);
    settingsMaxTries.value = s.maxTries;
    settingsWaitBetween.value = s.waitBetween;
    settingsOnError.value = s.onError;
    settingsErrorHint.classList.toggle("is-hidden", s.onError !== "continueError");
  }

  function onSettingsChange(e) {
    const data = nodeData[selectedNodeId];
    if (!data) return;
    if (!data.settings) data.settings = defaultNodeSettings();
    const s = data.settings;
    if (e.target === settingsRetryOnFail) {
      s.retryOnFail = settingsRetryOnFail.checked;
      settingsRetryFields.classList.toggle("is-hidden", !s.retryOnFail);
    } else if (e.target === settingsMaxTries) {
      s.maxTries = Math.max(1, parseInt(settingsMaxTries.value, 10) || 1);
    } else if (e.target === settingsWaitBetween) {
      s.waitBetween = Math.max(0, parseInt(settingsWaitBetween.value, 10) || 0);
    } else if (e.target === settingsOnError) {
      s.onError = settingsOnError.value;
      settingsErrorHint.classList.toggle("is-hidden", s.onError !== "continueError");
      redrawEdges(); // rebuilds connector stubs so the red Error output appears/disappears live
    } else {
      return;
    }
    schedulePersist();
  }
  $("#mpanelSettings").addEventListener("input", onSettingsChange);
  $("#mpanelSettings").addEventListener("change", onSettingsChange);

  function openNodeModal(id) {
    const data = nodeData[id];
    if (!data) return;
    selectedNodeId = id;
    const meta = nodeTypeLibrary[data.type];
    modalTitle.textContent = data.sub;
    modalSub.textContent = data.name;
    modalBadge.className = "node-badge lg " + meta.badge;
    modalBadge.innerHTML = `<svg viewBox="0 0 24 24" fill="none">${meta.icon}</svg>`;
    modalDesc.value = data.desc;
    renderConnectionBlock(data.type, meta, modalConnectionSlot, id);
    renderNodeParams(id, meta);
    renderNodeSettings(id);
    $("#modalWebhookUrlField").classList.toggle("is-hidden", data.type !== "webhook");
    $("#modalHttpRow").classList.toggle("is-hidden", data.type !== "webhook");
    $$(".node-modal-tab").forEach(t => t.classList.toggle("is-active", t.dataset.mtab === "params"));
    $$(".node-modal-panel").forEach(p => p.classList.toggle("is-hidden", p.id !== "mpanelParams"));
    overlay.classList.add("is-open");
  }

  // A mapped field stores its reference as literal `{{NodeName.field...}}` text. If the source node
  // is renamed, every OTHER field that mapped to it must be rewritten too, or the mapping silently
  // breaks (the token would still read the old name and no longer resolve to any real node).
  function cascadeNodeRename(oldName, newName) {
    if (!oldName || !newName || oldName === newName) return;
    const oldPrefix = `{{${oldName}.`;
    const newPrefix = `{{${newName}.`;
    let touched = false;
    Object.values(nodeData).forEach(d => {
      if (!d.params) return;
      Object.values(d.params).forEach(p => {
        if (p.mapped && typeof p.value === "string" && p.value.includes(oldPrefix)) {
          p.value = p.value.split(oldPrefix).join(newPrefix);
          touched = true;
        }
      });
    });
    if (touched) schedulePersist();
  }

  function closeNodeModal() {
    if (selectedNodeId && nodeData[selectedNodeId]) {
      const data = nodeData[selectedNodeId];
      const oldName = data.sub;
      const newName = modalTitle.textContent.trim() || data.sub;
      data.sub = newName;
      data.desc = modalDesc.value;
      cascadeNodeRename(oldName, newName);
      const nodeEl = document.getElementById(selectedNodeId);
      if (nodeEl) {
        const nameEl = nodeEl.querySelector(".node-name");
        if (nameEl) nameEl.textContent = newName;
      }
    }
    overlay.classList.remove("is-open");
  }

  $("#modalCloseBtn").addEventListener("click", closeNodeModal);
  $("#modalDoneBtn").addEventListener("click", closeNodeModal);
  overlay.addEventListener("mousedown", (e) => { if (e.target === overlay) closeNodeModal(); });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (overlay.classList.contains("is-open")) closeNodeModal();
      if (addNodePopup.classList.contains("is-open")) closeAddNodePopup();
      if (edgeMenuEl.classList.contains("is-open")) closeEdgeMenu();
    }
  });
  $("#modalDocsBtn").addEventListener("click", () => toast("Documentation coming soon"));
  $("#modalCopyBtn").addEventListener("click", () => {
    const input = $("#modalWebhookUrl");
    input.select();
    navigator.clipboard?.writeText(input.value).catch(() => {});
    toast("Webhook URL copied");
  });
  $$(".node-modal-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      $$(".node-modal-tab").forEach(t => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      const target = tab.dataset.mtab;
      $$(".node-modal-panel").forEach(p => p.classList.toggle("is-hidden", p.id !== "mpanel" + target[0].toUpperCase() + target.slice(1)));
    });
  });

  function deleteNode(id) {
    if (!id || !document.getElementById(id)) return;
    pushUndo();
    document.getElementById(id).remove();
    delete nodeData[id];
    edgeList.filter(e => e.from === id || e.to === id).forEach(e => removeEdge(e.from, e.to));
    if (selectedNodeId === id) selectedNodeId = null;
    if ($$(".node").length === 0) showEmptyState(true);
    redrawEdges();
    toast("Node deleted");
  }

  $("#modalDeleteBtn").addEventListener("click", () => {
    const id = selectedNodeId;
    closeNodeModal();
    deleteNode(id);
  });

  /* ---------- Per-workflow canvas templates ---------- */
  // Live per-workflow canvas store — the actual source of truth (persisted to localStorage), not a static seed.
  // workflowCanvasData[workflowId] = { nodes: [{id,type,x,y,sub,desc,params,credentialId}], edges: [[from,to,branch]] }
  const workflowCanvasData = {};

  function snapshotCurrentCanvasInto(store) {
    if (!currentWorkflowId) return;
    store[currentWorkflowId] = {
      nodes: $$(".node", canvasInner).map(el => {
        const d = nodeData[el.id];
        if (!d) return null;
        return { id: d.id, type: d.type, x: d.x, y: d.y, sub: d.sub, desc: d.desc, params: d.params, credentialId: d.credentialId || null, settings: d.settings || null };
      }).filter(Boolean),
      edges: edgeList.map(e => [e.from, e.to, e.branch || null]),
    };
  }

  function buildWorkflowCanvas(id) {
    clearCanvas();
    resetHistory();
    const data = workflowCanvasData[id];
    if (!data) return; // blank workflow — clearCanvas() already shows the empty state
    data.nodes.forEach(n => {
      createNode(n.type, n.x, n.y, { id: n.id, sub: n.sub, desc: n.desc, credentialId: n.credentialId, settings: n.settings });
      if (n.params && nodeData[n.id]) nodeData[n.id].params = n.params;
    });
    data.edges.forEach(([from, to, branch]) => createEdgePath(from, to, branch));
    redrawEdges();
    if (data.nodes[0]) selectNode(data.nodes[0].id);
  }

  /* ---------- Persistence — everything survives a refresh via localStorage ---------- */
  const STORAGE_KEY = "oasysflow-state-v1";
  let persistTimer = null;

  function persist() {
    snapshotCurrentCanvasInto(workflowCanvasData);
    const state = { v: 1, workflows, currentWorkflowId, wfIdCounter, credIdCounter, workflowCanvasData, credentialStore };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function schedulePersist() {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(persist, 400);
  }
  window.addEventListener("beforeunload", persist);

  function loadPersistedState() {
    let raw;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { return false; }
    if (!raw) return false;
    try {
      const state = JSON.parse(raw);
      if (!state || !Array.isArray(state.workflows)) return false;
      workflows = state.workflows;
      currentWorkflowId = state.currentWorkflowId || (workflows[0] && workflows[0].id) || null;
      wfIdCounter = state.wfIdCounter || 0;
      credIdCounter = state.credIdCounter || 0;
      Object.keys(workflowCanvasData).forEach(k => delete workflowCanvasData[k]);
      Object.assign(workflowCanvasData, state.workflowCanvasData || {});
      Object.keys(credentialStore).forEach(k => delete credentialStore[k]);
      Object.assign(credentialStore, state.credentialStore || {});
      return true;
    } catch (e) { return false; }
  }

  /* ---------- Export / Import as JSON — a portable workflow format (n8n/Make-style) ---------- */
  function exportWorkflowJSON() {
    const wf = workflows.find(w => w.id === currentWorkflowId);
    const nodes = $$(".node", canvasInner).map(el => {
      const d = nodeData[el.id];
      if (!d) return null;
      return {
        id: d.id,
        type: d.type,
        name: d.name,
        instanceName: d.sub,
        description: d.desc,
        position: { x: d.x, y: d.y },
        params: d.params,
        credentialId: d.credentialId || null,
        settings: d.settings || null,
      };
    }).filter(Boolean);
    const connections = edgeList.map(e => ({ from: e.from, to: e.to, branch: e.branch || null }));
    const usedTypes = new Set(nodes.map(n => n.type));
    const credentials = {};
    usedTypes.forEach(type => {
      const list = credentialStore[type];
      if (list && list.length) credentials[type] = list;
    });

    const payload = {
      formatVersion: 1,
      app: "Oasys Flow",
      exportedAt: new Date().toISOString(),
      workflow: { id: (wf && wf.id) || currentWorkflowId, name: (wf && wf.name) || $("#wfTitle").textContent.trim(), status: (wf && wf.status) || "draft" },
      nodes,
      connections,
      credentials,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(payload.workflow.name || "workflow").replace(/[^a-z0-9-_]+/gi, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("Workflow exported as JSON");
  }

  function importWorkflowJSON(payload) {
    if (!payload || !Array.isArray(payload.nodes)) { toast("That file doesn't look like an Oasys Flow export"); return; }

    // Merge any credentials the file brought with it (additive — never overwrite existing ones).
    if (payload.credentials) {
      Object.entries(payload.credentials).forEach(([type, list]) => {
        if (!Array.isArray(list)) return;
        const existing = credentialStore[type] = credentialStore[type] || [];
        list.forEach(c => { if (!existing.some(e => e.id === c.id)) existing.push(c); });
      });
    }

    if (currentWorkflowId) snapshotCurrentCanvasInto(workflowCanvasData);

    wfIdCounter += 1;
    const wfId = "wf-" + Date.now() + "-" + wfIdCounter;
    const name = (payload.workflow && payload.workflow.name) || "Imported Workflow";
    workflows.unshift({ id: wfId, name, status: (payload.workflow && payload.workflow.status) || "draft", nodeCount: payload.nodes.length, blank: false, iconType: (payload.nodes[0] && payload.nodes[0].type) || "webhook" });
    currentWorkflowId = wfId;

    clearCanvas();
    resetHistory();
    payload.nodes.forEach(n => {
      if (!nodeTypeLibrary[n.type]) return; // unknown node type — skip rather than crash
      createNode(n.type, n.position ? n.position.x : 60, n.position ? n.position.y : 60, {
        id: n.id, sub: n.instanceName, desc: n.description, credentialId: n.credentialId || null, settings: n.settings || null,
      });
      if (n.params && nodeData[n.id]) nodeData[n.id].params = n.params;
    });
    (payload.connections || []).forEach(c => {
      if (document.getElementById(c.from) && document.getElementById(c.to)) createEdgePath(c.from, c.to, c.branch);
    });
    redrawEdges();

    $("#wfTitle").textContent = name;
    setActiveSwitch((payload.workflow && payload.workflow.status) === "active");
    renderWfList();
    renderDashboard();
    persist();
    toast(`Imported "${name}"`);
  }

  const activeSwitch = $("#activeSwitch");
  function setActiveSwitch(isOn) {
    activeSwitch.classList.toggle("is-on", isOn);
    activeSwitch.setAttribute("aria-checked", String(isOn));
    $(".active-label").textContent = isOn ? "Active" : "Paused";
  }

  const restoredFromStorage = loadPersistedState();
  if (!restoredFromStorage) {
    // First run ever (or storage cleared) — seed the two demo workflows.
    workflowCanvasData["wf-demo"] = {
      nodes: [
        { id: "n1", type: "webhook", x: 40,  y: 110, sub: "New Lead",           desc: "Starts the workflow when a new lead is captured from any connected source." },
        { id: "n2", type: "filter",  x: 320, y: 110, sub: "Check Country",      desc: "Only lets leads matching the configured country list continue down the workflow." },
        { id: "n3", type: "email",   x: 620, y: 20,  sub: "Welcome Email",      desc: "Sends the branded welcome email to the new lead's address." },
        { id: "n4", type: "slack",   x: 620, y: 220, sub: "Slack Notification", desc: "Posts a notification into the #new-leads Slack channel." },
        { id: "n5", type: "sheet",   x: 960, y: 20,  sub: "Google Sheets",      desc: "Appends the lead record as a new row in the shared tracking sheet." },
      ],
      edges: [["n1", "n2", null], ["n2", "n3", null], ["n2", "n4", null], ["n3", "n5", null]],
    };
    workflowCanvasData["wf-donation"] = {
      nodes: [
        { id: "d1", type: "set",   x: 60,  y: 110, sub: "Donation Variables", desc: "Stores amount, donor_name, and donor_email for the next step to use." },
        { id: "d2", type: "gmail", x: 360, y: 110, sub: "Thank You Email",    desc: "Sends the branded HTML thank-you email to {{donor_email}} via the connected Gmail account." },
      ],
      edges: [["d1", "d2", null]],
    };
    workflows.push({ id: "wf-donation", name: "Donation Thank You Email (Ahdon)", status: "active", nodeCount: 2, blank: false, iconType: "gmail" });
  }

  if (currentWorkflowId && !workflows.some(w => w.id === currentWorkflowId)) currentWorkflowId = workflows[0] ? workflows[0].id : null;
  if (currentWorkflowId) {
    const activeWf = workflows.find(w => w.id === currentWorkflowId);
    $("#wfTitle").textContent = activeWf ? activeWf.name : "Untitled Workflow";
    buildWorkflowCanvas(currentWorkflowId);
    setActiveSwitch(activeWf ? activeWf.status === "active" : false);
  } else {
    clearCanvas();
    setActiveSwitch(false);
  }
  renderWfList();
  renderDashboard();

  /* ---------- New Workflow -> blank canvas ---------- */
  function createNewWorkflow() {
    closeNodeModal();
    if (currentWorkflowId) snapshotCurrentCanvasInto(workflowCanvasData);

    wfIdCounter += 1;
    const id = "wf-" + Date.now() + "-" + wfIdCounter;
    workflows.unshift({ id, name: "Untitled Workflow", status: "draft", nodeCount: 0, blank: true, iconType: "webhook" });
    workflowCanvasData[id] = { nodes: [], edges: [] };
    currentWorkflowId = id;
    buildWorkflowCanvas(id);
    setActiveSwitch(false);

    $("#wfTitle").textContent = "Untitled Workflow";
    renderWfList();
    renderDashboard();
    persist();
    toast("New blank workflow created");
  }
  $(".btn-new-workflow").addEventListener("click", createNewWorkflow);
  $("#dashboardNewBtn")?.addEventListener("click", () => {
    createNewWorkflow();
    $$(".nav-item").forEach(i => i.classList.remove("is-active"));
    $('.nav-item[data-view="workflows"]').classList.add("is-active");
    setView("workflows");
  });

  /* ---------- Topbar: Undo / Redo / Execute / Save / Active ---------- */
  $("#undoBtn").addEventListener("click", doUndo);
  $("#redoBtn").addEventListener("click", doRedo);

  function runExecuteAnimation() {
    const nodes = $$(".node");
    if (nodes.length === 0) { toast("Nothing to execute — canvas is empty"); return; }
    nodes.forEach((n, i) => {
      setTimeout(() => {
        n.style.boxShadow = "0 0 0 3px rgba(247,145,6,0.5), var(--shadow-lift)";
        setTimeout(() => { n.style.boxShadow = ""; }, 380);
      }, i * 160);
    });
    toast("Executing workflow…");
  }
  $("#executeBtn").addEventListener("click", runExecuteAnimation);

  function saveWorkflow() {
    $(".autosave").textContent = "Saved just now";
    toast("Workflow saved");
  }
  $("#saveBtn").addEventListener("click", saveWorkflow);

  /* ---------- Topbar "More" menu: Export / Import JSON ---------- */
  const moreMenuBtn = $("#moreMenuBtn");
  const moreMenu = $("#moreMenu");
  moreMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    moreMenu.classList.toggle("is-open");
  });
  document.addEventListener("mousedown", (e) => {
    if (moreMenu.classList.contains("is-open") && !moreMenu.contains(e.target) && e.target !== moreMenuBtn) moreMenu.classList.remove("is-open");
  });
  $("#exportJsonBtn").addEventListener("click", () => {
    moreMenu.classList.remove("is-open");
    exportWorkflowJSON();
  });
  const importJsonInput = $("#importJsonInput");
  $("#importJsonBtn").addEventListener("click", () => {
    moreMenu.classList.remove("is-open");
    importJsonInput.value = "";
    importJsonInput.click();
  });
  importJsonInput.addEventListener("change", () => {
    const file = importJsonInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        importWorkflowJSON(payload);
        $$(".nav-item").forEach(i => i.classList.remove("is-active"));
        $('.nav-item[data-view="workflows"]').classList.add("is-active");
        setView("workflows");
      } catch (err) {
        toast("Couldn't parse that JSON file");
      }
    };
    reader.readAsText(file);
  });

  activeSwitch.addEventListener("click", () => {
    const isOn = !activeSwitch.classList.contains("is-on");
    setActiveSwitch(isOn);
    const wf = workflows.find(w => w.id === currentWorkflowId);
    if (wf) {
      wf.status = isOn ? "active" : "paused";
      renderWfList();
      renderDashboard();
      schedulePersist();
    }
    toast(isOn ? "Workflow activated" : "Workflow paused");
  });

  /* ---------- Zoom ---------- */
  const zoomReadout = $("#zoomReadout");
  function applyZoom() {
    canvasInner.style.transform = `scale(${currentZoom})`;
    zoomReadout.textContent = Math.round(currentZoom * 100) + "%";
  }
  $("#zoomIn").addEventListener("click", () => { currentZoom = Math.min(1.6, currentZoom + 0.1); applyZoom(); });
  $("#zoomOut").addEventListener("click", () => { currentZoom = Math.max(0.5, currentZoom - 0.1); applyZoom(); });
  $("#zoomFit").addEventListener("click", () => { currentZoom = 1; applyZoom(); });

  let locked = false;
  $("#lockBtn").addEventListener("click", (e) => {
    locked = !locked;
    e.currentTarget.classList.toggle("is-active", locked);
  });

  /* ---------- Canvas panning — click-drag the empty background to scroll around ---------- */
  const canvasEl = $("#canvas");
  let panState = null;
  canvasEl.addEventListener("mousedown", (e) => {
    if (locked) return;
    if (e.target !== canvasEl && e.target !== canvasInner) return; // ignore clicks that started on a node/edge/stub
    panState = {
      startX: e.clientX, startY: e.clientY,
      scrollLeft: canvasEl.scrollLeft, scrollTop: canvasEl.scrollTop,
      moved: false,
    };
    canvasEl.classList.add("is-panning");
  });
  window.addEventListener("mousemove", (e) => {
    if (!panState) return;
    const dx = e.clientX - panState.startX, dy = e.clientY - panState.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) panState.moved = true;
    canvasEl.scrollLeft = panState.scrollLeft - dx;
    canvasEl.scrollTop = panState.scrollTop - dy;
  });
  window.addEventListener("mouseup", () => {
    if (!panState) return;
    if (!panState.moved) $$(".node").forEach(n => n.classList.remove("is-selected"));
    canvasEl.classList.remove("is-panning");
    panState = null;
  });

  /* ---------- Floating bottom toolbar ---------- */
  const floatbar = $("#floatbar");
  $("#floatbarCollapseBtn").addEventListener("click", () => {
    floatbar.classList.toggle("is-collapsed");
    closeAddNodePopup();
  });

  $("#fbExecute").addEventListener("click", runExecuteAnimation);
  $("#fbRunCaret").addEventListener("click", () => toast("More run options coming soon"));

  const scheduleBtn = $("#fbSchedule");
  scheduleBtn.addEventListener("click", () => scheduleBtn.classList.toggle("is-on"));

  $("#fbSave").addEventListener("click", saveWorkflow);
  $("#fbUndo").addEventListener("click", doUndo);
  $("#fbRedo").addEventListener("click", doRedo);
  $("#fbGrid").addEventListener("click", () => { currentZoom = 1; applyZoom(); });

  function autoAlignCanvas() {
    const nodeIds = $$(".node", canvasInner).map(n => n.id);
    if (nodeIds.length === 0) return;
    pushUndo();

    const incoming = Object.create(null);
    nodeIds.forEach(id => { incoming[id] = 0; });
    edgeList.forEach(e => { if (e.to in incoming) incoming[e.to] += 1; });

    const depth = Object.create(null);
    const roots = nodeIds.filter(id => incoming[id] === 0);
    (roots.length ? roots : [nodeIds[0]]).forEach(id => { depth[id] = 0; });
    const queue = Object.keys(depth).slice();
    while (queue.length) {
      const id = queue.shift();
      const d = depth[id];
      edgeList.filter(e => e.from === id).forEach(e => {
        const nd = d + 1;
        if (!(e.to in depth) || depth[e.to] < nd) {
          depth[e.to] = nd;
          queue.push(e.to);
        }
      });
    }
    nodeIds.forEach(id => { if (!(id in depth)) depth[id] = 0; });

    const columns = Object.create(null);
    nodeIds.forEach(id => {
      const d = depth[id];
      (columns[d] = columns[d] || []).push(id);
    });

    const colGapX = 260, rowGapY = 130, startX = 60, startY = 60;
    Object.keys(columns).map(Number).sort((a, b) => a - b).forEach(d => {
      columns[d].forEach((id, i) => {
        const el = document.getElementById(id);
        const nx = startX + d * colGapX;
        const ny = startY + i * rowGapY;
        el.dataset.x = nx;
        el.dataset.y = ny;
        el.style.left = nx + "px";
        el.style.top = ny + "px";
      });
    });

    redrawEdges();
    toast("Workflow auto-aligned");
  }
  $("#fbAutoAlign").addEventListener("click", autoAlignCanvas);
  $("#fbHints").addEventListener("click", (e) => e.currentTarget.classList.toggle("is-active"));
  $("#fbIO").addEventListener("click", (e) => e.currentTarget.classList.toggle("is-active"));
  $("#fbSettings").addEventListener("click", () => toast("Workflow settings coming soon"));
  $("#fbRename").addEventListener("click", () => {
    const title = $("#wfTitle");
    title.focus();
    document.getSelection().selectAllChildren(title);
  });
  $("#fbHistory").addEventListener("click", () => toast("Execution history coming soon"));

  /* ---------- Add Node popup ---------- */
  const addNodePopup = $("#addNodePopup");
  const addNodeBtn = $("#fbAddBtn");
  const popupList = $("#addNodePopupList");
  const popupSearch = $("#nodeSearch");

  function buildPopupList(filterCat, query) {
    const q = (query || "").trim().toLowerCase();
    popupList.innerHTML = "";
    const entries = Object.entries(nodeTypeLibrary).filter(([, meta]) => {
      const matchesCat = !filterCat || meta.cat === filterCat;
      const matchesQuery = !q || meta.label.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
    if (entries.length === 0) {
      popupList.innerHTML = `<div class="addnode-popup-empty">No nodes match your search.</div>`;
      return;
    }
    entries.forEach(([type, meta]) => {
      const row = document.createElement("button");
      row.className = "addnode-popup-row";
      row.innerHTML = `
        <span class="node-badge ${meta.badge}"><svg viewBox="0 0 24 24" fill="none">${meta.icon}</svg></span>
        <span class="addnode-popup-row-label">${meta.label}</span>
      `;
      row.addEventListener("click", () => {
        pushUndo();
        if (pendingConnectFrom && document.getElementById(pendingConnectFrom)) {
          const anchor = nodeAnchor(pendingConnectFrom, "right", pendingConnectBranch);
          const x = anchor.x + 90;
          const y = anchor.y - 29;
          const id = createNode(type, x, y);
          createEdgePath(pendingConnectFrom, id, pendingConnectBranch);
          selectNode(id);
          pendingConnectFrom = null;
          pendingConnectBranch = null;
          closeAddNodePopup();
          redrawEdges();
          return;
        }
        const existing = $$(".node").length;
        const x = 60 + (existing % 4) * 230;
        const y = 40 + Math.floor(existing / 4) * 130;
        const id = addNode(type, x, y);
        selectNode(id);
        closeAddNodePopup();
        redrawEdges();
        toast(`${meta.label} node added`);
      });
      popupList.appendChild(row);
    });
  }

  let activeCatFilter = null;
  function openAddNodePopup(catFilter) {
    activeCatFilter = catFilter || null;
    buildPopupList(activeCatFilter, popupSearch.value);
    addNodePopup.classList.add("is-open");
    addNodeBtn.classList.add("is-active");
    setTimeout(() => popupSearch.focus(), 80);
  }
  function closeAddNodePopup() {
    addNodePopup.classList.remove("is-open");
    addNodeBtn.classList.remove("is-active");
    pendingConnectFrom = null;
    pendingConnectBranch = null;
  }
  function toggleAddNodePopup(catFilter) {
    if (addNodePopup.classList.contains("is-open")) closeAddNodePopup();
    else openAddNodePopup(catFilter);
  }

  addNodeBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleAddNodePopup(null); });
  $$(".floatbar-quick-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openAddNodePopup(btn.dataset.cat);
    });
  });
  popupSearch.addEventListener("input", () => buildPopupList(activeCatFilter, popupSearch.value));
  document.addEventListener("mousedown", (e) => {
    if (!addNodePopup.classList.contains("is-open")) return;
    if (addNodePopup.contains(e.target) || e.target.closest(".floatbar-add-btn, .floatbar-quick-btn")) return;
    closeAddNodePopup();
  });

  /* ---------- Title editing ---------- */
  $("#wfTitle").addEventListener("blur", () => {
    const active = $(".wf-item.is-active");
    if (active) {
      const dotClass = active.querySelector(".dot").className;
      active.dataset.name = $("#wfTitle").textContent.trim();
      active.innerHTML = `<span class="${dotClass}"></span>` + active.dataset.name;
    }
  });
  $("#wfTitle").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); $("#wfTitle").blur(); }
  });

})();
