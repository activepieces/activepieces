import { Property, createAction } from "@activepieces/pieces-framework";
import { callFirefliesApi } from "../common";
import { firefliesAiAuth } from "../../index";
import { FirefliesTranscript } from "../common/models";

// Interface for the User query response (specifically for recent_transcript)
interface FirefliesUserQueryResponse {
    user: {
        recent_transcript?: string;
    };
}

// Interface for the Transcript query response (re-uses the one from findMeetingById implicitly via shared model)
interface FirefliesGetTranscriptResponse {
    transcript: FirefliesTranscript;
}

export const findRecentMeetings = createAction({
    name: 'find_most_recent_meeting',
    displayName: 'Find Most Recent Meeting',
    description: 'Retrieves the full details of the most recent meeting for a user.',
    auth: firefliesAiAuth,
    props: {
        userId: Property.ShortText({
            displayName: 'User ID (Optional)',
            description: 'The ID of the user whose most recent meeting to fetch. Defaults to the authenticated user if not provided.',
            required: false,
        }),
        // Removed 'limit' prop
    },
    async run(context) {
        const apiKey = context.auth as string;
        const { userId } = context.propsValue;

        // Step 1: Get the recent transcript ID from the User query
        let userQuery = `query UserDetails($userId: String) { user(id: $userId) { recent_transcript } }`;
        const userVariables: Record<string, unknown> = {};
        if (userId) {
            userVariables['userId'] = userId;
        } else {
            // If no userId, use query that doesn't require the id argument for the API key owner
            userQuery = `query UserDetails { user { recent_transcript } }`;
        }

        let recentTranscriptId: string | undefined;
        try {
            const userResponse = await callFirefliesApi<FirefliesUserQueryResponse>(apiKey, userQuery, userVariables);
            recentTranscriptId = userResponse.user?.recent_transcript;
        } catch (error) {
            console.error("Error fetching user details for recent transcript ID:", error);
            // Decide if we should throw or return null/empty if user not found or other error
            // For now, if user query fails, we can't proceed.
            return null;
        }

        if (!recentTranscriptId) {
            // No recent transcript found for the user, or user has no transcripts
            return null;
        }

        // Step 2: Get the full transcript details using the recent_transcript_id
        // Re-using the comprehensive query from findMeetingById action
        const transcriptQuery = `
            query Transcript($transcriptId: String!) {
                transcript(id: $transcriptId) {
                    id title host_email organizer_email date dateString privacy transcript_url audio_url video_url duration participants fireflies_users meeting_link calendar_id cal_id calendar_type
                    user { user_id email name num_transcripts recent_meeting minutes_consumed is_admin integrations }
                    speakers { id name }
                    meeting_attendees { displayName email phoneNumber name location }
                    summary { keywords action_items outline shorthand_bullet overview bullet_gist gist short_summary short_overview meeting_type topics_discussed transcript_chapters }
                    analytics { sentiments { negative_pct neutral_pct positive_pct } categories { questions date_times metrics tasks } speakers { speaker_id name duration word_count longest_monologue monologues_count filler_words questions duration_pct words_per_minute } }
                    meeting_info { fred_joined silent_meeting summary_status }
                    apps_preview { outputs { transcript_id user_id app_id created_at title prompt response } }
                    sentences { index speaker_name speaker_id text raw_text start_time end_time ai_filters { task pricing metric question date_and_time text_cleanup sentiment } }
                }
            }
        `;
        const transcriptVariables = { transcriptId: recentTranscriptId };

        try {
            const transcriptResponse = await callFirefliesApi<FirefliesGetTranscriptResponse>(apiKey, transcriptQuery, transcriptVariables);
            return transcriptResponse.transcript;
        } catch (error) {
            console.error(`Error fetching transcript details for ID ${recentTranscriptId}:`, error);
            // If the specific transcript fetch fails (e.g., ID was stale or permissions changed)
            return null;
        }
    },
});
