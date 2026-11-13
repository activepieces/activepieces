import { createEntryAction } from './create-entry';
import { createFeedAction } from './create-feed';
import { createFormAction } from './create-form';
import { deleteEntryAction } from './delete-entry';
import { deleteFeedAction } from './delete-feed';
import { deleteFormAction } from './delete-form';
import { getEntryAction } from './get-entry';
import { getFeedAction } from './get-feed';
import { getFormAction } from './get-form';
import { getFormResultsAction } from './get-form-results';
import { listEntriesAction } from './list-entries';
import { listFeedsAction } from './list-feeds';
import { listFieldFiltersAction } from './list-field-filters';
import { listFormsAction } from './list-forms';
import { sendNotificationsAction } from './send-notifications';
import { submitFormAction } from './submit-form';
import { updateEntryAction } from './update-entry';
import { updateFeedAction } from './update-feed';
import { updateFormAction } from './update-form';
import { validateSubmissionAction } from './validate-submission';

export const gravityFormsAiActions = [
  listFormsAction,
  getFormAction,
  createFormAction,
  updateFormAction,
  deleteFormAction,
  submitFormAction,
  validateSubmissionAction,
  listFieldFiltersAction,
  listEntriesAction,
  getEntryAction,
  createEntryAction,
  updateEntryAction,
  deleteEntryAction,
  sendNotificationsAction,
  listFeedsAction,
  getFeedAction,
  createFeedAction,
  updateFeedAction,
  deleteFeedAction,
  getFormResultsAction,
];
