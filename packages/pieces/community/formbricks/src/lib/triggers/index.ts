import { formBricksRegisterTrigger } from './register';

export const triggers = [
  {
    name: 'response_created',
    eventType: 'responseCreated',
    displayName: 'Response Created',
    description: 'Triggers when someone starts answering a survey (a new response is created).',
    aiMetadata: {
      description:
        'Fires once per new Formbricks response, usually after the first answered question, so answers may be partial (finished false). Payload is {webhookId, event, data} where data is the response with answers keyed by question ID.',
    },
    sampleData: sample({ event: 'responseCreated', finished: false }),
  },
  {
    name: 'response_updated',
    eventType: 'responseUpdated',
    displayName: 'Response Updated',
    description: 'Triggers when an existing response gets new or changed answers.',
    aiMetadata: {
      description:
        'Fires each time a Formbricks response gets more answers or is edited, so one respondent can fire it several times. Payload is {webhookId, event, data} with the full response so far.',
    },
    sampleData: sample({ event: 'responseUpdated', finished: false }),
  },
  {
    name: 'response_finished',
    eventType: 'responseFinished',
    displayName: 'Response Finished',
    description: 'Triggers when a respondent completes a survey.',
    aiMetadata: {
      description:
        'Fires once when a Formbricks response is completed (finished true). Payload is {webhookId, event, data} with every answer keyed by question ID. Use it when you only want complete submissions.',
    },
    sampleData: sample({ event: 'responseFinished', finished: true }),
  },
].map((props) => formBricksRegisterTrigger(props));

function sample({ event, finished }: { event: string; finished: boolean }) {
  return {
    webhookId: 'cmvgtidoegbek01qforn8io9i',
    event,
    data: {
      id: 'cmvgtjv4i2ml301ro8la0vpua',
      createdAt: '2026-10-20T15:09:17.010Z',
      updatedAt: '2026-10-20T15:09:17.010Z',
      surveyId: 'cmvgti6ni2lkc01roliy4l0oq',
      displayId: 'cmvgtjqa10b7z01pdsv282we3',
      contact: null,
      contactAttributes: null,
      finished,
      endingId: null,
      data: {
        aptestq1: 'The onboarding was quick and clear.',
      },
      variables: {},
      ttc: {
        _total: 6276.9,
        aptestq1: 6276.9,
      },
      tags: [],
      meta: {
        pagePath: '/s/cmvgti6ni2lkc01roliy4l0oq',
        url: 'https://app.formbricks.com/s/cmvgti6ni2lkc01roliy4l0oq',
        locale: 'en-US',
        timezone: 'Asia/Amman',
        userAgent: {
          browser: 'Chrome',
          os: 'Windows',
          device: 'desktop',
        },
        country: 'JO',
      },
      singleUseId: null,
      language: null,
      survey: {
        title: 'Customer feedback',
        type: 'link',
        status: 'inProgress',
        createdAt: '2026-10-20T15:07:58.638Z',
        updatedAt: '2026-10-20T15:07:58.638Z',
      },
    },
  };
}
