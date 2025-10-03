import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { createCustomApiCallAction } from "@activepieces/pieces-common";
import { insightlyAuth } from "./lib/common/auth";


import { createRecord } from "./lib/actions/create-record";
import { updateRecord } from "./lib/actions/update-record";
import { getRecord } from "./lib/actions/get-record";
import { deleteRecord } from "./lib/actions/delete-record";
import { findRecord } from "./lib/actions/find-record";


import { newRecord } from "./lib/triggers/new-record";
import { updatedRecord } from "./lib/triggers/updated-record";
import { deletedRecordTrigger } from "./lib/triggers/deleted-record";

export const insightly = createPiece({
    displayName: "Insightly",
    description: "CRM and project management for small and growing businesses.",
    auth: insightlyAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.activepieces.com/pieces/insightly.png",
    categories: [PieceCategory.SALES_AND_CRM],
    authors: [
        'david-oluwaseun420'
    ],
    actions: [
        createRecord,
        updateRecord,
        getRecord,
        deleteRecord,
        findRecord,
        createCustomApiCallAction({
            auth: insightlyAuth,
            baseUrl: (auth) => {
                const { pod } = auth as { apiKey: string; pod: string; };
                return `https://api.${pod}.insightly.com/v3.1`;
            },
            authMapping: async (auth) => {
                const { apiKey } = auth as { apiKey: string; pod: string; };
                const encodedApiKey = Buffer.from(apiKey).toString('base64');
                return {
                    Authorization: `Basic ${encodedApiKey}`
                }
            }
        })
    ],
    triggers: [
        newRecord,
        updatedRecord,
        deletedRecordTrigger,
    ],
});