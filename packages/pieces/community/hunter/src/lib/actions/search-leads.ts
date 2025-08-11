import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { hunterApiCall } from '../common';
import { hunterAuth } from '../../index';
import {
    leadsListDropdownProp,
    emailFilterProp,
    firstNameFilterProp,
    lastNameFilterProp,
    positionFilterProp,
    companyFilterProp,
    industryFilterProp,
    websiteFilterProp,
    countryCodeFilterProp,
    companySizeFilterProp,
    sourceFilterProp,
    twitterFilterProp,
    linkedinUrlFilterProp,
    phoneNumberFilterProp,
    syncStatusProp,
    sendingStatusProp,
    verificationStatusProp,
    dateFilterProp as lastActivityAtProp,
    dateFilterProp as lastContactedAtProp,
    customAttributesFilterProp,
    queryProp,
    limitProp,
    offsetProp,
} from '../common/props';

export const searchLeadsAction = createAction({
    auth: hunterAuth,
    name: 'search-leads',
    displayName: 'Search Leads',
    description: 'List and filter leads in the account.',
    props: {
        leads_list_id: leadsListDropdownProp,
        email: emailFilterProp,
        first_name: firstNameFilterProp,
        last_name: lastNameFilterProp,
        position: positionFilterProp,
        company: companyFilterProp,
        industry: industryFilterProp,
        website: websiteFilterProp,
        country_code: countryCodeFilterProp,
        company_size: companySizeFilterProp,
        source: sourceFilterProp,
        twitter: twitterFilterProp,
        linkedin_url: linkedinUrlFilterProp,
        phone_number: phoneNumberFilterProp,
        sync_status: syncStatusProp,
        sending_status: sendingStatusProp,
        verification_status: verificationStatusProp,
        last_activity_at: lastActivityAtProp,
        last_contacted_at: lastContactedAtProp,
        custom_attributes: customAttributesFilterProp,
        query: queryProp,
        limit: limitProp,
        offset: offsetProp,
    },
    async run(context) {
        const pv = context.propsValue;
        const q: QueryParams = {};

        if (pv.limit !== undefined) q['limit'] = String(pv.limit);
        if (pv.offset !== undefined) q['offset'] = String(pv.offset);

        [
            'email', 'first_name', 'last_name', 'position', 'company',
            'industry', 'website', 'country_code', 'company_size', 'source',
            'twitter', 'linkedin_url', 'phone_number', 'sync_status', 'query'
        ].forEach((key) => {
            if ((pv as any)[key]) q[key] = (pv as any)[key] as string;
        });

        if (pv.sending_status?.length) q['sending_status[]'] = pv.sending_status.join(',');
        if (pv.verification_status?.length) q['verification_status[]'] = pv.verification_status.join(',');

        if (pv.last_activity_at) q['last_activity_at'] = pv.last_activity_at;
        if (pv.last_contacted_at) q['last_contacted_at'] = pv.last_contacted_at;

        if (pv.leads_list_id !== undefined) q['leads_list_id'] = String(pv.leads_list_id);

        if (pv.custom_attributes) {
            const ca = pv.custom_attributes as Record<string, string>;
            Object.entries(ca).forEach(([slug, val]) => {
                q[`custom_attributes[${slug}]`] = val;
            });
        }

        const resp = (await hunterApiCall({
            apiKey: context.auth,
            endpoint: '/leads',
            method: HttpMethod.GET,
            qparams: q,
        })) as {
            data: { leads: Array<any> };
            meta: { count: number; total: number; params: { limit: number; offset: number } };
        };

        return {
            leads: resp.data.leads,
            count: resp.meta.count,
            total: resp.meta.total,
            limit: resp.meta.params.limit,
            offset: resp.meta.params.offset,
        };
    },
});
