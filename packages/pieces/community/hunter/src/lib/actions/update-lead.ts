import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { hunterApiCall } from '../common';
import { hunterAuth } from '../../index';
import {
    leadSelectDropdownProp,
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

export const updateLeadAction = createAction({
    auth: hunterAuth,
    name: 'update-lead',
    displayName: 'Update Lead',
    description: 'Modify existing lead data.',
    props: {
        lead_id: leadSelectDropdownProp,
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
        const leadId = props.lead_id;

        const body: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(props)) {
            if (key === 'lead_id') continue;
            if (
                value !== undefined &&
                value !== null &&
                !(
                    (Array.isArray(value) && value.length === 0) ||
                    (typeof value === 'string' && value === '')
                )
            ) {
                body[key] = value;
            }
        }

        if (Object.keys(body).length === 0) {
            throw new Error('You must specify at least one field to update.');
        }

        await hunterApiCall({
            apiKey: context.auth,
            endpoint: `/leads/${leadId}`,
            method: HttpMethod.PUT,
            body,
        });

        return { success: true };
    },
});
