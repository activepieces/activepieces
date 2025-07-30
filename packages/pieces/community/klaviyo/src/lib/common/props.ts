import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

interface KlaviyoProfile {
    id: string;
    attributes: {
        first_name?: string;
        last_name?: string;
        email?: string;
    };
}

interface KlaviyoList {
    id: string,
    attributes: {
        name?: string;
    };
}

export const profileIdDropdown = Property.Dropdown({
    displayName: 'Profile Id',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect your account',
                options: [],
            };
        }
        const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
        const profiles = await makeRequest(authProp.access_token, HttpMethod.GET, '/profiles', {});

        const options = (profiles.data as KlaviyoProfile[]).map((field) => {
            const firstName = field.attributes.first_name || '';
            const lastName = field.attributes.last_name || '';
            const label = [firstName, lastName].filter(Boolean).join(' ');
            return {
                label: label || field.attributes.email || field.id,
                value: field.id,
            };
        });

        return {
            disabled: false,
            options: options,
        };
    },
});

export const profileIdDropdownWithEmail = Property.Dropdown({
    displayName: 'Profile Id',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect your account',
                options: [],
            };
        }
        const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
        const profiles = await makeRequest(authProp.access_token, HttpMethod.GET, '/profiles', {});

        const options = (profiles.data as KlaviyoProfile[]).map((profile) => {
            const firstName = profile.attributes.first_name || '';
            const lastName = profile.attributes.last_name || '';
            const email = profile.attributes.email || '';
            
            let label = '';
            if (firstName || lastName) {
                label = [firstName, lastName].filter(Boolean).join(' ');
                if (email) {
                    label += ` (${email})`;
                }
            } else if (email) {
                label = email;
            } else {
                label = profile.id;
            }

            return {
                label,
                value: profile.id,
            };
        });

        return {
            disabled: false,
            options: options,
        };
    },
});

export const profileIdsMultiSelectDropdown = Property.MultiSelectDropdown({
    displayName: 'Profile Ids',
    description: 'Select one or more Klaviyo profiles',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect your account',
                options: [],
            };
        }
        const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
        const profiles = await makeRequest(authProp.access_token, HttpMethod.GET, '/profiles', {});

        const options = (profiles.data as KlaviyoProfile[]).map((field) => {
            const firstName = field.attributes.first_name || '';
            const lastName = field.attributes.last_name || '';
            const email = field.attributes.email || '';
            const label = [firstName, lastName].filter(Boolean).join(' ') + (email ? ` (${email})` : '');
            return {
                label: label || field.id,
                value: field.id,
            };
        });

        return {
            options,
        };
    },
});

export const profileIdsInListDropdown = Property.Dropdown({
    displayName: 'Profile Ids in List',
    required: true,
    refreshers: ['auth', 'list_id'],
    options: async ({ auth, list_id }) => {
        if (!auth || !list_id) {
            return {
                disabled: true,
                placeholder: 'Connect your account and select a list',
                options: [],
            };
        }
        const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
        const profiles = await makeRequest(authProp.access_token, HttpMethod.GET, `/lists/${list_id}/profiles`, {});

        const options = (profiles.data as KlaviyoProfile[]).map((profile) => {
            const firstName = profile.attributes.first_name || '';
            const lastName = profile.attributes.last_name || '';
            const email = profile.attributes.email || '';
            
            let label = '';
            if (firstName || lastName) {
                label = [firstName, lastName].filter(Boolean).join(' ');
                if (email) {
                    label += ` (${email})`;
                }
            } else if (email) {
                label = email;
            } else {
                label = profile.id;
            }

            return {
                label,
                value: profile.id,
            };
        });

        return {
            disabled: false,
            options: options,
        };
    },
});

export const ListprofileIdsMultiSelectDropdown = Property.MultiSelectDropdown({
    displayName: 'Profile Ids',
    description: 'Select one or more Klaviyo profiles',
    required: true,
    refreshers: ['auth', 'list_id'],
    options: async ({ auth, list_id }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect your account',
                options: [],
            };
        }
        const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
        const profiles = await makeRequest(authProp.access_token, HttpMethod.GET, `/lists/${list_id}/profiles`, {});

        const options = (profiles.data as KlaviyoProfile[]).map((field) => {
            const firstName = field.attributes.first_name || '';
            const lastName = field.attributes.last_name || '';
            const email = field.attributes.email || '';
            const label = [firstName, lastName].filter(Boolean).join(' ') + (email ? ` (${email})` : '');
            return {
                label: label || field.id,
                value: field.id,
            };
        });

        return {
            options,
        };
    },
});

export const listIdDropdown = Property.Dropdown({
    displayName: 'List Id',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect your account',
                options: [],
            };
        }

        const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
        const list = await makeRequest(authProp.access_token, HttpMethod.GET, '/lists', {});

        const options = (list.data as KlaviyoList[]).map((field) => {
            return {
                label: field.attributes.name || field.id,
                value: field.id,
            };
        });

        return {
            disabled: false,
            options: options,
        };
    },
});

export const segmentIdDropdown = Property.Dropdown({
    displayName: 'Segment Id',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect your account',
                options: [],
            };
        }

        const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
        const list = await makeRequest(authProp.access_token, HttpMethod.GET, '/segments', {});

        const options = (list.data as KlaviyoList[]).map((field) => {
            return {
                label: field.attributes.name || field.id,
                value: field.id,
            };
        });

        return {
            disabled: false,
            options: options,
        };
    },
});

export const countryCode = Property.ShortText({
  displayName: 'Country Code',
  description: 'Enter 2-letter ISO country code. Popular: US, GB, CA, DE, FR, AU, JP, CN, IN, BR',
  required: false,
});



//common props
export const list_id = Property.ShortText({
    displayName: 'List Id',
    required: true,
    description: 'Unique identifier for a list.'
});

export const subscribeEmail = Property.Checkbox({
    displayName: "Subscribe to Email",
    required: false,
    description: "Whether to subscribe this profile to email marketing."
});

export const subscribeSms = Property.Checkbox({
    displayName: "Subscribe to SMS",
    required: false,
    description: "Whether to subscribe this profile to SMS marketing."
});

export const subscribeSmsTransactional = Property.Checkbox({
    displayName: "Subscribe to SMS (Transactional)",
    required: false,
    description: "Whether to subscribe this profile to transactional SMS."
});

export const unsubscribeEmail = Property.Checkbox({
    displayName: "Unsubscribe from Email",
    required: false,
    description: "Whether to unsubscribe this profile from email marketing."
});

export const unsubscribeSms = Property.Checkbox({
    displayName: "Unsubscribe from SMS",
    required: false,
    description: "Whether to unsubscribe this profile from SMS marketing."
});

export const unsubscribeSmsTransactional = Property.Checkbox({
    displayName: "Unsubscribe from SMS (Transactional)",
    required: false,
    description: "Whether to unsubscribe this profile from transactional SMS."
});

export const customSource = Property.ShortText({
    displayName: "Custom Source",
    required: false,
    description: "A custom source label for tracking how this subscription was created."
});

export const historicalImport = Property.Checkbox({
    displayName: "Historical Import",
    required: false,
    description: "Set to true for historical imports to bypass certain validations."
});

export const profileIds = Property.Array({
    displayName: "Profile IDs",
    required: true,
    description: "List of profile IDs to subscribe.",
});

export const profile_data = Property.Object({
    displayName: "Profile Data",
    required: false,
    description: "Additional attributes for the profile."
});