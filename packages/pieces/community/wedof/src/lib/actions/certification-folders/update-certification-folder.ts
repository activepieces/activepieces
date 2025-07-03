import {HttpMethod, httpClient} from '@activepieces/pieces-common';
import {wedofAuth} from '../../..';
import {createAction, Property} from '@activepieces/pieces-framework';
import {wedofCommon} from '../../common/wedof';
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
        enrollmentDate: Property.DateTime({
            displayName: 'Date d\'inscription à la certification',
            description: 'Date au format YYYY-MM-DD',
            required: false,
        }),
        examinationDate: Property.DateTime({
            displayName: 'Date de début l\'examen de certification',
            description: 'Date au format YYYY-MM-DD',
            required: false,
        }),
        examinationEndDate: Property.DateTime({
            displayName: 'Date de fin l\'examen de certification',
            description: 'Date au format YYYY-MM-DD',
            required: false,
        }),
        examinationPlace: Property.ShortText({
            displayName: 'Lieu de l\'examen',
            description: "Lieu de l'examen de certification (ou lien https)",
            required: false,
        }),
        tiersTemps: Property.StaticDropdown({
            displayName: "Tiers temps",
            description: "Indique si le candidat a besoin d'un tiers temps",
            required: false,
            options: {
                disabled: false,
                options: [
                  {
                    label: "Non",
                    value: false,
                  },
                  {
                    label: 'Oui',
                    value: true,
                  },
                ],
              },
        }),
        comment: Property.LongText({
            displayName: 'Commentaire',
            description: "Commentaire (non-visible par l'apprenant)",
            required: false,
        }),
        verbatim: Property.ShortText({
            displayName: 'Verbatim',
            description: "Verbatim",
            required: false,
        }),
        amountHt: Property.Number({
            displayName: 'Prix du passage de la certification',
            description: 'Tarif en €',
            required: false,
        }),
        tags: Property.Array({
            displayName: "Tags",
            description: "Liste de tags associée au dossier de certification, si vous souhaitez garder vos précédents tags, il faut les réécrire dans le champ",
            required: false,
          }),
    },
    async run(context) {
        const message = {
            enrollmentDate: context.propsValue.enrollmentDate
                ? dayjs(context.propsValue.enrollmentDate).format('YYYY-MM-DD')
                : null,
            examinationDate: context.propsValue.examinationDate,
            examinationEndDate: context.propsValue.examinationEndDate,
            examinationPlace: context.propsValue.examinationPlace,
            comment: context.propsValue.comment,
            verbatim: context.propsValue.verbatim,
            amountHt: context.propsValue.amountHt,
            tags: context.propsValue.tags as string[],
            tiersTemps: context.propsValue.tiersTemps,
        };
        return (
            await httpClient.sendRequest({
                method: HttpMethod.PUT,
                body: message,
                url:
                    wedofCommon.baseUrl +
                    '/certificationFolders/' +
                    context.propsValue.externalId,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': context.auth as string,
                },
            })
        ).body;
    },
});
