import { OutputSchema } from '@activepieces/pieces-framework';

const contactFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'nr', label: 'Number' },
  { key: 'contact_type_id', label: 'Contact Type ID' },
  { key: 'name_1', label: 'Name 1' },
  { key: 'name_2', label: 'Name 2' },
  { key: 'salutation_id', label: 'Salutation ID' },
  { key: 'salutation_form', label: 'Salutation Form', format: 'number' },
  { key: 'title_id', label: 'Title ID' },
  { key: 'birthday', label: 'Birthday', format: 'date' },
  { key: 'address', label: 'Address' },
  { key: 'street_name', label: 'Street Name' },
  { key: 'house_number', label: 'House Number' },
  { key: 'address_addition', label: 'Address Addition' },
  { key: 'postcode', label: 'Postcode' },
  { key: 'city', label: 'City' },
  { key: 'country_id', label: 'Country ID' },
  { key: 'mail', label: 'Mail', format: 'email' },
  { key: 'mail_second', label: 'Mail Second', format: 'email' },
  { key: 'phone_fixed', label: 'Phone Fixed' },
  { key: 'phone_fixed_second', label: 'Phone Fixed Second' },
  { key: 'phone_mobile', label: 'Phone Mobile' },
  { key: 'fax', label: 'Fax' },
  { key: 'url', label: 'URL' },
  { key: 'skype_name', label: 'Skype Name' },
  { key: 'remarks', label: 'Remarks' },
  { key: 'language_id', label: 'Language ID' },
  { key: 'is_lead', label: 'Is Lead', format: 'boolean' },
  { key: 'contact_group_ids', label: 'Contact Group Ids' },
  { key: 'contact_branch_ids', label: 'Contact Branch Ids' },
  { key: 'user_id', label: 'User ID' },
  { key: 'owner_id', label: 'Owner ID' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'profile_image', label: 'Profile Image' },
];

const contactSummaryFields: OutputSchema['fields'] = contactFields.filter((field) => field.key !== 'profile_image');

const contactGroupFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'uuid', label: 'UUID' },
];

const contactRelationFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'contact_id', label: 'Contact ID' },
  { key: 'contact_sub_id', label: 'Contact Sub ID' },
  { key: 'description', label: 'Description' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const itemFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'user_id', label: 'User ID' },
  { key: 'article_type_id', label: 'Article Type ID' },
  { key: 'contact_id', label: 'Contact ID' },
  { key: 'deliverer_code', label: 'Deliverer Code' },
  { key: 'deliverer_name', label: 'Deliverer Name' },
  { key: 'deliverer_description', label: 'Deliverer Description' },
  { key: 'intern_code', label: 'Intern Code' },
  { key: 'intern_name', label: 'Intern Name' },
  { key: 'intern_description', label: 'Intern Description' },
  { key: 'purchase_price', label: 'Purchase Price' },
  { key: 'sale_price', label: 'Sale Price' },
  { key: 'purchase_total', label: 'Purchase Total', format: 'number' },
  { key: 'sale_total', label: 'Sale Total', format: 'number' },
  { key: 'currency_id', label: 'Currency ID' },
  { key: 'tax_income_id', label: 'Tax Income ID' },
  { key: 'tax_id', label: 'Tax ID' },
  { key: 'tax_expense_id', label: 'Tax Expense ID' },
  { key: 'unit_id', label: 'Unit ID' },
  { key: 'is_stock', label: 'Is Stock', format: 'boolean' },
  { key: 'stock_id', label: 'Stock ID' },
  { key: 'stock_place_id', label: 'Stock Place ID' },
  { key: 'stock_nr', label: 'Stock Number', format: 'number' },
  { key: 'stock_min_nr', label: 'Stock Min Number', format: 'number' },
  { key: 'stock_reserved_nr', label: 'Stock Reserved Number', format: 'number' },
  { key: 'stock_available_nr', label: 'Stock Available Number', format: 'number' },
  { key: 'stock_picked_nr', label: 'Stock Picked Number', format: 'number' },
  { key: 'stock_disposed_nr', label: 'Stock Disposed Number', format: 'number' },
  { key: 'stock_ordered_nr', label: 'Stock Ordered Number', format: 'number' },
  { key: 'width', label: 'Width', format: 'number' },
  { key: 'height', label: 'Height', format: 'number' },
  { key: 'weight', label: 'Weight', format: 'number' },
  { key: 'volume', label: 'Volume', format: 'number' },
  { key: 'html_text', label: 'Html Text' },
  { key: 'remarks', label: 'Remarks' },
  { key: 'delivery_price', label: 'Delivery Price', format: 'number' },
  { key: 'article_group_id', label: 'Article Group ID' },
  { key: 'account_id', label: 'Account ID' },
  { key: 'expense_account_id', label: 'Expense Account ID' },
];

const invoiceFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'document_nr', label: 'Document Number' },
  { key: 'title', label: 'Title' },
  { key: 'contact_id', label: 'Contact ID' },
  { key: 'contact_sub_id', label: 'Contact Sub ID' },
  { key: 'user_id', label: 'User ID' },
  { key: 'project_id', label: 'Project ID' },
  { key: 'logopaper_id', label: 'Logopaper ID' },
  { key: 'language_id', label: 'Language ID' },
  { key: 'bank_account_id', label: 'Bank Account ID' },
  { key: 'currency_id', label: 'Currency ID' },
  { key: 'payment_type_id', label: 'Payment Type ID' },
  { key: 'header', label: 'Header' },
  { key: 'footer', label: 'Footer' },
  { key: 'total_gross', label: 'Total Gross' },
  { key: 'total_net', label: 'Total Net' },
  { key: 'total_taxes', label: 'Total Taxes' },
  { key: 'total_received_payments', label: 'Total Received Payments' },
  { key: 'total_credit_vouchers', label: 'Total Credit Vouchers' },
  { key: 'total_remaining_payments', label: 'Total Remaining Payments' },
  { key: 'total', label: 'Total' },
  { key: 'total_rounding_difference', label: 'Total Rounding Difference', format: 'number' },
  { key: 'mwst_type', label: 'Mwst Type', format: 'number' },
  { key: 'mwst_is_net', label: 'Mwst Is Net', format: 'boolean' },
  { key: 'show_position_taxes', label: 'Show Position Taxes', format: 'boolean' },
  { key: 'is_valid_from', label: 'Is Valid From', format: 'date' },
  { key: 'is_valid_to', label: 'Is Valid To', format: 'date' },
  { key: 'contact_address', label: 'Contact Address' },
  { key: 'kb_item_status_id', label: 'Kb Item Status ID' },
  { key: 'reference', label: 'Reference' },
  { key: 'api_reference', label: 'Api Reference' },
  { key: 'viewed_by_client_at', label: 'Viewed By Client At' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'esr_id', label: 'Esr ID' },
  { key: 'qr_invoice_id', label: 'Qr Invoice ID' },
  { key: 'template_slug', label: 'Template Slug' },
  { key: 'taxs', label: 'Taxs', listItems: [{ key: 'percentage', label: 'Percentage' }, { key: 'value', label: 'Value' }] },
  { key: 'network_link', label: 'Network Link' },
  { key: 'positions', label: 'Positions', listItems: [{ key: 'id', label: 'ID' }, { key: 'amount', label: 'Amount' }, { key: 'amount_reserved', label: 'Amount Reserved' }, { key: 'amount_open', label: 'Amount Open' }, { key: 'amount_completed', label: 'Amount Completed' }, { key: 'unit_id', label: 'Unit ID' }, { key: 'account_id', label: 'Account ID' }, { key: 'unit_name', label: 'Unit Name' }, { key: 'tax_id', label: 'Tax ID' }, { key: 'tax_value', label: 'Tax Value' }, { key: 'text', label: 'Text' }, { key: 'unit_price', label: 'Unit Price' }, { key: 'discount_in_percent', label: 'Discount In Percent' }, { key: 'position_total', label: 'Position Total' }, { key: 'pos', label: 'Pos' }, { key: 'internal_pos', label: 'Internal Pos', format: 'number' }, { key: 'is_optional', label: 'Is Optional' }, { key: 'type', label: 'Type' }, { key: 'parent_id', label: 'Parent ID' }, { key: 'article_id', label: 'Article ID' }, { key: 'show_pos_nr', label: 'Show Pos Number', format: 'boolean' }] },
];

const invoiceSummaryFields: OutputSchema['fields'] = invoiceFields.filter((field) => field.key !== 'positions');

const paymentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'date', label: 'Date', format: 'date' },
  { key: 'value', label: 'Value' },
  { key: 'bank_account_id', label: 'Bank Account ID' },
  { key: 'title', label: 'Title', format: 'number' },
  { key: 'payment_service_id', label: 'Payment Service ID' },
  { key: 'is_client_account_redemption', label: 'Is Client Account Redemption', format: 'boolean' },
  { key: 'is_cash_discount', label: 'Is Cash Discount', format: 'boolean' },
  { key: 'kb_invoice_id', label: 'Kb Invoice ID' },
  { key: 'kb_credit_voucher_id', label: 'Kb Credit Voucher ID' },
  { key: 'kb_bill_id', label: 'Kb Bill ID' },
  { key: 'kb_credit_voucher_text', label: 'Kb Credit Voucher Text' },
];

const reminderFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'kb_invoice_id', label: 'Kb Invoice ID' },
  { key: 'title', label: 'Title' },
  { key: 'is_valid_from', label: 'Is Valid From', format: 'date' },
  { key: 'is_valid_to', label: 'Is Valid To', format: 'date' },
  { key: 'reminder_period_in_days', label: 'Reminder Period In Days', format: 'number' },
  { key: 'reminder_level', label: 'Reminder Level', format: 'number' },
  { key: 'show_positions', label: 'Show Positions', format: 'boolean' },
  { key: 'remaining_price', label: 'Remaining Price' },
  { key: 'received_total', label: 'Received Total' },
  { key: 'is_sent', label: 'Is Sent', format: 'boolean' },
  { key: 'header', label: 'Header' },
  { key: 'footer', label: 'Footer' },
];

const quoteFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'document_nr', label: 'Document Number' },
  { key: 'title', label: 'Title' },
  { key: 'contact_id', label: 'Contact ID' },
  { key: 'contact_sub_id', label: 'Contact Sub ID' },
  { key: 'user_id', label: 'User ID' },
  { key: 'project_id', label: 'Project ID' },
  { key: 'logopaper_id', label: 'Logopaper ID' },
  { key: 'language_id', label: 'Language ID' },
  { key: 'bank_account_id', label: 'Bank Account ID' },
  { key: 'currency_id', label: 'Currency ID' },
  { key: 'payment_type_id', label: 'Payment Type ID' },
  { key: 'header', label: 'Header' },
  { key: 'footer', label: 'Footer' },
  { key: 'total_gross', label: 'Total Gross' },
  { key: 'total_net', label: 'Total Net' },
  { key: 'total_taxes', label: 'Total Taxes' },
  { key: 'total', label: 'Total' },
  { key: 'total_rounding_difference', label: 'Total Rounding Difference', format: 'number' },
  { key: 'mwst_type', label: 'Mwst Type', format: 'number' },
  { key: 'mwst_is_net', label: 'Mwst Is Net', format: 'boolean' },
  { key: 'show_position_taxes', label: 'Show Position Taxes', format: 'boolean' },
  { key: 'is_valid_from', label: 'Is Valid From', format: 'date' },
  { key: 'is_valid_until', label: 'Is Valid Until', format: 'date' },
  { key: 'contact_address', label: 'Contact Address' },
  { key: 'delivery_address_type', label: 'Delivery Address Type', format: 'number' },
  { key: 'delivery_address', label: 'Delivery Address' },
  { key: 'kb_item_status_id', label: 'Kb Item Status ID' },
  { key: 'api_reference', label: 'Api Reference' },
  { key: 'viewed_by_client_at', label: 'Viewed By Client At' },
  { key: 'kb_terms_of_payment_template_id', label: 'Kb Terms Of Payment Template ID' },
  { key: 'show_total', label: 'Show Total', format: 'boolean' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'template_slug', label: 'Template Slug' },
  { key: 'taxs', label: 'Taxs', listItems: [{ key: 'percentage', label: 'Percentage' }, { key: 'value', label: 'Value' }] },
  { key: 'network_link', label: 'Network Link' },
  { key: 'positions', label: 'Positions', listItems: [{ key: 'id', label: 'ID' }, { key: 'amount', label: 'Amount' }, { key: 'amount_reserved', label: 'Amount Reserved' }, { key: 'amount_open', label: 'Amount Open' }, { key: 'amount_completed', label: 'Amount Completed' }, { key: 'unit_id', label: 'Unit ID' }, { key: 'account_id', label: 'Account ID' }, { key: 'unit_name', label: 'Unit Name' }, { key: 'tax_id', label: 'Tax ID' }, { key: 'tax_value', label: 'Tax Value' }, { key: 'text', label: 'Text' }, { key: 'unit_price', label: 'Unit Price' }, { key: 'discount_in_percent', label: 'Discount In Percent' }, { key: 'position_total', label: 'Position Total' }, { key: 'pos', label: 'Pos' }, { key: 'internal_pos', label: 'Internal Pos', format: 'number' }, { key: 'is_optional', label: 'Is Optional' }, { key: 'type', label: 'Type' }, { key: 'parent_id', label: 'Parent ID' }, { key: 'article_id', label: 'Article ID' }, { key: 'show_pos_nr', label: 'Show Pos Number', format: 'boolean' }] },
];

const quoteSummaryFields: OutputSchema['fields'] = quoteFields.filter((field) => field.key !== 'positions');

const orderFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'document_nr', label: 'Document Number' },
  { key: 'title', label: 'Title' },
  { key: 'contact_id', label: 'Contact ID' },
  { key: 'contact_sub_id', label: 'Contact Sub ID' },
  { key: 'user_id', label: 'User ID' },
  { key: 'project_id', label: 'Project ID' },
  { key: 'logopaper_id', label: 'Logopaper ID' },
  { key: 'language_id', label: 'Language ID' },
  { key: 'bank_account_id', label: 'Bank Account ID' },
  { key: 'currency_id', label: 'Currency ID' },
  { key: 'payment_type_id', label: 'Payment Type ID' },
  { key: 'header', label: 'Header' },
  { key: 'footer', label: 'Footer' },
  { key: 'total_gross', label: 'Total Gross' },
  { key: 'total_net', label: 'Total Net' },
  { key: 'total_taxes', label: 'Total Taxes' },
  { key: 'total', label: 'Total' },
  { key: 'total_rounding_difference', label: 'Total Rounding Difference', format: 'number' },
  { key: 'mwst_type', label: 'Mwst Type', format: 'number' },
  { key: 'mwst_is_net', label: 'Mwst Is Net', format: 'boolean' },
  { key: 'show_position_taxes', label: 'Show Position Taxes', format: 'boolean' },
  { key: 'is_valid_from', label: 'Is Valid From', format: 'date' },
  { key: 'contact_address', label: 'Contact Address' },
  { key: 'delivery_address_type', label: 'Delivery Address Type', format: 'number' },
  { key: 'delivery_address', label: 'Delivery Address' },
  { key: 'kb_item_status_id', label: 'Kb Item Status ID' },
  { key: 'is_recurring', label: 'Is Recurring', format: 'boolean' },
  { key: 'api_reference', label: 'Api Reference' },
  { key: 'viewed_by_client_at', label: 'Viewed By Client At' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'template_slug', label: 'Template Slug' },
  { key: 'taxs', label: 'Taxs', listItems: [{ key: 'percentage', label: 'Percentage' }, { key: 'value', label: 'Value' }] },
  { key: 'network_link', label: 'Network Link' },
  { key: 'positions', label: 'Positions', listItems: [{ key: 'id', label: 'ID' }, { key: 'amount', label: 'Amount' }, { key: 'amount_reserved', label: 'Amount Reserved' }, { key: 'amount_open', label: 'Amount Open' }, { key: 'amount_completed', label: 'Amount Completed' }, { key: 'unit_id', label: 'Unit ID' }, { key: 'account_id', label: 'Account ID' }, { key: 'unit_name', label: 'Unit Name' }, { key: 'tax_id', label: 'Tax ID' }, { key: 'tax_value', label: 'Tax Value' }, { key: 'text', label: 'Text' }, { key: 'unit_price', label: 'Unit Price' }, { key: 'discount_in_percent', label: 'Discount In Percent' }, { key: 'position_total', label: 'Position Total' }, { key: 'pos', label: 'Pos' }, { key: 'internal_pos', label: 'Internal Pos', format: 'number' }, { key: 'is_optional', label: 'Is Optional' }, { key: 'type', label: 'Type' }, { key: 'parent_id', label: 'Parent ID' }, { key: 'article_id', label: 'Article ID' }, { key: 'show_pos_nr', label: 'Show Pos Number', format: 'boolean' }] },
];

