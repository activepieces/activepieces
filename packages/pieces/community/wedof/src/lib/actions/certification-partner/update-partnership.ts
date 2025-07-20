import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const updatePartnership = createAction({
  auth: wedofAuth,
  name: 'updatePartnership',
  displayName: "Mettre à jour le partenariat",
  description: "Permet de mettre à jour le partenariat",
  props: {
    certifInfo: Property.ShortText({
      displayName: 'N° certifInfo',
      description:
        'Sélectionner le {certifInfo} de la certification considérée',
      required: true,
    }),
    siret: Property.ShortText({
        displayName: 'N° Siret',
        description:
          'Sélectionner le {siret} du partenaire',
        required: true,
    }),
    state: wedofCommon.partnershipState,
    habilitation : wedofCommon.habilitation,
    comment: Property.LongText({
      displayName: 'Commentaire',
      description: 'Informations complémentaires sur le partenariat',
      required: false,
    }),
    pendingActivation: Property.Checkbox({
      displayName: 'En attente d’activation',
      required: false,
    }),
    pendingRevocation: Property.Checkbox({
      displayName: 'En attente de révocation',
      required: false,
    }),
    pendingSuspension: Property.Checkbox({
      displayName: 'En attente de suspension',
      required: false,
    }),
    amountHt: Property.Number({
      displayName: 'Montant HT',
      description: 'Prix de vente du passage de certification (Hors Taxe)',
      required: false,
    }),
    compliance: wedofCommon.compliance,
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Liste de tags associés au partenariat',
      required: false,
    }),
    metadata: Property.Array({
      displayName: 'Méta-données',
      description: 'Données supplémentaires liées au partenariat',
      required: false,
    }),
    trainingsZone: Property.Array({
      displayName: 'Zone de formation',
      required: false,
    }),
    skillSets: Property.Array({
      displayName: 'Blocs de compétences',
      required: false,
    }),
  },
  async run(context) {
    const message = {
        state: context.propsValue.state,
        habilitation: context.propsValue.habilitation,
        comment: context.propsValue.comment,
        pendingActivation: context.propsValue.pendingActivation,
        pendingRevocation: context.propsValue.pendingRevocation,
        pendingSuspension: context.propsValue.pendingSuspension,
        amountHt: context.propsValue.amountHt,
        compliance: context.propsValue.compliance,
        tags: context.propsValue.tags,
        metadata: context.propsValue.metadata,
        trainingsZone: context.propsValue.trainingsZone,
        skillSets: context.propsValue.skillSets,
    };
    return (
      await httpClient.sendRequest({
        method: HttpMethod.PUT,
        url:
          wedofCommon.baseUrl +
          '/certifications/' +
          context.propsValue.certifInfo + 
          '/partners/' + 
          context.propsValue.siret,
        body: message,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
