import { attioCreateAttributeAction } from './create-attribute';
import { attioCreateCallRecordingAction } from './create-call-recording';
import { attioCreateCommentAction } from './create-comment';
import { attioCreateFolderAction } from './create-folder';
import { attioCreateListEntryAction } from './create-list-entry';
import { attioCreateListAction } from './create-list';
import { attioCreateMeetingAction } from './create-meeting';
import { attioCreateNoteAction } from './create-note';
import { attioCreateObjectAction } from './create-object';
import { attioCreateRecordAction } from './create-record';
import { attioCreateSelectOptionAction } from './create-select-option';
import { attioCreateStatusAction } from './create-status';
import { attioCreateTaskAction } from './create-task';
import { attioDeleteCallRecordingAction } from './delete-call-recording';
import { attioDeleteCommentAction } from './delete-comment';
import { attioDeleteFileAction } from './delete-file';
import { attioDeleteListEntryAction } from './delete-list-entry';
import { attioDeleteMeetingAction } from './delete-meeting';
import { attioDeleteNoteAction } from './delete-note';
import { attioDeleteObjectAction } from './delete-object';
import { attioDeleteRecordAction } from './delete-record';
import { attioDeleteTaskAction } from './delete-task';
import { attioDownloadFileAction } from './download-file';
import { attioGetAttributeAction } from './get-attribute';
import { attioGetCallRecordingAction } from './get-call-recording';
import { attioGetCommentAction } from './get-comment';
import { attioGetFileAction } from './get-file';
import { attioGetListEntryAction } from './get-list-entry';
import { attioGetListAction } from './get-list';
import { attioGetMeetingAction } from './get-meeting';
import { attioGetNoteAction } from './get-note';
import { attioGetObjectAction } from './get-object';
import { attioGetRecordAction } from './get-record';
import { attioGetSelfAction } from './get-self';
import { attioGetTaskAction } from './get-task';
import { attioGetThreadAction } from './get-thread';
import { attioGetWorkspaceMemberAction } from './get-workspace-member';
import { attioLinkMeetingRecordsAction } from './link-meeting-records';
import { attioListAttributesAction } from './list-attributes';
import { attioListCallRecordingsAction } from './list-call-recordings';
import { attioListFilesAction } from './list-files';
import { attioListListEntryAttributeValuesAction } from './list-list-entry-attribute-values';
import { attioListListViewsAction } from './list-list-views';
import { attioListListsAction } from './list-lists';
import { attioListMeetingsAction } from './list-meetings';
import { attioListNotesAction } from './list-notes';
import { attioListObjectViewsAction } from './list-object-views';
import { attioListObjectsAction } from './list-objects';
import { attioListRecordAttributeValuesAction } from './list-record-attribute-values';
import { attioListRecordEntriesAction } from './list-record-entries';
import { attioListSelectOptionsAction } from './list-select-options';
import { attioListStatusesAction } from './list-statuses';
import { attioListTasksAction } from './list-tasks';
import { attioListThreadsAction } from './list-threads';
import { attioListWorkspaceMembersAction } from './list-workspace-members';
import { attioMergeRecordsAction } from './merge-records';
import { attioOverwriteListEntryAction } from './overwrite-list-entry';
import { attioOverwriteRecordAction } from './overwrite-record';
import { attioQueryListEntriesAction } from './query-list-entries';
import { attioQueryRecordsAction } from './query-records';
import { attioReplaceMeetingRecordsAction } from './replace-meeting-records';
import { attioSearchRecordsAction } from './search-records';
import { attioUnsubscribeEmailsAction } from './unsubscribe-emails';
import { attioUpdateAttributeAction } from './update-attribute';
import { attioUpdateListEntryAction } from './update-list-entry';
import { attioUpdateListAction } from './update-list';
import { attioUpdateNoteAction } from './update-note';
import { attioUpdateObjectAction } from './update-object';
import { attioUpdateRecordAction } from './update-record';
import { attioUpdateSelectOptionAction } from './update-select-option';
import { attioUpdateStatusAction } from './update-status';
import { attioUpdateTaskAction } from './update-task';
import { attioUploadFileAction } from './upload-file';
import { attioUpsertListEntryAction } from './upsert-list-entry';
import { attioUpsertRecordAction } from './upsert-record';
import { attioWriteListEntryAttributeValuesAction } from './write-list-entry-attribute-values';
import { attioWriteRecordAttributeValuesAction } from './write-record-attribute-values';

export const attioAiActions = [
	attioCreateAttributeAction,
	attioCreateCallRecordingAction,
	attioCreateCommentAction,
	attioCreateFolderAction,
	attioCreateListEntryAction,
	attioCreateListAction,
	attioCreateMeetingAction,
	attioCreateNoteAction,
	attioCreateObjectAction,
	attioCreateRecordAction,
	attioCreateSelectOptionAction,
	attioCreateStatusAction,
	attioCreateTaskAction,
	attioDeleteCallRecordingAction,
	attioDeleteCommentAction,
	attioDeleteFileAction,
	attioDeleteListEntryAction,
	attioDeleteMeetingAction,
	attioDeleteNoteAction,
	attioDeleteObjectAction,
	attioDeleteRecordAction,
	attioDeleteTaskAction,
	attioDownloadFileAction,
	attioGetAttributeAction,
	attioGetCallRecordingAction,
	attioGetCommentAction,
	attioGetFileAction,
	attioGetListEntryAction,
	attioGetListAction,
	attioGetMeetingAction,
	attioGetNoteAction,
	attioGetObjectAction,
	attioGetRecordAction,
	attioGetSelfAction,
	attioGetTaskAction,
	attioGetThreadAction,
	attioGetWorkspaceMemberAction,
	attioLinkMeetingRecordsAction,
	attioListAttributesAction,
	attioListCallRecordingsAction,
	attioListFilesAction,
	attioListListEntryAttributeValuesAction,
	attioListListViewsAction,
	attioListListsAction,
	attioListMeetingsAction,
	attioListNotesAction,
	attioListObjectViewsAction,
	attioListObjectsAction,
	attioListRecordAttributeValuesAction,
	attioListRecordEntriesAction,
	attioListSelectOptionsAction,
	attioListStatusesAction,
	attioListTasksAction,
	attioListThreadsAction,
	attioListWorkspaceMembersAction,
	attioMergeRecordsAction,
	attioOverwriteListEntryAction,
	attioOverwriteRecordAction,
	attioQueryListEntriesAction,
	attioQueryRecordsAction,
	attioReplaceMeetingRecordsAction,
	attioSearchRecordsAction,
	attioUnsubscribeEmailsAction,
	attioUpdateAttributeAction,
	attioUpdateListEntryAction,
	attioUpdateListAction,
	attioUpdateNoteAction,
	attioUpdateObjectAction,
	attioUpdateRecordAction,
	attioUpdateSelectOptionAction,
	attioUpdateStatusAction,
	attioUpdateTaskAction,
	attioUploadFileAction,
	attioUpsertListEntryAction,
	attioUpsertRecordAction,
	attioWriteListEntryAttributeValuesAction,
	attioWriteRecordAttributeValuesAction,
];
