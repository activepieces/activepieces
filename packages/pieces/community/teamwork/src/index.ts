
    import { createPiece } from "@activepieces/pieces-framework";
    import { teamworkAuth } from "../src/lib/common/auth";
    import { uploadFileAction } from "../src/lib/actions/upload-file";
    import { createNotebookCommentAction } from "../src/lib/actions/create-notebook-comment";
    import { createMilestoneAction } from "../src/lib/actions/create-milestone";
    import { createMessageReplyAction } from "../src/lib/actions/create-message-reply";
    import { createCompanyAction } from "../src/lib/actions/create-company";

    export const teamwork = createPiece({
      displayName: 'Teamwork',
      auth: teamworkAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: 'https://cdn.activepieces.com/pieces/teamwork.png',
      authors: ['Prabhukiran161'],
      actions: [
        uploadFileAction,
        createNotebookCommentAction,
        createMilestoneAction,
        createMessageReplyAction,
        createCompanyAction,
      ],
      triggers: [],
    });
    