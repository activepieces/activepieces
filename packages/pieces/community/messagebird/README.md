# Bird

Proposed 1.0.0 major release of `@activepieces/piece-messagebird` for Bird's current regional API. Activepieces maintainers own approval and publication. Existing 0.3.x workflows need their original package versions and connections.

Migrating requires a new Bird OAuth or current access-key connection and deliberate replacement of legacy steps. Keep existing API-key connections for workflows that still use 0.3.x. Legacy `send-sms` can be replaced by the new `sms_send` after remapping inputs and outputs; Replace `listMessages` with the appropriate List sent emails, List received emails, List SMS messages or List WhatsApp messages action, then remap filters and outputs. The retained `custom_api_call` ID now accepts versioned regional API paths and needs fresh authentication and remapped inputs; it cannot run legacy Channels API requests. Message IDs and workspace/channel settings are not interchangeable between the APIs.

The **Legacy MessageBird** auth option preserves the original `apiKey`, `workspaceId` and `channelId` fields for connections used by pinned 0.3.x actions. It retains the original behavior without an API-validation callback. Activepieces matches each connection to its auth type, including when validating against latest piece metadata. No shared connection-service changes or automatic credential conversion are included.

Fourteen actions let you send, retrieve and list email, SMS and WhatsApp messages, create and check verifications, try the next verification channel, and make custom API calls. Voice and Apple Messages for Business actions are deferred. Send actions return acceptance; get actions retrieve current status. Public email fields include attachments, templates and scheduling. Optional inputs remain omitted when unset. Verify checks preserve `success: false` responses; a successful HTTP status alone does not prove verification.

List actions return one page in `data`, with `next_cursor`, `prev_cursor` and `refresh_cursor`. Use the sender, recipient, status and date fields to narrow results. Open **Advanced** for additional filters and pagination cursors. Page size appears under **Results**, defaults to 25 and allows 1–100. Map `next_cursor` to **Next page cursor** to retrieve the next page; use **Previous page cursor** to navigate backwards. Leave filters blank to omit them. Received email, SMS and WhatsApp lists cover the API's 30-day retention window. Sent email lists omit message bodies.

Choose templates by name, enter or map a template ID, or select **Enter a template slug**. Template lists require read access to the corresponding channel settings. Attachments accept file URLs or files from earlier steps; the filename can be overridden. Use Advanced JSON for existing base64 attachments or complex message content.

Choose **Bird OAuth** or **Bird Access Key** to connect your workspace. Access keys need workspace read permission and permission for the actions you use. The connection selects your region automatically. Keep **Legacy MessageBird** connections for workflows that use 0.3.x actions.

Custom API Call accepts a method, relative API path, optional headers/query parameters and JSON body. It returns status, headers and body. Like the legacy connector, it does not enumerate endpoints: new versioned paths need no connector release. Calls stay on the credential-derived regional host; Bird validates endpoint availability, request data and permissions. Use documented public APIs for stable workflows. GET and HEAD accept no body; POST, PUT, PATCH and DELETE support JSON or no body. File uploads and binary downloads are not supported. Connection permissions still apply; no scopes are added automatically.

HTTP requests use the platform's native client with redirects and request retries disabled. Workflow retries default to off. Use a stable `Idempotency-Key` for deliberate send retries.

**Do not use live Bird credentials with the pinned unsafe transport.** Native source revision `e3e1cbebb6dafbf2bb0da35effc6dfd58b8c13e3` disables TLS verification; that requires a separate platform correction. Resource-401 refresh recovery and ambiguous refresh-response handling also remain platform acceptance gates. This package does not implement a workaround or contain a client secret.

Responses retain Bird API field names for mapping into later workflow steps.

Native typechecking, lint and bundle checks apply to each candidate. Earlier live acceptance used the source/runtime recorded for those runs; it does not establish live testing of a newly refactored archive. Public npm installation and shared cloud catalog inclusion remain separate, unenabled distribution steps.
