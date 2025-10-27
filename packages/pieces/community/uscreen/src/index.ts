import { createPiece } from "@activepieces/pieces-framework";
import { uscreenAuth } from "./lib/common/auth";
import { assignUserAccess } from "./lib/actions/assign-user-access";
import { createUser } from "./lib/actions/create-user";
import { paidOrder } from "./lib/triggers/paid-order";
import { newUser } from "./lib/triggers/new-user";
import { beganToPlayVideo } from "./lib/triggers/began-to-play-video";
import { canceledSubscription } from "./lib/triggers/canceled-subscription";
import { userUpdated } from "./lib/triggers/user-updated";
import { PieceCategory } from "@activepieces/shared";

export const uscreen = createPiece({
    displayName: "Uscreen",
    auth: uscreenAuth,
    description: "Uscreen is an all-in-one video monetization and OTT platform that enables creators and businesses to distribute, sell, and manage video content through subscriptions, memberships, or one-time purchases.",
    categories: [PieceCategory.MARKETING, PieceCategory.SALES_AND_CRM],
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.activepieces.com/pieces/uscreen.png",
    authors: ["sw"],
    actions: [
        assignUserAccess,
        createUser,
    ],
    triggers: [
        paidOrder,
        newUser,
        beganToPlayVideo,
        canceledSubscription,
        userUpdated,
    ],
});

