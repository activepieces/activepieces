import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest } from '../common/client';

export const getAmlReport = createAction({
    name: 'get_aml_report',
    auth: firmaradarAuth,
    displayName: 'Get AML Report (Poll)',
    description:
        'Poll the status of an async AML report started with "Start AML Report". ' +
        'Returns pending/running/done/failed — with score, level and report links ' +
        '(JSON + PDF) when done.',
    props: {
        reportId: Property.ShortText({
            displayName: 'Report ID',
            description: 'Job id returned by "Start AML Report (Async)".',
            required: true,
        }),
    },
    async run(context) {
        return firmaradarRequest(context.auth, {
            method: HttpMethod.GET,
            path: `/api/v1/aml/report/${encodeURIComponent(context.propsValue.reportId)}`,
        });
    },
});
