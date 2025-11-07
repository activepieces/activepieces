## What does this PR do?

This PR extends the Housecall Pro integration piece with comprehensive invoice, lead, estimate, job, and appointment management actions. These additions enable complete automation of the sales pipeline from lead capture to job execution and invoicing.

### Key Features Added:
- **Invoice Management**: Retrieve all invoices associated with a specific job with detailed financial information
- **Lead Management**: Create leads, retrieve with advanced filtering, get individual details, and convert leads to estimates or jobs
- **Lead Filtering**: Support for filtering by customer, employee, lead source, location, status, and tags with pagination
- **Estimate Management**: Create, retrieve estimates with filtering and pagination support
- **Estimate Options**: Update schedules, create links, add notes, and upload attachments for estimate options
- **Job Management**: Comprehensive job actions including appointments, line items, notes, tags, attachments, and employee dispatch
- **Job Appointments**: Create, update, retrieve, and delete job appointments for scheduling
- **Job Fields**: Support for custom job fields in estimate and job creation

### Explain How the Feature Works

The comprehensive set of actions provides full workflow automation:

1. **Invoice Actions**:
   - `Get Job Invoices`: Retrieve all invoices for a specific job, including invoice number, status, amounts, items, taxes, discounts, and payments

2. **Lead Actions**:
   - `Create Lead`: Create leads with customer info, contact details, addresses, and assigned employees
   - `Get Leads`: Retrieve filtered leads with pagination and sorting (by customer, employee, lead source, location, status, tags)
   - `Get Lead`: Retrieve single lead details by ID
   - `Convert Lead to Estimate or Job`: Convert leads into estimates or jobs for pipeline progression

3. **Estimate Actions**:
   - `Create Estimate`: Create estimates with customer info, scheduling, and custom job fields
   - `Get Estimates`: Retrieve estimates with filtering and pagination
   - `Get Estimate`: Retrieve single estimate details
   - `Update Estimate Option Schedule`: Update estimate option scheduling
   - `Create Estimate Option Link`: Add links to estimate options
   - `Create/Delete Estimate Option Note`: Manage estimate notes
   - `Create Estimate Option Attachment`: Upload attachments to estimates

4. **Job Actions**:
   - `Create Job`: Create jobs with scheduling, line items, and custom job fields
   - `Get Jobs`: Retrieve jobs with filtering and pagination
   - `Get Job`: Retrieve single job details
   - `Job Appointments`: Create, update, delete, and retrieve job appointments
   - `Job Line Items`: Add, update, delete, bulk update, and retrieve line items
   - `Job Notes`: Add and delete job notes
   - `Job Tags`: Add and remove tags
   - `Job Attachments`: Upload attachments
   - `Job Locking`: Lock/unlock jobs
   - `Employee Dispatch`: Dispatch jobs to employees
   - `Job Input Materials`: Get and bulk update materials

All actions are production-ready with proper error handling, TypeScript types, and follow Activepieces best practices.

### Relevant User Scenarios

**Use Case 1: Complete Automated Lead-to-Job Pipeline**
- Create leads from web forms, retrieve and filter them, convert qualified leads to estimates, and automatically create jobs with scheduling and employee dispatch

**Use Case 2: Dynamic Job Scheduling and Appointment Management**
- Create jobs with custom fields, automatically schedule appointments based on customer availability, and dispatch to the nearest available employee

**Use Case 3: Estimate Customization and Tracking**
- Create detailed estimates with custom pricing fields, add notes and attachments, track estimate option changes, and convert to jobs when approved

**Use Case 4: Job Execution Automation**
- Add line items and materials to jobs, manage appointments, dispatch to field teams, lock jobs when complete, and retrieve invoices for billing

**Use Case 5: Invoice Retrieval and Accounting Integration**
- Automatically retrieve invoices for completed jobs and sync with accounting software (QuickBooks, Xero) for billing and financial reconciliation

**Use Case 6: Bulk Operations for Multiple Jobs**
- Update line items and materials across multiple jobs in bulk, dispatch multiple jobs to teams, and manage tags for job categorization

**Use Case 7: Lead Management and Follow-up**
- Retrieve leads by employee, status, or location, filter for follow-up, and track conversions from lead to estimate to job

These scenarios enable home service businesses (plumbers, electricians, HVAC contractors, etc.) to fully automate their operations from lead capture through job execution and invoicing.

Fixes # (issue)


