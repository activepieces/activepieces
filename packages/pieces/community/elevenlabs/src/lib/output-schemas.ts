import { OutputSchema } from '@activepieces/pieces-framework';

export const elevenlabsCreateAgentOutputSchema: OutputSchema = {
  fields: [
    { key: 'agent_id', label: 'Agent ID' },
    { key: 'main_branch_id', label: 'Main Branch ID' },
    { key: 'initial_version_id', label: 'Initial Version ID' },
  ],
};

export const elevenlabsGetAgentOutputSchema: OutputSchema = {
  fields: [
    { key: 'agent_id', label: 'Agent ID' },
    { key: 'name', label: 'Name' },
    {
      key: 'conversation_config',
      label: 'Conversation Config',
      children: [
        {
          key: 'asr',
          label: 'Asr',
          children: [
            { key: 'quality', label: 'Quality' },
            { key: 'provider', label: 'Provider' },
            { key: 'user_input_audio_format', label: 'User Input Audio Format' },
            { key: 'keywords', label: 'Keywords' },
          ],
        },
        {
          key: 'turn',
          label: 'Turn',
          children: [
            { key: 'turn_timeout', label: 'Turn Timeout', format: 'number' },
            { key: 'initial_wait_time', label: 'Initial Wait Time' },
            { key: 'silence_end_call_timeout', label: 'Silence End Call Timeout', format: 'number' },
            { key: 'mode', label: 'Mode' },
            { key: 'turn_eagerness', label: 'Turn Eagerness' },
            { key: 'spelling_patience', label: 'Spelling Patience' },
            { key: 'speculative_turn', label: 'Speculative Turn', format: 'boolean' },
            { key: 'retranscribe_on_turn_timeout', label: 'Retranscribe On Turn Timeout', format: 'boolean' },
            { key: 'turn_model', label: 'Turn Model' },
            { key: 'interruption_ignore_terms', label: 'Interruption Ignore Terms' },
            { key: 'interruption_ignore_term_languages', label: 'Interruption Ignore Term Languages' },
            {
              key: 'merge_with_default_ignore_terms',
              label: 'Merge With Default Ignore Terms',
              format: 'boolean',
            },
            {
              key: 'transcribe_on_disabled_interruptions',
              label: 'Transcribe On Disabled Interruptions',
              format: 'boolean',
            },
            {
              key: 'soft_timeout_config',
              label: 'Soft Timeout Config',
              children: [
                { key: 'timeout_seconds', label: 'Timeout Seconds', format: 'number' },
                { key: 'message', label: 'Message' },
                { key: 'additional_soft_timeout_messages', label: 'Additional Soft Timeout Messages' },
                { key: 'use_llm_generated_message', label: 'Use Llm Generated Message', format: 'boolean' },
                { key: 'randomize_fillers', label: 'Randomize Fillers', format: 'boolean' },
                {
                  key: 'max_soft_timeouts_per_generation',
                  label: 'Max Soft Timeouts Per Generation',
                  format: 'number',
                },
                {
                  key: 'llm_generated_message_prompt_override',
                  label: 'Llm Generated Message Prompt Override',
                },
                {
                  key: 'disable_until_first_user_message',
                  label: 'Disable Until First User Message',
                  format: 'boolean',
                },
              ],
            },
          ],
        },
        {
          key: 'tts',
          label: 'Tts',
          children: [
            { key: 'model_id', label: 'Model ID' },
            { key: 'voice_id', label: 'Voice ID' },
            { key: 'supported_voices', label: 'Supported Voices' },
            { key: 'expressive_mode', label: 'Expressive Mode', format: 'boolean' },
            { key: 'suggested_audio_tags', label: 'Suggested Audio Tags' },
            { key: 'agent_output_audio_format', label: 'Agent Output Audio Format' },
            { key: 'optimize_streaming_latency', label: 'Optimize Streaming Latency', format: 'number' },
            { key: 'stability', label: 'Stability', format: 'number' },
            { key: 'speed', label: 'Speed', format: 'number' },
            { key: 'similarity_boost', label: 'Similarity Boost', format: 'number' },
            { key: 'text_normalisation_type', label: 'Text Normalisation Type' },
            { key: 'pronunciation_dictionary_locators', label: 'Pronunciation Dictionary Locators' },
            { key: 'enable_phoneme_tags', label: 'Enable Phoneme Tags', format: 'boolean' },
            { key: 'audio_effects', label: 'Audio Effects' },
          ],
        },
        {
          key: 'conversation',
          label: 'Conversation',
          children: [
            { key: 'text_only', label: 'Text Only', format: 'boolean' },
            { key: 'max_duration_seconds', label: 'Max Duration Seconds', format: 'number' },
            {
              key: 'max_duration_seconds_after_last_agent_message',
              label: 'Max Duration Seconds After Last Agent Message',
            },
            { key: 'client_events', label: 'Client Events' },
            {
              key: 'file_input',
              label: 'File Input',
              children: [
                { key: 'enabled', label: 'Enabled', format: 'boolean' },
                { key: 'max_files_in_memory', label: 'Max Files In Memory', format: 'number' },
                { key: 'max_files_per_conversation', label: 'Max Files Per Conversation', format: 'number' },
              ],
            },
            { key: 'monitoring_enabled', label: 'Monitoring Enabled', format: 'boolean' },
            { key: 'monitoring_events', label: 'Monitoring Events' },
            { key: 'dtmf_input_settings', label: 'Dtmf Input Settings' },
            {
              key: 'background_sound',
              label: 'Background Sound',
              children: [
                { key: 'source_type', label: 'Source Type' },
                { key: 'source_id', label: 'Source ID' },
                { key: 'volume', label: 'Volume', format: 'number' },
                { key: 'crossfade_loop', label: 'Crossfade Loop', format: 'boolean' },
              ],
            },
            {
              key: 'compaction',
              label: 'Compaction',
              children: [
                { key: 'enabled', label: 'Enabled' },
                { key: 'soft_trigger_fraction', label: 'Soft Trigger Fraction' },
                { key: 'tail_size', label: 'Tail Size' },
                { key: 'min_reclaimable_tokens', label: 'Min Reclaimable Tokens' },
              ],
            },
            { key: 'source_attribution', label: 'Source Attribution', format: 'boolean' },
          ],
        },
        { key: 'language_presets', label: 'Language Presets' },
        {
          key: 'vad',
          label: 'Vad',
          children: [
            { key: 'background_voice_detection', label: 'Background Voice Detection', format: 'boolean' },
          ],
        },
        { key: 'realtime_model', label: 'Realtime Model' },
        {
          key: 'agent',
          label: 'Agent',
          children: [
            { key: 'first_message', label: 'First Message' },
            { key: 'language', label: 'Language' },
            { key: 'hinglish_mode', label: 'Hinglish Mode', format: 'boolean' },
            {
              key: 'dynamic_variables',
              label: 'Dynamic Variables',
              children: [
                { key: 'dynamic_variable_placeholders', label: 'Dynamic Variable Placeholders' },
              ],
            },
            {
              key: 'disable_first_message_interruptions',
              label: 'Disable First Message Interruptions',
              format: 'boolean',
            },
            { key: 'max_conversation_duration_message', label: 'Max Conversation Duration Message' },
            { key: 'text_behavior_overrides', label: 'Text Behavior Overrides' },
            { key: 'subagents', label: 'Subagents' },
            {
              key: 'prompt',
              label: 'Prompt',
              children: [
                { key: 'prompt', label: 'Prompt' },
                { key: 'llm', label: 'Llm' },
                { key: 'reasoning_effort', label: 'Reasoning Effort' },
                { key: 'service_tier', label: 'Service Tier' },
                { key: 'opener', label: 'Opener' },
                { key: 'thinking_budget', label: 'Thinking Budget' },
                { key: 'enable_reasoning_summary', label: 'Enable Reasoning Summary', format: 'boolean' },
                { key: 'temperature', label: 'Temperature', format: 'number' },
                { key: 'max_tokens', label: 'Max Tokens', format: 'number' },
                { key: 'tool_ids', label: 'Tool IDs' },
                {
                  key: 'built_in_tools',
                  label: 'Built In Tools',
                  children: [
                    { key: 'transfer_to_agent', label: 'Transfer To Agent' },
                    { key: 'update_state', label: 'Update State' },
                    { key: 'memory_entry_search', label: 'Memory Entry Search' },
                    { key: 'run_subagent', label: 'Run Subagent' },
                    { key: 'flag_issue_for_review', label: 'Flag Issue For Review' },
                    { key: 'end_call', label: 'End Call' },
                    { key: 'language_detection', label: 'Language Detection' },
                    { key: 'transfer_to_number', label: 'Transfer To Number' },
                    { key: 'skip_turn', label: 'Skip Turn' },
                    { key: 'play_keypad_touch_tone', label: 'Play Keypad Touch Tone' },
                    { key: 'voicemail_detection', label: 'Voicemail Detection' },
                    { key: 'transfer_to_genesys', label: 'Transfer To Genesys' },
                    { key: 'transfer_to_genesys_chat', label: 'Transfer To Genesys Chat' },
                    { key: 'transfer_to_genesys_bot', label: 'Transfer To Genesys Bot' },
                  ],
                },
                { key: 'enable_parallel_tool_calls', label: 'Enable Parallel Tool Calls', format: 'boolean' },
                { key: 'mcp_server_ids', label: 'Mcp Server IDs' },
                { key: 'native_mcp_server_ids', label: 'Native Mcp Server IDs' },
                { key: 'knowledge_base', label: 'Knowledge Base' },
                { key: 'custom_llm', label: 'Custom Llm' },
                { key: 'bedrock_llm', label: 'Bedrock Llm' },
                { key: 'speech_engine', label: 'Speech Engine' },
                { key: 'ignore_default_personality', label: 'Ignore Default Personality', format: 'boolean' },
                {
                  key: 'rag',
                  label: 'Rag',
                  children: [
                    { key: 'enabled', label: 'Enabled', format: 'boolean' },
                    { key: 'embedding_model', label: 'Embedding Model' },
                    { key: 'optional_rag_enabled', label: 'Optional Rag Enabled', format: 'boolean' },
                    { key: 'max_vector_distance', label: 'Max Vector Distance', format: 'number' },
                    { key: 'max_documents_length', label: 'Max Documents Length', format: 'number' },
                    {
                      key: 'max_retrieved_rag_chunks_count',
                      label: 'Max Retrieved Rag Chunks Count',
                      format: 'number',
                    },
                    { key: 'num_candidates', label: 'Num Candidates' },
                    { key: 'query_rewrite_prompt_override', label: 'Query Rewrite Prompt Override' },
                    { key: 'knowledge_base_tool_info', label: 'Knowledge Base Tool Info' },
                    { key: 'include_source_urls', label: 'Include Source Urls', format: 'boolean' },
                  ],
                },
                { key: 'timezone', label: 'Timezone' },
                {
                  key: 'backup_llm_config',
                  label: 'Backup Llm Config',
                  children: [
                    { key: 'preference', label: 'Preference' },
                  ],
                },
                { key: 'cascade_timeout_seconds', label: 'Cascade Timeout Seconds', format: 'number' },
                { key: 'tools', label: 'Tools' },
              ],
            },
          ],
        },
      ],
    },
    {
      key: 'metadata',
      label: 'Metadata',
      children: [
        { key: 'created_at_unix_secs', label: 'Created At Unix Secs', format: 'number' },
        { key: 'updated_at_unix_secs', label: 'Updated At Unix Secs', format: 'number' },
      ],
    },
    {
      key: 'platform_settings',
      label: 'Platform Settings',
      children: [
        {
          key: 'evaluation',
          label: 'Evaluation',
          children: [
            { key: 'criteria', label: 'Criteria' },
          ],
        },
        {
          key: 'widget',
          label: 'Widget',
          children: [
            { key: 'variant', label: 'Variant' },
            { key: 'placement', label: 'Placement' },
            { key: 'expandable', label: 'Expandable' },
            {
              key: 'avatar',
              label: 'Avatar',
              children: [
                { key: 'type', label: 'Type' },
                { key: 'color_1', label: 'Color 1' },
                { key: 'color_2', label: 'Color 2' },
              ],
            },
            { key: 'feedback_mode', label: 'Feedback Mode' },
            {
              key: 'end_feedback',
              label: 'End Feedback',
              children: [
                { key: 'type', label: 'Type' },
              ],
            },
            { key: 'bg_color', label: 'Bg Color' },
            { key: 'text_color', label: 'Text Color' },
            { key: 'btn_color', label: 'Btn Color' },
            { key: 'btn_text_color', label: 'Btn Text Color' },
            { key: 'border_color', label: 'Border Color' },
            { key: 'focus_color', label: 'Focus Color' },
            { key: 'border_radius', label: 'Border Radius' },
            { key: 'btn_radius', label: 'Btn Radius' },
            { key: 'action_text', label: 'Action Text' },
            { key: 'start_call_text', label: 'Start Call Text' },
            { key: 'end_call_text', label: 'End Call Text' },
            { key: 'expand_text', label: 'Expand Text' },
            { key: 'listening_text', label: 'Listening Text' },
            { key: 'speaking_text', label: 'Speaking Text' },
            { key: 'shareable_page_text', label: 'Shareable Page Text' },
            { key: 'shareable_page_show_terms', label: 'Shareable Page Show Terms', format: 'boolean' },
            { key: 'terms_text', label: 'Terms Text' },
            { key: 'terms_html', label: 'Terms HTML' },
            { key: 'terms_key', label: 'Terms Key' },
            { key: 'show_avatar_when_collapsed', label: 'Show Avatar When Collapsed', format: 'boolean' },
            { key: 'disable_banner', label: 'Disable Banner', format: 'boolean' },
            { key: 'override_link', label: 'Override Link' },
            { key: 'markdown_link_allowed_hosts', label: 'Markdown Link Allowed Hosts' },
            { key: 'markdown_link_include_www', label: 'Markdown Link Include Www', format: 'boolean' },
            { key: 'markdown_link_allow_http', label: 'Markdown Link Allow Http', format: 'boolean' },
            { key: 'mic_muting_enabled', label: 'Mic Muting Enabled', format: 'boolean' },
            { key: 'transcript_enabled', label: 'Transcript Enabled', format: 'boolean' },
            { key: 'text_input_enabled', label: 'Text Input Enabled', format: 'boolean' },
            {
              key: 'conversation_mode_toggle_enabled',
              label: 'Conversation Mode Toggle Enabled',
              format: 'boolean',
            },
            { key: 'default_expanded', label: 'Default Expanded', format: 'boolean' },
            { key: 'always_expanded', label: 'Always Expanded', format: 'boolean' },
            { key: 'dismissible', label: 'Dismissible', format: 'boolean' },
            { key: 'show_agent_status', label: 'Show Agent Status', format: 'boolean' },
            { key: 'show_conversation_id', label: 'Show Conversation ID', format: 'boolean' },
            { key: 'strip_audio_tags', label: 'Strip Audio Tags', format: 'boolean' },
            { key: 'syntax_highlight_theme', label: 'Syntax Highlight Theme' },
            {
              key: 'text_contents',
              label: 'Text Contents',
              children: [
                { key: 'main_label', label: 'Main Label' },
                { key: 'start_call', label: 'Start Call' },
                { key: 'start_chat', label: 'Start Chat' },
                { key: 'new_call', label: 'New Call' },
                { key: 'end_call', label: 'End Call' },
                { key: 'mute_microphone', label: 'Mute Microphone' },
                { key: 'change_language', label: 'Change Language' },
                { key: 'collapse', label: 'Collapse' },
                { key: 'expand', label: 'Expand' },
                { key: 'copied', label: 'Copied' },
                { key: 'accept_terms', label: 'Accept Terms' },
                { key: 'dismiss_terms', label: 'Dismiss Terms' },
                { key: 'listening_status', label: 'Listening Status' },
                { key: 'speaking_status', label: 'Speaking Status' },
                { key: 'connecting_status', label: 'Connecting Status' },
                { key: 'chatting_status', label: 'Chatting Status' },
                { key: 'queue_waiting_status', label: 'Queue Waiting Status' },
                { key: 'queue_waiting_status_short', label: 'Queue Waiting Status Short' },
                { key: 'input_label', label: 'Input Label' },
                { key: 'input_placeholder', label: 'Input Placeholder' },
                { key: 'input_placeholder_text_only', label: 'Input Placeholder Text Only' },
                { key: 'input_placeholder_new_conversation', label: 'Input Placeholder New Conversation' },
                { key: 'user_ended_conversation', label: 'User Ended Conversation' },
                { key: 'agent_ended_conversation', label: 'Agent Ended Conversation' },
                { key: 'conversation_id', label: 'Conversation ID' },
                { key: 'error_occurred', label: 'Error Occurred' },
                { key: 'queue_timed_out', label: 'Queue Timed Out' },
                { key: 'copy_id', label: 'Copy ID' },
                { key: 'initiate_feedback', label: 'Initiate Feedback' },
                { key: 'request_follow_up_feedback', label: 'Request Follow Up Feedback' },
                { key: 'thanks_for_feedback', label: 'Thanks For Feedback' },
                { key: 'thanks_for_feedback_details', label: 'Thanks For Feedback Details' },
                { key: 'follow_up_feedback_placeholder', label: 'Follow Up Feedback Placeholder' },
                { key: 'submit', label: 'Submit' },
                { key: 'go_back', label: 'Go Back' },
                { key: 'send_message', label: 'Send Message' },
                { key: 'text_mode', label: 'Text Mode' },
                { key: 'voice_mode', label: 'Voice Mode' },
                { key: 'switched_to_text_mode', label: 'Switched To Text Mode' },
                { key: 'switched_to_voice_mode', label: 'Switched To Voice Mode' },
                { key: 'copy', label: 'Copy' },
                { key: 'download', label: 'Download' },
                { key: 'wrap', label: 'Wrap' },
                { key: 'agent_working', label: 'Agent Working' },
                { key: 'agent_done', label: 'Agent Done' },
                { key: 'agent_error', label: 'Agent Error' },
                { key: 'attach_file', label: 'Attach File' },
                { key: 'remove_file', label: 'Remove File' },
                { key: 'file_upload_error', label: 'File Upload Error' },
                { key: 'file_type_unsupported', label: 'File Type Unsupported' },
                { key: 'file_too_large', label: 'File Too Large' },
                { key: 'file_limit_reached', label: 'File Limit Reached' },
                { key: 'typing_indicator', label: 'Typing Indicator' },
                { key: 'rich_content_unavailable', label: 'Rich Content Unavailable' },
              ],
            },
            {
              key: 'styles',
              label: 'Styles',
              children: [
                { key: 'base', label: 'Base' },
                { key: 'base_hover', label: 'Base Hover' },
                { key: 'base_active', label: 'Base Active' },
                { key: 'base_border', label: 'Base Border' },
                { key: 'base_subtle', label: 'Base Subtle' },
                { key: 'base_primary', label: 'Base Primary' },
                { key: 'base_error', label: 'Base Error' },
                { key: 'accent', label: 'Accent' },
                { key: 'accent_hover', label: 'Accent Hover' },
                { key: 'accent_active', label: 'Accent Active' },
                { key: 'accent_border', label: 'Accent Border' },
                { key: 'accent_subtle', label: 'Accent Subtle' },
                { key: 'accent_primary', label: 'Accent Primary' },
                { key: 'overlay_padding', label: 'Overlay Padding' },
                { key: 'button_radius', label: 'Button Radius' },
                { key: 'input_radius', label: 'Input Radius' },
                { key: 'bubble_radius', label: 'Bubble Radius' },
                { key: 'sheet_radius', label: 'Sheet Radius' },
                { key: 'compact_sheet_radius', label: 'Compact Sheet Radius' },
                { key: 'dropdown_sheet_radius', label: 'Dropdown Sheet Radius' },
              ],
            },
            { key: 'show_resize_button', label: 'Show Resize Button', format: 'boolean' },
            { key: 'language_selector', label: 'Language Selector', format: 'boolean' },
            { key: 'supports_text_only', label: 'Supports Text Only', format: 'boolean' },
            { key: 'custom_avatar_path', label: 'Custom Avatar Path' },
            { key: 'language_presets', label: 'Language Presets' },
            { key: 'first_message_quick_replies', label: 'First Message Quick Replies' },
          ],
        },
        { key: 'data_collection', label: 'Data Collection' },
        { key: 'data_collection_scopes', label: 'Data Collection Scopes' },
        {
          key: 'analysis_items',
          label: 'Analysis Items',
          children: [
            { key: 'evaluation_criteria', label: 'Evaluation Criteria' },
            { key: 'data_collection', label: 'Data Collection' },
          ],
        },
        {
          key: 'overrides',
          label: 'Overrides',
          children: [
            {
              key: 'conversation_config_override',
              label: 'Conversation Config Override',
              children: [
                {
                  key: 'asr',
                  label: 'Asr',
                  children: [
                    { key: 'keywords', label: 'Keywords', format: 'boolean' },
                  ],
                },
                {
                  key: 'turn',
                  label: 'Turn',
                  children: [
                    { key: 'soft_timeout_config', label: 'Soft Timeout Config' },
                  ],
                },
                {
                  key: 'tts',
                  label: 'Tts',
                  children: [
                    { key: 'model_id', label: 'Model ID', format: 'boolean' },
                    { key: 'voice_id', label: 'Voice ID', format: 'boolean' },
                    { key: 'supported_voices', label: 'Supported Voices', format: 'boolean' },
                    { key: 'stability', label: 'Stability', format: 'boolean' },
                    { key: 'speed', label: 'Speed', format: 'boolean' },
                    { key: 'similarity_boost', label: 'Similarity Boost', format: 'boolean' },
                    {
                      key: 'pronunciation_dictionary_locators',
                      label: 'Pronunciation Dictionary Locators',
                      format: 'boolean',
                    },
                  ],
                },
                {
                  key: 'conversation',
                  label: 'Conversation',
                  children: [
                    { key: 'text_only', label: 'Text Only', format: 'boolean' },
                    { key: 'max_duration_seconds', label: 'Max Duration Seconds', format: 'boolean' },
                  ],
                },
                {
                  key: 'agent',
                  label: 'Agent',
                  children: [
                    { key: 'first_message', label: 'First Message', format: 'boolean' },
                    { key: 'language', label: 'Language', format: 'boolean' },
                    {
                      key: 'max_conversation_duration_message',
                      label: 'Max Conversation Duration Message',
                      format: 'boolean',
                    },
                    { key: 'prompt', label: 'Prompt' },
                  ],
                },
              ],
            },
            { key: 'custom_llm_extra_body', label: 'Custom Llm Extra Body', format: 'boolean' },
            {
              key: 'enable_conversation_initiation_client_data_from_webhook',
              label: 'Enable Conversation Initiation Client Data From Webhook',
              format: 'boolean',
            },
            {
              key: 'enable_starting_workflow_node_id_from_client',
              label: 'Enable Starting Workflow Node ID From Client',
              format: 'boolean',
            },
            {
              key: 'enable_procedure_ids_from_client',
              label: 'Enable Procedure IDs From Client',
              format: 'boolean',
            },
          ],
        },
        {
          key: 'workspace_overrides',
          label: 'Workspace Overrides',
          children: [
            {
              key: 'conversation_initiation_client_data_webhook',
              label: 'Conversation Initiation Client Data Webhook',
            },
            {
              key: 'webhooks',
              label: 'Webhooks',
              children: [
                { key: 'post_call_webhook_id', label: 'Post Call Webhook ID' },
                { key: 'events', label: 'Events' },
                { key: 'transcript_format', label: 'Transcript Format' },
                { key: 'send_audio', label: 'Send Audio', format: 'boolean' },
              ],
            },
            {
              key: 'cloud_storage_export',
              label: 'Cloud Storage Export',
              children: [
                { key: 'destination_id', label: 'Destination ID' },
                { key: 'events', label: 'Events' },
                { key: 'transcript_format', label: 'Transcript Format' },
              ],
            },
          ],
        },
        {
          key: 'testing',
          label: 'Testing',
          children: [
            { key: 'attached_tests', label: 'Attached Tests' },
            { key: 'referenced_tests_ids', label: 'Referenced Tests IDs' },
          ],
        },
        { key: 'archived', label: 'Archived', format: 'boolean' },
        {
          key: 'guardrails',
          label: 'Guardrails',
          children: [
            { key: 'version', label: 'Version' },
            {
              key: 'focus',
              label: 'Focus',
              children: [
                { key: 'is_enabled', label: 'Is Enabled', format: 'boolean' },
              ],
            },
            {
              key: 'prompt_injection',
              label: 'Prompt Injection',
              children: [
                { key: 'is_enabled', label: 'Is Enabled', format: 'boolean' },
              ],
            },
            {
              key: 'synthetic_voice',
              label: 'Synthetic Voice',
              children: [
                { key: 'is_enabled', label: 'Is Enabled', format: 'boolean' },
                {
                  key: 'trigger_action',
                  label: 'Trigger Action',
                  children: [
                    { key: 'type', label: 'Type' },
                  ],
                },
              ],
            },
            {
              key: 'content',
              label: 'Content',
              children: [
                { key: 'execution_mode', label: 'Execution Mode' },
                {
                  key: 'trigger_action',
                  label: 'Trigger Action',
                  children: [
                    { key: 'type', label: 'Type' },
                  ],
                },
              ],
            },
            { key: 'moderation', label: 'Moderation' },
            { key: 'custom', label: 'Custom' },
          ],
        },
        { key: 'summary_language', label: 'Summary Language' },
        {
          key: 'auto_translate_transcript_to_app_language',
          label: 'Auto Translate Transcript To App Language',
        },
        {
          key: 'auth',
          label: 'Auth',
          children: [
            { key: 'enable_auth', label: 'Enable Auth', format: 'boolean' },
            { key: 'allowlist', label: 'Allowlist' },
            { key: 'require_origin_header', label: 'Require Origin Header', format: 'boolean' },
            { key: 'shareable_token', label: 'Shareable Token' },
          ],
        },
        {
          key: 'call_limits',
          label: 'Call Limits',
          children: [
            { key: 'agent_concurrency_limit', label: 'Agent Concurrency Limit', format: 'number' },
            { key: 'daily_limit', label: 'Daily Limit', format: 'number' },
            { key: 'bursting_enabled', label: 'Bursting Enabled', format: 'boolean' },
          ],
        },
        {
          key: 'queueing_config',
          label: 'Queueing Config',
          children: [
            { key: 'enabled', label: 'Enabled', format: 'boolean' },
            { key: 'wait_timeout_seconds', label: 'Wait Timeout Seconds', format: 'number' },
            { key: 'hold_audio', label: 'Hold Audio' },
          ],
        },
        { key: 'ban', label: 'Ban' },
        { key: 'smb_metadata', label: 'Smb Metadata' },
        {
          key: 'privacy',
          label: 'Privacy',
          children: [
            { key: 'record_voice', label: 'Record Voice', format: 'boolean' },
            { key: 'retention_days', label: 'Retention Days', format: 'number' },
            { key: 'delete_transcript_and_pii', label: 'Delete Transcript And Pii', format: 'boolean' },
            { key: 'delete_audio', label: 'Delete Audio', format: 'boolean' },
            {
              key: 'apply_to_existing_conversations',
              label: 'Apply To Existing Conversations',
              format: 'boolean',
            },
            { key: 'zero_retention_mode', label: 'Zero Retention Mode', format: 'boolean' },
            { key: 'nested_history_redaction', label: 'Nested History Redaction', format: 'boolean' },
            {
              key: 'conversation_history_redaction',
              label: 'Conversation History Redaction',
              children: [
                { key: 'enabled', label: 'Enabled', format: 'boolean' },
                { key: 'entities', label: 'Entities' },
              ],
            },
            {
              key: 'user_memory',
              label: 'User Memory',
              children: [
                { key: 'enabled', label: 'Enabled', format: 'boolean' },
                { key: 'scale', label: 'Scale' },
              ],
            },
          ],
        },
        { key: 'trust_context', label: 'Trust Context' },
        { key: 'analysis_llm', label: 'Analysis Llm' },
        { key: 'analysis_bedrock_llm', label: 'Analysis Bedrock Llm' },
        { key: 'analysis_llm_billed', label: 'Analysis Llm Billed', format: 'boolean' },
        {
          key: 'topic_discovery',
          label: 'Topic Discovery',
          children: [
            { key: 'enabled', label: 'Enabled', format: 'boolean' },
          ],
        },
        {
          key: 'sentiment_analysis',
          label: 'Sentiment Analysis',
          children: [
            { key: 'enabled', label: 'Enabled', format: 'boolean' },
          ],
        },
        {
          key: 'simulation_library',
          label: 'Simulation Library',
          children: [
            { key: 'enabled', label: 'Enabled', format: 'boolean' },
            { key: 'test_ids', label: 'Test IDs' },
          ],
        },
        { key: 'alerting', label: 'Alerting' },
        { key: 'overview_dashboard_template_id', label: 'Overview Dashboard Template ID' },
        {
          key: 'safety',
          label: 'Safety',
          children: [
            { key: 'is_blocked_ivc', label: 'Is Blocked Ivc', format: 'boolean' },
            { key: 'is_blocked_non_ivc', label: 'Is Blocked Non Ivc', format: 'boolean' },
            { key: 'ignore_safety_evaluation', label: 'Ignore Safety Evaluation', format: 'boolean' },
          ],
        },
      ],
    },
    { key: 'phone_numbers', label: 'Phone Numbers' },
    { key: 'whatsapp_accounts', label: 'Whatsapp Accounts' },
    {
      key: 'workflow',
      label: 'Workflow',
      children: [
        { key: 'edges', label: 'Edges' },
        {
          key: 'nodes',
          label: 'Nodes',
          children: [
            {
              key: 'start_node',
              label: 'Start Node',
              children: [
                { key: 'type', label: 'Type' },
                {
                  key: 'position',
                  label: 'Position',
                  children: [
                    { key: 'x', label: 'X', format: 'number' },
                    { key: 'y', label: 'Y', format: 'number' },
                  ],
                },
                { key: 'edge_order', label: 'Edge Order' },
                { key: 'parent_subgraph_id', label: 'Parent Subgraph ID' },
              ],
            },
          ],
        },
        { key: 'subgraphs', label: 'Subgraphs' },
        { key: 'prevent_subagent_loops', label: 'Prevent Subagent Loops', format: 'boolean' },
      ],
    },
    {
      key: 'access_info',
      label: 'Access Info',
      children: [
        { key: 'is_creator', label: 'Is Creator', format: 'boolean' },
        { key: 'creator_name', label: 'Creator Name' },
        { key: 'creator_email', label: 'Creator Email', format: 'email' },
        { key: 'role', label: 'Role' },
        { key: 'anonymous_access_level_override', label: 'Anonymous Access Level Override' },
        { key: 'access_source', label: 'Access Source' },
      ],
    },
    { key: 'access_permissions', label: 'Access Permissions' },
    { key: 'tags', label: 'Tags' },
    { key: 'version_id', label: 'Version ID' },
    { key: 'branch_id', label: 'Branch ID' },
    { key: 'main_branch_id', label: 'Main Branch ID' },
    { key: 'procedures', label: 'Procedures' },
    { key: 'trust_context', label: 'Trust Context' },
    { key: 'default_hold_audio_url', label: 'Default Hold Audio URL', format: 'url' },
  ],
};

