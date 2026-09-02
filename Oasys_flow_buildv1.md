# Oasys Flow — Build v1
### Engineering spec: becoming the best-in-class visual automation builder
*Researched against n8n, Make.com (formerly Integromat), and Zapier. UI/visual design is locked as-is — this document specifies data model, behavior, and feature additions to layer into the existing shell (`index.html` / `app.js` / `styles.css`).*

---

## 0. Why this document exists

Oasys Flow already has a distinctive, well-built canvas UI: gradient node cards, drag-to-connect wiring with a live "+" stub, a Make.com-style branching Router node, an n8n-style AI Agent node, named multi-alias credentials, a field-mapping popup, JSON import/export, and localStorage persistence. That's more UI polish than most of these tools ship with.

What it's missing is the **engine underneath** — the parts of n8n, Make, and Zapier that don't show up in a screenshot but are the actual reason people trust them with production workflows: a real data model, a real expression language, retry/error semantics, execution history, and a credential security model. This doc is the spec for building that engine, informed by exactly how the three market leaders do it, keeping whichever approach is strongest for each concern.

**Rule for this doc: no UI redesign.** Every recommendation below is implementable as new *behavior* inside the current visual language — new modal sections, new node-modal tabs, new floatbar icons — never a new look.

---

## 1. Competitive snapshot

| Concern | n8n | Make.com | Zapier | Oasys Flow today | Oasys Flow v1 target |
|---|---|---|---|---|---|
| Data unit | **Item** (`json` + `binary` + `pairedItem`), items flow as arrays between nodes | **Bundle** (one unit through a module); arrays of bundles = collections | Flat key/value per step; "line items" for nested arrays | Ad-hoc — no runtime data model, only *static config* per node | Adopt the **item** model (§2) — most expressive, closest to what a code-capable power user expects |
| Field mapping | Drag-and-drop from an Input pane → generates `{{ $json.field }}`; full JS-like expression editor | Click a field in a floating panel grouped by source module → inserts a colored token; inline **Functions** tab for transforms | Click **+** → colored pill; "Get all values" flattens line items | Field picker popup grouped by upstream node, inserts a plain-text `{{Node.field}}` token (§3 — has a real bug, see 3.4) | Combine all three: field-picker chips **and** drag-from-panel, real expression grammar, inline transform functions |
| Branching | `If` / `Switch` nodes (linear, one output taken) | **Router** + **Filter** per route (all matching routes can fire) | **Paths** — up to 3 branches + 3 nested, `Always run` / `Fallback` rules | Router/If-Else node with labeled branches already built (UI only, single-branch semantics) | Router semantics (Make) as default, since it's more powerful; keep the existing visual | 
| Loops | `Split In Batches` (batch loop) + `Split Out` | `Iterator` → per-item bundles → `Array Aggregator` back to one array | Line-item iteration inside a step; no first-class loop node | None | Add both patterns as node types (§5.3) |
| Errors | `Retry On Fail` (max tries + wait ms) per node, `On Error` (stop / continue / error-output branch), dedicated **Error Trigger** workflow | Per-module error handler route: `Ignore`, `Resume`, `Retry`, `Break`, `Commit`, `Rollback`; unresolved runs land in an **Incomplete Executions** queue | Auto-replay on some triggers; limited per-step config | None (buttons are decorative) | n8n's per-node retry/on-error as the default UX; Make's directive vocabulary as an "advanced" per-edge menu option (§6) |
| Credentials | Centralized manager, OAuth2 (managed or custom), encrypted at rest (`N8N_ENCRYPTION_KEY`) | Per-connection, reusable across modules, add via the module's connection dropdown | Per-account connection, reusable across Zaps | **Already built**: named multi-alias credentials, OAuth/API-key/form kinds, per-node reference | Keep; add "shared across team" concept + encryption note (§7) |
| Sub-workflows | `Execute Workflow` node calls another workflow by ID, sync or fire-and-forget | Scenarios can call other scenarios in some plans | Zaps can trigger other Zaps via webhook only | None | Add `Execute Workflow` node type (§5.4) |
| AI | `AI Agent` node: chat model + tools + memory as sub-connections; `$fromAI()` lets the LLM fill a parameter | AI app modules (OpenAI etc.) as regular modules | AI-assisted Zap building (Copilot), not in-canvas agents | **Already built**: AI Agent node shell (dark card, green border, 3 ports) | Wire the 3 ports to real sub-node connections + `$fromAI()` equivalent (§8) |
| Testing | Pin data on a node, run a single node, full execution log with per-node I/O | "Run once", per-module bundle inspector, full scenario history | Test step, replay from a sample record | None (Execute button just animates) | Pin data + execution log (§9) |
| Storage | None built-in (use a DB node) | Data Store module | **Tables** — built-in lightweight DB (records/fields/cells) | None | Add a `Table` node (§10) |
| Portability | Workflow JSON export/import, `n8n_json` format | Blueprint JSON (`.json` per scenario) | No user-facing export | **Already built**: JSON export/import with `nodes`/`connections`/`credentials` | Formalize schema, add ID-stability fix (§3.4), versioning (§11) |

