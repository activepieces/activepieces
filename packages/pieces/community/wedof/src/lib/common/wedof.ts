import { Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const wedofCommon = {
  baseUrl: 'https://www.wedof.fr/api',
  host: 'https://www.wedof.fr/api',

  subscribeWebhook: async (
    events: string[],
    webhookUrl: string,
    apiKey: string,
    name: string
  ) => {
    const request = {
      method: HttpMethod.POST,
      url: `${wedofCommon.baseUrl}/webhooks`,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
        'User-Agent': 'activepieces',
      },
      body: {
        url: webhookUrl,
        events: events,
        name: name,
        secret: null,
        enabled: true,
        ignoreSsl: false,
      },
    };
    const response = await httpClient.sendRequest(request);
    if (response.status !== 201) {
      let errorMessage = `Échec de la création du webhook. Code de statut reçu: ${response.status}`;
      if (response.body && typeof response.body === 'object') {
        const errorBody = response.body as any;
        if (errorBody.detail) {
          errorMessage += `. Erreur: ${errorBody.detail}`;
        }
        if (errorBody.violations && Array.isArray(errorBody.violations)) {
          const violations = errorBody.violations
            .map((v: any) => `${v.propertyPath}: ${v.title}`)
            .join(', ');
          errorMessage += `. Détails: ${violations}`;
        }
        if (!errorBody.detail && !errorBody.violations) {
          errorMessage += `. Réponse: ${JSON.stringify(response.body)}`;
        }
      }
      throw new Error(errorMessage);
    }
    return response.body.id;
  },

  handleWebhookSubscription: async (
    events: string[],
    context: any,
    name: string
  ) => {
    const id = await context.store.get('_webhookId');
    if (id === null) {
      try {
        const webhookId = await wedofCommon.subscribeWebhook(
          events,
          context.webhookUrl,
          context.auth as string,
          name
        );
        await context.store.put('_webhookId', webhookId);
      } catch (error) {
        console.error('Erreur lors de la création du webhook:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Erreur inconnue';
        throw new Error(`Échec de la création du webhook: ${errorMessage}`);
      }
    } else {
      console.log('/////////// webhook already exist ////');
    }
  },

  unsubscribeWebhook: async (webhookId: string, apiKey: string) => {
    const request = {
      method: HttpMethod.DELETE,
      url: `${wedofCommon.baseUrl}/webhooks/${webhookId}`,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
        'User-Agent': 'activepieces',
      },
    };
    return await httpClient.sendRequest(request);
  },

  state: Property.StaticMultiSelectDropdown({
    displayName: 'Etat du dossier de formation',
    required: false,
    options: {
      options: [
        {
          value: 'notProcessed',
          label: 'Non traité',
        },
        {
          value: 'validated',
          label: 'Validé',
        },
        {
          value: 'waitingAcceptation',
          label: "Validé (En cours d'instruction par France Travail)",
        },
        {
          value: 'accepted',
          label: 'Accepté',
        },
        {
          value: 'inTraining',
          label: 'En formation',
        },
        {
          value: 'terminated',
          label: 'Sortie de formation',
        },
        {
          value: 'serviceDoneDeclared',
          label: 'Service fait déclaré',
        },
        {
          value: 'serviceDoneValidated',
          label: 'Service fait validé',
        },
        {
          value: 'canceledByAttendee',
          label: 'Annulé (par le titulaire)',
        },
        {
          value: 'canceledByAttendeeNotRealized',
          label: 'Annulation titulaire (non réalisé)',
        },
        {
          value: 'canceledByOrganism',
          label: "Annulé (par l'organisme)",
        },
        {
          value: 'canceledByFinancer',
          label: 'Annulé (par le financeur)',
        },
        {
          value: 'rejectedWithoutTitulaireSuite',
          label: 'Annulé sans suite',
        },
        {
          value: 'refusedByAttendee',
          label: 'Refus titulaire',
        },
        {
          value: 'refusedByOrganism',
          label: "Refusé (par l'organisme)",
        },
        {
          value: 'refusedByFinancer',
          label: 'Refusé (par le financeur)',
        },
      ],
      disabled: false,
    },
  }),

  partnershipState: Property.StaticDropdown({
    displayName: 'État du partenariat de certification',
    required: false,
    options: {
      disabled: false,
      options: [
        {
          value: 'processing',
          label: 'Demande en traitement',
        },
        {
          value: 'active',
          label: 'Partenariat actif',
        },
        {
          value: 'aborted',
          label: 'Demande abondonnée',
        },
        {
          value: 'refused',
          label: 'Demande refusée',
        },
        {
          value: 'suspended',
          label: 'Partenariat suspendu',
        },
        {
          value: 'revoked',
          label: 'Partenariat révoqué',
        },
      ],
    },
  }),

  habilitation: Property.StaticDropdown({
    displayName: 'Habilitation du partenaire',
    required: false,
    options: {
      disabled: false,
      options: [
        {
          value: 'evaluate',
          label: 'Habilitation pour organiser l’évaluation',
        },
        {
          value: 'train',
          label: 'Habilitation pour former',
        },
        {
          value: 'train_evaluate',
          label: 'Habilitation pour former et organiser l’évaluation',
        },
      ],
    },
  }),

  compliance: Property.StaticDropdown({
    displayName: 'Conformité',
    required: false,
    options: {
      options: [
        { label: 'Conforme', value: 'compliant' },
        { label: 'Partiellement Conforme', value: 'partiallyCompliant' },
        { label: 'Non Conforme', value: 'nonCompliant' },
      ],
    },
  }),

  events: Property.StaticMultiSelectDropdown({
    displayName: 'Événement sur le dossier de formation',
    required: true,
    options: {
      options: [
        {
          value: 'registrationFolder.created',
          label: 'Créé',
        },
        {
          value: 'registrationFolder.updated',
          label: 'Mis à jour',
        },
        {
          value: 'registrationFolder.notProcessed',
          label: 'Non traité',
        },
        {
          value: 'registrationFolder.validated',
          label: 'Validé',
        },
        {
          value: 'registrationFolder.waitingAcceptation',
          label: "Validé (En cours d'instruction par France Travail)",
        },
        {
          value: 'registrationFolder.accepted',
          label: 'Accepté',
        },
        {
          value: 'registrationFolder.inTraining',
          label: 'En formation',
        },
        {
          value: 'registrationFolder.terminated',
          label: 'Sortie de formation',
        },
        {
          value: 'registrationFolder.serviceDoneDeclared',
          label: 'Service fait déclaré',
        },
        {
          value: 'registrationFolder.serviceDoneValidated',
          label: 'Service fait validé',
        },
        {
          value: 'registrationFolderFile.added',
          label: 'Document ajouté',
        },
        {
          value: 'registrationFolderFile.updated',
          label: 'Document mis a jour',
        },
        {
          value: 'registrationFolderFile.deleted',
          label: 'Document supprimé',
        },
        {
          value: 'registrationFolderFile.valid',
          label: 'Document validé',
        },
        {
          value: 'registrationFolderFile.refused',
          label: 'Document refusé',
        },
        {
          value: 'registrationFolderFile.toReview',
          label: 'Document à vérifier',
        },
        {
          value: 'registrationFolder.canceledByAttendee',
          label: 'Annulé (par le titulaire)',
        },
        {
          value: 'registrationFolder.canceledByAttendeeNotRealized',
          label: 'Annulation titulaire (non réalisé)',
        },
        {
          value: 'registrationFolder.canceledByOrganism',
          label: "Annulé (par l'organisme)",
        },
        {
          value: 'registrationFolder.canceledByFinancer',
          label: 'Annulé (par le financeur)',
        },
        {
          value: 'registrationFolder.rejectedWithoutTitulaireSuite',
          label: 'Annulé sans suite',
        },
        {
          value: 'registrationFolder.refusedByAttendee',
          label: 'Refus titulaire',
        },
        {
          value: 'registrationFolder.refusedByOrganism',
          label: "Refusé (par l'organisme)",
        },
        {
          value: 'registrationFolder.refusedByFinancer',
          label: 'Refusé (par le financeur)',
        },
        {
          value: 'registrationFolder.refusedByFinancer',
          label: 'Refusé (par le financeur)',
        },
        {
          value: 'registrationFolderBilling.notBillable',
          label: 'Pas facturable',
        },
        {
          value: 'registrationFolderBilling.depositWait',
          label: 'Acompte en attente de dépot',
        },
        {
          value: 'registrationFolderBilling.depositPaid',
          label: 'Acompte déposé',
        },
        {
          value: 'registrationFolderBilling.toBill',
          label: 'A facturer',
        },
        {
          value: 'registrationFolderBilling.billed',
          label: 'Facturé',
        },
        {
          value: 'registrationFolderBilling.paid',
          label: 'Payé',
        },
      ],
      disabled: false,
    },
  }),

  certificationEvents: Property.StaticMultiSelectDropdown({
    displayName: 'Événement sur le dossier de certification',
    required: true,
    options: {
      options: [
        {
          value: 'certificationFolder.created',
          label: 'Créé',
        },
        {
          value: 'certificationFolder.updated',
          label: 'Mis à jour',
        },
        {
          value: 'certificationFolder.accrochageOk',
          label: 'Accrochage réussi',
        },
        {
          value: 'certificationFolder.accrochageKo',
          label: 'Accrochage en erreur',
        },
        {
          value: 'certificationFolder.toRegister',
          label: 'À enregistrer',
        },
        {
          value: 'certificationFolder.registered',
          label: 'Enregistré',
        },
        {
          value: 'certificationFolder.toTake',
          label: 'Prêt à passer',
        },
        {
          value: 'certificationFolder.toControl',
          label: 'À contrôler',
        },
        {
          value: 'certificationFolder.success',
          label: 'Réussi',
        },
        {
          value: 'certificationFolder.refused',
          label: 'Refusé',
        },
        {
          value: 'certificationFolder.failed',
          label: 'Échoué',
        },
        {
          value: 'certificationFolder.aborted',
          label: 'Abandonné',
        },
        {
          value: 'certificationFolder.inTrainingStarted',
          label: 'Formation démarrée',
        },
        {
          value: 'certificationFolder.inTrainingEnded',
          label: 'Formation terminée',
        },
      ],
      disabled: false,
    },
  }),

  forceMajeureAbsence: Property.StaticDropdown({
    displayName: 'Absence pour raison de force majeure',
    description: "Si absence pour raison de force majeure, 'Oui', sinon 'Non'",
    required: false,
    defaultValue: false,
    options: {
      options: [
        {
          value: true,
          label: 'Oui',
        },
        {
          value: false,
          label: 'Non',
        },
      ],
      disabled: false,
    },
  }),

  europeanLanguageLevel: Property.StaticDropdown({
    displayName: 'Nomenclature européeenne pour les certifications de langues',
    required: false,
    defaultValue: null,
    options: {
      options: [
        { label: 'C2', value: 'C2' },
        { label: 'C1', value: 'C1' },
        { label: 'B2', value: 'B2' },
        { label: 'B1', value: 'B1' },
        { label: 'A2', value: 'A2' },
        { label: 'A1', value: 'A1' },
        { label: 'INSUFFISANT', value: 'INSUFFISANT' },
      ],
      disabled: false,
    },
  }),

  gradePass: Property.StaticDropdown({
    displayName: 'Ajoute une mention au dossier de certification',
    required: false,
    defaultValue: null,
    options: {
      options: [
        { label: 'SANS MENTION', value: 'SANS_MENTION' },
        { label: 'MENTION ASSEZ BIEN', value: 'MENTION_ASSEZ_BIEN' },
        { label: 'MENTION BIEN', value: 'MENTION_BIEN' },
        { label: 'MENTION TRES BIEN', value: 'MENTION_TRES_BIEN' },
        {
          label: 'MENTION TRES BIEN AVEC FELICITATIONS',
          value: 'MENTION_TRES_BIEN_AVEC_FELICITATIONS_DU_JURY',
        },
      ],
      disabled: false,
    },
  }),

  examinationType: Property.StaticDropdown({
    displayName: "Type de passage de l'examen",
    required: false,
    defaultValue: null,
    options: {
      options: [
        {
          value: 'A_DISTANCE',
          label: 'À distance',
        },
        {
          value: 'EN_PRESENTIEL',
          label: 'En présentiel',
        },
        {
          value: 'MIXTE',
          label: 'Mixte',
        },
      ],
      disabled: false,
    },
  }),

  controlState: Property.StaticMultiSelectDropdown({
    displayName: 'Etat de controle',
    description:
      "Permet de n'obtenir que les dossiers dans l'état de contrôle considéré",
    required: false,
    options: {
      options: [
        {
          value: 'notInControl',
          label: 'Aucun contrôle',
        },
        {
          value: 'inControl',
          label: 'En cours de contrôle',
        },
        {
          value: 'released',
          label: 'Contrôle terminé',
        },
      ],
      disabled: false,
    },
  }),

  certificationFolderState: Property.StaticMultiSelectDropdown({
    displayName: 'État du dossier de certification',
    required: false,
    options: {
      options: [
        {
          label: 'Tous',
          value: 'all',
        },
        {
          label: 'À enregistrer',
          value: 'toRegister',
        },
        {
          label: 'Enregistré',
          value: 'registered',
        },
        {
          label: 'Prêt à passer',
          value: 'toTake',
        },
        {
          label: 'À contrôler',
          value: 'toControl',
        },
        {
          label: 'Réussi',
          value: 'success',
        },
        {
          label: 'À repasser',
          value: 'toRetake',
        },
        {
          label: 'Échoué',
          value: 'failed',
        },
        {
          label: 'Refusé',
          value: 'refused',
        },
        {
          label: 'Abandonné',
          value: 'aborted',
        },
        {
          label: 'À enregistrer',
          value: 'toRegister',
        },
      ],
      disabled: false,
    },
  }),

  billingState: Property.StaticMultiSelectDropdown({
    displayName: 'État de facturation',
    required: false,
    options: {
      options: [
        {
          label: 'Tous',
          value: 'all',
        },
        {
          label: 'Pas facturable',
          value: 'notBillable',
        },
        {
          label: 'En attente du virement',
          value: 'depositWait',
        },
        {
          label: 'Virement effectué',
          value: 'depositPaid',
        },
        {
          label: 'A facturer',
          value: 'toBill',
        },
        {
          label: 'Facturé',
          value: 'billed',
        },
        {
          label: 'Payé',
          value: 'paid',
        },
      ],
      disabled: false,
    },
  }),

  type: Property.StaticMultiSelectDropdown({
    displayName: 'Financement',
    required: false,
    options: {
      options: [
        {
          label: 'Tous',
          value: 'all',
        },
        {
          label: 'CPF',
          value: 'cpf',
        },
        {
          label: 'Kairos (AIF)',
          value: 'kairosAif',
        },
        {
          label: 'OPCO',
          value: 'opco',
        },
        {
          label: 'Entreprise',
          value: 'company',
        },
        {
          label: 'Autofinancement',
          value: 'individual',
        },
        {
          label: 'Pôle Emploi (Autres)',
          value: 'poleEmploi',
        },
      ],
      disabled: false,
    },
  }),

  period: Property.StaticDropdown({
    displayName: 'Période',
    required: false,
    defaultValue: null,
    options: {
      options: [
        {
          label: 'Personnalisée',
          value: 'custom',
        },
        {
          label: 'Demain',
          value: 'tomorrow',
        },
        {
          label: "Aujourd'hui",
          value: 'today',
        },
        {
          label: 'Hier',
          value: 'yesterday',
        },
        {
          label: '7 derniers jours',
          value: 'rollingWeek',
        },
        {
          label: '7 prochains jours',
          value: 'rollingWeekFuture',
        },
        {
          label: 'Semaine prochaine',
          value: 'nextWeek',
        },
        {
          label: 'Semaine précédente',
          value: 'previousWeek',
        },
        {
          label: 'Semaine courante',
          value: 'currentWeek',
        },
        {
          label: '30 derniers jours',
          value: 'rollingMonth',
        },
        {
          label: '30 prochains jours',
          value: 'rollingMonthFuture',
        },
        {
          label: 'Mois prochain',
          value: 'nextMonth',
        },
        {
          label: 'Mois précédent',
          value: 'previousMonth',
        },
        {
          label: 'Mois courant',
          value: 'currentMonth',
        },
        {
          label: '12 derniers mois',
          value: 'rollingYear',
        },
        {
          label: '12 prochains mois',
          value: 'rollingYearFuture',
        },
        {
          label: 'Année prochaine',
          value: 'nextYear',
        },
        {
          label: 'Année précédente',
          value: 'previousYear',
        },
        {
          label: 'Année courante',
          value: 'currentYear',
        },
        {
          label: 'Période de facturation Wedof en cours',
          value: 'wedofInvoice',
        },
      ],
      disabled: false,
    },
  }),

  filterOnStateDate: Property.StaticDropdown({
    displayName: '(Période) Basé sur la date de',
    required: true,
    defaultValue: 'lastUpdate',
    options: {
      disabled: false,
      options: [
        {
          label: 'Date de mise à jour',
          value: 'lastUpdate',
        },
        { 
          label: 'Dernière mise à jour', 
          value: 'updatedOn' },
        {
          label: 'Date de Création',
          value: 'createdOn',
        },
        {
          label: 'Passage à Non Traité',
          value: 'notProcessedDate',
        },
        {
          label: 'Passage à Validé',
          value: 'validatedDate',
        },
        {
          label: 'Passage à Accepter',
          value: 'acceptedDate',
        },
        {
          label: 'Passage à Entrer en formation',
          value: 'inTrainingDate',
        },
        {
          label: 'Passage à Sortie de formation',
          value: 'terminatedDate',
        },
        {
          label: 'Passage à Service fait Déclaré',
          value: 'serviceDoneDeclaredDate',
        },
        {
          label: 'Passage à Service fait Validé',
          value: 'serviceDoneValidatedDate',
        },
        {
          label: 'Passage à Facturer',
          value: 'billedDate',
        },
        {
          label: 'Passage à Refus titulaire',
          value: 'refusedByAttendeeDate',
        },
        {
          label: "Passage à Refusé (par l'organisme)",
          value: 'refusedByOrganismDate',
        },
        {
          label: 'Passage à Annulé (parle titulaire)',
          value: 'canceledByAttendeeDate',
        },
        {
          label: "Passage à Annulé (par l'organisme)",
          value: 'canceledByOrganismDate',
        },
        {
          label: 'Passage à Annulation titulaire (non réalisé)',
          value: 'canceledByAttendeeNotRealizedDate',
        },
        {
          label: 'Passage à Annulé sans suite',
          value: 'rejectedWithoutTitulaireSuiteDate',
        },
        {
          label: 'Date de début de session',
          value: 'sessionStartDate',
        },
        {
          label: 'Date de fin de session',
          value: 'sessionEndDate',
        },
      ],
    },
  }),
  filterOnStateDateFuture: Property.StaticDropdown({
    displayName: '(Période) Basé sur la date de',
    required: true,
    defaultValue: 'sessionStartDate',
    options: {
      disabled: false,
      options: [
        {
          label: 'Date de début de session',
          value: 'sessionStartDate',
        },
        {
          label: 'Date de fin de session',
          value: 'sessionEndDate',
        },
        {
          label: 'Date prévisionnelle de paiment',
          value: 'paymentScheduledDate',
        },
      ],
    },
  }),

  filterOnStateDateCf: Property.StaticDropdown({
    displayName: '(Période) Basé sur la date de',
    required: true,
    defaultValue: 'stateLastUpdate',
    options: {
      disabled: false,
      options: [
        { 
          label: 'Dernièr changement d’état', 
          value: 'stateLastUpdate' },
        { 
          label: 'Dernière mise à jour', 
          value: 'updatedOn' },
        { 
          label: 'Passage à À prendre en charge', 
          value: 'toTakeDate' },
        { 
          label: 'Passage à À reprogrammer', 
          value: 'toRetakeDate' },
        { 
          label: 'Passage à À contrôler', 
          value: 'toControlDate' },
        { 
          label: 'Passage à Échec', 
          value: 'failedDate' },
        { 
          label: 'Passage à Succès', 
          value: 'successDate' },
        { 
          label: 'Passage à À inscrire', 
          value: 'toRegisterDate' },
        { 
          label: 'Passage à Enregistrer', 
          value: 'registeredDate' },
        { 
          label: 'Passage à Refusé', 
          value: 'refusedDate' },
        { 
          label: 'Passage à Abandonné', 
          value: 'abortedDate' },
        {
          label: 'Passage à Non traité',
          value: 'notProcessedRegistrationFolderStateDate',
        },
        {
          label: 'Passage à Validé',
          value: 'validatedRegistrationFolderStateDate',
        },
        {
          label: 'Passage à Accepté',
          value: 'acceptedRegistrationFolderStateDate',
        },
        {
          label: 'Passage à En formation',
          value: 'inTrainingRegistrationFolderStateDate',
        },
        {
          label: 'Passage à Sortie de formation',
          value: 'terminatedRegistrationFolderStateDate',
        },
        {
          label: 'Passage à Service fait déclaré',
          value: 'serviceDoneDeclaredRegistrationFolderStateDate',
        },
        {
          label: 'Passage à Service fait validé',
          value: 'serviceDoneValidatedRegistrationFolderStateDate',
        },
        {
          label: 'Passage à À facturer',
          value: 'billedRegistrationFolderStateDate',
        },
        {
          label: 'Passage à Refusé par le titulaire',
          value: 'refusedByAttendeeRegistrationFolderStateDate',
        },
        {
          label: 'Passage à Refusé par l’organisme',
          value: 'refusedByOrganismRegistrationFolderStateDate',
        },
        {
          label: 'Passage à Annulé par le titulaire',
          value: 'canceledByAttendeeRegistrationFolderStateDate',
        },
        {
          label: 'Passage à Annulé par l’organisme',
          value: 'canceledByOrganismRegistrationFolderStateDate',
        },
        {
          label: 'Passage à Annulation non réalisée (titulaire)',
          value: 'canceledByAttendeeNotRealizedRegistrationFolderStateDate',
        },
        {
          label: 'Passage à Annulé sans suite',
          value: 'rejectedWithoutTitulaireSuiteRegistrationFolderStateDate',
        },
        {
          label: 'Date de début de session',
          value: 'sessionStartDateRegistrationFolderDate',
        },
        {
          label: 'Date de fin de session',
          value: 'sessionEndDateRegistrationFolderDate',
        },
        { label: 'Facturable par WEDOF', value: 'wedofInvoice' },
        { label: "Date d'inscription", value: 'enrollmentDate' },
        { label: "Date début de l'examen", value: 'examinationDate' },
        { label: "Date fin de l'examen", value: 'examinationEndDate' },
      ],
    },
  }),

  filterOnStateDateFutureCf: Property.StaticDropdown({
    displayName: '(Période) Basé sur la date de',
    required: true,
    options: {
      disabled: false,
      options: [
        {
          label: "Date d'inscription",
          value: 'enrollmentDate',
        },
        {
          label: "Date début de l'examen",
          value: 'examinationDate',
        },
        {
          label: "Date fin de l'examen",
          value: 'examinationEndDate',
        },
      ],
    },
  }),

  sort: Property.StaticDropdown({
    displayName: 'Tri sur critère',
    required: true,
    defaultValue: 'stateLastUpdate',
    options: {
      disabled: false,
      options: [
        {
          label: "Date du dernier changement d'état",
          value: 'stateLastUpdate',
        },
        {
          label: 'Date du dernier dossier mis à réussi',
          value: 'successDate',
        },
        {
          label: 'ID de base de donnée',
          value: 'id',
        },
      ],
    },
  }),

  order: Property.StaticDropdown({
    displayName: 'Ordre',
    description:
      'Tri les résultats par ordre ascendant ou descendant - par défaut descendant',
    required: false,
    options: {
      disabled: false,
      options: [
        {
          label: 'Descendant',
          value: 'desc',
        },
        {
          label: 'Ascendant',
          value: 'asc',
        },
      ],
    },
  }),

  tasks: Property.StaticDropdown({
    displayName: 'Type de tâche',
    required: true,
    options: {
      disabled: false,
      options: [
        {
          label: 'Téléphone',
          value: 'phone',
        },
        {
          label: 'Email',
          value: 'email',
        },
        {
          label: 'Meeting',
          value: 'meeting',
        },
        {
          label: 'Chat',
          value: 'chat',
        },
        {
          label: 'SMS',
          value: 'sms',
        },
        {
          label: 'Formation',
          value: 'training',
        },
        {
          label: 'Remarque',
          value: 'remark',
        },
        {
          label: 'Document',
          value: 'file',
        },
      ],
    },
  }),

  qualiopiIndicators: Property.StaticDropdown({
    displayName: 'Associée à Qualiopi',
    required: false,
    options: {
      disabled: false,
      options: [
        {
          label: 'Ind. 1 : Informations du public',
          value: 1,
        },
        {
          label: 'Ind. 2 : Indicateurs de résultats',
          value: 2,
        },
        {
          label: 'Ind. 3 : Obtentions des certifications',
          value: 3,
        },
        {
          label: 'Ind. 4 : Analyse du besoin',
          value: 4,
        },
        {
          label: 'Ind. 5 : Objectifs de la prestation',
          value: 5,
        },
        {
          label: 'Ind. 6 : Mise en oeuvre de la prestation',
          value: 6,
        },
        {
          label: 'Ind. 7 : Adéquation contenus / exigences',
          value: 7,
        },
        {
          label: "Ind. 8 : Positionnement à l'entrée",
          value: 8,
        },
        {
          label: 'Ind. 9 : Condition de déroulement',
          value: 9,
        },
        {
          label: 'Ind. 10 : Adaptation de la prestation',
          value: 10,
        },
        {
          label: 'Ind. 11 : Atteinte des objectifs',
          value: 11,
        },
        {
          label: 'Ind. 12 : Engagement des bénéficiaires',
          value: 12,
        },
        {
          label: 'Ind. 13 : Coordination des apprentis',
          value: 13,
        },
        {
          label: 'Ind. 14 : Exercice de la citoyenneté',
          value: 14,
        },
        {
          label: "Ind. 15 : Droits à devoirs de l'apprenti",
          value: 15,
        },
        {
          label: 'Ind. 16 : Présentation à la certification',
          value: 16,
        },
        {
          label: 'Ind. 17 : Moyens humains et techniques',
          value: 17,
        },
        {
          label: 'Ind. 18 : Coordination des acteurs',
          value: 18,
        },
        {
          label: 'Ind. 19 : Ressources pédagogiques',
          value: 19,
        },
        {
          label: 'Ind. 20 : Personnels dédiés',
          value: 20,
        },
        {
          label: 'Ind. 21 : Compétences des acteurs',
          value: 21,
        },
        {
          label: 'Ind. 22 : Gestion des compétences',
          value: 22,
        },
        {
          label: 'Ind. 23 : Veille légale et réglementaire',
          value: 23,
        },
        {
          label: 'Ind. 24 : Veille emplois et métiers',
          value: 24,
        },
        {
          label: 'Ind. 25 : Veille technologique',
          value: 25,
        },
        {
          label: 'Ind. 26 : Public en situation de handicap',
          value: 26,
        },
        {
          label: 'Ind. 27 : Sous-traitance et portage salarial',
          value: 27,
        },
        {
          label: 'Ind. 28 : Formation Situation de travail',
          value: 28,
        },
        {
          label: 'Ind. 29 : Insertion professionnelle',
          value: 29,
        },
        {
          label: 'Ind. 30 : Recueil des appréciations',
          value: 30,
        },
        {
          label: 'Ind. 31 : Traitement des réclamations',
          value: 31,
        },
        {
          label: "Ind. 32 : Mesures d'amélioration continue",
          value: 32,
        },
      ],
    },
  }),

  cdcState: Property.StaticDropdown({
    displayName: "État de l'accrochage",
    description:
      "Permet de n'obtenir que les dossiers dans l'état considéré lié à l'export des dossiers - par défaut tous les dossiers sont retournés",
    required: false,
    options: {
      disabled: false,
      options: [
        {
          label: 'Tous',
          value: 'all',
        },
        {
          label: 'Jamais accroché',
          value: 'notExported',
        },
        {
          label: "Envoyé et en attente de l'accusé",
          value: 'exported',
        },
        {
          label: 'Accrochage réussi',
          value: 'processedOk',
        },
        {
          label: 'Accrochage en erreur',
          value: 'processedKo',
        },
      ],
    },
  }),
};
