import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { searchCompanies } from './lib/actions/search-companies';
import { lookupCompany } from './lib/actions/lookup-company';
import { enrichCompany } from './lib/actions/enrich-company';
import { searchPeople } from './lib/actions/search-people';
import { lookupPerson } from './lib/actions/lookup-person';
import { enrichPerson } from './lib/actions/enrich-person';
import { revealContact } from './lib/actions/reveal-contact';
import { searchJobs } from './lib/actions/search-jobs';
import { searchNews } from './lib/actions/search-news';
import { findSimilarCompanies } from './lib/actions/find-similar-companies';
import { lookupTechnology } from './lib/actions/lookup-technology';
import { linkedinPersonLookup } from './lib/actions/linkedin-person-lookup';
import { searchAds } from './lib/actions/search-ads';
import { linkedinCompanyLookup } from './lib/actions/linkedin-company-lookup';
import { lookupJob } from './lib/actions/lookup-job';
import { lookupNews } from './lib/actions/lookup-news';
import { lookupAdvertisement } from './lib/actions/lookup-advertisement';
import { lookupLookalike } from './lib/actions/lookup-lookalike';
import { batchRedeemContacts } from './lib/actions/batch-redeem-contacts';
import { queryBatchRedeem } from './lib/actions/query-batch-redeem';
import { getLocations } from './lib/actions/get-locations';
import { getDepartments } from './lib/actions/get-departments';
import { getDepartmentFunctions } from './lib/actions/get-department-functions';
import { getManagementLevels } from './lib/actions/get-management-levels';
import { getCompanySizes } from './lib/actions/get-company-sizes';
import { getTimezones } from './lib/actions/get-timezones';
import { getNewsCategories } from './lib/actions/get-news-categories';
import { getNewsGalleries } from './lib/actions/get-news-galleries';
import { getNewsLanguages } from './lib/actions/get-news-languages';
import { searchTechnologies } from './lib/actions/search-technologies';
import { searchTechnologyCategories } from './lib/actions/search-technology-categories';
import { searchVerticals } from './lib/actions/search-verticals';
import { searchVerticalCategories } from './lib/actions/search-vertical-categories';
import { searchVerticalSubCategories } from './lib/actions/search-vertical-sub-categories';
import { createMonitor } from './lib/actions/create-monitor';
import { updateMonitor } from './lib/actions/update-monitor';
import { getMonitor } from './lib/actions/get-monitor';
import { listMonitors } from './lib/actions/list-monitors';
import { deleteMonitor } from './lib/actions/delete-monitor';
import { duplicateMonitor } from './lib/actions/duplicate-monitor';
import { testRunMonitor } from './lib/actions/test-run-monitor';
import { retryMonitor } from './lib/actions/retry-monitor';
import { getMonitorStats } from './lib/actions/get-monitor-stats';
import { getMonitorLogs } from './lib/actions/get-monitor-logs';
import { getMonitorChart } from './lib/actions/get-monitor-chart';
import { getMonitorLogDetail } from './lib/actions/get-monitor-log-detail';
import { revealMonitorSignature } from './lib/actions/reveal-monitor-signature';
import { validateWebhook } from './lib/actions/validate-webhook';
import { getProfile } from './lib/actions/get-profile';
import { getUsage } from './lib/actions/get-usage';
import { pubrioWebhookTrigger } from './lib/triggers/webhook';

export const pubrioAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: 'Your Pubrio API key from dashboard.pubrio.com',
	required: true,
});

export const pubrio = createPiece({
	displayName: 'Pubrio',
	auth: pubrioAuth,
	minimumSupportedRelease: '0.30.0',
	logoUrl: 'https://pubrio.com/favicon.ico',
	authors: ['pubrio'],
	actions: [
		searchCompanies,
		lookupCompany,
		enrichCompany,
		searchPeople,
		lookupPerson,
		enrichPerson,
		revealContact,
		searchJobs,
		searchNews,
		findSimilarCompanies,
		lookupTechnology,
		linkedinPersonLookup,
		searchAds,
		linkedinCompanyLookup,
		lookupJob,
		lookupNews,
		lookupAdvertisement,
		lookupLookalike,
		batchRedeemContacts,
		queryBatchRedeem,
		getLocations,
		getDepartments,
		getDepartmentFunctions,
		getManagementLevels,
		getCompanySizes,
		getTimezones,
		getNewsCategories,
		getNewsGalleries,
		getNewsLanguages,
		searchTechnologies,
		searchTechnologyCategories,
		searchVerticals,
		searchVerticalCategories,
		searchVerticalSubCategories,
		createMonitor,
		updateMonitor,
		getMonitor,
		listMonitors,
		deleteMonitor,
		duplicateMonitor,
		testRunMonitor,
		retryMonitor,
		getMonitorStats,
		getMonitorLogs,
		getMonitorChart,
		getMonitorLogDetail,
		revealMonitorSignature,
		validateWebhook,
		getProfile,
		getUsage,
	],
	triggers: [pubrioWebhookTrigger],
});
