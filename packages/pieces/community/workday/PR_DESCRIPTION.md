## What does this PR do?

Adds a new **Workday** piece that integrates with both the Workday REST/WQL API (for reads) and the Workday SOAP API (for writes). This piece enables users to automate HR, finance, and procurement workflows with Workday.

### Explain How the Feature Works

The piece uses a dual-authentication approach:
- **OAuth2** for read operations (WQL queries, polling triggers)
- **WS-Security (ISU credentials)** for write operations (SOAP API — create, update, approve)

**10 Triggers (polling-based):**
- New Hire Created
- Employee Terminated
- Business Process Event Completed
- Expense Report Submitted
- New Supplier
- New Supplier Invoice
- Updated Supplier
- Leave Request Submitted
- New Inbox Task
- Run WQL Query (custom query with date-based deduplication)

**15 Actions:**
- Find Records (WQL) — execute any Workday Query Language query
- Find Supplier / Find Supplier Invoice / Find Purchase Order / Find Supplier Payment
- Create Pre-Hire (SOAP)
- Hire Employee (SOAP)
- Create Job Requisition (SOAP)
- Change Job (SOAP)
- Create Time Off Request (SOAP)
- Create Worker Time Block (SOAP)
- Approve Task (SOAP)
- Update Supplier (SOAP)
- Update Supplier Invoice (SOAP)
- Create Supplier Credit Memo (SOAP)

### Relevant User Scenarios

- **HR Automation**: Automatically trigger onboarding workflows when a new hire is created in Workday (e.g., create accounts in Slack, Google Workspace, Jira)
- **Hiring Pipeline**: Create pre-hire records and job requisitions in Workday from applicant tracking systems
- **Finance & Procurement**: Monitor new supplier invoices and automatically route them for approval
- **Leave Management**: Sync time-off requests between Workday and project management tools
- **Custom Reporting**: Use the Run WQL Query trigger to poll for any Workday data changes using custom queries
- **Task Approval**: Automatically approve inbox tasks based on business rules from other systems

Fixes #
