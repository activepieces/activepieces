import {
    createPiece,
    PieceAuth,
} from '@activepieces/pieces-framework';
import {PieceCategory} from '@activepieces/shared';
import {
    httpClient,
    HttpMethod,
} from '@activepieces/pieces-common';
import {wedofCommon} from './lib/common/wedof';
import {newRegistrationFolderNotProcessed} from './lib/triggers/new-registration-folder-created';
import {registrationFolderUpdated} from './lib/triggers/registration-folder-updated';
import {registrationFolderAccepted} from './lib/triggers/registration-folder-accepted';
import {registrationFolderPaid} from './lib/triggers/registration-folder-paid';
import {registrationFolderSelected} from './lib/triggers/registration-folder-selected';
import {registrationFolderTobill} from './lib/triggers/registration-folder-tobill';
import {validateRegistrationFolder} from './lib/actions/validate-registration-folder';
import {updateRegistrationFolder} from './lib/actions/update-registration-folder';
import {searchRegistrationFolder} from './lib/actions/search-registration-folder';
import {declareRegistrationFolderTerminated} from './lib/actions/declare-registration-folder-terminated';
import {declareRegistrationFolderServicedone} from './lib/actions/declare-registration-folder-servicedone';
import {declareRegistrationFolderIntraining} from './lib/actions/declare-registration-folder-intraining';
import {billRegistrationFolder} from './lib/actions/bill-registration-folder';
import {registrationFolderInTraining} from "./lib/triggers/registration-folder-inTraining";
import {registrationFolderTerminated} from "./lib/triggers/registration-folder-terminated";
import {getRegistrationFolder} from "./lib/actions/get-registration-folder";
import {cancelRegistrationFolder} from "./lib/actions/cancel-registration-folder";
import {refuseRegistrationFolder} from "./lib/actions/refuse-registration-folder";
import {getMinimalSessionDates} from "./lib/actions/get-minimal-session-dates";

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
      });
      return { valid: true };
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
    description: 'Automatisez la gestion de vos dossiers de formations (CPF, EDOF, Kairos, AIF, OPCO et autres)',
    minimumSupportedRelease: '0.20.0',
    logoUrl: 'https://www.wedof.fr/assets/images/logo/logo.svg',
    categories: [
        PieceCategory.SALES_AND_CRM,
        PieceCategory.CONTENT_AND_FILES,
        PieceCategory.PRODUCTIVITY,
    ],
    authors: ['vbarrier', 'obenazouz'],
    actions: [
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
        getMinimalSessionDates
    ],
    triggers: [
        newRegistrationFolderNotProcessed,
        registrationFolderUpdated,
        registrationFolderAccepted,
        registrationFolderInTraining,
        registrationFolderTerminated,
        registrationFolderPaid,
        registrationFolderSelected,
        registrationFolderTobill],
});