Sources consulted: n8n docs (expression reference, data mapping/UI mapper, data structure, error handling, credentials, Execute Sub-workflow, AI Agent, triggers, Split In Batches, templates); Make.com help center (mapping, mapping arrays, error handling/directives, router/filter/iterator/aggregator, scenario history/incomplete executions, scheduling); Zapier help center (field mapping, Paths, Tables, Code by Zapier, Formatter).

---

## 2. Core data model: adopt the "item" pattern

Right now `nodeData[id]` only holds *configuration* (what the user typed into the modal). There is no representation of what a node actually *produces at runtime* — which is fine for a static mock, but it's the one piece that has to exist before mapping, loops, or execution history mean anything.

**Recommendation: adopt n8n's item shape**, because it's the most explicit of the three and it directly explains *why* `pairedItem` matters (it's how a downstream node — or a human debugging a workflow — knows which input row produced which output row, something Zapier can't show you and Make only shows implicitly via bundle order).

```ts
interface OasysItem {
  json: Record<string, unknown>;   // the actual field data, e.g. { question: "..." }
  binary?: Record<string, OasysBinaryData>; // files, if any
  pairedItem?: { item: number; input?: number }; // which input item this came from
}

// A node's runtime output is always an array of items, even for a single result:
type NodeOutput = OasysItem[];
```

Every node type in `nodeTypeLibrary` should declare its output *shape*, not just a flat `outputFields` label list:

```js
outputFields: [{ key: "question", label: "Question", type: "string" }]
```

This is a small, backward-compatible extension of what's already there (`type` is new; everything else matches today's shape) and it's what makes §3's expression engine and §5.3's loops possible.

---

## 3. Field mapping engine — the feature this doc was asked to focus on

### 3.1 What each platform actually does

- **n8n**: everything is one unified **expression language**. You either type `{{ }}` directly, or you drag a field from the Input pane and it writes the expression for you (`{{ $json.fruit }}`, or for a named upstream node, `{{ $("HTTP Request").item.json.data }}`). Because it's real JS-subset, you get `.map()`, `.filter()`, Luxon date math, string helpers — the mapping *is* the transform, no separate step needed.
- **Make**: the mapping panel is a **tree of source modules** (grouped, collapsible, exactly what you already built), each field is a clickable colored token. Separately, a **Functions tab** in the same panel lets you wrap the inserted value in a transform (`upper()`, `formatDate()`, `parseNumber()`, ~40 built-ins) without leaving the field. Arrays are addressed by index: `{{1.items[2].name}}`, and `first()`/`get()` for key-value lookups inside complex arrays.
- **Zapier**: the simplest — click **+**, pick a field from a flat dropdown, get a colored pill. Nested/array data needs an explicit **"Get all values"** action to flatten into line items; there's no inline function layer, you'd add a separate Formatter or Code step.

### 3.2 What Oasys Flow already has

The field-picker popup (grouped by source node, colored chips, click-to-insert) is functionally closest to **Make's** panel — which is the right instinct, since Make's is the most usable of the three for a visual builder. Toggling "Map" per field before showing the picker is a nice, explicit affordance none of the three competitors has this clean.

