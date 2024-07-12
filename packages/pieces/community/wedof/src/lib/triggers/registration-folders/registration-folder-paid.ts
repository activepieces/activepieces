import { wedofAuth } from '../../..';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { wedofCommon } from '../../common/wedof';

export const registrationFolderPaid = createTrigger({
  auth: wedofAuth,
  name: 'registrationFolderPaid',
  displayName: 'Dossier de formation payé (acompte ou payé totalement)',
  description: "Se déclenche lorsqu'un dossier de formation est payé",
  props: {},
  sampleData: {
    withPoleEmploi: false,
    attendeeLink: "https://test.wedof.fr/apprenant-12345678901234",
    dataProviderId: null,
    permalink: "https://test.wedof.fr/dossier-formation-12345678901234",
    isAllowActions: true,
    type: "individual",
    lastUpdate: "2024-03-15T14:26:51.842Z",
    attendee: {
      id: 2024,
      lastName: "john",
      firstName: "Doe",
      email: "john.doe@gmail.com",
      phoneNumber: "(323) 853-2456",
      phoneFixed: "0666666666",
      degree: 7,
      degreeTitle: "BAC+5 : grade master, DEA, DESS, ingénieur... (NIVEAU 7)",
      address: {
        id: null,
        city: "string",
        line4: null,
        number: "01",
        country: null,
        postBox: null,
        zipCode: "string",
        roadName: "string",
        roadType: "string",
        idAddress: null,
        residence: null,
        countryCode: null,
        fullAddress: null,
        trainingSite: null,
        corporateName: "M JOHN DOE",
        roadTypeLabel: "string",
        informationSite: null,
        repetitionIndex: null,
        subscriptionSite: null,
        additionalAddress: null,
        repetitionIndexLabel: null,
        reducedMobilityAccessCompliant: null,
        reducedMobilityAccessModalities: null
      },
      dateOfBirth: null,
      nameCityOfBirth: null,
      gender: null,
      birthName: null,
      codeCountryOfBirth: null,
      poleEmploiId: null,
      poleEmploiDpt: null,
      codeCityOfBirth: null,
      firstName2: null,
      firstName3: null,
      nameCountryOfBirth: null,
      poleEmploiRegionCode: null,
      readOnly: false,
      cdcCompliant: false
    },
    state: "accepted",
    attendeeState: "serviceDoneNotDeclared",
    billingState: "notBillable",
    externalId: "12345678901234",
    billId: null,
    billNumber: null,
    amountHtNet: null,
    amountToInvoice: null,
    amountCGU: null,
    amountTtc: null,
    amountHt: null,
    vatHtAmount5: null,
    vatAmount5: null,
    vatHtAmount20: null,
    vatAmount20: null,
    history: {
      serviceDoneDeclaredAttendeeDate: null,
      billedDate: null,
      paidDate: null,
      acceptedDate: "2024-06-16T14:26:51.000Z",
      rejectedWithoutTitulaireSuiteDate: null,
      validatedDate: null,
      inTrainingDate: null,
      terminatedDate: null,
      notProcessedDate: "2024-06-16T14:26:51.000Z",
      refusedByAttendeeDate: null,
      refusedByOrganismDate: null,
      refusedByFinancerDate: null,
      canceledByAttendeeDate: null,
      canceledByOrganismDate: null,
      serviceDoneDeclaredDate: null,
      serviceDoneValidatedDate: null,
      canceledByAttendeeNotRealizedDate: null,
      canceledByFinancerDate: null,
      inControlDate: null,
      releasedDate: null,
      completionRateLastUpdate: null
    },
    files: [],
    notes: "",
    description: "",
    completionRate: null,
    controlState: "notInControl",
    createdOn: "2024-03-15T14:26:51.000Z",
    updatedOn: "2024-06-26T09:42:40.642Z",
    _links: {
      self: {
        href: "/api/registrationFolders/12345678901234"
      },
      validate: {
        href: "/api/registrationFolders/12345678901234/validate"
      },
      inTraining: {
        href: "/api/registrationFolders/12345678901234/inTraining"
      },
      terminate: {
        href: "/api/registrationFolders/12345678901234/terminate"
      },
      serviceDone: {
        href: "/api/registrationFolders/12345678901234/serviceDone"
      },
      refuse: {
        href: "/api/registrationFolders/12345678901234/refuse"
      },
      cancel: {
        href: "/api/registrationFolders/12345678901234/cancel"
      },
      billing: {
        href: "/api/registrationFolders/12345678901234/billing"
      },
      session: {
        href: "/api/sessions/titre_action"
      },
      organism: {
        href: "/api/organisms/12345678901234",
        name: "Organism",
        siret: "12345678901234"
      },
      payments: {
        href: "/api/payments?registrationFolderId=12345678901234"
      },
      trainingAction: {
        href: "/api/trainingActions/titre_action"
      },
      certification: {
        href: "/api/certifications/112713",
        name: "Gérer des projets avec la méthode Agile",
        certifInfo: "112713",
        externalId: "RS5695",
        id: 2,
        enabled: true
      },
      activities: {
        href: "/api/activities/RegistrationFolder/12345678901234"
      }
    },
    tags: [],
    trainingActionInfo: {
      vat: null,
      title: "Titre formation",
      address: {
        id: null
      },
      content: "string",
      sessionId: "Titre session",
      totalExcl: 1075,
      totalIncl: 1290,
      quitReason: null,
      vatExclTax5: null,
      vatInclTax5: null,
      externalLink: "",
      trainingGoal: "string",
      vatExclTax20: 1075,
      vatInclTax20: 1290,
      trainingPaces: [
        "3",
        "1",
        "5"
      ],
      additionalFees: 0,
      expectedResult: "string",
      sessionEndDate: "2024-03-29T00:00:00.000Z",
      weeklyDuration: 14,
      sessionStartDate: "2024-03-28T00:00:00.000Z",
      indicativeDuration: 14,
      teachingModalities: "2",
      trainingCompletionRate: null,
      externalId: "53222292400039_scrum-online-action-v2",
      trainingActionId: "53222292400039_scrum-online-v2/titre_action"
    },
    externalLink: ""
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const name =
      'Activepieces - RegistrationFolderPaid - ' +
      context.webhookUrl.substring(context.webhookUrl.lastIndexOf('/') + 1);

    const message = {
      url: context.webhookUrl,
      events: ['registrationFolderBilling.paid'],
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
