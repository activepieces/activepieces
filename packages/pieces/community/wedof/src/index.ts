import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { PieceAuth, createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { getCertificationFolderSurvey } from './lib/actions/certification-folder-survey/get-certification-folder-survey'
import { listCertificationFolderSurveys } from './lib/actions/certification-folder-survey/list-certification-folder-surveys'
import { abortCertificationFolder } from './lib/actions/certification-folders/abort-certification-folder'
import { declareCertificationFolderFailed } from './lib/actions/certification-folders/declare-certification-folder-failed'
import { declareCertificationFolderRegistred } from './lib/actions/certification-folders/declare-certification-folder-registred'
import { declareCertificationFolderSuccess } from './lib/actions/certification-folders/declare-certification-folder-success'
import { declareCertificationFolderToControl } from './lib/actions/certification-folders/declare-certification-folder-tocontrol'
import { declareCertificationFolderToRetake } from './lib/actions/certification-folders/declare-certification-folder-toretake'
import { declareCertificationFolderToTake } from './lib/actions/certification-folders/declare-certification-folder-totake'
import { getCertificationFolder } from './lib/actions/certification-folders/get-certification-folder'
import { getCertificationFolderDocuments } from './lib/actions/certification-folders/list-certification-folder-documents'
import { refuseCertificationFolder } from './lib/actions/certification-folders/refuse-certification-folder'
import { searchCertificationFolder } from './lib/actions/certification-folders/search-certification-folder'
import { updateCertificationFolder } from './lib/actions/certification-folders/update-certification-folder'
import { createCertificationPartnerAudit } from './lib/actions/certification-partner-audit/create-certification-partner-audit'
import { createGeneralAudit } from './lib/actions/certification-partner-audit/create-general-audit'
import { createPartnership } from './lib/actions/certification-partner/create-partnership'
import { deletePartnership } from './lib/actions/certification-partner/delete-partnership'
import { getPartnership } from './lib/actions/certification-partner/get-partnership'
import { listPartnerships } from './lib/actions/certification-partner/list-partnership'
import { resetPartnership } from './lib/actions/certification-partner/reset-partnership'
import { updatePartnership } from './lib/actions/certification-partner/update-partnership'
import { createActivitie } from './lib/actions/create-activitie'
import { createTask } from './lib/actions/create-task'
import { listActivitiesAndTasks } from './lib/actions/list-activities-and-tasks'
import { me } from './lib/actions/me'
import { myOrganism } from './lib/actions/my-organism'
import { billRegistrationFolder } from './lib/actions/registration-folders/bill-registration-folder'
import { cancelRegistrationFolder } from './lib/actions/registration-folders/cancel-registration-folder'
import { declareRegistrationFolderIntraining } from './lib/actions/registration-folders/declare-registration-folder-intraining'
import { declareRegistrationFolderServicedone } from './lib/actions/registration-folders/declare-registration-folder-servicedone'
import { declareRegistrationFolderTerminated } from './lib/actions/registration-folders/declare-registration-folder-terminated'
import { getMinimalSessionDates } from './lib/actions/registration-folders/get-minimal-session-dates'
import { getRegistrationFolder } from './lib/actions/registration-folders/get-registration-folder'
import { getRegistrationFolderDocuments } from './lib/actions/registration-folders/list-registration-folder-documents'
import { refuseRegistrationFolder } from './lib/actions/registration-folders/refuse-registration-folder'
import { searchRegistrationFolder } from './lib/actions/registration-folders/search-registration-folder'
import { updateCompletionRate } from './lib/actions/registration-folders/update-completion-rate'
import { updateRegistrationFolder } from './lib/actions/registration-folders/update-registration-folder'
import { validateRegistrationFolder } from './lib/actions/registration-folders/validate-registration-folder'
import { sendFile } from './lib/actions/send-file'
import { wedofCommon } from './lib/common/wedof'
import { certificationFolderSurveyInitialExperienceAnswered } from './lib/triggers/certification-folder-survey/certification-folder-survey-initial-experience-answered'
import { certificationFolderSurveyInitialExperienceAvailable } from './lib/triggers/certification-folder-survey/certification-folder-survey-initial-experience-available'
import { certificationFolderSurveyLongTermExperienceAnswered } from './lib/triggers/certification-folder-survey/certification-folder-survey-long-experience-answered'
import { certificationFolderSurveyLongTermExperienceAvailable } from './lib/triggers/certification-folder-survey/certification-folder-survey-long-experience-available'
import { certificationFolderSurveySixMonthExperienceAnswered } from './lib/triggers/certification-folder-survey/certification-folder-survey-six-month-experience-answered'
import { certificationFolderSurveySixMonthExperienceAvailable } from './lib/triggers/certification-folder-survey/certification-folder-survey-six-month-experience-available'
import { certificationFolderRegistred } from './lib/triggers/certification-folders/certification-folder-registred'
import { certificationFolderSelected } from './lib/triggers/certification-folders/certification-folder-selected'
import { certificationFolderSuccess } from './lib/triggers/certification-folders/certification-folder-success'
import { certificationFolderToControl } from './lib/triggers/certification-folders/certification-folder-tocontrol'
import { certificationFolderToretake } from './lib/triggers/certification-folders/certification-folder-toretake'
import { certificationFolderTotake } from './lib/triggers/certification-folders/certification-folder-totake'
import { certificationFolderUpdated } from './lib/triggers/certification-folders/certification-folder-updated'
import { newCertificationFolderCreated } from './lib/triggers/certification-folders/new-certification-folder-created'
import { certificationPartnerAborted } from './lib/triggers/certification-partner/certificationPartner-aborted'
import { certificationPartnerActive } from './lib/triggers/certification-partner/certificationPartner-active'
import { certificationPartnerProcessing } from './lib/triggers/certification-partner/certificationPartner-processing'
import { certificationPartnerRefused } from './lib/triggers/certification-partner/certificationPartner-refused'
import { certificationPartnerRevoked } from './lib/triggers/certification-partner/certificationPartner-revoked'
import { certificationPartnerSuspended } from './lib/triggers/certification-partner/certificationPartner-suspended'
import { newRegistrationFolderNotProcessed } from './lib/triggers/registration-folders/new-registration-folder-created'
import { registrationFolderAccepted } from './lib/triggers/registration-folders/registration-folder-accepted'
import { registrationFolderInTraining } from './lib/triggers/registration-folders/registration-folder-inTraining'
import { registrationFolderPaid } from './lib/triggers/registration-folders/registration-folder-paid'
import { registrationFolderSelected } from './lib/triggers/registration-folders/registration-folder-selected'
import { registrationFolderTerminated } from './lib/triggers/registration-folders/registration-folder-terminated'
import { registrationFolderTobill } from './lib/triggers/registration-folders/registration-folder-tobill'
import { registrationFolderUpdated } from './lib/triggers/registration-folders/registration-folder-updated'

export const wedofAuth = PieceAuth.SecretText({
  displayName: 'Clé API',
  required: true,
  description: 'Veuillez saisir votre clé API fournie par wedof',
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: wedofCommon.baseUrl + '/users/me',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': auth,
        },
      })
      return { valid: true }
    } catch (error) {
      return {
        valid: false,
        error: 'Clé Api invalide',
      }
    }
  },
})

