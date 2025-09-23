Teamwork Piece

Integrate Teamwork with Activepieces to automate projects, tasks, comments, files, time entries, invoices and more.

Setup

- Environment variables (optional if provided in auth UI):
  - TEAMWORK_API_KEY
  - TEAMWORK_SUBDOMAIN (e.g. mycompany for mycompany.teamwork.com)

Authentication

Uses API Key (Basic Auth) against https://{subdomain}.teamwork.com.

Client

Centralized HTTP client with retries for 429/5xx and normalized output { success, id, url, data }.

Triggers (Polling)
- New Task
- New Person
- New Comment
- New Message
- New File
- New Expense
- New Invoice

Actions
- Create Project
- Create Task List
- Create Task
- Update Task
- Mark Task Complete
- Create Task Comment
- Create Company
- Create Person
- Upload File to Project
- Create Time Entry on Task
- Create Expense
- Create Message Reply
- Create Milestone
- Add People to Project

Search Actions
- Find Task
- Find Company

Notes
- Endpoints follow Teamwork Classic API.
- Dates use YYYYMMDD string where applicable.

# pieces-teamwork

This library was generated with [Nx](https://nx.dev).

## Building

Run `nx build pieces-teamwork` to build the library.
