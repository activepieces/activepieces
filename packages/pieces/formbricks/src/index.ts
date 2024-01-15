
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

const markdownPropertyDescription = `
  **Enable Basic Authentication:**
  1. Login to your Formbricks account
  2. On the top-right, click on your account dropdown
  3. Select 'Product Settings'
  4. On the left, select 'API Keys'
  5. Click on 'Add Production API Key'
  6. On the popup form, Enter the 'API Key Label' to name the Key
  7. Copy the API key and paste it below.
`;

export const formBricksAuth = PieceAuth.SecretText({
  displayName: 'Token',
  description: markdownPropertyDescription,
  required: true
});

export const formbricks = createPiece({
  displayName: "Formbricks",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.9.0',
  logoUrl: "https://images.saasworthy.com/tr:w-160,h-0,c-at_max,q-95,e-sharpen-1/formbricks_42422_logo_1677563947_j3svn.jpg", //TODO: Fetch logo
  authors: [],
  actions: [],
  triggers: [],
});
