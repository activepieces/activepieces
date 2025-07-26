import { Property } from '@activepieces/pieces-framework';

export const knackAuth = Property.SecretText({
    displayName: 'API Key',
    description: 'Your Knack API Key',
    required: true,
});