export const elevenlabsGetAgentKnowledgeBaseSizeOutputSchema: OutputSchema = {
  fields: [
    { key: 'number_of_pages', label: 'Number Of Pages', format: 'number' },
  ],
};

export const elevenlabsGetAgentLinkOutputSchema: OutputSchema = {
  fields: [
    { key: 'agent_id', label: 'Agent ID' },
    { key: 'token', label: 'Token' },
  ],
};

export const elevenlabsListAgentsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'agents',
      label: 'Agents',
      labelKey: 'name',
      listItems: [
        { key: 'agent_id', label: 'Agent ID' },
        { key: 'name', label: 'Name' },
        { key: 'voice_id', label: 'Voice ID' },
        { key: 'tags', label: 'Tags' },
        { key: 'created_at_unix_secs', label: 'Created At Unix Secs', format: 'number' },
        {
          key: 'access_info',
          label: 'Access Info',
          children: [
            { key: 'is_creator', label: 'Is Creator', format: 'boolean' },
            { key: 'creator_name', label: 'Creator Name' },
            { key: 'creator_email', label: 'Creator Email', format: 'email' },
            { key: 'role', label: 'Role' },
            { key: 'anonymous_access_level_override', label: 'Anonymous Access Level Override' },
            { key: 'access_source', label: 'Access Source' },
          ],
        },
        { key: 'last_call_time_unix_secs', label: 'Last Call Time Unix Secs' },
        { key: 'archived', label: 'Archived', format: 'boolean' },
        { key: 'last_7_day_call_count', label: 'Last 7 Day Call Count', format: 'number' },
        { key: 'trust_context', label: 'Trust Context' },
      ],
    },
    { key: 'next_cursor', label: 'Next Cursor' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const elevenlabsCalculateAgentLlmUsageOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'llm_prices',
      label: 'Llm Prices',
      listItems: [
        { key: 'llm', label: 'Llm' },
        { key: 'price_per_minute', label: 'Price Per Minute', format: 'number' },
        { key: 'price_per_message', label: 'Price Per Message', format: 'number' },
      ],
    },
  ],
};

