import { Property, createAction } from "@activepieces/pieces-framework";
import { callFirefliesApi } from "../common";
import { firefliesAiAuth } from "../../index";
import { FirefliesTranscript } from "../common/models";



interface FirefliesGetTranscriptResponse {
    transcript: FirefliesTranscript;
}

export const findMeetingById = createAction({
    name: 'find_meeting_by_id',
    displayName: 'Find Meeting by ID',
    description: "Fetch a specific meeting's transcript and metadata by its ID.",
    auth: firefliesAiAuth,
    props: {
        transcriptId: Property.ShortText({
            displayName: 'Transcript ID',
            description: 'The ID of the transcript to fetch.',
            required: true,
        }),
    },
    async run(context) {
        const apiKey = context.auth as string;
        const transcriptId = context.propsValue.transcriptId;

        const query = `
            query Transcript($transcriptId: String!) {
                transcript(id: $transcriptId) {
                    id
                    title
                    host_email
                    organizer_email
                    date
                    dateString
                    privacy
                    transcript_url
                    audio_url
                    video_url
                    duration
                    participants
                    fireflies_users
                    meeting_link
                    calendar_id
                    cal_id
                    calendar_type
                    user {
                        user_id
                        email
                        name
                        num_transcripts
                        recent_meeting
                        minutes_consumed
                        is_admin
                        integrations
                    }
                    speakers {
                        id
                        name
                    }
                    meeting_attendees {
                        displayName
                        email
                        phoneNumber
                        name
                        location
                    }
                    summary {
                        keywords
                        action_items
                        outline
                        shorthand_bullet
                        overview
                        bullet_gist
                        gist
                        short_summary
                        short_overview
                        meeting_type
                        topics_discussed
                        transcript_chapters
                    }
                    analytics {
                        sentiments {
                            negative_pct
                            neutral_pct
                            positive_pct
                        }
                        categories {
                            questions
                            date_times
                            metrics
                            tasks
                        }
                        speakers {
                            speaker_id
                            name
                            duration
                            word_count
                            longest_monologue
                            monologues_count
                            filler_words
                            questions
                            duration_pct
                            words_per_minute
                        }
                    }
                    meeting_info {
                        fred_joined
                        silent_meeting
                        summary_status
                    }
                    apps_preview {
                        outputs {
                            transcript_id
                            user_id
                            app_id
                            created_at
                            title
                            prompt
                            response
                        }
                    }
                    sentences {
                        index
                        speaker_name
                        speaker_id
                        text
                        raw_text
                        start_time
                        end_time
                        ai_filters {
                            task
                            pricing
                            metric
                            question
                            date_and_time
                            text_cleanup
                            sentiment
                        }
                    }
                }
            }
        `;

        const variables = { transcriptId };

        const response = await callFirefliesApi<FirefliesGetTranscriptResponse>(apiKey, query, variables);
        return response.transcript;
    },
});
