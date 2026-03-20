/**
 * Huly Activepieces piece — entry point.
 */
import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";

import { hulyAuth } from "./lib/auth";
import { addCommentAction } from "./lib/actions/add-comment";
import { addReactionAction } from "./lib/actions/add-reaction";
import { addThreadReplyAction } from "./lib/actions/add-thread-reply";
import { createCardAction } from "./lib/actions/create-card";
import { createChannelAction } from "./lib/actions/create-channel";
import { createComponentAction } from "./lib/actions/create-component";
import { createDocumentAction } from "./lib/actions/create-document";
import { createEventAction } from "./lib/actions/create-event";
import { createIssueAction } from "./lib/actions/create-issue";
import { createOrganizationAction } from "./lib/actions/create-organization";
import { createPersonAction } from "./lib/actions/create-person";
import { createRecurringEventAction } from "./lib/actions/create-recurring-event";
import { createLabelAction } from "./lib/actions/create-label";
import { createMilestoneAction } from "./lib/actions/create-milestone";
import { createProjectAction } from "./lib/actions/create-project";
import { createTestCaseAction } from "./lib/actions/create-test-case";
import { createTestPlanAction } from "./lib/actions/create-test-plan";
import { createTestRunAction } from "./lib/actions/create-test-run";
import { createTestSuiteAction } from "./lib/actions/create-test-suite";
import { createTeamspaceAction } from "./lib/actions/create-teamspace";
import { deleteAttachmentAction } from "./lib/actions/delete-attachment";
import { deleteCardAction } from "./lib/actions/delete-card";
import { deleteChannelAction } from "./lib/actions/delete-channel";
import { deleteEventAction } from "./lib/actions/delete-event";
import { deleteCommentAction } from "./lib/actions/delete-comment";
import { deleteDocumentAction } from "./lib/actions/delete-document";
import { deleteIssueAction } from "./lib/actions/delete-issue";
import { deletePersonAction } from "./lib/actions/delete-person";
import { deleteThreadReplyAction } from "./lib/actions/delete-thread-reply";
import { deleteLabelAction } from "./lib/actions/delete-label";
import { deleteProjectAction } from "./lib/actions/delete-project";
import { deleteTeamspaceAction } from "./lib/actions/delete-teamspace";
import { editDocumentAction } from "./lib/actions/edit-document";
import { getCardAction } from "./lib/actions/get-card";
import { getComponentAction } from "./lib/actions/get-component";
import { getEventAction } from "./lib/actions/get-event";
import { getDocumentAction } from "./lib/actions/get-document";
import { getIssueAction } from "./lib/actions/get-issue";
import { getPersonAction } from "./lib/actions/get-person";
import { getMilestoneAction } from "./lib/actions/get-milestone";
import { getUnreadNotificationCountAction } from "./lib/actions/get-unread-notification-count";
import { getProjectAction } from "./lib/actions/get-project";
import { getTeamspaceAction } from "./lib/actions/get-teamspace";
import { listActivityAction } from "./lib/actions/list-activity";
import { listAttachmentsAction } from "./lib/actions/list-attachments";
import { listCardSpacesAction } from "./lib/actions/list-card-spaces";
import { listCardsAction } from "./lib/actions/list-cards";
import { listChannelMessagesAction } from "./lib/actions/list-channel-messages";
import { listChannelsAction } from "./lib/actions/list-channels";
import { listCommentsAction } from "./lib/actions/list-comments";
import { listComponentsAction } from "./lib/actions/list-components";
import { listDocumentsAction } from "./lib/actions/list-documents";
import { listEventInstancesAction } from "./lib/actions/list-event-instances";
import { listEventsAction } from "./lib/actions/list-events";
import { listEmployeesAction } from "./lib/actions/list-employees";
import { listIssuesAction } from "./lib/actions/list-issues";
import { listLabelsAction } from "./lib/actions/list-labels";
import { listMilestonesAction } from "./lib/actions/list-milestones";
import { listNotificationsAction } from "./lib/actions/list-notifications";
import { listOrganizationsAction } from "./lib/actions/list-organizations";
import { listPersonsAction } from "./lib/actions/list-persons";
import { listProjectsAction } from "./lib/actions/list-projects";
import { listTestCasesAction } from "./lib/actions/list-test-cases";
import { listTestPlansAction } from "./lib/actions/list-test-plans";
import { listTestProjectsAction } from "./lib/actions/list-test-projects";
import { listTestResultsAction } from "./lib/actions/list-test-results";
import { listTestRunsAction } from "./lib/actions/list-test-runs";
import { listTestSuitesAction } from "./lib/actions/list-test-suites";
import { listRecurringEventsAction } from "./lib/actions/list-recurring-events";
import { listTimeReportsAction } from "./lib/actions/list-time-reports";
import { listThreadRepliesAction } from "./lib/actions/list-thread-replies";
import { listWorkSlotsAction } from "./lib/actions/list-work-slots";
import { logTimeAction } from "./lib/actions/log-time";
import { markAllNotificationsReadAction } from "./lib/actions/mark-all-notifications-read";
import { markNotificationReadAction } from "./lib/actions/mark-notification-read";
import { listTeamspacesAction } from "./lib/actions/list-teamspaces";
import { moveIssueAction } from "./lib/actions/move-issue";
import { runTestPlanAction } from "./lib/actions/run-test-plan";
import { sendChannelMessageAction } from "./lib/actions/send-channel-message";
import { updateChannelAction } from "./lib/actions/update-channel";
import { updateCommentAction } from "./lib/actions/update-comment";
import { updateEventAction } from "./lib/actions/update-event";
import { updateIssueAction } from "./lib/actions/update-issue";
import { updateThreadReplyAction } from "./lib/actions/update-thread-reply";
import { updatePersonAction } from "./lib/actions/update-person";
import { updateProjectAction } from "./lib/actions/update-project";
import { newChannelMessageTrigger } from "./lib/triggers/new-channel-message";
import { newDocumentTrigger } from "./lib/triggers/new-document";
import { newIssueTrigger } from "./lib/triggers/new-issue";
import { updatedIssueTrigger } from "./lib/triggers/updated-issue";

