# Enrich Layer Piece for Activepieces

The Enrich Layer piece provides professional network data enrichment capabilities within Activepieces workflows. Enrich company profiles, look up person data, find work emails, search employees, and more.

## Authentication

This piece requires an Enrich Layer API key. You can obtain one by signing up at [https://enrichlayer.com](https://enrichlayer.com).

The API key is passed as a Bearer token in the `Authorization` header for all requests.

## Actions (25)

### Company

| Action | Description | Credits |
|--------|-------------|---------|
| Get Company Profile | Get structured data of a company from a professional network URL | 1 |
| Look Up Company | Resolve a company profile from name, domain, or location | 2 |
| Look Up Company by Numeric ID | Resolve vanity ID from numeric company ID | 0 |
| Get Company Profile Picture | Get the profile picture URL of a company | 0 |
| Search Companies | Search for companies matching criteria across an exhaustive dataset | 3/result |

### People

| Action | Description | Credits |
|--------|-------------|---------|
| Get Person Profile | Get structured data of a person from a professional network URL | 1 |
| Look Up Person | Look up a person by name and company information | 2 |
| Look Up Role at Company | Find the person matching a specific role at a company | 3 |
| Get Person Profile Picture | Get the profile picture URL of a person | 0 |
| Search People | Search for people matching criteria across an exhaustive dataset | 3/result |

### Employees and Students

| Action | Description | Credits |
|--------|-------------|---------|
| List Company Employees | Get a list of employees at a company | 3/employee |
| Get Employee Count | Get total employee count for a company | 1 |
| Search Company Employees | Search employees by job title | 10 base + 3/match |
| List School Students | Get a list of students at a school | 3/student |

### Contact Information

| Action | Description | Credits |
|--------|-------------|---------|
| Look Up Work Email | Get the work email for a profile (95%+ deliverability) | 3 |
| Reverse Email Lookup | Find social profiles from an email address | 3 |
| Reverse Phone Lookup | Find social profiles from a phone number | 3 |
| Look Up Personal Contact Numbers | Find personal phone numbers from a profile | 1/number |
| Look Up Personal Email | Find personal emails from a profile | 1/email |
| Check Disposable Email | Check if an email belongs to a disposable service | 0 |

### Jobs

| Action | Description | Credits |
|--------|-------------|---------|
| Get Job Profile | Get structured data of a job posting | 2 |
| Search Company Jobs | List jobs posted by a company | 2 |
| Get Job Count | Count jobs posted by a company | 2 |

### School

| Action | Description | Credits |
|--------|-------------|---------|
| Get School Profile | Get structured data of a school from a professional network URL | 1 |

### Account

| Action | Description | Credits |
|--------|-------------|---------|
| Get Credit Balance | View your API credit balance | 0 |

A **Custom API Call** action is also included for advanced use cases not covered by the built-in actions.

## Development

This piece is built with TypeScript and follows Activepieces piece conventions.

```bash
# Install dependencies (from the activepieces monorepo root)
npm install

# Build
npm run build
```