export const elevenlabsGetAgentWidgetOutputSchema: OutputSchema = {
  fields: [
    { key: 'agent_id', label: 'Agent ID' },
    {
      key: 'widget_config',
      label: 'Widget Config',
      children: [
        { key: 'variant', label: 'Variant' },
        { key: 'placement', label: 'Placement' },
        { key: 'expandable', label: 'Expandable' },
        {
          key: 'avatar',
          label: 'Avatar',
          children: [
            { key: 'type', label: 'Type' },
            { key: 'color_1', label: 'Color 1' },
            { key: 'color_2', label: 'Color 2' },
          ],
        },
        { key: 'feedback_mode', label: 'Feedback Mode' },
        {
          key: 'end_feedback',
          label: 'End Feedback',
          children: [
            { key: 'type', label: 'Type' },
          ],
        },
        { key: 'bg_color', label: 'Bg Color' },
        { key: 'text_color', label: 'Text Color' },
        { key: 'btn_color', label: 'Btn Color' },
        { key: 'btn_text_color', label: 'Btn Text Color' },
        { key: 'border_color', label: 'Border Color' },
        { key: 'focus_color', label: 'Focus Color' },
        { key: 'border_radius', label: 'Border Radius' },
        { key: 'btn_radius', label: 'Btn Radius' },
        { key: 'action_text', label: 'Action Text' },
        { key: 'start_call_text', label: 'Start Call Text' },
        { key: 'end_call_text', label: 'End Call Text' },
        { key: 'expand_text', label: 'Expand Text' },
        { key: 'listening_text', label: 'Listening Text' },
        { key: 'speaking_text', label: 'Speaking Text' },
        { key: 'shareable_page_text', label: 'Shareable Page Text' },
        { key: 'shareable_page_show_terms', label: 'Shareable Page Show Terms', format: 'boolean' },
        { key: 'terms_text', label: 'Terms Text' },
        { key: 'terms_html', label: 'Terms HTML' },
        { key: 'terms_key', label: 'Terms Key' },
        { key: 'show_avatar_when_collapsed', label: 'Show Avatar When Collapsed', format: 'boolean' },
        { key: 'disable_banner', label: 'Disable Banner', format: 'boolean' },
        { key: 'override_link', label: 'Override Link' },
        { key: 'markdown_link_allowed_hosts', label: 'Markdown Link Allowed Hosts' },
        { key: 'markdown_link_include_www', label: 'Markdown Link Include Www', format: 'boolean' },
        { key: 'markdown_link_allow_http', label: 'Markdown Link Allow Http', format: 'boolean' },
        { key: 'mic_muting_enabled', label: 'Mic Muting Enabled', format: 'boolean' },
        { key: 'transcript_enabled', label: 'Transcript Enabled', format: 'boolean' },
        { key: 'text_input_enabled', label: 'Text Input Enabled', format: 'boolean' },
        {
          key: 'conversation_mode_toggle_enabled',
          label: 'Conversation Mode Toggle Enabled',
          format: 'boolean',
        },
        { key: 'default_expanded', label: 'Default Expanded', format: 'boolean' },
        { key: 'always_expanded', label: 'Always Expanded', format: 'boolean' },
        { key: 'dismissible', label: 'Dismissible', format: 'boolean' },
        { key: 'show_agent_status', label: 'Show Agent Status', format: 'boolean' },
        { key: 'show_conversation_id', label: 'Show Conversation ID', format: 'boolean' },
        { key: 'strip_audio_tags', label: 'Strip Audio Tags', format: 'boolean' },
        { key: 'syntax_highlight_theme', label: 'Syntax Highlight Theme' },
        {
          key: 'text_contents',
          label: 'Text Contents',
          children: [
            { key: 'main_label', label: 'Main Label' },
            { key: 'start_call', label: 'Start Call' },
            { key: 'start_chat', label: 'Start Chat' },
            { key: 'new_call', label: 'New Call' },
            { key: 'end_call', label: 'End Call' },
            { key: 'mute_microphone', label: 'Mute Microphone' },
            { key: 'change_language', label: 'Change Language' },
            { key: 'collapse', label: 'Collapse' },
            { key: 'expand', label: 'Expand' },
            { key: 'copied', label: 'Copied' },
            { key: 'accept_terms', label: 'Accept Terms' },
            { key: 'dismiss_terms', label: 'Dismiss Terms' },
            { key: 'listening_status', label: 'Listening Status' },
            { key: 'speaking_status', label: 'Speaking Status' },
            { key: 'connecting_status', label: 'Connecting Status' },
            { key: 'chatting_status', label: 'Chatting Status' },
            { key: 'queue_waiting_status', label: 'Queue Waiting Status' },
            { key: 'queue_waiting_status_short', label: 'Queue Waiting Status Short' },
            { key: 'input_label', label: 'Input Label' },
            { key: 'input_placeholder', label: 'Input Placeholder' },
            { key: 'input_placeholder_text_only', label: 'Input Placeholder Text Only' },
            { key: 'input_placeholder_new_conversation', label: 'Input Placeholder New Conversation' },
            { key: 'user_ended_conversation', label: 'User Ended Conversation' },
            { key: 'agent_ended_conversation', label: 'Agent Ended Conversation' },
            { key: 'conversation_id', label: 'Conversation ID' },
            { key: 'error_occurred', label: 'Error Occurred' },
            { key: 'queue_timed_out', label: 'Queue Timed Out' },
            { key: 'copy_id', label: 'Copy ID' },
            { key: 'initiate_feedback', label: 'Initiate Feedback' },
            { key: 'request_follow_up_feedback', label: 'Request Follow Up Feedback' },
            { key: 'thanks_for_feedback', label: 'Thanks For Feedback' },
            { key: 'thanks_for_feedback_details', label: 'Thanks For Feedback Details' },
            { key: 'follow_up_feedback_placeholder', label: 'Follow Up Feedback Placeholder' },
            { key: 'submit', label: 'Submit' },
            { key: 'go_back', label: 'Go Back' },
            { key: 'send_message', label: 'Send Message' },
            { key: 'text_mode', label: 'Text Mode' },
            { key: 'voice_mode', label: 'Voice Mode' },
            { key: 'switched_to_text_mode', label: 'Switched To Text Mode' },
            { key: 'switched_to_voice_mode', label: 'Switched To Voice Mode' },
            { key: 'copy', label: 'Copy' },
            { key: 'download', label: 'Download' },
            { key: 'wrap', label: 'Wrap' },
            { key: 'agent_working', label: 'Agent Working' },
            { key: 'agent_done', label: 'Agent Done' },
            { key: 'agent_error', label: 'Agent Error' },
            { key: 'attach_file', label: 'Attach File' },
            { key: 'remove_file', label: 'Remove File' },
            { key: 'file_upload_error', label: 'File Upload Error' },
            { key: 'file_type_unsupported', label: 'File Type Unsupported' },
            { key: 'file_too_large', label: 'File Too Large' },
            { key: 'file_limit_reached', label: 'File Limit Reached' },
            { key: 'typing_indicator', label: 'Typing Indicator' },
            { key: 'rich_content_unavailable', label: 'Rich Content Unavailable' },
          ],
        },
        {
          key: 'styles',
          label: 'Styles',
          children: [
            { key: 'base', label: 'Base' },
            { key: 'base_hover', label: 'Base Hover' },
            { key: 'base_active', label: 'Base Active' },
            { key: 'base_border', label: 'Base Border' },
            { key: 'base_subtle', label: 'Base Subtle' },
            { key: 'base_primary', label: 'Base Primary' },
            { key: 'base_error', label: 'Base Error' },
            { key: 'accent', label: 'Accent' },
            { key: 'accent_hover', label: 'Accent Hover' },
            { key: 'accent_active', label: 'Accent Active' },
            { key: 'accent_border', label: 'Accent Border' },
            { key: 'accent_subtle', label: 'Accent Subtle' },
            { key: 'accent_primary', label: 'Accent Primary' },
            { key: 'overlay_padding', label: 'Overlay Padding' },
            { key: 'button_radius', label: 'Button Radius' },
            { key: 'input_radius', label: 'Input Radius' },
            { key: 'bubble_radius', label: 'Bubble Radius' },
            { key: 'sheet_radius', label: 'Sheet Radius' },
            { key: 'compact_sheet_radius', label: 'Compact Sheet Radius' },
            { key: 'dropdown_sheet_radius', label: 'Dropdown Sheet Radius' },
          ],
        },
        { key: 'show_resize_button', label: 'Show Resize Button', format: 'boolean' },
        { key: 'language', label: 'Language' },
        { key: 'supported_language_overrides', label: 'Supported Language Overrides' },
        { key: 'language_presets', label: 'Language Presets' },
        { key: 'text_only', label: 'Text Only', format: 'boolean' },
        { key: 'supports_text_only', label: 'Supports Text Only', format: 'boolean' },
        { key: 'first_message', label: 'First Message' },
        { key: 'use_rtc', label: 'Use Rtc' },
        {
          key: 'file_input_config',
          label: 'File Input Config',
          children: [
            { key: 'enabled', label: 'Enabled', format: 'boolean' },
            { key: 'max_files_in_memory', label: 'Max Files In Memory', format: 'number' },
            { key: 'max_files_per_conversation', label: 'Max Files Per Conversation', format: 'number' },
          ],
        },
        { key: 'first_message_rich_content', label: 'First Message Rich Content' },
      ],
    },
  ],
};

