import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest } from '../common/client';
import { orgnrProp } from '../common/props';

export const getCompanyIp = createAction({
    name: 'get_company_ip',
    auth: firmaradarAuth,
    displayName: 'Get Company IP Rights',
    description:
        'Patents, trademarks and designs registered with the Norwegian Industrial ' +
        'Property Office (Patentstyret) — totals, active counts and per-case links.',
    props: {
        orgnr: orgnrProp(),
    },
    async run(context) {
        const response = await firmaradarRequest<Record<string, unknown>>(context.auth, {
            method: HttpMethod.GET,
            path: `/api/v1/company/${context.propsValue.orgnr}/ip`,
        });
        // The route may wrap the portfolio in `ip_rettigheter`; unwrap for
        // a flat step output (same behaviour as the n8n node).
        if (response && typeof response === 'object' && response.ip_rettigheter) {
            return response.ip_rettigheter;
        }
        return response;
    },
});
