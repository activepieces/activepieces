import { createWebhookEventTrigger } from './factory';
import { SAMPLE, simplyprintSamples } from './samples';

interface TriggerSpec {
  // Must match the backend WebhookEvent value exactly.
  event: string;
  // Internal snake_case id used to pin user flows — never rename after publish.
  // Names for the original 15 triggers are preserved from earlier releases.
  name: string;
  displayName: string;
  description: string;
  // Key into SAMPLE for a hand-crafted sample; otherwise an empty-data envelope.
  sampleKey?: keyof typeof SAMPLE;
}

const SPECS: TriggerSpec[] = [
  // --- Print jobs ---------------------------------------------------------
  { event: 'job.started', name: 'print_started', displayName: 'Print Started',
    description: 'Fires when a print job starts on any printer.', sampleKey: 'printStarted' },
  { event: 'job.paused', name: 'print_paused', displayName: 'Print Paused',
    description: 'Fires when a print is paused (manually or by the AI failure watcher).', sampleKey: 'printPaused' },
  { event: 'job.resumed', name: 'print_resumed', displayName: 'Print Resumed',
    description: 'Fires when a paused print is resumed.', sampleKey: 'printResumed' },
  { event: 'job.cancelled', name: 'print_cancelled', displayName: 'Print Cancelled',
    description: 'Fires when a print is cancelled before finishing.', sampleKey: 'printCancelled' },
  { event: 'job.done', name: 'print_finished', displayName: 'Print Finished',
    description: 'Fires when a print completes successfully.', sampleKey: 'printFinished' },
  { event: 'job.failed', name: 'print_failed', displayName: 'Print Failed',
    description: 'Fires when a print terminates with a failure.', sampleKey: 'printFailed' },
  { event: 'job.bed_cleared', name: 'bed_cleared', displayName: 'Bed Cleared',
    description: "Fires when a printer's bed is reported cleared (ready for the next job)." },
  { event: 'job.objects_skipped', name: 'objects_skipped', displayName: 'Objects Skipped',
    description: 'Fires when one or more objects in a multi-object print are skipped.' },

  // --- Printer state ------------------------------------------------------
  { event: 'printer.autoprint_state_changed', name: 'printer_autoprint_state_changed',
    displayName: 'Printer AutoPrint State Changed',
    description: "Fires when a printer's AutoPrint enabled/disabled state changes." },
  { event: 'printer.nozzle_size_changed', name: 'printer_nozzle_size_changed',
    displayName: 'Printer Nozzle Size Changed',
    description: "Fires when a printer's active nozzle diameter is updated." },
  { event: 'printer.material_changed', name: 'printer_material_changed',
    displayName: 'Printer Material Changed',
    description: "Fires when a printer's loaded material is updated." },
  { event: 'printer.custom_tag_assigned', name: 'printer_tag_assigned',
    displayName: 'Printer Tag Assigned',
    description: 'Fires when a custom tag is attached to a printer.' },
  { event: 'printer.custom_tag_detached', name: 'printer_tag_detached',
    displayName: 'Printer Tag Removed',
    description: 'Fires when a custom tag is detached from a printer.' },
  { event: 'printer.out_of_order_state_changed', name: 'printer_out_of_order_state_changed',
    displayName: 'Printer Out-of-Order State Changed',
    description: 'Fires when a printer is marked out of order (or back in service).' },

  // --- Printer AI ---------------------------------------------------------
  { event: 'printer.ai_state_changed', name: 'ai_state_changed',
    displayName: 'AI State Changed',
    description: "Fires when a printer's AI failure detection is enabled, disabled, or reconfigured." },
  { event: 'printer.ai_failure_detected', name: 'ai_failure_detected',
    displayName: 'AI Failure Detected',
    description: 'Fires when the AI failure detector flags a potential print failure.',
    sampleKey: 'aiFailureDetected' },
  { event: 'printer.ai_failure_false_positive', name: 'ai_failure_false_positive',
    displayName: 'AI Failure Marked False Positive',
    description: 'Fires when an AI failure alert is dismissed as a false positive.' },
  { event: 'printer.autoprint_max_cycles', name: 'printer_autoprint_max_cycles',
    displayName: 'AutoPrint Max Cycles Reached',
    description: 'Fires when a printer hits its configured AutoPrint cycle limit.' },

  // --- Company-wide -------------------------------------------------------
  { event: 'company.autoprint_state_changed', name: 'company_autoprint_state_changed',
    displayName: 'Company AutoPrint State Changed',
    description: 'Fires when the account-wide AutoPrint master switch is toggled.' },

  // --- Queue --------------------------------------------------------------
  { event: 'queue.add_item', name: 'queue_item_added', displayName: 'Queue Item Added',
    description: 'Fires when a file is added to the print queue.', sampleKey: 'queueItemAdded' },
  { event: 'queue.delete_item', name: 'queue_item_deleted', displayName: 'Queue Item Deleted',
    description: 'Fires when a queue item is removed from the queue.' },
  { event: 'queue.empty_queue', name: 'queue_emptied', displayName: 'Queue Emptied',
    description: 'Fires when a queue group (or the whole queue) is emptied.' },
  { event: 'queue.move_item', name: 'queue_item_moved', displayName: 'Queue Item Moved',
    description: 'Fires when a queue item is moved to another group or reordered.' },
  { event: 'queue.revive_item', name: 'queue_item_revived', displayName: 'Queue Item Revived',
    description: 'Fires when a completed queue item is sent back into the active queue.' },
  { event: 'queue.item_pending_approval', name: 'queue_item_pending_approval',
    displayName: 'Queue Item Pending Approval',
    description: 'Fires when a queue item is submitted and awaits approval.',
    sampleKey: 'queueItemPendingApproval' },
  { event: 'queue.item_approved', name: 'queue_item_approved', displayName: 'Queue Item Approved',
    description: 'Fires when a pending queue item is approved.', sampleKey: 'queueItemApproved' },
  { event: 'queue.item_denied', name: 'queue_item_denied', displayName: 'Queue Item Denied',
    description: 'Fires when a pending queue item is denied.', sampleKey: 'queueItemDenied' },

  // --- Filament -----------------------------------------------------------
  { event: 'filament.create', name: 'filament_created', displayName: 'Filament Created',
    description: 'Fires when a filament spool is added to the account.' },
  { event: 'filament.update', name: 'filament_updated', displayName: 'Filament Updated',
    description: "Fires when a filament spool's metadata is updated." },
  { event: 'filament.delete', name: 'filament_deleted', displayName: 'Filament Deleted',
    description: 'Fires when a filament spool is deleted.' },
  { event: 'filament.assigned', name: 'filament_assigned', displayName: 'Filament Assigned to Printer',
    description: 'Fires when a filament spool is assigned to a printer.',
    sampleKey: 'filamentAssigned' },
  { event: 'filament.unassigned', name: 'filament_unassigned',
    displayName: 'Filament Unassigned from Printer',
    description: 'Fires when a filament spool is removed from a printer.',
    sampleKey: 'filamentUnassigned' },

  // --- Organization users -------------------------------------------------
  { event: 'organization.user_signup', name: 'organization_user_signup',
    displayName: 'Organization User Signed Up',
    description: 'Fires when a new user signs up for the organization.' },
  { event: 'organization.user_pending', name: 'organization_user_pending',
    displayName: 'Organization User Pending Approval',
    description: 'Fires when a new organization user is awaiting admin approval.' },

  // --- Balance ------------------------------------------------------------
  { event: 'balance.charged', name: 'balance_charged', displayName: 'Balance Charged',
    description: 'Fires when a user balance is charged (debited).' },
  { event: 'balance.refunded', name: 'balance_refunded', displayName: 'Balance Refunded',
    description: 'Fires when a previous charge is refunded.' },
  { event: 'balance.topped_up', name: 'balance_topped_up', displayName: 'Balance Topped Up',
    description: 'Fires when a user balance is topped up (credited).' },
  { event: 'balance.adjusted', name: 'balance_adjusted', displayName: 'Balance Adjusted',
    description: 'Fires when a balance is adjusted by an administrator.' },

  // --- Quota --------------------------------------------------------------
  { event: 'quota.request_new', name: 'quota_request_new',
    displayName: 'Quota Request Submitted',
    description: 'Fires when a user submits a request for more quota.' },
  { event: 'quota.request_resolved', name: 'quota_request_resolved',
    displayName: 'Quota Request Resolved',
    description: 'Fires when a quota request is approved or denied.' },
  { event: 'quota.adjusted', name: 'quota_adjusted', displayName: 'Quota Adjusted',
    description: "Fires when a user's quota is manually adjusted." },
  { event: 'quota.reset', name: 'quota_reset', displayName: 'Quota Reset',
    description: "Fires when a quota period rolls over and a user's quota is reset." },

  // --- Maintenance: jobs --------------------------------------------------
  { event: 'maintenance.job_created', name: 'maintenance_job_created',
    displayName: 'Maintenance Job Created',
    description: 'Fires when a maintenance job is created.' },
  { event: 'maintenance.job_started', name: 'maintenance_job_started',
    displayName: 'Maintenance Job Started',
    description: 'Fires when work begins on a maintenance job.' },
  { event: 'maintenance.job_completed', name: 'maintenance_job_completed',
    displayName: 'Maintenance Job Completed',
    description: 'Fires when a maintenance job is completed.' },
  { event: 'maintenance.job_cancelled', name: 'maintenance_job_cancelled',
    displayName: 'Maintenance Job Cancelled',
    description: 'Fires when a maintenance job is cancelled before completion.' },
  { event: 'maintenance.job_overdue', name: 'maintenance_job_overdue',
    displayName: 'Maintenance Job Overdue',
    description: 'Fires when a scheduled maintenance job passes its due date without being completed.',
    sampleKey: 'maintenanceJobOverdue' },
  { event: 'maintenance.job_reopened', name: 'maintenance_job_reopened',
    displayName: 'Maintenance Job Reopened',
    description: 'Fires when a completed or cancelled maintenance job is reopened.' },
  { event: 'maintenance.job_updated', name: 'maintenance_job_updated',
    displayName: 'Maintenance Job Updated',
    description: "Fires when a maintenance job's metadata is edited." },
  { event: 'maintenance.job_deleted', name: 'maintenance_job_deleted',
    displayName: 'Maintenance Job Deleted',
    description: 'Fires when a maintenance job is deleted.' },

  // --- Maintenance: problems ---------------------------------------------
  { event: 'maintenance.problem_reported', name: 'maintenance_problem_reported',
    displayName: 'Maintenance Problem Reported',
    description: 'Fires when a user reports a problem on a printer.',
    sampleKey: 'maintenanceProblemReported' },
  { event: 'maintenance.problem_resolved', name: 'maintenance_problem_resolved',
    displayName: 'Maintenance Problem Resolved',
    description: 'Fires when a reported problem is resolved.' },

  // --- Maintenance: tasks -------------------------------------------------
  { event: 'maintenance.task_completed', name: 'maintenance_task_completed',
    displayName: 'Maintenance Task Completed',
    description: 'Fires when an individual maintenance task is checked off.' },
  { event: 'maintenance.task_skipped', name: 'maintenance_task_skipped',
    displayName: 'Maintenance Task Skipped',
    description: 'Fires when an individual maintenance task is skipped.' },

  // --- Maintenance: schedules ---------------------------------------------
  { event: 'maintenance.schedule_created', name: 'maintenance_schedule_created',
    displayName: 'Maintenance Schedule Created',
    description: 'Fires when a recurring maintenance schedule is created.' },
  { event: 'maintenance.schedule_updated', name: 'maintenance_schedule_updated',
    displayName: 'Maintenance Schedule Updated',
    description: 'Fires when a recurring maintenance schedule is edited.' },
  { event: 'maintenance.schedule_deleted', name: 'maintenance_schedule_deleted',
    displayName: 'Maintenance Schedule Deleted',
    description: 'Fires when a recurring maintenance schedule is deleted.' },

  // --- Maintenance: inventory --------------------------------------------
  { event: 'maintenance.spare_part_created', name: 'maintenance_spare_part_created',
    displayName: 'Spare Part Created',
    description: 'Fires when a spare part is added to inventory.' },
  { event: 'maintenance.spare_part_updated', name: 'maintenance_spare_part_updated',
    displayName: 'Spare Part Updated',
    description: "Fires when a spare part's metadata is updated." },
  { event: 'maintenance.spare_part_deleted', name: 'maintenance_spare_part_deleted',
    displayName: 'Spare Part Deleted',
    description: 'Fires when a spare part is removed from inventory.' },
  { event: 'maintenance.stock_adjusted', name: 'maintenance_stock_adjusted',
    displayName: 'Spare Part Stock Adjusted',
    description: "Fires when a spare part's stock count is adjusted." },
  { event: 'maintenance.low_stock', name: 'maintenance_low_stock',
    displayName: 'Spare Part Low Stock',
    description: "Fires when a spare part's stock drops below its low-stock threshold." },
];

export const allTriggers = SPECS.map((spec) => {
  const data: object = spec.sampleKey ? SAMPLE[spec.sampleKey] : {};
  return createWebhookEventTrigger({
    name: spec.name,
    displayName: spec.displayName,
    description: spec.description,
    event: spec.event,
    sampleData: simplyprintSamples.envelope(spec.event, data),
  });
});
