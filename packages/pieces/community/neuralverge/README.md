# NeuralVerge

[NeuralVerge](https://neuralverge.ai) is a company and person business-intelligence API: reverse email and phone lookup, email finder and verification, company funding data, LinkedIn and Amazon data, web search, AI extraction and AI research.

## Authentication

The piece uses a NeuralVerge API key, sent in the `x-api-key` header.

1. Sign in at https://app.neuralverge.ai.
2. Open **Settings → API** and copy a key.
3. Paste it into the NeuralVerge connection in Activepieces.

Saving the connection runs one email verification call (1 point). Pricing: 1 point = $0.001; every response carries `total_points`, the points actually charged.

## Actions

### Contact enrichment

| Action | What it does | Cost |
|---|---|---|
| Find Person by Email | Reverse email lookup: name, phones, location, company, position and social profiles. | 10 points |
| Verify Email | Check whether an email address is deliverable (valid, risky or invalid). | 1 point |
| Find Email by Name | Find and verify a work email from first name, last name and company domain. | 10 points |
| Find Person by Phone | Reverse phone lookup (global): name, emails, location, company and social profiles. | 10 points |
| Find Person by US Phone | US reverse phone lookup with carrier, line type and validity signals. | 100 points |

### Company data

| Action | What it does | Cost |
|---|---|---|
| Get Company Funding | Get funding rounds, investors and firmographics from a Crunchbase organization URL. | 15 points |

### LinkedIn data

| Action | What it does | Cost |
|---|---|---|
| Get LinkedIn Profile with Email | Get LinkedIn profile details plus a work email when available. | 10 points |
| Find LinkedIn Profile by Name and Company | Find a LinkedIn profile URL from a full name and a company name or domain. | 10 points |
| Search LinkedIn Companies | Search LinkedIn companies by keyword, size, industry and location. | 5 points per company |
| Search LinkedIn People | Search LinkedIn people by keyword, company, title, seniority, function and location. | 100 points per 25 results |
| List Company Employees | List employees of one or more LinkedIn companies, with optional filters. | 30 points per run + 5 points per profile |

### E-commerce (Amazon)

| Action | What it does | Cost |
|---|---|---|
| Search Amazon Products | Search Amazon products by keyword on any supported marketplace. | 1 point per product |
| Get Amazon Product | Get Amazon product details by ASIN: title, brand, price, rating, images, features and specs. | 5 points |
| Get Amazon Buy Box Offer | Get the current Buy Box offer and its seller for an ASIN. | 5 points per offer |
| Get Amazon Seller | Get an Amazon seller profile: name, rating, rating count, feedback and business details. | 5 points |
| List Amazon Seller Products | List the storefront products of an Amazon seller. | 1 point per product |

### AI research and extraction

| Action | What it does | Cost |
|---|---|---|
| Run AI Research | Run a multi-step AI web research task and return the report. | 20-400 points depending on depth |
| Get Research Status | Get the status and result of an AI research task by session ID. | free |
| Search the Web | Search the web and get ranked results with title, URL and snippet. | 5 points |
| Extract Data from URL | Load any web page and extract structured data from it with AI. | 5 points |

**Run AI Research** starts an asynchronous task and, by default, polls **Get Research Status** every 3 seconds until the task is `complete` or `failed` (up to *Max Wait*, 540 s by default). Turn off *Wait for Completion* to return the `session_id` immediately.

A **Custom API Call** action is included for any endpoint under `https://api.neuralverge.ai/functions/v1`.

## Output

Every action returns the NeuralVerge response envelope:

```json
{
  "session_id": "3c0992eb-e65d-43a3-828c-9b94488760b7",
  "kind": "email_validation",
  "email": "jane.doe@example.com",
  "human": "# Email validation\n\n- **Result:** valid",
  "machine": { "email": "jane.doe@example.com", "result": "valid", "isCatchAll": false, "provider": "GOOGLE", "confidence": "medium" },
  "total_points": 1
}
```

`human` is a Markdown summary and `machine` is the structured result (or `null`).

## Links

- API docs: https://docs.neuralverge.ai
- Support: dmitry@neuralverge.ai
