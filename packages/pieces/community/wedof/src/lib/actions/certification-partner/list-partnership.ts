import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const listPartnerships = createAction({
  auth: wedofAuth,
  name: 'listPartnerships',
  displayName: "Lister les partenariats",
  description: "Récupère l'ensemble des partenariats d'une certification",
  props: {
    certifInfo: Property.ShortText({
      displayName: 'N° certifInfo',
      description: 'Identifiant de la certification',
      required: true,
    }),
    certifier: Property.ShortText({
      displayName: 'N° Siret Certificateur',
      required: false,
    }),
    certifierAccessState: Property.StaticDropdown({
      displayName: 'État d\'accès du certificateur',
      required: false,
      options: {
        options: [
            { label: 'Tous', value: 'all' },
            { label: 'En attente', value: 'waiting' },
            { label: 'Accepté', value: 'accepted' },
            { label: 'Refusé', value: 'refused' },
            { label: 'Terminé', value: 'terminated' },
            { label: 'Aucun', value: 'none' },
          ]
      }
    }),
    compliance: Property.StaticDropdown({
      displayName: 'Conformité',
      required: false,
      options: {
        options: [
            { label: 'Tous', value: 'all' },
            { label: 'Conforme', value: 'compliant' },
            { label: 'Partiellement conforme', value: 'partiallyCompliant' },
            { label: 'Non conforme', value: 'nonCompliant' },
            { label: 'En cours', value: 'inProgress' },
          ]
      }
    }),
    connectionIssue: Property.Checkbox({
      displayName: 'Problème de connexion',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limite',
      defaultValue: 100,
      description: 'Nombre maximal de résultats à retourner - 100 par défault',
      required: false,
    }),
    order: Property.StaticDropdown({
      displayName: 'Ordre',
      required: false,
      options: {
        options: [
          { label: 'Ascendant', value: 'asc' },
          { label: 'Descendant', value: 'desc' },
        ]
      }
    }),
    page: Property.Number({
      displayName: 'Page',
      defaultValue: 1,
      description: 'Numéro de la page de résultats - 1 par défault',
      required: false,
    }),
    query: Property.ShortText({
      displayName: 'Requête de recherche',
      required: false,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Trier par',
      required: false,
      defaultValue:'name',
      options: {
        options: [
          { label: "Nom de l'organisme", value: 'name' },
          { label: 'État', value: 'state' },
        ]
      }
    }),
    state: Property.StaticDropdown({
      displayName: 'État',
      required: false,
      defaultValue: 'all',
      options: {
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
            {
                value: 'all',
                label: 'Tous',
            },              
        ],
      }
    }),
  },
  async run(context) {
    const queryParams = new URLSearchParams();

    for (const [key, value] of Object.entries(context.propsValue)) {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    }

    return (
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: wedofCommon.baseUrl +'/certifications/'+ context.propsValue.certifInfo +`/partners?${queryParams.toString()}`,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
