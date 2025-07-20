import {wedofAuth} from '../../index';
import {createAction} from '@activepieces/pieces-framework';
import {HttpMethod, httpClient} from '@activepieces/pieces-common';
import {wedofCommon} from '../common/wedof';

export const myOrganism = createAction({
    auth: wedofAuth,
    name: 'myOrganism',
    displayName: "Récupérer mon organisme",
    description: "Récupérer mon organisme et afficher ses détails",
    props: {},
    async run(context) {
        return (
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url:
                    wedofCommon.baseUrl + '/organisms/me',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': context.auth as string,
                },
            })
        ).body;
    },
});
