import { createAction } from '@activepieces/pieces-framework';
import { HttpError, HttpMethod, QueryParams } from '@activepieces/pieces-common';
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
    description: 'Retrieve/propose the most likely email for a person at a domain.',
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
        } = context.propsValue as {
            domain?: string;
            company?: string;
            first_name?: string;
            last_name?: string;
            full_name?: string;
            max_duration?: number;
        };

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
        if (max_duration !== undefined && (max_duration < 3 || max_duration > 20)) {
            throw new Error('max_duration must be between 3 and 20 seconds.');
        }

        const qparams: QueryParams = {};
        if (domain) qparams['domain'] = domain;
        else if (company) qparams['company'] = company;
        if (first_name) qparams['first_name'] = first_name;
        if (last_name) qparams['last_name'] = last_name;
        if (full_name) qparams['full_name'] = full_name;
        if (max_duration !== undefined) qparams['max_duration'] = String(max_duration);

        let responseBody: any;
        try {
            responseBody = await hunterApiCall({
                apiKey: context.auth,
                endpoint: '/email-finder',
                method: HttpMethod.GET,
                qparams,
            });
        } catch (err) {
            const httpErr = err as HttpError;
            const status = httpErr.response?.status;
            const errId = (httpErr.response?.body as any)?.errors?.[0]?.id;
            const details = (httpErr.response?.body as any)?.errors?.[0]?.details ?? '';

            if (status === 400) {
                switch (errId) {
                    case 'wrong_params':
                        throw new Error(
                            'Missing required parameter—please supply domain or company, and first_name+last_name or full_name.'
                        );
                    case 'invalid_first_name':
                        throw new Error('The supplied first_name is invalid.');
                    case 'invalid_last_name':
                        throw new Error('The supplied last_name is invalid.');
                    case 'invalid_full_name':
                        throw new Error('The supplied full_name is invalid.');
                    case 'invalid_domain':
                        throw new Error(
                            'The supplied domain is invalid or lacks MX records.'
                        );
                    case 'invalid_max_duration':
                        throw new Error(
                            'The supplied max_duration is invalid (must be 3–20 seconds).'
                        );
                }
            }
            if (status === 429) {
                throw new Error(
                    'Rate limit exceeded (15 requests/sec, 500 req/min). Please retry shortly.'
                );
            }
            if (status === 451 && errId === 'claimed_email') {
                throw new Error(
                    'This email address cannot be processed because its owner requested to stop processing.'
                );
            }
            throw new Error(
                `Hunter Email Finder error: ${details} (status ${status}).`
            );
        }

        const d = responseBody.data;
        return {
            first_name: d.first_name,
            last_name: d.last_name,
            email: d.email,
            score: d.score,
            domain: d.domain,
            accept_all: d.accept_all,
            position: d.position,
            twitter: d.twitter,
            linkedin_url: d.linkedin_url,
            phone_number: d.phone_number,
            company: d.company,
            sources: d.sources,
            verification: d.verification,
        };
    },
});
