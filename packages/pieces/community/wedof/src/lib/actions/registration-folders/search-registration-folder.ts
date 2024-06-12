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
    const params = {
      query: context.propsValue.query ?? null,
      limit: context.propsValue.limit ?? null,
      page: context.propsValue.page ?? null,
      controlState: context.propsValue.controlState ?? null,
      state: context.propsValue.state ?? null,
      certificationFolderState:
        context.propsValue.certificationFolderState ?? null,
      billingState: context.propsValue.billingState ?? null,
      type: context.propsValue.type ?? null,
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
      proposalCode: context.propsValue.proposalCode ?? null,
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
