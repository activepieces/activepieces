# SAP SuccessFactors SAML2 OAuth piece for Activepieces

SAP SuccessFactors OData V2 integration for Activepieces using **OAuth 2.0 SAML 2.0 Bearer Assertion authentication only**.

## Authentication scope

Supported grant:

`urn:ietf:params:oauth:grant-type:saml2-bearer`

The piece intentionally does not support password authentication, Basic Auth, OIDC, or other SuccessFactors authentication methods.

Authentication URL fields have no default values or placeholders. They render blank and users must provide the server origins for their own SuccessFactors tenant.

### Required connection fields

- Authentication Base URL — HTTPS origin only; the piece appends `/oauth/idp` and `/oauth/token`.
- OData API Base URL — HTTPS origin only; the piece appends `/odata/v2`.
- Client ID / API Key.
- User ID.
- Company ID.
- Private Key — stored as an Activepieces secret field.

## Security notice

The current compatibility flow calls SuccessFactors `/oauth/idp` to generate the SAML assertion and then exchanges it at `/oauth/token`.

SAP has deprecated `/oauth/idp` because the private key is sent in an API request and currently plans to delete the endpoint on May 14, 2027. A long-term upstream implementation should generate the assertion with a trusted IdP or offline signer instead.

## Actions

### Get User

Retrieves one `User` entity by `userId` and returns a flat set of commonly used fields:

- `user_id`
- `username`
- `first_name`
- `last_name`
- `email`
- `status`
- `person_id_external`
- `department`
- `division`
- `title`

The action is read-only and safe to retry.

### Custom API Call

Uses the Activepieces standard Custom API Call action with the base URL restricted to the configured SuccessFactors OData V2 API root and automatically adds the cached bearer token.

## Repository placement

Place the piece at:

`packages/pieces/community/sap-successfactors-saml2-oauth`

Register it alphabetically in the root `tsconfig.base.json`:

```json
"@activepieces/piece-sap-successfactors-saml2-oauth": [
  "packages/pieces/community/sap-successfactors-saml2-oauth/src/index.ts"
]
```

## Verification

From the Activepieces repository root:

```bash
bun install
npx turbo run build --filter=@activepieces/piece-sap-successfactors-saml2-oauth
npx turbo run lint --filter=@activepieces/piece-sap-successfactors-saml2-oauth
```
