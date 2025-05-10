import { Property, createAction } from "@activepieces/pieces-framework";
import { callFirefliesApi } from "../common";
import { firefliesAiAuth } from "../../index";
import { FirefliesTranscript } from "../common/models";

interface FirefliesListTranscriptsResponse {
    transcripts: FirefliesTranscript[];
}

export const findMeetingsByQuery = createAction({
    name: 'find_meetings_by_query',
    displayName: 'Find Meetings by Query',
    description: 'Search for meetings using various criteria like title, emails, dates, etc.',
    auth: firefliesAiAuth,
    props: {
        title: Property.ShortText({
            displayName: 'Title (Optional)',
            description: 'Filter by meeting title.',
            required: false,
        }),
        hostEmail: Property.ShortText({
            displayName: 'Host Email (Optional)',
            description: 'Filter by host email.',
            required: false,
        }),
        organizerEmail: Property.ShortText({
            displayName: 'Organizer Email (Optional)',
            description: 'Filter by organizer email.',
            required: false,
        }),
        participantEmail: Property.ShortText({
            displayName: 'Participant Email (Optional)',
            description: 'Filter by participant email.',
            required: false,
        }),
        userId: Property.ShortText({
            displayName: 'User ID (Optional)',
            description: 'Filter by user ID (organizer or participant).',
            required: false,
        }),
        mine: Property.Checkbox({
            displayName: 'My Meetings Only (Optional)',
            description: 'Filter for meetings where the API key owner is the organizer.',
            required: false,
            defaultValue: false,
        }),
        fromDate: Property.ShortText({
            displayName: 'From Date (Optional)',
            description: 'Return transcripts created after this date (ISO 8601 format, e.g., YYYY-MM-DDTHH:mm:ss.sssZ).',
            required: false,
        }),
        toDate: Property.ShortText({
            displayName: 'To Date (Optional)',
            description: 'Return transcripts created before this date (ISO 8601 format, e.g., YYYY-MM-DDTHH:mm:ss.sssZ).',
            required: false,
        }),
        limit: Property.Number({
            displayName: 'Limit (Optional)',
            description: 'Maximum number of meetings to retrieve (max 50).',
            required: false,
            defaultValue: 10,
        }),
        skip: Property.Number({
            displayName: 'Skip (Optional)',
            description: 'Number of transcripts to skip (for pagination).',
            required: false,
        }),
    },
    async run(context) {
        const apiKey = context.auth as string;
        const {
            title,
            hostEmail,
            organizerEmail,
            participantEmail,
            userId,
            mine,
            fromDate,
            toDate,
            limit,
            skip
        } = context.propsValue;

        const query = `
            query SearchTranscripts(
                $title: String,
                $hostEmail: String,
                $organizerEmail: String,
                $participantEmail: String,
                $userId: String,
                $mine: Boolean,
                $fromDate: DateTime,
                $toDate: DateTime,
                $limit: Int,
                $skip: Int
            ) {
                transcripts(
                    title: $title,
                    host_email: $hostEmail,
                    organizer_email: $organizerEmail,
                    participant_email: $participantEmail,
                    user_id: $userId,
                    mine: $mine,
                    fromDate: $fromDate,
                    toDate: $toDate,
                    limit: $limit,
                    skip: $skip
                ) {
                    # Comprehensive field selection from FirefliesTranscript model
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

        const variables: Record<string, unknown> = {};
        if (title !== undefined) variables['title'] = title;
        if (hostEmail !== undefined) variables['hostEmail'] = hostEmail;
        if (organizerEmail !== undefined) variables['organizerEmail'] = organizerEmail;
        if (participantEmail !== undefined) variables['participantEmail'] = participantEmail;
        if (userId !== undefined) variables['userId'] = userId;
        if (mine !== undefined) variables['mine'] = mine;
        if (fromDate !== undefined) variables['fromDate'] = fromDate;
        if (toDate !== undefined) variables['toDate'] = toDate;
        if (limit !== undefined) variables['limit'] = limit;
        if (skip !== undefined) variables['skip'] = skip;

        const response = await callFirefliesApi<FirefliesListTranscriptsResponse>(apiKey, query, variables);
        return response.transcripts;
    },
});
