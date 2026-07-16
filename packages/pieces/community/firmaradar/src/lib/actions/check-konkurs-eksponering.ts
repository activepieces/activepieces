import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest } from '../common/client';

export const checkKonkursEksponering = createAction({
    name: 'check_konkurs_eksponering',
    auth: firmaradarAuth,
    displayName: 'Check Bankruptcy Exposure',
    description:
        'Name-based screening for repeat-bankruptcy exposure ("konkursgjenganger"): ' +
        'leadership roles a person held in companies that later went bankrupt, ' +
        'tenure-weighted. The match is name-based — treat hits as review flags, ' +
        'not verdicts. Requires full-ownership access.',
    props: {
        navn: Property.ShortText({
            displayName: 'Full Name',
            description: 'Full name to screen (minimum 2 characters).',
            required: true,
        }),
    },
    async run(context) {
        return firmaradarRequest(context.auth, {
            method: HttpMethod.GET,
            path: '/api/v1/person/konkurs-eksponering',
            query: {
                navn: context.propsValue.navn,
            },
        });
    },
});
