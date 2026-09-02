# Make + n8n Functionality Clone — Master Checklist

Use this as a functional acceptance checklist. UI styling is intentionally excluded from redesign: the fixed UI must remain unchanged while every functional item below is implemented and verified.

Converted from `make_n8n_functionality_clone_checklist.pdf`, then trimmed to single-user, browser-only scope. **Oasys Flow runs entirely in one browser tab — no server, no database, no login system, no real multiple users.** Everything below is achievable as a client-side app; anything that inherently needed a real always-on server, a real identity/auth provider, or more than one real user account was removed rather than left unchecked forever. Five whole sections were cut outright: Collaboration, RBAC / Security, API / CLI, Multi-Tenancy / Enterprise, and Platform Admin — all of them assume a company running the app for many customers, which this isn't. Items like "Encrypted secret storage," "OAuth authorization," and "workflow data store" stay in, but with a mental asterisk: they're client-side approximations (e.g. credentials sit in `localStorage`, not behind a real vault), not enterprise-grade guarantees.

If a later decision brings a real backend into scope, the removed sections are still sitting in git history (see the previous version of this file) and can be restored.

## Master coverage summary

| Area | Checklist items | Status |
|---|---|---|
| Product Scope & UI Lock | 8 | Not started |
| Workflow / Scenario Builder | 15 | Not started |
| Triggers | 12 | Not started |
| Action / App Module System | 12 | Not started |
| Flow Control | 16 | Not started |
| Data Mapping & Expressions | 17 | Not started |
| Built-in Transformers & Tools | 16 | Not started |
| HTTP / REST / API | 17 | Not started |
| Webhooks | 12 | Not started |
| Databases & Storage | 15 | Not started |
| Files & Binary Data | 10 | Not started |
| Code Execution | 11 | Not started |
| Credentials & Connections | 12 | Not started |
| Execution Engine | 11 | Not started |
| Error Handling | 14 | Not started |
| Execution History & Debugging | 14 | Not started |
| Scheduling & Control | 11 | Not started |
| Integrations / App Ecosystem | 14 | Not started |
| Custom App / Connector Builder | 12 | Not started |
| AI / LLM Functionality | 15 | Not started |
| AI Agents | 14 | Not started |
| MCP | 6 | Not started |
| Templates | 8 | Not started |
| Monitoring / Observability | 11 | Not started |
| Alerts / Notifications | 7 | Not started |
| Versioning / Deployment | 8 | Not started |
| Data Governance | 5 | Not started |
| Testing / Quality | 9 | Not started |
| Performance / Scale | 7 | Not started |

**339 items** across 29 sections (down from 450+ across 34 — Collaboration, RBAC/Security, API/CLI, Multi-Tenancy/Enterprise and Platform Admin removed in full; every remaining section had its server/multi-user items stripped).

## A. Product scope & UI lock

- [ ] UI style is fixed and must not be redesigned while functionality is implemented.
- [ ] Functional behavior is independent of visual styling.
- [ ] Every screen has defined loading, empty, success, error, disabled and permission states.
- [ ] Responsive canvas/editor behavior is preserved.
- [ ] Keyboard shortcuts, context menus, drag/drop and selection behavior are defined.
- [ ] Global search covers workflows, nodes, credentials, executions and templates where applicable.
- [ ] Undo/redo, copy/paste, duplicate, delete and multi-select work consistently.
- [ ] Workflow autosave and explicit save/publish states are implemented.

## B. Workflow / scenario builder

- [ ] Create, rename, duplicate, archive, delete, import and export workflows.
- [ ] Visual drag-and-drop node/module canvas.
- [ ] Connect nodes with directional edges.
- [ ] Branching and multiple outgoing paths.
- [ ] Node configuration panels with required-field validation.
- [ ] Node enable/disable and execution controls.
- [ ] Run whole workflow; run/test individual node.
- [ ] Pin/mock/test data and inspect node input/output.
- [ ] Workflow notes/comments/documentation.
- [ ] Canvas zoom, pan, minimap, fit-to-screen and full-screen.
- [ ] Node grouping and visual organization.
- [ ] Workflow inputs and outputs.
- [ ] Workflow metadata, tags, folders and custom properties.
- [ ] Sub-workflows / reusable workflows.
- [ ] Workflow templates and cloning.

## C. Triggers

