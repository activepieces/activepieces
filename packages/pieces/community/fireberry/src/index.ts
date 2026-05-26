import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { createRecordAction } from "./lib/actions/create-record.action";
import { updateRecordAction } from "./lib/actions/update-record.action";
import { deleteRecordAction } from "./lib/actions/delete-record.action";
import { findRecordAction } from "./lib/actions/find-record.action";
import { recordCreatedOrUpdatedTrigger } from "./lib/triggers/record-created-updated.trigger";
import { fireberryAuth } from './lib/auth';

export const fireberry = createPiece({
  displayName: "Fireberry",
  auth: fireberryAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/fireberry.png",
  authors: ["sparkybug", "onyedikachi-david"],
  categories: [PieceCategory.SALES_AND_CRM],
  actions: [
    createRecordAction,
    updateRecordAction,
    deleteRecordAction,
    findRecordAction,
  ],
  triggers: [
    recordCreatedOrUpdatedTrigger,
  ],
});
    