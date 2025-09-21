import { createPiece } from "@activepieces/pieces-framework";
import { teamworkAuth } from "./lib/common/auth";
import { createCompanyAction } from "./lib/actions/create-company";
import { uploadFileToProjectAction } from "./lib/actions/upload-file-to-project";
import { createMessageReplyAction } from "./lib/actions/create-message-reply";
import { createMilestoneAction } from "./lib/actions/create-milestone";
import { createNotebookCommentAction } from "./lib/actions/create-notebook-comment";
import { createPersonAction } from "./lib/actions/create-person";
import { createProjectAction } from "./lib/actions/create-project";
import { createStageAction } from "./lib/actions/create-stage";
import { createTaskCommentAction } from "./lib/actions/create-task-comment";
import { createTaskListAction } from "./lib/actions/create-task-list";
import { createTimeEntryOnTaskAction } from "./lib/actions/create-time-entry-on-task";
import { createTaskAction } from "./lib/actions/create-task";
import { markTaskCompleteAction } from "./lib/actions/mark-task-complete";
import { createExpenseAction } from "./lib/actions/create-expense";
import { addPeopleToProjectAction } from "./lib/actions/add-people-to-project";
import { updateTaskAction } from "./lib/actions/update-task";
import { findCompanyAction } from "./lib/actions/find-company";
import { findMilestoneAction } from "./lib/actions/find-milestone";
import { findNotebookOrCommentAction } from "./lib/actions/find-notebook-comment";
import { findTaskAction } from "./lib/actions/find-task";
import { newCommentTrigger } from "./lib/triggers/new-comment";
import { newExpenseTrigger } from "./lib/triggers/new-expense";
import { newInvoiceTrigger } from "./lib/triggers/new-invoice";
import { newMessageTrigger } from "./lib/triggers/new-message";
import { newPersonTrigger } from "./lib/triggers/new-person";
import { newTaskTrigger } from "./lib/triggers/new-task";
import { newFileTrigger } from "./lib/triggers/new-file";

export const teamwork = createPiece({
  displayName: "Teamwork",
  auth: teamworkAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/teamwork.png",
  authors: [],
  actions: [
    createCompanyAction,
    uploadFileToProjectAction,
    createMessageReplyAction,
    createMilestoneAction,
    createNotebookCommentAction,
    createPersonAction,
    createProjectAction,
    createStageAction,
    createTaskCommentAction,
    createTaskListAction,
    createTimeEntryOnTaskAction,
    createTaskAction,
    markTaskCompleteAction,
    createExpenseAction,
    addPeopleToProjectAction,
    updateTaskAction,
    findCompanyAction,
    findMilestoneAction,
    findNotebookOrCommentAction,
    findTaskAction
  ],
  triggers: [
    newCommentTrigger,
    newExpenseTrigger,
    newInvoiceTrigger,
    newMessageTrigger,
    newPersonTrigger,
    newTaskTrigger,
    newFileTrigger
  ],
});