import { PieceAuth } from "@activepieces/pieces-framework";

export const evernoteCommon = {
  auth: PieceAuth.SecretText({
    displayName: 'Developer Token',
    description: 'Please visit https://www.evernote.com/api/DeveloperToken.action to get your developer token.',
    required: true,
  }),
};