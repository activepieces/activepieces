import { createAction } from "@activepieces/pieces-framework";
import { copperAuth } from "../common/auth";
import { companyCustomFields, companyTags, companyWebsites, companySocials, companyPhoneNumbers, companyAssigneeId, companyAddressCountry, companyAddressPostalCode, companyAddressState, companyAddressCity, companyAddressStreet, companyDetails, companyEmailDomain, companyName, companyContactTypeId, companyPrimaryContactId, companyId } from "../common/company";
import { makeCopperRequest } from "../common/request";
import { HttpMethod } from "@activepieces/pieces-common";
import { COMPANIES_API_ENDPOINT } from "../common/constants";

export const createCompany = createAction({
    auth: copperAuth,
    name: 'create_company',
    displayName: 'Create Company',
    description: 'Create a new company in Copper.',
    props: {
        name: companyName,
        email_domain: companyEmailDomain,
        details: companyDetails,
        address_street: companyAddressStreet,
        address_city: companyAddressCity,
        address_state: companyAddressState,
        address_postal_code: companyAddressPostalCode,
        address_country: companyAddressCountry,
        assignee_id: companyAssigneeId,
        contact_type_id: companyContactTypeId,
        primary_contact_id: companyPrimaryContactId,
        phone_numbers: companyPhoneNumbers,
        socials: companySocials,
        websites: companyWebsites,
        tags: companyTags,
        custom_fields: companyCustomFields,
    },
    async run(context) {
        const { auth, propsValue } = context;
        const {
            name,
            address_street,
            address_city,
            address_state,
            address_postal_code,
            address_country,
            ...optionalProps
        } = propsValue;

        const address = {
            street: address_street,
            city: address_city,
            state: address_state,
            postal_code: address_postal_code,
            country: address_country,
        };

        const cleanedAddress = Object.fromEntries(
            Object.entries(address).filter(([, value]) => value != null)
        );

        const cleanedOptionalProps = Object.fromEntries(
            Object.entries(optionalProps).filter(([, value]) => {
                if (Array.isArray(value)) return value.length > 0;
                return value != null;
            })
        );

        const payload = {
            name,
            ...cleanedOptionalProps,
            ...(Object.keys(cleanedAddress).length > 0 && { address: cleanedAddress }),
        };

        return await makeCopperRequest(
            HttpMethod.POST,
            COMPANIES_API_ENDPOINT,
            auth,
            payload
        );
    },
});

export const updateCompany = createAction({
    auth: copperAuth,
    name: 'update_company',
    displayName: 'Update Company',
    description: 'Update an existing company. Only specified fields will be changed.',
    props: {
        company_id: companyId,
        name: { ...companyName, required: false },
        email_domain: { ...companyEmailDomain, required: false },
        details: { ...companyDetails, required: false },
        address_street: { ...companyAddressStreet, required: false },
        address_city: { ...companyAddressCity, required: false },
        address_state: { ...companyAddressState, required: false },
        address_postal_code: { ...companyAddressPostalCode, required: false },
        address_country: { ...companyAddressCountry, required: false },
        assignee_id: { ...companyAssigneeId, required: false },
        contact_type_id: { ...companyContactTypeId, required: false },
        primary_contact_id: { ...companyPrimaryContactId, required: false },
        phone_numbers: { ...companyPhoneNumbers, required: false },
        socials: { ...companySocials, required: false },
        websites: { ...companyWebsites, required: false },
        tags: { ...companyTags, required: false },
        custom_fields: { ...companyCustomFields, required: false },
    },
    async run(context) {
        const { auth, propsValue } = context;
        const { company_id, ...updateData } = propsValue;

        const addressUpdates = {
            street: updateData.address_street,
            city: updateData.address_city,
            state: updateData.address_state,
            postal_code: updateData.address_postal_code,
            country: updateData.address_country,
        };

        const cleanedAddress = Object.fromEntries(
            Object.entries(addressUpdates).filter(([, value]) => value !== undefined)
        );

        const topLevelProps = [
            'name', 'email_domain', 'details', 'assignee_id', 'contact_type_id',
            'primary_contact_id', 'phone_numbers', 'socials', 'websites', 'tags',
            'custom_fields'
        ];

        const cleanedTopLevelUpdates = Object.fromEntries(
            Object.entries(updateData)
                .filter(([key, value]) => topLevelProps.includes(key) && value !== undefined)
        );

        const payload = {
            ...cleanedTopLevelUpdates,
            ...(Object.keys(cleanedAddress).length > 0 && { address: cleanedAddress }),
        };

        return await makeCopperRequest(
            HttpMethod.PUT,
            `${COMPANIES_API_ENDPOINT}/${company_id}`,
            auth,
            payload
        );
    },
});

export const searchCompany = createAction({
    auth: copperAuth,
    name: 'search_company',
    displayName: 'Search Company',
    description: 'Find a company and return the first matching result.',
    props: {
        company_id: { ...companyId, required: false },
        name: { ...companyName, required: false },
        email_domain: companyEmailDomain,
        phone_number: companyPhoneNumbers,
        contact_type_id: companyContactTypeId,
        assignee_id: companyAssigneeId,
        city: companyAddressCity,
        postal_code: companyAddressPostalCode,
        tags: {
            ...companyTags,
            displayName: 'Tags (Match Any)',
            description: 'Companies matching at least one tag will be returned.',
        },
        social_url: companySocials,
        custom_fields: {
            ...companyCustomFields,
            displayName: 'Custom Fields (Exact Value)',
        },
    },
    async run(context) {
        const { auth, propsValue } = context;

        const searchFilters = {
            ids: propsValue.company_id != null ? [propsValue.company_id] : undefined,
            name: propsValue.name,
            email_domains: propsValue.email_domain ? [propsValue.email_domain] : undefined,
            phone_number: propsValue.phone_number,
            contact_type_ids: propsValue.contact_type_id != null ? [propsValue.contact_type_id] : undefined,
            assignee_ids: propsValue.assignee_id != null ? [propsValue.assignee_id] : undefined,
            city: propsValue.city,
            postal_code: propsValue.postal_code,
            tags: propsValue.tags,
            socials: propsValue.social_url ? [propsValue.social_url] : undefined,
            custom_fields: propsValue.custom_fields,
        };

        const activeFilters = Object.fromEntries(
            Object.entries(searchFilters).filter(([, value]) => {
                if (Array.isArray(value)) return value.length > 0;
                return value != null;
            })
        );

        const payload = {
            page_size: 1,
            ...activeFilters,
        };

        const response = await makeCopperRequest(
            HttpMethod.POST,
            `${COMPANIES_API_ENDPOINT}/search`,
            auth,
            payload
        );

        return response?.length > 0 ? response[0] : null;
    },
});