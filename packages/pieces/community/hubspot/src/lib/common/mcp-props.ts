import { Property } from '@activepieces/pieces-framework';
import { hubspotAuth } from '../../';
import { OBJECT_TYPE } from './constants';
import { standardObjectPropertiesDropdown } from './props';

/**
 * Reusable HubSpot properties for MCP actions.
 */
export const hubspotProps = {
    /**
     * Property for selecting a HubSpot contact.
     * @param required - Whether the field is mandatory.
     */
    contact_id: (required = true) => Property.Dropdown({
        auth: hubspotAuth,
        displayName: 'Contact',
        description: 'Select a contact from your HubSpot account.',
        required,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please connect your account'
                };
            }
            return {
                disabled: false,
                options: [] // Search-based selection recommended for large datasets
            };
        }
    }),
    /**
     * Property for selecting a HubSpot company.
     * @param required - Whether the field is mandatory.
     */
    company_id: (required = true) => Property.Dropdown({
        auth: hubspotAuth,
        displayName: 'Company',
        description: 'Select a company from your HubSpot account.',
        required,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please connect your account'
                };
            }
            return {
                disabled: false,
                options: []
            };
        }
    }),
    /**
     * Property for selecting a HubSpot deal.
     * @param required - Whether the field is mandatory.
     */
    deal_id: (required = true) => Property.Dropdown({
        auth: hubspotAuth,
        displayName: 'Deal',
        description: 'Select a deal from your HubSpot account.',
        required,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please connect your account'
                };
            }
            return {
                disabled: false,
                options: []
            };
        }
    }),
    /**
     * Property for selecting multiple object properties to retrieve or modify.
     * @param objectType - The CRM object type (e.g., CONTACT, COMPANY).
     */
    properties: (objectType: OBJECT_TYPE) => standardObjectPropertiesDropdown({
        objectType,
        displayName: 'Properties',
        required: false,
        description: 'Select the specific properties you want to include in the response or update.'
    }, true, false)
};
