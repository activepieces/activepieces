import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { wedofCommon } from './lib/common/wedof';
import { newRegistrationFolderNotProcessed } from './lib/triggers/registration-folders/new-registration-folder-created';
import { registrationFolderUpdated } from './lib/triggers/registration-folders/registration-folder-updated';
import { registrationFolderAccepted } from './lib/triggers/registration-folders/registration-folder-accepted';
import { registrationFolderPaid } from './lib/triggers/registration-folders/registration-folder-paid';
import { registrationFolderSelected } from './lib/triggers/registration-folders/registration-folder-selected';
import { registrationFolderTobill } from './lib/triggers/registration-folders/registration-folder-tobill';
import { validateRegistrationFolder } from './lib/actions/registration-folders/validate-registration-folder';
import { updateRegistrationFolder } from './lib/actions/registration-folders/update-registration-folder';
import { searchRegistrationFolder } from './lib/actions/registration-folders/search-registration-folder';
import { declareRegistrationFolderTerminated } from './lib/actions/registration-folders/declare-registration-folder-terminated';
import { declareRegistrationFolderServicedone } from './lib/actions/registration-folders/declare-registration-folder-servicedone';
import { declareRegistrationFolderIntraining } from './lib/actions/registration-folders/declare-registration-folder-intraining';
import { billRegistrationFolder } from './lib/actions/registration-folders/bill-registration-folder';
import { registrationFolderInTraining } from './lib/triggers/registration-folders/registration-folder-inTraining';
import { registrationFolderTerminated } from './lib/triggers/registration-folders/registration-folder-terminated';
import { getRegistrationFolder } from './lib/actions/registration-folders/get-registration-folder';
import { cancelRegistrationFolder } from './lib/actions/registration-folders/cancel-registration-folder';
import { refuseRegistrationFolder } from './lib/actions/registration-folders/refuse-registration-folder';
import { getMinimalSessionDates } from './lib/actions/registration-folders/get-minimal-session-dates';
import { certificationFolderUpdated } from './lib/triggers/certification-folders/certification-folder-updated';
import { certificationFolderSuccess } from './lib/triggers/certification-folders/certification-folder-success';
import { newCertificationFolderCreated } from './lib/triggers/certification-folders/new-certification-folder-created';
import { certificationFolderTotake } from './lib/triggers/certification-folders/certification-folder-totake';
import { certificationFolderToretake } from './lib/triggers/certification-folders/certification-folder-toretake';
import { certificationFolderRegistred } from './lib/triggers/certification-folders/certification-folder-registred';
import { certificationFolderToControl } from './lib/triggers/certification-folders/certification-folder-tocontrol';
import { certificationFolderSelected } from './lib/triggers/certification-folders/certification-folder-selected';
import { declareCertificationFolderRegistred } from './lib/actions/certification-folders/declare-certification-folder-registred';
import { declareCertificationFolderToTake } from './lib/actions/certification-folders/declare-certification-folder-totake';
import { declareCertificationFolderToControl } from './lib/actions/certification-folders/declare-certification-folder-tocontrol';
import { declareCertificationFolderSuccess } from './lib/actions/certification-folders/declare-certification-folder-success';
import { declareCertificationFolderToRetake } from './lib/actions/certification-folders/declare-certification-folder-toretake';
import { declareCertificationFolderFailed } from './lib/actions/certification-folders/declare-certification-folder-failed';
import { refuseCertificationFolder } from './lib/actions/certification-folders/refuse-certification-folder';
import { abortCertificationFolder } from './lib/actions/certification-folders/abort-certification-folder';
import { getCertificationFolder } from './lib/actions/certification-folders/get-certification-folder';
import { searchCertificationFolder } from './lib/actions/certification-folders/search-certification-folder';
import { getCertificationFolderDocuments } from './lib/actions/certification-folders/list-certification-folder-documents';
import { listActivitiesAndTasks } from './lib/actions/list-activities-and-tasks';
import { createTask } from './lib/actions/create-task';
import { createActivitie } from './lib/actions/create-activitie';
import { sendFile } from './lib/actions/send-file';
import { getRegistrationFolderDocuments } from './lib/actions/registration-folders/list-registration-folder-documents';
import {updateCertificationFolder} from "./lib/actions/certification-folders/update-certification-folder";
import { updateCompletionRate } from './lib/actions/registration-folders/update-completion-rate';
import { certificationFolderSurveyInitialExperienceAvailable } from './lib/triggers/certification-folder-survey/certification-folder-survey-initial-experience-available';
import { certificationFolderSurveyInitialExperienceAnswered } from './lib/triggers/certification-folder-survey/certification-folder-survey-initial-experience-answered';
import { certificationFolderSurveyLongTermExperienceAnswered } from './lib/triggers/certification-folder-survey/certification-folder-survey-long-experience-answered';
import { certificationFolderSurveyLongTermExperienceAvailable } from './lib/triggers/certification-folder-survey/certification-folder-survey-long-experience-available';
import { certificationFolderSurveySixMonthExperienceAnswered } from './lib/triggers/certification-folder-survey/certification-folder-survey-six-month-experience-answered';
import { certificationFolderSurveySixMonthExperienceAvailable } from './lib/triggers/certification-folder-survey/certification-folder-survey-six-month-experience-available';
import { getCertificationFolderSurvey } from './lib/actions/certification-folder-survey/get-certification-folder-survey';
import { listCertificationFolderSurveys } from './lib/actions/certification-folder-survey/list-certification-folder-surveys';

