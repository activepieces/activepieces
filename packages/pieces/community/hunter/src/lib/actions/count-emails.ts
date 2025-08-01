import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpError, HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { hunterApiCall } from '../common';
import { hunterAuth } from '../../index';
import { domainProp, companyProp, emailTypeProp } from '../common/props';

export const countEmailsAction = createAction({
    auth: hunterAuth,
    name: 'count-emails',
    displayName: 'Count Emails',
    description: 'Returns the number of email addresses found for a domain or company.',
    props: {
        domain: domainProp,
        company: companyProp,
        type: emailTypeProp,
    },
    async run(context) {
        const { domain, company, type } =
            context.propsValue as {
                domain?: string;
                company?: string;
                type?: 'personal' | 'generic';
            };
        if (!domain && !company) {
            throw new Error(
                'You must provide at least a domain or a company name to count emails.'
            );
        }

        const qparams: QueryParams = {};
        if (domain) qparams['domain'] = domain;
        if (!domain && company) qparams['company'] = company;
        if (type) qparams['type'] = type;

        let respBody;
        try {
            respBody = await hunterApiCall({
                apiKey: context.auth,
                endpoint: '/email-count',
                method: HttpMethod.GET,
                qparams,
            });
        } catch (err) {
            const httpErr = err as HttpError;
            const status = httpErr.response?.status;
            const details =
                (httpErr.response?.body as any)?.errors?.[0]?.details || 'Unknown error';
            if (status === 400 && details.includes('wrong_params')) {
                throw new Error('Missing domain or company parameter.');
            }
            if (status === 400 && details.includes('invalid_type')) {
                throw new Error(
                    'Invalid type. Must be "personal" or "generic", exactly as shown.'
                );
            }
            if (status === 429) {
                throw new Error(
                    'Rate limit exceeded (15 req/s). Please wait a moment and try again.'
                );
            }
            throw new Error(`Hunter Email Count API error: ${details}`);
        }

        const data = (respBody as any).data;
        return {
            total: data.total as number,
            personal_emails: data.personal_emails as number,
            generic_emails: data.generic_emails as number,
            department: data.department as Record<string, number>,
            seniority: data.seniority as Record<string, number>,
        };
    },
});
