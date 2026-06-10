import { createAction, Property } from '@activepieces/pieces-framework';

import { getresponseAuth } from '../common/auth';
import {
  createGetResponseNewsletter,
  flattenGetResponseNewsletter,
} from '../common/client';
import { getresponseProps } from '../common/props';
import { requireString } from '../common/utils';

export const createNewsletterAction = createAction({
  auth: getresponseAuth,
  name: 'create-newsletter',
  displayName: 'Create Newsletter',
  description: 'Creates a newsletter and queues it to send to the selected campaign.',
  props: {
    campaignId: getresponseProps.campaign(),
    fromFieldId: getresponseProps.fromField(),
    replyToFieldId: getresponseProps.fromField(false, 'Reply-to Address'),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject line for the newsletter.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Newsletter Name',
      description:
        'An internal name for the newsletter inside GetResponse. Leave empty to use the subject.',
      required: false,
    }),
    htmlContent: Property.LongText({
      displayName: 'HTML Content',
      description: 'The newsletter content in HTML format.',
      required: false,
    }),
    plainContent: Property.LongText({
      displayName: 'Plain Text Content',
      description: 'The plain text version of the newsletter content.',
      required: false,
    }),
  },
  async run(context) {
    const campaignId = requireString(
      context.propsValue.campaignId,
      'Campaign',
    );
    const fromFieldId = requireString(
      context.propsValue.fromFieldId,
      'From Address',
    );
    const subject = requireString(context.propsValue.subject, 'Subject');

    if (!context.propsValue.htmlContent && !context.propsValue.plainContent) {
      throw new Error(
        'Provide HTML Content, Plain Text Content, or both before creating the newsletter.',
      );
    }

    const newsletter = await createGetResponseNewsletter({
      auth: context.auth,
      request: {
        subject,
        fromField: {
          fromFieldId,
        },
        campaign: {
          campaignId,
        },
        content: {
          ...(context.propsValue.htmlContent
            ? { html: context.propsValue.htmlContent }
            : {}),
          ...(context.propsValue.plainContent
            ? { plain: context.propsValue.plainContent }
            : {}),
        },
        sendSettings: {
          selectedCampaigns: [campaignId],
        },
        ...(context.propsValue.name
          ? { name: context.propsValue.name }
          : {}),
        ...(context.propsValue.replyToFieldId
          ? {
              replyTo: {
                fromFieldId: context.propsValue.replyToFieldId,
              },
            }
          : {}),
      },
    });

    return flattenGetResponseNewsletter(newsletter);
  },
});
