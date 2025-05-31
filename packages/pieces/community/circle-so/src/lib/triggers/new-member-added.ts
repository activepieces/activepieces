import { TriggerStrategy, createTrigger } from "@activepieces/pieces-framework";
import {
    circleSoAuth,
    circleSoBaseUrl,
    ListCommunityMembersResponse
} from "../common";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const newMemberAdded = createTrigger({
    auth: circleSoAuth,
    name: 'new_member_added',
    displayName: 'New Member Added',
    description: 'Triggers when a new member is added to the community.',
    props: {},
    type: TriggerStrategy.POLLING,
    sampleData: {
        "first_name": "Gov.",
        "last_name": "Loriann Barton",
        "headline": "Sales Orchestrator",
        "created_at": "2024-09-03T16:20:19.814Z",
        "updated_at": "2024-09-03T16:20:19.826Z",
        "community_id": 1,
        "last_seen_at": null,
        "profile_confirmed_at": "2024-09-03T16:20:19.000Z",
        "id": 2,
        "profile_url": "http://reynolds.circledev.net:31337/u/352c3aff",
        "public_uid": "352c3aff",
        "profile_fields": [],
        "flattened_profile_fields": {
            "profile_field_key_1": null
        },
        "avatar_url": null,
        "user_id": 3,
        "name": "Gov. Loriann Barton",
        "email": "raul@nitzsche.org",
        "accepted_invitation": "2024-09-03 16:20:19 UTC",
        "active": true,
        "sso_provider_user_id": null,
        "member_tags": [],
        "posts_count": 0,
        "comments_count": 0,
        "gamification_stats": {
            "community_member_id": 2,
            "total_points": 0,
            "current_level": 1,
            "current_level_name": "Level 1",
            "points_to_next_level": 50,
            "level_progress": 50
        }
    },
    async onEnable(context) {
        await context.store.put('lastProcessedMemberDate', new Date().toISOString());
    },
    async onDisable(context) {
        await context.store.delete('lastProcessedMemberDate');
    },
    async run(context) {
        const lastProcessedDate = await context.store.get<string>('lastProcessedMemberDate') || new Date(0).toISOString();

        const response = await httpClient.sendRequest<ListCommunityMembersResponse>({
            method: HttpMethod.GET,
            url: `${circleSoBaseUrl}/community_members`,
            queryParams: {
                // The API doesn't state a sort by created_at.
                // We will sort client-side. Fetch a reasonable number per page.
                per_page: '50',
                status: 'all' // Ensure we get all members, including those potentially inactive right after creation
            },
            headers: {
                "Authorization": `Bearer ${context.auth}`,
                "Content-Type": "application/json"
            }
        });

        const newMembers = response.body.records
            .filter(member => new Date(member.created_at) > new Date(lastProcessedDate))
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        if (newMembers.length > 0) {
            const latestMemberInBatchDate = newMembers[newMembers.length - 1].created_at;
            await context.store.put('lastProcessedMemberDate', latestMemberInBatchDate);
        }

        return newMembers;
    },
    async test(context) {
        const response = await httpClient.sendRequest<ListCommunityMembersResponse>({
            method: HttpMethod.GET,
            url: `${circleSoBaseUrl}/community_members`,
            queryParams: {
                per_page: '5',
                status: 'all'
            },
            headers: {
                "Authorization": `Bearer ${context.auth}`,
                "Content-Type": "application/json"
            }
        });
        // Sort by created_at desc to get the latest for sample data
        return response.body.records
            .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 3);
    }
});
