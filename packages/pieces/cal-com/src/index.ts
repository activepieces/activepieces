import { AuthProp, Piece } from '@activepieces/pieces-framework';

export const calcom = Piece.create({
  displayName: 'Cal.com',
  logoUrl: 'https://cdn.activepieces.com/pieces/cal.com.png',
  authors: ['kanarelo'],
  auth: AuthProp.SecretText({
    displayName: 'API Key',
    description: 'API Key provided by cal.com',
    required: true
  })
})
