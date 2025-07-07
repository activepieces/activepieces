# Wufoo Piece for Activepieces

## Overview
Wufoo is an online form builder that makes it easy to create forms, surveys, and invitations. This piece allows you to automate workflows with Wufoo, including collecting, managing, and responding to form submissions.

## Authentication
- **Type:** Basic Auth (API Key as username, any value as password)
- **Required fields:**
  - Subdomain (e.g., `fishbowl` for `https://fishbowl.wufoo.com`)
  - API Key (found in Wufoo account settings)

## Actions
| Name                        | Description                                                      |
|-----------------------------|------------------------------------------------------------------|
| Create Form Entry           | Submit a response to a Wufoo form                                |
| Find Form by Name or ID     | Locate a specific form by its name or hash                       |
| Get Entry Details           | Retrieve details of a specific entry (submission) by its ID      |
| Find Submission by Field    | Search for a submission by a field value (e.g., email, name)     |

## Triggers
| Name            | Description                                              |
|-----------------|---------------------------------------------------------|
| New Form Entry  | Fires when someone fills out a form                     |
| New Form        | Fires when a new form is created in the Wufoo account   |

## Usage
### Create Form Entry
- **Inputs:**
  - Form Identifier (hash or title)
  - Fields (object, use API IDs as keys)
- **API Endpoint:** `POST /api/v3/forms/{formIdentifier}/entries.json`

### Find Form by Name or ID
- **Inputs:**
  - Form Identifier (hash or title)
- **API Endpoint:** `GET /api/v3/forms.json` (filters by hash or title)

### Get Entry Details
- **Inputs:**
  - Form Identifier (hash or title)
  - Entry ID
- **API Endpoint:** `GET /api/v3/forms/{formIdentifier}/entries/{entryId}.json`

### Find Submission by Field Value
- **Inputs:**
  - Form Identifier (hash or title)
  - Field ID (API ID)
  - Value
- **API Endpoint:** `GET /api/v3/forms/{formIdentifier}/entries.json?Field{FieldId}={value}`

### Triggers
- **New Form Entry:** Polls for new entries on a form.
- **New Form:** Polls for new forms created in the account.

## References
- [Wufoo API Documentation](https://wufoo.github.io/docs/)

## Notes
- All API requests use HTTPS and require Basic Auth.
- API Key is used as the username, and any value (e.g., `footastic`) as the password.
- Form and field identifiers can be found in the Wufoo Form Manager under API Information.
- API rate limits apply based on your Wufoo plan.

## Authors
- sparkybug