export const elevenlabsCreateAudioNativeProjectOutputSchema: OutputSchema = {
  fields: [
    { key: 'project_id', label: 'Project ID' },
    { key: 'converting', label: 'Converting', format: 'boolean' },
    { key: 'html_snippet', label: 'HTML Snippet' },
  ],
};

export const elevenlabsGetAudioNativeSettingsOutputSchema: OutputSchema = {
  fields: [
    { key: 'enabled', label: 'Enabled', format: 'boolean' },
    { key: 'snapshot_id', label: 'Snapshot ID' },
    {
      key: 'settings',
      label: 'Settings',
      children: [
        { key: 'title', label: 'Title' },
        { key: 'image', label: 'Image' },
        { key: 'author', label: 'Author' },
        { key: 'small', label: 'Small', format: 'boolean' },
        { key: 'text_color', label: 'Text Color' },
        { key: 'background_color', label: 'Background Color' },
        { key: 'sessionization', label: 'Sessionization', format: 'number' },
        { key: 'audio_path', label: 'Audio Path' },
        { key: 'audio_url', label: 'Audio URL' },
        { key: 'status', label: 'Status' },
      ],
    },
  ],
};

export const elevenlabsUpdateAudioNativeContentOutputSchema: OutputSchema = {
  fields: [
    { key: 'project_id', label: 'Project ID' },
    { key: 'converting', label: 'Converting', format: 'boolean' },
    { key: 'publishing', label: 'Publishing', format: 'boolean' },
    { key: 'html_snippet', label: 'HTML Snippet' },
  ],
};

export const elevenlabsSetAgentAvatarOutputSchema: OutputSchema = {
  fields: [
    { key: 'agent_id', label: 'Agent ID' },
    { key: 'avatar_url', label: 'Avatar URL', format: 'image' },
  ],
};

export const elevenlabsListBatchCallsOutputSchema: OutputSchema = {
  fields: [
    { key: 'batch_calls', label: 'Batch Calls' },
    { key: 'next_doc', label: 'Next Doc' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const elevenlabsListConversationsOutputSchema: OutputSchema = {
  fields: [
    { key: 'conversations', label: 'Conversations' },
    { key: 'next_cursor', label: 'Next Cursor' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const elevenlabsGetDefaultVoiceSettingsOutputSchema: OutputSchema = {
  fields: [
    { key: 'stability', label: 'Stability', format: 'number' },
    { key: 'use_speaker_boost', label: 'Use Speaker Boost', format: 'boolean' },
    { key: 'similarity_boost', label: 'Similarity Boost', format: 'number' },
    { key: 'style', label: 'Style', format: 'number' },
    { key: 'speed', label: 'Speed', format: 'number' },
  ],
};

export const elevenlabsCreateDubbingOutputSchema: OutputSchema = {
  fields: [
    { key: 'dubbing_id', label: 'Dubbing ID' },
    { key: 'expected_duration_sec', label: 'Expected Duration Sec', format: 'number' },
  ],
};

export const elevenlabsDeleteDubbingOutputSchema: OutputSchema = {
  fields: [
    { key: 'status', label: 'Status' },
  ],
};

export const elevenlabsGetDubbedFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'file', label: 'File', format: 'url' },
    { key: 'content_type', label: 'Content Type' },
  ],
};

export const elevenlabsGetDubbingTranscriptOutputSchema: OutputSchema = {
  fields: [
    { key: 'language', label: 'Language' },
    {
      key: 'utterances',
      label: 'Utterances',
      listItems: [
        { key: 'text', label: 'Text' },
        { key: 'speaker_id', label: 'Speaker ID' },
        { key: 'start_s', label: 'Start S', format: 'number' },
        { key: 'end_s', label: 'End S', format: 'number' },
        {
          key: 'words',
          label: 'Words',
          listItems: [
            { key: 'text', label: 'Text' },
            { key: 'word_type', label: 'Word Type' },
            { key: 'start_s', label: 'Start S', format: 'number' },
            { key: 'end_s', label: 'End S', format: 'number' },
            {
              key: 'characters',
              label: 'Characters',
              listItems: [
                { key: 'text', label: 'Text' },
                { key: 'start_s', label: 'Start S', format: 'number' },
                { key: 'end_s', label: 'End S', format: 'number' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const elevenlabsGetDubbingTranscriptFormattedOutputSchema: OutputSchema = {
  fields: [
    { key: 'transcript_format', label: 'Transcript Format' },
    { key: 'srt', label: 'Srt' },
  ],
};

export const elevenlabsGetDubbingOutputSchema: OutputSchema = {
  fields: [
    { key: 'dubbing_id', label: 'Dubbing ID' },
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' },
    { key: 'source_language', label: 'Source Language' },
    { key: 'target_languages', label: 'Target Languages' },
    { key: 'editable', label: 'Editable', format: 'boolean' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    {
      key: 'media_metadata',
      label: 'Media Metadata',
      children: [
        { key: 'content_type', label: 'Content Type' },
        { key: 'duration', label: 'Duration', format: 'number' },
      ],
    },
    { key: 'error', label: 'Error' },
    { key: 'model', label: 'Model' },
  ],
};

export const elevenlabsListDubbingsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'dubs',
      label: 'Dubs',
      labelKey: 'name',
      listItems: [
        { key: 'dubbing_id', label: 'Dubbing ID' },
        { key: 'name', label: 'Name' },
        { key: 'status', label: 'Status' },
        { key: 'source_language', label: 'Source Language' },
        { key: 'target_languages', label: 'Target Languages' },
        { key: 'editable', label: 'Editable', format: 'boolean' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'media_metadata', label: 'Media Metadata' },
        { key: 'error', label: 'Error' },
        { key: 'model', label: 'Model' },
      ],
    },
    { key: 'next_cursor', label: 'Next Cursor' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const elevenlabsListHistoryItemsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'history',
      label: 'History',
      listItems: [
        { key: 'history_item_id', label: 'History Item ID' },
        { key: 'request_id', label: 'Request ID' },
        { key: 'voice_id', label: 'Voice ID' },
        { key: 'model_id', label: 'Model ID' },
        { key: 'voice_name', label: 'Voice Name' },
        { key: 'voice_category', label: 'Voice Category' },
        { key: 'text', label: 'Text' },
        { key: 'date_unix', label: 'Date Unix', format: 'number' },
        { key: 'character_count_change_from', label: 'Character Count Change From', format: 'number' },
        { key: 'character_count_change_to', label: 'Character Count Change To', format: 'number' },
        { key: 'content_type', label: 'Content Type' },
        { key: 'state', label: 'State' },
        {
          key: 'settings',
          label: 'Settings',
          children: [
            { key: 'similarity_boost', label: 'Similarity Boost', format: 'number' },
            { key: 'stability', label: 'Stability', format: 'number' },
            { key: 'speed', label: 'Speed', format: 'number' },
            { key: 'use_speaker_boost', label: 'Use Speaker Boost', format: 'boolean' },
            { key: 'style', label: 'Style', format: 'number' },
          ],
        },
        { key: 'feedback', label: 'Feedback' },
        { key: 'share_link_id', label: 'Share Link ID' },
        { key: 'source', label: 'Source' },
        { key: 'alignments', label: 'Alignments' },
        { key: 'dialogue', label: 'Dialogue' },
        { key: 'output_format', label: 'Output Format' },
        { key: 'avatar_context', label: 'Avatar Context' },
      ],
    },
    { key: 'last_history_item_id', label: 'Last History Item ID' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'scanned_until', label: 'Scanned Until' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const elevenlabsGetHistoryItemOutputSchema: OutputSchema = {
  fields: [
    { key: 'history_item_id', label: 'History Item ID' },
    { key: 'request_id', label: 'Request ID' },
    { key: 'voice_id', label: 'Voice ID' },
    { key: 'model_id', label: 'Model ID' },
    { key: 'voice_name', label: 'Voice Name' },
    { key: 'voice_category', label: 'Voice Category' },
    { key: 'text', label: 'Text' },
    { key: 'date_unix', label: 'Date Unix', format: 'number' },
    { key: 'character_count_change_from', label: 'Character Count Change From', format: 'number' },
    { key: 'character_count_change_to', label: 'Character Count Change To', format: 'number' },
    { key: 'content_type', label: 'Content Type' },
    { key: 'state', label: 'State' },
    {
      key: 'settings',
      label: 'Settings',
      children: [
        { key: 'style', label: 'Style', format: 'number' },
        { key: 'use_speaker_boost', label: 'Use Speaker Boost', format: 'boolean' },
        { key: 'stability', label: 'Stability', format: 'number' },
        { key: 'speed', label: 'Speed', format: 'number' },
        { key: 'similarity_boost', label: 'Similarity Boost', format: 'number' },
      ],
    },
    { key: 'feedback', label: 'Feedback' },
    { key: 'share_link_id', label: 'Share Link ID' },
    { key: 'source', label: 'Source' },
    {
      key: 'alignments',
      label: 'Alignments',
      children: [
        {
          key: 'alignment',
          label: 'Alignment',
          children: [
            { key: 'characters', label: 'Characters' },
            { key: 'character_start_times_seconds', label: 'Character Start Times Seconds' },
            { key: 'character_end_times_seconds', label: 'Character End Times Seconds' },
          ],
        },
        {
          key: 'normalized_alignment',
          label: 'Normalized Alignment',
          children: [
            { key: 'characters', label: 'Characters' },
            { key: 'character_start_times_seconds', label: 'Character Start Times Seconds' },
            { key: 'character_end_times_seconds', label: 'Character End Times Seconds' },
          ],
        },
      ],
    },
    { key: 'dialogue', label: 'Dialogue' },
    { key: 'output_format', label: 'Output Format' },
    { key: 'avatar_context', label: 'Avatar Context' },
  ],
};

export const elevenlabsGetTestInvocationOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'agent_id', label: 'Agent ID' },
    { key: 'branch_id', label: 'Branch ID' },
    { key: 'version_id', label: 'Version ID' },
    { key: 'ran_against_draft', label: 'Ran Against Draft', format: 'boolean' },
    { key: 'created_at', label: 'Created At', format: 'number' },
    { key: 'folder_id', label: 'Folder ID' },
    { key: 'repeat_count', label: 'Repeat Count', format: 'number' },
    { key: 'bucketing_status', label: 'Bucketing Status' },
    { key: 'result_groups', label: 'Result Groups' },
    {
      key: 'test_runs',
      label: 'Test Runs',
      listItems: [
        { key: 'test_run_id', label: 'Test Run ID' },
        {
          key: 'test_info',
          label: 'Test Info',
          children: [
            { key: 'from_conversation_metadata', label: 'From Conversation Metadata' },
            { key: 'dynamic_variables', label: 'Dynamic Variables' },
            {
              key: 'chat_history',
              label: 'Chat History',
              listItems: [
                { key: 'role', label: 'Role' },
                { key: 'agent_metadata', label: 'Agent Metadata' },
                { key: 'message', label: 'Message' },
                { key: 'multivoice_message', label: 'Multivoice Message' },
                { key: 'tool_calls', label: 'Tool Calls' },
                { key: 'tool_results', label: 'Tool Results' },
                { key: 'feedback', label: 'Feedback' },
                { key: 'llm_override', label: 'Llm Override' },
                { key: 'producing_llm', label: 'Producing Llm' },
                { key: 'time_in_call_secs', label: 'Time In Call Secs', format: 'number' },
                { key: 'conversation_turn_metrics', label: 'Conversation Turn Metrics' },
                { key: 'rag_retrieval_info', label: 'Rag Retrieval Info' },
                { key: 'llm_usage', label: 'Llm Usage' },
                { key: 'interrupted', label: 'Interrupted', format: 'boolean' },
                { key: 'ignored_as_backchannel', label: 'Ignored As Backchannel', format: 'boolean' },
                { key: 'original_message', label: 'Original Message' },
                { key: 'reasoning', label: 'Reasoning' },
                { key: 'source_medium', label: 'Source Medium' },
                { key: 'source_event_id', label: 'Source Event ID' },
                { key: 'used_static_kb_document_ids', label: 'Used Static Kb Document IDs' },
                { key: 'analysis', label: 'Analysis' },
                { key: 'user_identifier', label: 'User Identifier' },
                { key: 'id', label: 'ID' },
                { key: 'compaction', label: 'Compaction' },
                { key: 'triggered_guardrails', label: 'Triggered Guardrails' },
              ],
            },
            { key: 'conversation_initiation_source', label: 'Conversation Initiation Source' },
            { key: 'environment', label: 'Environment' },
            { key: 'type', label: 'Type' },
            { key: 'success_condition', label: 'Success Condition' },
            {
              key: 'success_examples',
              label: 'Success Examples',
              listItems: [
                { key: 'response', label: 'Response' },
                { key: 'type', label: 'Type' },
              ],
            },
            {
              key: 'failure_examples',
              label: 'Failure Examples',
              listItems: [
                { key: 'response', label: 'Response' },
                { key: 'type', label: 'Type' },
              ],
            },
          ],
        },
        { key: 'test_invocation_id', label: 'Test Invocation ID' },
        { key: 'agent_id', label: 'Agent ID' },
        { key: 'branch_id', label: 'Branch ID' },
        { key: 'version_id', label: 'Version ID' },
        { key: 'ran_against_draft', label: 'Ran Against Draft', format: 'boolean' },
        { key: 'workflow_node_id', label: 'Workflow Node ID' },
        { key: 'status', label: 'Status' },
        {
          key: 'agent_responses',
          label: 'Agent Responses',
          listItems: [
            { key: 'role', label: 'Role' },
            { key: 'agent_metadata', label: 'Agent Metadata' },
            { key: 'message', label: 'Message' },
            { key: 'multivoice_message', label: 'Multivoice Message' },
            { key: 'tool_calls', label: 'Tool Calls' },
            { key: 'tool_results', label: 'Tool Results' },
            { key: 'feedback', label: 'Feedback' },
            { key: 'llm_override', label: 'Llm Override' },
            { key: 'producing_llm', label: 'Producing Llm' },
            { key: 'time_in_call_secs', label: 'Time In Call Secs', format: 'number' },
            { key: 'conversation_turn_metrics', label: 'Conversation Turn Metrics' },
            { key: 'rag_retrieval_info', label: 'Rag Retrieval Info' },
            { key: 'llm_usage', label: 'Llm Usage' },
            { key: 'interrupted', label: 'Interrupted', format: 'boolean' },
            { key: 'ignored_as_backchannel', label: 'Ignored As Backchannel', format: 'boolean' },
            { key: 'original_message', label: 'Original Message' },
            { key: 'reasoning', label: 'Reasoning' },
            { key: 'source_medium', label: 'Source Medium' },
            { key: 'source_event_id', label: 'Source Event ID', format: 'number' },
            { key: 'used_static_kb_document_ids', label: 'Used Static Kb Document IDs' },
            { key: 'analysis', label: 'Analysis' },
            { key: 'user_identifier', label: 'User Identifier' },
            { key: 'id', label: 'ID' },
            { key: 'compaction', label: 'Compaction' },
            { key: 'triggered_guardrails', label: 'Triggered Guardrails' },
          ],
        },
        { key: 'test_id', label: 'Test ID' },
        { key: 'test_name', label: 'Test Name' },
        {
          key: 'condition_result',
          label: 'Condition Result',
          children: [
            { key: 'result', label: 'Result' },
            {
              key: 'rationale',
              label: 'Rationale',
              children: [
                { key: 'messages', label: 'Messages' },
                { key: 'summary', label: 'Summary' },
              ],
            },
          ],
        },
        { key: 'last_updated_at_unix', label: 'Last Updated At Unix', format: 'number' },
        {
          key: 'metadata',
          label: 'Metadata',
          children: [
            { key: 'workspace_id', label: 'Workspace ID' },
            { key: 'test_name', label: 'Test Name' },
            { key: 'ran_by_user_email', label: 'Ran By User Email', format: 'email' },
            { key: 'test_type', label: 'Test Type' },
          ],
        },
        { key: 'root_folder_id', label: 'Root Folder ID' },
        { key: 'root_folder_name', label: 'Root Folder Name' },
        { key: 'environment', label: 'Environment' },
        { key: 'credits_used', label: 'Credits Used', format: 'number' },
        {
          key: 'charging',
          label: 'Charging',
          children: [
            { key: 'dev_discount', label: 'Dev Discount', format: 'boolean' },
            { key: 'is_burst', label: 'Is Burst', format: 'boolean' },
            { key: 'tier', label: 'Tier' },
            {
              key: 'llm_usage',
              label: 'Llm Usage',
              children: [
                {
                  key: 'irreversible_generation',
                  label: 'Irreversible Generation',
                  children: [
                    { key: 'model_usage', label: 'Model Usage' },
                    { key: 'detailed_model_usage', label: 'Detailed Model Usage' },
                  ],
                },
                {
                  key: 'initiated_generation',
                  label: 'Initiated Generation',
                  children: [
                    { key: 'model_usage', label: 'Model Usage' },
                    { key: 'detailed_model_usage', label: 'Detailed Model Usage' },
                  ],
                },
              ],
            },
            { key: 'llm_price', label: 'Llm Price', format: 'number' },
            { key: 'llm_charge', label: 'Llm Charge', format: 'number' },
            { key: 'call_charge', label: 'Call Charge', format: 'number' },
            { key: 'platform_charge', label: 'Platform Charge', format: 'number' },
            {
              key: 'platform_usage',
              label: 'Platform Usage',
              children: [
                {
                  key: 'category_usage',
                  label: 'Category Usage',
                  children: [
                    { key: 'text_message', label: 'Text Message' },
                  ],
                },
              ],
            },
            { key: 'platform_price', label: 'Platform Price', format: 'number' },
            { key: 'free_minutes_consumed', label: 'Free Minutes Consumed', format: 'number' },
            { key: 'free_llm_dollars_consumed', label: 'Free Llm Dollars Consumed', format: 'number' },
            { key: 'tts_usage', label: 'Tts Usage' },
            { key: 'asr_usage', label: 'Asr Usage' },
            { key: 'analysis', label: 'Analysis' },
          ],
        },
      ],
    },
  ],
};

export const elevenlabsListTestInvocationsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'meta',
      label: 'Meta',
      children: [
        { key: 'total', label: 'Total' },
        { key: 'page', label: 'Page' },
        { key: 'page_size', label: 'Page Size' },
      ],
    },
    {
      key: 'results',
      label: 'Results',
      labelKey: 'title',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'agent_id', label: 'Agent ID' },
        { key: 'branch_id', label: 'Branch ID' },
        { key: 'version_id', label: 'Version ID' },
        { key: 'ran_against_draft', label: 'Ran Against Draft', format: 'boolean' },
        { key: 'runs_diverged_from_version', label: 'Runs Diverged From Version', format: 'boolean' },
        { key: 'created_at_unix_secs', label: 'Created At Unix Secs', format: 'number' },
        { key: 'test_run_count', label: 'Test Run Count', format: 'number' },
        { key: 'passed_count', label: 'Passed Count', format: 'number' },
        { key: 'failed_count', label: 'Failed Count', format: 'number' },
        { key: 'pending_count', label: 'Pending Count', format: 'number' },
        { key: 'title', label: 'Title' },
        {
          key: 'access_info',
          label: 'Access Info',
          children: [
            { key: 'is_creator', label: 'Is Creator', format: 'boolean' },
            { key: 'creator_name', label: 'Creator Name' },
            { key: 'creator_email', label: 'Creator Email', format: 'email' },
            { key: 'role', label: 'Role' },
            { key: 'anonymous_access_level_override', label: 'Anonymous Access Level Override' },
            { key: 'access_source', label: 'Access Source' },
          ],
        },
        { key: 'repeat_count', label: 'Repeat Count', format: 'number' },
        { key: 'credits_used', label: 'Credits Used', format: 'number' },
        { key: 'total_price', label: 'Total Price', format: 'number' },
      ],
    },
    { key: 'next_cursor', label: 'Next Cursor' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const elevenlabsGetKbDocumentContentOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Result', value: '' },
  ],
};

export const elevenlabsTextToSpeechOutputSchema: OutputSchema = {
  fields: [
    { key: 'audio', label: 'Audio File', value: '', format: 'url' },
  ],
};

export const elevenlabsDeleteKbDocumentOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
  ],
};

export const elevenlabsListKbDependentAgentsOutputSchema: OutputSchema = {
  fields: [
    { key: 'agents', label: 'Agents' },
    { key: 'branches', label: 'Branches' },
    { key: 'next_cursor', label: 'Next Cursor' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const elevenlabsCreateKbFileDocumentOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'folder_path', label: 'Folder Path' },
  ],
};

export const elevenlabsGetKbDocumentOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    {
      key: 'metadata',
      label: 'Metadata',
      children: [
        { key: 'created_at_unix_secs', label: 'Created At Unix Secs', format: 'number' },
        { key: 'last_updated_at_unix_secs', label: 'Last Updated At Unix Secs', format: 'number' },
        { key: 'size_bytes', label: 'Size Bytes', format: 'number' },
      ],
    },
    { key: 'supported_usages', label: 'Supported Usages' },
    {
      key: 'access_info',
      label: 'Access Info',
      children: [
        { key: 'is_creator', label: 'Is Creator', format: 'boolean' },
        { key: 'creator_name', label: 'Creator Name' },
        { key: 'creator_email', label: 'Creator Email', format: 'email' },
        { key: 'role', label: 'Role' },
        { key: 'anonymous_access_level_override', label: 'Anonymous Access Level Override' },
        { key: 'access_source', label: 'Access Source' },
      ],
    },
    { key: 'folder_parent_id', label: 'Folder Parent ID' },
    { key: 'chunking_override', label: 'Chunking Override' },
    { key: 'folder_path', label: 'Folder Path' },
    { key: 'type', label: 'Type' },
    { key: 'extracted_inner_html', label: 'Extracted Inner HTML' },
    { key: 'content_format', label: 'Content Format' },
  ],
};

export const elevenlabsListKbDocumentsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'documents',
      label: 'Documents',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        {
          key: 'metadata',
          label: 'Metadata',
          children: [
            { key: 'created_at_unix_secs', label: 'Created At Unix Secs', format: 'number' },
            { key: 'last_updated_at_unix_secs', label: 'Last Updated At Unix Secs', format: 'number' },
            { key: 'size_bytes', label: 'Size Bytes', format: 'number' },
          ],
        },
        { key: 'supported_usages', label: 'Supported Usages' },
        {
          key: 'access_info',
          label: 'Access Info',
          children: [
            { key: 'is_creator', label: 'Is Creator', format: 'boolean' },
            { key: 'creator_name', label: 'Creator Name' },
            { key: 'creator_email', label: 'Creator Email', format: 'email' },
            { key: 'role', label: 'Role' },
            { key: 'anonymous_access_level_override', label: 'Anonymous Access Level Override' },
            { key: 'access_source', label: 'Access Source' },
          ],
        },
        { key: 'folder_parent_id', label: 'Folder Parent ID' },
        { key: 'chunking_override', label: 'Chunking Override' },
        { key: 'folder_path', label: 'Folder Path' },
        { key: 'dependent_agents', label: 'Dependent Agents' },
        { key: 'type', label: 'Type' },
        { key: 'children_count', label: 'Children Count', format: 'number' },
        { key: 'document_count', label: 'Document Count', format: 'number' },
        { key: 'auto_sync_info', label: 'Auto Sync Info' },
        { key: 'external_sync_info', label: 'External Sync Info' },
        { key: 'is_frozen', label: 'Is Frozen', format: 'boolean' },
      ],
    },
    { key: 'next_cursor', label: 'Next Cursor' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const elevenlabsCreateKbRagIndexOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'model', label: 'Model' },
    { key: 'status', label: 'Status' },
    { key: 'progress_percentage', label: 'Progress Percentage', format: 'number' },
    {
      key: 'document_model_index_usage',
      label: 'Document Model Index Usage',
      children: [
        { key: 'used_bytes', label: 'Used Bytes', format: 'number' },
      ],
    },
  ],
};

