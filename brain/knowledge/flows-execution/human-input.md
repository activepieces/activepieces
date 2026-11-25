---
icon: 📝
---

# Human Input

Human Input exposes public endpoints that let external users interact with flows via two modes: **Forms** (structured input fields) and **Chat** (conversational UI). Both are backed by flows whose trigger is the `@activepieces/piece-forms` piece. The backend endpoints are read-only and public — they return UI metadata (title, input schema, and for chat, branding); the actual submission goes through the webhook endpoint.

### Entities & services
- `human-input.service.ts` — resolves flow, validates trigger type, builds response.
- Two controllers: `GET /v1/human-input/form/:flowId` and `GET /v1/human-input/chat/:flowId` (both `securityAccess.public()`).
- **Forms piece** (display name "Human Input") provides two triggers, `form_submission` (Web Form) and `chat_submission` (Chat UI), and one action, `return_response` (Respond on UI). The `file_submission` trigger left the piece in 2024; the service still serves it for old flows.
- Frontend renders forms at `/forms/<flowId>` and chat at `/chats/<flowId>` (`publicRoutes`). `/chat` is the logged-in Chat with AI page, not Human Input.

### How it works
- **`getFormByFlowIdOrThrow`**: loads flow → if no published version and `useDraft` false, returns null (404) → asserts trigger is forms-piece `form_submission`/`file_submission` → resolves exact piece version. `file_submission` returns a hardcoded single-file schema (`SIMPLE_FILE_PROPS`); `form_submission` returns `trigger.settings.input`.
- **`getChatUIByFlowIdOrThrow`**: asserts `chat_submission` trigger → fetches platform logo + name → returns `ChatUIResponse` with branding embedded (supports white-labeled chat).
- Form input types: `text`, `text_area`, `toggle`, `file`.
- **Submit**: `humanInputApi.submitForm` posts to `/v1/webhooks/<flowId>`, or `/v1/webhooks/<flowId>/draft` with `useDraft`. Forms piece 0.4.1+ sends `multipart/form-data`; older versions send JSON with files as base64 data URLs.
- **`waitForResponse`**: when true, the form adds `/sync` to the webhook URL. The request stays open until a Respond on UI step calls `run.respond`, or until `AP_WEBHOOK_TIMEOUT_SECONDS` passes (408). The form shows the returned markdown under the Submit button and downloads any attached files. When false, it shows a success toast.

### Gotchas
- Endpoints are fully public — anyone with the flow ID can read form/chat metadata (but only the UI definition, not execute).
- A flow without a published version returns 404 unless `useDraft=true` is passed — protects unpublished forms from accidental exposure. `FormPage` then renders `NotFoundPage` ("Hmm... this form isn't here").
- A published but disabled flow still renders its form; the submit gets 404 from the webhook and a "Flow not found" toast.
- These endpoints only return the UI definition; triggering the flow itself goes through the webhook endpoint.
- The public form page (`ApForm`) shows only the flow title and an optional "Built with activepieces" badge, with no platform logo or name. Only chat reads `platformLogoUrl`/`platformName`.
- The form badge follows the `SHOW_POWERED_BY_IN_FORM` flag: `plan.showPoweredBy` on EE/Cloud, `true` on CE. An anonymous Cloud visitor resolves no platform, so the flag stays `true` and the badge shows.
- A required text, text area or file field left empty shows "This field is required" (zod schema in `ApForm`), and no webhook request goes out. A required toggle is not enforced: `z.boolean()` accepts `false`.
- A file field reaches the run as a URL, not bytes. `convertRequest` (webhooks) streams each multipart file into a `FLOW_STEP_FILE` and puts a signed `/v1/files/<fileId>?token=…` URL in the body. The token expires after `AP_EXECUTION_DATA_RETENTION_DAYS`.
- The trigger output is one flat object, `{ <fieldKey>: value }`, with `fieldKey = createKeyForFormInput(displayName)` (camelCase: "Upload File" → `uploadFile`). A file field's value is that URL.

### Editions
Fully available in CE/EE/Cloud — no plan flag required.

### Key files
Entry point: `humanInputService`, defined in the human-input service and called by both the form and chat controllers.

- `packages/server/api/src/app/flows/flow/human-input/` — the whole backend slice: both controllers, the service, and the module that registers them
- `packages/core/execution/src/lib/flows/form.ts` — shared zod contracts: `FormInputType`, `FormProps`, `FormResponse`, `ChatUIProps`, `ChatUIResponse`, `USE_DRAFT_QUERY_PARAM_NAME`
- `packages/web/src/features/forms/` — form rendering component, API client, and query hooks
- `packages/web/src/features/chat/` — chat UI components (bubble, input, message list, intro)
- `packages/web/src/app/routes/forms/` — public form page
- `packages/web/src/app/routes/chat/` — public chat page, the reusable chat shell, and the in-builder Drawer wrapper for testing `chat_submission` flows
- `packages/web/src/app/builder/state/chat-state.ts` — builder-side chat state paired with the Drawer
- `packages/pieces/core/forms/` — the Forms piece: triggers and the Respond on UI action
- `packages/server/api/src/app/webhooks/` — form and chat submissions; `convertRequest` stores uploaded files

Paths verified 2026-11-19. An earlier version pointed at `packages/core/shared/src/lib/automation/flows/form.ts`; it moved to `packages/core/execution/src/lib/flows/form.ts`.
