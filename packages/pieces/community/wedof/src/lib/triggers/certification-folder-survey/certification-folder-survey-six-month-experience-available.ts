import { wedofAuth } from '../../..';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { wedofCommon } from '../../common/wedof';

export const certificationFolderSurveySixMonthExperienceAvailable = createTrigger({
  auth: wedofAuth,
  name: 'certificationFolderSurveySixMonthExperienceAvailable',
  displayName: 'Enquête "Situation professionnelle de 6 mois" disponible',
  description: "Se déclenche lorsqu'un une enquête de 6 mois de cursus est disponible",
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    "id": 0,
    "initialExperience": {
      "id": 0,
      "qualification": 0,
      "certificationName": "string",
      "job": "string",
      "companyName": "string",
      "salaryYearly": 0,
      "situation": "string",
      "contractType": "string",
      "executiveStatus": true,
      "startDate": "2019-08-24T14:15:22Z",
      "endDate": "2019-08-24T14:15:22Z",
      "createdOn": "2019-08-24T14:15:22Z",
      "updatedOn": "2019-08-24T14:15:22Z"
    },
    "initialExperienceAnsweredDate": "2019-08-24T14:15:22Z",
    "sixMonthExperience": {
      "id": 0,
      "qualification": 0,
      "certificationName": "string",
      "job": "string",
      "companyName": "string",
      "salaryYearly": 0,
      "situation": "string",
      "contractType": "string",
      "executiveStatus": true,
      "startDate": "2019-08-24T14:15:22Z",
      "endDate": "2019-08-24T14:15:22Z",
      "createdOn": "2019-08-24T14:15:22Z",
      "updatedOn": "2019-08-24T14:15:22Z"
    },
    "sixMonthExperienceAnsweredDate": "2019-08-24T14:15:22Z",
    "sixMonthExperienceStartDate": "2019-08-24T14:15:22Z",
    "longTermExperience": {
      "id": 0,
      "qualification": 0,
      "certificationName": "string",
      "job": "string",
      "companyName": "string",
      "salaryYearly": 0,
      "situation": "string",
      "contractType": "string",
      "executiveStatus": true,
      "startDate": "2019-08-24T14:15:22Z",
      "endDate": "2019-08-24T14:15:22Z",
      "createdOn": "2019-08-24T14:15:22Z",
      "updatedOn": "2019-08-24T14:15:22Z"
    },
    "longTermExperienceAnsweredDate": "2019-08-24T14:15:22Z",
    "longTermExperienceStartDate": "2019-08-24T14:15:22Z",
    "state": "created"
  },

  async onEnable(context) {
    const flows = await context.flows.list();
    const flow = flows.data.find((flow) => flow.id === context.flows.current.id);
    const name = `<a href="${context.webhookUrl.split('/').slice(0, 3).join('/')}/projects/${context.project.id}/flows/${context.flows.current.id}">${flow?.version.displayName}</a>`;

    const message = {
      url: context.webhookUrl,
      events: ['certificationFolderSurvey.sixMonthExperienceAvailable'],
      name: name,
      secret: null,
      enabled: true,
      ignoreSsl: false,
    };

    const id = await context.store.get('_webhookId');

    if (id === null) {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: wedofCommon.baseUrl + '/webhooks',
        body: message,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
          'User-Agent': 'activepieces'
        },
      });

      await context.store.put('_webhookId', response.body.id);
    } else {
      console.log('/////////// webhook already exist ////');
    }
  },

  async onDisable(context) {
    const id = await context.store.get('_webhookId');

    await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: wedofCommon.baseUrl + '/webhooks/' + id,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': context.auth as string,
        'User-Agent': 'activepieces'
      },
    });
    await context.store.delete('_webhookId');
  },
  async run(context) {
    return [context.payload.body];
  },
});
