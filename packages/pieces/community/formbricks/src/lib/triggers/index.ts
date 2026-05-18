import { formBricksRegisterTrigger } from './register';

export const triggers = [
  {
    name: 'response_created',
    eventType: 'responseCreated',
    displayName: 'Response Created',
    description: 'Triggered when a new response is created.',
    sampleData: {
      webhookId: 'cljwxvjos0003qhnvj2jg4k5i',
      event: 'responseCreated',
      data: {
        id: 'cljwy2m8r0001qhclco1godnu',
        createdAt: '2023-07-10T14:14:17.115Z',
        updatedAt: '2023-07-10T14:14:17.115Z',
        surveyId: 'cljsf3d7a000019cv9apt2t27',
        finished: false,
        data: {
          qumbk3fkr6cky8850bvvq5z1: 'Executive',
        },
        meta: {
          userAgent: {
            os: 'Mac OS',
            browser: 'Chrome',
          },
        },
        personAttributes: {
          email: 'test@web.com',
          userId: 'THIS-IS-A-VERY-LONG-USER-ID-FOR-TESTING',
        },
        person: {
          id: 'cljold01t0000qh8ewzigzmjk',
          attributes: {
            email: 'test@web.com',
            userId: 'THIS-IS-A-VERY-LONG-USER-ID-FOR-TESTING',
          },
          createdAt: '2023-07-04T17:56:17.154Z',
          updatedAt: '2023-07-04T17:56:17.154Z',
        },
        notes: [],
        tags: [],
      },
    },
  },
  {
    name: 'response_updated',
    eventType: 'responseUpdated',
    displayName: 'Response Updated',
    description: 'Triggered when a new response is updated.',
    sampleData: {
      webhookId: 'cljwxvjos0003qhnvj2jg4k5i',
      event: 'responseUpdated',
      data: {
        id: 'cljwy2m8r0001qhclco1godnu',
        createdAt: '2023-07-10T14:14:17.115Z',
        updatedAt: '2023-07-10T14:14:17.115Z',
        surveyId: 'cljsf3d7a000019cv9apt2t27',
        finished: false,
        data: {
          qumbk3fkr6cky8850bvvq5z1: 'Executive',
        },
        meta: {
          userAgent: {
            os: 'Mac OS',
            browser: 'Chrome',
          },
        },
        personAttributes: {
          email: 'test@web.com',
          userId: 'THIS-IS-A-VERY-LONG-USER-ID-FOR-TESTING',
        },
        person: {
          id: 'cljold01t0000qh8ewzigzmjk',
          attributes: {
            email: 'test@web.com',
            userId: 'THIS-IS-A-VERY-LONG-USER-ID-FOR-TESTING',
          },
          createdAt: '2023-07-04T17:56:17.154Z',
          updatedAt: '2023-07-04T17:56:17.154Z',
        },
        notes: [],
        tags: [],
      },
    },
  },
  {
    name: 'response_finished',
    eventType: 'responseFinished',
    displayName: 'Response Finished',
    description: 'Triggered when a new response is finished.',
    sampleData: {
      webhookId: 'cljwxvjos0003qhnvj2jg4k5i',
      event: 'responseFinished',
      data: {
        id: 'cljwy2m8r0001qhclco1godnu',
        createdAt: '2023-07-10T14:14:17.115Z',
        updatedAt: '2023-07-10T14:14:17.115Z',
        surveyId: 'cljsf3d7a000019cv9apt2t27',
        finished: false,
        data: {
          qumbk3fkr6cky8850bvvq5z1: 'Executive',
        },
        meta: {
          userAgent: {
            os: 'Mac OS',
            browser: 'Chrome',
          },
        },
        personAttributes: {
          email: 'test@web.com',
          userId: 'THIS-IS-A-VERY-LONG-USER-ID-FOR-TESTING',
        },
        person: {
          id: 'cljold01t0000qh8ewzigzmjk',
          attributes: {
            email: 'test@web.com',
            userId: 'THIS-IS-A-VERY-LONG-USER-ID-FOR-TESTING',
          },
          createdAt: '2023-07-04T17:56:17.154Z',
          updatedAt: '2023-07-04T17:56:17.154Z',
        },
        notes: [],
        tags: [],
      },
    },
  },
].map((props) => formBricksRegisterTrigger(props));
