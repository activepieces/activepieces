import {
  AppConnectionType,
  AppConnectionValueForAuthProperty,
  createMockActionContext,
  PropertyType,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpError,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { employmentHeroPayroll } from '../../index';
import { employmentHeroPayrollAuth } from '../auth';
import { payrollProperties } from '../common/properties';
import { timesheetProperties } from '../common/timesheet-properties';
import { listBusinesses } from './list-businesses';
import { listEmployees } from './list-employees';
import { listPayCategories } from './list-pay-categories';
import { listWorkTypes } from './list-work-types';
import { listLocations } from './list-locations';
import { getEmployee } from './get-employee';
import { listTimesheets } from './list-timesheets';
import { createTimesheet } from './create-timesheet';
import { updateTimesheet } from './update-timesheet';
import { bulkCreateTimesheets } from './bulk-create-timesheets';

const auth: AppConnectionValueForAuthProperty<
  typeof employmentHeroPayrollAuth
> = { type: AppConnectionType.SECRET_TEXT, secret_text: 'test-key' };
const base = 'https://api.yourpayroll.com.au/api/v2';
const pagination = { limit: 25, offset: 50, filter: undefined };
const hours = {
  mode: 'hours',
  employeeId: 7,
  startTime: '2026-10-08T09:00:00',
  endTime: '2026-10-08T17:00:00',
  externalId: 'source-42',
};
const props = {
  businessId: 3,
  employeeId: 7,
  mode: 'hours',
  entry: { startTime: hours.startTime, endTime: hours.endTime },
  locationId: undefined,
  workTypeId: undefined,
  payCategoryId: undefined,
  comments: undefined,
  externalId: 'source-42',
  rate: undefined,
};

function context<P extends Record<string, unknown>>(propsValue: P) {
  return { ...createMockActionContext({ propsValue: {} }), propsValue, auth };
}

function response(body: unknown) {
  return { status: 200, headers: {}, body };
}
const send = vi.spyOn(httpClient, 'sendRequest');
beforeEach(() => {
  send.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('connection and lookups', () => {
  it('validates the API key using HTTP Basic with an empty password', async () => {
    send.mockResolvedValue(response({ id: 1 }));
    if (!employmentHeroPayrollAuth.validate)
      throw new Error('Missing connection validation');
    const server = { apiUrl: '', publicUrl: '', mintOidcToken: async () => '' };
    expect(
      await employmentHeroPayrollAuth.validate({ auth: 'test-key', server })
    ).toEqual({ valid: true });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        url: `${base}/user`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BASIC,
          username: 'test-key',
          password: '',
        },
        followRedirects: false,
      })
    );
  });

  it('reports invalid credentials without returning the request or key', async () => {
    send.mockRejectedValue(
      new HttpError({ secret: 'test-key' }, { status: 401, responseBody: {} })
    );
    if (!employmentHeroPayrollAuth.validate)
      throw new Error('Missing validation');
    const result = await employmentHeroPayrollAuth.validate({
      auth: 'test-key',
      server: { apiUrl: '', publicUrl: '', mintOidcToken: async () => '' },
    });
    expect(result).toMatchObject({ valid: false });
    expect(JSON.stringify(result)).toContain('API key is invalid');
    expect(JSON.stringify(result)).not.toContain('test-key');
  });

  it('rejects redirects instead of treating them as successful authentication', async () => {
    send.mockResolvedValue({
      status: 302,
      headers: { location: 'https://example.com' },
      body: '',
    });
    if (!employmentHeroPayrollAuth.validate)
      throw new Error('Missing validation');
    const result = await employmentHeroPayrollAuth.validate({
      auth: 'test-key',
      server: { apiUrl: '', publicUrl: '', mintOidcToken: async () => '' },
    });
    expect(result).toMatchObject({ valid: false });
    expect(JSON.stringify(result)).toContain('(302)');
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('pages businesses and normalises output columns', async () => {
    send.mockResolvedValue(
      response([
        { id: 1, name: 'First' },
        { id: 2, name: 'Second', externalId: 'b' },
      ])
    );
    expect(await listBusinesses.run(context(pagination))).toEqual([
      { id: 1, name: 'First', externalId: null },
      { id: 2, name: 'Second', externalId: 'b' },
    ]);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        url: `${base}/business`,
        queryParams: { $top: '25', $skip: '50', $orderby: 'Id' },
      })
    );
  });

  it.each([
    [listEmployees, 'employee/details'],
    [listPayCategories, 'paycategory'],
    [listWorkTypes, 'worktype'],
    [listLocations, 'location'],
  ])('uses the documented endpoint for $0.name', async (action, resource) => {
    send.mockResolvedValue(response([]));
    expect(await action.run(context({ ...pagination, businessId: 3 }))).toEqual(
      []
    );
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ url: `${base}/business/3/${resource}` })
    );
  });

  it('gets one employee and preserves nested values as flat output', async () => {
    send.mockResolvedValue(
      response({
        id: 7,
        firstName: 'Jo',
        address: { city: 'Sydney' },
        tags: ['a', 'b'],
      })
    );
    expect(
      await getEmployee.run(context({ businessId: 3, employeeId: 7 }))
    ).toEqual({
      id: 7,
      firstName: 'Jo',
      address_city: 'Sydney',
      tags: '["a","b"]',
    });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        url: `${base}/business/3/employee/unstructured/7`,
      })
    );
  });

  it('loads employee choices across multiple pages', async () => {
    send
      .mockResolvedValueOnce(
        response(
          Array.from({ length: 100 }, (_, index) => ({
            id: index + 1,
            firstName: 'Worker',
            surname: String(index),
          }))
        )
      )
      .mockResolvedValueOnce(
        response([
          {
            id: 101,
            firstName: 'Jo',
            surname: 'Sample',
            emailAddress: 'jo@example.com',
          },
        ])
      );
    const result = await payrollProperties.employee.options(
      { auth, businessId: 3 },
      context({})
    );
    expect(result.options).toHaveLength(101);
    expect(result.options[100]).toEqual({
      value: 101,
      label: 'Jo Sample (jo@example.com) [101]',
    });
    expect(send.mock.calls[1]?.[0].queryParams).toMatchObject({ $skip: '100' });
  });

  it('escapes apostrophes in dropdown search', async () => {
    send.mockResolvedValue(response([]));
    await payrollProperties.employee.options(
      { auth, businessId: 3 },
      { ...context({}), searchValue: "O'Brien" }
    );
    expect(send.mock.calls[0]?.[0].queryParams?.['$filter']).toBe(
      "(substringof('O''Brien',FirstName) or substringof('O''Brien',Surname) or substringof('O''Brien',EmailAddress))"
    );
  });

  it('does not load choices until a business is selected', async () => {
    expect(
      await payrollProperties.employee.options({ auth }, context({}))
    ).toMatchObject({ disabled: true, options: [] });
    expect(send).not.toHaveBeenCalled();
  });

  it.each([0, -1, 101, 1.5])(
    'rejects an invalid page size %s',
    async (limit) => {
      await expect(
        listBusinesses.run(context({ ...pagination, limit }))
      ).rejects.toThrow();
      expect(send).not.toHaveBeenCalled();
    }
  );
});

