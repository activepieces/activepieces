# Google Workspace

Manage Google Workspace users, groups, organizational units and devices, and react to Admin audit events, through the [Admin SDK](https://developers.google.com/workspace/admin) (Directory, Reports and Data Transfer APIs).

## Connection

Both methods use your own Google Cloud project, which must have the **Admin SDK API** enabled.

- **Google Account (OAuth2)**: sign in as a Workspace administrator with an OAuth client from your Google Cloud project. The administrator's role decides what the connection can do.
- **Service Account (Domain-Wide Delegation)**: provide the service account's `client_email` and `private_key`, plus the e-mail of the administrator it acts as. Authorize the service account's client ID in the Admin console (Security, API controls, Domain-wide delegation) with the scopes listed in the connection dialog. Flows then run without an administrator signing in.

## Actions

- **Add Record**, **Get Record**, **Update Record**, **Delete Record**, **Search Records**: work on users, groups, group members, organizational units, mobile devices, Chrome OS devices and role assignments (each type supports the operations the Directory API allows).
- **Suspend User**: suspend a user (blocks sign-in, keeps data) or lift the suspension.
- **Mobile Device Action**: approve, block or wipe a managed mobile device. Wipes are irreversible.
- **Transfer Data**: move a user's application data (Drive, Calendar, ...) to another user, for example when offboarding.
- **Custom API Call**: call any Admin SDK endpoint with the connection's credentials.

## Triggers

- **New Admin Activity Event**: an administrator action in the Admin console audit log.
- **New Application Activity Event**: an audit event of a chosen application (Login, Drive, Calendar, Groups, Mobile, ...).
- **New User Event**: a user is created, deleted, undeleted, suspended, unsuspended, has their admin status changed, or is otherwise updated.

Triggers use Reports API push notifications, so they fire in real time. Some audit logs (for example Login and Drive) reach Google with a delay of a few minutes.
