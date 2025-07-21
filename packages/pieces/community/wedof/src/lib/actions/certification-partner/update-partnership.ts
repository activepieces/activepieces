import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import {
  createAction,
  Property,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const updatePartnership = createAction({
  auth: wedofAuth,
  name: 'updatePartnership',
  displayName: 'Mettre à jour le partenariat',
  description: 'Permet de mettre à jour le partenariat',
  props: {
    certifInfo: Property.ShortText({
      displayName: 'N° certifInfo',
      description:
        'Sélectionner le {certifInfo} de la certification considérée',
      required: true,
    }),
    siret: Property.ShortText({
      displayName: 'N° Siret',
      description: 'Sélectionner le {siret} du partenaire',
      required: true,
    }),
    fieldsToUpdate: Property.StaticMultiSelectDropdown({
      displayName: 'Champs à mettre à jour',
      description: 'Sélectionner les champs que vous souhaitez mettre à jour',
      required: true,
      options: {
        disabled: false,
        options: [
          {
            label: 'État du partenariat',
            value: 'state',
          },
          {
            label: 'Habilitation',
            value: 'habilitation',
          },
          {
            label: 'Commentaire',
            value: 'comment',
          },
          {
            label: "En attente d'activation",
            value: 'pendingActivation',
          },
          {
            label: 'En attente de révocation',
            value: 'pendingRevocation',
          },
          {
            label: 'En attente de suspension',
            value: 'pendingSuspension',
          },
          {
            label: 'Montant HT',
            value: 'amountHt',
          },
          {
            label: 'Conformité',
            value: 'compliance',
          },
          {
            label: 'Tags',
            value: 'tags',
          },
          {
            label: 'Méta-données',
            value: 'metadata',
          },
          {
            label: 'Zone de formation',
            value: 'trainingsZone',
          },
          {
            label: 'Blocs de compétences',
            value: 'skillSets',
          },
        ],
      },
    }),
    dynamicFields: Property.DynamicProperties({
      displayName: 'Champs sélectionnés',
      refreshers: ['fieldsToUpdate'],
      required: false,
      props: async ({ fieldsToUpdate }) => {
        const fields: DynamicPropsValue = {};
        const selectedFields = (fieldsToUpdate as string[]) || [];

        if (selectedFields.includes('state')) {
          fields['state'] = wedofCommon.partnershipState;
        }

        if (selectedFields.includes('habilitation')) {
          fields['habilitation'] = wedofCommon.habilitation;
        }

        if (selectedFields.includes('comment')) {
          fields['comment'] = Property.LongText({
            displayName: 'Commentaire',
            description: 'Informations complémentaires sur le partenariat',
            required: false,
          });
        }

        if (selectedFields.includes('pendingActivation')) {
          fields['pendingActivation'] = Property.Checkbox({
            displayName: "En attente d'activation",
            required: false,
          });
        }

        if (selectedFields.includes('pendingRevocation')) {
          fields['pendingRevocation'] = Property.Checkbox({
            displayName: 'En attente de révocation',
            required: false,
          });
        }

        if (selectedFields.includes('pendingSuspension')) {
          fields['pendingSuspension'] = Property.Checkbox({
            displayName: 'En attente de suspension',
            required: false,
          });
        }

        if (selectedFields.includes('amountHt')) {
          fields['amountHt'] = Property.Number({
            displayName: 'Montant HT',
            description:
              'Prix de vente du passage de certification (Hors Taxe)',
            required: false,
          });
        }

        if (selectedFields.includes('compliance')) {
          fields['compliance'] = wedofCommon.compliance;
        }

        if (selectedFields.includes('tags')) {
          fields['tags'] = Property.Array({
            displayName: 'Tags',
            description:
              'Liste de tags associés au partenariat, si vous souhaitez garder vos précédents tags, il faut les réécrire dans le champ',
            required: false,
          });
        }

        if (selectedFields.includes('metadata')) {
          fields['metadata'] = Property.Array({
            displayName: 'Méta-données',
            description: 'Données supplémentaires liées au partenariat',
            required: false,
          });
        }

        if (selectedFields.includes('trainingsZone')) {
          fields['trainingsZone'] = Property.Array({
            displayName: 'Zone de formation',
            required: false,
          });
        }

        if (selectedFields.includes('skillSets')) {
          fields['skillSets'] = Property.Array({
            displayName: 'Blocs de compétences',
            required: false,
          });
        }

        return fields;
      },
    }),
  },
  async run(context) {
    const { fieldsToUpdate, dynamicFields } = context.propsValue;
    const {
      state,
      habilitation,
      comment,
      pendingActivation,
      pendingRevocation,
      pendingSuspension,
      amountHt,
      compliance,
      tags,
      metadata,
      trainingsZone,
      skillSets,
    } = dynamicFields || {};

    const message: Record<string, any> = {};
    const selectedFields = (fieldsToUpdate as string[]) || [];
    selectedFields.forEach((fieldName) => {
      switch (fieldName) {
        case 'state':
          message['state'] = state || null;
          break;
        case 'habilitation':
          message['habilitation'] = habilitation || null;
          break;
        case 'comment':
          message['comment'] = comment || null;
          break;
        case 'pendingActivation':
          message['pendingActivation'] =
            pendingActivation !== undefined ? pendingActivation : null;
          break;
        case 'pendingRevocation':
          message['pendingRevocation'] =
            pendingRevocation !== undefined ? pendingRevocation : null;
          break;
        case 'pendingSuspension':
          message['pendingSuspension'] =
            pendingSuspension !== undefined ? pendingSuspension : null;
          break;
        case 'amountHt':
          message['amountHt'] = amountHt !== undefined ? amountHt : null;
          break;
        case 'compliance':
          message['compliance'] = compliance || null;
          break;
        case 'tags':
          message['tags'] = tags && tags.length > 0 ? (tags as string[]) : null;
          break;
        case 'metadata':
          message['metadata'] =
            metadata && metadata.length > 0 ? (metadata as string[]) : null;
          break;
        case 'trainingsZone':
          message['trainingsZone'] =
            trainingsZone && trainingsZone.length > 0
              ? (trainingsZone as string[])
              : null;
          break;
        case 'skillSets':
          message['skillSets'] =
            skillSets && skillSets.length > 0 ? (skillSets as string[]) : null;
          break;
      }
    });

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
