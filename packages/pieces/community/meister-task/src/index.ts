import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from "@activepieces/pieces-common";
import { meisterTaskAuth } from "./lib/common/auth";
import { meisterTaskApiUrl } from "./lib/common/client";

import { createLabel } from "./lib/actions/create-label";
import { addLabelToTask } from "./lib/actions/add-label-to-task";
import { createAttachment } from "./lib/actions/create-attachment";
import { createTask } from "./lib/actions/create-task";
import { updateTask } from "./lib/actions/update-task";
import { findAttachment } from "./lib/actions/find-attachment";
import { findLabel } from "./lib/actions/find-label";
import { findTask } from "./lib/actions/find-task";
import { findOrCreateAttachment } from "./lib/actions/find-or-create-attachment";
import { findOrCreateTask } from "./lib/actions/find-or-create-task";
import { findOrCreateLabel } from "./lib/actions/find-or-create-label";

import { newAttachment } from "./lib/triggers/new-attachment";
import { newPerson } from "./lib/triggers/new-person";
import { newSection } from "./lib/triggers/new-section";
import { newComment } from "./lib/triggers/new-comment";
import { newTaskLabel } from "./lib/triggers/new-task-label";
import { newChecklistItem } from "./lib/triggers/new-checklist-item";
import { newProject } from "./lib/triggers/new-project";
import { newLabel } from "./lib/triggers/new-label";
import { newTask } from "./lib/triggers/new-task";

export const meisterTask = createPiece({
    displayName: "MeisterTask",
    auth: meisterTaskAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.activepieces.com/pieces/meister-task.png",
    categories: [PieceCategory.PRODUCTIVITY],
    authors: ['srimalleswari205'],
    actions: [
        createLabel,
        addLabelToTask,
        createAttachment,
        createTask,
        updateTask,
        findAttachment,
        findLabel,
        findTask,
        findOrCreateAttachment,
        findOrCreateTask,
        findOrCreateLabel,
        createCustomApiCallAction({
            auth: meisterTaskAuth,
            baseUrl: () => meisterTaskApiUrl,
            authMapping: async (auth) => {
                return {
                    'Authorization': `Bearer ${auth}`,
                };
            },
        }),
    ],
    triggers: [
      newAttachment,
      newPerson,
      newSection,
      newComment,
      newTaskLabel,
      newChecklistItem,
      newProject,
      newLabel,
      newTask
    ],
});
