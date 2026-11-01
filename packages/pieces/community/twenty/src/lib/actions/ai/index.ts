import { createRecordAction } from './create-record';
import { createRecordsAction } from './create-records';
import { deleteRecordAction } from './delete-record';
import { findDuplicateRecordsAction } from './find-duplicate-records';
import { getObjectAction } from './get-object';
import { getRecordAction } from './get-record';
import { groupRecordsAction } from './group-records';
import { listFieldsAction } from './list-fields';
import { listObjectsAction } from './list-objects';
import { listRecordsAction } from './list-records';
import { mergeRecordsAction } from './merge-records';
import { restoreRecordAction } from './restore-record';
import { updateRecordAction } from './update-record';

export const twentyAiActions = [
	listObjectsAction,
	getObjectAction,
	listFieldsAction,
	listRecordsAction,
	getRecordAction,
	createRecordAction,
	createRecordsAction,
	updateRecordAction,
	deleteRecordAction,
	restoreRecordAction,
	findDuplicateRecordsAction,
	mergeRecordsAction,
	groupRecordsAction,
];
