const NOW = '2026-03-19T12:00:00.000Z';

const SAMPLE_LEAD = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  email: 'john.doe@example.com',
  phone: '+14155551234',
  full_name: 'John Doe',
  first_name: 'John',
  last_name: 'Doe',
  status: 'new',
  lifecycle_stage: 'lead',
  lead_score: 25,
  tags: ['website-visitor'],
  source: 'form_submission',
  created_at: NOW,
};

/**
 * Realistic sample payloads for all 59 event types.
 * Used by trigger sampleData and the test endpoint.
 */
export const SAMPLE_DATA: Record<string, unknown> = {
  // -- Contacts / Leads --
  lead_created: { event: 'lead_created', timestamp: NOW, lead: SAMPLE_LEAD, data: { source: 'form_submission' } },
  status_changed: { event: 'status_changed', timestamp: NOW, lead: SAMPLE_LEAD, data: { oldStatus: 'new', newStatus: 'contacted' } },
  lifecycle_changed: { event: 'lifecycle_changed', timestamp: NOW, lead: SAMPLE_LEAD, data: { oldStage: 'lead', newStage: 'marketing_qualified_lead' } },
  score_changed: { event: 'score_changed', timestamp: NOW, lead: SAMPLE_LEAD, data: { oldScore: 25, newScore: 45 } },
  lead_assigned: { event: 'lead_assigned', timestamp: NOW, lead: SAMPLE_LEAD, data: { assignedTo: '550e8400-0000-0000-0000-000000000002', assignedBy: '550e8400-0000-0000-0000-000000000003' } },
  dnd_changed: { event: 'dnd_changed', timestamp: NOW, lead: SAMPLE_LEAD, data: { dndEnabled: true, dndChannels: { email: true, sms: false } } },
  tag_added: { event: 'tag_added', timestamp: NOW, lead: SAMPLE_LEAD, data: { tagName: 'hot-lead', appliedBy: 'system' } },
  tag_removed: { event: 'tag_removed', timestamp: NOW, lead: SAMPLE_LEAD, data: { tagName: 'cold-lead', removedBy: 'user' } },
  custom_field_changed: { event: 'custom_field_changed', timestamp: NOW, lead: SAMPLE_LEAD, data: { fieldName: 'budget', oldValue: null, newValue: '50000' } },
  lead_deleted: { event: 'lead_deleted', timestamp: NOW, lead: null, data: { email: 'deleted@example.com', deletedBy: '550e8400-0000-0000-0000-000000000003' } },

  // -- Funnels, Pages & Forms --
  funnel_created: { event: 'funnel_created', timestamp: NOW, lead: null, data: { funnelId: '550e8400-0000-0000-0000-000000000010', name: 'Sales Landing Page', funnelType: 'salesFunnel' } },
  funnel_activity: { event: 'funnel_activity', timestamp: NOW, lead: null, data: { funnelId: '550e8400-0000-0000-0000-000000000010', action: 'published' } },
  form_submitted: { event: 'form_submitted', timestamp: NOW, lead: SAMPLE_LEAD, data: { formId: '550e8400-0000-0000-0000-000000000020', funnelId: '550e8400-0000-0000-0000-000000000010', formName: 'Contact Form', submissionData: { name: 'Jane Smith', email: 'jane@example.com', message: 'Interested' } } },
  page_visited: { event: 'page_visited', timestamp: NOW, lead: SAMPLE_LEAD, data: { funnelId: '550e8400-0000-0000-0000-000000000010', pageName: 'Landing Page', pageUrl: '/sales', visitorId: 'v_abc123', deviceType: 'desktop' } },

  // -- Communication --
  email_sent: { event: 'email_sent', timestamp: NOW, lead: SAMPLE_LEAD, data: { subject: 'Welcome!', toEmail: 'john@example.com' } },
  email_delivered: { event: 'email_delivered', timestamp: NOW, lead: SAMPLE_LEAD, data: { subject: 'Welcome!', messageId: 'msg_abc123' } },
  email_opened: { event: 'email_opened', timestamp: NOW, lead: SAMPLE_LEAD, data: { subject: 'Welcome!', openCount: 1 } },
  email_clicked: { event: 'email_clicked', timestamp: NOW, lead: SAMPLE_LEAD, data: { subject: 'Welcome!', clickedUrl: 'https://app.getopplify.com/pricing' } },
  email_bounced: { event: 'email_bounced', timestamp: NOW, lead: SAMPLE_LEAD, data: { subject: 'Welcome!', bounceType: 'hard', reason: 'Mailbox not found' } },
  spam_reported: { event: 'spam_reported', timestamp: NOW, lead: SAMPLE_LEAD, data: { subject: 'Welcome!' } },
  sms_sent: { event: 'sms_sent', timestamp: NOW, lead: SAMPLE_LEAD, data: { message: 'Your appointment is tomorrow at 2pm.' } },
  sms_delivered: { event: 'sms_delivered', timestamp: NOW, lead: SAMPLE_LEAD, data: { message: 'Your appointment is tomorrow at 2pm.', messageId: 'sms_xyz' } },
  sms_failed: { event: 'sms_failed', timestamp: NOW, lead: SAMPLE_LEAD, data: { message: 'Your appointment is tomorrow at 2pm.', errorReason: 'Invalid phone number' } },
  note_created: { event: 'note_created', timestamp: NOW, lead: SAMPLE_LEAD, data: { noteContent: 'Discussed pricing options.', noteType: 'call', createdBy: '550e8400-0000-0000-0000-000000000003' } },

  // -- Appointments --
  appointment_booked: { event: 'appointment_booked', timestamp: NOW, lead: SAMPLE_LEAD, data: { appointmentId: '550e8400-0000-0000-0000-000000000030', title: 'Discovery Call', startTime: NOW } },
  appointment_rescheduled: { event: 'appointment_rescheduled', timestamp: NOW, lead: SAMPLE_LEAD, data: { appointmentId: '550e8400-0000-0000-0000-000000000030', oldStartTime: NOW, newStartTime: '2026-03-20T14:00:00.000Z' } },
  appointment_cancelled: { event: 'appointment_cancelled', timestamp: NOW, lead: SAMPLE_LEAD, data: { appointmentId: '550e8400-0000-0000-0000-000000000030', cancelledBy: 'contact', reason: 'Schedule conflict' } },
  appointment_completed: { event: 'appointment_completed', timestamp: NOW, lead: SAMPLE_LEAD, data: { appointmentId: '550e8400-0000-0000-0000-000000000030' } },
  appointment_no_show: { event: 'appointment_no_show', timestamp: NOW, lead: SAMPLE_LEAD, data: { appointmentId: '550e8400-0000-0000-0000-000000000030' } },

  // -- Deals --
  deal_created: { event: 'deal_created', timestamp: NOW, lead: SAMPLE_LEAD, data: { dealId: '550e8400-0000-0000-0000-000000000040', stage: 'discovery', amount: 5000, title: 'Enterprise Plan' } },
  deal_stage_changed: { event: 'deal_stage_changed', timestamp: NOW, lead: SAMPLE_LEAD, data: { dealId: '550e8400-0000-0000-0000-000000000040', oldStage: 'discovery', newStage: 'proposal' } },
  deal_amount_changed: { event: 'deal_amount_changed', timestamp: NOW, lead: SAMPLE_LEAD, data: { dealId: '550e8400-0000-0000-0000-000000000040', oldAmount: 5000, newAmount: 7500 } },
  deal_assigned: { event: 'deal_assigned', timestamp: NOW, lead: SAMPLE_LEAD, data: { dealId: '550e8400-0000-0000-0000-000000000040', assignedTo: '550e8400-0000-0000-0000-000000000003' } },

  // -- Orders & Payments --
  payment_completed: { event: 'payment_completed', timestamp: NOW, lead: SAMPLE_LEAD, data: { orderId: '550e8400-0000-0000-0000-000000000050', amount: 99.99, paymentMethod: 'stripe' } },
  payment_failed: { event: 'payment_failed', timestamp: NOW, lead: SAMPLE_LEAD, data: { orderId: '550e8400-0000-0000-0000-000000000050', amount: 99.99, errorReason: 'Card declined' } },
  order_fulfilled: { event: 'order_fulfilled', timestamp: NOW, lead: SAMPLE_LEAD, data: { orderId: '550e8400-0000-0000-0000-000000000050', fulfilledAt: NOW } },
  order_refunded: { event: 'order_refunded', timestamp: NOW, lead: SAMPLE_LEAD, data: { orderId: '550e8400-0000-0000-0000-000000000050', refundAmount: 99.99 } },
  order_cancelled: { event: 'order_cancelled', timestamp: NOW, lead: SAMPLE_LEAD, data: { orderId: '550e8400-0000-0000-0000-000000000050', cancelledBy: 'user' } },

  // -- Tasks --
  task_created: { event: 'task_created', timestamp: NOW, lead: SAMPLE_LEAD, data: { taskId: '550e8400-0000-0000-0000-000000000060', title: 'Follow up with lead' } },
  task_completed: { event: 'task_completed', timestamp: NOW, lead: SAMPLE_LEAD, data: { taskId: '550e8400-0000-0000-0000-000000000060', title: 'Follow up with lead', completedAt: NOW } },
  task_assigned: { event: 'task_assigned', timestamp: NOW, lead: SAMPLE_LEAD, data: { taskId: '550e8400-0000-0000-0000-000000000060', assignedTo: '550e8400-0000-0000-0000-000000000003' } },
  task_overdue: { event: 'task_overdue', timestamp: NOW, lead: SAMPLE_LEAD, data: { taskId: '550e8400-0000-0000-0000-000000000060', title: 'Follow up with lead', dueDate: '2026-03-18T12:00:00.000Z' } },

  // -- Activity --
  repeat_visit: { event: 'repeat_visit', timestamp: NOW, lead: SAMPLE_LEAD, data: { visitorId: 'v_abc123', visitNumber: 3 } },
  conversion_tracked: { event: 'conversion_tracked', timestamp: NOW, lead: null, data: { funnelId: '550e8400-0000-0000-0000-000000000010', visitorId: 'v_abc123', conversionType: 'signup' } },

  // -- Communication (new inbound) --
  email_received: { event: 'email_received', timestamp: NOW, lead: SAMPLE_LEAD, data: { from: 'john@example.com', subject: 'Re: Your proposal', body: 'I reviewed the proposal and have some questions.' } },
  sms_received: { event: 'sms_received', timestamp: NOW, lead: SAMPLE_LEAD, data: { from: '+14155551234', message: 'Yes, I am interested. Please call me.' } },
  email_unsubscribed: { event: 'email_unsubscribed', timestamp: NOW, lead: SAMPLE_LEAD, data: { email: 'john@example.com', reason: 'No longer interested' } },

  // -- Voice / Calling --
  voice_call_started: { event: 'voice_call_started', timestamp: NOW, lead: SAMPLE_LEAD, data: { sessionId: '550e8400-0000-0000-0000-000000000070', roomName: 'call-john-doe', agentType: 'sales' } },
  voice_call_ended: { event: 'voice_call_ended', timestamp: NOW, lead: SAMPLE_LEAD, data: { sessionId: '550e8400-0000-0000-0000-000000000070', durationSeconds: 245, status: 'ended' } },
  call_transcript_available: { event: 'call_transcript_available', timestamp: NOW, lead: SAMPLE_LEAD, data: { sessionId: '550e8400-0000-0000-0000-000000000070', transcriptLength: 1250, summary: 'Discussed pricing and next steps. Lead interested in Enterprise plan.' } },

  // -- Products --
  product_created: { event: 'product_created', timestamp: NOW, lead: null, data: { productId: '550e8400-0000-0000-0000-000000000080', name: 'Pro Plan', price: 99.99, productType: 'service' } },
  product_updated: { event: 'product_updated', timestamp: NOW, lead: null, data: { productId: '550e8400-0000-0000-0000-000000000080', name: 'Pro Plan', oldPrice: 99.99, newPrice: 129.99 } },
  product_archived: { event: 'product_archived', timestamp: NOW, lead: null, data: { productId: '550e8400-0000-0000-0000-000000000080', name: 'Pro Plan' } },
};
