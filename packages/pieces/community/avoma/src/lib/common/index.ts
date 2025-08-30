import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export interface AvomaAuth {
  apiToken: string;
  accountId: string;
}

export interface Meeting {
  meeting_uuid: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  participants: Participant[];
  created_at: string;
  updated_at: string;
}

export interface Participant {
  email: string;
  name: string;
  role: string;
}

export interface Note {
  note_id: string;
  meeting_uuid: string;
  content: string;
  created_at: string;
  type: string;
}

export interface Recording {
  meeting_uuid: string;
  video_url: string;
  audio_url: string;
  duration: number;
  created_at: string;
}

export interface Transcription {
  meeting_uuid: string;
  transcript: string;
  language: string;
  confidence_score: number;
  created_at: string;
}

export class AvomaApiClient {
  constructor(private auth: AvomaAuth) {}

  private async makeRequest<T>(
    method: HttpMethod,
    endpoint: string,
    body?: any
  ): Promise<T> {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `https://api.avoma.com/v1${endpoint}`,
      headers: {
        'Authorization': `Bearer ${this.auth.apiToken}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  }

  async getMeetings(since?: string): Promise<Meeting[]> {
    const params = since ? `?since=${since}` : '';
    return this.makeRequest<Meeting[]>(HttpMethod.GET, `/meetings${params}`);
  }

  async getMeetingById(meetingId: string): Promise<Meeting> {
    return this.makeRequest<Meeting>(HttpMethod.GET, `/meetings/${meetingId}`);
  }

  async getNotes(since?: string): Promise<Note[]> {
    const params = since ? `?since=${since}` : '';
    return this.makeRequest<Note[]>(HttpMethod.GET, `/notes${params}`);
  }

  async createCall(callData: any): Promise<Meeting> {
    return this.makeRequest<Meeting>(HttpMethod.POST, '/meetings', callData);
  }

  async getMeetingRecording(meetingId: string): Promise<Recording> {
    return this.makeRequest<Recording>(HttpMethod.GET, `/meetings/${meetingId}/recording`);
  }

  async getMeetingTranscription(meetingId: string): Promise<Transcription> {
    return this.makeRequest<Transcription>(HttpMethod.GET, `/meetings/${meetingId}/transcription`);
  }
}

export function createAvomaClient(auth: AvomaAuth): AvomaApiClient {
  return new AvomaApiClient(auth);
}