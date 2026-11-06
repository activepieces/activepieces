import { createPiece } from "@activepieces/pieces-framework";
import { base44Auth } from "./lib/common/client";
import { PieceCategory } from '@activepieces/pieces-framework';
import { createEntity } from "./lib/actions/create-entity";
import { findOrCreateEntity } from "./lib/actions/find-or-create-entity";
import { findEntity } from "./lib/actions/find-entity";
import { entityEvent } from "./lib/triggers/entity-event";
import { getEntityRecord } from "./lib/actions/get-entity-record";
import { updateEntityRecord } from "./lib/actions/update-entity-record";
import { deleteEntityRecord } from "./lib/actions/delete-entity-record";
import { listEntityRecords } from "./lib/actions/list-entity-records";

export const base44 = createPiece({
  displayName: "Base44",
  description: "Build and manage custom apps with databases and entities",
  auth: base44Auth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/base44.png",
  categories: [PieceCategory.DEVELOPER_TOOLS, PieceCategory.PRODUCTIVITY],
  authors: ["onyedikachi-david", "OdaiAhmed99"],
  actions: [
    createEntity,
    findEntity,
    findOrCreateEntity,
    getEntityRecord,
    updateEntityRecord,
    deleteEntityRecord,
    listEntityRecords,
  ],
  triggers: [
    entityEvent,
  ],
});

export { base44Auth };
