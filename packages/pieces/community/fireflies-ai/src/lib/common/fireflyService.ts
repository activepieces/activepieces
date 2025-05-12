import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const FIREFLIES_URL = 'https://api.fireflies.ai/graphql';

export enum FireflyError {
  TranscriptNotFound = 'Transcript not found',
  UserNotFound = 'User not found',
}

export const fireflyService = {
  async getUsers(token: string) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: FIREFLIES_URL,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: {
        query: '{ users { name } }',
      },
    });

    return response.body.data.users;
  },
  async getTranscript(token: string, transcriptId: string) {
    try {
      const response = await httpClient.sendRequest({
        url: FIREFLIES_URL,
        method: HttpMethod.POST,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: {
          query: getTranscriptByIdQuery,
          variables: {
            transcriptId,
          },
        },
      });
      return response.body.data.transcript;
    } catch (_) {
      throw new Error(FireflyError.TranscriptNotFound);
    }
  },
  async getUser(token: string, userId: string) {
    try {
      const response = await httpClient.sendRequest({
        url: FIREFLIES_URL,
        method: HttpMethod.POST,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: {
          query: getUserByIdQuery,
          variables: {
            userId,
          },
        },
      });
      return response.body.data.user;
    } catch (_) {
      throw new Error(FireflyError.UserNotFound);
    }
  },
  async getTranscripts(
    token: string,
    filter: {
      hostEmail?: string;
      title?: string;
      from?: string;
      to?: string;
      participantEmail?: string;
    }
  ) {
    const response = await httpClient.sendRequest({
      url: FIREFLIES_URL,
      method: HttpMethod.POST,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: {
        query: getTranscriptsByFilterQuery,
        variables: filter,
      },
    });
    return response.body.data.transcripts;
  },
  async uploadAudio(
    token: string,
    input: {
      url: string;
      title?: string;
      webhook?: string | null;
      lang?: string;
      saveVideo?: boolean;
      attendees?: {
        displayName?: string;
        email?: string;
        phoneNumber?: string;
      }[];
      referenceId?: string;
    }
  ) {
    const response = await httpClient.sendRequest({
      url: FIREFLIES_URL,
      method: HttpMethod.POST,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: {
        query: uploadAudioMutation,
        variables: {
          input: {
            url: input.url,
            title: input.title,
            webhook: input.webhook,
            custom_language: input.lang,
            save_video: input.saveVideo,
            attendees: input.attendees,
            client_reference_id: input.referenceId,
          },
        },
      },
    });
    return response.body.data.uploadAudio;
  },
};

const getTranscriptByIdQuery = `
query Transcript($transcriptId: String!) {
  transcript(id: $transcriptId) {
    id
    dateString
    privacy
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
    speakers {
      id
      name
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
    title
    host_email
    organizer_email
    calendar_id
    user {
      user_id
      email
      name
    }
    fireflies_users
    participants
    date
    transcript_url
    audio_url
    video_url
    duration
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
    cal_id
    calendar_type
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
    meeting_link
  }
}
`;

const getUserByIdQuery = `
query User($userId: String!) {
  user(id: $userId) {
    user_id
    recent_transcript
    recent_meeting
    num_transcripts
    name
    minutes_consumed
    is_admin
    integrations
    email
    user_groups {
      name
      handle
    }
  }
}
`;

const getTranscriptsByFilterQuery = `
query Transcripts(
  $title: String
  $from: DateTime
  $to: DateTime
  $hostEmail: String
  $participantEmail: String
) {
  transcripts(
    title: $title
    fromDate: $from
    toDate: $to
    host_email: $hostEmail
    participant_email: $participantEmail
  ) {
    id
    dateString
    privacy
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
    speakers {
      id
      name
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
    title
    host_email
    organizer_email
    calendar_id
    user {
      user_id
      email
      name
    }
    fireflies_users
    participants
    date
    transcript_url
    audio_url
    video_url
    duration
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
    cal_id
    calendar_type
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
    meeting_link
  }
}
`;

const uploadAudioMutation = `
mutation($input: AudioUploadInput) {
    uploadAudio(input: $input) {
        success
        title
        message
    }
}
`;
