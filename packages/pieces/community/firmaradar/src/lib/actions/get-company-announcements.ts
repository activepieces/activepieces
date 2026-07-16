import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest } from '../common/client';
import { cursorProp, limitProp, orgnrProp } from '../common/props';

export const getCompanyAnnouncements = createAction({
    name: 'get_company_announcements',
    auth: firmaradarAuth,
    displayName: 'Get Company Announcements',
    description:
        'BRREG legal-event announcements (bankruptcy, mergers, signatory changes) ' +
        'and recent changes for one company — the audit trail behind re-screening ' +
        'decisions. Without limit/cursor all announcements are returned.',
    props: {
        orgnr: orgnrProp(),
        limit: limitProp(50, 200),
        cursor: cursorProp(),
    },
    async run(context) {
        return firmaradarRequest(context.auth, {
            method: HttpMethod.GET,
            path: `/api/v1/company/${context.propsValue.orgnr}/changes`,
            query: {
                limit: context.propsValue.limit,
                cursor: context.propsValue.cursor,
            },
        });
    },
});
