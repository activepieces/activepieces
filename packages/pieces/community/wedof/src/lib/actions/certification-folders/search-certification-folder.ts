import {
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';
import dayjs from 'dayjs';

export const searchCertificationFolder = createAction({
  auth: wedofAuth,
  name: 'searchCertificationFolder',
  displayName: 'Rechercher un ou plusieurs dossiers de certifications',
  description:
    'Liste les dossiers de certifications en fonction des critères sélectionnés',
  props: {
    query: Property.ShortText({
      displayName: 'Recherche',
      description: 'Nom, prénom, N° de dossier, N° de certification etc..',
      required: false,
    }),
    period: wedofCommon.period,
    periodForm: Property.DynamicProperties({
      description: '',
      displayName: 'ez',
      required: true,
      refreshers: ['period'],
      props: async ({ period }) => {
        const _period = period as unknown as string;
        const props: DynamicPropsValue = {};
        if (_period === 'custom') {
          props['since'] = Property.DateTime({
            displayName: '(Période) Entre le',
            description: 'Date au format YYYY-MM-DD',
            required: true,
          });
          props['until'] = Property.DateTime({
            displayName: "(Période) et jusqu'au",
            description: 'Date au format YYYY-MM-DD',
            required: true,
          });
        } else if (
          ['next', 'future', 'tomorrow'].some((v) =>
            _period.toLowerCase().includes(v)
          )
        ) {
          props['filterOnStateDate'] = wedofCommon.filterOnStateDateFutureCf;
        } else if (_period) {
          props['filterOnStateDate'] = wedofCommon.filterOnStateDateCf;
        }
        return props;
      },
    }),
    state: wedofCommon.certificationFolderState,
    sort: wedofCommon.sort,
    cdcState: wedofCommon.cdcState,
    cdcExcluded: Property.StaticDropdown({
      displayName: "Exclus de l'accrochage",
      description:
        "Permet de filtrer les dossiers de certification qui sont exclus de l'accrochage",
      required: false,
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
    cdcCompliant: Property.StaticDropdown({
      displayName: 'Donnés apprenant complètes',
      description:
        "Permet de filtrer les dossiers de certification selon le fait qu'ils contiennent les données de l'apprenant obligatoires pour l'accrochage en cas d'obtention de la certification",
      required: false,
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
    cdcToExport: Property.StaticDropdown({
      displayName: 'Inclus dans les prochains accrochages',
      description:
        "Permet de filtrer les dossiers de certification qui devront être inclus dans les prochains exports pour l'accrochage (par défaut oui, sauf si déjà accroché avec succès)",
      required: false,
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
    certifInfo: Property.ShortText({
      displayName: 'ID certification',
      description:
        "Permet de n'obtenir que les dossiers liés à la certification considérée",
      required: false,
    }),
    columnId: Property.ShortText({
      displayName: 'ID de colonne',
      description: 'Identifiant pour affichage personnalisé',
      required: false,
    }),
    format: Property.StaticDropdown({
      displayName: 'Format de sortie',
      required: false,
      defaultValue: 'json',
      options: {
        options: [
          { label: 'JSON', value: 'json' },
          { label: 'CSV', value: 'csv' },
        ],
      },
    }),
    messageState: Property.StaticDropdown({
      displayName: 'État du message',
      description:
        "Permet de n'obtenir que les dossiers liés à l'état d'envoi d'un message considéré - par défaut tous les dossiers sont retournés",
      required: false,
      options: {
        options: [
          { label: 'Message envoyé', value: 'sent' },
          { label: 'Message non envoyé', value: 'notSent' },
          {
            label: 'Message non envoyé (non autorisé)',
            value: 'notSentUnauthorized',
          },
          {
            label: 'Message non envoyé (conditions renforcées)',
            value: 'notSentEnforcedConditions',
          },
          { label: "Echec de l'envoi", value: 'failed' },
          { label: 'Envoi programmé', value: 'scheduled' },
        ],
      },
    }),
    messageTemplate: Property.ShortText({
      displayName: 'Modèle de message',
      description:
        "Permet de n'obtenir que les dossiers pour lequels un message issue du modèle considéré a été créé - par défaut aucun filtre",
      required: false,
    }),
    order: wedofCommon.order,
    registrationFolderCompletionRate: Property.StaticDropdown({
      displayName: "Taux d'avancement",
      description:
        "Permet de n'obtenir que les dossiers dont le taux d'avancement choisi",
      required: false,
      options: {
        options: [
          { label: '< 80%', value: '<80' },
          { label: '> 80%', value: '>80' },
        ],
      },
    }),
    registrationFolderState: Property.StaticMultiSelectDropdown({
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
    registrationFolderType: Property.StaticMultiSelectDropdown({
      displayName: 'Type de financement',
      description:
        "Permet de n'obtenir que les dossiers dans le type considéré",
      required: false,
      options: {
        options: [
          { label: 'CPF', value: 'cpf' },
          { label: 'Autofinancement', value: 'individual' },
          { label: 'Pole Emploi (Autres)', value: 'poleEmploi' },
          { label: 'Entreprise', value: 'company' },
          { label: 'Opco (Manuel)', value: 'opco' },
          { label: 'Opco (Apprentissage)', value: 'opcoCfa' },
          { label: 'Kairos (AIF)', value: 'kairosAif' },
        ],
      },
    }),
    siret: Property.Array({
      displayName: 'N° Siret',
      description:
        "Permet de n'obtenir que les dossiers issus de l'organisme de formation de siret considéré - par défaut all",
      defaultValue: ['all'],
      required: false,
    }),
    survey: Property.StaticMultiSelectDropdown({
      displayName: "Questionnaire de suivi d'insertion professionnelle",
      description:
        "Permet de n'obtenir que les dossiers pour lequels un questionnaire doit être répondu ou a été répondu - par défaut aucun filtre",
      required: false,
      options: {
        options: [
          {
            label:
              'Questionnaire "Situation professionnelle en début de cursus" est accessible (Enquête créée)',
            value: 'initialExperienceStartDate',
          },
          {
            label:
              'Questionnaire "Situation professionnelle de 6 mois" est accessible',
            value: 'sixMonthExperienceStartDate',
          },
          {
            label:
              'Questionnaire "Situation professionnelle au moins un an" est accessible',
            value: 'longTermExperienceStartDate',
          },
          {
            label:
              'Questionnaire "Situation professionnelle en début de cursus" répondu',
            value: 'initialExperienceAnsweredDate',
          },
          {
            label:
              'Questionnaire "Situation professionnelle de 6 mois" répondu',
            value: 'sixMonthExperienceAnsweredDate',
          },
          {
            label:
              'Questionnaire "Situation professionnelle au moins un an" répondu',
            value: 'longTermExperienceAnsweredDate',
          },
        ],
      },
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Recherche libre sur les tags',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Nombre de dossiers de formation',
      description:
        'Nombre de dossiers de certification maximum qui seront retournés par requête',
      defaultValue: 100,
      required: false,
    }),
    page: Property.Number({
      displayName: 'N° de page de la requête',
      description: 'Par défaut : 1',
      defaultValue: 1,
      required: false,
    }),
  },

  async run(context) {
    const params = {
      query: context.propsValue.query ?? null,
      limit: context.propsValue.limit ?? null,
      page: context.propsValue.page ?? null,
      state: context.propsValue.state ?? null,
      sort: context.propsValue.sort ?? null,
      order: context.propsValue.order ?? null,
      cdcExcluded: context.propsValue.cdcExcluded ?? null,
      cdcCompliant: context.propsValue.cdcCompliant ?? null,
      cdcToExport: context.propsValue.cdcToExport ?? null,
      cdcState: context.propsValue.cdcState ?? null,
      period: context.propsValue.period ?? null,
      since: context.propsValue.periodForm['since']
        ? dayjs(context.propsValue.periodForm['since'])
            .startOf('day')
            .format('YYYY-MM-DDTHH:mm:ssZ')
        : null,
      until: context.propsValue.periodForm['until']
        ? dayjs(context.propsValue.periodForm['until'])
            .endOf('day')
            .format('YYYY-MM-DDTHH:mm:ssZ')
        : null,
      filterOnStateDate:
        context.propsValue.periodForm['filterOnStateDate'] ?? null,
      certifInfo: context.propsValue.certifInfo ?? null,
      columnId: context.propsValue.columnId ?? null,
      format: context.propsValue.format ?? null,
      messageState: context.propsValue.messageState ?? null,
      messageTemplate: context.propsValue.messageTemplate ?? null,
      registrationFolderCompletionRate:
        context.propsValue.registrationFolderCompletionRate ?? null,
      registrationFolderState:
        context.propsValue.registrationFolderState ?? null,
      registrationFolderType: context.propsValue.registrationFolderType ?? null,
      siret: context.propsValue.siret ?? null,
      survey: context.propsValue.survey ?? null,
      tags: context.propsValue.tags ?? null,
    };
    const queryParams: QueryParams = {};
    Object.keys(params).forEach((value) => {
      const key = value as keyof typeof params;
      if (params[key] != null && params[key] != undefined) {
        queryParams[value] = params[key] as string;
      }
    });
    return (
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        queryParams: queryParams,
        url: wedofCommon.baseUrl + '/certificationFolders',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
