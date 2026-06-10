import { PieceAuth } from '@activepieces/pieces-framework';

export const workableAuth = PieceAuth.SecretText({
    displayName: "API Access Token",
    description: `
    1. Click your profile icon in the upper right and navigate to Settings > Integrations > Apps.
    2. Locate the API Access Tokens section near the top of the page.
    3. Click the button **+ Generate API token**.
    4. Select the following scopes:
      - r_jobs
      - r_candidates
      - w_candidates
    5. Click Generate token to complete the process.
    `,
    required: true
  })
