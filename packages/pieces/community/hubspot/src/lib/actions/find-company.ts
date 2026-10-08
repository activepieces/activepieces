import { MarkdownVariant } from '@activepieces/pieces-framework';
import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
    getDefaultPropertiesForObject,
    standardObjectPropertiesDropdown,
} from '../common/props';
import { OBJECT_TYPE, MAX_SEARCH_PAGE_SIZE } from '../common/constants';
import { Client } from '@hubspot/api-client';
import { FilterOperatorEnum } from '../common/types';
import { companySearchOutputSchema } from '../output-schemas';

export const findCompanyAction = createAction({
    auth: hubspotAuth,
    name: 'find-company',
    classification: 'SEARCH',
    displayName: 'Find Company',
    description: 'Finds up to 200 companies matching one or two property values.',
    audience: 'both',
    aiMetadata: { description: 'Searches companies via the HubSpot CRM search API, matching on one or two property name/value pairs (exact match, combined as AND), and returns matching companies. Use to locate a company by domain, name, or another property before reading or updating it; prefer Get Company when you already have the company ID. Read-only and idempotent.', idempotent: true },
    outputSchema: companySearchOutputSchema,
    props: {
        firstSearchPropertyName: standardObjectPropertiesDropdown(
            {
                objectType: OBJECT_TYPE.COMPANY,
                displayName: 'Search Property',
                description: 'The property to compare, such as the company domain.',
                required: true,
            },
            true,
            true,
        ),
        firstSearchPropertyValue: Property.ShortText({
            displayName: 'Search Value',
            description: 'Only exact matches are returned.',
            required: true,
        }),
        secondSearchPropertyName: standardObjectPropertiesDropdown(
            {
                objectType: OBJECT_TYPE.COMPANY,
                displayName: 'Second Search Property',
                description: 'Optional second condition; records must match both.',
                required: false,
                advanced: true,
            },
            true,
            true,
        ),
        secondSearchPropertyValue: Property.ShortText({
            displayName: 'Second Search Value',
            description: 'Ignored unless a second property is also chosen.',
            required: false,
            advanced: true,
        }),
        markdown: Property.MarkDown({
            variant: MarkdownVariant.INFO,
            value: `Returned by default: name, domain, industry, about_us, phone, address, address2, city, state, zip, country, website, type, description, founded_year, hs_createdate, hs_lastmodifieddate, hs_object_id, is_public, timezone, total_money_raised, total_revenue, owneremail, ownername, numberofemployees, annualrevenue, lifecyclestage, createdate, web_technologies.

Pick more under **Advanced**.`,
        }),
        additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
            objectType: OBJECT_TYPE.COMPANY,
            displayName: 'Additional Properties to Retrieve',
            required: false,
            advanced: true,
        }),
    },
    async run(context) {
        const {
            firstSearchPropertyName,
            firstSearchPropertyValue,
            secondSearchPropertyName,
            secondSearchPropertyValue,
        } = context.propsValue;
        const additionalPropertiesToRetrieve = context.propsValue.additionalPropertiesToRetrieve ?? [];

        const filters = [
            {
                propertyName: firstSearchPropertyName as string,
                operator: FilterOperatorEnum.Eq,
                value: firstSearchPropertyValue,
            },
        ];

        if (secondSearchPropertyName && secondSearchPropertyValue) {
            filters.push({
                propertyName: secondSearchPropertyName as string,
                operator: FilterOperatorEnum.Eq,
                value: secondSearchPropertyValue,
            });
        }

        const client = new Client({ accessToken: getHubspotAccessToken(context.auth) });

        const defaultCompanyProperties = getDefaultPropertiesForObject(OBJECT_TYPE.COMPANY);

        const response = await client.crm.companies.searchApi.doSearch({
            limit: MAX_SEARCH_PAGE_SIZE,
            properties: [...defaultCompanyProperties, ...additionalPropertiesToRetrieve],
            filterGroups: [{ filters }],
        });
        return response;
    },
});
