import { Property } from '@activepieces/pieces-framework';

export const wedofCommon = {
  baseUrl: 'https://staging.wedof.fr/api',
  host: 'https://staging.wedof.fr/api',

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
          label: "Enregistré",
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
      ],
      disabled: false,
    },
  }),

  forceMajeurAbsence: Property.StaticDropdown({
    displayName: 'absence pour raison de force majeure',
    description: "si absence pour raison de force majeure, 'Oui', sinon 'Non'",
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
    defaultValue: false,
    options: {
      options: [
        {label: "C2", value: "C2"},
			  {label: "C1", value: "C1"},
			  {label: "B2", value: "B2"},
			  {label: "B1", value: "B1"},
			  {label: "A2", value: "A2"},
			  {label: "A1", value: "A1"},
			  {label: "INSUFFISANT", value: "INSUFFISANT"}
      ],
      disabled: false,
    },
  }),

  gradePass: Property.StaticDropdown({
    displayName: 'Ajoute une mention au dossier de certification',
    required: false,
    defaultValue: false,
    options: {
      options: [
        {label: "SANS MENTION", value: "SANS_MENTION"},
			  {label: "MENTION ASSEZ BIEN", value: "MENTION_ASSEZ_BIEN"},
			  {label: "MENTION BIEN", value: "MENTION_BIEN"},
			  {label: "MENTION TRES BIEN", value: "MENTION_TRES_BIEN"},
			  {label: "MENTION TRES BIEN AVEC FELICITATIONS", value: "MENTION_TRES_BIEN_AVEC_FELICITATIONS_DU_JURY"},
      ],
      disabled: false,
    },
  }),

  examinationType: Property.StaticDropdown({
    displayName: "Type de passage de l'examen",
    required: false,
    defaultValue: false,
    options: {
      options: [
        {
          value: "A_DISTANCE",
          label: 'À distance',
        },
        {
          value: "EN_PRESENTIEL",
          label: 'En présentiel',
        },
        {
          value: "MIXTE",
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
    displayName: 'Etat du dossier de certification',
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
          label: 'Aucune période',
          value: null,
        },
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
      ],
    },
  }),

  sort: Property.StaticDropdown({
    displayName: 'Tri sur critère',
    required: true,
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
      ],
    },
  }),

  order: Property.StaticDropdown({
    displayName: 'Ordre',
    description:'Tri les résultats par ordre ascendant ou descendant - par défaut descendant',
    required: false,
    options: {
      disabled: false,
      options: [
        {
          label: "Descendant",
          value: 'desc',
        },
        {
          label: 'Ascendant',
          value: 'asc',
        },
      ],
    },
  }),

  cdcState: Property.StaticDropdown({
    displayName: "État de l'accrochage",
    description:"Permet d'indiquer où en est le dossier de certification dans le processus d'accrochage auprès de la CDC",
    required: false,
    options: {
      disabled: false,
      options: [
        {
          label: "Tous",
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
          label: "Accrochage réussi",
          value: 'processedOk',
        },
        {
          label: "Accrochage en erreur",
          value: 'processedKo',
        },
      ],
    },
  }),
};
