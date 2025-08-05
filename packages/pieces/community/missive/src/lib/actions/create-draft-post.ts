import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { missiveAuth } from '../common/auth';
import { missiveCommon } from '../common/client';

export const createDraftPost = createAction({
    name: 'create_draft_post',
    displayName: 'Create Draft/Post',
    description: 'Create a draft message or post in Missive, with option to send',
    auth: missiveAuth,
    props: {
    message_type: Property.StaticDropdown({
      displayName: 'Message Type',
      description: 'Type of message to create',
            required: true,
            options: {
                options: [
          { label: 'Email', value: 'email' },
          { label: 'SMS', value: 'sms' },
          { label: 'WhatsApp', value: 'whatsapp' },
          { label: 'Missive Live Chat', value: 'live_chat' },
          { label: 'Custom Channel', value: 'custom_channel' },
          { label: 'Messenger', value: 'messenger' },
          { label: 'Instagram', value: 'instagram' },
        ],
      },
    }),
        subject: Property.ShortText({
            displayName: 'Subject',
      description: 'Subject line (primarily for email)',
            required: false,
        }),
        body: Property.LongText({
      displayName: 'Message Body',
      description: 'The content of your message (supports HTML for email)',
            required: true,
        }),
    message_fields: Property.DynamicProperties({
      displayName: 'Message Configuration',
      description: 'Configure sender, recipients, and message-specific options',
            required: false,
      refreshers: ['message_type'],
      props: async ({ auth, message_type }) => {
        if (!auth || !message_type) {
          return {
            placeholder: Property.ShortText({
              displayName: 'Select Message Type',
              description: 'Please select a message type first',
            required: false,
        }),
          };
        }

        const props: any = {};

        props.quote_previous_message = Property.Checkbox({
          displayName: 'Quote Previous Message',
          description:
            '⚠️ WARNING: Only use if you know the conversation content. May leak sensitive information.',
            required: false,
          defaultValue: false,
        });

        switch (message_type as unknown as string) {
          case 'email':
            props.from_email = Property.ShortText({
              displayName: 'From Email',
              description:
                'Sender email address (must match your Missive email aliases)',
              required: true,
            });
            props.from_name = Property.ShortText({
              displayName: 'From Name',
              description: 'Sender display name',
            required: false,
            });
            props.to_emails = Property.Array({
              displayName: 'To Recipients',
              description: 'Email recipients',
                    required: true,
            properties: {
                address: Property.ShortText({
                    displayName: 'Email Address',
                    required: true,
                }),
                name: Property.ShortText({
                  displayName: 'Display Name',
                    required: false,
        }),
              },
            });
            props.cc_emails = Property.Array({
            displayName: 'CC Recipients',
              description: 'Carbon copy recipients',
            required: false,
            properties: {
                address: Property.ShortText({
                    displayName: 'Email Address',
                    required: true,
                }),
                name: Property.ShortText({
                  displayName: 'Display Name',
                    required: false,
        }),
              },
            });
            props.bcc_emails = Property.Array({
            displayName: 'BCC Recipients',
              description: 'Blind carbon copy recipients',
            required: false,
            properties: {
                address: Property.ShortText({
                    displayName: 'Email Address',
                    required: true,
                }),
                name: Property.ShortText({
                  displayName: 'Display Name',
                  required: false,
                }),
              },
            });
            break;

          case 'sms':
          case 'whatsapp':
            props.from_phone = Property.ShortText({
              displayName: 'From Phone Number',
              description:
                'Your phone number (must match your Twilio/SignalWire accounts). Format: +1234567890',
              required: true,
            });
            if ((message_type as unknown as string) === 'whatsapp') {
              props.from_type = Property.StaticDropdown({
                displayName: 'From Account Type',
                description: 'Type of WhatsApp account',
                required: false,
                options: {
                  options: [
                    { label: 'WhatsApp', value: 'whatsapp' },
                    { label: 'Twilio WhatsApp', value: 'twilio_whatsapp' },
                    { label: 'Twilio', value: 'twilio' },
                    { label: 'SignalWire', value: 'signalwire' },
                  ],
                },
              });
            }
            props.to_phone = Property.ShortText({
              displayName: 'To Phone Number',
              description: 'Recipient phone number. Format: +1234567890',
              required: true,
            });

            if ((message_type as unknown as string) === 'whatsapp') {
              props.whatsapp_template_id = Property.ShortText({
                displayName: 'WhatsApp Template ID',
                description:
                  'Template ID for new conversations (required for users not contacted in 24h)',
                required: false,
              });
              props.whatsapp_template_variables = Property.Object({
                displayName: 'Template Variables',
                description:
                  'Variables for WhatsApp template (e.g., {"1": "John", "2": "Project"})',
                required: false,
              });
            }
            break;

          case 'live_chat':
          case 'custom_channel':
          case 'messenger':
          case 'instagram':
            if (
              (message_type as unknown as string) === 'live_chat' ||
              (message_type as unknown as string) === 'custom_channel'
            ) {
              props.account_id = Property.ShortText({
                displayName: 'Account ID',
                description:
                  'Account ID from Missive settings > API > Resource IDs',
                required: true,
              });
            }

            props.from_id = Property.ShortText({
              displayName: 'From ID',
              description: 'Sender ID',
              required: false,
            });
            props.from_username = Property.ShortText({
              displayName: 'From Username',
              description: 'Sender username (e.g., @missiveapp)',
              required: false,
            });
            props.from_name = Property.ShortText({
              displayName: 'From Name',
              description: 'Sender display name',
              required: false,
            });

            if (
              (message_type as unknown as string) === 'messenger' ||
              (message_type as unknown as string) === 'instagram'
            ) {
              props.to_id = Property.ShortText({
                displayName: 'To ID',
                description: 'Recipient ID',
                required: true,
              });
            } else {
              props.to_recipients = Property.Array({
                displayName: 'Recipients',
                description: 'Message recipients',
                required: true,
                properties: {
                  id: Property.ShortText({
                    displayName: 'Recipient ID',
                    required: true,
                  }),
                  username: Property.ShortText({
                    displayName: 'Username',
                    required: false,
                  }),
                  name: Property.ShortText({
                    displayName: 'Display Name',
                    required: false,
                  }),
                },
              });
            }
            break;
        }

        return props;
      },
    }),
    conversation_options: Property.DynamicProperties({
      displayName: 'Conversation Options',
      description: 'Advanced conversation management options',
      required: false,
      refreshers: [],
      props: async ({ auth }) => {
        if (!auth) {
          return {
            existing_conversation_id: Property.ShortText({
              displayName: 'Authenticate First',
              description: 'Please authenticate to access conversation options',
            required: false,
        }),
            references: Property.Array({
              displayName: 'Message References',
              description: 'Please authenticate to access conversation options',
              required: false,
              properties: {
                reference: Property.ShortText({
                  displayName: 'Reference ID',
            required: false,
        }),
              },
            }),
            organization: Property.StaticDropdown({
              displayName: 'Organization',
              description: 'Please authenticate first',
              required: false,
              options: {
                disabled: true,
                options: [{ label: 'Please authenticate first', value: '' }],
              },
            }),
            team: Property.StaticDropdown({
            displayName: 'Team',
              description: 'Please authenticate first',
              required: false,
              options: {
                disabled: true,
                options: [{ label: 'Please authenticate first', value: '' }],
              },
            }),
            force_team: Property.Checkbox({
              displayName: 'Force Team Assignment',
              description: 'Please authenticate first',
              required: false,
              defaultValue: false,
            }),
            add_shared_labels: Property.StaticMultiSelectDropdown({
              displayName: 'Add Shared Labels',
              description: 'Please authenticate first',
              required: false,
              options: {
                disabled: true,
                options: [{ label: 'Please authenticate first', value: '' }],
              },
            }),
            remove_shared_labels: Property.StaticMultiSelectDropdown({
              displayName: 'Remove Shared Labels',
              description: 'Please authenticate first',
            required: false,
              options: {
                        disabled: true,
                options: [{ label: 'Please authenticate first', value: '' }],
              },
            }),
            conversation_subject: Property.ShortText({
              displayName: 'Conversation Subject',
              description: 'Please authenticate first',
              required: false,
            }),
            conversation_color: Property.StaticDropdown({
              displayName: 'Conversation Color',
              description: 'Please authenticate first',
              required: false,
              options: {
                        disabled: true,
                options: [{ label: 'Please authenticate first', value: '' }],
              },
            }),
            add_to_inbox: Property.Checkbox({
              displayName: 'Add to Inbox',
              description: 'Please authenticate first',
              required: false,
              defaultValue: false,
            }),
            add_to_team_inbox: Property.Checkbox({
              displayName: 'Add to Team Inbox',
              description: 'Please authenticate first',
              required: false,
              defaultValue: false,
            }),
            close_conversation: Property.Checkbox({
              displayName: 'Close Conversation',
              description: 'Please authenticate first',
              required: false,
              defaultValue: false,
            }),
          };
        }

        let organizationOptions: Array<{ label: string; value: string }> = [];
        let teamOptions: Array<{ label: string; value: string }> = [];
        let sharedLabelOptions: Array<{ label: string; value: string }> = [];

        try {
          const orgsResponse = await missiveCommon.apiCall({
            auth: auth as unknown as string,
                        method: HttpMethod.GET,
            resourceUri: '/organizations',
          });
          organizationOptions =
            orgsResponse.body?.organizations?.map((org: any) => ({
              label: org.name,
              value: org.id,
            })) || [];

          const teamsResponse = await missiveCommon.apiCall({
            auth: auth as unknown as string,
            method: HttpMethod.GET,
            resourceUri: '/teams',
          });
          teamOptions =
            teamsResponse.body?.teams?.map((team: any) => ({
                        label: team.name,
                        value: team.id,
            })) || [];

          const labelsResponse = await missiveCommon.apiCall({
            auth: auth as unknown as string,
            method: HttpMethod.GET,
            resourceUri: '/shared_labels',
          });
          sharedLabelOptions =
            labelsResponse.body?.shared_labels?.map((label: any) => ({
              label: label.name,
              value: label.id,
            })) || [];
        } catch (error) {
          console.error('Failed to fetch conversation options:', error);
        }

                    return {
          existing_conversation_id: Property.ShortText({
            displayName: 'Existing Conversation ID',
            description: 'Add to existing conversation (optional)',
            required: false,
          }),
          references: Property.Array({
            displayName: 'Message References',
            description: 'Reference IDs to append to existing conversation',
            required: false,
            properties: {
              reference: Property.ShortText({
                displayName: 'Reference ID',
                description:
                  'Message reference (e.g., <message-id@domain.com>)',
                required: true,
              }),
            },
          }),
          organization: Property.StaticDropdown({
            displayName: 'Organization',
            description: 'Link conversation to organization',
            required: false,
            options: {
              options:
                organizationOptions.length > 0
                  ? organizationOptions
                  : [{ label: 'No organizations found', value: '' }],
            },
          }),
          team: Property.StaticDropdown({
            displayName: 'Team',
            description: 'Link conversation to team',
            required: false,
            options: {
              options:
                teamOptions.length > 0
                  ? teamOptions
                  : [{ label: 'No teams found', value: '' }],
            },
        }),
        force_team: Property.Checkbox({
            displayName: 'Force Team Assignment',
            description:
              'Force new team even if conversation is in another team',
            required: false,
            defaultValue: false,
        }),
          add_shared_labels: Property.StaticMultiSelectDropdown({
            displayName: 'Add Shared Labels',
            description: 'Shared labels to add to conversation',
            required: false,
            options: {
              disabled: false,
              options:
                sharedLabelOptions.length > 0
                  ? sharedLabelOptions
                  : [{ label: 'No shared labels found', value: '' }],
            },
          }),
          remove_shared_labels: Property.StaticMultiSelectDropdown({
            displayName: 'Remove Shared Labels',
            description: 'Shared labels to remove from conversation',
            required: false,
            options: {
              disabled: false,
              options:
                sharedLabelOptions.length > 0
                  ? sharedLabelOptions
                  : [{ label: 'No shared labels found', value: '' }],
            },
          }),
          conversation_subject: Property.ShortText({
            displayName: 'Conversation Subject',
            description: 'Subject for the conversation (if creating new)',
            required: false,
          }),
          conversation_color: Property.StaticDropdown({
            displayName: 'Conversation Color',
            description: 'Color for the conversation',
            required: false,
            options: {
              options: [
                { label: 'Good (Green)', value: 'good' },
                { label: 'Warning (Yellow)', value: 'warning' },
                { label: 'Danger (Red)', value: 'danger' },
                { label: 'Black', value: '#000000' },
                { label: 'Blue', value: '#0066cc' },
                { label: 'Purple', value: '#6600cc' },
              ],
            },
          }),
        add_to_inbox: Property.Checkbox({
            displayName: 'Add to Inbox',
            description: 'Move conversation to Inbox for everyone',
            required: false,
            defaultValue: false,
        }),
        add_to_team_inbox: Property.Checkbox({
            displayName: 'Add to Team Inbox',
            description:
              'Move conversation to team inbox (requires team selection)',
            required: false,
            defaultValue: false,
        }),
          close_conversation: Property.Checkbox({
            displayName: 'Close Conversation',
            description: 'Close the conversation for everyone',
            required: false,
            defaultValue: false,
        }),
        };
      },
    }),
    send_immediately: Property.Checkbox({
      displayName: 'Send Immediately',
      description: 'Send the draft immediately instead of saving as draft',
            required: false,
      defaultValue: false,
    }),
    schedule_send: Property.Checkbox({
      displayName: 'Schedule Send',
      description: 'Schedule the message to be sent later',
            required: false,
            defaultValue: false,
        }),
    send_at_timestamp: Property.Number({
      displayName: 'Send At (Unix Timestamp)',
      description:
        'Unix timestamp when to send the message (required if scheduling)',
            required: false,
        }),
        auto_followup: Property.Checkbox({
      displayName: 'Auto Follow-up',
      description:
        'Cancel scheduled send if there is a reply (requires scheduling)',
            required: false,
            defaultValue: false,
        }),
        attachments: Property.Array({
            displayName: 'Attachments',
      description: 'File attachments (up to 25 files, max 10MB total)',
            required: false,
            properties: {
        filename: Property.ShortText({
          displayName: 'Filename',
          description: 'Name of the file (e.g., document.pdf)',
          required: true,
        }),
        base64_data: Property.LongText({
                    displayName: 'Base64 Data',
                    description: 'Base64-encoded file content',
                    required: true,
                }),
      },
    }),
    },
    async run(context) {
    const propsValue = context.propsValue as any;
        const {
      message_type,
            subject,
            body,
      send_immediately,
      schedule_send,
      send_at_timestamp,
            auto_followup,
      attachments,
    } = propsValue;

    const draftData: any = {
      body,
    };

    if (subject) {
      draftData.subject = subject;
    }

    const messageFields = propsValue.message_fields || {};

    if (messageFields.quote_previous_message) {
      draftData.quote_previous_message = true;
    }

    switch (message_type) {
      case 'email':
        if (messageFields.from_email) {
          draftData.from_field = {
            address: messageFields.from_email,
            ...(messageFields.from_name && { name: messageFields.from_name }),
          };
        }

        if (messageFields.to_emails && Array.isArray(messageFields.to_emails)) {
          draftData.to_fields = messageFields.to_emails.map(
            (recipient: any) => ({
                address: recipient.address,
              ...(recipient.name && { name: recipient.name }),
            })
          );
        }

        if (
          messageFields.cc_emails &&
          Array.isArray(messageFields.cc_emails) &&
          messageFields.cc_emails.length > 0
        ) {
          draftData.cc_fields = messageFields.cc_emails.map(
            (recipient: any) => ({
                address: recipient.address,
              ...(recipient.name && { name: recipient.name }),
            })
          );
        }

        if (
          messageFields.bcc_emails &&
          Array.isArray(messageFields.bcc_emails) &&
          messageFields.bcc_emails.length > 0
        ) {
          draftData.bcc_fields = messageFields.bcc_emails.map(
            (recipient: any) => ({
                address: recipient.address,
              ...(recipient.name && { name: recipient.name }),
            })
          );
        }
        break;

      case 'sms':
      case 'whatsapp':
        if (messageFields.from_phone) {
          draftData.from_field = {
            phone_number: messageFields.from_phone,
            ...(messageFields.from_type && { type: messageFields.from_type }),
          };
        }

        if (messageFields.to_phone) {
          draftData.to_fields = [
            {
              phone_number: messageFields.to_phone,
            },
          ];
        }

        if (message_type === 'whatsapp') {
          if (messageFields.whatsapp_template_id) {
            draftData.external_response_id = messageFields.whatsapp_template_id;
          }
          if (messageFields.whatsapp_template_variables) {
            draftData.external_response_variables =
              messageFields.whatsapp_template_variables;
          }
        }
        break;

      case 'live_chat':
      case 'custom_channel':
        if (messageFields.account_id) {
          draftData.account = messageFields.account_id;
        }

        if (
          messageFields.from_id ||
          messageFields.from_username ||
          messageFields.from_name
        ) {
          draftData.from_field = {
            ...(messageFields.from_id && { id: messageFields.from_id }),
            ...(messageFields.from_username && {
              username: messageFields.from_username,
            }),
            ...(messageFields.from_name && { name: messageFields.from_name }),
          };
        }

        if (
          messageFields.to_recipients &&
          Array.isArray(messageFields.to_recipients)
        ) {
          draftData.to_fields = messageFields.to_recipients.map(
            (recipient: any) => ({
              ...(recipient.id && { id: recipient.id }),
              ...(recipient.username && { username: recipient.username }),
              ...(recipient.name && { name: recipient.name }),
            })
          );
        }
        break;

      case 'messenger':
      case 'instagram':
        if (messageFields.to_id) {
          draftData.to_fields = [
            {
              id: messageFields.to_id,
            },
          ];
        }
        break;
    }

    const conversationOptions = propsValue.conversation_options || {};

    if (conversationOptions.existing_conversation_id) {
      draftData.conversation = conversationOptions.existing_conversation_id;
    }

    if (
      conversationOptions.references &&
      Array.isArray(conversationOptions.references) &&
      conversationOptions.references.length > 0
    ) {
      draftData.references = conversationOptions.references.map(
        (ref: any) => ref.reference
      );
    }

    if (conversationOptions.organization) {
      draftData.organization = conversationOptions.organization;
    }

    if (conversationOptions.team) {
      draftData.team = conversationOptions.team;
    }

    if (conversationOptions.force_team) {
      draftData.force_team = true;
    }

    if (
      conversationOptions.add_shared_labels &&
      Array.isArray(conversationOptions.add_shared_labels) &&
      conversationOptions.add_shared_labels.length > 0
    ) {
      draftData.add_shared_labels = conversationOptions.add_shared_labels;
    }

    if (
      conversationOptions.remove_shared_labels &&
      Array.isArray(conversationOptions.remove_shared_labels) &&
      conversationOptions.remove_shared_labels.length > 0
    ) {
      draftData.remove_shared_labels = conversationOptions.remove_shared_labels;
    }

    if (conversationOptions.conversation_subject) {
      draftData.conversation_subject = conversationOptions.conversation_subject;
    }

    if (conversationOptions.conversation_color) {
      draftData.conversation_color = conversationOptions.conversation_color;
    }

    if (conversationOptions.add_to_inbox) {
      draftData.add_to_inbox = true;
    }

    if (conversationOptions.add_to_team_inbox) {
      draftData.add_to_team_inbox = true;
    }

    if (conversationOptions.close_conversation) {
      draftData.close = true;
    }

    if (send_immediately) {
      draftData.send = true;
    }

    if (schedule_send && send_at_timestamp) {
      draftData.send_at = send_at_timestamp;

      if (auto_followup) {
        draftData.auto_followup = true;
      }
    }

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      draftData.attachments = attachments.map((attachment: any) => ({
        filename: attachment.filename,
                base64_data: attachment.base64_data,
            }));
        }

        const response = await missiveCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
      resourceUri: '/drafts',
            body: {
        drafts: draftData,
            },
        });

        return response.body;
    },
}); 
