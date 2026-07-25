---
icon: 📝
---

# Human Input

Human Input exposes public endpoints that let external users interact with flows via two modes: **Forms** (structured input fields) and **Chat** (conversational UI). Both are backed by flows whose trigger is the `@activepieces/piece-forms` piece. The backend endpoints are read-only and public — they return UI metadata (title, input schema, branding); the actual submission goes through the webhook endpoint.

### Entities & services
- `human-input.service.ts` — resolves flow, validates trigger type, builds response.
- Two controllers: `GET /v1/human-input/form/:flowId` and `GET /v1/human-input/chat/:flowId` (both `securityAccess.public()`).
- **Forms piece** provides three triggers: `form_submission`, `file_submission`, `chat_submission`.
- Frontend renders forms at `/forms/<flowId>` and chat at `/chat/<flowId>`.

### How it works
- **`getFormByFlowIdOrThrow`**: loads flow → if no published version and `useDraft` false, returns null (404) → asserts trigger is forms-piece `form_submission`/`file_submission` → resolves exact piece version. `file_submission` returns a hardcoded single-file schema (`SIMPLE_FILE_PROPS`); `form_submission` returns `trigger.settings.input`.
- **`getChatUIByFlowIdOrThrow`**: asserts `chat_submission` trigger → fetches platform logo + name → returns `ChatUIResponse` with branding embedded (supports white-labeled chat).
- Form input types: `text`, `text_area`, `toggle`, `file`.
- **`waitForResponse`**: when true, the flow run pauses after triggering and the frontend waits for a value to display back to the submitter.

### Gotchas
- Endpoints are fully public — anyone with the flow ID can read form/chat metadata (but only the UI definition, not execute).
- A flow without a published version returns 404 unless `useDraft=true` is passed — protects unpublished forms from accidental exposure.
- These endpoints only return the UI definition; triggering the flow itself goes through the webhook endpoint.

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

Paths verified 2026-07-17. An earlier version pointed at `packages/core/shared/src/lib/automation/flows/form.ts`; it moved to `packages/core/execution/src/lib/flows/form.ts`.
