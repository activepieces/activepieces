# Scrapeless

## Build and Verify

```bash
npx turbo run build --filter=@activepieces/piece-scrapeless
npx turbo run lint --filter=@activepieces/piece-scrapeless
npm test --workspace=@activepieces/piece-scrapeless
```

## AI Scraper

The single AI Scraper action collects answers from eight AI websites through Scrapeless AI Scraper v2. It does not call the model vendors' direct generation APIs. Select Operation to choose Create Task and Wait, Create Task, or Get Task Result.

- Create Task and Wait (default): select Website and Parameters. The same step creates one task, waits between unfinished queries, and returns its completed result within finite limits.
- Create Task: select Website, then enter the website-specific Parameters. One invocation submits one asynchronous task.
- Get Task Result: enter Task ID in Parameters. No website, prompt, or country is required. One invocation queries that task once.

The default operation uses one step. Internally it uses operation=create_and_wait, website.engine, parameters, and wait_settings. The explicit create_task and get_task_result values remain available for asynchronous submission and manual recovery. Switching websites forwards only supported fields.

## Automatic Waiting

| Setting | Internal name | Default | Allowed values |
| --- | --- | --- | --- |
| Wait Timeout (seconds) | wait_timeout_seconds | 180 | Integer, 30-300 |
| Poll Interval (seconds) | poll_interval_seconds | 10 | Integer, 5-60; no greater than the timeout |
| Maximum Queries | max_queries | 20 | Integer, 1-60 |

Wait Settings appear only for Create Task and Wait. Invalid active settings and creation parameters fail before a billable request. Inactive settings are ignored in the other two modes. After creation, the first query runs without an intentional delay. Only pending/running results schedule another query after the interval. Creation does not count as a query. The final allowed query can still succeed; an unfinished final query stops immediately without another wait or request.

The monotonic total budget includes creation, queries, progress updates, and waits. The action stops when either the deadline or query limit is reached, prioritizing timeout if both apply. A completed result with has_answer=false is returned rather than queried forever. HTTP/network errors, malformed results, failed tasks, and expiration stop immediately. There are no hidden error retries or replacement creation requests.

On failure, the message includes the original task ID when known, query count, elapsed time, and last status. Use Get Task Result with that ID for recovery. If creation timed out without a reliable ID, check the Scrapeless dashboard before creating another task. Progress output records a safe task ID where the execution surface supports it; do not rely on progress surviving a killed worker.

Waiting occupies the execution slot and is not a durable checkpoint. Worker restarts, forced reruns, and operator retries have no exactly-once guarantee. The platform's own execution timeout can end a run earlier than the configured Piece timeout. The Piece timeout ends the logical wait; it does not cancel an in-flight request or the provider task. Late responses never schedule another query. This version deliberately keeps the existing shared HTTP client unchanged.

## Supported Websites

| Website | Actor | Additional input controls | Native answer field |
| --- | --- | --- | --- |
| ChatGPT | scraper.chatgpt | Web search, shopping, share link | result_text |
| Perplexity | scraper.perplexity | Web search, share link | result_text |
| Microsoft Copilot | scraper.copilot | Mode, share link | result_text |
| Gemini | scraper.gemini | Shopping | result_text |
| Google AI Mode | scraper.aimode | Shopping, location or UULE, share link | result_text or result_md |
| Google AI Overview | scraper.overview | Shopping, location or UULE, share link | content |
| Grok | scraper.grok | Mode, share link | full_response |
| Amazon Alexa | scraper.alexa | None | md_text or raw_text |

Task creation requires Prompt and Country. Country defaults to US. Web search defaults to true where exposed. Shopping and share-link retrieval default to false. The API defaults shopping to true for some actors; this integration sends false explicitly until the user opts in. Extra shopping data can be charged at twice the base rate. Gemini's documented shopping default is false.

Copilot modes are search, smart, chat, reasoning, and study; the integration defaults to search. Grok modes are MODEL_MODE_FAST, MODEL_MODE_EXPERT, and MODEL_MODE_AUTO; the integration defaults to Fast. These are integration defaults. The result preserves the provider-reported mode in task_result. Selecting a mode does not guarantee that the provider served it; Expert requests have returned user_model=fast in testing.

Location and UULE are mutually exclusive. Empty values are omitted. Invalid active options and mode values are rejected before HTTP. Stale fields from another website or operation are ignored. AI Mode's URL input is not exposed in this version: its URL request mode excludes all other parameters and needs a separate design. No webhook trigger or automatic share-link resolver is included.

## Output Format

Output Format defaults to Table-Friendly Fields. All 19 original output keys are retained, with poll_attempts and elapsed_seconds added (21 total), and every value is text, a number, a boolean, or null. Native arrays such as citations and sources are JSON text, including "[]" for an empty list. The complete task_result is losslessly preserved as JSON text when present. Parse these text fields as JSON when a later step needs structured access.

Choose Original Structured Fields to receive the original arrays and objects instead. This explicit raw escape hatch preserves the historical native contract. Neither format changes the vendor request, creates an extra task, or changes task_id mapping. An invalid output format is rejected before HTTP.

The local unpublished candidate is 0.3.0, following the public semantic-versioning rule for added functionality. Repository authoring guidance still says PATCH for new actions; that guidance conflict remains disclosed for maintainer confirmation. No version has been published.

## Query and Data Mapping

