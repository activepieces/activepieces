import { wedofAuth } from '../../..';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const certificationFolderSuccess = createTrigger({
  auth: wedofAuth,
  name: 'certificationfolderSuccess',
  displayName: 'Dossier de certification réussi',
  description:
    "Se déclenche lorsqu'un dossier de formation passe à l'état réussi",
  props: {},
  sampleData: {
    attendeeLink: 'https://test.wedof.fr/candidat-1234-123456789',
    permalink: 'https://test.wedof.fr/dossier-certification-1234',
    addToPassportLink:
      'https://test.wedof.fr/candidat-1234-123456789-passeport',
    id: 2024,
    examinationDate: null,
    examinationEndDate: null,
    examinationPlace: null,
    issueDate: null,
    expirationDate: null,
    detailedResult: null,
    digitalProofLink: null,
    state: 'registered',
    files: [
      {
        permalink: 'https://test.wedof.fr/candidat-1234-123456789-document-4',
        id: 40,
        typeId: 4,
        fileName: 'OUHAHAH',
        link: 'https://community.n8n.io/t/declarative-style-nodes-how-to-send-multipart-form-data/26416',
        fileType: 'link',
        state: 'valid',
        comment: null,
        generationState: 'notGenerated',
        createdOn: '2024-06-20T13:48:12.000Z',
        updatedOn: '2024-06-26T14:05:12.123Z',
        _links: {
          certificationFolder: {
            href: '/api/certificationFolders/1234',
          },
        },
      },
    ],
    comment: '',
    history: {
      toTakeDate: null,
      failedDate: null,
      successDate: null,
      toRegisterDate: '2024-06-18T12:31:12.000Z',
      registeredDate: '2024-06-18T12:31:12.000Z',
      abortedDate: null,
      toControlDate: null,
      refusedDate: null,
      toRetakeDate: null,
      inTrainingStartedDate: null,
      inTrainingEndedDate: null,
    },
    stateLastUpdate: '2024-06-18T12:31:12.000Z',
    attendee: {
      id: 2024,
      lastName: 'doe',
      firstName: 'john',
      email: 'john.doe@gmail.com',
      phoneNumber: '+1.112.666.0606',
      phoneFixed: null,
      degree: 7,
      degreeTitle: 'BAC+5 : grade master, DEA, DESS, ingénieur... (NIVEAU 7)',
      address: {
        id: null,
        city: 'string',
        line4: null,
        number: '9',
        country: null,
        postBox: null,
        zipCode: 'string',
        roadName: 'string',
        roadType: 'ALL',
        idAddress: null,
        residence: null,
        countryCode: null,
        fullAddress: null,
        trainingSite: null,
        corporateName: 'M JOHN DOE',
        roadTypeLabel: 'string',
        informationSite: null,
        repetitionIndex: null,
        subscriptionSite: null,
        additionalAddress: null,
        repetitionIndexLabel: null,
        reducedMobilityAccessCompliant: null,
        reducedMobilityAccessModalities: null,
      },
      dateOfBirth: null,
      nameCityOfBirth: null,
      gender: null,
      birthName: null,
      codeCountryOfBirth: null,
      employmentStatus: null,
      codeCityOfBirth: null,
      firstName2: null,
      firstName3: null,
      nameCountryOfBirth: null,
      readOnly: false,
      externalId: null,
      lastLogin: null,
      cdcCompliant: false,
    },
    certifiedData: true,
    examinationType: 'A_DISTANCE',
    type: 'OF',
    gradePass: null,
    examinationCenterZipCode: null,
    europeanLanguageLevel: null,
    accessModality: null,
    verbatim: null,
    optionName: null,
    accessModalityVae: null,
    cdcState: 'notExported',
    cdcToExport: true,
    cdcCompliant: false,
    enrollmentDate: null,
    amountHt: null,
    cdcTechnicalId: null,
    inTraining: false,
    cdcExcluded: false,
    externalId: '1234-1234567890',
    certificateId: null,
    createdOn: '2024-06-18T12:31:12.000Z',
    updatedOn: '2024-06-26T14:05:12.121Z',
    _links: {
      self: {
        href: '/api/certificationFolders/1234-1234567890',
      },
      register: {
        href: '/api/certificationFolders/1234-1234567890/register',
      },
      refuse: {
        href: '/api/certificationFolders/1234-1234567890/refuse',
      },
      take: {
        href: '/api/certificationFolders/1234-1234567890/take',
      },
      control: {
        href: '/api/certificationFolders/1234-1234567890/control',
      },
      retake: {
        href: '/api/certificationFolders/1234-1234567890/retake',
      },
      fail: {
        href: '/api/certificationFolders/1234-1234567890/fail',
      },
      success: {
        href: '/api/certificationFolders/1234-1234567890/success',
      },
      abort: {
        href: '/api/certificationFolders/1234-1234567890/abort',
      },
      certification: {
        href: '/api/certifications/123456',
        name: 'titre certification',
        certifInfo: '123456',
        externalId: 'RS12345',
        id: 2,
        enabled: true,
      },
      registrationFolder: {
        href: '/api/registrationFolders/1234567890',
        externalId: '1234567890',
        type: 'individual',
        state: 'accepted',
      },
      partner: {
        href: '/api/organisms/123456789',
        name: 'organism',
        siret: '1234567890',
      },
      certifier: {
        href: '/api/organisms/1234567890',
        name: 'organism',
        siret: '1234567890',
      },
      activities: {
        href: '/api/activities/CertificationFolder/1234',
      },
    },
    tags: [],
  },
  type: TriggerStrategy.WEBHOOK,

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
      ['certificationFolder.success'],
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