export const elevenlabsGetKbDocumentRagIndexesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'indexes',
      label: 'Indexes',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'model', label: 'Model' },
        { key: 'status', label: 'Status' },
        { key: 'progress_percentage', label: 'Progress Percentage', format: 'number' },
        {
          key: 'document_model_index_usage',
          label: 'Document Model Index Usage',
          children: [
            { key: 'used_bytes', label: 'Used Bytes', format: 'number' },
          ],
        },
      ],
    },
  ],
};

export const elevenlabsGetKbRagIndexOverviewOutputSchema: OutputSchema = {
  fields: [
    { key: 'total_used_bytes', label: 'Total Used Bytes', format: 'number' },
    { key: 'total_max_bytes', label: 'Total Max Bytes', format: 'number' },
    { key: 'models', label: 'Models' },
  ],
};

export const elevenlabsGetKbDocumentSourceUrlOutputSchema: OutputSchema = {
  fields: [
    { key: 'signed_url', label: 'Signed URL', format: 'url' },
  ],
};

export const elevenlabsGetKbSummariesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'summaries',
      label: 'Summaries By Document ID',
      value: '',
      dynamicKey: true,
      labelKey: 'data.name',
      children: [
        { key: 'status', label: 'Status' },
        {
          key: 'data',
          label: 'Data',
          children: [
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
            {
              key: 'metadata',
              label: 'Metadata',
              children: [
                { key: 'created_at_unix_secs', label: 'Created At Unix Secs', format: 'number' },
                { key: 'last_updated_at_unix_secs', label: 'Last Updated At Unix Secs', format: 'number' },
                { key: 'size_bytes', label: 'Size Bytes', format: 'number' },
              ],
            },
            { key: 'supported_usages', label: 'Supported Usages' },
            {
              key: 'access_info',
              label: 'Access Info',
              children: [
                { key: 'is_creator', label: 'Is Creator', format: 'boolean' },
                { key: 'creator_name', label: 'Creator Name' },
                { key: 'creator_email', label: 'Creator Email', format: 'email' },
                { key: 'role', label: 'Role' },
                { key: 'anonymous_access_level_override', label: 'Anonymous Access Level Override' },
                { key: 'access_source', label: 'Access Source' },
              ],
            },
            { key: 'folder_parent_id', label: 'Folder Parent ID' },
            { key: 'chunking_override', label: 'Chunking Override' },
            { key: 'folder_path', label: 'Folder Path' },
            { key: 'dependent_agents', label: 'Dependent Agents' },
            { key: 'type', label: 'Type' },
          ],
        },
      ],
    },
  ],
};

export const elevenlabsGetLiveConversationCountOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const elevenlabsListModelsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Items',
      labelKey: 'name',
      listItems: [
        { key: 'model_id', label: 'Model ID' },
        { key: 'name', label: 'Name' },
        { key: 'can_be_finetuned', label: 'Can Be Finetuned', format: 'boolean' },
        { key: 'can_do_text_to_speech', label: 'Can Do Text To Speech', format: 'boolean' },
        { key: 'can_do_voice_conversion', label: 'Can Do Voice Conversion', format: 'boolean' },
        { key: 'can_use_style', label: 'Can Use Style', format: 'boolean' },
        { key: 'can_use_speaker_boost', label: 'Can Use Speaker Boost', format: 'boolean' },
        { key: 'serves_pro_voices', label: 'Serves Pro Voices', format: 'boolean' },
        { key: 'token_cost_factor', label: 'Token Cost Factor', format: 'number' },
        { key: 'description', label: 'Description' },
        { key: 'requires_alpha_access', label: 'Requires Alpha Access', format: 'boolean' },
        {
          key: 'max_characters_request_free_user',
          label: 'Max Characters Request Free User',
          format: 'number',
        },
        {
          key: 'max_characters_request_subscribed_user',
          label: 'Max Characters Request Subscribed User',
          format: 'number',
        },
        { key: 'maximum_text_length_per_request', label: 'Maximum Text Length Per Request', format: 'number' },
        {
          key: 'languages',
          label: 'Languages',
          labelKey: 'name',
          listItems: [
            { key: 'language_id', label: 'Language ID' },
            { key: 'name', label: 'Name' },
          ],
        },
        {
          key: 'model_rates',
          label: 'Model Rates',
          children: [
            { key: 'character_cost_multiplier', label: 'Character Cost Multiplier', format: 'number' },
            { key: 'cost_discount_multiplier', label: 'Cost Discount Multiplier', format: 'number' },
          ],
        },
        { key: 'concurrency_group', label: 'Concurrency Group' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const elevenlabsAddPronunciationRulesOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'version_id', label: 'Version ID' },
    { key: 'version_rules_num', label: 'Version Rules Num', format: 'number' },
  ],
};

