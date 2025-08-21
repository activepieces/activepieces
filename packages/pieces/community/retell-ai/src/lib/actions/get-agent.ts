import { createAction } from '@activepieces/pieces-framework';
import { retellAiAuth } from '../common/auth';
import { retellAiApi } from '../common/api';
import { retellAiCommon } from '../common/props';
import { Property } from '@activepieces/pieces-framework';

export const getAgent = createAction({
  auth: retellAiAuth,
  name: 'get_agent',
  displayName: 'Get an Agent',
  description: 'Retrieve comprehensive details of a Retell AI agent including configuration, voice settings, and behavior parameters',
  props: {
    agent_id: retellAiCommon.agent_id,
    version: Property.Number({
      displayName: 'Agent Version',
      description: 'Optional version of the API to use for this request. If not provided, will default to latest version.',
      required: false,
    }),
  },
  async run(context) {
    const { agent_id, version } = context.propsValue;

    try {
      const queryParams = version ? { version: version.toString() } : undefined;
      const response = await retellAiApi.get('/v2/get-agent', context.auth, { agent_id, ...queryParams });
      
      return {
        success: true,
        agent_id: response.agent_id,
        agent_name: response.agent_name,
        version: response.version,
        is_published: response.is_published,
        last_modification_timestamp: response.last_modification_timestamp,
        
        voice_configuration: {
          voice_id: response.voice_id,
          voice_model: response.voice_model,
          fallback_voice_ids: response.fallback_voice_ids,
          voice_temperature: response.voice_temperature,
          voice_speed: response.voice_speed,
          volume: response.volume,
        },
        
        behavior_settings: {
          responsiveness: response.responsiveness,
          interruption_sensitivity: response.interruption_sensitivity,
          enable_backchannel: response.enable_backchannel,
          backchannel_frequency: response.backchannel_frequency,
          backchannel_words: response.backchannel_words,
        },
        
        call_management: {
          reminder_trigger_ms: response.reminder_trigger_ms,
          reminder_max_count: response.reminder_max_count,
          end_call_after_silence_ms: response.end_call_after_silence_ms,
          max_call_duration_ms: response.max_call_duration_ms,
          begin_message_delay_ms: response.begin_message_delay_ms,
          ring_duration_ms: response.ring_duration_ms,
        },
        
        environment_settings: {
          ambient_sound: response.ambient_sound,
          ambient_sound_volume: response.ambient_sound_volume,
        },
        
        language_and_recognition: {
          language: response.language,
          stt_mode: response.stt_mode,
          vocab_specialization: response.vocab_specialization,
          boosted_keywords: response.boosted_keywords,
          normalize_for_speech: response.normalize_for_speech,
        },
        
        dtmf_settings: {
          allow_user_dtmf: response.allow_user_dtmf,
          user_dtmf_options: response.user_dtmf_options,
        },
        
        audio_processing: {
          denoising_mode: response.denoising_mode,
        },
        
        webhook_and_privacy: {
          webhook_url: response.webhook_url,
          opt_out_sensitive_data_storage: response.opt_out_sensitive_data_storage,
          opt_in_signed_url: response.opt_in_signed_url,
        },
        
        voicemail_config: response.voicemail_option,
        post_call_analysis: {
          post_call_analysis_data: response.post_call_analysis_data,
          post_call_analysis_model: response.post_call_analysis_model,
        },
        
        pronunciation_dictionary: response.pronunciation_dictionary,
        response_engine: response.response_engine,
        
        message: 'Agent details retrieved successfully',
        raw_response: response,
      };
    } catch (error) {
      throw new Error(`Failed to retrieve agent details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
