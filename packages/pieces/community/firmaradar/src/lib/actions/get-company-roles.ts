import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest } from '../common/client';
import { orgnrProp } from '../common/props';

export const getCompanyRoles = createAction({
    name: 'get_company_roles',
    auth: firmaradarAuth,
    displayName: 'Get Company Roles',
    description:
        'Board, managing director, signatory, procuration and auditor roles — ' +
        'the people to screen in KYC and due-diligence flows.',
    props: {
        orgnr: orgnrProp(),
        roleType: Property.StaticDropdown({
            displayName: 'Role Type',
            description: 'Restrict to a single role type. Leave empty for all roles.',
            required: false,
            options: {
                options: [
                    { label: 'Chair of the board', value: 'styreleder' },
                    { label: 'Board member', value: 'styremedlem' },
                    { label: 'Deputy board member', value: 'varamedlem' },
                    { label: 'Managing director', value: 'daglig_leder' },
                    { label: 'Signatory', value: 'signatur' },
                    { label: 'Procuration', value: 'prokura' },
                    { label: 'Auditor', value: 'revisor' },
                ],
            },
        }),
        includeHistoric: Property.Checkbox({
            displayName: 'Include Historic Roles',
            required: false,
            defaultValue: false,
        }),
    },
    async run(context) {
        return firmaradarRequest(context.auth, {
            method: HttpMethod.GET,
            path: `/api/v1/company/${context.propsValue.orgnr}/roles`,
            query: {
                role_type: context.propsValue.roleType,
                include_historic: context.propsValue.includeHistoric ? 1 : 0,
            },
        });
    },
});
