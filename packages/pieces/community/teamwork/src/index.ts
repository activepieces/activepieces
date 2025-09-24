
import { createPiece } from "@activepieces/pieces-framework";
import { teamworkAuth } from "./lib/common/auth";
import { createProject } from "./lib/actions/create-project";
import { createTaskList } from "./lib/actions/create-task-list";
import { createTask } from "./lib/actions/create-task";
import { markTaskComplete } from "./lib/actions/mark-task-complete";
import { newTask } from "./lib/triggers/new-task";
import { createCompany } from "./lib/actions/create-company";
import { createPerson } from "./lib/actions/create-person";
import { updateTask } from "./lib/actions/update-task";
import { createTaskComment } from "./lib/actions/create-task-comment";
import { findTask } from "./lib/actions/find-task";
import { findCompany } from "./lib/actions/find-company";
import { findMilestone } from "./lib/actions/find-milestone";
import { findNotebookOrComment } from "./lib/actions/find-notebook-or-comment";
import { newPerson } from "./lib/triggers/new-person";
import { createTimeEntryOnTask } from "./lib/actions/create-time-entry-on-task";
import { createExpense } from "./lib/actions/create-expense";
import { uploadFileToProject } from "./lib/actions/upload-file-to-project";
import { createMessageReply } from "./lib/actions/create-message-reply";
import { createMilestone } from "./lib/actions/create-milestone";
import { addPeopleToProject } from "./lib/actions/add-people-to-project";
import { newComment } from "./lib/triggers/new-comment";
import { newMessage } from "./lib/triggers/new-message";
import { newFile } from "./lib/triggers/new-file";
import { newExpense } from "./lib/triggers/new-expense";
import { newInvoice } from "./lib/triggers/new-invoice";

  export const teamwork = createPiece({
      displayName: "Teamwork",
      auth: teamworkAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/teamwork.png",
      authors: ['sparkybug'],
      actions: [
        createProject,
        createTaskList,
        createTask,
        markTaskComplete,
        createCompany,
        createPerson,
        updateTask,
        createTaskComment,
        createTimeEntryOnTask,
        createExpense,
        uploadFileToProject,
        createMessageReply,
        createMilestone,
        addPeopleToProject,
        findTask,
        findCompany,
        findMilestone,
        findNotebookOrComment,
      ],
      triggers: [newTask, newPerson, newComment, newMessage, newFile, newExpense, newInvoice],
    });
    