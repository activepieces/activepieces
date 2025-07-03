import { HttpMethod } from "@activepieces/pieces-common";
import { PieceAuth } from "@activepieces/pieces-framework";
import { makeRequest } from ".";

export const pinterestAuth = PieceAuth.SecretText({
  displayName: 'Pinterest Access Token',
  required: true,
  description: 'Your Pinterest OAuth2 access token.',
  // validate: async ({ auth }) => {
  //   try {
  
  //     await makeRequest(auth as string, HttpMethod.GET, '/user_account');
  //     return { valid: true };
  //   } catch {
  //     return {
  //       valid: false,
  //       error: 'Invalid Pinterest Access Token.',
  //     };
  //   }
  // },
});