- [ ] Manual trigger.
- [ ] Schedule / interval / cron trigger.
- [ ] Application event trigger.
- [ ] Polling trigger.
- [ ] Instant/webhook trigger.
- [ ] Form/chat/message trigger.
- [ ] File/storage event trigger.
- [ ] Database event trigger.
- [ ] Workflow-to-workflow trigger.
- [ ] Event-stream trigger.
- [ ] Trigger authentication, validation and payload inspection.
- [ ] Trigger test mode and sample payload capture.

## D. Action / app module system

- [ ] App/module architecture with standardized metadata.
- [ ] Trigger modules.
- [ ] Action modules.
- [ ] Search modules.
- [ ] Get/list/create/update/delete/upsert operations where supported.
- [ ] Module-specific configuration and dynamic fields.
- [ ] Dynamic dropdowns populated from connected apps.
- [ ] Pagination support.
- [ ] Batch operations.
- [ ] Binary/file inputs and outputs.
- [ ] Module documentation/help.
- [ ] Module versioning and backward compatibility.

## E. Flow control

- [ ] IF / conditional branching.
- [ ] Switch / multiple-case routing.
- [ ] Router with multiple paths.
- [ ] Filters on connections/paths.
- [ ] Loop / iterate items.
- [ ] Repeat N times.
- [ ] Split arrays/items.
- [ ] Batch processing.
- [ ] Merge branches.
- [ ] Wait for all branches.
- [ ] Continue after any branch where supported.
- [ ] Array aggregator.
- [ ] Item aggregation / reduce.
- [ ] Deduplication.
- [ ] Stop/terminate branch.
- [ ] Break/continue loop semantics.

## F. Data mapping & expressions

- [ ] Visual field mapping between modules.
- [ ] Expression editor.
- [ ] Reference previous-node data.
- [ ] Reference trigger data.
- [ ] Reference workflow variables.
- [ ] Nested object/array access.
- [ ] String functions.
- [ ] Number/math functions.
- [ ] Boolean/logical functions.
- [ ] Date/time functions.
- [ ] Array functions.
- [ ] Object/JSON functions.
- [ ] Regex operations.
- [ ] Null/empty handling.
- [ ] Type conversion.
- [ ] Expression validation and autocomplete.
- [ ] Preview evaluated expression against test data.

## G. Built-in transformers & tools

- [ ] Set/Edit fields.
- [ ] Rename fields.
- [ ] Remove fields.
- [ ] Create JSON.
- [ ] Parse JSON.
- [ ] Convert formats.
- [ ] Text manipulation.
- [ ] Date/time manipulation.
- [ ] Math operations.
- [ ] Array operations.
- [ ] Aggregate data.
- [ ] Data filtering.
- [ ] Data normalization.
- [ ] CSV parsing/generation.
- [ ] XML parsing/generation.
- [ ] HTML/text extraction utilities where applicable.

## H. HTTP / REST / API

- [ ] HTTP GET/POST/PUT/PATCH/DELETE/HEAD.
- [ ] Query parameters.
- [ ] Headers.
- [ ] JSON body.
- [ ] Raw/text body.
- [ ] Form-data.
- [ ] Multipart file upload.
- [ ] Authentication: API key, Basic, Bearer, OAuth and custom.
- [ ] Custom status-code handling.
- [ ] Timeout configuration.
- [ ] Retry policy.
- [ ] Pagination.
- [ ] Rate-limit handling.
- [ ] Response parsing.
- [ ] Binary response handling.
- [ ] Webhook response handling.
- [ ] Generic API connector so arbitrary APIs can be automated.

## I. Webhooks

- [ ] Create/manage webhook endpoints.
- [ ] Unique webhook URLs.
- [ ] GET/POST webhook support.
- [ ] Webhook authentication.
- [ ] Signature verification.
- [ ] Payload validation.
- [ ] JSON/form/binary payloads.
- [ ] Webhook response configuration.
- [ ] Webhook test listener.
- [ ] Webhook execution logs.
- [ ] Webhook replay.
- [ ] Webhook enable/disable.

## J. Databases & storage

- [ ] PostgreSQL.
- [ ] MySQL/MariaDB.
- [ ] SQLite.
- [ ] Microsoft SQL Server.
- [ ] MongoDB.
- [ ] Redis.
- [ ] Cloud database integrations.
- [ ] Execute SQL/query.
- [ ] CRUD operations.
- [ ] Transactions where supported.
- [ ] Batch operations.
- [ ] Workflow data store/key-value store.
- [ ] Persistent state between executions.
- [ ] TTL/expiration.
- [ ] Cache/deduplication state.

