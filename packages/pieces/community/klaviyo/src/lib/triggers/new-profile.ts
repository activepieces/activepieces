import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../auth';
import { klaviyoCommon } from '../common';

export const newProfile = createTrigger({
    auth: klaviyoAuth,
    name: 'new_profile',
    displayName: 'New Profile',
    description: 'Triggers when a new profile is created in your Klaviyo account.',
    type: TriggerStrategy.POLLING,
    props: {},
    async onEnable(context) {
        const profiles = await getProfiles(context.auth as string, 1);
        if (profiles.length > 0) {
            await context.store.put('last_profile_id', profiles[0].id);
        }
    },
    async onDisable(context) {
        await context.store.delete('last_profile_id');
    },
    async run(context) {
        const lastProfileId = await context.store.get<string>('last_profile_id');
        const profiles = await getProfiles(context.auth as string, 10);
        
        const newProfiles = [];
        for (const profile of profiles) {
            if (profile.id === lastProfileId) break;
            newProfiles.push(profile);
        }

        if (newProfiles.length > 0) {
            await context.store.put('last_profile_id', newProfiles[0].id);
        }

        return newProfiles;
    },
    async test(context) {
        const profiles = await getProfiles(context.auth as string, 5);
        return profiles;
    },
});

async function getProfiles(auth: string, limit: number): Promise<any[]> {
    const response = await httpClient.sendRequest<{ data: any[] }>({
        method: HttpMethod.GET,
        url: `${klaviyoCommon.baseUrl}/profiles`,
        headers: {
            'revision': klaviyoCommon.apiVersion,
            'accept': 'application/vnd.api+json'
        },
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth,
        },
        queryParams: {
            'page[size]': limit.toString(),
            'sort': '-created' // Sort by created date descending
        }
    });
    return response.body.data;
}
