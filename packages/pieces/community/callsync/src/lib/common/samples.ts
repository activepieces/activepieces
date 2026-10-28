/** What a call event looks like once flattened, with synthetic values. */
const callSample = (event: string, automation: Record<string, unknown>) => ({
  event,
  timestamp: '2026-10-28T10:15:00.000Z',
  org_id: 'your_workspace',
  payload_id: 'evt_5f0c2a7e-1d3b-4c55-9a6e-2b8d4f1c9e10',
  call_id: 2041,
  staff_id: 12,
  staff_name: 'Priya Sharma',
  staff_email: 'priya@example.com',
  caller_name: 'Rahul Verma',
  caller_phone: '+919876543210',
  caller_note: 'Interested in the 2BHK listing',
  caller_label: 'hot lead',
  caller_labels: 'hot lead, site visit',
  call_details_direction: 'incoming',
  call_details_type: 'answered',
  call_details_duration_total: '184s',
  call_details_duration_talk_time: '184s',
  call_details_duration_seconds: 184,
  call_details_status: 'completed',
  call_details_recording_url: 'https://example.com/recordings/2041.mp3',
  call_details_note: 'Wants a site visit on Saturday',
  call_details_started_at: '2026-10-28T10:11:56.000Z',
  call_details_ended_at: '2026-10-28T10:15:00.000Z',
  ...automation,
});

export const callLoggedSample = callSample('call_logged', {
  automation_status: null,
  automation_ai_summary: null,
});

export const recordingUploadedSample = callSample('recording_updated', {
  automation_status: 'pending',
  automation_ai_summary: null,
});

export const aiAnalysisSample = callSample('ai_analysis', {
  automation_status: 'completed',
  automation_error_message: null,
  automation_ai_summary: 'Rahul wants a site visit for the 2BHK listing this Saturday morning.',
  automation_suggested_mood: 'positive',
  automation_suggested_reason: 'Site visit request',
  automation_suggested_person_note: 'Looking for a 2BHK near the metro',
  automation_suggested_call_note: 'Book Saturday 11:00 site visit',
  automation_suggested_caller_name: 'Rahul Verma',
  automation_suggested_call_reason: 'Property enquiry',
  automation_suggested_next_action: 'Confirm the Saturday visit by WhatsApp',
  automation_suggested_labels: 'site visit, hot lead',
  automation_tasks: 'Confirm Saturday 11:00 site visit',
  automation_transcription_text: 'Hello, I saw the 2BHK listing and would like to visit on Saturday…',
});

export const contactUpdatedSample = {
  event: 'caller_updated',
  timestamp: '2026-10-28T10:20:00.000Z',
  org_id: 'your_workspace',
  payload_id: 'evt_8a1d4b2c-7e6f-4d3a-b9c0-1f2e3d4c5b6a',
  caller_name: 'Rahul Verma',
  caller_phone: '+919876543210',
  caller_note: 'Asked for pricing',
  caller_labels: 'hot lead',
  caller_last_interaction: '2026-10-28T10:11:56.000Z',
};
