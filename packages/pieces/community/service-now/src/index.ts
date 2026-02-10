
import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from '@activepieces/shared';
import { servicenowAuth } from './lib/common/props';
import { createRecordAction } from './lib/actions/create-record';
import { updateRecordAction } from './lib/actions/update-record';
import { getRecordAction } from './lib/actions/get-record';
import { findRecordAction } from './lib/actions/find-record';
import { attachFileToRecordAction } from './lib/actions/attach-file-to-record';
import { findFileAction } from './lib/actions/find-file';
import { newRecordTrigger } from './lib/triggers/new-record';
import { updatedRecordTrigger } from './lib/triggers/updated-record';

export const serviceNow = createPiece({
  displayName: "ServiceNow",
  description: "Enterprise IT service management platform for incident, change, and service request management",
  auth: servicenowAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/service-now.png",
  authors: ["sparkybug"],
  categories: [PieceCategory.PRODUCTIVITY],
  actions: [
    createRecordAction,
    updateRecordAction,
    getRecordAction,
    findRecordAction,
    attachFileToRecordAction,
    findFileAction,
  ],
  triggers: [
    newRecordTrigger,
    updatedRecordTrigger,
  ],
});