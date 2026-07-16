import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { dpaHeaders, firmaradarRequest } from '../common/client';
import { amlPurposeProp, dpaConfirmedProp, orgnrProp } from '../common/props';

export const startAmlReport = createAction({
    name: 'start_aml_report',
    auth: firmaradarAuth,
    displayName: 'Start AML Report (Async)',
    description:
        'Start an audit-grade AML report in the background and get a report id ' +
        'immediately — poll with "Get AML Report" until done. Avoids timeouts on ' +
        'large ownership trees and lets you fan out many screenings in parallel. ' +
        'Requires a signed DPA; reports are retained for 60 months.',
    props: {
        orgnr: orgnrProp(),
        purpose: amlPurposeProp(),
        dpaConfirmed: dpaConfirmedProp(),
        idempotencyKey: Property.ShortText({
            displayName: 'Idempotency Key',
            description:
                'Optional unique key — retries with the same key return the ' +
                'original response instead of starting a duplicate report.',
            required: false,
        }),
    },
    async run(context) {
        const headers = dpaHeaders(context.propsValue.purpose, context.propsValue.dpaConfirmed);
        if (context.propsValue.idempotencyKey) {
            headers['Idempotency-Key'] = context.propsValue.idempotencyKey;
        }
        return firmaradarRequest(context.auth, {
            method: HttpMethod.POST,
            path: '/api/v1/aml/report',
            headers,
            body: {
                orgnr: context.propsValue.orgnr,
                purpose: context.propsValue.purpose,
            },
        });
    },
});
