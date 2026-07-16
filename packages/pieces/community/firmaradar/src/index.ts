import { PieceCategory, createPiece } from '@activepieces/pieces-framework';
import { firmaradarAuth } from './lib/common/auth';
import { checkAmlPep } from './lib/actions/check-aml-pep';
import { checkFiv } from './lib/actions/check-fiv';
import { checkFivBulk } from './lib/actions/check-fiv-bulk';
import { checkKonkursEksponering } from './lib/actions/check-konkurs-eksponering';
import { compareCompanies } from './lib/actions/compare-companies';
import { confirmRiskScoreDisclaimer } from './lib/actions/confirm-risk-score-disclaimer';
import { convertNok } from './lib/actions/convert-nok';
import { findRelatedCompanies } from './lib/actions/find-related-companies';
import { findSharedConnections } from './lib/actions/find-shared-connections';
import { getAmlReport } from './lib/actions/get-aml-report';
import { getCompany } from './lib/actions/get-company';
import { getCompanyAnnouncements } from './lib/actions/get-company-announcements';
import { getCompanyFinancials } from './lib/actions/get-company-financials';
import { getCompanyIp } from './lib/actions/get-company-ip';
import { getCompanyOwnership } from './lib/actions/get-company-ownership';
import { getCompanyRoles } from './lib/actions/get-company-roles';
import { getCompanySignals } from './lib/actions/get-company-signals';
import { getKonsernstotte } from './lib/actions/get-konsernstotte';
import { getKonsernstotteHistorikk } from './lib/actions/get-konsernstotte-historikk';
import { getPersonCompanies } from './lib/actions/get-person-companies';
import { getPersonRoles } from './lib/actions/get-person-roles';
import { getRiskScore } from './lib/actions/get-risk-score';
import { getRiskScoreBulk } from './lib/actions/get-risk-score-bulk';
import { listCompaniesInNace } from './lib/actions/list-companies-in-nace';
import { listNaceCodes } from './lib/actions/list-nace-codes';
import { searchAnnouncements } from './lib/actions/search-announcements';
import { searchCompanies } from './lib/actions/search-companies';
import { searchPersons } from './lib/actions/search-persons';
import { startAmlReport } from './lib/actions/start-aml-report';
import { companyChanged } from './lib/triggers/company-changed';
import { naceEvent } from './lib/triggers/nace-event';

export const firmaradar = createPiece({
    displayName: 'Firmaradar',
    description:
        'Norwegian company intelligence for KYC, AML, credit, ownership and ' +
        'risk workflows. Firmaradar is an enrichment platform that fuses the ' +
        'Brønnøysund registers, Skatteetaten, sanctions/PEP registers and ' +
        'public-grant registries into decision-ready insights — screen ' +
        'counterparties, map ownership and groups, score risk, and trigger ' +
        'flows on announcements, ownership changes and industry events.',
    auth: firmaradarAuth,
    minimumSupportedRelease: '0.82.0',
    // Community-CDN-konvensjonen; maintainer laster opp asset-et
    // (kilde: https://firmaradar.no/logo/logo.png) ved PR-review.
    logoUrl: 'https://cdn.activepieces.com/pieces/firmaradar.png',
    authors: ['Tiwas'],
    categories: [PieceCategory.BUSINESS_INTELLIGENCE, PieceCategory.SALES_AND_CRM],
    actions: [
        searchCompanies,
        getCompany,
        getCompanyOwnership,
        getCompanyRoles,
        getCompanyFinancials,
        getCompanyIp,
        getCompanyAnnouncements,
        getCompanySignals,
        findRelatedCompanies,
        findSharedConnections,
        compareCompanies,
        searchPersons,
        getPersonRoles,
        getPersonCompanies,
        checkKonkursEksponering,
        checkAmlPep,
        startAmlReport,
        getAmlReport,
        getRiskScore,
        getRiskScoreBulk,
        checkFiv,
        checkFivBulk,
        confirmRiskScoreDisclaimer,
        listCompaniesInNace,
        listNaceCodes,
        searchAnnouncements,
        getKonsernstotte,
        getKonsernstotteHistorikk,
        convertNok,
    ],
    triggers: [companyChanged, naceEvent],
});