const orderSummaryFields: OutputSchema['fields'] = orderFields.filter((field) => field.key !== 'positions');

const projectFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'uuid', label: 'UUID' },
  { key: 'nr', label: 'Number' },
  { key: 'name', label: 'Name' },
  { key: 'start_date', label: 'Start Date', format: 'datetime' },
  { key: 'end_date', label: 'End Date', format: 'datetime' },
  { key: 'comment', label: 'Comment' },
  { key: 'pr_state_id', label: 'Pr State ID' },
  { key: 'pr_project_type_id', label: 'Pr Project Type ID' },
  { key: 'contact_id', label: 'Contact ID' },
  { key: 'contact_sub_id', label: 'Contact Sub ID' },
  { key: 'pr_invoice_type_id', label: 'Pr Invoice Type ID' },
  { key: 'pr_invoice_type_amount', label: 'Pr Invoice Type Amount' },
  { key: 'pr_budget_type_id', label: 'Pr Budget Type ID' },
  { key: 'pr_budget_type_amount', label: 'Pr Budget Type Amount' },
  { key: 'user_id', label: 'User ID' },
];

const milestoneFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'end_date', label: 'End Date', format: 'date' },
  { key: 'comment', label: 'Comment' },
  { key: 'parent_milestone_id', label: 'Parent Milestone ID' },
];

const workPackageFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'spent_time_in_hours', label: 'Spent Time In Hours', format: 'number' },
  { key: 'estimated_time_in_hours', label: 'Estimated Time In Hours', format: 'number' },
  { key: 'comment', label: 'Comment' },
  { key: 'milestone_id', label: 'Milestone ID' },
  { key: 'milestone', label: 'Milestone' },
];

const timesheetFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'user_id', label: 'User ID' },
  { key: 'status_id', label: 'Status ID' },
  { key: 'client_service_id', label: 'Client Service ID' },
  { key: 'text', label: 'Text' },
  { key: 'allowable_bill', label: 'Allowable Bill', format: 'boolean' },
  { key: 'charge', label: 'Charge' },
  { key: 'contact_id', label: 'Contact ID' },
  { key: 'sub_contact_id', label: 'Sub Contact ID' },
  { key: 'pr_project_id', label: 'Pr Project ID' },
  { key: 'pr_package_id', label: 'Pr Package ID' },
  { key: 'pr_milestone_id', label: 'Pr Milestone ID' },
  { key: 'travel_time', label: 'Travel Time' },
  { key: 'travel_charge', label: 'Travel Charge' },
  { key: 'travel_distance', label: 'Travel Distance', format: 'number' },
  { key: 'estimated_time', label: 'Estimated Time' },
  { key: 'date', label: 'Date', format: 'date' },
  { key: 'duration', label: 'Duration' },
  { key: 'running', label: 'Running', format: 'boolean' },
  { key: 'task_id', label: 'Task ID' },
  { key: 'tracking', label: 'Tracking', children: [{ key: 'type', label: 'Type' }, { key: 'date', label: 'Date', format: 'date' }, { key: 'duration', label: 'Duration' }, { key: 'start', label: 'Start', format: 'datetime' }, { key: 'end', label: 'End', format: 'datetime' }] },
];

const businessActivityFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'default_is_billable', label: 'Default Is Billable', format: 'boolean' },
  { key: 'default_price_per_hour', label: 'Default Price Per Hour', format: 'number' },
  { key: 'account_id', label: 'Account ID' },
];

const taskFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'user_id', label: 'User ID' },
  { key: 'finish_date', label: 'Finish Date', format: 'datetime' },
  { key: 'subject', label: 'Subject' },
  { key: 'place', label: 'Place', format: 'number' },
  { key: 'info', label: 'Info' },
  { key: 'contact_id', label: 'Contact ID' },
  { key: 'sub_contact_id', label: 'Sub Contact ID' },
  { key: 'project_id', label: 'Project ID' },
  { key: 'entry_id', label: 'Entry ID' },
  { key: 'module_id', label: 'Module ID' },
  { key: 'todo_status_id', label: 'Todo Status ID' },
  { key: 'todo_priority_id', label: 'Todo Priority ID' },
  { key: 'has_reminder', label: 'Has Reminder', format: 'boolean' },
  { key: 'remember_type_id', label: 'Remember Type ID' },
  { key: 'remember_time_id', label: 'Remember Time ID' },
  { key: 'communication_kind_id', label: 'Communication Kind ID' },
];

const accountFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'uuid', label: 'UUID' },
  { key: 'account_no', label: 'Account No' },
  { key: 'name', label: 'Name' },
  { key: 'account_type', label: 'Account Type', format: 'number' },
  { key: 'tax_id', label: 'Tax ID' },
  { key: 'fibu_account_group_id', label: 'Fibu Account Group ID' },
  { key: 'is_active', label: 'Is Active', format: 'boolean' },
  { key: 'is_locked', label: 'Is Locked', format: 'boolean' },
];

const taxFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'uuid', label: 'UUID' },
  { key: 'name', label: 'Name' },
  { key: 'code', label: 'Code' },
  { key: 'digit', label: 'Digit' },
  { key: 'type', label: 'Type' },
  { key: 'account_id', label: 'Account ID' },
  { key: 'tax_settlement_type', label: 'Tax Settlement Type' },
  { key: 'value', label: 'Value', format: 'number' },
  { key: 'net_tax_value', label: 'Net Tax Value' },
  { key: 'start_year', label: 'Start Year', format: 'number' },
  { key: 'end_year', label: 'End Year', format: 'number' },
  { key: 'is_active', label: 'Is Active', format: 'boolean' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'start_month', label: 'Start Month', format: 'number' },
  { key: 'end_month', label: 'End Month', format: 'number' },
];

const currencyFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'round_factor', label: 'Round Factor', format: 'number' },
];

const manualEntryFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'type', label: 'Type' },
  { key: 'date', label: 'Date', format: 'date' },
  { key: 'reference_nr', label: 'Reference Number' },
  { key: 'created_by_user_id', label: 'Created By User ID' },
  { key: 'edited_by_user_id', label: 'Edited By User ID' },
  { key: 'entries', label: 'Entries', listItems: [{ key: 'id', label: 'ID' }, { key: 'date', label: 'Date', format: 'date' }, { key: 'debit_account_id', label: 'Debit Account ID' }, { key: 'credit_account_id', label: 'Credit Account ID' }, { key: 'tax_id', label: 'Tax ID' }, { key: 'tax_account_id', label: 'Tax Account ID' }, { key: 'description', label: 'Description' }, { key: 'amount', label: 'Amount', format: 'number' }, { key: 'currency_id', label: 'Currency ID' }, { key: 'base_currency_id', label: 'Base Currency ID' }, { key: 'currency_factor', label: 'Currency Factor', format: 'number' }, { key: 'base_currency_amount', label: 'Base Currency Amount', format: 'number' }, { key: 'created_by_user_id', label: 'Created By User ID' }, { key: 'edited_by_user_id', label: 'Edited By User ID' }] },
  { key: 'is_locked', label: 'Is Locked', format: 'boolean' },
  { key: 'locked_info', label: 'Locked Info' },
  { key: 'booking_type', label: 'Booking Type' },
];

const businessYearFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'start', label: 'Start', format: 'date' },
  { key: 'end', label: 'End', format: 'date' },
  { key: 'status', label: 'Status' },
  { key: 'closed_at', label: 'Closed At', format: 'date' },
];

const vatPeriodFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'start', label: 'Start', format: 'date' },
  { key: 'end', label: 'End', format: 'date' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'closed_at', label: 'Closed At', format: 'date' },
];

const fileFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'uuid', label: 'UUID' },
  { key: 'name', label: 'Name' },
  { key: 'size_in_bytes', label: 'Size In Bytes', format: 'number' },
  { key: 'extension', label: 'Extension' },
  { key: 'mime_type', label: 'Mime Type' },
  { key: 'uploader_email', label: 'Uploader Email', format: 'email' },
  { key: 'user_id', label: 'User ID' },
  { key: 'is_archived', label: 'Is Archived', format: 'boolean' },
  { key: 'source_id', label: 'Source ID' },
  { key: 'source_type', label: 'Source Type' },
  { key: 'is_referenced', label: 'Is Referenced', format: 'boolean' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'processing_source', label: 'Processing Source' },
  { key: 'processing_status', label: 'Processing Status' },
];

const userFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'salutation_type', label: 'Salutation Type' },
  { key: 'firstname', label: 'Firstname' },
  { key: 'lastname', label: 'Lastname' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'is_superadmin', label: 'Is Superadmin', format: 'boolean' },
  { key: 'is_accountant', label: 'Is Accountant', format: 'boolean' },
];

const countryFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'name_short', label: 'Name Short' },
  { key: 'iso_3166_alpha2', label: 'ISO 3166 Alpha2' },
];

const languageFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'decimal_point', label: 'Decimal Point' },
  { key: 'thousands_separator', label: 'Thousands Separator' },
  { key: 'date_format_id', label: 'Date Format ID' },
  { key: 'date_format', label: 'Date Format' },
  { key: 'iso_639_1', label: 'ISO 639 1' },
];

const namedFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
];

