import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { applyTagToContact } from './lib/actions/apply-tag-to-contact'
import { createOpportunity } from './lib/actions/create-opportunity'
import { enrollAContactIntoACourse } from './lib/actions/enroll-a-contact-into-a-course'
import { removeTagFromContact } from './lib/actions/remove-tag-from-contact'
import { searchContacts } from './lib/actions/search-contacts'
import { updateOrCreateContact } from './lib/actions/update-or-create-contact'
import { CLICKFUNNELS_APIKEY_AUTH, CLICKFUNNELS_BASE_URL, clickfunnelsAuth } from './lib/common/constants'
import { contactCompletedCourse } from './lib/triggers/contact-completed-course'
import { contactIdentified } from './lib/triggers/contact-identified'
import { contactSubmittedForm } from './lib/triggers/contact-submitted-form'
import { contactSuspendedFromCourse } from './lib/triggers/contact-suspended-from-course'
import { courseEnrollmentCreatedForContact } from './lib/triggers/course-enrollment-created-for-contact'
import { oneTimeOrderPaid } from './lib/triggers/one-time-order-paid'
import { scheduledAppointmentEventCreated } from './lib/triggers/scheduled-appointment-event-created'
import { subscriptionInvoicePaid } from './lib/triggers/subscription-invoice-paid'

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
                const authValue = auth?.props
                return CLICKFUNNELS_BASE_URL(authValue?.subdomain ?? '')
            },
            authMapping: async (auth) => {
                const authValue = auth.props
                return {
                    Authorization: `Bearer ${authValue.apiKey}`,
                }
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
})
