import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callTwilioApi } from '../common';
import { twilioAuth } from '../..';

export const twilioNewCall = createTrigger({
  auth: twilioAuth,
  name: 'new_call',
  displayName: 'New Call',
  description: 'Triggers when a call completes (incoming or outgoing)',
  props: {},
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
    forwarded_from: '+141586753093',
    from: '+14158675308',
    from_formatted: '(415) 867-5308',
    group_sid: null,
    parent_call_sid: null,
    phone_number_sid: 'PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    price: '-0.03000',
    price_unit: 'USD',
    sid: 'CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    start_time: 'Tue, 31 Aug 2010 20:36:28 +0000',
    status: 'completed',
    subresource_uris: {
      notifications: '/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Calls/CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Notifications.json',
      recordings: '/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Calls/CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Recordings.json',
      feedback: '/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Calls/CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Feedback.json',
      feedback_summaries: '/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Calls/FeedbackSummary.json'
    },
    to: '+14158675309',
    to_formatted: '(415) 867-5309',
    trunk_sid: null,
    uri: '/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Calls/CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.json',
    queue_time: '1000'
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;
    
    const response = await callTwilioApi<CallPaginationResponse>(
      HttpMethod.GET,
      'Calls.json?PageSize=20&Status=completed',
      { account_sid, auth_token },
      {}
    );
    
    await context.store.put<LastCall>('_new_call_trigger', {
      lastCallSid: response.body.calls.length === 0 
        ? null 
        : response.body.calls[0].sid,
    });
  },
  async onDisable(context) {
    await context.store.put('_new_call_trigger', null);
  },
  async run(context) {
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;
    const newCalls: unknown[] = [];
    
    const lastCall = await context.store.get<LastCall>('_new_call_trigger');
    
    const response = await callTwilioApi<CallPaginationResponse>(
      HttpMethod.GET,
      'Calls.json?PageSize=50&Status=completed',
      { account_sid, auth_token },
      {}
    );
    
    const calls = response.body.calls;
    let firstCallSid = calls.length > 0 ? calls[0].sid : undefined;
    
    for (const call of calls) {
      if (call.sid === lastCall?.lastCallSid) {
        break;
      }
      newCalls.push(call);
    }
    
    await context.store.put<LastCall>('_new_call_trigger', {
      lastCallSid: firstCallSid ?? lastCall?.lastCallSid ?? null,
    });
    
    return newCalls;
  },
});

interface LastCall {
  lastCallSid: string | null;
}

interface CallPaginationResponse {
  calls: {
    account_sid: string;
    annotation: string | null;
    answered_by: string | null;
    api_version: string;
    caller_name: string | null;
    date_created: string;
    date_updated: string;
    direction: string;
    duration: string;
    end_time: string;
    forwarded_from: string;
    from: string;
    from_formatted: string;
    group_sid: string | null;
    parent_call_sid: string | null;
    phone_number_sid: string;
    price: string;
    price_unit: string;
    sid: string;
    start_time: string;
    status: string;
    subresource_uris: {
      notifications: string;
      recordings: string;
      feedback: string;
      feedback_summaries: string;
    };
    to: string;
    to_formatted: string;
    trunk_sid: string | null;
    uri: string;
    queue_time: string;
  }[];
  next_page_uri?: string;
}
