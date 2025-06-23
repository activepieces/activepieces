import { MarkdownVariant } from '@activepieces/shared';
import { hubspotAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
    getDefaultPropertiesForObject,
    standardObjectPropertiesDropdown,
} from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { Client } from '@hubspot/api-client';
import { FilterOperatorEnum } from '../common/types';

export const findCompanyAction = createAction({
    auth: hubspotAuth,
    name: 'find-company',
    displayName: 'Find Company',
    description: 'Finds a company by searching.',
    props: {
        firstSearchPropertyName: standardObjectPropertiesDropdown(
            {
                objectType: OBJECT_TYPE.COMPANY,
                displayName: 'First search property name',
                required: true,
            },
            true,
            true,
        ),
        firstSearchPropertyValue: Property.ShortText({
            displayName: 'First search property value',
            required: true,
        }),
        secondSearchPropertyName: standardObjectPropertiesDropdown(
            {
                objectType: OBJECT_TYPE.COMPANY,
                displayName: 'Second search property name',
                required: false,
            },
            true,
            true,
        ),
        secondSearchPropertyValue: Property.ShortText({
            displayName: 'Second search property value',
            required: false,
        }),
        markdown: Property.MarkDown({
            variant: MarkdownVariant.INFO,
            value: `### Properties to retrieve:
                                                        
                    name, domain, industry, about_us, phone, address, address2, city, state, zip, country, website, type, description, founded_year, hs_createdate, hs_lastmodifieddate, hs_object_id, is_public, timezone, total_money_raised, total_revenue, owneremail, ownername, numberofemployees, annualrevenue, lifecyclestage, createdate, web_technologies

                    **Specify here a list of additional properties to retrieve**`,
        }),
        additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
            objectType: OBJECT_TYPE.COMPANY,
            displayName: 'Additional properties to retrieve',
            required: false,
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

        const client = new Client({ accessToken: context.auth.access_token });

        const defaultCompanyProperties = getDefaultPropertiesForObject(OBJECT_TYPE.COMPANY);

        const response = await client.crm.companies.searchApi.doSearch({
            limit: 100,
            properties: [...defaultCompanyProperties, ...additionalPropertiesToRetrieve],
            filterGroups: [{ filters }],
        });
        return response;
    },
});
