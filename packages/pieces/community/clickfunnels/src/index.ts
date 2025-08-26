import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { scheduledAppointmentEventCreated } from './lib/triggers/scheduled-appointment-event-created';
import {
  CLICKFUNNELS_APIKEY_AUTH,
  CLICKFUNNELS_BASE_URL,
  clickfunnelsAuth,
} from './lib/common/constants';
import { courseEnrollmentCreatedForContact } from './lib/triggers/course-enrollment-created-for-contact';
import { contactSubmittedForm } from './lib/triggers/contact-submitted-form';
import { oneTimeOrderPaid } from './lib/triggers/one-time-order-paid';
import { subscriptionInvoicePaid } from './lib/triggers/subscription-invoice-paid';
import { contactCompletedCourse } from './lib/triggers/contact-completed-course';
import { contactIdentified } from './lib/triggers/contact-identified';
import { contactSuspendedFromCourse } from './lib/triggers/contact-suspended-from-course';
import { createOpportunity } from './lib/actions/create-opportunity';
import { applyTagToContact } from './lib/actions/apply-tag-to-contact';
import { removeTagFromContact } from './lib/actions/remove-tag-from-contact';
import { enrollAContactIntoACourse } from './lib/actions/enroll-a-contact-into-a-course';
import { updateOrCreateContact } from './lib/actions/update-or-create-contact';
import { searchContacts } from './lib/actions/search-contacts';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const clickfunnels = createPiece({
  displayName: 'ClickFunnels',
  auth: clickfunnelsAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/clickfunnels.png',
  categories: [PieceCategory.COMMUNICATION, PieceCategory.MARKETING],
  authors: ['gs03dev'],
  actions: [
    createOpportunity,
    applyTagToContact,
    removeTagFromContact,
    enrollAContactIntoACourse,
    updateOrCreateContact,
    enrollAContactIntoACourse,
    searchContacts,
    createCustomApiCallAction({
      auth: clickfunnelsAuth,
      baseUrl: (auth) => {
        const authValue = auth as CLICKFUNNELS_APIKEY_AUTH;
        return CLICKFUNNELS_BASE_URL(authValue.subdomain);
      },
      authMapping: async (auth) => {
        const authValue = auth as CLICKFUNNELS_APIKEY_AUTH;
        return {
          Authorization: `Bearer ${authValue.apiKey}`,
        };
      },
    }),
  ],
  triggers: [
    scheduledAppointmentEventCreated,
    courseEnrollmentCreatedForContact,
    contactSubmittedForm,
    oneTimeOrderPaid,
    subscriptionInvoicePaid,
    contactCompletedCourse,
    contactIdentified,
    contactSuspendedFromCourse,
  ],
});