## K. Files & binary data

- [ ] Upload/download files.
- [ ] Read/write binary data.
- [ ] Move/copy/rename/delete files.
- [ ] File metadata.
- [ ] Multipart uploads.
- [ ] Cloud storage integrations.
- [ ] PDF/DOCX/XLSX/CSV/image/audio/video handling through integrations/tools.
- [ ] Compression/decompression.
- [ ] Encoding/decoding.
- [ ] Binary-to-text and text-to-binary conversion.

## L. Code execution

- [ ] JavaScript code node.
- [ ] Python code node.
- [ ] Sandboxed execution.
- [ ] Input/output mapping.
- [ ] Execution timeout.
- [ ] Memory/resource limits.
- [ ] Package/dependency policy.
- [ ] Console/log output.
- [ ] Code editor.
- [ ] Code test/run.
- [ ] Error capture.

## M. Credentials & connections

- [ ] Central credential manager.
- [ ] Create/edit/delete credentials.
- [ ] Test connection.
- [ ] OAuth authorization.
- [ ] OAuth refresh token handling.
- [ ] API keys.
- [ ] Basic authentication.
- [ ] Bearer/JWT.
- [ ] Database credentials.
- [ ] Custom authentication.
- [ ] Encrypted secret storage.
- [ ] Credential expiration/rotation support.

## N. Execution engine

- [ ] Persist workflow definition.
- [ ] Resolve node dependencies.
- [ ] Sequential execution.
- [ ] Parallel execution.
- [ ] Execution state persistence.
- [ ] Pause/resume.
- [ ] Cancellation.
- [ ] Timeouts.
- [ ] Retries.
- [ ] Backoff.
- [ ] Idempotency/deduplication.

## O. Error handling

- [ ] Node-level errors.
- [ ] Workflow-level errors.
- [ ] Continue-on-error behavior.
- [ ] Retry failed node.
- [ ] Retry with configurable delay/backoff.
- [ ] Error branches.
- [ ] Fallback paths.
- [ ] Custom error handling.
- [ ] Timeout handling.
- [ ] Rate-limit handling.
- [ ] Authentication failure handling.
- [ ] Execution replay.
- [ ] Failed execution resume.
- [ ] Error notifications.

## P. Execution history & debugging

- [ ] Execution list.
- [ ] Execution status: running/success/failed/cancelled/waiting.
- [ ] Execution ID.
- [ ] Start/end time and duration.
- [ ] Per-node execution status.
- [ ] Per-node input/output.
- [ ] Node logs.
- [ ] Error stack/details.
- [ ] Execution search/filter.
- [ ] Execution replay.
- [ ] Retry execution.
- [ ] Download/export execution data.
- [ ] Pin test data.
- [ ] Live execution visualization on canvas.

## Q. Scheduling & control

- [ ] Enable/disable workflow.
- [ ] Minute/hour/day/week/month schedules.
- [ ] Cron expressions.
- [ ] Timezone selection.
- [ ] Start/end scheduling windows.
- [ ] Business-hours scheduling.
- [ ] Manual run.
- [ ] Immediate run.
- [ ] Scheduled run.
- [ ] Concurrency controls.
- [ ] Execution priority.

## R. Integrations / app ecosystem

- [ ] Large pre-built integration catalog.
- [ ] Verified/official integrations.
- [ ] Community/custom integrations.
- [ ] App categories.
- [ ] App search.
- [ ] App authentication.
- [ ] App triggers/actions/searches.
- [ ] App-specific pagination.
- [ ] App-specific webhooks.
- [ ] Dynamic fields/options.
- [ ] App versioning.
- [ ] Integration documentation.
- [ ] Generic HTTP integration for any API.
- [ ] Custom app/integration SDK.

## S. Custom app / connector builder

- [ ] Create custom app.
- [ ] Define app metadata.
- [ ] Define authentication.
- [ ] Define triggers.
- [ ] Define actions.
- [ ] Define searches.
- [ ] Define webhook events.
- [ ] Define dynamic fields.
- [ ] Define API requests.
- [ ] Define response mapping.
- [ ] Test custom app.
- [ ] Version custom app.

## T. AI / LLM functionality

