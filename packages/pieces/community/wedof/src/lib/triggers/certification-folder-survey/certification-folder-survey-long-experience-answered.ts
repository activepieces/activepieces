import { wedofAuth } from '../../..';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const certificationFolderSurveyLongTermExperienceAnswered =
  createTrigger({
    auth: wedofAuth,
    name: 'certificationFolderSurveyLongTermExperienceAnswered',
    displayName: 'Enquête "Situation professionnelle au moins un an" répondue',
    description:
      "Se déclenche lorsqu'un une enquête de au moins un an de cursus est répondue",
    type: TriggerStrategy.WEBHOOK,
    props: {},
    sampleData: {
      id: 0,
      initialExperience: {
        id: 0,
        qualification: 0,
        certificationName: 'string',
        job: 'string',
        companyName: 'string',
        salaryYearly: 0,
        situation: 'string',
        contractType: 'string',
        executiveStatus: true,
        startDate: '2019-08-24T14:15:22Z',
        endDate: '2019-08-24T14:15:22Z',
        createdOn: '2019-08-24T14:15:22Z',
        updatedOn: '2019-08-24T14:15:22Z',
      },
      initialExperienceAnsweredDate: '2019-08-24T14:15:22Z',
      sixMonthExperience: {
        id: 0,
        qualification: 0,
        certificationName: 'string',
        job: 'string',
        companyName: 'string',
        salaryYearly: 0,
        situation: 'string',
        contractType: 'string',
        executiveStatus: true,
        startDate: '2019-08-24T14:15:22Z',
        endDate: '2019-08-24T14:15:22Z',
        createdOn: '2019-08-24T14:15:22Z',
        updatedOn: '2019-08-24T14:15:22Z',
      },
      sixMonthExperienceAnsweredDate: '2019-08-24T14:15:22Z',
      sixMonthExperienceStartDate: '2019-08-24T14:15:22Z',
      longTermExperience: {
        id: 0,
        qualification: 0,
        certificationName: 'string',
        job: 'string',
        companyName: 'string',
        salaryYearly: 0,
        situation: 'string',
        contractType: 'string',
        executiveStatus: true,
        startDate: '2019-08-24T14:15:22Z',
        endDate: '2019-08-24T14:15:22Z',
        createdOn: '2019-08-24T14:15:22Z',
        updatedOn: '2019-08-24T14:15:22Z',
      },
      longTermExperienceAnsweredDate: '2019-08-24T14:15:22Z',
      longTermExperienceStartDate: '2019-08-24T14:15:22Z',
      state: 'created',
    },

    async onEnable(context) {
      const flows = await context.flows.list();
      const flow = flows.data.find(
        (flow) => flow.id === context.flows.current.id
      );
      const name = `<a href="${context.webhookUrl
        .split('/')
        .slice(0, 3)
        .join('/')}/projects/${context.project.id}/flows/${
        context.flows.current.id
      }">${flow?.version.displayName}</a>`;

      await wedofCommon.handleWebhookSubscription(
        ['certificationFolderSurvey.longTermExperienceAnswered'],
        context,
        name
      );
    },

    async onDisable(context) {
      const id = await context.store.get('_webhookId');
      if (id !== null && id !== undefined) {
        await wedofCommon.unsubscribeWebhook(
          id as string,
          context.auth as string
        );
        await context.store.delete('_webhookId');
      }
    },

    async run(context) {
      return [context.payload.body];
    },
  });
