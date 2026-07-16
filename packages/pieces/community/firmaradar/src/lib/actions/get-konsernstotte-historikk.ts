import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest } from '../common/client';
import { orgnrProp } from '../common/props';

export const getKonsernstotteHistorikk = createAction({
    name: 'get_konsernstotte_historikk',
    auth: firmaradarAuth,
    displayName: 'Get Public Grants History',
    description:
        'Flat list of individual public-grant awards for a company with source ' +
        'filtering — feed grant histories into spreadsheets and reports.',
    props: {
        orgnr: orgnrProp(),
        kilde: Property.StaticDropdown({
            displayName: 'Source Filter',
            required: false,
            options: {
                options: [
                    { label: 'Innovasjon Norge', value: 'innovasjon_norge' },
                    { label: 'SkatteFUNN', value: 'skattefunn' },
                    { label: 'Other', value: 'andre' },
                ],
            },
        }),
    },
    async run(context) {
        return firmaradarRequest(context.auth, {
            method: HttpMethod.GET,
            path: `/api/v1/konsernstotte/historikk/${context.propsValue.orgnr}`,
            query: {
                kilde: context.propsValue.kilde,
            },
        });
    },
});
