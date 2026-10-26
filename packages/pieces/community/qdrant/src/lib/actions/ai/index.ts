import { clearPayloadAction } from './clear-payload';
import { collectionExistsAction } from './collection-exists';
import { countPointsAction } from './count-points';
import { createAliasAction } from './create-alias';
import { createCollectionAction } from './create-collection';
import { createPayloadIndexAction } from './create-payload-index';
import { createSnapshotAction } from './create-snapshot';
import { deleteAliasAction } from './delete-alias';
import { deleteCollectionAction } from './delete-collection';
import { deletePayloadIndexAction } from './delete-payload-index';
import { deletePayloadKeysAction } from './delete-payload-keys';
import { deletePointsAction } from './delete-points';
import { deleteSnapshotAction } from './delete-snapshot';
import { deleteVectorsAction } from './delete-vectors';
import { facetPayloadAction } from './facet-payload';
import { getCollectionAction } from './get-collection';
import { getPointsAction } from './get-points';
import { listAliasesAction } from './list-aliases';
import { listCollectionAliasesAction } from './list-collection-aliases';
import { listCollectionsAction } from './list-collections';
import { listSnapshotsAction } from './list-snapshots';
import { overwritePayloadAction } from './overwrite-payload';
import { queryPointsAction } from './query-points';
import { queryPointsGroupsAction } from './query-points-groups';
import { renameAliasAction } from './rename-alias';
import { scrollPointsAction } from './scroll-points';
import { setPayloadAction } from './set-payload';
import { updateCollectionAction } from './update-collection';
import { updateVectorsAction } from './update-vectors';
import { upsertPointsAction } from './upsert-points';

export const qdrantAiActions = [
	listCollectionsAction,
	getCollectionAction,
	collectionExistsAction,
	createCollectionAction,
	updateCollectionAction,
	deleteCollectionAction,
	listAliasesAction,
	listCollectionAliasesAction,
	createAliasAction,
	renameAliasAction,
	deleteAliasAction,
	createSnapshotAction,
	listSnapshotsAction,
	deleteSnapshotAction,
	createPayloadIndexAction,
	deletePayloadIndexAction,
	upsertPointsAction,
	getPointsAction,
	scrollPointsAction,
	countPointsAction,
	deletePointsAction,
	setPayloadAction,
	overwritePayloadAction,
	deletePayloadKeysAction,
	clearPayloadAction,
	updateVectorsAction,
	deleteVectorsAction,
	queryPointsAction,
	queryPointsGroupsAction,
	facetPayloadAction,
];