### 3.3 Gaps to close, ranked by impact

1. **No expression grammar — only string concatenation.** Today, clicking a chip inserts the *literal string* `{{NodeName.field}}` into a plain text input. That's a token, not an expression: there's no way to combine two mapped fields with a transform, wrap one in `upper()`, or do array indexing. **Fix:** keep the `{{ }}` display syntax (it already reads well and matches n8n's convention) but back it with a tiny real evaluator — a restricted-but-real expression parser supporting: dot/bracket path access, string methods (`.upper()`, `.lower()`, `.trim()`, `.split()`), number/date formatting, and ternary/`??`-style defaults. This is the single highest-leverage addition in this whole document — it upgrades every mappable field in the app at once.
2. **No inline transform layer.** Add a small "ƒ" tab inside the field-picker panel (next to search), listing ~15 common functions (Make ships ~40; start with the 80/20 subset: `upper`, `lower`, `trim`, `formatDate`, `round`, `toNumber`, `join`, `default`). Clicking one wraps the current selection/cursor position, exactly like Make's Functions tab.
3. **No array/iteration awareness.** Once §5.3 (loops) exists, a mapped field pulling from an array-producing node needs Make's `[n]` index affordance or n8n's `.map()` chain. Simplest UI: when the picker detects the source field is an array, show a small index stepper next to the chip (`Row Data [0]`, editable) rather than requiring the user to hand-type bracket syntax.
4. **Drag-and-drop, not just click.** n8n's pattern (drag a field from a data pane directly onto the target input) is strictly additive to what you have — keep click-to-insert as the primary path (it's more discoverable), add drag as a power-user shortcut once there's a live data/output pane to drag *from* (§9.2).

### 3.4 A real bug this research surfaced

