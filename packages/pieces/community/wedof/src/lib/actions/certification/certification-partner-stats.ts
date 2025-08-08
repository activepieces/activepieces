import {
  httpClient,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const listPartnerStats = createAction({
  auth: wedofAuth,
  name: 'listPartnerStats',
  displayName: 'Lister les statistiques des partenaires',
  description: 'Récupère les statistiques des partenaires de certification',

  props: {
    certifInfo: Property.ShortText({
      displayName: 'Identifiant de certification',
      required: true,
    }),
    certifierAccessState: Property.StaticDropdown({
      displayName: 'État de synchronisation du partenariat',
      required: false,
      options: {
        options: [
          { label: 'En attente', value: 'waiting' },
          { label: 'Accepté', value: 'accepted' },
          { label: 'Refusé', value: 'refused' },
          { label: 'Terminé', value: 'terminated' },
          { label: 'Aucun', value: 'none' },
          { label: 'Tous les états', value: 'all' },
        ],
      },
      defaultValue : 'all',
    }),
    compliance: Property.StaticDropdown({
      displayName: 'État de conformité',
      required: false,
      options: {
        options: [
          { label: 'Tous', value: 'all' },
          { label: 'Aucun', value: 'none' },
          { label: 'Conforme', value: 'compliant' },
          { label: 'Partiellement conforme', value: 'partiallyCompliant' },
          { label: 'Non conforme', value: 'nonCompliant' },
          { label: 'En cours', value: 'inProgress' },
        ],
      },
      defaultValue : 'all',
    }),
    connectionIssue: Property.StaticDropdown({
      displayName: 'Présence de problème de connexion',
      required: false,
      options: {
        options: [
          { label: 'Oui', value: 'true' },
          { label: 'Non', value: 'false' },
        ],
      },
    }),
    format: Property.StaticDropdown({
      displayName: 'Format de la réponse',
      required: false,
      defaultValue: 'json',
      options: {
        options: [
          { label: 'JSON', value: 'json' },
          { label: 'CSV', value: 'csv' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Nombre de résultats',
      required: false,
      defaultValue: 100,
    }),
    order: Property.StaticDropdown({
      displayName: 'Ordre de tri',
      required: false,
      defaultValue: 'desc',
      options: {
        options: [
          { label: 'Ascendant', value: 'asc' },
          { label: 'Descendant', value: 'desc' },
        ],
      },
    }),
    page: Property.Number({
      displayName: 'Numéro de page',
      required: false,
      defaultValue: 1,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Trier par',
      required: false,
      defaultValue: 'stateLastUpdate',
      options: {
        options: [
          { label: 'Dernier changement d’état', value: 'stateLastUpdate' },
          { label: 'Nom', value: 'name' },
          { label: 'État', value: 'state' },
        ],
      },
    }),
    state: Property.StaticDropdown({
      displayName: 'État du partenariat',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'Tous les états', value: 'all' },
          { label: 'Brouillon', value: 'draft' },
          { label: 'En cours de traitement', value: 'processing' },
          { label: 'Actif', value: 'active	' },
          { label: 'Annulé', value: 'aborted' },
          { label: 'Refusé', value: 'refused' },
          { label: 'Révoqué', value: 'revoked' },
          { label: 'Suspendu', value: 'suspended' },
        ],
      },
    }),
  },

  async run(context) {
    const {
      certifInfo,
      certifierAccessState,
      compliance,
      connectionIssue,
      format,
      limit,
      order,
      page,
      sort,
      state,
    } = context.propsValue;

    const queryParams: QueryParams = {};

    if (certifierAccessState) queryParams['certifierAccessState'] = certifierAccessState;
    if (compliance) queryParams['compliance'] = compliance;
    if (connectionIssue) queryParams['connectionIssue'] = connectionIssue;
    if (format) queryParams['format'] = format;
    if (limit !== undefined) queryParams['limit'] = limit.toString();
    if (order) queryParams['order'] = order;
    if (page !== undefined) queryParams['page'] = page.toString();
    if (sort) queryParams['sort'] = sort;
    if (state) queryParams['state'] = state;

    const url = `${wedofCommon.baseUrl}/certifications/${certifInfo}/partners/details`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      queryParams,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': context.auth as string,
      },
    });

    return response.body;
  },
});