export const wedof = createPiece({
  displayName: 'Wedof',
  auth: wedofAuth,
  description: 'Automatisez la gestion de vos dossiers de formations (CPF, EDOF, Kairos, AIF, OPCO et autres)',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/wedof.svg',
  categories: [PieceCategory.SALES_AND_CRM, PieceCategory.CONTENT_AND_FILES, PieceCategory.PRODUCTIVITY],
  authors: ['vbarrier', 'obenazouz'],
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
    ////////////// general ////////////
    listActivitiesAndTasks,
    createTask,
    createActivitie,
    sendFile,
    me,
    myOrganism,
    ///////////// certificationFoldersSurvey ///////
    getCertificationFolderSurvey,
    listCertificationFolderSurveys,
    ///////////// certificationPartnerAudit ////////
    createCertificationPartnerAudit,
    createGeneralAudit,
    //////////// certificationPartner //////////////
    getPartnership,
    updatePartnership,
    deletePartnership,
    listPartnerships,
    createPartnership,
    resetPartnership,
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
    certificationFolderSurveySixMonthExperienceAvailable,
    //////////// certificationPartner /////////////////
    certificationPartnerAborted,
    certificationPartnerProcessing,
    certificationPartnerActive,
    certificationPartnerRefused,
    certificationPartnerRevoked,
    certificationPartnerSuspended,
  ],
})
