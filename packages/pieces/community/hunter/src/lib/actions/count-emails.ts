import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { hunterApiCall } from '../common';
import { hunterAuth } from '../../index';
import { domainProp, companyProp, emailTypeProp } from '../common/props';

export const countEmailsAction = createAction({
    auth: hunterAuth,
    name: 'count-emails',
    displayName: 'Count Emails',
    description: `
    Returns the number of email addresses we have for a given domain or company.
    Optionally limit to only personal or generic email types.
  `,
    props: {
        domain: domainProp,
        company: companyProp,
        type: emailTypeProp,
    },
    async run(context) {
        const { domain, company, type } = context.propsValue;

        if (!domain && !company) {
            throw new Error(
                'You must provide at least a domain or a company name to count emails.'
            );
        }

        const qparams: QueryParams = {};
        if (domain) qparams['domain'] = domain;
        if (!domain && company) qparams['company'] = company;
        if (type) qparams['type'] = type;

        const resp = (await hunterApiCall({
            apiKey: context.auth,
            endpoint: '/email-count',
            method: HttpMethod.GET,
            qparams,
        })) as {
            data: {
                total: number;
                personal_emails: number;
                generic_emails: number;
                department: Record<string, number>;
                seniority: Record<string, number>;
            };
            meta?: any;
        };

        const {
            total,
            personal_emails,
            generic_emails,
            department,
            seniority,
        } = resp.data;

        return {
            total,
            personal_emails,
            generic_emails,
            department,
            seniority,
        };
    },
});
