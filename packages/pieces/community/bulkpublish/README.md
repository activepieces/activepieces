# BulkPublish piece for Activepieces

Drop this folder into `packages/pieces/community/bulkpublish` of activepieces/activepieces.

- **Auth:** Secret Text API key (`bp_...`, from https://app.bulkpublish.com/developer), sent as `Authorization: Bearer <key>`. Validated with `GET /api/channels`.
- **Actions:** Create Post (publish now / schedule / draft, multi-channel), Upload Media, Update Post, Delete Post, Retry Failed Post, List Channels, Get Post, Custom API Call.
- **Triggers (polling):** New Post Published, Post Failed, New Scheduled Post. All poll `GET /api/posts?status=...&limit=100` and dedupe by post ID in the trigger store. BulkPublish has no outbound webhooks.

"Publish now" calls `POST /api/posts` with status `draft`, then `POST /api/posts/{id}/publish`.

## Validation done
`tsc --noEmit --strict` passes against `@activepieces/pieces-framework@0.32.0` and `@activepieces/pieces-common@0.12.5` from npm, typechecked outside the monorepo. Not yet built inside the monorepo, and not yet run against the live API.

## Before opening the PR
1. `logoUrl` is set to `https://www.bulkpublish.com/assets/logo.svg`. A local copy is at `connectors/assets/logo.svg`.
2. `authors` is set to `azeemkafridi`.
3. Set `minimumSupportedRelease` to whatever the repo's current guidance says. The dependency versions in `package.json` are `*` and should follow the monorepo.

## Test steps
1. `npm ci` in the monorepo, then add `pieces-bulkpublish` to `AP_DEV_PIECES` in `packages/server/api/.env`. Run `npm start`.
2. `npx nx build pieces-bulkpublish` and `npx nx lint pieces-bulkpublish`.
3. In the builder, add a BulkPublish connection. A bad key should be rejected and a real key accepted.
4. **List Channels** should return your connected accounts. The Channels dropdown in Create Post should fill with the same list.
5. **Create Post** as a draft, then **Get Post** with the returned ID. `status` should be `draft`.
6. **Update Post**: set status to Scheduled with a future time, then check it in the BulkPublish calendar.
7. **Upload Media** with a small JPG. Pass the returned `id` into Create Post > Media File IDs, then publish now to a test channel.
8. **Retry Failed Post** on a failed post (for example one on an expired channel). A post with no failed platforms should return 400.
9. **Delete Post** on the draft.
10. Triggers: enable each one, click Test (it returns up to 5 recent posts in that status), then cause the event and wait for one poll interval.
