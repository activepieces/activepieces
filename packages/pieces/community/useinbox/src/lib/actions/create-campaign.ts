import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { useinboxAuth } from '../common/auth';
import { useinboxClient } from '../common/client';
import { useinboxProps } from '../common/props';

type CreateCampaignResult = {
  resultStatus: boolean;
  resultCode: number;
  resultMessage: string;
  resultObject?: {
    id?: string;
    name?: string;
    subject?: string;
    senderAccountId?: string;
    newsletterId?: string;
    status?: number;
    plannedTime?: string;
    createTime?: string;
    updateTime?: string;
  };
};

export const createCampaignAction = createAction({
  auth: useinboxAuth,
  name: 'create_campaign',
  displayName: 'Create Campaign',
  description:
    'Schedules an INBOX campaign that sends a saved newsletter to one or more contact lists.',
  props: {
    senderAccountId: useinboxProps.senderDropdown({
      displayName: 'Sender',
      description:
        'The verified sender the campaign emails are sent from. Add senders under Settings > Senders in INBOX.',
    }),
    newsletterId: Property.ShortText({
      displayName: 'Newsletter ID',
      description:
        'The ID of the saved newsletter to send in the campaign. You can find newsletter IDs by using the "List Newsletters" action or by looking at the URL when editing a newsletter in INBOX (e.g. https://app.inboxroad.com/newsletters/12345/edit, where 12345 is the newsletter ID).',
      required: true,
    }),
    lists: useinboxProps.multiselectContactListDropdown({
      displayName: 'Contact Lists',
      description:
        'Select one or more INBOX contact lists. Lists are managed under Contacts > Lists in your dashboard.',
    }),
    plannedTime: Property.DateTime({
      displayName: 'Scheduled Send Time',
      description:
        'Optional. When to send the campaign. Leave empty to use INBOX defaults. Use a future date/time.',
      required: false,
    }),
    notifyWhenStart: Property.Checkbox({
      displayName: 'Notify when campaign starts',
      description: 'If enabled, INBOX emails you when the campaign starts sending.',
      required: false,
      defaultValue: false,
    }),
    notifyWhenEnd: Property.Checkbox({
      displayName: 'Notify when campaign ends',
      description: 'If enabled, INBOX emails you when the campaign finishes sending.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      senderAccountId,
      newsletterId,
      lists,
      plannedTime,
      notifyWhenStart,
      notifyWhenEnd,
    } = context.propsValue;

    const token = await useinboxClient.fetchAccessToken({
      email: context.auth.username,
      password: context.auth.password,
    });

    const response = await useinboxClient.inboxApiCall<CreateCampaignResult>({
      token,
      service: 'inbox',
      method: HttpMethod.POST,
      path: '/campaigns',
      body: {
        senderAccountId,
        newsletterId,
        listType: 2,
        lists,
        ...(plannedTime ? { plannedTime } : {}),
        notifyWhenStart: notifyWhenStart ?? false,
        notifyWhenEnd: notifyWhenEnd ?? false,
      },
    });

    const campaign = response.body?.resultObject ?? {};
    return {
      success: response.body?.resultStatus ?? false,
      result_code: response.body?.resultCode ?? null,
      result_message: response.body?.resultMessage ?? null,
      campaign_id: campaign.id ?? null,
      name: campaign.name ?? null,
      subject: campaign.subject ?? null,
      sender_id: campaign.senderAccountId ?? senderAccountId,
      newsletter_id: campaign.newsletterId ?? newsletterId,
      status: campaign.status ?? null,
      planned_time: campaign.plannedTime ?? plannedTime ?? null,
      created_at: campaign.createTime ?? null,
      updated_at: campaign.updateTime ?? null,
    };
  },
});
