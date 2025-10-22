# CyberArk Piece

This piece provides integration with CyberArk PTA (Privileged Threat Analytics) for authentication and monitoring.

## Features

### PTA Authentication
- **Get Authentication Token**: Retrieve an authentication token from CyberArk PTA server for system health monitoring

## Authentication

The CyberArk piece uses custom authentication with the following required fields:

- **PTA Server URL**: The PTA server URL (e.g., `https://pta-server:8443`)
- **Username**: The username for authentication (typically `Administrator`)
- **Password**: The password for authentication

## API Reference

### PTA Get Authentication Token

**Endpoint**: `POST /api/getauthtoken/`

**Description**: This method enables a user to get a token upon Web application authentication. You can use this method to monitor the PTA system health.

**Request Format**: `application/x-www-form-urlencoded`

**Parameters**:
- `username`: The user name (required)
- `password`: The user password (required)

**Response**:
- `Token`: An authorized token string

## URL Guidelines

- Make sure there are no spaces in the URL
- The following characters are not supported in URL values: `+`, `&`, `%`
- If the URL includes a dot (.), add a forward slash (/) at the end of the URL

## Return Codes

The following table lists all the return codes that are returned from the REST APIs:

| Return Code | Code Number | Description |
|-------------|-------------|-------------|
| Success | 200 | The request succeeded. The actual response will depend on the request method used. |
| Created | 201 | The request was fulfilled and resulted in a new resource being created. |
| No Content | 204 | The server successfully processed the request and is not returning any content (no response body). This code is typically returned by DELETE requests. |
| Bad request | 400 | The request could not be understood by the server due to incorrect syntax. |
| Unauthorized | 401 | The request requires user authentication. |
| Forbidden | 403 | The server received and understood the request, but will not fulfill it. Authorization will not help and the request MUST NOT be repeated. |
| Not Found | 404 | The server did not find anything that matches the Request-URI. No indication is given of whether the condition is temporary or permanent. |
| Conflict | 409 | The request could not be completed due to a conflict with the current state of the resource. |
| Too Many Requests | 429 | The user has sent too many requests in a given amount of time ("rate limiting"). |
| Internal Server Error | 500 | The server encountered an unexpected condition which prevented it from fulfilling the request. |
| Not Implemented | 501 | The server does not support this operation due to version incompatibility. |

## Building

Run `nx build pieces-cyberark` to build the library.
