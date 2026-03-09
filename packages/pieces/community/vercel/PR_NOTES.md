# PR Summary

## What this adds

This PR adds a bounded community Vercel piece for Activepieces focused on the Activepieces MCP challenge MVP.

### Included actions
- List projects
- Create deployment
- Get deployment status
- List environment variables
- Upsert environment variable (create/update via Vercel `upsert=true`)
- Custom API Call (for MCP-friendly escape hatch without expanding the curated action surface)

## Scope decisions

This intentionally stays within a 1-day MVP boundary:
- Supports existing-project deployment flows only
- Supports redeploying an existing deployment or creating a deployment from git source metadata
- Uses Vercel's project env upsert API instead of adding a more complex fetch-ID-then-patch flow
- Leaves triggers and broader Vercel resource coverage out of scope

## Authentication

Uses Vercel personal access token auth, with optional `teamId` or `slug` to target team-owned resources.

## Validation / Evidence

Built successfully with Activepieces' official piece build flow:

```bash
bun run build-piece vercel
```

Result:
- Piece built and packed successfully under `packages/pieces/community/vercel/dist`

## Notes for reviewers

- The deployment action is conservative by design and avoids trying to implement file-upload deployments in this MVP.
- Environment variable create/update is implemented through `POST /v10/projects/{idOrName}/env?upsert=true`, which keeps the UX simple and reliable for challenge scope.
