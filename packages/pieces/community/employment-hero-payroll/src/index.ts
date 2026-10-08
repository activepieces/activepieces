import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { employmentHeroPayrollAuth } from './lib/auth';
import { payrollClient } from './lib/common/client';
import { listBusinesses } from './lib/actions/list-businesses';
import { listEmployees } from './lib/actions/list-employees';
import { getEmployee } from './lib/actions/get-employee';
import { listPayCategories } from './lib/actions/list-pay-categories';
import { listWorkTypes } from './lib/actions/list-work-types';
import { listLocations } from './lib/actions/list-locations';
import { listTimesheets } from './lib/actions/list-timesheets';
import { createTimesheet } from './lib/actions/create-timesheet';
import { updateTimesheet } from './lib/actions/update-timesheet';
import { bulkCreateTimesheets } from './lib/actions/bulk-create-timesheets';
import { z } from 'zod';

const customApiCall = createCustomApiCallAction({
  auth: employmentHeroPayrollAuth,
  baseUrl: () => payrollClient.baseUrl,
  authMapping: async (auth, props) => {
    const { url } = z.object({ url: z.string() }).parse(props['url']);
    const target = new URL(
      url.replace(/^\/(?!\/)/, ''),
      `${payrollClient.baseUrl}/`
    );
    if (
      target.origin !== new URL(payrollClient.baseUrl).origin ||
      !(
        target.pathname === '/api/v2' || target.pathname.startsWith('/api/v2/')
      ) ||
      target.username ||
      target.password ||
      props['followRedirects']
    ) {
      throw new Error(
        'Use an Australia Payroll API endpoint under /api/v2/ with redirects disabled.'
      );
    }
    return {
      Authorization: `Basic ${Buffer.from(`${auth.secret_text}:`).toString(
        'base64'
      )}`,
    };
  },
});

export const employmentHeroPayroll = createPiece({
  displayName: 'Employment Hero Payroll',
  description:
    'Connect Employment Hero Payroll Australia, formerly KeyPay, to automate employee lookups and timesheet imports.',
  auth: employmentHeroPayrollAuth,
  minimumSupportedRelease: '0.92.0',
  logoUrl: 'https://developer.employmenthero.com/favicon.ico',
  categories: [PieceCategory.HUMAN_RESOURCES],
  authors: ['ReedME'],
  actions: [
    listBusinesses,
    listEmployees,
    getEmployee,
    listPayCategories,
    listWorkTypes,
    listLocations,
    listTimesheets,
    createTimesheet,
    updateTimesheet,
    bulkCreateTimesheets,
    customApiCall,
  ],
  triggers: [],
});
