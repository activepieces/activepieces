import { HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common';
  import { wedofAuth } from '../../..';
  import {
    createAction,
    Property,
  } from '@activepieces/pieces-framework';
  import { wedofCommon } from '../../common/wedof';
  
  export const listCertificationFolderSurveys = createAction({
    auth: wedofAuth,
    name: 'listCertificationFolderSurveys',
    displayName: 'Liste les enquêtes selon des critères',
    description: "Récupérer l'ensemble des enquêtes de l'organisme de l'utilisateur connecté",
    props: {
      certifInfo: Property.ShortText({
        displayName: 'N° certifInfo',
        description: "Permet de n'obtenir que les enquêtes liées à la certification considérée",
        required: false,
      }),
      limit: Property.ShortText({
        displayName: "Nombre d'enquêtes",
        description: "Nombre d'éléments retourné par requête - par défaut 100",
        required: false,
      }),
      order: Property.StaticDropdown({
        displayName: "Ordre",
        description: "Tri les résultats par ordre ascendant ou descendant",
        required: false,
        options: {
          options: [
            {
              value: 'asc',
              label: 'Ascendant',
            },
            {
              value: 'desc',
              label: 'Descendant',
            },
          ],
          disabled: false,
        },
      }),
      page: Property.Number({
        displayName: 'N° de page de la requête',
        description: 'Par défaut : 1',
        defaultValue: 1,
        required: false,
      }),
      state: Property.StaticDropdown({
        displayName: "Etat",
        description: "Permet de n'obtenir que les enquêtes en fonction de l'état considéré",
        required: false,
        options: {
          options: [
            {
              value: 'all',
              label: 'Tous',
            },
            {
              value: 'created',
              label: 'Créé',
            },
            {
              value: 'beforeCertificationSuccess',
              label: 'Avant la réussite de la certification',
            },
            {
              value: 'afterSixMonthsCertificationSuccess',
              label: 'Six mois après la réussite de la certification',
            },
            {
              value: 'finished',
              label: 'Terminé',
            },
          ],
          disabled: false,
        },
      }),
    },
  
    async run(context) {
      const params = {
        certifInfo: context.propsValue.certifInfo ?? null,
        limit: context.propsValue.limit ?? null,
        page: context.propsValue.page ?? null,
        state: context.propsValue.state ?? null,
        order:context.propsValue.order ?? null,
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
          url: wedofCommon.baseUrl + '/surveys',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': context.auth as string,
          },
        })
      ).body;
    },
  });