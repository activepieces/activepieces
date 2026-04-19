# Human Input (Forms & Chat)

## Summary
The Human Input feature exposes public-facing endpoints that allow external users to interact with flows via two interaction modes: **Forms** (structured input fields that trigger a flow and optionally wait for a response) and **Chat** (a conversational UI backed by a flow). Both modes use flows whose trigger is the `@activepieces/piece-forms` piece. The backend endpoints are read-only and fully public — they return metadata about the form or chat UI (title, input schema, platform branding) that the frontend uses to render the interaction. Flows must be published (or the `useDraft` flag must be set) for the endpoints to return data. The frontend renders the form at `/forms/<flowId>` and the chat at `/chat/<flowId>`.

## Key Files
- `packages/server/api/src/app/flows/flow/human-input/form-controller.ts` — GET `/form/:flowId` endpoint
- `packages/server/api/src/app/flows/flow/human-input/chat-controller.ts` — GET `/chat/:flowId` endpoint
- `packages/server/api/src/app/flows/flow/human-input/human-input.service.ts` — resolves flow, validates trigger type, builds response
- `packages/server/api/src/app/flows/flow/human-input/human-input.module.ts` — registers both controllers
- `packages/shared/src/lib/automation/flows/form.ts` — `FormInputType`, `FormInput`, `FormProps`, `FormResponse`, `ChatUIProps`, `ChatUIResponse`, `USE_DRAFT_QUERY_PARAM_NAME`
- `packages/web/src/features/forms/components/ap-form.tsx` — form rendering component
- `packages/web/src/features/forms/api/` — frontend API client for form metadata
- `packages/web/src/features/forms/hooks/` — TanStack Query hooks
- `packages/web/src/features/chat/` — chat UI components (bubble, input, message list, intro)
- `packages/web/src/app/routes/forms/` — public-facing form page
- `packages/web/src/app/routes/chat/` — public-facing chat page

## Edition Availability
- **Community (CE)**: Fully available — no plan flag required.
- **Enterprise (EE)**: Fully available.
- **Cloud**: Fully available.

## Domain Terms
- **Forms piece** (`@activepieces/piece-forms`): The Activepieces piece that provides three triggers: `form_submission`, `file_submission`, and `chat_submission`.
- **form_submission trigger**: Accepts structured text/toggle/textarea fields defined by the flow author. `waitForResponse` controls whether the flow pauses to return a value to the form submitter.
- **file_submission trigger**: Simplified single-file upload form. The field schema is hardcoded server-side (one required FILE input with `waitForResponse: true`).
- **chat_submission trigger**: Enables a chat-style UI. Props contain `botName` for display.
- **FormResponse**: The metadata object returned for form flows — includes `id` (flowId), `title` (flow display name), `props` (FormProps with inputs and waitForResponse), `projectId`, and piece `version`.
- **ChatUIResponse**: The metadata object returned for chat flows — includes `id`, `title`, `props` (botName), `projectId`, `platformLogoUrl`, `platformName`.
- **useDraft**: Query parameter (`boolean`) that, when true, loads the draft flow version instead of the published version. Used during flow testing in the builder.
- **waitForResponse**: When true on a form, the flow run is paused after triggering and the frontend polls/waits for a response value to display back to the submitter.

## Endpoints

Routes registered under the human-input module prefix.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/v1/human-input/form/:flowId` | public | Get form metadata for a flow |
| GET | `/v1/human-input/chat/:flowId` | public | Get chat UI metadata for a flow |

Both accept query parameter: `useDraft: boolean` (optional, defaults to false).

## Service Methods

**humanInputService**
- `getFormByFlowIdOrThrow(flowId, useDraft)`:
  1. Loads the flow from the repository.
  2. If no published version and `useDraft` is false, returns null → throws ENTITY_NOT_FOUND.
  3. Asserts the trigger is from `@activepieces/piece-forms` with name `form_submission` or `file_submission`.
  4. Resolves the exact piece version via `pieceMetadataService.resolveExactVersion`.
  5. For `file_submission`, returns a hardcoded single-file-input schema (`SIMPLE_FILE_PROPS`).
  6. For `form_submission`, returns `trigger.settings.input` as the props.

- `getChatUIByFlowIdOrThrow(flowId, useDraft)`:
  1. Loads the flow and resolves its version.
  2. Asserts trigger is `chat_submission` from `@activepieces/piece-forms`.
  3. Fetches platform to include `logoIconUrl` and `name` for branding.
  4. Returns `ChatUIResponse` with platform branding embedded.

## Form Input Types

| Type | Description |
|---|---|
| `text` | Single-line text input |
| `text_area` | Multi-line textarea |
| `toggle` | Boolean toggle/checkbox |
| `file` | File upload |

## Notes

- Both endpoints are `securityAccess.public()` — no authentication is required. Anyone with the flow ID can access the form/chat metadata.
- The form submission itself (actually triggering the flow) goes through the webhook endpoint, not these endpoints. These endpoints only return the UI definition.
- Platform branding (logo, name) is included in the chat response to support white-labeled chat UIs.
- A flow without a published version returns a 404 unless `useDraft=true` is passed — this protects unpublished forms from being accidentally exposed.