Today, `createEdgePath`/the field-picker token is built from `data.sub` (the node's **current display name**) at the moment of insertion — e.g. `{{Untitled.question}}`. If the user later renames that node, every field that mapped to it keeps the *stale* name as dead text; nothing re-resolves. n8n avoids this entirely because its expressions reference nodes by **stable name/ID lookup** (`$("HTTP Request")`), resolved at *read* time, not *write* time.

**Fix:** store the mapped token as `{{nodeId.fieldKey}}` internally (stable), and only *render* it as `{{DisplayName.fieldLabel}}` in the UI layer, re-resolving the display name from `nodeData[nodeId]` every time the field renders — never bake the name into the stored string. This is a small, contained change (touches `openFieldPicker`'s chip-click handler and wherever `param.value` gets displayed) and it's the difference between mapping that survives a rename and mapping that silently breaks.

---

## 4. Node definition schema (formalized)

Your `nodeTypeLibrary` entries are already 90% of the way to a proper extensible node-definition format — this section just names the missing pieces so third-party/community node authoring (n8n's biggest ecosystem strength — 400+ integrations, a real marketplace) is possible later without a rewrite.

```js
{
  key: "gmail",
  badge: "badge-gmail", label: "Gmail", cat: "integrations",
  color: "#EA4335", brand: true,
  icon: "<path .../>",
  connection: { kind: "oauth", service: "Gmail", ... },   // existing
  params: [ /* existing param defs, + mappable flag */ ],
  outputFields: [{ key: "subject", label: "Subject", type: "string" }], // + type (new, see §2)
  branches: [ /* existing, for router-style nodes */ ],
  // --- new, optional ---
  version: 1,                     // semantic-ish version, for template compatibility (n8n pattern)
  execute: async (items, params, creds) => NodeOutput,  // v2+: real execution, not just UI
}
```

Nothing here requires touching existing entries — `version` and `execute` are additive and optional, so today's 20 node types keep working unmodified while a v2 execution engine (out of scope for this doc) can be built against the same schema later.

---

## 5. Node execution model

### 5.1 Triggers — three kinds, be explicit about which

| Kind | Mechanism | Existing Oasys nodes | Notes |
|---|---|---|---|
| **Webhook (push)** | External service POSTs to a unique URL; instant | `webhook`, `instant` | Already modeled; add a real generated URL per node instance (`/webhook/<nodeId>`), matching what the modal already displays |
| **Polling (pull)** | Oasys checks the service on an interval | none yet | Needed for services without webhooks (most REST APIs) — add as an option on `http`/`mysql`/`ollama`-style nodes: "Poll every N minutes for new rows" |
| **Schedule (cron)** | Fires on a timer, not tied to any external event | `schedule` | Already modeled; the floatbar's "Every 15 minutes" toggle is exactly this — wire it to a real interval-or-cron picker instead of a static label |

### 5.2 Branching — Router (Make) over plain If/Else (n8n) as the default

Your `ifelse` node is already built as a **Router**, not a plain If: multiple labeled branches, each independently connectable, all potentially firing (Make's model) rather than n8n's "exactly one output taken." Keep it — it's strictly more powerful and it's already what you shipped. Just make sure the runtime semantics match the UI promise: every branch whose condition is true should be able to fire, not just the first match.

### 5.3 Loops — add both the batch pattern and the iterator/aggregator pattern

- **Split In Batches (n8n pattern)**: a node that takes N items, re-runs everything downstream once per batch, exposes `currentRunIndex` / `noItemsLeft` for the mapping engine.
- **Iterator → Aggregator (Make pattern)**: `Iterator` explodes one array-valued item into many single items (one bundle each); `Aggregator` (pointed at the Iterator as its "source") collects them back into one array. This pair is more intuitive for non-technical users than a batch-loop node because the two halves are visually symmetric on the canvas — recommend shipping this pattern as the primary loop UX, with Split-In-Batches as an advanced alternative for people who need rate-limit-aware chunking.

### 5.4 Sub-workflows

Add an `Execute Workflow` node type: picks another saved workflow by ID (populate the dropdown from `workflows[]`, already in memory), with a mode toggle — **wait for completion** (sync, pipes the sub-workflow's Output node value back as this node's output) vs. **fire and forget** (async). This is the cleanest way to let users compose the "Donation Thank You Email" and "Lead Capture Pipeline" demo workflows into a shared "Send Branded Email" sub-workflow instead of duplicating nodes.

---

## 6. Error handling & reliability

Ship **n8n's model as the default**, because it's dramatically simpler to explain in a UI than Make's six-way directive menu, while still covering the common cases:

- Per-node **Settings** tab (already exists in the node modal — currently a placeholder): add `Retry on Fail` (checkbox + Max Tries + Wait Between Tries), and `On Error` (`Stop workflow` / `Continue (skip)` / `Continue (use error output)`).
- A **Continue (use error output)** setting routes to a second, red-tinted output stub on the node (visually: same connector-stub mechanism you already built for branches, just styled red) — this is what lets a workflow catch its own errors without a separate node.
- One dedicated **Error Trigger** node type, so users can build a real "on any workflow failure, notify Slack" workflow, matching n8n's Error Trigger pattern exactly.

**Then, as an advanced option** (not default, to avoid overwhelming new users): expose Make's directive vocabulary (`Break`, `Break & Commit`, `Break & Rollback`, `Resume`, `Retry`) as extra choices in the edge context menu you already built (currently: Set up filter / Unlink / Add router / Add module / Add note / Select entire branch) — "Add error handler" becomes a 7th item, opening a small directive picker.

**Incomplete Executions queue**: when a workflow fails mid-run in production (not a test), don't just fail silently — write it to a small in-memory (later: persisted) list surfaced on the Executions nav page, so a user can inspect and manually retry it, matching Make's queue.

---

## 7. Credentials & connections

Already strong — named multi-alias credentials, OAuth/API-key/form kinds, correctly scoped per node instance (not per type, after the fix earlier this session). Two additions worth planning for:

- **Encryption note**: n8n encrypts credential values at rest using a server-side key. Oasys Flow's credentials currently live in `localStorage` as plain JSON — fine for a local-first demo, but the moment there's any server sync, `credentialStore` values need to be encrypted before they leave the browser, not just before they hit a DB.
- **Shared/team credentials**: n8n lets a credential be owned by a project and shared across users; Make/Zapier connections are implicitly account-wide. For a future multi-user Oasys Flow, credentials should carry an owner + shared-with list, but the current single-alias-per-service UI doesn't need to change — just the storage layer.

---

## 8. AI-native features

The AI Agent node's visual shell (dark card, green "configured" border, 3 ports for Chat Model / Memory / Tool) is already built and matches n8n's actual node exactly. To make it real:

- Each of the 3 ports should behave like the branch stubs you already built for the Router node — i.e., they're **connection points that only accept specific node categories** (Chat Model port only accepts model-provider nodes like OpenRouter/Ollama; Tool port accepts any node marked `usableAsTool: true`; Memory port accepts a `memory` node type).
- Add `$fromAI()` as a mappable-field option: a param can be marked "let the agent decide this value at runtime" instead of a static or upstream-mapped value — visually, this could be a third state on the existing Map toggle (off / mapped / AI-filled), reusing the toggle switch you already built.

---

## 9. Testing & debugging

- **Pin data** (n8n): once a node has real runtime output (§2), let a user "pin" a specific set of items to it, so downstream nodes can be built/tested against realistic sample data without re-running the whole trigger every time. Surface as a pin icon in the node modal header, next to the existing docs/close icons.
- **Execution log**: the Executions nav item currently does nothing. Populate it with a per-run list (workflow, timestamp, status: success/error/incomplete — reuse the status-pill component already built for the Dashboard cards), and clicking a run opens the canvas in a read-only "replay" mode where each node shows its actual input/output for that run (this is also where the drag-from-panel mapping in §3.4 gets its live data source).
- **Run Once vs. Execute**: the floatbar's "Run once" already exists as a label — make it real by distinguishing a single test execution (uses pinned/sample data, doesn't affect external systems if a node is marked test-safe) from the topbar's "Execute" (a full production run).

---

## 10. Built-in data storage

Add a `Table` node type (Zapier's Tables model — the simplest of the three and the best fit for a lightweight, no-external-DB use case): records/fields/cells, with the node's params being `operation` (Create Record / Find Records / Update Record / Delete Record), a table-picker, and field-mapping into the record shape using the same mapping engine as every other node. This turns Oasys Flow's `localStorage`-backed persistence (already built this session) into something workflows can *use*, not just something the app uses for itself.

---

## 11. Versioning, templates, portability

- **JSON export/import already exists** — this is the single most important portability feature and it's done. Apply the §3.4 stable-ID fix so exported/re-imported workflows don't carry stale display-name tokens.
- **Template gallery**: the two demo workflows (Lead Capture Pipeline, Donation Thank You Email) are already effectively templates. Formalize: a "Templates" nav view (nav item already exists, currently inert) listing starter workflows — including these two — that "Use template" clones into a new workflow via the existing `importWorkflowJSON()` path.
- **Node/template versioning**: n8n is still actively building this (per their own community feature-request thread), so there's no need to over-engineer it now — just make sure every exported JSON carries a `formatVersion` (already added: `formatVersion: 1`) so future breaking changes to the schema can be detected on import.

---

## 12. Code execution & advanced data tools

Every platform eventually hits things the mapping engine (§3) can't express — arbitrary logic, bulk math, regex, or a transform so specific it doesn't deserve a name in the ~15-function library from §3.3.2. All three competitors solve this with an escape hatch node.

**Code node** — n8n's version is the right reference: a dedicated node type whose param is a real script, sandboxed (no filesystem, no network beyond what the workflow already grants via HTTP Request), with two run modes selectable per instance:
- **Run Once for All Items** — the script receives the whole upstream item array and returns an array (bulk transforms, custom aggregation).
- **Run Once for Each Item** — the script runs once per item and returns one item each time (n8n's default mental model for most users).

n8n additionally supports Python for this node (server-side only — even their own Cloud offering restricts it to no third-party imports). For Oasys Flow, ship JS first (it can reuse the *item* plumbing from §2) and treat Python as a v2+ stretch goal once there's a real backend (§16) to run it in.

**Formatter node** — Zapier's Formatter is effectively a stateless function library promoted to a first-class node (Text: split/replace/truncate/case; Numbers: round/currency/math; Date/Time: format/shift/diff; Utilities: lookup table, dedupe). The distinction from §3.3.2's inline transform chips: a Formatter node's *output* is itself mappable and branchable downstream, useful when a transform result needs to be reused by more than one later node, or inspected on its own in the execution log (§9). Ship it as a single `formatter` node type whose first param is an `operation` select, mirroring the existing operation-driven param pattern.

**Real condition builder for Router/If** — today `ifelse`'s branches are label/hint pairs with no actual condition config. Add a per-branch condition group: repeatable rows of `{ field (mappable), operator, value (mappable) }` combined with AND/OR, matching Make's per-route filter and Zapier's Paths rule builder — rendered inside the existing node-modal params slot, no new UI chrome needed.

---

## 13. Forms & human-in-the-loop

**Form Trigger** — a new trigger node type, visually and structurally a sibling of the existing `chatInterface` node (same "trigger card, single output" shape) but its param is a field list (short text / long text / number / select / checkbox / file) instead of one question. Reuses the Webhook node's Test-URL-vs-Production-URL split (§5.1) so a form can be safely iterated on before going live. For multi-page forms, chain a second, non-trigger `form` node mid-workflow — submitting page 1 resumes the run into page 2, matching n8n's Form Trigger + Form node pairing exactly.

**Wait node** — pauses a run and resumes on one of three conditions: a fixed duration, an external webhook call, or a form submission. This single primitive is what makes approvals possible without inventing a bespoke "approval" runtime concept.

**Request Approval pattern** — rather than a new primitive, spec this as a pre-configured convenience: dropping a "Request Approval" node onto the canvas auto-wires a `Wait` (form-resume mode) with two pre-built buttons (Approve/Decline) and a reviewer-notification param, mirroring how Zapier's own Human in the Loop feature (Request Approval / Collect Data / Notify) presents three simple choices to the end user even though it's built on more general primitives underneath.

---

## 14. Organization & governance

- **Folders + tags on the Dashboard**: tags are flat, global labels (filter chips above the workflow-card grid, exactly like the existing status pills); folders are a real nested tree for ownership/project grouping, shown as a collapsible sidebar tree next to the card grid. Ship both — they solve different problems (n8n ships both, after years of folder requests from tag-only users).
- **Global search**: one topbar search box across workflow names, node labels/types, and mapped-field text — becomes necessary the moment a user has more than ~15 workflows.
- **Workflow version history**: every meaningful save appends to a per-workflow history list instead of overwriting state. This is almost free — `snapshotCanvas()` (already built for undo/redo, §9) already serializes full canvas state; history just means *keeping* N of those snapshots with a timestamp instead of discarding them, surfaced via a clock icon in the topbar with a restore/clone/compare list, matching n8n's Workflow History panel and Make's Version History view.
- **Draft vs. Active**: formalize what the JSON schema's existing `workflow.status` field means — Draft workflows never fire automatically (manual test-run only); Active workflows have live triggers/schedules. Same on/off idea as n8n's Active toggle and Make's scenario switch, just given real semantics instead of being decorative.
- **Global Variables store**: a small new "Variables" nav view holding name → value pairs available to every workflow as a new pseudo-source in the field-picker (`{{$vars.API_BASE_URL}}`, listed alongside upstream nodes), for shared *non-secret* config, distinct from per-node credentials (§7). Modeled on Make's Custom Variables / Data Store Keys.

---

## 15. Collaboration & multi-user

- **Projects**: a project groups workflows + credentials + folders, and a user's role is scoped *per project* — the same person can be an Admin on one project and a Viewer on another. Recommend this over a flatter Make-style single "Team" because it composes cleanly with the per-node-instance credential scoping already built this session (a credential's owner becomes the project, not the individual user).
- **Roles**: four tiers is enough — Owner (instance-level), Admin (manage project members + credentials), Editor (build + run), Viewer (inspect workflows and execution logs, read-only).
- **Shared credentials, made visible**: extends §7's "owner + shared-with" note into an actual UI affordance — the existing credential picker (`credNodeSelect`) gains a small lock/people icon showing private vs. project-shared.
- **Sticky Note canvas element**: a text-only annotation block for team notes, cheap to add since it reuses the existing node-card rendering path with zero ports/connections — n8n ships literally this (a "Sticky Note" node with no inputs or outputs).
- **Activity/audit log**: a flat "who changed what, when" timeline per workflow, fed by the same save-events as the version history in §14 — just presented as a log instead of restorable snapshots.

---

## 16. Real backend runtime & operations

Everything up to this point — including everything already built — runs entirely in the browser. That's the right call for a fast, good-looking demo, but it's also the one gap that separates "looks like n8n" from "is a clone of n8n": nothing runs unless a tab is open. Closing that gap is its own, much larger project; this section specs the shape of it so the rest of the app (which doesn't need to change) has somewhere real to plug into eventually.

- **A real execution engine**: a server-side process that walks the graph in topological order (respecting router branches and loops), calling each node type's `execute()` function (already an optional, additive field in §4's schema) and persisting per-run, per-node input/output — this is what finally makes the Execute button, Execution log, and pin data from §9 real instead of mocked.
- **Scale architecture**: n8n's **queue mode** is the right reference point — a main process owns the UI, webhooks, and scheduling and writes jobs to a Redis-backed queue; one or more worker processes pull jobs and execute them, with Postgres holding shared state. Not needed on day one (a single process is fine for one user), but the execution engine above should be written so a single-process "main does everything" mode and a queue-mode split are the same code path with a config flag, not two implementations.
- **Webhook security**: HMAC signature verification against a per-credential secret, an optional IP allowlist, and a dedicated **Respond to Webhook** node so a webhook-triggered run can return a custom status/body instead of a generic 200 — plus the Test-URL/Production-URL split (§13) applied to the plain `webhook` node type, not just Forms.
- **Concurrency limits**: cap how many runs of the same workflow can execute in parallel, so a runaway loop or a webhook flood can't fork the process into oblivion — matches n8n's per-instance execution-concurrency setting.
- **Real Executions/ops dashboard**: the Dashboard view's workflow cards currently show static numbers — once runs are real, back them with actual counts (runs, success/error rate, last-run timestamp).
- **Account-level failure notifications**: distinct from a user building their own "on error, notify Slack" workflow (§6) — a single account setting ("email me if any workflow fails") that works even for workflows nobody bothered to add error handling to, matching n8n Cloud's default failure emails and Make's account-level scenario-error alerts.

---

## 17. Phased roadmap

**Phase 1 — Mapping engine (highest leverage, do first)**
Stable node-ID-based tokens (§3.4) → real expression evaluator behind `{{ }}` (§3.3.1) → inline transform functions tab (§3.3.2).

**Phase 2 — Reliability**
Per-node Retry/On-Error settings (§6) → red error-output stub → Error Trigger node type.

**Phase 3 — Execution reality**
Item-shaped runtime data (§2) → Execute button actually runs mock data through the graph → Execution log + pin data (§9).

**Phase 4 — Composition**
Loops (§5.3) → Sub-workflows (§5.4) → Table node (§10).

**Phase 5 — Ecosystem**
Node definition schema finalized for third parties (§4) → Template gallery (§11) → shared credentials (§7).

**Phase 6 — Code & advanced data tools**
Code node, sandboxed JS with run-once-for-all vs. run-once-per-item (§12) → Formatter node (§12) → real multi-condition builder for Router/If branches (§12).

**Phase 7 — Forms & human-in-the-loop**
Form Trigger + chained Form node for multi-step forms (§13) → Wait node — time / webhook / form-resume (§13) → Request Approval convenience pattern (§13).

**Phase 8 — Organization & governance**
Folders + tags on the Dashboard (§14) → global search (§14) → workflow version history + restore (§14) → Draft/Active formalized (§14) → global Variables store (§14).

**Phase 9 — Collaboration & multi-user**
Projects with per-project roles (§15) → shared-credential indicator (§15) → Sticky Note canvas element (§15) → activity/audit log (§15).

**Phase 10 — Real backend & operations**
Server-side execution engine (§16) → queue-mode-style scale architecture (§16) → webhook security + Respond to Webhook node (§16) → concurrency limits (§16) → real Executions/ops dashboard (§16) → account-level failure notifications (§16).

*Phases 1–5 make the existing canvas fully real. Phases 6–10 are what take it from "a very good demo of a workflow builder" to full feature parity with n8n and Make.com — a code escape hatch, forms/approvals, org-scale governance, multi-user collaboration, and a backend that runs workflows whether or not anyone has a tab open.*

---

## Sources

- n8n: [Expression reference](https://docs.n8n.io/build/work-with-data/transform-data/expression-reference) · [Use the UI mapper](https://docs.n8n.io/build/work-with-data/reference-data/use-the-ui-mapper) · [How n8n structures data](https://docs.n8n.io/data/data-structure/) · [Item linking](https://docs.n8n.io/data/data-mapping/data-item-linking/) · [Error handling](https://docs.n8n.io/flow-logic/error-handling/) · [Credentials](https://n8n.school/blog/n8n-credentials-explained) · [Execute Sub-workflow](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executeworkflow) · [AI Agent](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent) · [Triggers guide](https://growwstacks.com/blog/complete-guide-to-n8n-triggers) · [Loop Over Items](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.splitinbatches) · [Templates](https://docs.n8n.io/workflows/templates/) · [Code node](https://docs.n8n.io/code/code-node/) · [Form Trigger](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.formtrigger) · [Workflow history](https://docs.n8n.io/workflows/history/) · [Organize work in projects](https://docs.n8n.io/administer/manage-users-and-access/set-permissions-and-roles-rbac/organize-work-in-projects) · [Tag workflows](https://docs.n8n.io/build/manage-workflows/tag-workflows) · [Configuring queue mode](https://docs.n8n.io/hosting/scaling/queue-mode/)
- Make.com: [Mapping](https://help.make.com/mapping) · [Mapping arrays](https://help.make.com/mapping-arrays) · [Data mapping explained](https://growwstacks.com/blog/make-com-data-mapping-explained) · [Bundles/arrays/collections](https://www.theaiautomators.com/understanding-bundles-arrays-and-collections-in-makecom/) · [Router module](https://consultevo.com/make-com-router-module-guide/) · [Array Aggregator](https://consultevo.com/make-com-array-aggregator-guide/) · [Error handling & directives](https://use-apify.com/blog/make-com-error-handling-guide) · [Break directive](https://consultevo.com/make-com-break-error-handler-guide/) · [Scenario history](https://growwstacks.com/blog/how-to-use-make-com-scenario-history) · [Incomplete executions](https://help.make.com/manage-incomplete-executions) · [Custom variables](https://help.make.com/custom-variables) · [Data Stores API](https://developers.make.com/api-documentation/api-reference/data-stores) · [Restore a previous scenario version](https://help.make.com/restore-a-previous-scenario-version)
- Zapier: [Send data between steps by mapping fields](https://help.zapier.com/hc/en-us/articles/8496343026701-Send-data-between-steps-by-mapping-fields) · [Enter data in Zap fields](https://help.zapier.com/hc/en-us/articles/31709122224653-Enter-data-in-Zap-fields) · [Paths](https://help.zapier.com/hc/en-us/articles/8496288555917-Add-branching-logic-to-Zap-workflows-with-Paths) · [Zapier Tables](https://help.zapier.com/hc/en-us/articles/9804340895245-Create-tables-and-store-data-with-Zapier-Tables) · [Code by Zapier](https://help.zapier.com/hc/en-us/articles/8496310939021-Use-JavaScript-code-in-Zap-workflows) · [Formatter](https://zapier.com/blog/updates/593/introducing-formatter-by-zapier) · [Human in the Loop](https://help.zapier.com/hc/en-us/sections/38731226552845-Human-in-the-Loop) · [Request approval](https://help.zapier.com/hc/en-us/articles/38731463206029-Request-approval-to-keep-your-workflow-running-with-Human-in-the-Loop)
