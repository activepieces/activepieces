import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import mailchimp from '@mailchimp/mailchimp_marketing';

export const findSubscriber = createAction({
  auth: mailchimpAuth,
  name: 'find_subscriber',
  displayName: 'Find Subscriber',
  description: 'Search for subscribers across all lists or within a specific list. This action provides comprehensive subscriber information including merge fields, interests, and activity data.',
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address of the subscriber to search for',
      required: true,
    }),
    include_fields: Property.Array({
      displayName: 'Include Fields',
      description: 'Fields to include in the response (leave empty for all fields). Use dot notation for nested fields (e.g., "merge_fields.FNAME")',
      required: false,
    }),
    exclude_fields: Property.Array({
      displayName: 'Exclude Fields',
      description: 'Fields to exclude from the response. Use dot notation for nested fields',
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

    try {
      const searchEmail = context.propsValue.email!;
      const listId = context.propsValue.list_id;
      
      const options: any = {};
      
      if (context.propsValue.include_fields && context.propsValue.include_fields.length > 0) {
        options.fields = context.propsValue.include_fields.join(',');
      }
      
      if (context.propsValue.exclude_fields && context.propsValue.exclude_fields.length > 0) {
        options.exclude_fields = context.propsValue.exclude_fields.join(',');
      }

      if (listId) {
        try {
          const subscriberHash = mailchimpCommon.getMD5EmailHash(searchEmail);
          const subscriber = await (mailchimp as any).lists.getListMember(listId, subscriberHash, options);
          
          return {
            success: true,
            found: true,
            match_type: 'exact',
            search_query: searchEmail,
            search_scope: `List: ${listId}`,
            total_matches: 1,
            subscribers: [{
              id: subscriber.id,
              email_address: subscriber.email_address,
              unique_email_id: subscriber.unique_email_id,
              email_type: subscriber.email_type,
              status: subscriber.status,
              merge_fields: subscriber.merge_fields,
              interests: subscriber.interests,
              stats: subscriber.stats,
              ip_signup: subscriber.ip_signup,
              timestamp_signup: subscriber.timestamp_signup,
              ip_opt: subscriber.ip_opt,
              timestamp_opt: subscriber.timestamp_opt,
              member_rating: subscriber.member_rating,
              last_changed: subscriber.last_changed,
              language: subscriber.language,
              vip: subscriber.vip,
              email_client: subscriber.email_client,
              location: subscriber.location,
              tags_count: subscriber.tags_count,
              list_id: subscriber.list_id,
            }],
            primary_subscriber: {
              id: subscriber.id,
              email_address: subscriber.email_address,
              status: subscriber.status,
              list_id: subscriber.list_id,
              full_name: subscriber.merge_fields?.FNAME && subscriber.merge_fields?.LNAME ? 
                `${subscriber.merge_fields.FNAME} ${subscriber.merge_fields.LNAME}` : 
                subscriber.merge_fields?.FNAME || subscriber.merge_fields?.LNAME || 'N/A',
              company: subscriber.merge_fields?.COMPANY || 'N/A',
              phone: subscriber.merge_fields?.PHONE || 'N/A',
              member_since: subscriber.timestamp_signup ? 
                new Date(subscriber.timestamp_signup).toLocaleDateString() : 'N/A',
              last_activity: subscriber.last_changed ? 
                new Date(subscriber.last_changed).toLocaleDateString() : 'N/A',
              member_rating: subscriber.member_rating || 0,
              vip_status: subscriber.vip ? 'VIP' : 'Standard',
              email_type: subscriber.email_type || 'html',
              language: subscriber.language || 'en',
            },
            search_summary: {
              query: searchEmail,
              scope: `Limited to list: ${listId}`,
              exact_matches: 1,
              partial_matches: 0,
              total_results: 1,
            },
          };
        } catch (listError: any) {
          if (listError.status === 404) {
            return {
              success: true,
              found: false,
              match_type: 'none',
              search_query: searchEmail,
              search_scope: `List: ${listId}`,
              message: `Subscriber with email "${searchEmail}" not found in the specified list`,
              search_summary: {
                query: searchEmail,
                scope: `Limited to list: ${listId}`,
                exact_matches: 0,
                partial_matches: 0,
                total_results: 0,
                suggestions: [
                  'Verify the email address is spelled correctly',
                  'Check if the subscriber exists in a different list',
                  'Ensure the subscriber has not been unsubscribed or deleted',
                  'Try searching without specifying a list ID to search across all lists',
                ],
              },
            };
          }
          throw listError;
        }
      } else {
        const allLists = await (mailchimp as any).lists.getAllLists({
          fields: ['lists.id', 'lists.name'],
          count: 1000,
        });

        const foundSubscribers: any[] = [];
        const searchPromises = allLists.lists.map(async (list: any) => {
          try {
            const subscriberHash = mailchimpCommon.getMD5EmailHash(searchEmail);
            const subscriber = await (mailchimp as any).lists.getListMember(list.id, subscriberHash, options);
            
            return {
              id: subscriber.id,
              email_address: subscriber.email_address,
              unique_email_id: subscriber.unique_email_id,
              email_type: subscriber.email_type,
              status: subscriber.status,
              merge_fields: subscriber.merge_fields,
              interests: subscriber.interests,
              stats: subscriber.stats,
              ip_signup: subscriber.ip_signup,
              timestamp_signup: subscriber.timestamp_signup,
              ip_opt: subscriber.ip_opt,
              timestamp_opt: subscriber.timestamp_opt,
              member_rating: subscriber.member_rating,
              last_changed: subscriber.last_changed,
              language: subscriber.language,
              vip: subscriber.vip,
              email_client: subscriber.email_client,
              location: subscriber.location,
              tags_count: subscriber.tags_count,
              list_id: subscriber.list_id,
              list_name: list.name,
            };
          } catch (error: any) {
            if (error.status === 404) {
              return null;
            }
            return {
              list_id: list.id,
              list_name: list.name,
              error: `Failed to check list: ${error.message}`,
            };
          }
        });

        const results = await Promise.all(searchPromises);
        const validSubscribers = results.filter(result => result && !result.error);
        const errors = results.filter(result => result && result.error);

        if (validSubscribers.length > 0) {
          return {
            success: true,
            found: true,
            match_type: 'exact',
            search_query: searchEmail,
            search_scope: 'All Lists',
            total_matches: validSubscribers.length,
            subscribers: validSubscribers,
            primary_subscriber: {
              id: validSubscribers[0].id,
              email_address: validSubscribers[0].email_address,
              status: validSubscribers[0].status,
              list_id: validSubscribers[0].list_id,
              list_name: validSubscribers[0].list_name,
              full_name: validSubscribers[0].merge_fields?.FNAME && validSubscribers[0].merge_fields?.LNAME ? 
                `${validSubscribers[0].merge_fields.FNAME} ${validSubscribers[0].merge_fields.LNAME}` : 
                validSubscribers[0].merge_fields?.FNAME || validSubscribers[0].merge_fields?.LNAME || 'N/A',
              company: validSubscribers[0].merge_fields?.COMPANY || 'N/A',
              phone: validSubscribers[0].merge_fields?.PHONE || 'N/A',
              member_since: validSubscribers[0].timestamp_signup ? 
                new Date(validSubscribers[0].timestamp_signup).toLocaleDateString() : 'N/A',
              last_activity: validSubscribers[0].last_changed ? 
                new Date(validSubscribers[0].last_changed).toLocaleDateString() : 'N/A',
              member_rating: validSubscribers[0].member_rating || 0,
              vip_status: validSubscribers[0].vip ? 'VIP' : 'Standard',
              email_type: validSubscribers[0].email_type || 'html',
              language: validSubscribers[0].language || 'en',
            },
            search_summary: {
              query: searchEmail,
              scope: 'Searched across all lists',
              exact_matches: validSubscribers.length,
              partial_matches: 0,
              total_results: validSubscribers.length,
              lists_searched: allLists.lists.length,
              search_errors: errors.length > 0 ? errors : undefined,
            },
          };
        } else {
          return {
            success: true,
            found: false,
            match_type: 'none',
            search_query: searchEmail,
            search_scope: 'All Lists',
            message: `No subscribers found matching the email: ${searchEmail}`,
            search_summary: {
              query: searchEmail,
              scope: 'Searched across all lists',
              exact_matches: 0,
              partial_matches: 0,
              total_results: 0,
              lists_searched: allLists.lists.length,
              search_errors: errors.length > 0 ? errors : undefined,
              suggestions: [
                'Verify the email address is spelled correctly',
                'Check if the subscriber exists in a different list',
                'Ensure the subscriber has not been unsubscribed or deleted',
                'Consider checking if the email was entered with different capitalization',
                'Verify the subscriber is not in an archived or deleted list',
              ],
            },
          };
        }
      }
    } catch (error: any) {
      if (error.status === 400) {
        return {
          success: false,
          error: 'Invalid search request',
          message: 'The search request was invalid. This could be due to malformed search parameters or invalid list ID.',
          detail: error.detail || 'Bad request',
          suggestions: [
            'Verify the email address format is correct',
            'Check that the list ID (if provided) is valid',
            'Ensure all required parameters are provided',
            'Validate the field names in include/exclude fields',
          ],
        };
      }
      
      if (error.status === 403) {
        return {
          success: false,
          error: 'Access denied',
          message: 'You do not have permission to search for subscribers. Check your API key permissions.',
          detail: error.detail || 'Forbidden',
          suggestions: [
            'Verify your API key has the necessary permissions',
            'Check that you have access to the specified list (if provided)',
            'Ensure your account is active and in good standing',
            'Confirm you have subscriber read permissions enabled',
          ],
        };
      }
      
      if (error.status === 404 && context.propsValue.list_id) {
        return {
          success: false,
          error: 'List not found',
          message: `The list with ID "${context.propsValue.list_id}" could not be found.`,
          detail: error.detail || 'The requested resource could not be found',
          suggestions: [
            'Verify the list ID is correct and exists in your Mailchimp account',
            'Check that you have access to the specified list',
            'Ensure the list has not been deleted or archived',
            'Try searching without specifying a list ID to search across all lists',
          ],
        };
      }
      
      throw new Error(`Failed to search for subscriber: ${error.message || JSON.stringify(error)}`);
    }
  },
});
