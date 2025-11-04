import {
  httpClient,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';
import dayjs from 'dayjs';

export const searchRegistrationFolder = createAction({
  auth: wedofAuth,
  name: 'listRegistrationFolders',
  displayName: 'Rechercher un ou plusieurs dossiers de formation',
  description:
    'Liste les dossiers de formation en fonction des critères sélectionnés',
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
          props['filterOnStateDate'] = wedofCommon.filterOnStateDateFuture;
        } else if (_period) {
          props['filterOnStateDate'] = wedofCommon.filterOnStateDate;
        }
        return props;
      },
    }),
    type: wedofCommon.type,
    state: wedofCommon.state,
    billingState: wedofCommon.billingState,
    controlState: wedofCommon.controlState,
    certificationFolderState: wedofCommon.certificationFolderState,
    proposalCode: Property.ShortText({
      displayName: 'Code de proposition commercial',
      description: 'Code de la proposition commercial Wedof associé',
      required: false,
    }),
    siret: Property.ShortText({
      displayName: 'Siret',
      description:
        "Permet de n'obtenir que les dossiers appartenant à l'organisme de siret considéré - par défaut l'organisme de l'utilisateur courant",
      required: false,
    }),
    certifInfo: Property.ShortText({
      displayName: 'Certification',
      description: 'Filtrer par certification',
      required: false,
    }),
    columnId: Property.ShortText({
      displayName: 'ID de colonne',
      description: 'Identifiant pour affichage personnalisé',
      required: false,
    }),
    completionRate: Property.StaticDropdown({
      displayName: 'Taux d’assiduité',
      description:
        "Permet de n'obtenir que les dossiers dont le taux d'assiduité choisi",
      required: false,
      options: {
        options: [
          { label: '0%', value: '0' },
          { label: '< 25%', value: '25<' },
          { label: '25% <> 80%', value: '25<>80' },
          { label: '> 80%', value: '>80' },
          { label: '100%', value: '100' },
        ],
      },
    }),
    daysSinceLastUpdatedCompletionRate: Property.ShortText({
      displayName: "Jours sans mise à jour d'assiduité",
      description:
        "Permet de n'obtenir que les dossiers pour lesquels le taux d'avancement n'a pas été mis à jour depuis plus de X jours",
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
    order: Property.StaticDropdown({
      displayName: 'Ordre de tri',
      required: false,
      options: {
        options: [
          { label: 'Ascendant', value: 'asc' },
          { label: 'Descendant', value: 'desc' },
        ],
      },
    }),
    organismType: Property.StaticDropdown({
      displayName: 'Type d’organisme',
      required: false,
      options: {
        options: [
          { label: 'Moi', value: 'self' },
          { label: 'Partenaires', value: 'partners' },
        ],
      },
    }),
    sort: Property.StaticDropdown({
      displayName: 'Critère de tri',
      description: 'Tri les résultats sur un critère',
      required: false,
      options: {
        options: [
          { label: 'Prénom', value: 'firstName' },
          { label: 'Nom', value: 'lastName' },
          { label: 'Dernière mise à jour', value: 'lastUpdate' },
          { label: 'ID', value: 'id' },
        ],
      },
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Recherche libre sur les tags',
      required: false,
    }),
    trainingActionId: Property.ShortText({
      displayName: "ID de l'action de formation",
      description:
        "Permet de n'obtenir que les dossiers liés à l'action de formation considérée",
      required: false,
    }),
    trainingId: Property.ShortText({
      displayName: 'ID de la formation',
      description:
        "Permet de n'obtenir que les dossiers liés à la formation considérée",
      required: false,
    }),
    sessionId: Property.ShortText({
      displayName: 'ID de la session',
      description:
        "Permet de n'obtenir que les dossiers liés à la session considérée",
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Nombre de dossiers de formation',
      description:
        'Nombre de dossiers de formation maximum qui seront retournés par requête',
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
    const props = context.propsValue;
    const params = {
      query: props.query ?? null,
      limit: props.limit ?? null,
      page: props.page ?? null,
      controlState: props.controlState ?? null,
      state: props.state ?? null,
      certificationFolderState: props.certificationFolderState ?? null,
      billingState: props.billingState ?? null,
      type: props.type ?? null,
      period: props.period ?? null,
      proposalCode: props.proposalCode ?? null,
      siret: props.siret ?? null,
      certifInfo: props.certifInfo ?? null,
      columnId: props.columnId ?? null,
      completionRate: props.completionRate ?? null,
      daysSinceLastUpdatedCompletionRate:
        props.daysSinceLastUpdatedCompletionRate ?? null,
      format: props.format ?? null,
      messageState: props.messageState ?? null,
      messageTemplate: props.messageTemplate ?? null,
      order: props.order ?? null,
      organismType: props.organismType ?? null,
      sort: props.sort ?? null,
      tags: props.tags ?? null,
      trainingActionId: props.trainingActionId ?? null,
      trainingId: props.trainingId ?? null,
      sessionId: props.sessionId ?? null,
      since: props.periodForm['since']
        ? dayjs(props.periodForm['since'])
            .startOf('day')
            .format('YYYY-MM-DDTHH:mm:ssZ')
        : null,
      until: props.periodForm['until']
        ? dayjs(props.periodForm['until'])
            .endOf('day')
            .format('YYYY-MM-DDTHH:mm:ssZ')
        : null,
      filterOnStateDate: props.periodForm['filterOnStateDate'] ?? null,
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
        url: wedofCommon.baseUrl + '/registrationFolders',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