export const huly = createPiece({
  displayName: "Huly",
  description:
    "Open-source project management platform — issues, documents, contacts, calendar, and more",
  auth: hulyAuth,
  minimumSupportedRelease: "0.36.1",
  logoUrl: "https://cdn.activepieces.com/pieces/huly.png",
  authors: ["dearlordylord"],
  actions: [
    listProjectsAction,
    getProjectAction,
    createProjectAction,
    updateProjectAction,
    deleteProjectAction,
    listIssuesAction,
    getIssueAction,
    createIssueAction,
    updateIssueAction,
    deleteIssueAction,
    moveIssueAction,
    listLabelsAction,
    createLabelAction,
    deleteLabelAction,
    listMilestonesAction,
    getMilestoneAction,
    createMilestoneAction,
    listComponentsAction,
    getComponentAction,
    createComponentAction,
    listTeamspacesAction,
    getTeamspaceAction,
    createTeamspaceAction,
    deleteTeamspaceAction,
    listDocumentsAction,
    getDocumentAction,
    createDocumentAction,
    editDocumentAction,
    deleteDocumentAction,
    listPersonsAction,
    getPersonAction,
    createPersonAction,
    updatePersonAction,
    deletePersonAction,
    listEmployeesAction,
    listOrganizationsAction,
    createOrganizationAction,
    listCommentsAction,
    addCommentAction,
    updateCommentAction,
    deleteCommentAction,
    listChannelsAction,
    createChannelAction,
    updateChannelAction,
    deleteChannelAction,
    sendChannelMessageAction,
    listChannelMessagesAction,
    listThreadRepliesAction,
    addThreadReplyAction,
    updateThreadReplyAction,
    deleteThreadReplyAction,
    listEventsAction,
    getEventAction,
    createEventAction,
    updateEventAction,
    deleteEventAction,
    listRecurringEventsAction,
    createRecurringEventAction,
    listEventInstancesAction,
    listAttachmentsAction,
    deleteAttachmentAction,
    listCardSpacesAction,
    listCardsAction,
    getCardAction,
    createCardAction,
    deleteCardAction,
    logTimeAction,
    listTimeReportsAction,
    listWorkSlotsAction,
    listActivityAction,
    addReactionAction,
    listNotificationsAction,
    markNotificationReadAction,
    markAllNotificationsReadAction,
    getUnreadNotificationCountAction,
    listTestProjectsAction,
    listTestSuitesAction,
    createTestSuiteAction,
    listTestCasesAction,
    createTestCaseAction,
    listTestPlansAction,
    createTestPlanAction,
    listTestRunsAction,
    createTestRunAction,
    runTestPlanAction,
    listTestResultsAction,
  ],
  triggers: [newIssueTrigger, updatedIssueTrigger, newDocumentTrigger, newChannelMessageTrigger],
  categories: [PieceCategory.PRODUCTIVITY],
});

export { hulyAuth };
