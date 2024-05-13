import { HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common';
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
            props['filterOnStateDate'] = wedofCommon.filterOnStateDateFuture;
          } else if (_period) {
            props['filterOnStateDate'] = wedofCommon.filterOnStateDate;
          }
          return props;
        },
      }),
      state: wedofCommon.state,
      certificationFolderState: wedofCommon.certificationFolderState,
      sort:wedofCommon.sort,
      order:wedofCommon.order,
      cdcState:wedofCommon.cdcState,
      cdcExcluded: Property.StaticDropdown({
        displayName: "Exclus de l'accrochage",
        description: "Permet de filtrer les dossiers de certification qui sont exclus de l'accrochage",
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
        displayName: "Donnés apprenant complètes",
        description: "Permet de filtrer les dossiers de certification selon le fait qu'ils contiennent les données de l'apprenant obligatoires pour l'accrochage en cas d'obtention de la certification",
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
        displayName: "Inclus dans les prochains accrochages",
        description: "Permet de filtrer les dossiers de certification qui devront être inclus dans les prochains exports pour l'accrochage (par défaut oui, sauf si déjà accroché avec succès)",
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
        sort:context.propsValue.state ?? null,
        order:context.propsValue.order ?? null,
        cdcExcluded:context.propsValue.cdcExcluded ?? null,
        cdcCompliant:context.propsValue.cdcCompliant ?? null,
        cdcToExport:context.propsValue.cdcToExport ?? null,
        certificationFolderState:
          context.propsValue.certificationFolderState ?? null,
        cdcState:context.propsValue.cdcState ?? null,
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
  