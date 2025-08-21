import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { retellAiAuth } from '../common/auth';
import { retellAiApi } from '../common/api';

const polling: Polling<string, { 
  limit?: number; 
  call_status_filter?: string; 
  call_direction_filter?: string;
  include_transcript?: boolean;
  include_analysis?: boolean;
}> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { 
      limit = 25, 
      call_status_filter = 'all', 
      call_direction_filter = 'all',
      include_transcript = false,
      include_analysis = false
    } = propsValue;

    try {
      const response = await retellAiApi.post('/v2/list-calls', auth, {
        limit: Math.min(Math.max(limit, 1), 100),
        offset: 0,
      });

      if (!response.calls || !Array.isArray(response.calls)) {
        return [];
      }

      let filteredCalls = response.calls;

      if (call_status_filter !== 'all') {
        filteredCalls = filteredCalls.filter((call: any) => call.call_status === call_status_filter);
      }

      if (call_direction_filter !== 'all') {
        filteredCalls = filteredCalls.filter((call: any) => call.direction === call_direction_filter);
      }

      const enrichedCalls = filteredCalls.map((call: any) => {
        const callData: any = {
          call_id: call.call_id,
          call_type: call.call_type,
          from_number: call.from_number,
          to_number: call.to_number,
          direction: call.direction,
          agent_id: call.agent_id,
          agent_version: call.agent_version,
          call_status: call.call_status,
          start_timestamp: call.start_timestamp,
          end_timestamp: call.end_timestamp,
          duration_ms: call.duration_ms,
          metadata: call.metadata || {},
          telephony_identifier: call.telephony_identifier,
          retell_llm_dynamic_variables: call.retell_llm_dynamic_variables || {},
          collected_dynamic_variables: call.collected_dynamic_variables || {},
          custom_sip_headers: call.custom_sip_headers || {},
          opt_out_sensitive_data_storage: call.opt_out_sensitive_data_storage,
          opt_in_signed_url: call.opt_in_signed_url,
          disconnection_reason: call.disconnection_reason,
          recording_url: call.recording_url,
          public_log_url: call.public_log_url,
          knowledge_base_retrieved_contents_url: call.knowledge_base_retrieved_contents_url,
        };

        if (include_transcript && call.transcript) {
          callData.transcript = call.transcript;
          callData.transcript_object = call.transcript_object;
          callData.transcript_with_tool_calls = call.transcript_with_tool_calls;
        }

        if (include_analysis && call.call_analysis) {
          callData.call_analysis = {
            call_summary: call.call_analysis.call_summary,
            in_voicemail: call.call_analysis.in_voicemail,
            user_sentiment: call.call_analysis.user_sentiment,
            call_successful: call.call_analysis.call_successful,
            custom_analysis_data: call.call_analysis.custom_analysis_data || {},
          };
        }

        if (call.call_cost) {
          callData.call_cost = {
            product_costs: call.call_cost.product_costs || [],
            total_duration_seconds: call.call_cost.total_duration_seconds,
            total_duration_unit_price: call.call_cost.total_duration_unit_price,
            combined_cost: call.call_cost.combined_cost,
          };
        }

        if (call.llm_token_usage) {
          callData.llm_token_usage = {
            values: call.llm_token_usage.values || [],
            average: call.llm_token_usage.average,
            num_requests: call.llm_token_usage.num_requests,
          };
        }

        if (call.latency) {
          callData.latency = {
            e2e: call.latency.e2e,
            llm: call.latency.llm,
            llm_websocket_network_rtt: call.latency.llm_websocket_network_rtt,
            tts: call.latency.tts,
            knowledge_base: call.latency.knowledge_base,
            s2s: call.latency.s2s,
          };
        }

        return {
          epochMilliSeconds: call.start_timestamp || Date.now(),
          data: callData,
        };
      });

      return enrichedCalls;
    } catch (error) {
      console.error('Failed to fetch calls:', error);
      return [];
    }
  },
};

export const newCall = createTrigger({
  auth: retellAiAuth,
  name: 'new_call',
  displayName: 'New Call',
  description: 'Fires when a new outgoing or incoming call is created in Retell AI. Provides comprehensive call status and metadata.',
  type: TriggerStrategy.POLLING,
  props: {
    limit: Property.Number({
      displayName: 'Polling Limit',
      description: 'Maximum number of calls to retrieve per poll (1-100)',
      required: false,
      defaultValue: 25,
    }),
    call_status_filter: Property.StaticDropdown({
      displayName: 'Call Status Filter',
      description: 'Filter calls by specific status (optional)',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'All Statuses', value: 'all' },
          { label: 'Registered', value: 'registered' },
          { label: 'In Progress', value: 'in_progress' },
          { label: 'Completed', value: 'completed' },
          { label: 'Failed', value: 'failed' },
          { label: 'Busy', value: 'busy' },
          { label: 'No Answer', value: 'no_answer' },
          { label: 'Voicemail', value: 'voicemail' },
        ],
      },
      defaultValue: 'all',
    }),
    call_direction_filter: Property.StaticDropdown({
      displayName: 'Call Direction Filter',
      description: 'Filter calls by direction (optional)',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'All Directions', value: 'all' },
          { label: 'Inbound', value: 'inbound' },
          { label: 'Outbound', value: 'outbound' },
        ],
      },
      defaultValue: 'all',
    }),
    include_transcript: Property.Checkbox({
      displayName: 'Include Transcript',
      description: 'Include call transcript in the trigger data (may increase response time)',
      required: false,
      defaultValue: false,
    }),
    include_analysis: Property.Checkbox({
      displayName: 'Include Call Analysis',
      description: 'Include call analysis data like sentiment and summary (may increase response time)',
      required: false,
      defaultValue: false,
    }),
  },
  sampleData: {
    call_id: 'Jabr9TXYYJHfvl6Syypi88rdAHYHmcq6',
    call_type: 'phone_call',
    from_number: '+12137771234',
    to_number: '+12137771235',
    direction: 'outbound',
    agent_id: 'oBeDLoLOeuAbiuaMFXRtDOLriTJ5tSxD',
    agent_version: 1,
    call_status: 'completed',
    start_timestamp: 1703302407333,
    end_timestamp: 1703302428855,
    duration_ms: 21522,
    metadata: { campaign: 'follow_up', customer_id: '12345' },
    retell_llm_dynamic_variables: { customer_name: 'John Doe' },
    collected_dynamic_variables: { appointment_date: '2024-01-15' },
    disconnection_reason: 'agent_hangup',
    call_analysis: {
      call_summary: 'Agent successfully scheduled follow-up appointment',
      in_voicemail: false,
      user_sentiment: 'Positive',
      call_successful: true,
    },
    call_cost: {
      combined_cost: 70,
      total_duration_seconds: 22,
    },
    message: 'Call data retrieved successfully',
  },
  async test(context) {
    return await pollingHelper.test(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },
  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});
