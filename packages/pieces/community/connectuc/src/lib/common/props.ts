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
        description: 'Select domain to which this trigger applies',
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
                    placeholder: 'Error loading domains',
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
        description: 'Select users to which this trigger applies',
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

                const options = [
                    {
                        label: 'All Always',
                        value: '*',
                    },
                    ...subscribers.map(subscriber => {
                        const fullName = `${subscriber.first_name} ${subscriber.last_name}`.trim();
                        return {
                            label: `${fullName} (${subscriber.user})`,
                            value: subscriber.user,
                        };
                    })
                ];

                return {
                    disabled: false,
                    options,
                };
            } catch (error) {
                console.error('Error fetching subscribers:', error);
                return {
                    disabled: true,
                    placeholder: 'Error loading subscribers',
                    options: [],
                };
            }
        },
    });
