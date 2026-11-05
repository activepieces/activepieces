export const SAMPLE_CALL_STARTED = {
  event: 'call_started',
  call: { ...baseCall(), call_status: 'ongoing' },
};

export const SAMPLE_CALL_ENDED = {
  event: 'call_ended',
  call: {
    ...baseCall(),
    call_status: 'ended',
    end_timestamp: 1703302428855,
    duration_ms: 21522,
    disconnection_reason: 'user_hangup',
    transcript: 'Agent: hi how are you doing?\nUser: Doing pretty well. How are you?\nAgent: That is great to hear!',
    recording_url: 'https://retellai.s3.us-west-2.amazonaws.com/Jabr9TXYYJHfvl6Syypi88rdAHYHmcq6/recording.wav',
    public_log_url: 'https://retellai.s3.us-west-2.amazonaws.com/Jabr9TXYYJHfvl6Syypi88rdAHYHmcq6/public_log.txt',
  },
};

export const SAMPLE_CALL_ANALYZED = {
  event: 'call_analyzed',
  call: {
    ...SAMPLE_CALL_ENDED.call,
    call_analysis: {
      call_summary: 'The agent called the user to confirm an appointment and the user confirmed.',
      in_voicemail: false,
      user_sentiment: 'Positive',
      call_successful: true,
      custom_analysis_data: { appointment_confirmed: true },
    },
    call_cost: { combined_cost: 7.1, total_duration_seconds: 22 },
  },
};

function baseCall() {
  return {
    call_type: 'phone_call',
    call_id: 'Jabr9TXYYJHfvl6Syypi88rdAHYHmcq6',
    agent_id: 'oBeDLoLOeuAbiuaMFXRtDOLriTJ5tSxD',
    agent_name: 'Appointment Setter',
    agent_version: 1,
    direction: 'outbound',
    from_number: '+12137771234',
    to_number: '+12137771235',
    metadata: { customer_id: 'cus_123' },
    retell_llm_dynamic_variables: { customer_name: 'John Doe' },
    start_timestamp: 1703302407333,
  };
}
