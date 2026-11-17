import { convertDocumentAction } from './convert-document';
import { deleteDocumentAction } from './delete-document';
import { deleteExtractorAction } from './delete-extractor';
import { getDocumentAction } from './get-document';
import { getExtractorAction } from './get-extractor';
import { getExtractorUpgradeInfoAction } from './get-extractor-upgrade-info';
import { getUsageAction } from './get-usage';
import { listDocumentsAction } from './list-documents';
import { listExtractorsAction } from './list-extractors';
import { remixExtractorAction } from './remix-extractor';
import { runExtractorAction } from './run-extractor';
import { updateExtractorAction } from './update-extractor';
import { upgradeExtractorAction } from './upgrade-extractor';

export const doctlyAiActions = [
	listDocumentsAction,
	convertDocumentAction,
	getDocumentAction,
	deleteDocumentAction,
	listExtractorsAction,
	runExtractorAction,
	getExtractorAction,
	updateExtractorAction,
	remixExtractorAction,
	getExtractorUpgradeInfoAction,
	upgradeExtractorAction,
	deleteExtractorAction,
	getUsageAction,
];
