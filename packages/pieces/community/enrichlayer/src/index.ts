import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

import { getSchoolProfile } from './lib/actions/get-school-profile';
import { getCompanyProfile } from './lib/actions/get-company-profile';
import { getPersonProfile } from './lib/actions/get-person-profile';
import { getCompanyLookup } from './lib/actions/get-company-lookup';
import { getCompanyIdLookup } from './lib/actions/get-company-id-lookup';
import { getCompanyPicture } from './lib/actions/get-company-picture';
import { getPersonPicture } from './lib/actions/get-person-picture';
import { getEmployeeListing } from './lib/actions/get-employee-listing';
import { getEmployeeCount } from './lib/actions/get-employee-count';
import { getEmployeeSearch } from './lib/actions/get-employee-search';
import { getPersonLookup } from './lib/actions/get-person-lookup';
import { getRoleLookup } from './lib/actions/get-role-lookup';
import { getReverseEmailLookup } from './lib/actions/get-reverse-email-lookup';
import { getReversePhoneLookup } from './lib/actions/get-reverse-phone-lookup';
import { getWorkEmailLookup } from './lib/actions/get-work-email-lookup';
import { getPersonalContact } from './lib/actions/get-personal-contact';
import { getPersonalEmail } from './lib/actions/get-personal-email';
import { getDisposableEmailCheck } from './lib/actions/get-disposable-email-check';
import { getStudentListing } from './lib/actions/get-student-listing';
import { getJobProfile } from './lib/actions/get-job-profile';
import { getJobSearch } from './lib/actions/get-job-search';
import { getJobCount } from './lib/actions/get-job-count';
import { getCompanySearch } from './lib/actions/get-company-search';
import { getPersonSearch } from './lib/actions/get-person-search';
import { getCreditBalance } from './lib/actions/get-credit-balance';
import { enrichlayerAuth } from './lib/auth';


export const enrichlayer = createPiece({
  displayName: 'Enrich Layer',
  description:
    'Professional network data enrichment API — company profiles, person data, work emails, and more.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/enrichlayer.png',
  categories: [PieceCategory.SALES_AND_CRM],
  authors: ['enrichlayer'],
  auth: enrichlayerAuth,
  actions: [
    getCompanyProfile,
    getPersonProfile,
    getSchoolProfile,
    getCompanyLookup,
    getCompanyIdLookup,
    getPersonLookup,
    getRoleLookup,
    getEmployeeListing,
    getEmployeeCount,
    getEmployeeSearch,
    getStudentListing,
    getWorkEmailLookup,
    getReverseEmailLookup,
    getReversePhoneLookup,
    getPersonalContact,
    getPersonalEmail,
    getDisposableEmailCheck,
    getCompanyPicture,
    getPersonPicture,
    getJobProfile,
    getJobSearch,
    getJobCount,
    getCompanySearch,
    getPersonSearch,
    getCreditBalance,
    createCustomApiCallAction({
      auth: enrichlayerAuth,
      baseUrl: () => 'https://enrichlayer.com',
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text as string}`,
      }),
    }),
  ],
  triggers: [],
});
