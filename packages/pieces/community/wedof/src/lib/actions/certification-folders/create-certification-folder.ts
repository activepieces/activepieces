import { wedofAuth } from '../../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofCommon } from '../../common/wedof';
import dayjs from 'dayjs';

export const createCertificationFolder = createAction({
  auth: wedofAuth,
  name: 'createCertificationFolder',
  displayName: "Créer un dossier de certification hors CPF",
  description: "Permet de créer un nouveau dossier de certification",
  props: {
    certifInfo: Property.ShortText({
      displayName: 'N° du certification',
      description:'Le certifInfo de la certification sélectionnée',
      required: true,
    }),
    attendeeId: Property.ShortText({
      displayName: "L'ID de l'apprenant",
      description:"ID de l'apprenant sélectionné",
      required: true,
    }),
    optionName: Property.ShortText({
        displayName: "Option si appliquée",
        required: false,
    }),
    enrollmentDate : Property.DateTime({
            displayName: "Date d'inscription à la certification",
            description: 'Date au format YYYY-MM-DD - peut être modifié dans les états toRegister, registered, toTake, toControl',
            required: false,
          }),
    dataProvider: Property.StaticDropdown({
      displayName: "Type de financement",
      description: "Type de financement du dossier de certification",
      required: true,
      options: {
        options: [
            { label: 'Individuel', value: 'individual' },
            { label: 'OPCO', value: 'opco' },
            { label: 'Pôle Emploi', value: 'poleEmploi' },
            { label: 'Entreprise', value: 'company' }
        ],
        disabled: false,
      },
    }),
    type: Property.StaticDropdown({
      displayName: "Dossier à l'initiative de",
      description: "Initiative à laquelle l'inscription a été réalisée",
      required: false,
      options: {
        options: [
            { label: 'Certifié(e)', value: 'CERTIFIE' },
            { label: 'Organisme de formation', value: 'OF' },
            { label: 'Pôle Emploi', value: 'POLE_EMPLOI' },
            { label: 'Employeur', value: 'EMPLOYEUR' },
            { label: 'Autre', value: 'AUTRE' }
        ],
        disabled: false,
      },
    }),
    accesModality: Property.StaticDropdown({
      displayName: "accessModality",
      description: "Si accessModality est de type VAE, accessModalityVae doit être déclaré",
      required: false,
      options: {
        options: [
            { label: 'Formation initiale hors apprentissage', value: 'FORMATION_INITIALE_HORS_APPRENTISSAGE' },
            { label: 'Formation initiale apprentissage', value: 'FORMATION_INITIALE_APPRENTISSAGE' },
            { label: 'Formation continue hors contrat de professionnalisation', value: 'FORMATION_CONTINUE_HORS_CONTRAT_DE_PROFESSIONNALISATION' },
            { label: 'Formation continue contrat de professionnalisation', value: 'FORMATION_CONTINUE_CONTRAT_DE_PROFESSIONNALISATION' },
            { label: 'Vae', value: 'VAE' },
            { label: 'Equivalence (Diplome etranger)', value: 'EQUIVALENCE_(DIPLOME_ETRANGER)' },
            { label: 'Candidat libre', value: 'CANDIDAT_LIBRE' },
        ],
        disabled: false,
      },
    }),
    accesModalityVae: Property.StaticDropdown({
      displayName: "accessModality Vae",
      description: "Requis si la valeur accessModality est 'VAE'",
      required: false,
      options: {
        options: [
            { label: 'Congés Vae', value: 'CONGES_VAE' },
            { label: 'Vae classique', value: 'VAE_CLASSIQUE' }
        ],
        disabled: false,
      },
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Liste de tags associée au dossier de certification, uniquement pour le certificateur',
      required: false,
    }),
    metadata: Property.Array({
      displayName: 'Données personnalisées',
      description: 'tableau associatif clé - valeur, disponible uniquement pour le certificateur',
      required: false,
    })
  },
  async run(context) {
    const message = {
        certifInfo: context.propsValue.certifInfo ?? null,
        attendeeId: context.propsValue.attendeeId ?? null,
        optionName: context.propsValue.optionName ?? null,
        enrollmentDate: context.propsValue.enrollmentDate
        ? dayjs(context.propsValue.enrollmentDate).format('YYYY-MM-DD')
        : null,
        dataProvider: context.propsValue.dataProvider ?? null,
        type: context.propsValue.type ?? null,
        accesModality: context.propsValue.accesModality ?? null,
        accesModalityVae: context.propsValue.accesModalityVae ?? null,
        tags: context.propsValue.tags ?? [],
        metadata: context.propsValue.metadata ?? []
      };
      return (
        await httpClient.sendRequest({
          method: HttpMethod.POST,
          url:
            wedofCommon.baseUrl +'/certificationFolders',
          body: message,
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': context.auth as string,
          },
        })
      ).body;
  },
});