const contactOutputSchema: OutputSchema = { fields: contactFields };
const contactListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'name_1', listItems: contactSummaryFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};
const contactArrayOutputSchema: OutputSchema = { itemLabel: '{name_1}', fields: [{ key: 'results', label: 'Results', value: '', listItems: contactSummaryFields }] };
const contactAllOutputSchema: OutputSchema = { fields: [{ key: 'items', label: 'Items', labelKey: 'name_1', listItems: contactSummaryFields }, { key: 'count', label: 'Count', format: 'number' }] };
const contactSummaryOutputSchema: OutputSchema = { fields: contactSummaryFields };
const contactGroupOutputSchema: OutputSchema = { fields: contactGroupFields };
const contactGroupListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'name', listItems: contactGroupFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};
const contactGroupArrayOutputSchema: OutputSchema = { itemLabel: '{name}', fields: [{ key: 'results', label: 'Results', value: '', listItems: contactGroupFields }] };
const contactGroupAllOutputSchema: OutputSchema = { fields: [{ key: 'items', label: 'Items', labelKey: 'name', listItems: contactGroupFields }, { key: 'count', label: 'Count', format: 'number' }] };
const contactRelationOutputSchema: OutputSchema = { fields: contactRelationFields };
const contactRelationListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'description', listItems: contactRelationFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};
const contactRelationArrayOutputSchema: OutputSchema = { itemLabel: '{description}', fields: [{ key: 'results', label: 'Results', value: '', listItems: contactRelationFields }] };
const contactRelationAllOutputSchema: OutputSchema = { fields: [{ key: 'items', label: 'Items', labelKey: 'description', listItems: contactRelationFields }, { key: 'count', label: 'Count', format: 'number' }] };
const itemOutputSchema: OutputSchema = { fields: itemFields };
const itemListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'intern_name', listItems: itemFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};
const itemArrayOutputSchema: OutputSchema = { itemLabel: '{intern_name}', fields: [{ key: 'results', label: 'Results', value: '', listItems: itemFields }] };
const itemAllOutputSchema: OutputSchema = { fields: [{ key: 'items', label: 'Items', labelKey: 'intern_name', listItems: itemFields }, { key: 'count', label: 'Count', format: 'number' }] };
const invoiceOutputSchema: OutputSchema = { fields: invoiceFields };
const invoiceListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'document_nr', listItems: invoiceSummaryFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};
const invoiceArrayOutputSchema: OutputSchema = { itemLabel: '{document_nr}', fields: [{ key: 'results', label: 'Results', value: '', listItems: invoiceSummaryFields }] };
const invoiceAllOutputSchema: OutputSchema = { fields: [{ key: 'items', label: 'Items', labelKey: 'document_nr', listItems: invoiceSummaryFields }, { key: 'count', label: 'Count', format: 'number' }] };
const invoiceSummaryOutputSchema: OutputSchema = { fields: invoiceSummaryFields };
const paymentOutputSchema: OutputSchema = { fields: paymentFields };
const paymentListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'date', listItems: paymentFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};
const paymentArrayOutputSchema: OutputSchema = { itemLabel: '{date}', fields: [{ key: 'results', label: 'Results', value: '', listItems: paymentFields }] };
const paymentAllOutputSchema: OutputSchema = { fields: [{ key: 'items', label: 'Items', labelKey: 'date', listItems: paymentFields }, { key: 'count', label: 'Count', format: 'number' }] };
const reminderOutputSchema: OutputSchema = { fields: reminderFields };
const reminderListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'title', listItems: reminderFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};
const reminderArrayOutputSchema: OutputSchema = { itemLabel: '{title}', fields: [{ key: 'results', label: 'Results', value: '', listItems: reminderFields }] };
const reminderAllOutputSchema: OutputSchema = { fields: [{ key: 'items', label: 'Items', labelKey: 'title', listItems: reminderFields }, { key: 'count', label: 'Count', format: 'number' }] };
const quoteOutputSchema: OutputSchema = { fields: quoteFields };
const quoteListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'document_nr', listItems: quoteSummaryFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};
const quoteArrayOutputSchema: OutputSchema = { itemLabel: '{document_nr}', fields: [{ key: 'results', label: 'Results', value: '', listItems: quoteSummaryFields }] };
const quoteAllOutputSchema: OutputSchema = { fields: [{ key: 'items', label: 'Items', labelKey: 'document_nr', listItems: quoteSummaryFields }, { key: 'count', label: 'Count', format: 'number' }] };
const quoteSummaryOutputSchema: OutputSchema = { fields: quoteSummaryFields };
const orderOutputSchema: OutputSchema = { fields: orderFields };
const orderListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'document_nr', listItems: orderSummaryFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};
const orderArrayOutputSchema: OutputSchema = { itemLabel: '{document_nr}', fields: [{ key: 'results', label: 'Results', value: '', listItems: orderSummaryFields }] };
const orderAllOutputSchema: OutputSchema = { fields: [{ key: 'items', label: 'Items', labelKey: 'document_nr', listItems: orderSummaryFields }, { key: 'count', label: 'Count', format: 'number' }] };
const orderSummaryOutputSchema: OutputSchema = { fields: orderSummaryFields };
const projectOutputSchema: OutputSchema = { fields: projectFields };
const projectListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'name', listItems: projectFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};
const projectArrayOutputSchema: OutputSchema = { itemLabel: '{name}', fields: [{ key: 'results', label: 'Results', value: '', listItems: projectFields }] };
const projectAllOutputSchema: OutputSchema = { fields: [{ key: 'items', label: 'Items', labelKey: 'name', listItems: projectFields }, { key: 'count', label: 'Count', format: 'number' }] };
const milestoneOutputSchema: OutputSchema = { fields: milestoneFields };
const milestoneListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'name', listItems: milestoneFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};
const milestoneArrayOutputSchema: OutputSchema = { itemLabel: '{name}', fields: [{ key: 'results', label: 'Results', value: '', listItems: milestoneFields }] };
const milestoneAllOutputSchema: OutputSchema = { fields: [{ key: 'items', label: 'Items', labelKey: 'name', listItems: milestoneFields }, { key: 'count', label: 'Count', format: 'number' }] };
const workPackageOutputSchema: OutputSchema = { fields: workPackageFields };
const workPackageListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'name', listItems: workPackageFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};
const workPackageArrayOutputSchema: OutputSchema = { itemLabel: '{name}', fields: [{ key: 'results', label: 'Results', value: '', listItems: workPackageFields }] };
const workPackageAllOutputSchema: OutputSchema = { fields: [{ key: 'items', label: 'Items', labelKey: 'name', listItems: workPackageFields }, { key: 'count', label: 'Count', format: 'number' }] };
const timesheetOutputSchema: OutputSchema = { fields: timesheetFields };
const timesheetListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'text', listItems: timesheetFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};
const timesheetArrayOutputSchema: OutputSchema = { itemLabel: '{text}', fields: [{ key: 'results', label: 'Results', value: '', listItems: timesheetFields }] };
const timesheetAllOutputSchema: OutputSchema = { fields: [{ key: 'items', label: 'Items', labelKey: 'text', listItems: timesheetFields }, { key: 'count', label: 'Count', format: 'number' }] };
const businessActivityOutputSchema: OutputSchema = { fields: businessActivityFields };
const businessActivityListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'name', listItems: businessActivityFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};
const businessActivityArrayOutputSchema: OutputSchema = { itemLabel: '{name}', fields: [{ key: 'results', label: 'Results', value: '', listItems: businessActivityFields }] };
const businessActivityAllOutputSchema: OutputSchema = { fields: [{ key: 'items', label: 'Items', labelKey: 'name', listItems: businessActivityFields }, { key: 'count', label: 'Count', format: 'number' }] };
const taskOutputSchema: OutputSchema = { fields: taskFields };
const taskListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'subject', listItems: taskFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};
const taskArrayOutputSchema: OutputSchema = { itemLabel: '{subject}', fields: [{ key: 'results', label: 'Results', value: '', listItems: taskFields }] };
const taskAllOutputSchema: OutputSchema = { fields: [{ key: 'items', label: 'Items', labelKey: 'subject', listItems: taskFields }, { key: 'count', label: 'Count', format: 'number' }] };
const accountOutputSchema: OutputSchema = { fields: accountFields };
const accountListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'name', listItems: accountFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};
const accountArrayOutputSchema: OutputSchema = { itemLabel: '{name}', fields: [{ key: 'results', label: 'Results', value: '', listItems: accountFields }] };
const accountAllOutputSchema: OutputSchema = { fields: [{ key: 'items', label: 'Items', labelKey: 'name', listItems: accountFields }, { key: 'count', label: 'Count', format: 'number' }] };
const taxOutputSchema: OutputSchema = { fields: taxFields };
const taxListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'name', listItems: taxFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};
const taxArrayOutputSchema: OutputSchema = { itemLabel: '{name}', fields: [{ key: 'results', label: 'Results', value: '', listItems: taxFields }] };
const taxAllOutputSchema: OutputSchema = { fields: [{ key: 'items', label: 'Items', labelKey: 'name', listItems: taxFields }, { key: 'count', label: 'Count', format: 'number' }] };
const currencyOutputSchema: OutputSchema = { fields: currencyFields };
const currencyListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'name', listItems: currencyFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};
const currencyArrayOutputSchema: OutputSchema = { itemLabel: '{name}', fields: [{ key: 'results', label: 'Results', value: '', listItems: currencyFields }] };
const currencyAllOutputSchema: OutputSchema = { fields: [{ key: 'items', label: 'Items', labelKey: 'name', listItems: currencyFields }, { key: 'count', label: 'Count', format: 'number' }] };
const manualEntryOutputSchema: OutputSchema = { fields: manualEntryFields };
const manualEntryListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'reference_nr', listItems: manualEntryFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};
const manualEntryArrayOutputSchema: OutputSchema = { itemLabel: '{reference_nr}', fields: [{ key: 'results', label: 'Results', value: '', listItems: manualEntryFields }] };
const manualEntryAllOutputSchema: OutputSchema = { fields: [{ key: 'items', label: 'Items', labelKey: 'reference_nr', listItems: manualEntryFields }, { key: 'count', label: 'Count', format: 'number' }] };
const businessYearOutputSchema: OutputSchema = { fields: businessYearFields };
const businessYearListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'start', listItems: businessYearFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};
const businessYearArrayOutputSchema: OutputSchema = { itemLabel: '{start}', fields: [{ key: 'results', label: 'Results', value: '', listItems: businessYearFields }] };
const businessYearAllOutputSchema: OutputSchema = { fields: [{ key: 'items', label: 'Items', labelKey: 'start', listItems: businessYearFields }, { key: 'count', label: 'Count', format: 'number' }] };
const vatPeriodOutputSchema: OutputSchema = { fields: vatPeriodFields };
const vatPeriodListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'start', listItems: vatPeriodFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};
const vatPeriodArrayOutputSchema: OutputSchema = { itemLabel: '{start}', fields: [{ key: 'results', label: 'Results', value: '', listItems: vatPeriodFields }] };
const vatPeriodAllOutputSchema: OutputSchema = { fields: [{ key: 'items', label: 'Items', labelKey: 'start', listItems: vatPeriodFields }, { key: 'count', label: 'Count', format: 'number' }] };
const fileOutputSchema: OutputSchema = { fields: fileFields };
const fileListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'name', listItems: fileFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};
const fileArrayOutputSchema: OutputSchema = { itemLabel: '{name}', fields: [{ key: 'results', label: 'Results', value: '', listItems: fileFields }] };
const fileAllOutputSchema: OutputSchema = { fields: [{ key: 'items', label: 'Items', labelKey: 'name', listItems: fileFields }, { key: 'count', label: 'Count', format: 'number' }] };
const userOutputSchema: OutputSchema = { fields: userFields };
const userListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'email', listItems: userFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};
const userArrayOutputSchema: OutputSchema = { itemLabel: '{email}', fields: [{ key: 'results', label: 'Results', value: '', listItems: userFields }] };
const userAllOutputSchema: OutputSchema = { fields: [{ key: 'items', label: 'Items', labelKey: 'email', listItems: userFields }, { key: 'count', label: 'Count', format: 'number' }] };
const countryOutputSchema: OutputSchema = { fields: countryFields };
const countryListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'name', listItems: countryFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};
const countryArrayOutputSchema: OutputSchema = { itemLabel: '{name}', fields: [{ key: 'results', label: 'Results', value: '', listItems: countryFields }] };
const countryAllOutputSchema: OutputSchema = { fields: [{ key: 'items', label: 'Items', labelKey: 'name', listItems: countryFields }, { key: 'count', label: 'Count', format: 'number' }] };
const languageOutputSchema: OutputSchema = { fields: languageFields };
const languageListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'name', listItems: languageFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};
const languageArrayOutputSchema: OutputSchema = { itemLabel: '{name}', fields: [{ key: 'results', label: 'Results', value: '', listItems: languageFields }] };
const languageAllOutputSchema: OutputSchema = { fields: [{ key: 'items', label: 'Items', labelKey: 'name', listItems: languageFields }, { key: 'count', label: 'Count', format: 'number' }] };
const namedOutputSchema: OutputSchema = { fields: namedFields };
const namedListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'name', listItems: namedFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};
const namedArrayOutputSchema: OutputSchema = { itemLabel: '{name}', fields: [{ key: 'results', label: 'Results', value: '', listItems: namedFields }] };
const namedAllOutputSchema: OutputSchema = { fields: [{ key: 'items', label: 'Items', labelKey: 'name', listItems: namedFields }, { key: 'count', label: 'Count', format: 'number' }] };
const successOutputSchema: OutputSchema = { fields: [{ key: 'success', label: 'Success', format: 'boolean' }] };
const pdfOutputSchema: OutputSchema = { fields: [
  { key: 'file', label: 'File', format: 'url' },
  { key: 'file_name', label: 'File Name' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'mime_type', label: 'MIME Type' },
] };
const legacyPdfOutputSchema: OutputSchema = { fields: [
  { key: 'file', label: 'File', format: 'url' },
  { key: 'fileName', label: 'File Name' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'mimeType', label: 'MIME Type' },
] };
const downloadOutputSchema: OutputSchema = { fields: [
  { key: 'file', label: 'File', format: 'url' },
  { key: 'file_name', label: 'File Name' },
  { key: 'size', label: 'Size', format: 'filesize' },
] };
const permissionsOutputSchema: OutputSchema = { fields: [
  { key: 'components', label: 'Activated Components' },
  { key: 'permissions', label: 'Permissions', dynamicKey: true },
] };