Select Get Task Result in AI Scraper to check a v2 task once. Select task_id from the creation step using the Data Selector. In Activepieces 0.92.2, a creation step named step_1 maps as:

```text
{{step_1['output']['task_id']}}
```

The legacy expression `{{step_1.task_id}}` resolves empty in this version. In query-only mode, completed=false means that this single query found an unfinished task. Any external loop must have its own limits. In automatic mode, the Piece enforces the Wait Settings above. Never repeat creation as part of a query loop. Persist successful output promptly because the provider retains completed results for only 4 minutes.

| Output | Meaning |
| --- | --- |
| task_id | Task identifier for subsequent queries. |
| status | pending, running, or success. Failed tasks throw. |
| completed | True when the provider task status is success. |
| result_text | First non-empty supported answer field, normalized across engines. |
| answer_field | Native field used for result_text, or null. |
| has_answer | Whether normalized answer text is non-empty. Check this together with completed. |
| links, search_result, content_references | Existing ChatGPT-compatible fields, retained unchanged. |
| citations, web_results, web_search_results, x_search_results | Separate native source arrays. Missing arrays become empty arrays in Original Structured Fields, or JSON text "[]" in Table-Friendly Fields. |
| source, web_source, references, sources | Additional native source arrays for Google and Alexa. |
| share_url | Returned share URL when present, otherwise null. |
| task_result | Complete native result, including products, media, model labels, footnotes, and other fields. |
| poll_attempts | Dispatched result queries in this invocation; 0 for create-only, 1 for query-only. |
| elapsed_seconds | Monotonic elapsed time for this invocation, including automatic waits. |

AI Scraper exposes a labelled output schema with labelled task, answer, and source fields. The schema describes the 21-field return object; it does not rename or remove output keys. Native data remains available in full: JSON text by default, or native containers when Original Structured Fields is selected. For spreadsheet columns, map task_id, status, completed, result_text, answer_field, has_answer, and share_url. Table-Friendly Fields can map all values into cells; parse JSON text when structured traversal is needed. Original Structured Fields requires a destination that accepts objects and arrays.

Answer extraction tries result_text, full_response, content, md_text, raw_text, and result_md, in that order, skipping empty strings. Source arrays retain their native meanings; search candidates are not relabeled as citations. No complete answer is fabricated from metadata or links.

A completed Google Overview task can have no overview answer. Such a response has completed true and has_answer false. Alexa's nested completed field remains inside task_result; the top-level completed field always describes the Scrapeless task status. Inspect native fields when engine-specific completion or mode fidelity matters.

The combined action declares classification WRITE and idempotent false because task creation is reachable. Automatic retries are disabled and the platform retry-on-failure switch is hidden for all operations. If a submission times out, check the dashboard before creating another task. Querying with the same task ID is safe. HTTP errors, failed tasks, expired results, redirects, and unknown statuses fail explicitly. Live expiration has also been observed as HTTP 400 with a task expired message, alongside the documented HTTP 410 status.

Returned task IDs must satisfy the same format accepted by the query action. A query response that identifies a different task fails instead of accepting that task's output. API-key redaction covers the complete failed-task message, including any credential reflected in the task ID.

Create-only and query-only each make one HTTP request. Automatic mode makes one creation request and at most max_queries result requests, within its total logical timeout. Each request uses the existing helper timeout 30000 and retries 0. This Piece changes no shared platform code. The platform client currently disables TLS certificate verification, clears its timeout after headers, and can log provider-echoed secrets before Piece-level redaction. The 30000 setting is not a guaranteed complete-response deadline. The logical wait guard does not repair or cancel that transport. These inherited findings remain for maintainer handling; the withdrawn shared-client patch is excluded from this candidate. No platform security clearance is claimed.

## Verification Coverage

Tests exercise the registered action runners, engine-specific request isolation, all documented Copilot and Grok mode values, false boolean preservation, safe defaults, geo-input conflicts, answer normalization, missing Overview content, source preservation, business and HTTP failures, redirects, and duplicate-submission prevention. Deterministic tests also cover finite polling, total deadlines, stalled response bodies, late responses, query limits, concurrent invocations, and compatibility of the explicit single-request modes. Synthetic coverage is separate from live engine and mode acceptance.

The six original action IDs remain registered, including Custom API Call. The six published actions are unchanged.

## Official References

- [ChatGPT](https://docs.scrapeless.com/en/docs/ai-scraper/scrapers/chatgpt/)
- [Perplexity](https://docs.scrapeless.com/en/docs/ai-scraper/scrapers/perplexity/)
- [Copilot](https://docs.scrapeless.com/en/docs/ai-scraper/scrapers/copilot/)
- [Gemini](https://docs.scrapeless.com/en/docs/ai-scraper/scrapers/gemini/)
- [Google AI Mode](https://docs.scrapeless.com/en/docs/ai-scraper/scrapers/google-ai-mode/)
- [Google AI Overview](https://docs.scrapeless.com/en/docs/ai-scraper/scrapers/google-ai-overview/)
- [Grok](https://docs.scrapeless.com/en/docs/ai-scraper/scrapers/grok/)
- [Amazon Alexa](https://docs.scrapeless.com/en/docs/ai-scraper/scrapers/alexa/)
- [Task lifecycle](https://docs.scrapeless.com/en/docs/ai-scraper/quickstart/task-lifecycle/)
