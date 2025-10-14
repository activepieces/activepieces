import { wedofAuth } from '../../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofCommon } from '../../common/wedof';

export const createRegistrationFolder = createAction({
  auth: wedofAuth,
  name: 'createRegistrationFolder',
  displayName: "Créer un dossier de formation hors CPF",
  description: "Permet de créer un nouveau dossier de formation",
  props: {
    sessionId: Property.Number({
      displayName: 'ID de session',
      description: "ID technique de la session choisie (pas l'externalId)",
      required: true,
    }),
    attendeeId: Property.Number({
      displayName: "L'ID de l'apprenant",
      description:"ID de l'apprenant sélectionné",
      required: true,
    }),
    totalTTC: Property.Number({
        displayName: "Le prix de la formation TTC",
        required: true,
    }),
    type: Property.StaticDropdown({
      displayName: "Type de financement",
      description: "Type de financement du dossier créer",
      required: true,
      options: {
        options: [
            { label: 'Individuel', value: 'individual' },
            { label: 'OPCO', value: 'opco' },
            { label: 'Pôle Emploi', value: 'poleEmploi' },
            { label: 'Entreprise', value: 'company' }
        ],
        disabled: true,
      },
    }),
    poleEmploiId: Property.ShortText({
      displayName: "L'ID Pole Emploi de l'apprenant",
      description:"UNIQUEMENT requis si le type du dossier est poleEmploi",
      required: false,
    }),
    poleEmploiRegionCode: Property.StaticDropdown({
      displayName: "Le département de l'apprenant",
      description: "UNIQUEMENT requis si le type du dossier est poleEmploi",
      required: false,
      options: {
        options: [
            { label: '024 - Alpes', value: '024' },
            { label: '034 - Alpes Provence', value: '034' },
            { label: '017 - Alsace', value: '017' },
            { label: '001 - Aquitaine', value: '001' },
            { label: '044 - Auvergne', value: '044' },
            { label: '040 - Basse Normandie', value: '040' },
            { label: '050 - Bourgogne', value: '050' },
            { label: '027 - Bretagne', value: '027' },
            { label: '035 - Centre', value: '035' },
            { label: '051 - Champagne Ardennes', value: '051' },
            { label: '065 - Corse', value: '065' },
            { label: "032 - Cote d'Azur", value: '032' },
            { label: '061 - Est Francilien', value: '061' },
            { label: '020 - Franche Comte', value: '020' },
            { label: '066 - Guadeloupe', value: '066' },
            { label: '069 - Guyane', value: '069' },
            { label: '041 - Haute Normandie', value: '041' },
            { label: '068 - La Reunion', value: '068' },
            { label: '046 - Languedoc Roussillon', value: '046' },
            { label: '012 - Limousin', value: '012' },
            { label: '063 - Lorraine', value: '063' },
            { label: '067 - Martinique', value: '067' },
            { label: '071 - Mayotte', value: '071' },
            { label: '048 - Midi Pyrenees', value: '048' },
            { label: '057 - Ouest Francilien', value: '057' },
            { label: '056 - Paris', value: '056' },
            { label: '026 - Pas de Calais', value: '026' },
            { label: '013 - Pays de la Loire', value: '013' },
            { label: '049 - Pays du Nord', value: '049' },
            { label: '025 - Picardie', value: '025' },
            { label: '039 - Poitou Charentes', value: '039' },
            { label: '070 - Saint Pierre et Miquelon', value: '070' },
            { label: '016 - Sud Est Francilien', value: '016' },
            { label: '031 - Vallees Rhone Loire', value: '031' }
        ],
        disabled: false,
      },
    }),
    poleEmploiDevis: Property.ShortText({
        displayName: "Le numéro de devis Pole Emploi de l'apprenant",
        description: "UNIQUEMENT requis si le type du dossier est poleEmploi",
        required: false,
    }),
    inPartnershipWith: Property.ShortText({
        displayName: "SIRET du partenaire",
        required: false,
    })
  },
  async run(context) {
    const message = {
        sessionId: context.propsValue.sessionId ?? null,
        attendeeId: context.propsValue.attendeeId ?? null,
        totalTTC: context.propsValue.totalTTC ?? null,
        type: context.propsValue.type ?? null,
        poleEmploiId: context.propsValue.poleEmploiId ?? null,
        poleEmploiRegionCode: context.propsValue.poleEmploiRegionCode ?? null,
        poleEmploiDevis: context.propsValue.poleEmploiDevis ?? null,
        inPartnershipWith: context.propsValue.inPartnershipWith ?? null
      };
      return (
        await httpClient.sendRequest({
          method: HttpMethod.POST,
          url:
            wedofCommon.baseUrl +'/registrationFolders',
          body: message,
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': context.auth as string,
          },
        })
      ).body;
  },
});