export const bexioOutputSchemas = {
  contactOutputSchema,
  contactListOutputSchema,
  contactArrayOutputSchema,
  contactAllOutputSchema,
  contactSummaryOutputSchema,
  contactGroupOutputSchema,
  contactGroupListOutputSchema,
  contactGroupArrayOutputSchema,
  contactGroupAllOutputSchema,
  contactRelationOutputSchema,
  contactRelationListOutputSchema,
  contactRelationArrayOutputSchema,
  contactRelationAllOutputSchema,
  itemOutputSchema,
  itemListOutputSchema,
  itemArrayOutputSchema,
  itemAllOutputSchema,
  invoiceOutputSchema,
  invoiceListOutputSchema,
  invoiceArrayOutputSchema,
  invoiceAllOutputSchema,
  invoiceSummaryOutputSchema,
  paymentOutputSchema,
  paymentListOutputSchema,
  paymentArrayOutputSchema,
  paymentAllOutputSchema,
  reminderOutputSchema,
  reminderListOutputSchema,
  reminderArrayOutputSchema,
  reminderAllOutputSchema,
  quoteOutputSchema,
  quoteListOutputSchema,
  quoteArrayOutputSchema,
  quoteAllOutputSchema,
  quoteSummaryOutputSchema,
  orderOutputSchema,
  orderListOutputSchema,
  orderArrayOutputSchema,
  orderAllOutputSchema,
  orderSummaryOutputSchema,
  projectOutputSchema,
  projectListOutputSchema,
  projectArrayOutputSchema,
  projectAllOutputSchema,
  milestoneOutputSchema,
  milestoneListOutputSchema,
  milestoneArrayOutputSchema,
  milestoneAllOutputSchema,
  workPackageOutputSchema,
  workPackageListOutputSchema,
  workPackageArrayOutputSchema,
  workPackageAllOutputSchema,
  timesheetOutputSchema,
  timesheetListOutputSchema,
  timesheetArrayOutputSchema,
  timesheetAllOutputSchema,
  businessActivityOutputSchema,
  businessActivityListOutputSchema,
  businessActivityArrayOutputSchema,
  businessActivityAllOutputSchema,
  taskOutputSchema,
  taskListOutputSchema,
  taskArrayOutputSchema,
  taskAllOutputSchema,
  accountOutputSchema,
  accountListOutputSchema,
  accountArrayOutputSchema,
  accountAllOutputSchema,
  taxOutputSchema,
  taxListOutputSchema,
  taxArrayOutputSchema,
  taxAllOutputSchema,
  currencyOutputSchema,
  currencyListOutputSchema,
  currencyArrayOutputSchema,
  currencyAllOutputSchema,
  manualEntryOutputSchema,
  manualEntryListOutputSchema,
  manualEntryArrayOutputSchema,
  manualEntryAllOutputSchema,
  businessYearOutputSchema,
  businessYearListOutputSchema,
  businessYearArrayOutputSchema,
  businessYearAllOutputSchema,
  vatPeriodOutputSchema,
  vatPeriodListOutputSchema,
  vatPeriodArrayOutputSchema,
  vatPeriodAllOutputSchema,
  fileOutputSchema,
  fileListOutputSchema,
  fileArrayOutputSchema,
  fileAllOutputSchema,
  userOutputSchema,
  userListOutputSchema,
  userArrayOutputSchema,
  userAllOutputSchema,
  countryOutputSchema,
  countryListOutputSchema,
  countryArrayOutputSchema,
  countryAllOutputSchema,
  languageOutputSchema,
  languageListOutputSchema,
  languageArrayOutputSchema,
  languageAllOutputSchema,
  namedOutputSchema,
  namedListOutputSchema,
  namedArrayOutputSchema,
  namedAllOutputSchema,
  successOutputSchema,
  pdfOutputSchema,
  legacyPdfOutputSchema,
  downloadOutputSchema,
  permissionsOutputSchema,
};
