
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { clickfunnelsAuth } from './lib/common/auth';
import { createOpportunity } from './lib/actions/create-opportunity';
import { applyTagToContact } from './lib/actions/apply-tag-to-contact';
import { removeTagFromContact } from './lib/actions/remove-tag-from-contact';
import { enrollContactInCourse } from './lib/actions/enroll-contact-in-course';
import { updateOrCreateContact } from './lib/actions/update-or-create-contact';
import { searchContacts } from './lib/actions/search-contacts';
import { scheduledAppointmentCreated } from './lib/triggers/scheduled-appointment-created';
import { courseEnrollmentCreated } from './lib/triggers/course-enrollment-created';
import { contactSubmittedForm } from './lib/triggers/contact-submitted-form';
import { oneTimeOrderPaid } from './lib/triggers/one-time-order-paid';
import { subscriptionInvoicePaid } from './lib/triggers/subscription-invoice-paid';
import { contactCompletedCourse } from './lib/triggers/contact-completed-course';
import { contactIdentified } from './lib/triggers/contact-identified';
import { contactSuspendedFromCourse } from './lib/triggers/contact-suspended-from-course';

export const clickfunnels = createPiece({
    displayName: 'ClickFunnels',
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/clickfunnels.png',
    categories: [PieceCategory.SALES_AND_CRM, PieceCategory.MARKETING],
    authors: ['activepieces'],
    auth: clickfunnelsAuth,
    actions: [
        createOpportunity,
        applyTagToContact,
        removeTagFromContact,
        enrollContactInCourse,
        updateOrCreateContact,
        searchContacts,
        createCustomApiCallAction({
            baseUrl: (auth) => {
                const subdomain = JSON.parse(Buffer.from((auth as any).access_token.split('.')[1], 'base64').toString()).subdomain || 'app';
                return `https://${subdomain}.myclickfunnels.com/api/v2`;
            },
            auth: clickfunnelsAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${(auth as any).access_token}`,
            }),
        }),
    ],
    triggers: [
        scheduledAppointmentCreated,
        courseEnrollmentCreated,
        contactSubmittedForm,
        oneTimeOrderPaid,
        subscriptionInvoicePaid,
        contactCompletedCourse,
        contactIdentified,
        contactSuspendedFromCourse,
    ],
});