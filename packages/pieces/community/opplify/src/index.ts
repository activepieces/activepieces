import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { opplifyAuth } from './lib/common/auth';

// ============================================================================
// TRIGGERS (59 total, 10 categories)
// ============================================================================

// Category 1: Contacts / Leads (10)
import { newLeadCreated } from './lib/triggers/contacts/new-lead-created';
import { leadStatusChanged } from './lib/triggers/contacts/lead-status-changed';
import { leadLifecycleChanged } from './lib/triggers/contacts/lead-lifecycle-changed';
import { leadScoreChanged } from './lib/triggers/contacts/lead-score-changed';
import { leadAssigned } from './lib/triggers/contacts/lead-assigned';
import { leadDndChanged } from './lib/triggers/contacts/lead-dnd-changed';
import { tagAdded } from './lib/triggers/contacts/tag-added';
import { tagRemoved } from './lib/triggers/contacts/tag-removed';
import { customFieldChanged } from './lib/triggers/contacts/custom-field-changed';
import { leadDeleted } from './lib/triggers/contacts/lead-deleted';

// Category 2: Funnels, Pages & Forms (4)
import { funnelCreated } from './lib/triggers/funnels/funnel-created';
import { funnelActivity } from './lib/triggers/funnels/funnel-activity';
import { formSubmitted } from './lib/triggers/funnels/form-submitted';
import { funnelPageVisited } from './lib/triggers/funnels/funnel-page-visited';

// Category 3: Communication (13)
import { emailSent } from './lib/triggers/communication/email-sent';
import { emailDelivered } from './lib/triggers/communication/email-delivered';
import { emailOpened } from './lib/triggers/communication/email-opened';
import { emailLinkClicked } from './lib/triggers/communication/email-link-clicked';
import { emailBounced } from './lib/triggers/communication/email-bounced';
import { spamReported } from './lib/triggers/communication/spam-reported';
import { smsSent } from './lib/triggers/communication/sms-sent';
import { smsDelivered } from './lib/triggers/communication/sms-delivered';
import { smsFailed } from './lib/triggers/communication/sms-failed';
import { noteCreated } from './lib/triggers/communication/note-created';

// Category 4: Appointments / Scheduling (6)
import { appointmentBooked } from './lib/triggers/appointments/appointment-booked';
import { appointmentRescheduled } from './lib/triggers/appointments/appointment-rescheduled';
import { appointmentCancelled } from './lib/triggers/appointments/appointment-cancelled';
import { appointmentCompleted } from './lib/triggers/appointments/appointment-completed';
import { appointmentNoShow } from './lib/triggers/appointments/appointment-no-show';
import { appointmentReminderDue } from './lib/triggers/appointments/appointment-reminder-due';

// Category 5: Deals / Opportunities (6)
import { dealCreated } from './lib/triggers/deals/deal-created';
import { dealStageChanged } from './lib/triggers/deals/deal-stage-changed';
import { dealClosedWon } from './lib/triggers/deals/deal-closed-won';
import { dealClosedLost } from './lib/triggers/deals/deal-closed-lost';
import { dealAmountChanged } from './lib/triggers/deals/deal-amount-changed';
import { dealAssigned } from './lib/triggers/deals/deal-assigned';

// Category 6: Orders & Payments (6)
import { orderPlaced } from './lib/triggers/orders/order-placed';
import { paymentCompleted } from './lib/triggers/orders/payment-completed';
import { paymentFailed } from './lib/triggers/orders/payment-failed';
import { orderFulfilled } from './lib/triggers/orders/order-fulfilled';
import { orderRefunded } from './lib/triggers/orders/order-refunded';
import { orderCancelled } from './lib/triggers/orders/order-cancelled';

// Category 7: Tasks (4)
import { taskCreated } from './lib/triggers/tasks/task-created';
import { taskCompleted } from './lib/triggers/tasks/task-completed';
import { taskAssigned } from './lib/triggers/tasks/task-assigned';
import { taskOverdue } from './lib/triggers/tasks/task-overdue';

// Category 8: Activity / Engagement (2)
import { repeatVisit } from './lib/triggers/activity/repeat-visit';
import { conversionTracked } from './lib/triggers/activity/conversion-tracked';

// Category 9: Voice / Calling (3)
import { voiceCallStarted } from './lib/triggers/voice/voice-call-started';
import { voiceCallEnded } from './lib/triggers/voice/voice-call-ended';
import { callTranscriptAvailable } from './lib/triggers/voice/call-transcript-available';

// Category 10: Products (3)
import { productCreated } from './lib/triggers/products/product-created';
import { productUpdated } from './lib/triggers/products/product-updated';
import { productArchived } from './lib/triggers/products/product-archived';

// Category 3 additions: Inbound Communication (3)
import { emailReceived } from './lib/triggers/communication/email-received';
import { smsReceived } from './lib/triggers/communication/sms-received';
import { emailUnsubscribed } from './lib/triggers/communication/email-unsubscribed';

// ============================================================================
// ACTIONS (32 total, 9 categories)
// ============================================================================

// Category 1: Contacts / Leads (12)
import { createLeadAction } from './lib/actions/contacts/create-lead';
import { findLeadAction } from './lib/actions/contacts/find-lead';
import { updateLeadAction } from './lib/actions/contacts/update-lead';
import { changeLeadStatusAction } from './lib/actions/contacts/change-lead-status';
import { changeLifecycleStageAction } from './lib/actions/contacts/change-lifecycle-stage';
import { adjustLeadScoreAction } from './lib/actions/contacts/adjust-lead-score';
import { assignLeadAction } from './lib/actions/contacts/assign-lead';
import { addTagAction } from './lib/actions/contacts/add-tag';
import { removeTagAction } from './lib/actions/contacts/remove-tag';
import { setCustomFieldAction } from './lib/actions/contacts/set-custom-field';
import { setDndAction } from './lib/actions/contacts/set-dnd';
import { deleteLeadAction } from './lib/actions/contacts/delete-lead';

