import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { connectucAuth } from '../../index';
import { connectucApiCall } from './api-helpers';
import { HttpMethod } from '@activepieces/pieces-common';

/**
 * Reusable domain dropdown property (single-select)
 * Fetches domains from /activepieces/domains endpoint
 */
export const domainProp = () =>
    Property.Dropdown({
        displayName: 'Domain',
        description: 'Pick a domain to list its users.',
        required: false,
        auth: connectucAuth,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Please connect your account first',
                    options: [],
                };
            }

            try {
                const authValue = auth as OAuth2PropertyValue;

                interface DomainInfo {
                    domain: string;
                    reseller: string;
                    description: string;
                }

                const domainsResponse = await connectucApiCall<Record<string, DomainInfo>>({
                    accessToken: authValue.access_token,
                    endpoint: '/activepieces/domains',
                    method: HttpMethod.GET,
                });

                const options = Object.values(domainsResponse).map(domainInfo => ({
                    label: `${domainInfo.description} (${domainInfo.domain})`,
                    value: domainInfo.domain,
                }));

                return {
                    disabled: false,
                    options,
                };
            } catch (error) {
                console.error('Error fetching domains:', error);
                return {
                    disabled: true,
                    placeholder: 'Failed to load domains. Check your connection.',
                    options: [],
                };
            }
        },
    });

/**
 * Reusable subscriber dropdown property (single-select)
 * Fetches subscribers from /activepieces/subscribers endpoint filtered by domain
 * Uses subscriber UUID as value
 */
export const subscriberUuidProp = (params?: { description?: string }) =>
    Property.Dropdown({
        displayName: 'User',
        description: params?.description ?? 'The user this step acts for.',
        required: true,
        auth: connectucAuth,
        refreshers: ['domain'],
        options: async ({ auth, domain }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Please connect your account first',
                    options: [],
                };
            }

            if (!domain) {
                return {
                    disabled: true,
                    placeholder: 'Please select a domain first',
                    options: [],
                };
            }

            try {
                const authValue = auth as OAuth2PropertyValue;

                interface Subscriber {
                    first_name: string;
                    last_name: string;
                    user: string;
                    uuid: string;
                }

                const subscribers = await connectucApiCall<Subscriber[]>({
                    accessToken: authValue.access_token,
                    endpoint: '/activepieces/subscribers',
                    method: HttpMethod.GET,
                    queryParams: { domain: domain as string },
                });

                const options = subscribers.map(subscriber => {
                    const fullName = `${subscriber.first_name} ${subscriber.last_name}`.trim();
                    return {
                        label: `${fullName} (${subscriber.user})`,
                        value: subscriber.uuid,
                    };
                });

                return { disabled: false, options };
            } catch (error) {
                console.error('Error fetching subscribers:', error);
                return {
                    disabled: true,
                    placeholder: 'Failed to load subscribers. Check your connection.',
                    options: [],
                };
            }
        },
    });

/**
 * Reusable device dropdown property (single-select)
 * Fetches registrations from /users/{user}/registration endpoint filtered by selected user
 * Uses AOR (without "sip:" prefix) as both label and value
 */
export const deviceProp = () =>
    Property.Dropdown({
        displayName: 'Device',
        description: "The user's phone or app that places the call.",
        required: true,
        auth: connectucAuth,
        refreshers: ['user'],
        options: async ({ auth, user }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Please connect your account first',
                    options: [],
                };
            }

            if (!user) {
                return {
                    disabled: true,
                    placeholder: 'Please select a user first',
                    options: [],
                };
            }

            try {
                const authValue = auth as OAuth2PropertyValue;

                interface Registration {
                    aor: string;
                }

                const registrations = await connectucApiCall<Registration[]>({
                    accessToken: authValue.access_token,
                    endpoint: `/users/${user}/registration`,
                    method: HttpMethod.GET,
                });

                const options = registrations.map(reg => {
                    const aor = reg.aor.replace('sip:', '');
                    return { label: aor, value: aor };
                });

                return { disabled: false, options };
            } catch (error) {
                console.error('Error fetching registrations:', error);
                return {
                    disabled: true,
                    placeholder: 'Failed to load devices. Check your connection.',
                    options: [],
                };
            }
        },
    });

/**
 * Reusable SMS number dropdown property (single-select)
 * Fetches SMS numbers from /sms/numbers endpoint
 * Uses number as both label and value
 */
export const smsNumberProp = () =>
    Property.Dropdown({
        displayName: 'From Number',
        description: 'Your ConnectUC number the text is sent from.',
        required: true,
        auth: connectucAuth,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Please connect your account first',
                    options: [],
                };
            }

            try {
                const authValue = auth as OAuth2PropertyValue;

                interface SmsNumbersResponse {
                    numbers: { number: string }[];
                }

                const response = await connectucApiCall<SmsNumbersResponse>({
                    accessToken: authValue.access_token,
                    endpoint: '/sms/numbers',
                    method: HttpMethod.GET,
                });

                const options = response.numbers.map(n => ({
                    label: n.number,
                    value: n.number,
                }));

                return { disabled: false, options };
            } catch (error) {
                console.error('Error fetching SMS numbers:', error);
                return {
                    disabled: true,
                    placeholder: 'Failed to load SMS numbers. Check your connection.',
                    options: [],
                };
            }
        },
    });

