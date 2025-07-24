import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { hunterApiCall } from '../common';
import { hunterAuth } from '../../index';
import { leadIdProp } from '../common/props';

export const getLeadAction = createAction({
    auth: hunterAuth,
    name: 'get-lead',
    displayName: 'Get Lead',
    description: `
    Retrieves all fields of a specific lead by its ID.
    Returns HTTP 200 with the full lead object under \`data\`.
  `,
    props: {
        lead_id: leadIdProp,
    },
    async run(context) {
        const { lead_id } = context.propsValue;

        const resp = (await hunterApiCall({
            apiKey: context.auth,
            endpoint: `/leads/${lead_id}`,
            method: HttpMethod.GET,
        })) as {
            data: {
                id: number;
                email: string;
                first_name: string | null;
                last_name: string | null;
                position: string | null;
                company: string;
                company_industry: string | null;
                company_size: string | null;
                confidence_score: number | null;
                website: string;
                country_code: string | null;
                source: string | null;
                linkedin_url: string | null;
                phone_number: string | null;
                twitter: string | null;
                sync_status: string | null;
                notes: string | null;
                sending_status: string | null;
                last_activity_at: string | null;
                last_contacted_at: string | null;
                verification: {
                    date: string | null;
                    status: string | null;
                };
                leads_list: {
                    id: number;
                    name: string;
                    leads_count: number;
                };
                created_at: string;
            };
            meta?: any;
        };

        return { lead: resp.data };
    },
});
