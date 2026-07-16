# pieces-firmaradar

[Firmaradar](https://firmaradar.no) — Norwegian company intelligence for
KYC, AML, credit, ownership and risk workflows. An enrichment platform
that fuses the Brønnøysund registers, Skatteetaten, sanctions/PEP
registers and public-grant registries into decision-ready insights.

29 actions (company/person lookups, AML/PEP screening incl. bulk and
async report patterns, risk scoring, industry/NACE queries, public
grants, currency conversion) and 2 instant webhook triggers (company
changed, industry/NACE event).

Authentication: API key from `firmaradar.no › My page › API keys` +
configurable base URL.

## Building

Run `turbo run build --filter=@activepieces/piece-firmaradar` to build the library.

## Testing

Run `vitest run` in this directory — request-building and
payload-parsing tests against fixtures; no live API calls.