export const wedofAuth = PieceAuth.SecretText({
    displayName: 'Clé API',
    required: true,
    description: 'Veuillez saisir votre clé API fournie par wedof',
    validate: async ({auth}) => {
        try {
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: wedofCommon.baseUrl + '/users/me',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': auth,
                },
            });
            return {valid: true};
        } catch (error) {
            return {
                valid: false,
                error: 'Clé Api invalide',
            };
        }
    },
});

export const wedof = createPiece({
  displayName: 'Wedof',
  auth: wedofAuth,
  description:
    'Automatisez la gestion de vos dossiers de formations (CPF, EDOF, Kairos, AIF, OPCO et autres)',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/wedof.svg',
  categories: [
    PieceCategory.SALES_AND_CRM,
    PieceCategory.CONTENT_AND_FILES,
    PieceCategory.PRODUCTIVITY,
  ],
  authors: ['vbarrier','obenazouz'],
  actions: [
    ////////////// registrationFolders ////////////
    getRegistrationFolder,
    searchRegistrationFolder,
    updateRegistrationFolder,
    validateRegistrationFolder,
    declareRegistrationFolderTerminated,
    declareRegistrationFolderServicedone,
    declareRegistrationFolderIntraining,
    billRegistrationFolder,
    cancelRegistrationFolder,
    refuseRegistrationFolder,
    getMinimalSessionDates,
    getRegistrationFolderDocuments,
    updateCompletionRate,
    ////////////// certificationFolders ////////////
    getCertificationFolder,
    searchCertificationFolder,
    declareCertificationFolderRegistred,
    declareCertificationFolderToTake,
    declareCertificationFolderToControl,
    declareCertificationFolderSuccess,
    declareCertificationFolderToRetake,
    declareCertificationFolderFailed,
    refuseCertificationFolder,
    abortCertificationFolder,
    getCertificationFolderDocuments,
    updateCertificationFolder,
    listActivitiesAndTasks,
    createTask,
    createActivitie,
    sendFile,
    ///////////// certificationFoldersSurvey ///////
    getCertificationFolderSurvey,
    listCertificationFolderSurveys
  ],
  triggers: [
    ////////////// registrationFolders ////////////
    newRegistrationFolderNotProcessed,
    registrationFolderUpdated,
    registrationFolderAccepted,
    registrationFolderInTraining,
    registrationFolderTerminated,
    registrationFolderPaid,
    registrationFolderSelected,
    registrationFolderTobill,
    ////////////// certificationFolders ////////////
    newCertificationFolderCreated,
    certificationFolderUpdated,
    certificationFolderRegistred,
    certificationFolderTotake,
    certificationFolderToControl,
    certificationFolderSuccess,
    certificationFolderToretake,
    certificationFolderSelected,
    ///////////// certificationFoldersSurvey ///////
    certificationFolderSurveyInitialExperienceAvailable,
    certificationFolderSurveyInitialExperienceAnswered,
    certificationFolderSurveyLongTermExperienceAnswered,
    certificationFolderSurveyLongTermExperienceAvailable,
    certificationFolderSurveySixMonthExperienceAnswered,
    certificationFolderSurveySixMonthExperienceAvailable
  ],
});
