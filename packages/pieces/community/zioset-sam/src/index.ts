import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { zioSetAuth } from './lib/common/auth';
import { unassignedWorkerReport } from './lib/actions/get-unassigned-worker-report';
import { usedApplicationReport } from './lib/actions/get-used-application-report';
import { licenseInventorySummaryReport } from './lib/actions/get-license-inventory-summary-report';
import { lastDetectionReport } from './lib/actions/get-last-detection-report';
import { complianceReport } from './lib/actions/get-compliance-report';
import { stockStatusReport } from './lib/actions/get-stock-status-report';
import { reconsilationReport } from './lib/actions/get-reconsilation-report';
import { allBlacklistApplication } from './lib/actions/get-all-blacklist-application-report';
import { vulnerabilityApplications } from './lib/actions/get-vulnerable-application-report';
import { eolApplications } from './lib/actions/get-end-of-life-application-report';
import { eosApplications } from './lib/actions/get-end-of-support-application-report';
import { osLifecycleReport } from './lib/actions/get-os-lifecycle-report';
import { getPublisherAndProductList } from './lib/actions/get-publisher-and-product-list-report';
import { categoryWiseInstallReport } from './lib/actions/get-category-wise-install-report';
import { osBuildReport } from './lib/actions/get-os-build-report';
import { osWiseComplianceReport } from './lib/actions/get-os-compliance-report';
import { complianceApplicationReport } from './lib/actions/get-compliance-table-report';
import { publisherAndProjectCostReport } from './lib/actions/get-publisherCost-and-projectCost-report';
import { productLicenceUpdateReport } from './lib/actions/get-classified-license-report';


export const ziosetSam = createPiece({
  displayName: 'Zioset - SAM',
  description: '',
  auth: zioSetAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'data:image/jpeg;base64,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',
  authors: [ "Mithun Kumar Yadav" ],
  actions: [ unassignedWorkerReport, usedApplicationReport, licenseInventorySummaryReport, lastDetectionReport, complianceReport, stockStatusReport, reconsilationReport, allBlacklistApplication, vulnerabilityApplications, eolApplications, eosApplications, osLifecycleReport, getPublisherAndProductList, categoryWiseInstallReport, osBuildReport, osWiseComplianceReport, complianceApplicationReport, publisherAndProjectCostReport, productLicenceUpdateReport ],
  triggers: [ ],
});
