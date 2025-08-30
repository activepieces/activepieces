import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../auth';
import { mailchimpCommon } from '../common';
import mailchimp from '@mailchimp/mailchimp_marketing';

export const findSubscriber = createAction({
  auth: mailchimpAuth,
  name: 'find_subscriber',
  displayName: 'Find Subscriber',
  description:
    'Search for a subscriber in a specific Mailchimp audience list (by email). Optionally, search across all lists for a broader lookup.',
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the subscriber to find',
      required: true,
    }),
    include_fields: Property.Array({
      displayName: 'Include Fields',
      description:
        'Fields to include in the response (leave empty for all fields). Use dot notation for nested fields (e.g., "merge_fields.FNAME")',
      required: false,
    }),
    exclude_fields: Property.Array({
      displayName: 'Exclude Fields',
      description:
        'Fields to exclude from the response. Use dot notation for nested fields',
      required: false,
    }),
  },
  async run(context) {
    const access_token = context.auth.access_token;
    const mailChimpServerPrefix = await mailchimpCommon.getMailChimpServerPrefix(access_token);

    mailchimp.setConfig({
      accessToken: access_token,
      server: mailChimpServerPrefix,
    });

    const searchEmail = context.propsValue.email!;
    const listId = context.propsValue.list_id;
    const options: any = {};

    if (context.propsValue.include_fields?.length) {
      options.fields = context.propsValue.include_fields.join(',');
    }
    if (context.propsValue.exclude_fields?.length) {
      options.exclude_fields = context.propsValue.exclude_fields.join(',');
    }

    try {
      if (listId) {
        // Search inside a specific list
        const subscriberHash = mailchimpCommon.getMD5EmailHash(searchEmail);
        try {
          const subscriber = await (mailchimp as any).lists.getListMember(
            listId,
            subscriberHash,
            options
          );
          return {
            success: true,
            found: true,
            list_id: listId,
            subscriber,
          };
        } catch (error: any) {
          if (error.status === 404) {
            return {
              success: true,
              found: false,
              list_id: listId,
              message: `Subscriber with email "${searchEmail}" not found in list ${listId}`,
            };
          }
          throw error;
        }
      } else {
        // Search across all lists
        const allLists = await (mailchimp as any).lists.getAllLists({
          fields: ['lists.id', 'lists.name'],
          count: 1000,
        });

        const searchPromises = allLists.lists.map(async (list: any) => {
          try {
            const subscriberHash = mailchimpCommon.getMD5EmailHash(searchEmail);
            const subscriber = await (mailchimp as any).lists.getListMember(
              list.id,
              subscriberHash,
              options
            );
            return { ...subscriber, list_name: list.name };
          } catch (err: any) {
            if (err.status === 404) return null;
            return { list_id: list.id, list_name: list.name, error: err.message };
          }
        });

        const results = await Promise.all(searchPromises);
        const subscribers = results.filter((r: any) => r && !r.error);
        const errors = results.filter((r: any) => r && r.error);

        return {
          success: true,
          found: subscribers.length > 0,
          email: searchEmail,
          total_matches: subscribers.length,
          subscribers,
          errors: errors.length ? errors : undefined,
        };
      }
    } catch (error: any) {
      throw new Error(
        `Failed to search for subscriber: ${error.message || JSON.stringify(error)}`
      );
    }
  },
});