export const elevenlabsUpdatePronunciationDictionaryOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'latest_version_id', label: 'Latest Version ID' },
    { key: 'latest_version_rules_num', label: 'Latest Version Rules Num', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'permission_on_resource', label: 'Permission On Resource' },
    { key: 'created_by', label: 'Created By' },
    { key: 'creation_time_unix', label: 'Creation Time Unix', format: 'number' },
    { key: 'archived_time_unix', label: 'Archived Time Unix', format: 'number' },
    { key: 'description', label: 'Description' },
  ],
};

export const elevenlabsCreatePronunciationDictionaryFromRulesOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'created_by', label: 'Created By' },
    { key: 'creation_time_unix', label: 'Creation Time Unix', format: 'number' },
    { key: 'version_id', label: 'Version ID' },
    { key: 'version_rules_num', label: 'Version Rules Num', format: 'number' },
    { key: 'description', label: 'Description' },
    { key: 'permission_on_resource', label: 'Permission On Resource' },
  ],
};

export const elevenlabsGetPronunciationDictionaryOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'latest_version_id', label: 'Latest Version ID' },
    { key: 'latest_version_rules_num', label: 'Latest Version Rules Num', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'permission_on_resource', label: 'Permission On Resource' },
    { key: 'created_by', label: 'Created By' },
    { key: 'creation_time_unix', label: 'Creation Time Unix', format: 'number' },
    { key: 'archived_time_unix', label: 'Archived Time Unix' },
    { key: 'description', label: 'Description' },
    {
      key: 'rules',
      label: 'Rules',
      listItems: [
        { key: 'string_to_replace', label: 'String To Replace' },
        { key: 'case_sensitive', label: 'Case Sensitive', format: 'boolean' },
        { key: 'word_boundaries', label: 'Word Boundaries', format: 'boolean' },
        { key: 'type', label: 'Type' },
        { key: 'alias', label: 'Alias' },
      ],
    },
  ],
};

export const elevenlabsListPronunciationDictionariesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'pronunciation_dictionaries',
      label: 'Pronunciation Dictionaries',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'latest_version_id', label: 'Latest Version ID' },
        { key: 'latest_version_rules_num', label: 'Latest Version Rules Num', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'permission_on_resource', label: 'Permission On Resource' },
        { key: 'created_by', label: 'Created By' },
        { key: 'creation_time_unix', label: 'Creation Time Unix', format: 'number' },
        { key: 'archived_time_unix', label: 'Archived Time Unix' },
        { key: 'description', label: 'Description' },
      ],
    },
    { key: 'next_cursor', label: 'Next Cursor' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const elevenlabsListPhoneNumbersOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const elevenlabsCreateSecretOutputSchema: OutputSchema = {
  fields: [
    { key: 'type', label: 'Type' },
    { key: 'secret_id', label: 'Secret ID' },
    { key: 'name', label: 'Name' },
  ],
};

export const elevenlabsListSecretsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'secrets',
      label: 'Secrets',
      labelKey: 'name',
      listItems: [
        { key: 'type', label: 'Type' },
        { key: 'secret_id', label: 'Secret ID' },
        { key: 'name', label: 'Name' },
        {
          key: 'used_by',
          label: 'Used By',
          children: [
            { key: 'tools', label: 'Tools' },
            { key: 'tools_has_more', label: 'Tools Has More', format: 'boolean' },
            { key: 'agents', label: 'Agents' },
            { key: 'agents_has_more', label: 'Agents Has More', format: 'boolean' },
            { key: 'phone_numbers', label: 'Phone Numbers' },
            { key: 'phone_numbers_has_more', label: 'Phone Numbers Has More', format: 'boolean' },
            { key: 'mcp_servers', label: 'Mcp Servers' },
            { key: 'others', label: 'Others' },
          ],
        },
      ],
    },
    { key: 'next_cursor', label: 'Next Cursor' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const elevenlabsListSharedVoicesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'voices',
      label: 'Voices',
      labelKey: 'name',
      listItems: [
        { key: 'public_owner_id', label: 'Public Owner ID' },
        { key: 'voice_id', label: 'Voice ID' },
        { key: 'date_unix', label: 'Date Unix', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'accent', label: 'Accent' },
        { key: 'gender', label: 'Gender' },
        { key: 'age', label: 'Age' },
        { key: 'descriptive', label: 'Descriptive' },
        { key: 'use_case', label: 'Use Case' },
        { key: 'category', label: 'Category' },
        { key: 'language', label: 'Language' },
        { key: 'locale', label: 'Locale' },
        { key: 'description', label: 'Description' },
        { key: 'preview_url', label: 'Preview URL', format: 'url' },
        { key: 'usage_character_count_1y', label: 'Usage Character Count 1y', format: 'number' },
        { key: 'usage_character_count_7d', label: 'Usage Character Count 7d', format: 'number' },
        {
          key: 'play_api_usage_character_count_1y',
          label: 'Play API Usage Character Count 1y',
          format: 'number',
        },
        { key: 'cloned_by_count', label: 'Cloned By Count', format: 'number' },
        { key: 'rate', label: 'Rate', format: 'number' },
        { key: 'fiat_rate', label: 'Fiat Rate' },
        { key: 'free_users_allowed', label: 'Free Users Allowed', format: 'boolean' },
        { key: 'live_moderation_enabled', label: 'Live Moderation Enabled', format: 'boolean' },
        { key: 'featured', label: 'Featured', format: 'boolean' },
        {
          key: 'verified_languages',
          label: 'Verified Languages',
          listItems: [
            { key: 'language', label: 'Language' },
            { key: 'model_id', label: 'Model ID' },
            { key: 'accent', label: 'Accent' },
            { key: 'locale', label: 'Locale' },
            { key: 'preview_url', label: 'Preview URL', format: 'url' },
          ],
        },
        { key: 'notice_period', label: 'Notice Period', format: 'number' },
        { key: 'instagram_username', label: 'Instagram Username' },
        { key: 'twitter_username', label: 'Twitter Username' },
        { key: 'youtube_username', label: 'Youtube Username' },
        { key: 'tiktok_username', label: 'Tiktok Username' },
        { key: 'image_url', label: 'Image URL' },
        { key: 'is_added_by_user', label: 'Is Added By User', format: 'boolean' },
        { key: 'is_bookmarked', label: 'Is Bookmarked' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'total_count', label: 'Total Count', format: 'number' },
  ],
};

export const elevenlabsGetConversationSignedUrlOutputSchema: OutputSchema = {
  fields: [
    { key: 'signed_url', label: 'Signed URL' },
  ],
};

export const elevenlabsFindSimilarVoicesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'voices',
      label: 'Voices',
      labelKey: 'name',
      listItems: [
        { key: 'public_owner_id', label: 'Public Owner ID' },
        { key: 'voice_id', label: 'Voice ID' },
        { key: 'date_unix', label: 'Date Unix', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'accent', label: 'Accent' },
        { key: 'gender', label: 'Gender' },
        { key: 'age', label: 'Age' },
        { key: 'descriptive', label: 'Descriptive' },
        { key: 'use_case', label: 'Use Case' },
        { key: 'category', label: 'Category' },
        { key: 'language', label: 'Language' },
        { key: 'locale', label: 'Locale' },
        { key: 'description', label: 'Description' },
        { key: 'preview_url', label: 'Preview URL', format: 'url' },
        { key: 'usage_character_count_1y', label: 'Usage Character Count 1y', format: 'number' },
        { key: 'usage_character_count_7d', label: 'Usage Character Count 7d', format: 'number' },
        {
          key: 'play_api_usage_character_count_1y',
          label: 'Play API Usage Character Count 1y',
          format: 'number',
        },
        { key: 'cloned_by_count', label: 'Cloned By Count', format: 'number' },
        { key: 'rate', label: 'Rate', format: 'number' },
        { key: 'fiat_rate', label: 'Fiat Rate' },
        { key: 'free_users_allowed', label: 'Free Users Allowed', format: 'boolean' },
        { key: 'live_moderation_enabled', label: 'Live Moderation Enabled', format: 'boolean' },
        { key: 'featured', label: 'Featured', format: 'boolean' },
        {
          key: 'verified_languages',
          label: 'Verified Languages',
          listItems: [
            { key: 'language', label: 'Language' },
            { key: 'model_id', label: 'Model ID' },
            { key: 'accent', label: 'Accent' },
            { key: 'locale', label: 'Locale' },
            { key: 'preview_url', label: 'Preview URL', format: 'url' },
          ],
        },
        { key: 'notice_period', label: 'Notice Period', format: 'number' },
        { key: 'instagram_username', label: 'Instagram Username' },
        { key: 'twitter_username', label: 'Twitter Username' },
        { key: 'youtube_username', label: 'Youtube Username' },
        { key: 'tiktok_username', label: 'Tiktok Username' },
        { key: 'image_url', label: 'Image URL' },
        { key: 'is_added_by_user', label: 'Is Added By User', format: 'boolean' },
        { key: 'is_bookmarked', label: 'Is Bookmarked' },
        { key: 'orb_thumbnail_signed_urls', label: 'Orb Thumbnail Signed Urls' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'total_count', label: 'Total Count', format: 'number' },
  ],
};

export const elevenlabsSimulateAgentConversationOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'simulated_conversation',
      label: 'Simulated Conversation',
      listItems: [
        { key: 'role', label: 'Role' },
        {
          key: 'agent_metadata',
          label: 'Agent Metadata',
          children: [
            { key: 'agent_id', label: 'Agent ID' },
            { key: 'branch_id', label: 'Branch ID' },
            { key: 'workflow_node_id', label: 'Workflow Node ID' },
            { key: 'version_id', label: 'Version ID' },
          ],
        },
        { key: 'message', label: 'Message' },
        { key: 'multivoice_message', label: 'Multivoice Message' },
        { key: 'tool_calls', label: 'Tool Calls' },
        { key: 'tool_results', label: 'Tool Results' },
        { key: 'feedback', label: 'Feedback' },
        { key: 'llm_override', label: 'Llm Override' },
        { key: 'producing_llm', label: 'Producing Llm' },
        { key: 'time_in_call_secs', label: 'Time In Call Secs', format: 'number' },
        {
          key: 'conversation_turn_metrics',
          label: 'Conversation Turn Metrics',
          children: [
            {
              key: 'metrics',
              label: 'Metrics',
              children: [
                {
                  key: 'convai_llm_service_ttf_sentence',
                  label: 'Convai Llm Service Ttf Sentence',
                  children: [
                    { key: 'elapsed_time', label: 'Elapsed Time', format: 'number' },
                  ],
                },
                {
                  key: 'convai_llm_service_ttfb',
                  label: 'Convai Llm Service Ttfb',
                  children: [
                    { key: 'elapsed_time', label: 'Elapsed Time', format: 'number' },
                  ],
                },
                {
                  key: 'convai_llm_service_tt_last_sentence',
                  label: 'Convai Llm Service Tt Last Sentence',
                  children: [
                    { key: 'elapsed_time', label: 'Elapsed Time', format: 'number' },
                  ],
                },
              ],
            },
            { key: 'convai_asr_provider', label: 'Convai Asr Provider' },
            { key: 'convai_tts_model', label: 'Convai Tts Model' },
            { key: 'convai_tts_cascade', label: 'Convai Tts Cascade' },
          ],
        },
        { key: 'rag_retrieval_info', label: 'Rag Retrieval Info' },
        { key: 'llm_usage', label: 'Llm Usage' },
        { key: 'interrupted', label: 'Interrupted', format: 'boolean' },
        { key: 'ignored_as_backchannel', label: 'Ignored As Backchannel', format: 'boolean' },
        { key: 'original_message', label: 'Original Message' },
        { key: 'reasoning', label: 'Reasoning' },
        { key: 'source_medium', label: 'Source Medium' },
        { key: 'source_event_id', label: 'Source Event ID', format: 'number' },
        { key: 'used_static_kb_document_ids', label: 'Used Static Kb Document IDs' },
        { key: 'analysis', label: 'Analysis' },
        { key: 'user_identifier', label: 'User Identifier' },
        { key: 'id', label: 'ID' },
        { key: 'compaction', label: 'Compaction' },
        { key: 'triggered_guardrails', label: 'Triggered Guardrails' },
        { key: 'file_input', label: 'File Input' },
        { key: 'file_inputs', label: 'File Inputs' },
        { key: 'contextual_update_info', label: 'Contextual Update Info' },
        { key: 'config_snapshot_id', label: 'Config Snapshot ID' },
        { key: 'reasoned', label: 'Reasoned', format: 'boolean' },
      ],
    },
    {
      key: 'analysis',
      label: 'Analysis',
      children: [
        { key: 'evaluation_criteria_results', label: 'Evaluation Criteria Results' },
        { key: 'data_collection_results', label: 'Data Collection Results' },
        { key: 'evaluation_criteria_results_list', label: 'Evaluation Criteria Results List' },
        { key: 'data_collection_results_list', label: 'Data Collection Results List' },
        { key: 'call_successful', label: 'Call Successful' },
        { key: 'call_success_score', label: 'Call Success Score' },
        { key: 'transcript_summary', label: 'Transcript Summary' },
        { key: 'call_summary_title', label: 'Call Summary Title' },
        { key: 'scoped', label: 'Scoped' },
        { key: 'sentiment_analysis', label: 'Sentiment Analysis' },
      ],
    },
    { key: 'guardrails_result', label: 'Guardrails Result' },
  ],
};