// Category 2: Funnels (4)
import { createFunnelAction } from './lib/actions/funnels/create-funnel';
import { publishFunnelAction } from './lib/actions/funnels/publish-funnel';
import { unpublishFunnelAction } from './lib/actions/funnels/unpublish-funnel';
import { archiveFunnelAction } from './lib/actions/funnels/archive-funnel';

// Category 3: Communication (3)
import { sendEmailAction } from './lib/actions/communication/send-email';
import { sendSmsAction } from './lib/actions/communication/send-sms';
import { createNoteAction } from './lib/actions/communication/create-note';

// Category 4: Appointments (5)
import { createAppointmentAction } from './lib/actions/appointments/create-appointment';
import { cancelAppointmentAction } from './lib/actions/appointments/cancel-appointment';
import { rescheduleAppointmentAction } from './lib/actions/appointments/reschedule-appointment';
import { markAppointmentCompletedAction } from './lib/actions/appointments/mark-appointment-completed';
import { markAppointmentNoShowAction } from './lib/actions/appointments/mark-appointment-no-show';

// Category 5: Deals (3)
import { createDealAction } from './lib/actions/deals/create-deal';
import { updateDealStageAction } from './lib/actions/deals/update-deal-stage';
import { deleteDealAction } from './lib/actions/deals/delete-deal';

// Category 6: Tasks (2)
import { createTaskAction } from './lib/actions/tasks/create-task';
import { completeTaskAction } from './lib/actions/tasks/complete-task';

// Category 7: Orders (1)
import { updateOrderStatusAction } from './lib/actions/orders/update-order-status';

// Category 8: Products (2)
import { createProductAction } from './lib/actions/products/create-product';
import { updateProductAction } from './lib/actions/products/update-product';

// ============================================================================
// PIECE DEFINITION
// ============================================================================

export const opplify = createPiece({
  displayName: 'GetOpplify',
  description:
    'AI-powered sales funnel & CRM platform. ' +
    'Triggers for leads, forms, funnels, appointments, deals, communications, tasks, and orders. ' +
    'Actions to create and manage all CRM entities.',
  logoUrl: 'https://cdn.getopplify.com/logo-piece.png',
  minimumSupportedRelease: '0.36.1',
  categories: [PieceCategory.SALES_AND_CRM, PieceCategory.MARKETING],
  authors: ['getopplify'],
  auth: opplifyAuth,

  triggers: [
    // Contacts / Leads (10)
    newLeadCreated,
    leadStatusChanged,
    leadLifecycleChanged,
    leadScoreChanged,
    leadAssigned,
    leadDndChanged,
    tagAdded,
    tagRemoved,
    customFieldChanged,
    leadDeleted,
    // Funnels, Pages & Forms (4)
    funnelCreated,
    funnelActivity,
    formSubmitted,
    funnelPageVisited,
    // Communication (13)
    emailSent,
    emailDelivered,
    emailOpened,
    emailLinkClicked,
    emailBounced,
    emailReceived,
    emailUnsubscribed,
    spamReported,
    smsSent,
    smsDelivered,
    smsFailed,
    smsReceived,
    noteCreated,
    // Appointments / Scheduling (6)
    appointmentBooked,
    appointmentRescheduled,
    appointmentCancelled,
    appointmentCompleted,
    appointmentNoShow,
    appointmentReminderDue,
    // Deals / Opportunities (6)
    dealCreated,
    dealStageChanged,
    dealClosedWon,
    dealClosedLost,
    dealAmountChanged,
    dealAssigned,
    // Orders & Payments (6)
    orderPlaced,
    paymentCompleted,
    paymentFailed,
    orderFulfilled,
    orderRefunded,
    orderCancelled,
    // Tasks (4)
    taskCreated,
    taskCompleted,
    taskAssigned,
    taskOverdue,
    // Activity / Engagement (2)
    repeatVisit,
    conversionTracked,
    // Voice / Calling (3)
    voiceCallStarted,
    voiceCallEnded,
    callTranscriptAvailable,
    // Products (3)
    productCreated,
    productUpdated,
    productArchived,
  ],

  actions: [
    // Contacts / Leads (12)
    createLeadAction,
    findLeadAction,
    updateLeadAction,
    changeLeadStatusAction,
    changeLifecycleStageAction,
    adjustLeadScoreAction,
    assignLeadAction,
    addTagAction,
    removeTagAction,
    setCustomFieldAction,
    setDndAction,
    deleteLeadAction,
    // Funnels (4)
    createFunnelAction,
    publishFunnelAction,
    unpublishFunnelAction,
    archiveFunnelAction,
    // Communication (3)
    sendEmailAction,
    sendSmsAction,
    createNoteAction,
    // Appointments (5)
    createAppointmentAction,
    cancelAppointmentAction,
    rescheduleAppointmentAction,
    markAppointmentCompletedAction,
    markAppointmentNoShowAction,
    // Deals (3)
    createDealAction,
    updateDealStageAction,
    deleteDealAction,
    // Tasks (2)
    createTaskAction,
    completeTaskAction,
    // Orders (1)
    updateOrderStatusAction,
    // Products (2)
    createProductAction,
    updateProductAction,
  ],
});
