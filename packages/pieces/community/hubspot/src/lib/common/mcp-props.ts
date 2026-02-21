import { Property } from '@activepieces/pieces-framework';
import { hubspotAuth } from '../../';
import { OBJECT_TYPE } from './constants';
import { standardObjectPropertiesDropdown } from './props';

export const hubspotProps = {
    contact_id: (required = true) => Property.Dropdown({
        auth: hubspotAuth,
        displayName: 'Contact',
        description: 'Select a contact',
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
            // Implementation similar to toObjectIdsDropdown but as a single select
            return {
                disabled: false,
                options: [] // To be filled with fetch logic if needed, but often we use search
            };
        }
    }),
    company_id: (required = true) => Property.Dropdown({
        auth: hubspotAuth,
        displayName: 'Company',
        description: 'Select a company',
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
    deal_id: (required = true) => Property.Dropdown({
        auth: hubspotAuth,
        displayName: 'Deal',
        description: 'Select a deal',
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
    properties: (objectType: OBJECT_TYPE) => standardObjectPropertiesDropdown({
        objectType,
        displayName: 'Properties',
        required: false,
        description: 'Select properties to retrieve'
    }, true, false)
};
