import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { datacircleAuth } from '../auth';
import { datacircleRequest } from '../common';

export const getLinkedinProfileAction = createAction({
    auth: datacircleAuth,
    name: 'get_linkedin_profile',
    displayName: 'Get LinkedIn Profile',
    description:
        "Fetch a person's LinkedIn profile by its URL, through Up2Data or HarvestAPI, at the provider's own price taken from your Datacircle balance.",
    props: {
        url: Property.ShortText({
            displayName: 'LinkedIn Profile URL',
            description: 'For example https://www.linkedin.com/in/williamhgates',
            required: true,
        }),
        provider: Property.StaticDropdown({
            displayName: 'Provider',
            description:
                'Up2Data is the cheapest, and a profile it can\'t find is free. HarvestAPI answers every section of the profile. Prices: https://docs.datacircle.dev/pricing',
            required: true,
            defaultValue: 'up2data',
            options: {
                disabled: false,
                options: [
                    { label: 'Up2Data', value: 'up2data' },
                    { label: 'HarvestAPI', value: 'harvestapi' },
                ],
            },
        }),
    },
    async run({ auth, propsValue }) {
        if (propsValue.provider === 'harvestapi') {
            return datacircleRequest<unknown>({
                apiKey: auth.secret_text,
                method: HttpMethod.GET,
                path: '/linkedin/profile',
                provider: 'harvestapi',
                queryParams: { url: propsValue.url },
            });
        }
        return datacircleRequest<unknown>({
            apiKey: auth.secret_text,
            method: HttpMethod.POST,
            path: '/v1/profiles/enrich',
            provider: 'up2data',
            body: { url: propsValue.url },
        });
    },
});