describe('timesheet reads and forms', () => {
  it('uses PascalCase OData fields with an exclusive end date', async () => {
    send.mockResolvedValue(response([]));
    await listTimesheets.run(
      context({
        businessId: 3,
        employeeId: 7,
        fromDate: '2026-10-08',
        toDate: '2026-10-09',
        ...pagination,
        filter: "Status eq 'Approved'",
      })
    );
    expect(send.mock.calls[0]?.[0].queryParams).toEqual({
      $top: '25',
      $skip: '50',
      $orderby: 'Id',
      $filter:
        "EmployeeId eq 7 and StartTime ge datetime'2026-10-08T00:00:00' and StartTime lt datetime'2026-10-09T00:00:00' and (Status eq 'Approved')",
    });
  });

  it('rejects a reversed date range before making a request', async () => {
    await expect(
      listTimesheets.run(
        context({
          businessId: 3,
          employeeId: undefined,
          fromDate: '2026-10-09',
          toDate: '2026-10-08',
          ...pagination,
        })
      )
    ).rejects.toThrow('Date Until');
    expect(send).not.toHaveBeenCalled();
  });

  it('shows only the inputs for the selected entry type', async () => {
    expect(
      Object.keys(
        await timesheetProperties.props.entry.props(
          { auth, mode: 'hours' },
          context({})
        )
      )
    ).toEqual(['startTime', 'endTime', 'breaks']);
    expect(
      Object.keys(
        await timesheetProperties.props.entry.props(
          { auth, mode: 'units' },
          context({})
        )
      )
    ).toEqual(['date', 'units']);
  });

  it('loads named choices into bulk row fields', async () => {
    send.mockResolvedValue(response([{ id: 7, name: 'Sample' }]));
    const fields = await bulkCreateTimesheets.props.batch.props(
      { auth, businessId: 3 },
      context({})
    );
    const entries = fields['entries'];
    expect(entries?.type).toBe(PropertyType.ARRAY);
    if (entries?.type !== PropertyType.ARRAY)
      throw new Error('Missing batch array');
    expect(entries.properties?.['employeeId']).toMatchObject({
      type: PropertyType.STATIC_DROPDOWN,
      options: { options: [{ label: 'Sample [7]', value: 7 }] },
    });
  });
});

