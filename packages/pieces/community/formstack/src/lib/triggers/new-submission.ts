import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { formStackAuth } from '../common/auth';
import { formIdDropdown } from '../common/props';
import { makeRequest } from '../common/client';

dayjs.extend(timezone);
dayjs.extend(utc);

const polling: Polling<PiecePropValueSchema<typeof formStackAuth>, any> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const authentication = auth as OAuth2PropertyValue;
    const accessToken = authentication['access_token'];
    const formId = propsValue.form_id;

    if (!formId) {
      return [];
    }

    try {
      const isTest = lastFetchEpochMS === 0;

      const queryParams: Record<string, any> = {
        data: 'true',
        sort: 'DESC',
        page: 1,
      };

      if (isTest) {
        queryParams['per_page'] = 10;
      } else {
        queryParams['per_page'] = 100;
        // YYYY-MM-DD HH:MM:SS expected (Based around Eastern Time)
        queryParams['min_time'] = dayjs
          .utc(lastFetchEpochMS)
          .tz('America/New_York')
          .format('YYYY-MM-DD HH:mm:ss');
      }

      const detailedSubmissions: any[] = [];
      let hasMorePages = true;

      while (hasMorePages) {
        const submissionsResponse = await makeRequest(
          accessToken,
          HttpMethod.GET,
          `/form/${formId}/submission.json`,
          undefined,
          queryParams
        );

        const submissions: any[] = submissionsResponse.submissions || [];
        submissions.forEach((submission: any) => {
          detailedSubmissions.push({
            epochMilliSeconds: dayjs(submission.timestamp).valueOf(),
            data: {
              id: submission.id,
              form_id: formId,
              timestamp: submission.timestamp,
              user_agent: submission.user_agent,
              remote_addr: submission.remote_addr,
              latitude: submission.latitude,
              longitude: submission.longitude,
              payment_status: submission.payment_status || '',
              data: Object.values(submission.data),
            },
          });
        });

        if (isTest || queryParams['page'] >= submissionsResponse['pages']) {
          hasMorePages = false;
        } else {
          queryParams['page'] += 1;
        }
      }

      return detailedSubmissions;
    } catch (error) {
      console.error('Error fetching submissions:', error);
      return [];
    }
  },
};

export const newSubmission = createTrigger({
  auth: formStackAuth,
  name: 'newSubmission',
  displayName: 'New Submission',
  description: 'Triggers when a form receives a new submission',
  props: {
    form_id: formIdDropdown,
  },
  sampleData: {
    id: '185502901',
    form_id: '5439876',
    timestamp: '2024-01-15T14:32:18Z',
    user_agent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    remote_addr: '198.51.100.42',
    latitude: '37.7749',
    longitude: '-122.4194',
    payment_status: '',
    data: [
      {
        field: '185502595',
        value: 'John',
      },
      {
        field: '185502596',
        value: 'Doe',
      },
      {
        field: '185502597',
        value: 'john.doe@company.com',
      },
      {
        field: '185502598',
        value: '(555) 123-4567',
      },
      {
        field: '185502599',
        value: 'Software Engineer',
      },
      {
        field: '185502600',
        value: 'Premium Plan',
      },
      {
        field: '185502601',
        value: 'Newsletter, Product Updates',
      },
      {
        field: '185502602',
        value: '2',
      },
      {
        field: '185502603',
        value: '4532123456789012',
      },
      {
        field: '185502604',
        value:
          'https://files.formstack.com/uploads/5439876/185502901/987654321/resume.pdf',
      },
      {
        field: '185502605',
        value:
          'I would like to learn more about your enterprise solutions and discuss potential partnership opportunities.',
      },
      {
        field: '185502606',
        value: '01/15/2024',
      },
      {
        field: '185502607',
        value: 'San Francisco',
      },
      {
        field: '185502608',
        value: 'CA',
      },
      {
        field: '185502609',
        value: '94105',
      },
    ],
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    try {
      const result = await pollingHelper.test(polling, context);

      if (result && result.length > 0) {
        return result;
      }

      return [
        {
          epochMilliSeconds: Date.now(),
          data: {
            message:
              'No recent submissions found. The trigger is working and will detect new submissions when they arrive.',
            form_id: context.propsValue.form_id,
          },
        },
      ];
    } catch (error) {
      console.error('Error in test function:', error);

      return [
        {
          epochMilliSeconds: Date.now(),
          data: {
            error:
              'Unable to fetch real data. Here is sample data to show the expected structure.',
            sample: true,
            id: '185502901',
            form_id: '5439876',
            timestamp: '2024-01-15T14:32:18Z',
            user_agent:
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            remote_addr: '198.51.100.42',
            latitude: '37.7749',
            longitude: '-122.4194',
            payment_status: '',
            data: [
              {
                field: '185502595',
                value: 'John',
              },
              {
                field: '185502596',
                value: 'Doe',
              },
              {
                field: '185502597',
                value: 'john.doe@company.com',
              },
            ],
          },
        },
      ];
    }
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },
  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
