import { PieceAuth } from "@activepieces/pieces-framework";

export const circleAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: `In Circle, open **Developers > Tokens**, create an **Admin V2** token and paste it here.`,
  required: true,
});