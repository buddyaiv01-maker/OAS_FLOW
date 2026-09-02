# Make + n8n Functionality Clone — Master Checklist

Use this as a functional acceptance checklist. UI styling is intentionally excluded from redesign: the fixed UI must remain unchanged while every functional item below is implemented and verified.

Converted from `make_n8n_functionality_clone_checklist.pdf`. Check items off here as the React port ([Oasys_flowReact](.)) reaches parity — this is the yardstick for "done," not the visual UI matching `legacy_UI`.

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
| Webhooks | 13 | Not started |
| Databases & Storage | 16 | Not started |
| Files & Binary Data | 10 | Not started |
| Code Execution | 11 | Not started |
| Credentials & Connections | 14 | Not started |
| Execution Engine | 20 | Not started |
| Error Handling | 14 | Not started |
| Execution History & Debugging | 14 | Not started |
| Scheduling & Control | 11 | Not started |
| Integrations / App Ecosystem | 14 | Not started |
| Custom App / Connector Builder | 13 | Not started |
| AI / LLM Functionality | 15 | Not started |
| AI Agents | 14 | Not started |
| MCP | 9 | Not started |
| Templates | 9 | Not started |
| Collaboration | 11 | Not started |
| RBAC / Security | 15 | Not started |
| Monitoring / Observability | 14 | Not started |
| Alerts / Notifications | 8 | Not started |
| Versioning / Deployment | 12 | Not started |
| API / CLI | 11 | Not started |
| Multi-Tenancy / Enterprise | 14 | Not started |
| Data Governance | 8 | Not started |
| Testing / Quality | 9 | Not started |
| Performance / Scale | 13 | Not started |
| Platform Admin | 13 | Not started |

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
- [ ] Queueing for burst traffic.
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
- [ ] Connection pooling.
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
- [ ] Credential sharing controls.
- [ ] Credential access permissions.
- [ ] Credential expiration/rotation support.

## N. Execution engine

- [ ] Persist workflow definition.
- [ ] Resolve node dependencies.
- [ ] Sequential execution.
- [ ] Parallel execution.
- [ ] Queue-based execution.
- [ ] Worker execution.
- [ ] Execution state persistence.
- [ ] Pause/resume.
- [ ] Cancellation.
- [ ] Timeouts.
- [ ] Retries.
- [ ] Backoff.
- [ ] Concurrency limits.
- [ ] Per-workflow execution limits.
- [ ] Per-user/tenant limits.
- [ ] Rate limiting.
- [ ] Idempotency/deduplication.
- [ ] Crash recovery.
- [ ] Graceful worker failure recovery.
- [ ] Dead-letter/failed execution handling.

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
- [ ] Publish/share custom app.

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
- [ ] MCP server.
- [ ] Expose workflows as tools.
- [ ] Expose approved workflow actions as tools.
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
- [ ] Share template.
- [ ] Template versioning.
- [ ] Template variables/setup wizard.

## X. Collaboration

- [ ] Workspaces/organizations.
- [ ] Users.
- [ ] Teams.
- [ ] Invite members.
- [ ] Roles.
- [ ] Workflow ownership.
- [ ] Shared workflows.
- [ ] Comments/notes.
- [ ] Activity history.
- [ ] Permission management.
- [ ] Team-level credentials/connections.

## Y. RBAC / security

- [ ] Owner/admin/editor/operator/viewer roles.
- [ ] Workflow permissions.
- [ ] Credential permissions.
- [ ] Execution/log permissions.
- [ ] Integration permissions.
- [ ] API permissions.
- [ ] Secret isolation.
- [ ] Encryption at rest.
- [ ] Encryption in transit.
- [ ] Audit logs.
- [ ] SSO/OIDC/SAML where required.
- [ ] MFA support.
- [ ] API keys.
- [ ] Session/security controls.
- [ ] IP/network restrictions where required.

## Z. Monitoring / observability

- [ ] Execution dashboard.
- [ ] Success/failure metrics.
- [ ] Execution duration.
- [ ] Workflow usage.
- [ ] Node usage.
- [ ] API usage.
- [ ] Queue depth.
- [ ] Worker health.
- [ ] Error rate.
- [ ] Logs.
- [ ] Searchable logs.
- [ ] Alerts.
- [ ] Analytics dashboards.
- [ ] Operational overview across workflows.

## AA. Alerts / notifications