/**
 * Reusable SMS recipients dropdown property (multi-select)
 * Fetches SMS numbers from /sms/numbers endpoint
 * Uses number as both label and value
 */
export const smsRecipientsProp = () =>
    Property.MultiSelectDropdown({
        displayName: 'Numbers',
        description: 'Your ConnectUC numbers to watch for texts.',
        required: false,
        auth: connectucAuth,
        refreshers: ['domain', 'users'],
        options: async ({ auth, domain, users }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Please connect your account first',
                    options: [],
                };
            }

            if (!domain) {
                return {
                    disabled: true,
                    placeholder: 'Please select a domain first',
                    options: [],
                };
            }

            if (!users) {
                return {
                    disabled: true,
                    placeholder: 'Please select a user first',
                    options: [],
                };
            }

            try {
                const authValue = auth as OAuth2PropertyValue;

                interface SmsNumbersResponse {
                    numbers: { number: string }[];
                }

                const response = await connectucApiCall<SmsNumbersResponse>({
                    accessToken: authValue.access_token,
                    endpoint: '/sms/numbers',
                    method: HttpMethod.GET,
                    queryParams: {
                        domain: domain as string,
                        users: users as string,
                    },
                });

                const options = response.numbers.map(n => ({
                    label: n.number,
                    value: n.number,
                }));

                return { disabled: false, options };
            } catch (error) {
                console.error('Error fetching SMS numbers:', error);
                return {
                    disabled: true,
                    placeholder: 'Failed to load SMS numbers. Check your connection.',
                    options: [],
                };
            }
        },
    });

/**
 * Reusable users dropdown property (multi-select)
 * Fetches subscribers from /activepieces/subscribers endpoint
 * Includes "All Always" option with value "*"
 */
export const usersProp = () =>
    Property.MultiSelectDropdown({
        displayName: 'Users',
        description: 'Users whose events start the flow.',
        required: false,
        auth: connectucAuth,
        refreshers: ['domain'],
        options: async ({ auth, domain }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Please connect your account first',
                    options: [],
                };
            }

            if (!domain) {
                return {
                    disabled: true,
                    placeholder: 'Please select a domain first',
                    options: [],
                };
            }

            try {
                const authValue = auth as OAuth2PropertyValue;

                interface Subscriber {
                    first_name: string;
                    last_name: string;
                    user: string;
                }

                const subscribers = await connectucApiCall<Subscriber[]>({
                    accessToken: authValue.access_token,
                    endpoint: '/activepieces/subscribers',
                    method: HttpMethod.GET,
                    queryParams: { domain: domain as string },
                });

                const subscriberOptions = subscribers.map(subscriber => {
                    const fullName = `${subscriber.first_name} ${subscriber.last_name}`.trim();
                    return {
                        label: `${fullName} (${subscriber.user})`,
                        value: subscriber.user,
                    };
                });

                const options = subscribers.length > 1
                    ? [{ label: 'All Users', value: '*' }, ...subscriberOptions]
                    : subscriberOptions;

                return {
                    disabled: false,
                    options,
                };
            } catch (error) {
                console.error('Error fetching subscribers:', error);
                return {
                    disabled: true,
                    placeholder: 'Failed to load subscribers. Check your connection.',
                    options: [],
                };
            }
        },
    });

/**
 * Reusable user dropdown property (single-select)
 * Fetches subscribers from /activepieces/subscribers endpoint filtered by domain
 * Uses subscriber user as value (no "All" option)
 */
export const userProp = () =>
    Property.Dropdown({
        displayName: 'User',
        description: 'The user whose texts start the flow.',
        required: true,
        auth: connectucAuth,
        refreshers: ['domain'],
        options: async ({ auth, domain }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Please connect your account first',
                    options: [],
                };
            }

            if (!domain) {
                return {
                    disabled: true,
                    placeholder: 'Please select a domain first',
                    options: [],
                };
            }

            try {
                const authValue = auth as OAuth2PropertyValue;

                interface Subscriber {
                    first_name: string;
                    last_name: string;
                    user: string;
                }

                const subscribers = await connectucApiCall<Subscriber[]>({
                    accessToken: authValue.access_token,
                    endpoint: '/activepieces/subscribers',
                    method: HttpMethod.GET,
                    queryParams: { domain: domain as string },
                });

                const options = subscribers.map(subscriber => {
                    const fullName = `${subscriber.first_name} ${subscriber.last_name}`.trim();
                    return {
                        label: `${fullName} (${subscriber.user})`,
                        value: subscriber.user,
                    };
                });

                return { disabled: false, options };
            } catch (error) {
                console.error('Error fetching subscribers:', error);
                return {
                    disabled: true,
                    placeholder: 'Failed to load subscribers. Check your connection.',
                    options: [],
                };
            }
        },
    });
