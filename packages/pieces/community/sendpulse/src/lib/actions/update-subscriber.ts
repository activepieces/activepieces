import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendpulseApiCall } from '../common/client';
import { sendpulseAuth } from '../common/auth';
import { mailingListDropdown } from '../common/props';

export const updateSubscriberAction = createAction({
  auth: sendpulseAuth,
  name: 'update-subscriber',
  displayName: 'Update Subscriber',
  description: 'Update subscriber details and variables',
  props: {
    mailingListId: mailingListDropdown,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address of the subscriber to update',
      required: true,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'New phone number (optional)',
      required: false,
    }),
    variables: Property.Object({
      displayName: 'Variables',
      description: 'Subscriber variables to update (e.g., name, custom fields)',
      required: false,
    }),
  },

  async run(context) {
    const { mailingListId, email, phone, variables } = context.propsValue;

    const results: any[] = [];
    let hasUpdates = false;

    if (phone) {
      try {
        const phoneResult = await sendpulseApiCall<{ result: boolean }>({
          method: HttpMethod.PUT,
          auth: context.auth,
          resourceUri: `/addressbooks/${mailingListId}/phone`,
          body: { email, phone },
        });

        if (phoneResult.result) {
          results.push({ type: 'phone', success: true, value: phone });
          hasUpdates = true;
        } else {
          results.push({ type: 'phone', success: false, error: 'API returned failure' });
        }
      } catch (error: any) {
        results.push({ type: 'phone', success: false, error: error.message });
      }
    }

    if (variables && Object.keys(variables).length > 0) {
      const variableUpdates = Object.entries(variables).map(([name, value]) => ({
        name,
        value: String(value),
      }));

      try {
        const variableResult = await sendpulseApiCall<{ result: boolean }>({
          method: HttpMethod.POST,
          auth: context.auth,
          resourceUri: `/addressbooks/${mailingListId}/emails/variable`,
          body: { email, variables: variableUpdates },
        });

        if (variableResult.result) {
          results.push({ type: 'variables', success: true, count: variableUpdates.length });
          hasUpdates = true;
        } else {
          results.push({ type: 'variables', success: false, error: 'API returned failure' });
        }
      } catch (error: any) {
        results.push({ type: 'variables', success: false, error: error.message });
      }
    }

    if (!hasUpdates && !phone && (!variables || Object.keys(variables).length === 0)) {
      throw new Error('No updates provided. Please specify phone number or variables to update.');
    }

    const successfulUpdates = results.filter(r => r.success);
    const failedUpdates = results.filter(r => !r.success);

    if (successfulUpdates.length === 0) {
      throw new Error(`All updates failed: ${failedUpdates.map(f => f.error).join(', ')}`);
    }

    return {
      success: true,
      message: `Subscriber ${email} updated successfully`,
      email,
      updates: results,
      hasFailures: failedUpdates.length > 0,
    };
  },
});
