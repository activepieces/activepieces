import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import {
  createAction,
  Property,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';
import dayjs from 'dayjs';

export const updateCertificationFolder = createAction({
  auth: wedofAuth,
  name: 'updateCertificationFolder',
  displayName: 'Mettre à jour un dossier de certification',
  description:
    "Met à jour certaines informations modifiables d'un dossier de certification",
  props: {
    externalId: Property.ShortText({
      displayName: 'N° du dossier de certification',
      description:
        'Sélectionner la propriété {externalId} du dossier de certification',
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
            label: "Date d'inscription à la certification",
            value: 'enrollmentDate',
          },
          {
            label: "Date de début de l'examen",
            value: 'examinationDate',
          },
          {
            label: "Date de fin de l'examen",
            value: 'examinationEndDate',
          },
          {
            label: "Lieu de l'examen",
            value: 'examinationPlace',
          },
          {
            label: "Code postal du centre d'examen",
            value: 'examinationCenterZipCode',
          },
          {
            label: 'Type de financement',
            value: 'dataProvider',
          },
          {
            label: "Type de passage de l'examen",
            value: 'examinationType',
          },
          {
            label: 'Verbatim',
            value: 'verbatim',
          },
          {
            label: 'Option',
            value: 'optionName',
          },
          {
            label: "Modalité d'accès",
            value: 'accessModality',
          },
          {
            label: 'Modalité VAE',
            value: 'accessModalityVae',
          },
          {
            label: 'Commentaire',
            value: 'comment',
          },
          {
            label: "Initiative de l'inscription",
            value: 'type',
          },
          {
            label: 'Tags',
            value: 'tags',
          },
          {
            label: "Exclus de l'accrochage",
            value: 'cdcExcluded',
          },
          {
            label: 'Prix du passage (HT)',
            value: 'amountHt',
          },
          {
            label: 'Fichier du parchemin',
            value: 'certificate',
          },
          {
            label: 'Identifiant du parchemin',
            value: 'certificateId',
          },
          {
            label: 'Tiers temps',
            value: 'tiersTemps',
          },
          {
            label: 'Identifiant technique CDC',
            value: 'cdcTechnicalId',
          },
          {
            label: 'Badge de certification',
            value: 'badgeAssertion',
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

        if (selectedFields.includes('enrollmentDate')) {
          fields['enrollmentDate'] = Property.DateTime({
            displayName: "Date d'inscription à la certification",
            description: 'Date au format YYYY-MM-DD - peut être modifié dans les états toRegister, registered, toTake, toControl',
            required: false,
          });
        }

        if (selectedFields.includes('examinationDate')) {
          fields['examinationDate'] = Property.DateTime({
            displayName: "Date de début de l'examen de certification",
            description: 'Date au format YYYY-MM-DD - peut être modifié dans les états registered, toTake, toRetake, toControl',
            required: false,
          });
        }

        if (selectedFields.includes('examinationEndDate')) {
          fields['examinationEndDate'] = Property.DateTime({
            displayName: "Date de fin de l'examen de certification",
            description: 'Date au format YYYY-MM-DD - peut être modifié dans les états registered, toTake, toRetake, toControl',
            required: false,
          });
        }

        if (selectedFields.includes('examinationPlace')) {
          fields['examinationPlace'] = Property.ShortText({
            displayName: "Lieu de l'examen",
            description: "Lieu de l'examen de certification - peut être modifié dans les états registered, toTake, toControl, toRetake",
            required: false,
          });
        }

        if (selectedFields.includes('examinationCenterZipCode')) {
          fields['examinationCenterZipCode'] = Property.ShortText({
            displayName: "Code postal du centre d'examen",
            description: "Code postal du centre d'examen principal - peut être modifié dans tous les états sauf success",
            required: false,
          });
        }

        if (selectedFields.includes('dataProvider')) {
          fields['dataProvider'] = Property.StaticDropdown({
            displayName: 'Type de financement',
            description: 'Type de financement du dossier de certification',
            required: false,
            options: {
              disabled: false,
              options: [
                { label: 'Individuel', value: 'individual' },
                { label: 'OPCO', value: 'opco' },
                { label: 'Pôle Emploi', value: 'poleEmploi' },
                { label: 'Entreprise', value: 'company' },
              ],
            },
          });
        }

        if (selectedFields.includes('examinationType')) {
          fields['examinationType'] = Property.StaticDropdown({
            displayName: "Type de passage de l'examen",
            description: "Type de passage de l'examen - peut être modifié dans les états registered, toTake, toControl, toRetake",
            required: false,
            options: {
              disabled: false,
              options: [
                { label: 'À distance', value: 'A_DISTANCE' },
                { label: 'En présentiel', value: 'EN_PRESENTIEL' },
                { label: 'Mixte', value: 'MIXTE' },
              ],
            },
          });
        }

        if (selectedFields.includes('verbatim')) {
          fields['verbatim'] = Property.ShortText({
            displayName: 'Verbatim',
            description: 'Information complémentaire sur la certification - peut être modifié dans tous les états sauf success',
            required: false,
          });
        }

        if (selectedFields.includes('optionName')) {
          fields['optionName'] = Property.ShortText({
            displayName: 'Option',
            description: 'Option si appliquée - peut être modifié dans tous les états sauf success',
            required: false,
          });
        }

        if (selectedFields.includes('accessModality')) {
          fields['accessModality'] = Property.StaticDropdown({
            displayName: "Modalité d'accès",
            description: "Modalité d'accès - peut être modifié dans tous les états sauf success",
            required: false,
            options: {
              disabled: false,
              options: [
                { label: 'Formation initiale hors apprentissage', value: 'FORMATION_INITIALE_HORS_APPRENTISSAGE' },
                { label: 'Formation initiale apprentissage', value: 'FORMATION_INITIALE_APPRENTISSAGE' },
                { label: 'Formation continue hors contrat de professionnalisation', value: 'FORMATION_CONTINUE_HORS_CONTRAT_DE_PROFESSIONNALISATION' },
                { label: 'Formation continue contrat de professionnalisation', value: 'FORMATION_CONTINUE_CONTRAT_DE_PROFESSIONNALISATION' },
                { label: 'VAE', value: 'VAE' },
                { label: 'Équivalence (diplôme étranger)', value: 'EQUIVALENCE_(DIPLOME_ETRANGER)' },
                { label: 'Candidat libre', value: 'CANDIDAT_LIBRE' },
              ],
            },
          });
        }

        if (selectedFields.includes('accessModalityVae')) {
          fields['accessModalityVae'] = Property.StaticDropdown({
            displayName: 'Modalité VAE',
            description: "Requis si la valeur accessModality est 'VAE'",
            required: false,
            options: {
              disabled: false,
              options: [
                { label: 'Congés VAE', value: 'CONGES_VAE' },
                { label: 'VAE classique', value: 'VAE_CLASSIQUE' },
              ],
            },
          });
        }

        if (selectedFields.includes('comment')) {
          fields['comment'] = Property.LongText({
            displayName: 'Commentaire',
            description: 'Commentaires - peut être modifié dans tous les états de certification',
            required: false,
          });
        }

        if (selectedFields.includes('type')) {
          fields['type'] = Property.StaticDropdown({
            displayName: "Initiative de l'inscription",
            description: "Initiative à laquelle l'inscription a été réalisée - peut être modifié dans tous les états sauf success",
            required: false,
            options: {
              disabled: false,
              options: [
                { label: 'Certifié(e)', value: 'CERTIFIE' },
                { label: 'Organisme de formation', value: 'OF' },
                { label: 'Pôle Emploi', value: 'POLE_EMPLOI' },
                { label: 'Employeur', value: 'EMPLOYEUR' },
                { label: 'Autre', value: 'AUTRE' },
              ],
            },
          });
        }

        if (selectedFields.includes('tags')) {
          fields['tags'] = Property.Array({
            displayName: 'Tags',
            description: 'Liste de tags associée au dossier de certification, uniquement pour le certificateur',
            required: false,
          });
        }

        if (selectedFields.includes('cdcExcluded')) {
          fields['cdcExcluded'] = Property.StaticDropdown({
            displayName: "Exclus de l'accrochage",
            description: "Indique si le dossier de certification doit être exclu de l'accrochage",
            required: false,
            options: {
              disabled: false,
              options: [
                { label: 'Non', value: 'false' },
                { label: 'Oui', value: 'true' },
              ],
            },
          });
        }

        if (selectedFields.includes('amountHt')) {
          fields['amountHt'] = Property.Number({
            displayName: 'Prix du passage de la certification (HT)',
            description: 'Prix de vente du passage de la certification (Hors Taxe)',
            required: false,
          });
        }

        if (selectedFields.includes('certificate')) {
          fields['certificate'] = Property.ShortText({
            displayName: 'Fichier du parchemin',
            description: 'Fichier du parchemin de la certification',
            required: false,
          });
        }

        if (selectedFields.includes('certificateId')) {
          fields['certificateId'] = Property.ShortText({
            displayName: 'Identifiant du parchemin',
            description: 'Identifiant du parchemin de la certification (unique pour la certification)',
            required: false,
          });
        }

        if (selectedFields.includes('tiersTemps')) {
          fields['tiersTemps'] = Property.StaticDropdown({
            displayName: 'Tiers temps',
            description: "Indique si le candidat a besoin d'un tiers temps",
            required: false,
            options: {
              disabled: false,
              options: [
                { label: 'Non', value: false },
                { label: 'Oui', value: true },
              ],
            },
          });
        }

        if (selectedFields.includes('cdcTechnicalId')) {
          fields['cdcTechnicalId'] = Property.ShortText({
            displayName: 'Identifiant technique CDC',
            description: "Identifiant technique du passage de la certification pour l'accrochage",
            required: false,
          });
        }

        if (selectedFields.includes('badgeAssertion')) {
          fields['badgeAssertion'] = Property.ShortText({
            displayName: 'Badge de certification',
            description: "Lien vers le badge de la certification - peut être mis à jour par le certificateur et à l'état success",
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
      enrollmentDate,
      examinationDate,
      examinationEndDate,
      examinationPlace,
      examinationCenterZipCode,
      dataProvider,
      examinationType,
      verbatim,
      optionName,
      accessModality,
      accessModalityVae,
      comment,
      type,
      tags,
      cdcExcluded,
      amountHt,
      certificate,
      certificateId,
      tiersTemps,
      cdcTechnicalId,
      badgeAssertion,
    } = dynamicFields || {};

    const message: Record<string, unknown> = {};
    const selectedFields = (fieldsToUpdate as string[]) || [];
    
    selectedFields.forEach((fieldName) => {
      switch (fieldName) {
        case 'enrollmentDate':
          message['enrollmentDate'] = enrollmentDate
            ? dayjs(enrollmentDate).format('YYYY-MM-DD')
            : null;
          break;
        case 'examinationDate':
          message['examinationDate'] = examinationDate
            ? dayjs(examinationDate).format('YYYY-MM-DD')
            : null;
          break;
        case 'examinationEndDate':
          message['examinationEndDate'] = examinationEndDate
            ? dayjs(examinationEndDate).format('YYYY-MM-DD')
            : null;
          break;
        case 'examinationPlace':
          message['examinationPlace'] = examinationPlace || null;
          break;
        case 'examinationCenterZipCode':
          message['examinationCenterZipCode'] = examinationCenterZipCode || null;
          break;
        case 'dataProvider':
          message['dataProvider'] = dataProvider || null;
          break;
        case 'examinationType':
          message['examinationType'] = examinationType || null;
          break;
        case 'verbatim':
          message['verbatim'] = verbatim || null;
          break;
        case 'optionName':
          message['optionName'] = optionName || null;
          break;
        case 'accessModality':
          message['accessModality'] = accessModality || null;
          break;
        case 'accessModalityVae':
          message['accessModalityVae'] = accessModalityVae || null;
          break;
        case 'comment':
          message['comment'] = comment || null;
          break;
        case 'type':
          message['type'] = type || null;
          break;
        case 'tags':
          message['tags'] = tags && tags.length > 0 ? (tags as string[]) : null;
          break;
        case 'cdcExcluded':
          message['cdcExcluded'] = cdcExcluded || null;
          break;
        case 'amountHt':
          message['amountHt'] = amountHt !== undefined ? amountHt : null;
          break;
        case 'certificate':
          message['certificate'] = certificate || null;
          break;
        case 'certificateId':
          message['certificateId'] = certificateId || null;
          break;
        case 'tiersTemps':
          message['tiersTemps'] = tiersTemps !== undefined ? tiersTemps : null;
          break;
        case 'cdcTechnicalId':
          message['cdcTechnicalId'] = cdcTechnicalId || null;
          break;
        case 'badgeAssertion':
          message['badgeAssertion'] = badgeAssertion || null;
          break;
      }
    });

    return (
      await httpClient.sendRequest({
        method: HttpMethod.PUT,
        body: message,
        url:
          wedofCommon.baseUrl +
          '/certificationFolders/' +
          context.propsValue['externalId'],
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
