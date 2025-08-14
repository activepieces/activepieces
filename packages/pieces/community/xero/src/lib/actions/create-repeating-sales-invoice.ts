import { Property, createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';

export const xeroCreateRepeatingSalesInvoice = createAction({
  auth: xeroAuth,
  name: 'xero_create_repeating_sales_invoice',
  displayName: 'Create Repeating Sales Invoice',
  description: 'Creates a repeating sales invoice (Accounts Receivable).',
  props: {
    tenant_id: props.tenant_id,
    contact_id: props.contact_dropdown(true),
    schedule_period: Property.Number({
      displayName: 'Schedule Period',
      description: 'Integer period (e.g., 1 every week, 2 every month).',
      required: true,
    }),
    schedule_unit: Property.StaticDropdown({
      displayName: 'Schedule Unit',
      required: true,
      options: { options: [
        { label: 'Weekly', value: 'WEEKLY' },
        { label: 'Monthly', value: 'MONTHLY' },
      ]},
    }),
    due_date: Property.Number({
      displayName: 'Due Date (number)',
      description: 'Day number used with due date type (e.g., 20, 31).',
      required: true,
    }),
    due_date_type: Property.Dropdown({
      displayName: 'Due Date Type',
      required: true,
      refreshers: ['schedule_unit'],
      options: async ({ propsValue, schedule_unit }) => {
        const unitRaw = schedule_unit ?? (propsValue as Record<string, any>)?.['schedule_unit'];
        const unit = typeof unitRaw === 'string' ? unitRaw : unitRaw?.value;
        const all = [
          { label: 'Of Current Month', value: 'OFCURRENTMONTH' },
          { label: 'Of Following Month', value: 'OFFOLLOWINGMONTH' },
          { label: 'Days After Bill Date', value: 'DAYSAFTERBILLDATE' },
          { label: 'Days After Bill Month', value: 'DAYSAFTERBILLMONTH' },
        ];
        let options = all;
        if (unit === 'WEEKLY') {
          options = all.filter((o) => o.value === 'DAYSAFTERBILLDATE' || o.value === 'OFFOLLOWINGMONTH');
        } else if (unit === 'MONTHLY') {
          options = all.filter((o) => o.value === 'OFCURRENTMONTH' || o.value === 'OFFOLLOWINGMONTH');
        }
        return { disabled: false, options };
      },
    }),
    start_date: Property.ShortText({
      displayName: 'Start Date (YYYY-MM-DD)',
      required: true,
    }),
    end_date: Property.ShortText({
      displayName: 'End Date (YYYY-MM-DD)',
      required: false,
    }),
    line_amount_types: Property.StaticDropdown({
      displayName: 'Line Amount Types',
      required: true,
      options: {
        options: [
          { label: 'Exclusive', value: 'Exclusive' },
          { label: 'Inclusive', value: 'Inclusive' },
          { label: 'NoTax', value: 'NoTax' },
        ],
      },
      defaultValue: 'Exclusive',
    }),
    currency_code: props.currency_code(true),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: true,
      options: { options: [
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Authorised', value: 'AUTHORISED' },
      ]},
      defaultValue: 'DRAFT',
    }),
    reference: Property.ShortText({ displayName: 'Reference', required: false }),
    branding_theme_id: props.branding_theme_id(false),
    approved_for_sending: Property.Checkbox({ displayName: 'Approved For Sending', required: false, defaultValue: false }),
    send_copy: Property.Checkbox({ displayName: 'Send Copy', required: false, defaultValue: false }),
    mark_as_sent: Property.Checkbox({ displayName: 'Mark As Sent', required: false, defaultValue: false }),
    include_pdf: Property.Checkbox({ displayName: 'Include PDF', required: false, defaultValue: false }),
    line_items: Property.Array({
      displayName: 'Line Items',
      required: true,
      properties: {
        Description: Property.ShortText({ displayName: 'Description', required: true }),
        Quantity: Property.Number({ displayName: 'Quantity', required: false }),
        UnitAmount: Property.Number({ displayName: 'Unit Amount', required: false }),
        AccountCode: Property.ShortText({ displayName: 'Account Code', required: false }),
        ItemCode: Property.ShortText({ displayName: 'Item Code', required: false }),
        TaxType: Property.ShortText({ displayName: 'Tax Type', required: false }),
        DiscountRate: Property.Number({ displayName: 'Discount %', required: false }),
      },
    }),
  },
  async run(context) {
    const {
      tenant_id,
      contact_id,
      schedule_period,
      schedule_unit,
      due_date,
      due_date_type,
      start_date,
      end_date,
      line_amount_types,
      currency_code,
      status,
      reference,
      branding_theme_id,
      approved_for_sending,
      send_copy,
      mark_as_sent,
      include_pdf,
      line_items,
    } = context.propsValue as any;

    const url = 'https://api.xero.com/api.xro/2.0/RepeatingInvoices';

    if (
      schedule_unit === 'WEEKLY' &&
      !['DAYSAFTERBILLDATE', 'OFFOLLOWINGMONTH'].includes(due_date_type)
    ) {
      throw new Error(
        'For weekly schedules, Due Date Type must be DAYSAFTERBILLDATE or OFFOLLOWINGMONTH.'
      );
    }
    if (
      schedule_unit === 'MONTHLY' &&
      !['OFCURRENTMONTH', 'OFFOLLOWINGMONTH'].includes(due_date_type)
    ) {
      throw new Error(
        'For monthly schedules, Due Date Type must be OFCURRENTMONTH or OFFOLLOWINGMONTH.'
      );
    }

    const payload = {
      RepeatingInvoices: [
        {
          Type: 'ACCREC',
          Contact: { ContactID: contact_id },
          Schedule: {
            Period: schedule_period,
            Unit: schedule_unit,
            DueDate: due_date,
            DueDateType: due_date_type,
            StartDate: start_date,
            ...(end_date ? { EndDate: end_date } : {}),
          },
          LineItems: line_items,
          LineAmountTypes: line_amount_types,
          CurrencyCode: currency_code,
          Status: status,
          ...(reference ? { Reference: reference } : {}),
          ...(branding_theme_id ? { BrandingThemeID: branding_theme_id } : {}),
          ...(approved_for_sending ? { ApprovedForSending: true } : {}),
          ...(send_copy ? { SendCopy: true } : {}),
          ...(mark_as_sent ? { MarkAsSent: true } : {}),
          ...(include_pdf ? { IncludePDF: true } : {}),
        },
      ],
    };

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url,
      body: payload,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: (context.auth as any).access_token,
      },
      headers: { 'Xero-Tenant-Id': tenant_id },
    };

    const result = await httpClient.sendRequest(request);
    if (result.status === 200) {
      return result.body;
    }
    return result;
  },
});


