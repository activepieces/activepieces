import { HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';
import dayjs from 'dayjs';

export const searchCertificationFolder = createAction({
    auth: wedofAuth,
    name: 'searchCertificationFolder',
    displayName: 'Rechercher un ou plusieurs dossiers de certifications',
    description: 'Liste les dossiers de certifications en fonction des critères sélectionnés',
    props: {
        query: Property.ShortText({
            displayName: 'Recherche',
            description: 'Permet d\'effectuer une recherche libre sur les champs nom du candidat, prénom du candidat, email du candidat, tags, commentaire, id du dossier de certification et phoneNumber',
            required: false
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
                    ['next', 'future', 'tomorrow'].some((v) =>_period.toLowerCase().includes(v)          
                )) {          
                    props['filterOnStateDate'] = wedofCommon.filterOnStateDateFutureCf;
                        } else if (_period) {
                                    props['filterOnStateDate'] = wedofCommon.filterOnStateDateCf;
                                    }        
                                    return props;
                                },    
                            }),
        state: Property.StaticMultiSelectDropdown({
            displayName: 'Etat du dossier de certification',
            description: 'Permet de n\'obtenir que les dossiers dans l\'état d\'obtention de la certification considéré. Plusieurs états peuvent être sélectionnés.',
            required: false,
            options: {
                options: [
                    { value: 'all', label: 'Tous' },
                    { value: 'toRegister', label: 'À inscrire' },
                    { value: 'refused', label: 'Refusé' },
                    { value: 'registered', label: 'Inscrit' },
                    { value: 'toTake', label: 'À passer' },
                    { value: 'toControl', label: 'À contrôler' },
                    { value: 'toRetake', label: 'À repasser' },
                    { value: 'failed', label: 'Échoué' },
                    { value: 'aborted', label: 'Abandonné' },
                    { value: 'success', label: 'Réussi' }
                ]
            }
        }),
        registrationFolderState: Property.StaticMultiSelectDropdown({
            displayName: 'État du dossier de formation',
            description: 'Permet de n\'obtenir que les dossiers dans l\'état considéré. Plusieurs états peuvent être sélectionnés.',
            required: false,
            options: {
                options: [
                    { value: 'notProcessed', label: 'Non traité' },
                    { value: 'validated', label: 'Validé' },
                    { value: 'waitingAcceptation', label: 'En attente d\'acceptation' },
                    { value: 'rejectedWithoutTitulaireSuite', label: 'Rejeté sans suite titulaire' },
                    { value: 'rejected', label: 'Rejeté' },
                    { value: 'rejectedWithoutCdcSuite', label: 'Rejeté sans suite CDC' },
                    { value: 'accepted', label: 'Accepté' },
                    { value: 'inTraining', label: 'En formation' },
                    { value: 'terminated', label: 'Terminé' },
                    { value: 'serviceDoneDeclared', label: 'Service déclaré fait' },
                    { value: 'serviceDoneValidated', label: 'Service validé fait' },
                    { value: 'canceledByAttendee', label: 'Annulé par le candidat' },
                    { value: 'canceledByAttendeeNotRealized', label: 'Annulé par candidat non réalisé' },
                    { value: 'canceledByOrganism', label: 'Annulé par l\'organisme' },
                    { value: 'refusedByAttendee', label: 'Refusé par le candidat' },
                    { value: 'refusedByOrganism', label: 'Refusé par l\'organisme' }
                ]
            }
        }),
        sort: Property.StaticDropdown({
            displayName: 'Tri sur critère',
            description: 'Trie les résultats sur un critère',
            required: false,
            options: {
                options: [
                    { value: 'stateLastUpdate', label: "Date du dernier changement d'état" },
                    { value: 'id', label: 'ID de base de données' },
                    { value: 'successDate', label: 'Date de réussite' }
                ]
            }
        }),
        order: Property.StaticDropdown({
            displayName: 'Ordre',
            description: 'Tri les résultats par ordre ascendant ou descendant',
            required: false,
            options: {
                options: [
                    { value: 'asc', label: 'Ascendant' },
                    { value: 'desc', label: 'Descendant' }
                ]
            }
        }),
        cdcState: Property.StaticDropdown({
            displayName: 'État CDC',
            description: 'Permet de n\'obtenir que les dossiers dans l\'état considéré lié à l\'export des dossiers',
            required: false,
            options: {
                options: [
                    { value: 'all', label: 'Tous' },
                    { value: 'notExported', label: 'Jamais accroché' },
                    { value: 'exported', label: "Envoyé et en attente de l'accusé" },
                    { value: 'processedOk', label: 'Accrochage réussi' },
                    { value: 'processedKo', label: 'Accrochage en erreur' }
                ]
            }
        }),
        cdcExcluded: Property.StaticDropdown({
            displayName: "Exclus de l'accrochage",
            description: "Permet de filtrer les dossiers de certification qui sont exclus de l'accrochage",
            required: false,
            options: {
                options: [
                    { value: true, label: 'Oui' },
                    { value: false, label: 'Non' }
                ]
            }
        }),
        cdcCompliant: Property.StaticDropdown({
            displayName: 'Données apprenant complètes',
            description: "Permet de filtrer les dossiers de certification selon le fait qu'ils contiennent les données de l'apprenant obligatoires pour l'accrochage en cas d'obtention de la certification",
            required: false,
            options: {
                options: [
                    { value: true, label: 'Oui' },
                    { value: false, label: 'Non' }
                ]
            }
        }),
        cdcToExport: Property.StaticDropdown({
            displayName: 'Inclus dans les prochains accrochages',
            description: "Permet de filtrer les dossiers de certification qui devront être inclus dans les prochains exports pour l'accrochage",
            required: false,
            options: {
                options: [
                    { value: true, label: 'Oui' },
                    { value: false, label: 'Non' }
                ]
            }
        }),
        certifInfo: Property.Array({
            displayName: 'ID certification',
            description: 'Permet de n\'obtenir que les dossiers liés à la certification considérée',
            required: false
        }),
        dataProvider: Property.StaticMultiSelectDropdown({
            displayName: 'Type de financement',
            description: 'Permet de n\'obtenir que les dossiers dans le type considéré. Plusieurs types peuvent être sélectionnés.',
            required: false,
            options: {
                options: [
                    { value: 'cpf', label: 'CPF' },
                    { value: 'individual', label: 'Individuel' },
                    { value: 'poleEmploi', label: 'Pôle Emploi' },
                    { value: 'company', label: 'Entreprise' },
                    { value: 'opco', label: 'OPCO' },
                    { value: 'opcoCfa', label: 'OPCO CFA' },
                    { value: 'kairosAif', label: 'Kairos AIF' },
                    { value: 'none', label: 'Aucun' }
                ]
            }
        }),
        siret: Property.Array({
            displayName: 'SIRET',
            description: 'Permet de n\'obtenir que les dossiers issus de l\'organisme de formation de siret considéré. Utilisez "all" pour récupérer tous les dossiers de tous les organismes.',
            required: false,
            defaultValue:['all']
        }),
        tags: Property.Array({
            displayName: 'Tags',
            description: "Recherche libre sur les tags",
            required: false
        }),
        format: Property.StaticDropdown({
            displayName: 'Format de sortie',
            description: 'Permet d\'obtenir une liste des dossiers de certification au format json ou csv',
            required: false,
            defaultValue: 'json',
            options: {
                options: [
                    { value: 'json', label: 'JSON' },
                    { value: 'csv', label: 'CSV' }
                ]
            }
        }),
        limit: Property.Number({
            displayName: 'Limite',
            description: 'Nombre de dossiers de certification',
            defaultValue: 100,
            required: false
        }),
        page: Property.Number({
            displayName: 'Page',
            description: 'Numéro de page de la requête',
            defaultValue: 1,
            required: false
        }),
        cdcFile: Property.ShortText({
            displayName: 'Fichier CDC',
            description: 'Permet de filtrer les dossiers de certification exportés sur un fichier XML lié à l\'accrochage',
            required: false
        }),
        certificatePrintData: Property.StaticDropdown({
            displayName: 'Données d\'impression de certificat',
            description: 'Permet de n\'obtenir que les dossiers pour lesquels un parchemin est en cours d\'impression ou a été imprimé',
            required: false,
            options: {
                options: [
                    { value: true, label: 'Oui' },
                    { value: false, label: 'Non' }
                ]
            }
        }),
        columnId: Property.ShortText({
            displayName: 'ID de colonne',
            description: 'Identifiant pour affichage personnalisé',
            required: false
        }),
        registrationFolderCompletionRate: Property.StaticDropdown({
            displayName: "Taux d'avancement",
            description: "Permet de n'obtenir que les dossiers dont le taux d'avancement choisi",
            required: false,
            options: {
                options: [
                    { value: '>80', label: 'Supérieur à 80%' },
                    { value: '<80', label: 'Inférieur à 80%' }
                ]
            }
        }),
        skillSets: Property.ShortText({
            displayName: 'Blocs de compétences',
            description: 'Permet de n\'obtenir que les dossiers liés à une certification RNCP pour les blocs de compétences considérés',
            required: false
        }),
        survey: Property.StaticDropdown({
            displayName: "Questionnaire de suivi d'insertion professionnelle",
            description: 'Permet de n\'obtenir que les dossiers pour lesquels un questionnaire doit être répondu ou a été répondu',
            required: false,
            options: {
                options: [
                    { label: 'Questionnaire "Situation professionnelle en début de cursus" est accessible (Enquête créée)', value: 'initialExperienceStartDate',},
                    { label: 'Questionnaire "Situation professionnelle de 6 mois" est accessible', value: 'sixMonthExperienceStartDate',},          
                    { label: 'Questionnaire "Situation professionnelle au moins un an" est accessible', value: 'longTermExperienceStartDate',},          
                    { label: 'Questionnaire "Situation professionnelle en début de cursus" répondu', value: 'initialExperienceAnsweredDate',},          
                    { label: 'Questionnaire "Situation professionnelle de 6 mois" répondu', value: 'sixMonthExperienceAnsweredDate',},          
                    { label: 'Questionnaire "Situation professionnelle au moins un an" répondu', value: 'longTermExperienceAnsweredDate',},
                ]
            }
        }),
        metadata: Property.Array({
            displayName: 'Données personnalisées',
            description: 'tableau associatif clé - valeur, disponible uniquement pour le certificateur',
            required: false,
        }),
        messageState: Property.StaticDropdown({
            displayName: 'État du message',
            description: 'Permet de n\'obtenir que les dossiers liés à l\'état d\'envoi d\'un message considéré',
            required: false,
            options: {
                options: [
                    { value: 'sent', label: 'Message envoyé' },
                    { value: 'notSent', label: 'Message non envoyé' },
                    { value: 'notSentUnauthorized', label: 'Message non envoyé (non autorisé)' },
                    { value: 'notSentEnforcedConditions', label: 'Message non envoyé (conditions renforcées)' },
                    { value: 'failed', label: "Échec de l'envoi" },
                    { value: 'scheduled', label: 'Envoi programmé' }
                ]
            }
        }),
        messageTemplate: Property.ShortText({
            displayName: 'Modèle de message',
            description: "Permet de n'obtenir que les dossiers pour lequels un message issue du modèle considéré a été créé - par défaut aucun filtre",
            required: false
        })
    },
    async run(context) {
        const props = context.propsValue;
        const params = {
            query: props.query ?? null,
            limit: props.limit ?? null,
            page: props.page ?? null,
            period: props.period ?? null,
            state: props.state && props.state.length > 0 ? props.state.join(',') : null,
            registrationFolderState: props.registrationFolderState && props.registrationFolderState.length > 0 ? props.registrationFolderState.join(',') : null,
            sort: props.sort ?? null,
            order: props.order ?? null,
            cdcState: props.cdcState ?? null,
            cdcExcluded: props.cdcExcluded ?? null,
            cdcCompliant: props.cdcCompliant ?? null,
            cdcToExport: props.cdcToExport ?? null,
            certifInfo: props.certifInfo && props.certifInfo.length > 0 ? props.certifInfo.join(',') : null,
            dataProvider: props.dataProvider && props.dataProvider.length > 0 ? props.dataProvider.join(',') : null,
            siret: props.siret && props.siret.length > 0 ? props.siret.join(',') : null,
            tags: props.tags && props.tags.length > 0 ? props.tags.join(',') : null,
            format: props.format ?? null,
            since: props.periodForm?.['since']
                ? dayjs(props.periodForm['since'])
                    .startOf('day')
                    .format('YYYY-MM-DDTHH:mm:ssZ')
                : null,
            until: props.periodForm?.['until']
                ? dayjs(props.periodForm['until'])
                    .endOf('day')
                    .format('YYYY-MM-DDTHH:mm:ssZ')
                : null,
            filterOnStateDate: props.periodForm?.['filterOnStateDate'] ?? null,
            cdcFile: props.cdcFile ?? null,
            certificatePrintData: props.certificatePrintData ?? null,
            columnId: props.columnId ?? null,
            registrationFolderCompletionRate: props.registrationFolderCompletionRate ?? null,
            skillSets: props.skillSets ?? null,
            survey: props.survey ?? null,
            metadata: context.propsValue.metadata ?? [],
            messageState: props.messageState ?? null,
            messageTemplate: props.messageTemplate ?? null,
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
    }
});