export const elevenlabsGetSubscriptionOutputSchema: OutputSchema = {
  fields: [
    { key: 'tier', label: 'Tier' },
    { key: 'character_count', label: 'Character Count', format: 'number' },
    { key: 'character_limit', label: 'Character Limit', format: 'number' },
    { key: 'max_character_limit_extension', label: 'Max Character Limit Extension', format: 'number' },
    { key: 'max_credit_limit_extension', label: 'Max Credit Limit Extension', format: 'number' },
    { key: 'can_extend_character_limit', label: 'Can Extend Character Limit', format: 'boolean' },
    {
      key: 'allowed_to_extend_character_limit',
      label: 'Allowed To Extend Character Limit',
      format: 'boolean',
    },
    { key: 'next_character_count_reset_unix', label: 'Next Character Count Reset Unix', format: 'number' },
    { key: 'voice_slots_used', label: 'Voice Slots Used', format: 'number' },
    { key: 'professional_voice_slots_used', label: 'Professional Voice Slots Used', format: 'number' },
    {
      key: 'professional_voice_slots_used_in_workspace',
      label: 'Professional Voice Slots Used In Workspace',
      format: 'number',
    },
    { key: 'voice_limit', label: 'Voice Limit', format: 'number' },
    { key: 'max_voice_add_edits', label: 'Max Voice Add Edits', format: 'number' },
    { key: 'voice_add_edit_counter', label: 'Voice Add Edit Counter', format: 'number' },
    { key: 'professional_voice_limit', label: 'Professional Voice Limit', format: 'number' },
    { key: 'can_extend_voice_limit', label: 'Can Extend Voice Limit', format: 'boolean' },
    { key: 'can_use_instant_voice_cloning', label: 'Can Use Instant Voice Cloning', format: 'boolean' },
    {
      key: 'can_use_professional_voice_cloning',
      label: 'Can Use Professional Voice Cloning',
      format: 'boolean',
    },
    { key: 'currency', label: 'Currency' },
    {
      key: 'current_overage',
      label: 'Current Overage',
      children: [
        { key: 'amount', label: 'Amount' },
        { key: 'currency', label: 'Currency' },
      ],
    },
    { key: 'status', label: 'Status' },
    { key: 'billing_period', label: 'Billing Period' },
    { key: 'character_refresh_period', label: 'Character Refresh Period' },
    { key: 'next_invoice', label: 'Next Invoice' },
    { key: 'open_invoices', label: 'Open Invoices' },
    { key: 'has_open_invoices', label: 'Has Open Invoices', format: 'boolean' },
    { key: 'pending_change', label: 'Pending Change' },
    {
      key: 'has_used_starter_coupon_on_account',
      label: 'Has Used Starter Coupon On Account',
      format: 'boolean',
    },
    {
      key: 'has_used_creator_coupon_on_account',
      label: 'Has Used Creator Coupon On Account',
      format: 'boolean',
    },
  ],
};

export const elevenlabsCreateAgentTestOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
  ],
};

export const elevenlabsGetAgentTestOutputSchema: OutputSchema = {
  fields: [
    { key: 'from_conversation_metadata', label: 'From Conversation Metadata' },
    { key: 'dynamic_variables', label: 'Dynamic Variables' },
    {
      key: 'chat_history',
      label: 'Chat History',
      listItems: [
        { key: 'role', label: 'Role' },
        { key: 'agent_metadata', label: 'Agent Metadata' },
        { key: 'message', label: 'Message' },
        { key: 'multivoice_message', label: 'Multivoice Message' },
        { key: 'tool_calls', label: 'Tool Calls' },
        { key: 'tool_results', label: 'Tool Results' },
        { key: 'feedback', label: 'Feedback' },
        { key: 'llm_override', label: 'Llm Override' },
        { key: 'producing_llm', label: 'Producing Llm' },
        { key: 'time_in_call_secs', label: 'Time In Call Secs', format: 'number' },
        { key: 'conversation_turn_metrics', label: 'Conversation Turn Metrics' },
        { key: 'rag_retrieval_info', label: 'Rag Retrieval Info' },
        { key: 'llm_usage', label: 'Llm Usage' },
        { key: 'interrupted', label: 'Interrupted', format: 'boolean' },
        { key: 'ignored_as_backchannel', label: 'Ignored As Backchannel', format: 'boolean' },
        { key: 'original_message', label: 'Original Message' },
        { key: 'reasoning', label: 'Reasoning' },
        { key: 'source_medium', label: 'Source Medium' },
        { key: 'source_event_id', label: 'Source Event ID' },
        { key: 'used_static_kb_document_ids', label: 'Used Static Kb Document IDs' },
        { key: 'analysis', label: 'Analysis' },
        { key: 'user_identifier', label: 'User Identifier' },
        { key: 'id', label: 'ID' },
        { key: 'compaction', label: 'Compaction' },
        { key: 'triggered_guardrails', label: 'Triggered Guardrails' },
      ],
    },
    { key: 'conversation_initiation_source', label: 'Conversation Initiation Source' },
    { key: 'environment', label: 'Environment' },
    { key: 'type', label: 'Type' },
    { key: 'success_condition', label: 'Success Condition' },
    {
      key: 'success_examples',
      label: 'Success Examples',
      listItems: [
        { key: 'response', label: 'Response' },
        { key: 'type', label: 'Type' },
      ],
    },
    {
      key: 'failure_examples',
      label: 'Failure Examples',
      listItems: [
        { key: 'response', label: 'Response' },
        { key: 'type', label: 'Type' },
      ],
    },
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
  ],
};

export const elevenlabsListAgentTestsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tests',
      label: 'Tests',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        {
          key: 'access_info',
          label: 'Access Info',
          children: [
            { key: 'is_creator', label: 'Is Creator', format: 'boolean' },
            { key: 'creator_name', label: 'Creator Name' },
            { key: 'creator_email', label: 'Creator Email', format: 'email' },
            { key: 'role', label: 'Role' },
            { key: 'anonymous_access_level_override', label: 'Anonymous Access Level Override' },
            { key: 'access_source', label: 'Access Source' },
          ],
        },
        { key: 'created_at_unix_secs', label: 'Created At Unix Secs', format: 'number' },
        { key: 'last_updated_at_unix_secs', label: 'Last Updated At Unix Secs', format: 'number' },
        { key: 'type', label: 'Type' },
        { key: 'entity_type', label: 'Entity Type' },
        { key: 'folder_parent_id', label: 'Folder Parent ID' },
        { key: 'folder_path', label: 'Folder Path' },
        { key: 'children_count', label: 'Children Count' },
        { key: 'conversation_initiation_source', label: 'Conversation Initiation Source' },
      ],
    },
    { key: 'next_cursor', label: 'Next Cursor' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const elevenlabsRunAgentTestsOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'agent_id', label: 'Agent ID' },
    { key: 'branch_id', label: 'Branch ID' },
    { key: 'version_id', label: 'Version ID' },
    { key: 'ran_against_draft', label: 'Ran Against Draft', format: 'boolean' },
    { key: 'created_at', label: 'Created At', format: 'number' },
    { key: 'folder_id', label: 'Folder ID' },
    { key: 'repeat_count', label: 'Repeat Count', format: 'number' },
    { key: 'bucketing_status', label: 'Bucketing Status' },
    { key: 'result_groups', label: 'Result Groups' },
    {
      key: 'test_runs',
      label: 'Test Runs',
      listItems: [
        { key: 'test_run_id', label: 'Test Run ID' },
        { key: 'test_info', label: 'Test Info' },
        { key: 'test_invocation_id', label: 'Test Invocation ID' },
        { key: 'agent_id', label: 'Agent ID' },
        { key: 'branch_id', label: 'Branch ID' },
        { key: 'version_id', label: 'Version ID' },
        { key: 'ran_against_draft', label: 'Ran Against Draft', format: 'boolean' },
        { key: 'workflow_node_id', label: 'Workflow Node ID' },
        { key: 'status', label: 'Status' },
        { key: 'agent_responses', label: 'Agent Responses' },
        { key: 'test_id', label: 'Test ID' },
        { key: 'test_name', label: 'Test Name' },
        { key: 'condition_result', label: 'Condition Result' },
        { key: 'last_updated_at_unix', label: 'Last Updated At Unix', format: 'number' },
        {
          key: 'metadata',
          label: 'Metadata',
          children: [
            { key: 'workspace_id', label: 'Workspace ID' },
            { key: 'test_name', label: 'Test Name' },
            { key: 'ran_by_user_email', label: 'Ran By User Email', format: 'email' },
            { key: 'test_type', label: 'Test Type' },
          ],
        },
        { key: 'root_folder_id', label: 'Root Folder ID' },
        { key: 'root_folder_name', label: 'Root Folder Name' },
        { key: 'environment', label: 'Environment' },
        { key: 'credits_used', label: 'Credits Used' },
        { key: 'charging', label: 'Charging' },
      ],
    },
  ],
};

export const elevenlabsGetAgentTestSummariesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tests',
      label: 'Tests By Test ID',
      dynamicKey: true,
      labelKey: 'name',
      children: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        {
          key: 'access_info',
          label: 'Access Info',
          children: [
            { key: 'is_creator', label: 'Is Creator', format: 'boolean' },
            { key: 'creator_name', label: 'Creator Name' },
            { key: 'creator_email', label: 'Creator Email', format: 'email' },
            { key: 'role', label: 'Role' },
            { key: 'anonymous_access_level_override', label: 'Anonymous Access Level Override' },
            { key: 'access_source', label: 'Access Source' },
          ],
        },
        { key: 'created_at_unix_secs', label: 'Created At Unix Secs', format: 'number' },
        { key: 'last_updated_at_unix_secs', label: 'Last Updated At Unix Secs', format: 'number' },
        { key: 'type', label: 'Type' },
        { key: 'entity_type', label: 'Entity Type' },
        { key: 'folder_parent_id', label: 'Folder Parent ID' },
        { key: 'folder_path', label: 'Folder Path' },
        { key: 'children_count', label: 'Children Count' },
        { key: 'conversation_initiation_source', label: 'Conversation Initiation Source' },
      ],
    },
  ],
};

export const elevenlabsCreateToolOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    {
      key: 'tool_config',
      label: 'Tool Config',
      children: [
        { key: 'type', label: 'Type' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'response_timeout_secs', label: 'Response Timeout Secs', format: 'number' },
        { key: 'disable_interruptions', label: 'Disable Interruptions', format: 'boolean' },
        { key: 'interruption_mode', label: 'Interruption Mode' },
        { key: 'force_pre_tool_speech', label: 'Force Pre Tool Speech', format: 'boolean' },
        { key: 'pre_tool_speech', label: 'Pre Tool Speech' },
        { key: 'assignments', label: 'Assignments' },
        { key: 'tool_call_sound', label: 'Tool Call Sound' },
        { key: 'tool_call_sound_behavior', label: 'Tool Call Sound Behavior' },
        { key: 'tool_error_handling_mode', label: 'Tool Error Handling Mode' },
        {
          key: 'dynamic_variables',
          label: 'Dynamic Variables',
          children: [
            { key: 'dynamic_variable_placeholders', label: 'Dynamic Variable Placeholders' },
          ],
        },
        { key: 'execution_mode', label: 'Execution Mode' },
        {
          key: 'api_schema',
          label: 'API Schema',
          children: [
            { key: 'request_headers', label: 'Request Headers' },
            { key: 'kind', label: 'Kind' },
            { key: 'url', label: 'URL', format: 'url' },
            { key: 'method', label: 'Method' },
            { key: 'path_params_schema', label: 'Path Params Schema' },
            { key: 'query_params_schema', label: 'Query Params Schema' },
            {
              key: 'request_body_schema',
              label: 'Request Body Schema',
              children: [
                { key: 'description', label: 'Description' },
                { key: 'dynamic_variable', label: 'Dynamic Variable' },
                { key: 'is_omitted', label: 'Is Omitted', format: 'boolean' },
                { key: 'type', label: 'Type' },
                { key: 'required', label: 'Required' },
                {
                  key: 'properties',
                  label: 'Properties',
                  children: [
                    { key: 'q', label: 'Q' },
                  ],
                },
              ],
            },
            { key: 'response_body_schema', label: 'Response Body Schema' },
            { key: 'response_filter', label: 'Response Filter' },
            { key: 'content_type', label: 'Content Type' },
            { key: 'auth_resolved_params', label: 'Auth Resolved Params' },
            { key: 'auth_connection', label: 'Auth Connection' },
            { key: 'mtls_auth_connection', label: 'Mtls Auth Connection' },
          ],
        },
        { key: 'follow_redirects', label: 'Follow Redirects', format: 'boolean' },
        { key: 'follow_redirects_allowed_domains', label: 'Follow Redirects Allowed Domains' },
      ],
    },
    {
      key: 'access_info',
      label: 'Access Info',
      children: [
        { key: 'is_creator', label: 'Is Creator', format: 'boolean' },
        { key: 'creator_name', label: 'Creator Name' },
        { key: 'creator_email', label: 'Creator Email', format: 'email' },
        { key: 'role', label: 'Role' },
        { key: 'anonymous_access_level_override', label: 'Anonymous Access Level Override' },
        { key: 'access_source', label: 'Access Source' },
      ],
    },
    {
      key: 'usage_stats',
      label: 'Usage Stats',
      children: [
        { key: 'total_calls', label: 'Total Calls', format: 'number' },
        { key: 'avg_latency_secs', label: 'Avg Latency Secs', format: 'number' },
      ],
    },
    { key: 'response_mocks', label: 'Response Mocks' },
  ],
};