- [ ] Email notifications.
- [ ] Webhook notifications.
- [ ] Slack/Teams/Discord-style notifications through integrations.
- [ ] Failure alerts.
- [ ] Repeated-failure alerts.
- [ ] Execution completion alerts.
- [ ] Approval notifications.
- [ ] Custom alert conditions.

## AB. Versioning / deployment

- [ ] Workflow drafts.
- [ ] Published/live workflow.
- [ ] Workflow versions.
- [ ] Version history.
- [ ] Compare versions.
- [ ] Rollback.
- [ ] Import/export workflow JSON.
- [ ] Development/staging/production environments.
- [ ] Environment variables.
- [ ] Environment-specific credentials.
- [ ] Deployment/promotion.
- [ ] CI/CD integration.

## AC. API / CLI

- [ ] Workflow CRUD API.
- [ ] Workflow execution API.
- [ ] Execution history API.
- [ ] Webhook API.
- [ ] Credential API.
- [ ] Template API.
- [ ] User/team API.
- [ ] Integration API.
- [ ] API authentication.
- [ ] API rate limits.
- [ ] CLI for workflow operations where applicable.

## AD. Multi-tenancy / enterprise

- [ ] Tenant/workspace isolation.
- [ ] Tenant-specific credentials.
- [ ] Tenant-specific executions.
- [ ] Tenant-specific data stores.
- [ ] Tenant-level quotas.
- [ ] Tenant-level rate limits.
- [ ] Resource isolation.
- [ ] Worker scaling.
- [ ] High availability.
- [ ] Backups.
- [ ] Disaster recovery.
- [ ] Audit/compliance controls.
- [ ] On-prem/self-hosted deployment option.
- [ ] Private networking/on-prem agent where required.

## AE. Data governance

- [ ] Retention policies.
- [ ] Execution-data retention.
- [ ] Log retention.
- [ ] Credential secret handling.
- [ ] PII-sensitive data controls.
- [ ] Export/delete tenant data.
- [ ] Audit trail.
- [ ] Access logging.

## AF. Testing / quality

- [ ] Unit-testable node execution.
- [ ] Workflow validation.
- [ ] Schema validation.
- [ ] Credential connection tests.
- [ ] Test workflow with sample data.
- [ ] Mock external services.
- [ ] Replay production execution in safe mode.
- [ ] Regression tests for workflow versions.
- [ ] Integration tests.

## AG. Performance / scale

- [ ] Horizontal workers.
- [ ] Queue-based scaling.
- [ ] Parallel node execution.
- [ ] Execution concurrency limits.
- [ ] Per-integration rate limiting.
- [ ] Backpressure.
- [ ] Large payload handling.
- [ ] Streaming where applicable.
- [ ] Pagination.
- [ ] Batching.
- [ ] Caching.
- [ ] Connection pooling.
- [ ] Worker autoscaling.

## AH. Platform admin

- [ ] System settings.
- [ ] Workspace settings.
- [ ] User management.
- [ ] Team management.
- [ ] Integration management.
- [ ] Credential policies.
- [ ] Execution policies.
- [ ] Quota/usage dashboard.
- [ ] Feature flags.
- [ ] System health.
- [ ] Worker health.
- [ ] Queue health.
- [ ] Audit log viewer.

## Final acceptance gate

Do not mark the clone complete merely because the UI looks similar. A feature is complete only when it can be configured, executed, observed, error-handled, persisted and secured as applicable.

- [ ] Every listed functional requirement has been implemented or explicitly marked out-of-scope.
- [ ] Existing fixed UI has not been changed except where required to expose functionality.
- [ ] Every trigger can actually start an execution.
- [ ] Every action/module can execute against real external services.
- [ ] Data can be mapped between nodes and expressions evaluate correctly.
- [ ] Branching, loops, merging, aggregation and filtering work with real execution data.
- [ ] Failed executions can be diagnosed and, where supported, retried/resumed.
- [ ] Credentials are securely stored and never exposed in execution output/logs.
- [ ] Workflow state survives application restarts.
- [ ] Concurrent executions do not corrupt workflow state.
- [ ] Execution history accurately reflects each node's status, input/output and errors.
- [ ] Import/export preserves workflow behavior.
- [ ] Permissions prevent unauthorized workflow/credential/execution access.
- [ ] Performance/load tests pass for the intended deployment scale.
- [ ] Real-world end-to-end scenarios have been tested, not just mocked node tests.

Reference basis: current Make product/integration documentation and current n8n feature documentation. This checklist is intentionally broader than a UI checklist and focuses on functional parity.
