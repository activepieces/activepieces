# CyberArk Piece

CyberArk integration for Activepieces - Identity security platform for protecting critical assets in modern enterprises.

## Features

- User management (Create, Update, Delete, Enable, Disable, Activate)
- Group management (Add/Remove members)
- User search and filtering
- Custom API calls support

## Authentication

This piece uses CyberArk PAM authentication with the following credentials:

- **Base URL**: Your CyberArk PVWA base URL (e.g., https://pvwa.company.com)
- **Username**: CyberArk username
- **Password**: CyberArk password
- **Authentication Type**: CyberArk, LDAP, or RADIUS

## Actions

### Create User
Creates a new user in CyberArk with configurable properties including username, user type, email, and password settings.

### Update User
Updates an existing user's properties such as email, name, expiry date, and disabled status.

### Delete User
Permanently deletes a user from CyberArk.

### Activate User
Activates a suspended user account.

### Enable User
Enables a disabled user account.

### Disable User
Disables a user account.

### Find User
Searches for users based on filter criteria (username, user type, or component user).

### Add Member to Group
Adds a user or group as a member to a CyberArk group.

### Remove User From Group
Removes a user from a CyberArk group.

### Custom API Call
Make custom API calls to any CyberArk REST API endpoint.

## API Reference

Based on CyberArk PAM Self-Hosted REST API:
https://docs.cyberark.com/pam-self-hosted/latest/en/content/webservices/

## Building

Run `nx build pieces-cyberark` to build the library.
