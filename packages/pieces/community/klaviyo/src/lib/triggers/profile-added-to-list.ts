import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../auth';
import { klaviyoCommon } from '../common';

export const profileAddedToList = createTrigger({
    auth: klaviyoAuth,
    name: 'profile_added_to_list',
    displayName: 'Profile Added to List',
    description: 'Triggers when a profile is added to a specific Klaviyo list.',
    type: TriggerStrategy.POLLING,
    props: {
        list_id: klaviyoCommon.list_id,
    },
    async onEnable(context) {
        const { list_id } = context.propsValue;
        const profiles = await getListProfiles(context.auth as string, list_id as string, 1);
        if (profiles.length > 0) {
            await context.store.put('last_profile_id', profiles[0].id);
        }
    },
    async onDisable(context) {
        await context.store.delete('last_profile_id');
    },
    async run(context) {
        const { list_id } = context.propsValue;
        const lastProfileId = await context.store.get<string>('last_profile_id');
        const profiles = await getListProfiles(context.auth as string, list_id as string, 10);
        
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
        const { list_id } = context.propsValue;
        const profiles = await getListProfiles(context.auth as string, list_id as string, 5);
        return profiles;
    },
});

async function getListProfiles(auth: string, listId: string, limit: number): Promise<any[]> {
    const response = await httpClient.sendRequest<{ data: any[] }>({
        method: HttpMethod.GET,
        url: `${klaviyoCommon.baseUrl}/lists/${listId}/profiles`,
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
            'sort': '-created' // Fallback to profile creation date
        }
    });
    return response.body.data;
}
