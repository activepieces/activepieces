

import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from "@activepieces/pieces-common";
import { uscreenAuth } from "./lib/common/auth";
import { uscreenPublisherApiUrl } from "./lib/common/client";

import { assignUserAccess } from "./lib/actions/assign-user-access";
import { createUser } from "./lib/actions/create-user";

import { paidOrder } from "./lib/triggers/paid-order";
import { newUser } from "./lib/triggers/new-user";
import { beganToPlayVideo } from "./lib/triggers/began-to-play-video";
import { canceledSubscription } from "./lib/triggers/canceled-subscription";
import { userUpdated } from "./lib/triggers/user-updated"; 

export const uscreen = createPiece({
    displayName: "Uscreen",
     description: "All-in-one video monetization platform for creating, hosting, and selling online courses, memberships, and video content.",
    auth: uscreenAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.activepieces.com/pieces/uscreen.png",
    categories: [PieceCategory.COMMERCE, PieceCategory.MARKETING],
    authors: ['srimalleswari205','sanket-a11y'], 
    actions: [
        createUser,
        assignUserAccess, 
        createCustomApiCallAction({
            auth: uscreenAuth,
            baseUrl: () => uscreenPublisherApiUrl,
            authMapping: async (auth) => {
                return {
                    'X-Store-Token': `${auth.secret_text}`,
                    'Accept': 'application/json'
                }
            }
        })
    ],
    triggers: [
        paidOrder,
        newUser,
        beganToPlayVideo,
        canceledSubscription,
        userUpdated 
    ],
});