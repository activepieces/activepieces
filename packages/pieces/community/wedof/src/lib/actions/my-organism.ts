import { wedofAuth } from '../auth';
import {createAction} from '@activepieces/pieces-framework';
import {HttpMethod, httpClient} from '@activepieces/pieces-common';
import {wedofCommon} from '../common/wedof';

export const myOrganism = createAction({
    auth: wedofAuth,
    name: 'myOrganism',
    displayName: "Récupérer mon organisme",
    description: "Récupérer mon organisme et afficher ses détails",
    audience: 'both',
    aiMetadata: {
        description:
            'Retrieve the details of the Wedof organism (organization) tied to the authenticated API key. Takes no inputs; read-only and safe to retry. Use this to discover the current account/organization context before acting on its certifications or partnerships.',
        idempotent: true,
    },
    props: {},
    async run(context) {
        return (
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url:
                    wedofCommon.baseUrl + '/organisms/me',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': context.auth.secret_text,
                },
            })
        ).body;
    },
});
