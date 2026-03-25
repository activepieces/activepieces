import { createAction, Property } from '@activepieces/pieces-framework';

import { postmarkAuth } from '../auth';
import { BounceListResponse, postmarkClient } from '../common/client';

type GetBouncesProps = {
  count: number;
  offset: number;
  type?: string;
  inactive?: boolean;
  emailFilter?: string;
  messageId?: string;
};

export const getEmailBounces = createAction({
  name: 'get_email_bounces',
  displayName: 'Get Email Bounces',
  description: 'List bounces from your Postmark server.',
  auth: postmarkAuth,
  props: {
    count: Property.Number({
      displayName: 'Count',
      description: 'Maximum number of bounces to return (max 500).',
      required: true,
      defaultValue: 25,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of bounces to skip before returning results.',
      required: true,
      defaultValue: 0,
    }),
    type: Property.ShortText({
      displayName: 'Type',
      description: 'Optional bounce type filter, for example HardBounce.',
      required: false,
    }),
    inactive: Property.Checkbox({
      displayName: 'Inactive Only',
      description:
        'Filter by inactive bounces only. When not set, both active and inactive bounces are returned.',
      required: false,
    }),
    emailFilter: Property.ShortText({
      displayName: 'Email Filter',
      description: 'Filter results by bounced recipient email address.',
      required: false,
    }),
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'Filter results by Postmark message ID.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue as GetBouncesProps;
    const count = props.count ?? 25;
    const offset = props.offset ?? 0;
    const queryParams: Record<string, string> = {
      count: count.toString(),
      offset: offset.toString(),
    };

    if (props.type?.trim()) {
      queryParams['type'] = props.type.trim();
    }
    if (props.inactive === true) {
      queryParams['inactive'] = 'true';
    }
    if (props.emailFilter?.trim()) {
      queryParams['emailFilter'] = props.emailFilter.trim();
    }
    if (props.messageId?.trim()) {
      queryParams['messageID'] = props.messageId.trim();
    }

    const response = await postmarkClient.get<BounceListResponse>(
      context.auth.secret_text,
      '/bounces',
      queryParams
    );

    return response;
  },
});
