
    import { createPiece } from "@activepieces/pieces-framework";
    import { PieceCategory } from '@activepieces/shared';
    import { hunterAuth } from "./lib/common/auth";

import { findEmailAction } from "./lib/actions/find-email";
    import { verifyEmailAction } from "./lib/actions/verify-email";
    import { countEmailsAction } from "./lib/actions/count-emails";
    import { createLeadAction } from "./lib/actions/create-lead";
    import { getLeadAction } from "./lib/actions/get-lead";
    import { updateLeadAction } from "./lib/actions/update-lead";
    import { deleteLeadAction } from "./lib/actions/delete-lead";
    import { searchLeadsAction } from "./lib/actions/search-leads";
    import { addRecipientsAction } from "./lib/actions/add-recipients";

import { newLeadTrigger } from "./lib/triggers/new-lead";

    export const hunter = createPiece({
      displayName: "Hunter",
      description: "Find, verify, and manage professional email addresses at scale",
      auth: hunterAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/hunter.png",
      categories: [PieceCategory.SALES_AND_CRM],
      authors: ["sparkybug"],
      actions: [
        findEmailAction,
        verifyEmailAction,
        countEmailsAction,
        createLeadAction,
        getLeadAction,
        updateLeadAction,
        deleteLeadAction,
        searchLeadsAction,
        addRecipientsAction,
      ],
      triggers: [newLeadTrigger],
    });
    