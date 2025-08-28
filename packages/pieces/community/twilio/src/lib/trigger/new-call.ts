import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callTwilioApi, twilioCommon } from '../common';
import { twilioAuth } from '../..';

export const twilioNewCall = createTrigger({
  auth: twilioAuth,
  name: 'new_call',
  displayName: 'New Call',
  description: 'Fires when a call completes (incoming or outgoing) with enhanced filtering',
  props: {
    phone_number: twilioCommon.phone_number,
    status_filter: Property.StaticDropdown({
      displayName: 'Call Status',
      description: 'Filter calls by status',
      required: false,
      options: {
        options: [
          { label: 'All Completed', value: 'all' },
          { label: 'Completed', value: 'completed' },
          { label: 'Busy', value: 'busy' },
          { label: 'Failed', value: 'failed' },
          { label: 'No Answer', value: 'no-answer' },
          { label: 'Canceled', value: 'canceled' },
        ],
      },
    }),
    direction_filter: Property.StaticDropdown({
      displayName: 'Call Direction',
      description: 'Filter by call direction',
      required: false,
      options: {
        options: [
          { label: 'All Directions', value: 'all' },
          { label: 'Inbound Only', value: 'inbound' },
          { label: 'Outbound Only', value: 'outbound-api' },
        ],
      },
    }),
    minimum_duration: Property.Number({
      displayName: 'Minimum Duration (seconds)',
      description: 'Only trigger for calls longer than this duration',
      required: false,
    }),
  },
  sampleData: {
    account_sid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    annotation: null,
    answered_by: null,
    api_version: '2010-04-01',
    caller_name: null,
    date_created: 'Tue, 31 Aug 2010 20:36:28 +0000',
    date_updated: 'Tue, 31 Aug 2010 20:36:44 +0000',
    direction: 'inbound',
    duration: '15',
    end_time: 'Tue, 31 Aug 2010 20:36:44 +0000',
    forwarded_from: null,
    from: '+14158675309',
    from_formatted: '(415) 867-5309',
    group_sid: null,
    parent_call_sid: null,
    phone_number_sid: 'PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    price: '-0.03000',
    price_unit: 'USD',
    sid: 'CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    start_time: 'Tue, 31 Aug 2010 20:36:29 +0000',
    status: 'completed',
    subresource_uris: {
      notifications: '/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Calls/CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Notifications.json',
      recordings: '/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Calls/CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Recordings.json',
      feedback: '/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Calls/CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Feedback.json',
      feedback_summaries: '/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Calls/FeedbackSummary.json',
      events: '/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Calls/CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Events.json',
      siprec: '/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Calls/CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Siprec.json',
      streams: '/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Calls/CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Streams.json',
      payments: '/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Calls/CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Payments.json',
      user_defined_messages: '/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Calls/CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/UserDefinedMessages.json',
    },
    to: '+14158675310',
    to_formatted: '(415) 867-5310',
    trunk_sid: null,
    uri: '/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Calls/CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.json',
    queue_time: '1000',
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const { phone_number, status_filter, direction_filter } = context.propsValue;
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;
    
    let queryUrl = `Calls.json?PageSize=20`;
    
    if (status_filter && status_filter !== 'all') {
      queryUrl += `&Status=${status_filter}`;
    } else {
      queryUrl += `&Status=completed`;
    }
    
    if (direction_filter && direction_filter !== 'all') {
      queryUrl += `&Direction=${direction_filter}`;
    }
    
    const response = await callTwilioApi<CallPaginationResponse>(
      HttpMethod.GET,
      queryUrl,
      { account_sid, auth_token },
      {}
    );
    
    await context.store.put<LastCall>('_new_call_trigger', {
      lastCallId: response.body.calls.length === 0 ? null : response.body.calls[0].sid,
    });
  },
  async onDisable(context) {
    await context.store.put('_new_call_trigger', null);
  },
  async run(context) {
    const { phone_number, status_filter, direction_filter, minimum_duration } = context.propsValue;
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;
    const newCalls: unknown[] = [];
    const lastCall = await context.store.get<LastCall>('_new_call_trigger');
    
    let queryUrl = `Calls.json?PageSize=20`;
    
    if (status_filter && status_filter !== 'all') {
      queryUrl += `&Status=${status_filter}`;
    } else {
      queryUrl += `&Status=completed`;
    }
    
    if (direction_filter && direction_filter !== 'all') {
      queryUrl += `&Direction=${direction_filter}`;
    }
    
    let currentUri: string | null = `2010-04-01/Accounts/${account_sid}/${queryUrl}`;
    let firstCallId = undefined;
    
    while (currentUri !== undefined && currentUri !== null) {
      const response: any = await callTwilioApi<CallPaginationResponse>(
        HttpMethod.GET,
        currentUri.replace(`2010-04-01/Accounts/${account_sid}/`, ''),
        { account_sid, auth_token },
        {}
      );
      
      const calls = response.body.calls;
      if (!firstCallId && calls.length > 0) {
        firstCallId = calls[0].sid;
      }
      currentUri = response.body.next_page_uri;
      
      for (let i = 0; i < calls.length; i++) {
        const call = calls[i];
        if (call.sid === lastCall?.lastCallId) {
          currentUri = null;
          break;
        }
        
        if (minimum_duration && minimum_duration > 0) {
          const duration = parseInt(call.duration || '0');
          if (duration < minimum_duration) {
            continue;
          }
        }
        
        if (phone_number) {
          if (call.from === phone_number || call.to === phone_number) {
            newCalls.push(call);
          }
        } else {
          newCalls.push(call);
        }
      }
    }
    
    await context.store.put<LastCall>('_new_call_trigger', {
      lastCallId: firstCallId ?? lastCall!.lastCallId,
    });
    
    return newCalls;
  },
});

interface LastCall {
  lastCallId: string | null;
}

interface CallPaginationResponse {
  calls: { sid: string; from: string; to: string; status: string; direction: string; duration: string }[];
  next_page_uri: string;
}
