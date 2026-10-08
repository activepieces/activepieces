# Employment Hero Payroll

A community piece for Employment Hero Payroll Australia (formerly KeyPay). Any user with an eligible Payroll account and API access can connect it. It has no dependency on Assignar or any other source system.

This version supports the Australian Payroll API. Employment Hero HR and other Payroll regions use different APIs and are outside this version's scope. Requires Activepieces 0.92.0 or later.

## Connect

1. Sign in to Employment Hero Payroll, select your name, and open **My Account**.
2. Generate an API key and save it as an **Employment Hero Payroll** connection.
3. Select a business in the action. The key inherits its owner's access; use an account with only the business permissions the flow needs.

The connection validates the key with `GET /user`. Requests use HTTPS Basic authentication with the key as username and an empty password. The base URL is `https://api.yourpayroll.com.au/api/v2`.

## Actions

| Action | Result |
| --- | --- |
| List Businesses | One page of accessible businesses |
| List Employees | One page of employee details in a business |
| Get Employee | One employee's unstructured Payroll record |
| List Pay Categories | One page of pay categories |
| List Work Types | One page of work types |
| List Locations | One page of locations |
| List Timesheets | One page, optionally filtered by employee and dates |
| Create Timesheet | One new hours or quantity entry |
| Update Timesheet | An updated existing entry |
| Bulk Create Timesheets | Up to 100 entries appended in one request |
| Custom API Call | An authenticated request to the Australian Payroll API |

There are no triggers in this version. Use a Schedule trigger followed by a list action for regular reads.

## Selecting and mapping records

Business, employee, location, pay category, work type and timesheet fields provide named dropdowns. Switch a field to a dynamic value to map the numeric Payroll ID from an earlier step. Dropdowns fetch successive pages, with a 10,000-record bound; use search or a filtered list action for larger datasets. Bulk form choices load when the business changes.

List actions return **one page**, with Page Size from 1 to 100 and Offset starting at 0. Increase Offset by Page Size until a short or empty page is returned. OData filters use case-sensitive PascalCase property names, such as `Id eq 123` or `IsActive eq true`; available properties depend on the endpoint. Dates in List Timesheets filter the shift's start time: Date From is inclusive and Date Until is exclusive.

Outputs from the dedicated actions are flat records or arrays of records. Nested object keys use underscores, array values are JSON strings, and missing fields in a list are filled with `null`. Custom API Call retains the standard HTTP response output.

## Timesheets

- **Start and end times:** provide local business times as `YYYY-MM-DDTHH:mm:ss`, for example `2026-10-08T09:00:00`. Do not include `Z`, an offset, or fractional seconds. No automatic timezone conversion occurs. Overnight shifts can end on the following date. Breaks must be positive, within the shift, and non-overlapping.
- **Quantity:** provide a local `YYYY-MM-DD` date and positive quantity. The request uses midnight start/end times. Choose the pay category or work type appropriate to the allowance or units being imported.
- **Rate Override:** leave blank to use Payroll configuration. Zero is an explicit rate override.
- **Update Timesheet:** provide the employee and complete replacement time/quantity. Blank optional fields preserve existing values; breaks are replaced, including removal when no breaks are supplied. Switching to hours clears the old quantity. Avoid concurrent edits to the same timesheet. Clearing other optional fields requires Custom API Call.

Create Timesheet enables **Prevent Duplicate External IDs** by default and requires a stable External ID, such as `time-tracker:entry-456`. The vendor checks this ID; a duplicate can be rejected rather than returned. Reuse the ID for the same source entry. This is not an upsert.

Bulk Create Timesheets always appends and never requests replacement of existing timesheets. Approval defaults to off. Its endpoint does not document the single-entry duplicate guard: repeating a batch can create duplicates, even with External IDs. The piece rejects repeated External IDs for the same employee within one batch and reports incomplete response counts with returned record IDs. For routine synchronisation, prefer Create Timesheet in a loop. Reconcile an uncertain or partial bulk result before resubmitting.

Create and bulk create disable automatic flow retries and HTTP write retries. A timeout or connection failure can occur after Payroll has accepted data. Check Payroll before retrying. The custom action is an advanced HTTP action: its write behaviour and retry settings need to be selected for the endpoint being used. It only permits URLs under the Australian `/api/v2` endpoint and rejects redirect following to keep the connection key on that host.

## Example flows

**Import approved hours:** Schedule or spreadsheet trigger → look up the employee → loop over source entries → Create Timesheet. Map employee ID, start/end, work type and a stable source entry ID. Select the Payroll business once in the action.

**Export employees:** Schedule → List Employees → loop over the returned page → upsert rows in a destination app. Continue paging for businesses with more employees than Page Size.

## Development and verification

From the Activepieces repository root:

```sh
bun install
bunx turbo run build lint --filter=@activepieces/piece-employment-hero-payroll
cd packages/pieces/community/employment-hero-payroll
bun run test
bun run test:types
```

The automated tests execute actions with the real framework context and mocked vendor HTTP responses. They cover auth, endpoint routing, pagination, dropdowns, output shaping, date and break validation, duplicate guards, preservation on update, bulk grouping and failures, and credential destination checks.

Live Payroll account testing remains required before production use. With a development business, verify connection and dropdowns, page through employees, create an unapproved hours entry and a quantity entry, confirm the business timezone and paid/unpaid breaks in Payroll, replay an External ID, update the entry, and submit a small unapproved bulk batch. Check validation/permission errors with the account's actual access. Do not use production employee data for these checks.

## API references

- [Australian API documentation](https://api.keypay.com.au/australia/)
- [Australian OpenAPI specification](https://api.keypay.com.au/swagger-au.json)
- [OData filtering guide](https://api.keypay.com.au/australia/guides/ODataFiltering.html)

The included logo is derived from the [official Employment Hero developer site's favicon](https://developer.employmenthero.com/favicon.ico).
