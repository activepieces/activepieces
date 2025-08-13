import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { hunterApiCall } from '../common';
import { hunterAuth } from '../../index';
import {
    emailProp,
    firstNameProp,
    lastNameProp,
    positionProp,
    companyLeadProp,
    companyIndustryProp,
    companySizeProp,
    confidenceScoreProp,
    websiteProp,
    countryCodeProp,
    linkedinUrlProp,
    phoneNumberProp,
    twitterProp,
    notesProp,
    sourceProp,
    leadsListDropdownProp,
    leadsListIdsProp,
    customAttributesProp,
} from '../common/props';

export const createLeadAction = createAction({
    auth: hunterAuth,
    name: 'create-lead',
    displayName: 'Create Lead',
    description: 'Create and store a lead record.',
    props: {
        email: emailProp,
        first_name: firstNameProp,
        last_name: lastNameProp,
        position: positionProp,
        company: companyLeadProp,
        company_industry: companyIndustryProp,
        company_size: companySizeProp,
        confidence_score: confidenceScoreProp,
        website: websiteProp,
        country_code: countryCodeProp,
        linkedin_url: linkedinUrlProp,
        phone_number: phoneNumberProp,
        twitter: twitterProp,
        notes: notesProp,
        source: sourceProp,
        leads_list_id: leadsListDropdownProp,
        leads_list_ids: leadsListIdsProp,
        custom_attributes: customAttributesProp,
    },
    async run(context) {
        const props = context.propsValue;

        const body: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(props)) {
            if (
                val !== undefined &&
                val !== null &&
                !(
                    (Array.isArray(val) && val.length === 0) ||
                    (typeof val === 'string' && val === '')
                )
            ) {
                body[key] = val;
            }
        }

        const resp = (await hunterApiCall({
            apiKey: context.auth,
            endpoint: '/leads',
            method: HttpMethod.POST,
            body,
        })) as { data: any };

        return { lead: resp.data };
    },
});