describe('timesheet writes', () => {
  it('creates an hours entry with duplicate prevention and no write retries', async () => {
    send.mockResolvedValue(response({ id: 42, employeeId: 7 }));
    expect(
      await createTimesheet.run(context({ ...props, preventDuplicates: true }))
    ).toEqual({ id: 42, employeeId: 7 });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        url: `${base}/business/3/timesheet`,
        method: HttpMethod.POST,
        retries: 0,
        queryParams: { enforceUniqueExternalId: 'true' },
        body: {
          employeeId: 7,
          startTime: '2026-10-08T09:00:00',
          endTime: '2026-10-08T17:00:00',
          breaks: [],
          externalId: 'source-42',
          source: 'API',
        },
      })
    );
  });

  it('requires a stable external ID when duplicate prevention is selected', async () => {
    await expect(
      createTimesheet.run(
        context({ ...props, externalId: undefined, preventDuplicates: true })
      )
    ).rejects.toThrow('External ID');
    expect(send).not.toHaveBeenCalled();
  });

  it('creates a quantity allowance at midnight with its category and rate', async () => {
    send.mockResolvedValue(response({ id: 43 }));
    await createTimesheet.run(
      context({
        ...props,
        mode: 'units',
        entry: { date: '2026-10-08', units: 2 },
        payCategoryId: 9,
        rate: 15,
        preventDuplicates: true,
      })
    );
    expect(send.mock.calls[0]?.[0].body).toEqual({
      employeeId: 7,
      startTime: '2026-10-08T00:00:00',
      endTime: '2026-10-08T00:00:00',
      units: 2,
      breaks: [],
      payCategoryId: 9,
      rate: 15,
      externalId: 'source-42',
      source: 'API',
    });
  });

  it.each([
    { startTime: '2026-02-30T09:00:00', endTime: hours.endTime },
    { startTime: '2026-10-08T09:00:00Z', endTime: hours.endTime },
    { startTime: '2026-10-08T09:00:00.123', endTime: hours.endTime },
    { startTime: hours.startTime, endTime: '2026-10-08T08:00:00' },
    {
      startTime: hours.startTime,
      endTime: hours.endTime,
      breaks: [
        { startTime: '2026-10-08T08:00:00', endTime: '2026-10-08T09:30:00' },
      ],
    },
    {
      startTime: hours.startTime,
      endTime: hours.endTime,
      breaks: [
        { startTime: '2026-10-08T12:00:00', endTime: '2026-10-08T13:00:00' },
        { startTime: '2026-10-08T12:30:00', endTime: '2026-10-08T13:30:00' },
      ],
    },
  ])('rejects invalid dates or breaks before writing', async (entry) => {
    await expect(
      createTimesheet.run(context({ ...props, entry, preventDuplicates: true }))
    ).rejects.toThrow();
    expect(send).not.toHaveBeenCalled();
  });

  it('allows overnight shifts and preserves paid break flags', async () => {
    send.mockResolvedValue(response({ id: 44 }));
    await createTimesheet.run(
      context({
        ...props,
        entry: {
          startTime: '2026-10-08T22:00:00',
          endTime: '2026-10-09T06:00:00',
          breaks: [
            {
              startTime: '2026-10-09T01:00:00',
              endTime: '2026-10-09T01:30:00',
              isPaidBreak: true,
            },
          ],
        },
        preventDuplicates: true,
      })
    );
    expect(send.mock.calls[0]?.[0].body).toMatchObject({
      endTime: '2026-10-09T06:00:00',
      breaks: [{ isPaidBreak: true }],
    });
  });

  it('preserves omitted optional fields on update and clears quantity when switching to hours', async () => {
    send
      .mockResolvedValueOnce(
        response({
          id: 42,
          employeeId: 7,
          locationId: 8,
          payCategoryId: 9,
          units: 2,
          comments: 'Keep me',
          externalId: 'existing',
        })
      )
      .mockResolvedValueOnce(response({ id: 42, units: null }));
    await updateTimesheet.run(
      context({ ...props, timesheetId: 42, externalId: undefined })
    );
    expect(send.mock.calls[0]?.[0].method).toBe(HttpMethod.GET);
    expect(send.mock.calls[1]?.[0]).toMatchObject({
      method: HttpMethod.PUT,
      url: `${base}/business/3/timesheet/42`,
      body: {
        id: 42,
        units: null,
        locationId: 8,
        payCategoryId: 9,
        comments: 'Keep me',
        externalId: 'existing',
        startTime: hours.startTime,
        breaks: [],
      },
    });
  });

  it('does not PUT when the initial read fails', async () => {
    send.mockRejectedValue(
      new HttpError(undefined, { status: 404, responseBody: {} })
    );
    await expect(
      updateTimesheet.run(context({ ...props, timesheetId: 42 }))
    ).rejects.toThrow('not found');
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('groups bulk rows by employee and never replaces existing timesheets', async () => {
    send.mockResolvedValue(
      response({
        timesheets: {
          '7': [{ id: 42, employeeId: 7 }],
          '8': [{ id: 43, employeeId: 8 }],
        },
      })
    );
    expect(
      await bulkCreateTimesheets.run(
        context({
          businessId: 3,
          approved: false,
          batch: {
            entries: [
              hours,
              { employeeId: 8, mode: 'units', date: '2026-10-08', units: 1 },
            ],
          },
        })
      )
    ).toEqual([
      { id: 42, employeeId: 7 },
      { id: 43, employeeId: 8 },
    ]);
    expect(send.mock.calls[0]?.[0]).toMatchObject({
      method: HttpMethod.POST,
      retries: 0,
      url: `${base}/business/3/timesheet/bulk`,
      body: {
        approved: false,
        replaceExisting: false,
        returnResponse: true,
        employeeIdType: 'Standard',
        timesheets: {
          '7': [{ startTime: hours.startTime }],
          '8': [{ units: 1 }],
        },
      },
    });
  });

  it('rejects repeated external IDs inside a batch', async () => {
    await expect(
      bulkCreateTimesheets.run(
        context({
          businessId: 3,
          approved: false,
          batch: { entries: [hours, hours] },
        })
      )
    ).rejects.toThrow('repeated External IDs');
    expect(send).not.toHaveBeenCalled();
  });

  it.each([0, 101])(
    'rejects a batch of %s entries before writing',
    async (size) => {
      const entries = Array.from({ length: size }, (_, index) => ({
        ...hours,
        externalId: String(index),
      }));
      await expect(
        bulkCreateTimesheets.run(
          context({ businessId: 3, approved: false, batch: { entries } })
        )
      ).rejects.toThrow();
      expect(send).not.toHaveBeenCalled();
    }
  );

  it('reports vendor validation fields without leaking the key', async () => {
    send.mockRejectedValue(
      new HttpError(undefined, {
        status: 400,
        responseBody: {
          title: 'Validation failed',
          errors: {
            EmployeeId: ['Employee not found'],
            ExternalId: ['Rejected test-key'],
          },
        },
      })
    );
    await expect(
      createTimesheet.run(context({ ...props, preventDuplicates: true }))
    ).rejects.toThrow(
      'Validation failed. EmployeeId: Employee not found. ExternalId: Rejected [redacted]'
    );
  });

  it('warns about uncertain writes after transport failure', async () => {
    send.mockRejectedValue(new Error('Network disconnected test-key'));
    await expect(
      createTimesheet.run(context({ ...props, preventDuplicates: true }))
    ).rejects.toThrow('it may have succeeded');
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('reports incomplete bulk responses with IDs for reconciliation', async () => {
    send.mockResolvedValue(response({ timesheets: { '7': [{ id: 42 }] } }));
    await expect(
      bulkCreateTimesheets.run(
        context({
          businessId: 3,
          approved: false,
          batch: { entries: [hours, { ...hours, externalId: 'second' }] },
        })
      )
    ).rejects.toThrow('1 records for 2 submitted lines');
    expect(send).toHaveBeenCalledTimes(1);
  });

  it.each([400, 429, 503])(
    'does not retry failed writes with status %s',
    async (status) => {
      send.mockRejectedValue(
        new HttpError(
          { private: 'do not expose' },
          { status, responseBody: { detail: 'Rejected test-key' } }
        )
      );
      const result = createTimesheet.run(
        context({ ...props, preventDuplicates: true })
      );
      await expect(result).rejects.toThrow(`(${status})`);
      await expect(result).rejects.not.toThrow('test-key');
      await expect(result).rejects.not.toThrow('do not expose');
      expect(send).toHaveBeenCalledTimes(1);
    }
  );
});

describe('piece registration and custom requests', () => {
  it('registers all 11 actions with classifications', () => {
    const actions = Object.values(employmentHeroPayroll.actions());
    expect(actions).toHaveLength(11);
    expect(
      actions.every((action) => action.audience && action.classification)
    ).toBe(true);
  });

  it.each([
    'https://example.com/steal',
    '//example.com/steal',
    'https://api.yourpayroll.com.au.evil.test/api/v2/user',
    'https://api.yourpayroll.com.au/api/v1/user',
  ])('blocks credential forwarding to %s', async (url) => {
    const custom = employmentHeroPayroll.actions()['custom_api_call'];
    if (!custom) throw new Error('Missing custom action');
    await expect(
      custom.run(
        context({
          method: HttpMethod.GET,
          url: { url },
          followRedirects: false,
        })
      )
    ).rejects.toThrow('Australia Payroll');
    expect(send).not.toHaveBeenCalled();
  });

  it('makes an authenticated custom call to the vendor', async () => {
    send.mockResolvedValue(response({ id: 1 }));
    const custom = employmentHeroPayroll.actions()['custom_api_call'];
    if (!custom) throw new Error('Missing custom action');
    await custom.run(
      context({
        method: HttpMethod.GET,
        url: { url: '/user' },
        followRedirects: false,
      })
    );
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        url: `${base}/user`,
        headers: { Authorization: 'Basic dGVzdC1rZXk6' },
        followRedirects: false,
      })
    );
  });

  it('blocks redirect following for custom requests', async () => {
    const custom = employmentHeroPayroll.actions()['custom_api_call'];
    if (!custom) throw new Error('Missing custom action');
    await expect(
      custom.run(
        context({
          method: HttpMethod.GET,
          url: { url: '/user' },
          followRedirects: true,
        })
      )
    ).rejects.toThrow('redirects disabled');
    expect(send).not.toHaveBeenCalled();
  });
});
