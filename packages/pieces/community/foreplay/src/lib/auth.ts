import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const foreplayAuth = PieceAuth.SecretText({
  description: 'API Key from Foreplay.co Settings',
  required: true,
  displayName: 'API Key',
});

export const adId = Property.ShortText({
  displayName: 'Ad ID',
  required: true,
});

export const boardId = Property.ShortText({
  displayName: 'Board ID',
  required: false,
});
