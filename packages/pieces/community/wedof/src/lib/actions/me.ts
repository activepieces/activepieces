import { wedofAuth } from '../auth';
import {createAction} from '@activepieces/pieces-framework';
import {HttpMethod, httpClient} from '@activepieces/pieces-common';
import {wedofCommon} from '../common/wedof';

export const me = createAction({
    auth: wedofAuth,
    name: 'me',
    displayName: "Récupérer mes informations",
    description: "Récupérer mes informations et mes détails",
    audience: 'both',
    aiMetadata: {
      description:
        "Retrieve the profile and account details of the currently authenticated Wedof user (the owner of the API key). Takes no input; useful for confirming which account/connection is active or reading the user's identity. Read-only and idempotent.",
      idempotent: true,
    },
    props: {},
    async run(context) {
        return (
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url:
                    wedofCommon.baseUrl + '/users/me',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': context.auth.secret_text,
                },
            })
        ).body;
    },
});
