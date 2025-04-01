import {wedofAuth} from '../../index';
import {createAction} from '@activepieces/pieces-framework';
import {HttpMethod, httpClient} from '@activepieces/pieces-common';
import {wedofCommon} from '../common/wedof';

export const me = createAction({
    auth: wedofAuth,
    name: 'me',
    displayName: "Récupérer mes informations",
    description: "Récupérer mes informations et mes détails",
    props: {},
    async run(context) {
        return (
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url:
                    wedofCommon.baseUrl + '/users/me',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': context.auth as string,
                },
            })
        ).body;
    },
});
