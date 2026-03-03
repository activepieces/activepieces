import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { wedofCommon } from './common/wedof';

export const wedofAuth = PieceAuth.SecretText({
    displayName: 'Clé API',
    required: true,
    description: 'Veuillez saisir votre clé API fournie par wedof',
    validate: async ({auth}) => {
        try {
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: wedofCommon.baseUrl + '/users/me',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': auth,
                },
            });
            return {valid: true};
        } catch (error) {
            return {
                valid: false,
                error: 'Clé Api invalide',
            };
        }
    },
});