- [ ] LLM provider connections.
- [ ] OpenAI/Anthropic/Gemini/local/custom model support.
- [ ] Prompt input.
- [ ] System instructions.
- [ ] Model parameters.
- [ ] Structured JSON output.
- [ ] Text generation.
- [ ] Summarization.
- [ ] Classification.
- [ ] Extraction.
- [ ] Translation.
- [ ] Sentiment analysis.
- [ ] Embeddings.
- [ ] Token/usage tracking.
- [ ] AI error/retry handling.

## U. AI agents

- [ ] Create reusable agent.
- [ ] System prompt.
- [ ] Model selection.
- [ ] Tool selection.
- [ ] Tool calling.
- [ ] Agent memory.
- [ ] Context management.
- [ ] Maximum iterations.
- [ ] Agent execution logs.
- [ ] Structured agent output.
- [ ] Human approval step.
- [ ] Agent as workflow node.
- [ ] Workflow as agent tool.
- [ ] Agent testing.

## V. MCP

- [ ] MCP client.
- [ ] Connect external MCP servers.
- [ ] MCP authentication.
- [ ] Tool discovery.
- [ ] Tool permissions.
- [ ] Tool execution logs.

## W. Templates

- [ ] Browse templates.
- [ ] Search templates.
- [ ] Categories.
- [ ] Template preview.
- [ ] Clone template.
- [ ] Create template.
- [ ] Template versioning.
- [ ] Template variables/setup wizard.

## X. Monitoring / observability

- [ ] Execution dashboard.
- [ ] Success/failure metrics.
- [ ] Execution duration.
- [ ] Workflow usage.
- [ ] Node usage.
- [ ] Error rate.
- [ ] Logs.
- [ ] Searchable logs.
- [ ] Alerts.
- [ ] Analytics dashboards.
- [ ] Operational overview across workflows.

## Y. Alerts / notifications

- [ ] Webhook notifications.
- [ ] Slack/Teams/Discord-style notifications through integrations.
- [ ] Failure alerts.
- [ ] Repeated-failure alerts.
- [ ] Execution completion alerts.
- [ ] Approval notifications.
- [ ] Custom alert conditions.

## Z. Versioning / deployment

- [ ] Workflow drafts.
- [ ] Published/live workflow.
- [ ] Workflow versions.
- [ ] Version history.
- [ ] Compare versions.
- [ ] Rollback.
- [ ] Import/export workflow JSON.
- [ ] Environment variables.

## AA. Data governance

- [ ] Retention policies.
- [ ] Execution-data retention.
- [ ] Log retention.
- [ ] Credential secret handling.
- [ ] PII-sensitive data controls.

## AB. Testing / quality

- [ ] Unit-testable node execution.
- [ ] Workflow validation.
- [ ] Schema validation.
- [ ] Credential connection tests.
- [ ] Test workflow with sample data.
- [ ] Mock external services.
- [ ] Replay production execution in safe mode.
- [ ] Regression tests for workflow versions.
- [ ] Integration tests.

## AC. Performance / scale

- [ ] Parallel node execution.
- [ ] Per-integration rate limiting.
- [ ] Large payload handling.
- [ ] Streaming where applicable.
- [ ] Pagination.
- [ ] Batching.
- [ ] Caching.

## Final acceptance gate

Do not mark the clone complete merely because the UI looks similar. A feature is complete only when it can be configured, executed, observed, error-handled and persisted as applicable.

- [ ] Every listed functional requirement has been implemented or explicitly marked out-of-scope.
- [ ] Existing fixed UI has not been changed except where required to expose functionality.
- [ ] Every trigger can actually start an execution.
- [ ] Every action/module can execute against real external services (where the browser's own network access allows it).
- [ ] Data can be mapped between nodes and expressions evaluate correctly.
- [ ] Branching, loops, merging, aggregation and filtering work with real execution data.
- [ ] Failed executions can be diagnosed and, where supported, retried/resumed.
- [ ] Credentials are stored client-side and never exposed in execution output/logs.
- [ ] Workflow state survives a page refresh/browser restart (localStorage).
- [ ] Execution history accurately reflects each node's status, input/output and errors.
- [ ] Import/export preserves workflow behavior.
- [ ] Real-world end-to-end scenarios have been tested, not just mocked node tests.

Reference basis: current Make product/integration documentation and current n8n feature documentation, trimmed to what a single-user, no-backend, browser-only app can actually deliver.