export const elevenlabsListToolsOutputSchema: OutputSchema = {
  fields: [
    { key: 'tools', label: 'Tools' },
    { key: 'next_cursor', label: 'Next Cursor' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const elevenlabsGetUserOutputSchema: OutputSchema = {
  fields: [
    { key: 'user_id', label: 'User ID' },
    {
      key: 'subscription',
      label: 'Subscription',
      children: [
        { key: 'tier', label: 'Tier' },
        { key: 'character_count', label: 'Character Count', format: 'number' },
        { key: 'character_limit', label: 'Character Limit', format: 'number' },
        { key: 'max_character_limit_extension', label: 'Max Character Limit Extension', format: 'number' },
        { key: 'max_credit_limit_extension', label: 'Max Credit Limit Extension', format: 'number' },
        { key: 'can_extend_character_limit', label: 'Can Extend Character Limit', format: 'boolean' },
        {
          key: 'allowed_to_extend_character_limit',
          label: 'Allowed To Extend Character Limit',
          format: 'boolean',
        },
        { key: 'next_character_count_reset_unix', label: 'Next Character Count Reset Unix', format: 'number' },
        { key: 'voice_slots_used', label: 'Voice Slots Used', format: 'number' },
        { key: 'professional_voice_slots_used', label: 'Professional Voice Slots Used', format: 'number' },
        {
          key: 'professional_voice_slots_used_in_workspace',
          label: 'Professional Voice Slots Used In Workspace',
          format: 'number',
        },
        { key: 'voice_limit', label: 'Voice Limit', format: 'number' },
        { key: 'max_voice_add_edits', label: 'Max Voice Add Edits', format: 'number' },
        { key: 'voice_add_edit_counter', label: 'Voice Add Edit Counter', format: 'number' },
        { key: 'professional_voice_limit', label: 'Professional Voice Limit', format: 'number' },
        { key: 'can_extend_voice_limit', label: 'Can Extend Voice Limit', format: 'boolean' },
        { key: 'can_use_instant_voice_cloning', label: 'Can Use Instant Voice Cloning', format: 'boolean' },
        {
          key: 'can_use_professional_voice_cloning',
          label: 'Can Use Professional Voice Cloning',
          format: 'boolean',
        },
        { key: 'currency', label: 'Currency' },
        {
          key: 'current_overage',
          label: 'Current Overage',
          children: [
            { key: 'amount', label: 'Amount' },
            { key: 'currency', label: 'Currency' },
          ],
        },
        { key: 'status', label: 'Status' },
        { key: 'billing_period', label: 'Billing Period' },
        { key: 'character_refresh_period', label: 'Character Refresh Period' },
      ],
    },
    { key: 'subscription_extras', label: 'Subscription Extras' },
    { key: 'is_new_user', label: 'Is New User', format: 'boolean' },
    { key: 'can_use_delayed_payment_methods', label: 'Can Use Delayed Payment Methods', format: 'boolean' },
    { key: 'is_onboarding_completed', label: 'Is Onboarding Completed', format: 'boolean' },
    {
      key: 'is_onboarding_checklist_completed',
      label: 'Is Onboarding Checklist Completed',
      format: 'boolean',
    },
    { key: 'show_compliance_terms', label: 'Show Compliance Terms', format: 'boolean' },
    { key: 'first_name', label: 'First Name' },
    { key: 'is_api_key_hashed', label: 'Is API Key Hashed', format: 'boolean' },
    { key: 'xi_api_key_preview', label: 'Xi API Key Preview' },
    { key: 'referral_link_code', label: 'Referral Link Code' },
    { key: 'partnerstack_partner_default_link', label: 'Partnerstack Partner Default Link' },
    { key: 'created_at', label: 'Created At', format: 'number' },
    { key: 'seat_type', label: 'Seat Type' },
  ],
};

export const elevenlabsGetVoiceOutputSchema: OutputSchema = {
  fields: [
    { key: 'voice_id', label: 'Voice ID' },
    { key: 'name', label: 'Name' },
    { key: 'samples', label: 'Samples' },
    { key: 'category', label: 'Category' },
    {
      key: 'fine_tuning',
      label: 'Fine Tuning',
      children: [
        { key: 'is_allowed_to_fine_tune', label: 'Is Allowed To Fine Tune', format: 'boolean' },
        {
          key: 'state',
          label: 'State',
          children: [
            { key: 'eleven_multilingual_v2', label: 'Eleven Multilingual V2' },
            { key: 'eleven_v2_5_flash', label: 'Eleven V2 5 Flash' },
            { key: 'eleven_turbo_v2', label: 'Eleven Turbo V2' },
            { key: 'eleven_v2_flash', label: 'Eleven V2 Flash' },
            { key: 'eleven_flash_v2_5', label: 'Eleven Flash V2 5' },
            { key: 'eleven_turbo_v2_5', label: 'Eleven Turbo V2 5' },
            { key: 'eleven_flash_v2', label: 'Eleven Flash V2' },
          ],
        },
        { key: 'verification_failures', label: 'Verification Failures' },
        { key: 'verification_attempts_count', label: 'Verification Attempts Count', format: 'number' },
        { key: 'manual_verification_requested', label: 'Manual Verification Requested', format: 'boolean' },
        { key: 'language', label: 'Language' },
        { key: 'progress', label: 'Progress' },
        {
          key: 'message',
          label: 'Message',
          children: [
            { key: 'eleven_multilingual_v2', label: 'Eleven Multilingual V2' },
            { key: 'eleven_v2_5_flash', label: 'Eleven V2 5 Flash' },
            { key: 'eleven_turbo_v2', label: 'Eleven Turbo V2' },
            { key: 'eleven_v2_flash', label: 'Eleven V2 Flash' },
            { key: 'eleven_flash_v2_5', label: 'Eleven Flash V2 5' },
            { key: 'eleven_turbo_v2_5', label: 'Eleven Turbo V2 5' },
            { key: 'eleven_flash_v2', label: 'Eleven Flash V2' },
          ],
        },
        { key: 'dataset_duration_seconds', label: 'Dataset Duration Seconds' },
        { key: 'verification_attempts', label: 'Verification Attempts' },
        { key: 'slice_ids', label: 'Slice IDs' },
        { key: 'manual_verification', label: 'Manual Verification' },
        { key: 'max_verification_attempts', label: 'Max Verification Attempts', format: 'number' },
        {
          key: 'next_max_verification_attempts_reset_unix_ms',
          label: 'Next Max Verification Attempts Reset Unix Ms',
          format: 'number',
        },
      ],
    },
    {
      key: 'labels',
      label: 'Labels',
      children: [
        { key: 'use_case', label: 'Use Case' },
        { key: 'descriptive', label: 'Descriptive' },
        { key: 'language', label: 'Language' },
        { key: 'accent', label: 'Accent' },
        { key: 'age', label: 'Age' },
        { key: 'gender', label: 'Gender' },
      ],
    },
    { key: 'description', label: 'Description' },
    { key: 'preview_url', label: 'Preview URL', format: 'url' },
    { key: 'available_for_tiers', label: 'Available For Tiers' },
    {
      key: 'settings',
      label: 'Settings',
      children: [
        { key: 'stability', label: 'Stability', format: 'number' },
        { key: 'use_speaker_boost', label: 'Use Speaker Boost', format: 'boolean' },
        { key: 'similarity_boost', label: 'Similarity Boost', format: 'number' },
        { key: 'style', label: 'Style', format: 'number' },
        { key: 'speed', label: 'Speed', format: 'number' },
      ],
    },
    { key: 'sharing', label: 'Sharing' },
    { key: 'high_quality_base_model_ids', label: 'High Quality Base Model IDs' },
    {
      key: 'verified_languages',
      label: 'Verified Languages',
      listItems: [
        { key: 'language', label: 'Language' },
        { key: 'model_id', label: 'Model ID' },
        { key: 'accent', label: 'Accent' },
        { key: 'locale', label: 'Locale' },
        { key: 'preview_url', label: 'Preview URL', format: 'url' },
      ],
    },
    { key: 'collection_ids', label: 'Collection IDs' },
    { key: 'safety_control', label: 'Safety Control' },
    {
      key: 'voice_verification',
      label: 'Voice Verification',
      children: [
        { key: 'requires_verification', label: 'Requires Verification', format: 'boolean' },
        { key: 'is_verified', label: 'Is Verified', format: 'boolean' },
        { key: 'verification_failures', label: 'Verification Failures' },
        { key: 'verification_attempts_count', label: 'Verification Attempts Count', format: 'number' },
        { key: 'language', label: 'Language' },
        { key: 'verification_attempts', label: 'Verification Attempts' },
      ],
    },
    { key: 'permission_on_resource', label: 'Permission On Resource' },
    { key: 'is_owner', label: 'Is Owner' },
    { key: 'is_legacy', label: 'Is Legacy', format: 'boolean' },
    { key: 'is_mixed', label: 'Is Mixed', format: 'boolean' },
    { key: 'favorited_at_unix', label: 'Favorited At Unix' },
    { key: 'created_at_unix', label: 'Created At Unix', format: 'number' },
    { key: 'is_bookmarked', label: 'Is Bookmarked' },
    { key: 'recording_quality', label: 'Recording Quality' },
    { key: 'labelling_status', label: 'Labelling Status' },
    { key: 'recording_quality_reason', label: 'Recording Quality Reason' },
    { key: 'orb_thumbnail_signed_urls', label: 'Orb Thumbnail Signed Urls' },
  ],
};

export const elevenlabsListVoicesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'voices',
      label: 'Voices',
      labelKey: 'name',
      listItems: [
        { key: 'voice_id', label: 'Voice ID' },
        { key: 'name', label: 'Name' },
        { key: 'samples', label: 'Samples' },
        { key: 'category', label: 'Category' },
        {
          key: 'fine_tuning',
          label: 'Fine Tuning',
          children: [
            { key: 'is_allowed_to_fine_tune', label: 'Is Allowed To Fine Tune', format: 'boolean' },
            {
              key: 'state',
              label: 'State',
              children: [
                { key: 'eleven_multilingual_v2', label: 'Eleven Multilingual V2' },
                { key: 'eleven_v2_5_flash', label: 'Eleven V2 5 Flash' },
                { key: 'eleven_turbo_v2', label: 'Eleven Turbo V2' },
                { key: 'eleven_v2_flash', label: 'Eleven V2 Flash' },
                { key: 'eleven_flash_v2_5', label: 'Eleven Flash V2 5' },
                { key: 'eleven_turbo_v2_5', label: 'Eleven Turbo V2 5' },
                { key: 'eleven_flash_v2', label: 'Eleven Flash V2' },
              ],
            },
            { key: 'verification_failures', label: 'Verification Failures' },
            { key: 'verification_attempts_count', label: 'Verification Attempts Count', format: 'number' },
            {
              key: 'manual_verification_requested',
              label: 'Manual Verification Requested',
              format: 'boolean',
            },
            { key: 'language', label: 'Language' },
            {
              key: 'progress',
              label: 'Progress',
              children: [
                { key: 'eleven_v2_5_flash', label: 'Eleven V2 5 Flash', format: 'number' },
                { key: 'eleven_v2_flash', label: 'Eleven V2 Flash', format: 'number' },
                { key: 'eleven_flash_v2_5', label: 'Eleven Flash V2 5', format: 'number' },
                { key: 'eleven_flash_v2', label: 'Eleven Flash V2', format: 'number' },
              ],
            },
            {
              key: 'message',
              label: 'Message',
              children: [
                { key: 'eleven_multilingual_v2', label: 'Eleven Multilingual V2' },
                { key: 'eleven_v2_5_flash', label: 'Eleven V2 5 Flash' },
                { key: 'eleven_turbo_v2', label: 'Eleven Turbo V2' },
                { key: 'eleven_v2_flash', label: 'Eleven V2 Flash' },
                { key: 'eleven_flash_v2_5', label: 'Eleven Flash V2 5' },
                { key: 'eleven_turbo_v2_5', label: 'Eleven Turbo V2 5' },
                { key: 'eleven_flash_v2', label: 'Eleven Flash V2' },
              ],
            },
            { key: 'dataset_duration_seconds', label: 'Dataset Duration Seconds' },
            { key: 'verification_attempts', label: 'Verification Attempts' },
            { key: 'slice_ids', label: 'Slice IDs' },
            { key: 'manual_verification', label: 'Manual Verification' },
            { key: 'max_verification_attempts', label: 'Max Verification Attempts', format: 'number' },
            {
              key: 'next_max_verification_attempts_reset_unix_ms',
              label: 'Next Max Verification Attempts Reset Unix Ms',
              format: 'number',
            },
          ],
        },
        {
          key: 'labels',
          label: 'Labels',
          children: [
            { key: 'use_case', label: 'Use Case' },
            { key: 'descriptive', label: 'Descriptive' },
            { key: 'language', label: 'Language' },
            { key: 'accent', label: 'Accent' },
            { key: 'age', label: 'Age' },
            { key: 'gender', label: 'Gender' },
          ],
        },
        { key: 'description', label: 'Description' },
        { key: 'preview_url', label: 'Preview URL', format: 'url' },
        { key: 'available_for_tiers', label: 'Available For Tiers' },
        { key: 'settings', label: 'Settings' },
        { key: 'sharing', label: 'Sharing' },
        { key: 'high_quality_base_model_ids', label: 'High Quality Base Model IDs' },
        {
          key: 'verified_languages',
          label: 'Verified Languages',
          listItems: [
            { key: 'language', label: 'Language' },
            { key: 'model_id', label: 'Model ID' },
            { key: 'accent', label: 'Accent' },
            { key: 'locale', label: 'Locale' },
            { key: 'preview_url', label: 'Preview URL', format: 'url' },
          ],
        },
        { key: 'collection_ids', label: 'Collection IDs' },
        { key: 'safety_control', label: 'Safety Control' },
        {
          key: 'voice_verification',
          label: 'Voice Verification',
          children: [
            { key: 'requires_verification', label: 'Requires Verification', format: 'boolean' },
            { key: 'is_verified', label: 'Is Verified', format: 'boolean' },
            { key: 'verification_failures', label: 'Verification Failures' },
            { key: 'verification_attempts_count', label: 'Verification Attempts Count', format: 'number' },
            { key: 'language', label: 'Language' },
            { key: 'verification_attempts', label: 'Verification Attempts' },
          ],
        },
        { key: 'permission_on_resource', label: 'Permission On Resource' },
        { key: 'is_owner', label: 'Is Owner', format: 'boolean' },
        { key: 'is_legacy', label: 'Is Legacy', format: 'boolean' },
        { key: 'is_mixed', label: 'Is Mixed', format: 'boolean' },
        { key: 'favorited_at_unix', label: 'Favorited At Unix' },
        { key: 'created_at_unix', label: 'Created At Unix', format: 'number' },
        { key: 'is_bookmarked', label: 'Is Bookmarked' },
        { key: 'recording_quality', label: 'Recording Quality' },
        { key: 'labelling_status', label: 'Labelling Status' },
        { key: 'recording_quality_reason', label: 'Recording Quality Reason' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'total_count', label: 'Total Count', format: 'number' },
    { key: 'next_page_token', label: 'Next Page Token' },
  ],
};
