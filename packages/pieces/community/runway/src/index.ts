import { PieceAuth, createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { generateImageFromText } from "./lib/actions/generate-image-from-text";
import { generateVideoFromImage } from "./lib/actions/generate-video-from-image";
import { getTaskDetails } from "./lib/actions/get-task-details";
import { deleteTask } from "./lib/actions/delete-task";



export const runwayAuth = PieceAuth.SecretText({
    displayName: "API Token",
    description: `
    To get your API token:
    1. Go to your Runway account settings.
    2. Navigate to the **API Tokens** section.
    3. Create and copy a new token.
    `,
    required: true,
});

export const runway = createPiece({
    displayName: "Runway",
    auth: runwayAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.activepieces.com/pieces/runway.png",
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
    authors: [
        "Domino" 
    ],
    actions: [
        generateImageFromText,
        generateVideoFromImage,
        getTaskDetails,
        deleteTask
    ],
    triggers: [],
});