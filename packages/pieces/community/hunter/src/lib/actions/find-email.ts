import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { hunterApiCall } from '../common';
import { hunterAuth } from '../../index';
import {
    domainProp,
    companyProp,
    firstNameProp,
    lastNameProp,
    fullNameProp,
    maxDurationProp,
} from '../common/props';

export const findEmailAction = createAction({
    auth: hunterAuth,
    name: 'find-email',
    displayName: 'Find Email',
    description: `
    Retrieves the most likely email address for a person at a domain or company.
    You must supply domain or company, plus either first+last name or full name.
    Optionally set max_duration (3-20s) to refine accuracy.
  `,
    props: {
        domain: domainProp,
        company: companyProp,
        first_name: firstNameProp,
        last_name: lastNameProp,
        full_name: fullNameProp,
        max_duration: maxDurationProp,
    },
    async run(context) {
        const {
            domain,
            company,
            first_name,
            last_name,
            full_name,
            max_duration,
        } = context.propsValue;

        if (!domain && !company) {
            throw new Error('You must provide at least a domain or a company name.');
        }
        if (
            !((first_name && last_name) || full_name)
        ) {
            throw new Error(
                'You must provide both first_name and last_name, or a full_name.'
            );
        }
        if (max_duration !== undefined) {
            if (max_duration < 3 || max_duration > 20) {
                throw new Error('max_duration must be between 3 and 20 seconds.');
            }
        }

        const qparams: QueryParams = {};
        if (domain) qparams['domain'] = domain;
        else if (company) qparams['company'] = company;
        if (first_name) qparams['first_name'] = first_name;
        if (last_name) qparams['last_name'] = last_name;
        if (full_name) qparams['full_name'] = full_name;
        if (max_duration !== undefined) qparams['max_duration'] = String(max_duration);

        const resp = (await hunterApiCall({
            apiKey: context.auth,
            endpoint: '/email-finder',
            method: HttpMethod.GET,
            qparams,
        })) as {
            data: {
                first_name: string;
                last_name: string;
                email: string;
                score: number;
                domain: string;
                accept_all: boolean;
                position: string | null;
                twitter: string | null;
                linkedin_url: string | null;
                phone_number: string | null;
                company: string;
                sources: Array<{
                    domain: string;
                    uri: string;
                    extracted_on: string;
                    last_seen_on: string;
                    still_on_page: boolean;
                }>;
                verification: {
                    date: string | null;
                    status: 'valid' | 'accept_all' | 'unknown' | null;
                };
            };
        };

        return {
            first_name: resp.data.first_name,
            last_name: resp.data.last_name,
            email: resp.data.email,
            score: resp.data.score,
            domain: resp.data.domain,
            accept_all: resp.data.accept_all,
            position: resp.data.position,
            twitter: resp.data.twitter,
            linkedin_url: resp.data.linkedin_url,
            phone_number: resp.data.phone_number,
            company: resp.data.company,
            sources: resp.data.sources,
            verification: resp.data.verification,
        };
    },
});
