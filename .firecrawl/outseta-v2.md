- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (10)

- Body
- Headers (10)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (9)

- Body
- Headers (10)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (9)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (10)

- Body
- Headers (0)

- Body
- Headers (9)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (10)

- Body
- Headers (10)

- Body
- Headers (8)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (9)

- Body
- Headers (9)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (10)

- Body
- Headers (0)

- Body
- Headers (10)

- Body
- Headers (10)

- Body
- Headers (10)

- Body
- Headers (10)

- Body
- Headers (10)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (0)

- Body
- Headers (10)

- Body
- Headers (0)

- Body
- Headers (10)

- Body
- Headers (12)

- Body
- Headers (0)

Public

Documentation Settings

ENVIRONMENT

No Environment

LAYOUT

Double Column

LANGUAGE

cURL - cURL

Outseta REST API v1

[Introduction](https://documenter.getpostman.com/view/3613332/outseta-rest-api-v1/7TNfr6k#intro)

Outseta REST API Documentation

CRM

Marketing

Support

Billing

User Profile

Authentication

Notifications

# Outseta REST API v1

# Outseta REST API Documentation

The Outseta REST API enables customers to perform a variety of powerful tasks such as creating and updating people, accounts, subscriptions and invoices. Outseta uses standard HTTP protocols within a compliant architecture that is simple to integrate. You can use the API both on the client or the server side; see instructions for authorization for each scenario in the getting started section.

The easiest way to get started with the API is to click the **Run in Postman** button present at the top of the documentation page and use the Postman App to send requests. Make sure to update the **Outseta** environment information at the top right corner of Postman so that it can be applied automatically when you send requests.

## Getting Started

You need to include a valid authorization token to send requests to the API endpoints.

### Server Side

To construct the authorization token you need to create an API key under Settings >> Integrations >> API Keys. Make sure to record the secret key when you create the new API Key. Then construct the token as follows:

"Outseta \[APIKey\]:\[SecretKey\]"

**Example:**

Outseta ce08fd5a-e1ee-4472-9c5f-b7575d8369b2:74fc1d2242a4eb7336d34b0e40cfbc5f

### Client Side

If you plan to use the API from the client side do NOT use the API keys as those are unsecure on the client side and can be easily copied. Instead construct the authorization token by calling the Get Auth API from the server side with your Outseta username and password. Then construct the authorization token as follows:

"bearer \[access\_token\]"

**Example:**

bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6InhObnZiLWxaWDJWNHdKTFctaVdreXBSR0cwVSJ9.eyJ1bmlxdWVfbmFtZSI6ImRpbWl0cmlzQG91dHNldGEuY29tIiwiZ2l2ZW5fbmFtZSI6IkRpbWl0cmlzIiwiZmFtaWx5X25hbWUiOiJHZW9yZ2Frb3BvdWxvcyIsImVtYWlsIjoiZGltaXRyaXNAb3V0c2V0YS5jb20iLCJuYW1laWQiOiI0WFFZcVFQQiIsIm91dHNldGE6YWNjb3VudFVpZCI6IndabU5abTJPIiwib3V0c2V0YTphY2NvdW50Q2xpZW50SWRlbnRpZmllciI6IjEiLCJ

## API Guidelines

- For the URL use your outseta domain name and append /api/v1 https://\[yourdomain\].outseta.com/api/v1

- The API will only respond to secured communication done over HTTPS. HTTP requests will be sent a 301 redirect to corresponding HTTPS resources.

- Response to every request is sent in JSON format. In case the API request results in an error, it is represented by an "error": {} key in the JSON response.

- The request method (verb) determines the nature of action you intend to perform. A request made using the GET method implies that you want to fetch something from Outseta, and POST implies you want to save something new to Outseta.

- The API calls will respond with appropriate HTTP status codes for all requests. A 200 OK indicates all went well, while 4XX or 5XX response codes indicate an error from the requesting client or our API servers respectively.

- Use "donotlog=1" as part of the querystring on any API call where you don't want to trigger the action performed being logged in the activity log.


## Get all API conventions

You can apply filtering by adding additional information on the querystring on the methods that retrieve all the entities in a domain (e.g., Get all accounts, Get all people). The conventions are as follows:

### Field Selection

When you make an API request, you'll automatically get all the basic information from the main object and its immediate child objects. Think of it as getting the "standard package" of data.

Change this behaviour by using the `fields` query param:

- **Go deeper**: Want information that's nested further down? The `fields` param lets you request fields lower down in the object tree: `?fields=CurrentSubscription.Plan.*`

- **Go lighter**: Want just the essentials for faster performance? The `fields` param lets you request only the root-level information: `?fields=Uid,Name`


Or do a combination: `?fields=Uid,Name,CurrentSubscription.Plan.Uid`

**Wildcard**: Use `*` to get all fields in an object: `?fields=*` or `?fields=CurrentSubscription.Plan.*`

#### Examples

View More

Plain Text

```plain
<!-- Get the current subscription plan uid   -->
GET https://[your-domain].outseta.com/api/v1/crm/accounts/[uid-of-an-account]?fields=CurrentSubscription.Plan.Uid

<!-- Get the account UID and the plan UID for a list of accounts -->
GET https://[your-domain].outseta.com/api/v1/crm/accounts?fields=Uid,CurrentSubscription.Plan.Uid

<!-- Get the full plan object for an account's current subscription -->
GET https://[your-domain].outseta.com/api/v1/crm/accounts/[uid-of-an-account]?fields=CurrentSubscription.Plan.*

<!-- Get the account UID and the plan UID for a person's current subscription(s) -->
GET https://[your-domain].outseta.com/api/v1/crm/people/[uid-of-a-person]?fields=Uid,PersonAccount.Account.CurrentSubscription.Plan.Uid
```

### Pagination

Plain Text

```plain
offset=defines which page to start
limit=number of records to return for each page
?offset=0&limit=20 (returns results 1-20)
?offset=1&limit=20 (returns results 21-40)
```

If your request includes fields from a child object you will be limited to retrieving 25 items in a single request. The maximum number of results returned in requests not requesting child object fields is 100 items.

### Sorting

Plain Text

```plain
Sorts the resultset based on the property and sort clause defined
?orderBy=PropertyName+DESC
```

### Filtering

Filter your data using query parameters to find specific records. You can use exact matches or comparison operators for more advanced filtering scenarios.

#### Basic Filtering

Filter on any field using the field as the query parameters: `?Email=john@example.com`

#### Comparison Operators

For advanced filtering, append comparison operators to field names:

| Operator | Description | Example |
| --- | --- | --- |
| `__gt` | Greater than | `Created__gt=2024-01-01` |
| `__gte` | Greater than or equal | `Amount__gte=100` |
| `__lt` | Less than | `Created__lt=2024-12-31` |
| `__lte` | Less than or equal | `Amount__lte=500` |
| `__ne` | Not equal | `Status__ne=Active` |
| `__isnull` | Is null (true/false) | `ProfileImageS3Url__isnull=true` |

#### Examples

View More

Plain Text

```plain
<!-- Date Filtering   -->
GET https://[your-domain].outseta.com/api/v1/crm/accounts?Created__gt=2024-01-01
GET https://[your-domain].outseta.com/api/v1/billing/subscriptions?EndDate__lt=2024-08-01

<!-- Numeric Filtering   -->
GET https://[your-domain].outseta.com/api/v1/billing/invoices?Amount__gte=1000
GET https://[your-domain].outseta.com/api/v1/billing/plans?MonthlyRate__lt=50

<!-- Status Filtering   -->
GET https://[your-domain].outseta.com/api/v1/crm/accounts?AccountStageLabel__ne=Cancelled

<!-- Null Value Filtering   -->
GET https://[your-domain].outseta.com/api/v1/crm/people?ProfileImageS3Url__isnull=true
GET https://[your-domain].outseta.com/api/v1/crm/accounts?ClientIdentifier__isnull=false

<!-- Multiple Filters   -->
GET https://[your-domain].outseta.com/api/v1/billing/subscriptions?
  StartDate__gte=2024-01-01&
  Rate__lt=100&
  DiscountCode__isnull=false

<!-- Complex Example with Field Selection   -->
GET https://[your-domain].outseta.com/api/v1/billing/subscriptions?
  Rate__gte=500&
  DiscountCode__isnull=false&
  fields=Uid,Amount,StartDate,DiscountCode,Plan.Name
```

## Acceptable use

Requests authorized by an API Key should not exceed 4 requests/second.

## Support

For help regarding the Outseta API please email [support@outseta.com](https://mailto:support@outseta.com/)

## API Reference

## CRM

## People

### GETGet all people

{{url}}/crm/people

Retrieves all the people associated with your account.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Example Request

Get all people

curl

```curl
curl --location 'https://webflow-demo.outseta.com/api/v1/crm/people' \
--header 'Authorization: •••••••' \
--header 'Content-Type: application/json'
```

200 OK

Example Response

- Body
- Headers (10)

View More

json

```json
{
  "metadata": {
    "limit": 100,
    "offset": 0,
    "total": 2
  },
  "items": [\
    {\
      "Email": "example@outseta.com",\
      "FirstName": "My",\
      "LastName": "example",\
      "MailingAddress": null,\
      "PhoneMobile": "",\
      "PhoneWork": "",\
      "Timezone": null,\
      "EmailBounceDateTime": null,\
      "EmailSpamDateTime": null,\
      "EmailUnsubscribeDateTime": null,\
      "EmailLastDeliveredDateTime": null,\
      "PersonAccount": [],\
      "FullName": "example@outseta.com",\
      "Uid": "qrm0A4QX",\
      "Created": "2017-04-05T11:23:56",\
      "Updated": "2017-04-05T11:23:56"\
    },\
    {\
      "Email": "second@yahoo.com",\
      "FirstName": "Second",\
      "LastName": "Example",\
      "MailingAddress": {\
        "AddressLine1": "1 main street",\
        "AddressLine2": null,\
        "AddressLine3": null,\
        "City": "Brookline",\
        "State": "MA",\
        "PostalCode": "02446",\
        "Uid": "Kj9bxomn",\
        "Created": "2017-03-17T15:53:14",\
        "Updated": "2017-03-17T15:53:49"\
      },\
      "PhoneMobile": "",\
      "PhoneWork": "",\
      "Timezone": null,\
      "EmailBounceDateTime": null,\
      "EmailSpamDateTime": null,\
      "EmailUnsubscribeDateTime": null,\
      "EmailLastDeliveredDateTime": null,\
      "FullName": "My Example",\
      "Uid": "bB9l5DW8",\
      "Created": "2017-01-23T08:54:06",\
      "Updated": "2017-03-31T16:29:05"\
    }\
  ]
}
```

Cache-Control

no-cache

Content-Length

16919

Content-Type

application/json; charset=utf-8

Date

Fri, 26 Jan 2018 20:30:18 GMT

Expires

-1

Pragma

no-cache

Server

Microsoft-IIS/10.0

X-AspNet-Version

4.0.30319

X-Powered-By

ASP.NET

X-SourceFiles

=?UTF-8?B?QzpcRGV2ZWxvcG1lbnRcT3V0c2V0YVxPdXRzZXRhLldlYi5DbGllbnRcYXBpXHYxXGNybVxwZW9wbGU=?=

### GETGet person

{{url}}/crm/people/\[personUid\]

Retrieves a person.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Example Request

Get person

curl

```curl
curl --location -g 'https://webflow-demo.outseta.com/api/v1/crm/people/[personUid]' \
--header 'Authorization: •••••••' \
--header 'Content-Type: application/json'
```

200 OK

Example Response

- Body
- Headers (10)

View More

json

```json
{
  "Email": "example@outseta.com",
  "FirstName": "My",
  "LastName": "Example",
  "MailingAddress": null,
  "PhoneMobile": "",
  "PhoneWork": "",
  "Timezone": null,
  "EmailBounceDateTime": null,
  "EmailSpamDateTime": null,
  "EmailUnsubscribeDateTime": null,
  "EmailLastDeliveredDateTime": null,
  "PersonAccount": [],
  "FullName": "My example",
  "Uid": "qrm0A4QX",
  "Created": "2017-04-05T11:23:56",
  "Updated": "2017-04-05T11:23:56"
}
```

Cache-Control

no-cache

Content-Length

397

Content-Type

application/json; charset=utf-8

Date

Fri, 26 Jan 2018 20:32:00 GMT

Expires

-1

Pragma

no-cache

Server

Microsoft-IIS/10.0

X-AspNet-Version

4.0.30319

X-Powered-By

ASP.NET

X-SourceFiles

=?UTF-8?B?QzpcRGV2ZWxvcG1lbnRcT3V0c2V0YVxPdXRzZXRhLldlYi5DbGllbnRcYXBpXHYxXGNybVxwZW9wbGVccXJtMEE0UVg=?=

### POSTAdd person

{{url}}/crm/people

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Bodyraw

View More

```javascript
{
	"Email": "example@me.com",
    "FirstName": "My",
    "LastName": "example",
    "MailingAddress": {
        "AddressLine1": "new line",
        "AddressLine2": "new line2",
        "AddressLine3": null,
        "City": "City",
        "State": "State",
        "PostalCode": "02446"
    }
}
```

Example Request

Add person

View More

curl

```curl
curl --location -g '{{url}}/crm/people' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data-raw '{
	"Email": "example@me.com",
    "FirstName": "My",
    "LastName": "example",
    "MailingAddress": {
                "AddressLine1": "new line",
                "AddressLine2": "new line2",
                "AddressLine3": null,
                "City": "City",
                "State": "State",
                "PostalCode": "02446"
    }
}'
```

200 OK

Example Response

- Body
- Headers (10)

View More

json

```json
{
  "Email": "example@me.com",
  "FirstName": "My",
  "LastName": "example",
  "MailingAddress": {
    "AddressLine1": "new line",
    "AddressLine2": "new line2",
    "AddressLine3": null,
    "City": "City",
    "State": "State",
    "PostalCode": "02446",
    "Uid": "y7mar2QE",
    "Created": "2018-01-29T11:25:52.4923813-05:00",
    "Updated": "2018-01-29T11:25:52.4923813-05:00"
  },
  "PhoneMobile": "",
  "PhoneWork": "",
  "Timezone": null,
  "EmailBounceDateTime": null,
  "EmailSpamDateTime": null,
  "EmailUnsubscribeDateTime": null,
  "EmailLastDeliveredDateTime": null,
  "PersonAccount": [],
  "FullName": "My example",
  "Uid": "GnmDrY9y",
  "Created": "2018-01-29T11:25:52.4923813-05:00",
  "Updated": "2018-01-29T11:25:52.4923813-05:00"
}
```

Cache-Control

no-cache

Content-Length

634

Content-Type

application/json; charset=utf-8

Date

Mon, 29 Jan 2018 16:25:52 GMT

Expires

-1

Pragma

no-cache

Server

Microsoft-IIS/10.0

X-AspNet-Version

4.0.30319

X-Powered-By

ASP.NET

X-SourceFiles

=?UTF-8?B?QzpcRGV2ZWxvcG1lbnRcT3V0c2V0YVxPdXRzZXRhLldlYi5DbGllbnRcYXBpXHYxXGNybVxwZW9wbGU=?=

### PUTUpdate person

{{url}}/crm/people/\[personUid\]

Update a person record. You can update one or multiple properties on the object. Any property that you include in the json schema will be updated. To update custom properties just include them in the same way that they are included when you do a get on the object.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Bodyraw

View More

```javascript
{
	"Email": "example@example.com",
    "FirstName": "My",
    "LastName": "example",
    "MailingAddress": {
        "Uid": "exmewp9V",
        "AddressLine1": "new line",
        "AddressLine2": "new line2",
        "AddressLine3": null,
        "City": "City",
        "State": "State",
        "PostalCode": "02446"
    }
}
```

Example Request

Update person

View More

curl

```curl
curl --location -g --request PUT '{{url}}/crm/people/[personUid]' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data-raw '{
	"Email": "example@example.com",
    "FirstName": "My",
    "LastName": "example",
    "MailingAddress": {
        "Uid": "exmewp9V",
        "AddressLine1": "new line",
        "AddressLine2": "new line2",
        "AddressLine3": null,
        "City": "City",
        "State": "State",
        "PostalCode": "02446"
    }
}'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### DELETEDelete person

{{url}}/crm/people/\[personUid\]

Delete a person record.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Example Request

Delete person

curl

```curl
curl --location -g --request DELETE '{{url}}/crm/people/[personUid]' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data ''
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### PUTSet temporary password

{{url}}/crm/people/\[personUid\]/setTemporaryPassword

Set a temporary password for a user. The user needs to update the password with the next login.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Bodyraw

```javascript
{
	"temporaryPassword": "gas-knew-shoe-danger"
}
```

Example Request

Set temporary password

curl

```curl
curl --location -g --request PUT '{{url}}/crm/people/[personUid]/setTemporaryPassword' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data '{
	"temporaryPassword": "gas-knew-shoe-danger"
}'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### POSTInitiate password reset

{{url}}/crm/people/forgotPassword?parentUrl={{parentUrl}}

Initiate the forgot password flow by sending an email to the user with a link to a page where they can reset their password. The reset password token in the link is valid for 30 minutes.

HEADERS

Content-Type

application/json

PARAMS

parentUrl

{{parentUrl}}

If this optional parameter is provided, the link for the user to set a new password will use this URL and add a querystring parameter for the reset token. Pages that have the Outseta script loaded will read this token and show the UI for setting a new password.

If this parameter is not provided, the link will be for a page that Outseta provides for resetting the password.

Bodyraw (json)

json

```json
{
    "Email": "person@example.com"
}
```

Example Request

Initiate password reset

curl

```curl
curl --location -g '{{url}}/crm/people/forgotPassword?parentUrl={{parentUrl}}' \
--header 'Content-Type: application/json' \
--data-raw '{
    "Email": "person@example.com"
}'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### PUTSend confirmation email to primary person on an account

{{url}}/crm/accounts/{{accountUid}}/send-confirmation-email

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Example Request

Send confirmation email to primary person on an account

curl

```curl
curl --location -g --request PUT '{{url}}/crm/accounts/{{accountUid}}/send-confirmation-email' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### PUTSend confirmation email to specific person on an account

{{url}}/crm/accounts/{{accountUid}}/send-confirmation-email?personUid={{personUid}}

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

PARAMS

personUid

{{personUid}}

Example Request

Send confirmation email to specific person on an account

View More

curl

```curl
curl --location -g --request PUT '{{url}}/crm/accounts/{{accountUid}}/send-confirmation-email?personUid={{personUid}}' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### PUTSend confirmation email to all people on an account

{{url}}/crm/accounts/{{accountUid}}/send-confirmation-email?personUid=\*

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

PARAMS

personUid

\*

Example Request

Send confirmation email to all people on an account

curl

```curl
curl --location -g --request PUT '{{url}}/crm/accounts/{{accountUid}}/send-confirmation-email?personUid=*' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

## Accounts

### GETGet account

{{url}}/crm/accounts/\[accountUid\]

Retrieves all the information related to an account.

**Account stages**

These stages are authomatically tracked for each account when accounts are tied to a subscription. Accounts set to demo are not billed for the subscriptions that are tied to them.

| Name | Value |
| --- | --- |
| Trialing | 2 |
| Subscribing | 3 |
| Cancelling | 4 |
| Expired | 5 |
| Trial expired | 6 |
| Past due | 7 |

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Example Request

Get account

curl

```curl
curl --location 'https://webflow-demo.outseta.com/api/v1/crm/accounts/KaWx1mVr' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json'
```

200 OK

Example Response

- Body
- Headers (10)

View More

json

```json
{
  "Name": "First Account",
  "ClientIdentifier": null,
  "BillingAddress": {
    "AddressLine1": "billing new line",
    "AddressLine2": "new line2",
    "AddressLine3": null,
    "City": "",
    "State": "",
    "PostalCode": "",
    "Uid": "aOW4pYWg",
    "Created": "2017-12-15T09:45:53",
    "Updated": "2017-12-15T09:45:53"
  },
  "MailingAddress": {
    "AddressLine1": "mailing new line",
    "AddressLine2": "new line2",
    "AddressLine3": null,
    "City": "",
    "State": "",
    "PostalCode": "",
    "Uid": "4XQY2q9P",
    "Created": "2017-12-15T09:45:53",
    "Updated": "2017-12-15T09:45:53"
  },
  "AccountStage": 1,
  "PaymentInformation": null,
  "PersonAccount": [\
    {\
      "Person": null,\
      "Account": null,\
      "IsPrimary": true,\
      "Uid": "wDQ2w9V6",\
      "Created": "2017-12-15T09:45:53",\
      "Updated": "2017-12-15T09:45:53"\
    }\
  ],
  "Uid": "KaWx1mVr",
  "Created": "2017-12-15T09:45:53",
  "Updated": "2018-01-22T11:48:50"
}
```

Cache-Control

no-cache

Content-Length

1121

Content-Type

application/json; charset=utf-8

Date

Mon, 29 Jan 2018 15:49:35 GMT

Expires

-1

Pragma

no-cache

Server

Microsoft-IIS/10.0

X-AspNet-Version

4.0.30319

X-Powered-By

ASP.NET

X-SourceFiles

=?UTF-8?B?QzpcRGV2ZWxvcG1lbnRcT3V0c2V0YVxPdXRzZXRhLldlYi5DbGllbnRcYXBpXHYxXGNybVxhY2NvdW50c1xLYVd4MW1Wcg==?=

### GETGet all accounts

{{url}}/crm/accounts/

Retrieves account information.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Example Request

Get all accounts

curl

```curl
curl --location 'https://webflow-demo.outseta.com/api/v1/crm/accounts/' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json'
```

200 OK

Example Response

- Body
- Headers (10)

View More

json

```json
{
  "metadata": {
    "limit": 100,
    "offset": 0,
    "total": 2
  },
  "items": [\
    {\
      "Name": "First example account",\
      "ClientIdentifier": null,\
      "BillingAddress": {\
        "AddressLine1": "billing new line",\
        "AddressLine2": "new line2",\
        "AddressLine3": null,\
        "City": "",\
        "State": "",\
        "PostalCode": "",\
        "Uid": "aOW4pYWg",\
        "Created": "2017-12-15T09:45:53",\
        "Updated": "2017-12-15T09:45:53"\
      },\
      "MailingAddress": {\
        "AddressLine1": "mailing new line",\
        "AddressLine2": "new line2",\
        "AddressLine3": null,\
        "City": "",\
        "State": "",\
        "PostalCode": "",\
        "Uid": "4XQY2q9P",\
        "Created": "2017-12-15T09:45:53",\
        "Updated": "2017-12-15T09:45:53"\
      },\
      "AccountStage": 6,\
      "PaymentInformation": null,\
      "PersonAccount": [\
        {\
          "Person": null,\
          "Account": null,\
          "IsPrimary": true,\
          "Uid": "wDQ2w9V6",\
          "Created": "2017-12-15T09:45:53",\
          "Updated": "2017-12-15T09:45:53"\
        }\
      ],\
      "Subscriptions": [\
        {\
          "BillingRenewalTerm": 1,\
          "Account": null,\
          "Plan": null,\
          "Quantity": null,\
          "StartDate": "2017-12-15T14:45:00",\
          "EndDate": "2018-01-15T14:45:00",\
          "RenewalDate": null,\
          "NewRequiredQuantity": null,\
          "IsPlanUpgradeRequired": false,\
          "PlanUpgradeRequiredMessage": null,\
          "SubscriptionAddOns": null,\
          "Uid": "By9q589A",\
          "Created": "2017-12-15T09:45:53",\
          "Updated": "2018-01-22T11:48:50"\
        }\
      ],\
      "Uid": "KaWx1mVr",\
      "Created": "2017-12-15T09:45:53",\
      "Updated": "2018-01-22T11:48:50"\
    },\
    {\
      "Name": "Second account example",\
      "ClientIdentifier": null,\
      "BillingAddress": {\
        "AddressLine1": "billing new line",\
        "AddressLine2": "new line2",\
        "AddressLine3": null,\
        "City": "",\
        "State": "",\
        "PostalCode": "",\
        "Uid": "3wQXLwQK",\
        "Created": "2017-12-15T09:47:55",\
        "Updated": "2017-12-15T09:47:55"\
      },\
      "MailingAddress": {\
        "AddressLine1": "mailing new line",\
        "AddressLine2": "new line2",\
        "AddressLine3": null,\
        "City": "",\
        "State": "",\
        "PostalCode": "",\
        "Uid": "pL9P5OWJ",\
        "Created": "2017-12-15T09:47:55",\
        "Updated": "2017-12-15T09:47:55"\
      },\
      "AccountStage": 2,\
      "PaymentInformation": null,\
      "PersonAccount": [\
        {\
          "Person": null,\
          "Account": null,\
          "IsPrimary": true,\
          "Uid": "KL9ngWZG",\
          "Created": "2017-12-15T09:47:55",\
          "Updated": "2017-12-15T09:47:55"\
        }\
      ]\
    }\
  ]
}
```

Cache-Control

no-cache

Content-Length

34796

Content-Type

application/json; charset=utf-8

Date

Mon, 29 Jan 2018 15:43:18 GMT

Expires

-1

Pragma

no-cache

Server

Microsoft-IIS/10.0

X-AspNet-Version

4.0.30319

X-Powered-By

ASP.NET

X-SourceFiles

=?UTF-8?B?QzpcRGV2ZWxvcG1lbnRcT3V0c2V0YVxPdXRzZXRhLldlYi5DbGllbnRcYXBpXHYxXGNybVxhY2NvdW50c1w=?=

### GETGet all trialing accounts

{{url}}/crm/accounts?AccountStage=2

Retrieves account information and filters for trialers. You can update the account stage to retrieve accounts in other stages (e.g. Demo, Subscribing, etc).

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

PARAMS

AccountStage

2

Example Request

Get all trialing accounts

curl

```curl
curl --location -g '{{url}}/crm/accounts?AccountStage=2' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### POSTAdd account with existing person

{{url}}/crm/accounts

Add a new account with an existing person.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Bodyraw

View More

```javascript
{
  "Name": "First API account",
    "AccountStage": "2",
    "MailingAddress":
        {
          "AddressLine1": "mailing new line",
          "AddressLine2": "new line2",
           "City": "new city",
           "State": "state",
           "PostalCode": "02440"
        },
    "BillingAddress":
        {
          "AddressLine1": "billing new line",
          "AddressLine2": "new line2",
          "City": "new city",
          "State": "state",
          "PostalCode": "02440"
        },
    "PersonAccount": [\
        {\
          "Person": {"Uid": "owmjxl9V"},\
          "IsPrimary": "true"\
        }\
      ]
}
```

Example Request

Add account with existing person

View More

curl

```curl
curl --location -g '{{url}}/crm/accounts' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data '{
	"Name": "First API account",
    "AccountStage": "2",
    "MailingAddress":
        {
          "AddressLine1": "mailing new line",
          "AddressLine2": "new line2",
           "City": "new city",
           "State": "state",
           "PostalCode": "02440"
        },
    "BillingAddress":
        {
          "AddressLine1": "billing new line",
          "AddressLine2": "new line2",
          "City": "new city",
          "State": "state",
          "PostalCode": "02440"
        },
    "PersonAccount": [\
        {\
          "Person": {"Uid": "owmjxl9V"},\
          "IsPrimary": "true"\
        }\
      ]
}'
```

200 OK

Example Response

- Body
- Headers (10)

View More

json

```json
{
  "Name": "First API account",
  "ClientIdentifier": null,
  "BillingAddress": {
    "AddressLine1": "billing new line",
    "AddressLine2": "new line2",
    "AddressLine3": null,
    "City": "new city",
    "State": "state",
    "PostalCode": "02440",
    "Uid": "4XQY2X9P",
    "Created": "2018-01-29T11:42:25.5834244-05:00",
    "Updated": "2018-01-29T11:42:25.5834244-05:00"
  },
  "MailingAddress": {
    "AddressLine1": "mailing new line",
    "AddressLine2": "new line2",
    "AddressLine3": null,
    "City": "new city",
    "State": "state",
    "PostalCode": "02440",
    "Uid": "3wQXLlQK",
    "Created": "2018-01-29T11:42:25.5834244-05:00",
    "Updated": "2018-01-29T11:42:25.5834244-05:00"
  },
  "AccountStage": 2,
  "PaymentInformation": null,
  "PersonAccount": [\
    {\
      "Person": null,\
      "Account": null,\
      "IsPrimary": true,\
      "Uid": "owmjl9V6",\
      "Created": "2018-01-29T11:42:25.5834244-05:00",\
      "Updated": "2018-01-29T11:42:25.5834244-05:00"\
    }\
  ],
  "Subscriptions": [],
  "Uid": "jLmJ6mPo",
  "Created": "2018-01-29T11:42:25.5834244-05:00",
  "Updated": "2018-01-29T11:42:25.5834244-05:00"
}
```

Cache-Control

no-cache

Content-Length

926

Content-Type

application/json; charset=utf-8

Date

Mon, 29 Jan 2018 16:42:25 GMT

Expires

-1

Pragma

no-cache

Server

Microsoft-IIS/10.0

X-AspNet-Version

4.0.30319

X-Powered-By

ASP.NET

X-SourceFiles

=?UTF-8?B?QzpcRGV2ZWxvcG1lbnRcT3V0c2V0YVxPdXRzZXRhLldlYi5DbGllbnRcYXBpXHYxXGNybVxhY2NvdW50cw==?=

### POSTAdd account with new person

{{url}}/crm/accounts?sendConfirmationEmail=true/false

Add a new account with a new person.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

PARAMS

sendConfirmationEmail

true/false

Boolean value for whether a confirmation email is sent to the newly added person on the account. Defaults to false when the parameter is not present.

Bodyraw

View More

```javascript
{
  "Name": "First API account",
    "AccountStage": "2",
    "MailingAddress":
        {
          "AddressLine1": "mailing new line",
          "AddressLine2": "new line2",
           "City": "new city",
           "State": "state",
           "PostalCode": "02440"
        },
    "BillingAddress":
        {
          "AddressLine1": "billing new line",
          "AddressLine2": "new line2",
          "City": "new city",
          "State": "state",
          "PostalCode": "02440"
        },
    "PersonAccount": [\
        {\
          "Person": {"Email": "new@example.com",  "FirstName": "New", "LastName": "Person"},\
          "IsPrimary": "true"\
        }\
      ]
}
```

Example Request

Add account with new person

View More

curl

```curl
curl --location -g '{{url}}/crm/accounts' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data-raw '{
	"Name": "First API account",
    "AccountStage": "2",
    "MailingAddress":
        {
          "AddressLine1": "mailing new line",
          "AddressLine2": "new line2",
           "City": "new city",
           "State": "state",
           "PostalCode": "02440"
        },
    "BillingAddress":
        {
          "AddressLine1": "billing new line",
          "AddressLine2": "new line2",
          "City": "new city",
          "State": "state",
          "PostalCode": "02440"
        },
    "PersonAccount": [\
        {\
          "Person": {"Email": "new@example.com",  "FirstName": "New", "LastName": "Person"},\
          "IsPrimary": "true"\
        }\
      ]
}'
```

200 OK

Example Response

- Body
- Headers (10)

View More

json

```json
{
  "Name": "First API account",
  "ClientIdentifier": null,
  "BillingAddress": {
    "AddressLine1": "billing new line",
    "AddressLine2": "new line2",
    "AddressLine3": null,
    "City": "new city",
    "State": "state",
    "PostalCode": "02440",
    "Uid": "pL9P5nWJ",
    "Created": "2018-01-29T11:47:31.4412132-05:00",
    "Updated": "2018-01-29T11:47:31.4412132-05:00"
  },
  "MailingAddress": {
    "AddressLine1": "mailing new line",
    "AddressLine2": "new line2",
    "AddressLine3": null,
    "City": "new city",
    "State": "state",
    "PostalCode": "02440",
    "Uid": "exmewP9V",
    "Created": "2018-01-29T11:47:31.4412132-05:00",
    "Updated": "2018-01-29T11:47:31.4412132-05:00"
  },
  "AccountStage": 2,
  "PaymentInformation": null,
  "PersonAccount": [\
    {\
      "Person": null,\
      "Account": null,\
      "IsPrimary": true,\
      "Uid": "gA93qm02",\
      "Created": "2018-01-29T11:47:31.4412132-05:00",\
      "Updated": "2018-01-29T11:47:31.4412132-05:00"\
    }\
  ],
  "Subscriptions": [],
  "Uid": "wDQ2w9V6",
  "Created": "2018-01-29T11:47:31.4412132-05:00",
  "Updated": "2018-01-29T11:47:31.4412132-05:00"
}
```

Cache-Control

no-cache

Content-Length

926

Content-Type

application/json; charset=utf-8

Date

Mon, 29 Jan 2018 16:47:31 GMT

Expires

-1

Pragma

no-cache

Server

Microsoft-IIS/10.0

X-AspNet-Version

4.0.30319

X-Powered-By

ASP.NET

X-SourceFiles

=?UTF-8?B?QzpcRGV2ZWxvcG1lbnRcT3V0c2V0YVxPdXRzZXRhLldlYi5DbGllbnRcYXBpXHYxXGNybVxhY2NvdW50cw==?=

### POSTAdd new person to existing account

{{url}}/crm/accounts/wDQ2w9V6/memberships?sendWelcomeEmail=false

Add a new person to an existing account.

Set sendWelcomeEmail=true if you'd like the system to send an welcome email to the person added on the account.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

PARAMS

sendWelcomeEmail

false

Bodyraw

```javascript
{
      "Account": {"Uid": "wDQ2w9V6"},
          "Person": {"Email": "new@new.com",  "FirstName": "New", "LastName": "Person"},
          "IsPrimary": "false"
}
```

Example Request

Add new person to existing account

curl

```curl
curl --location -g '{{url}}/crm/accounts/wDQ2w9V6/memberships' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data-raw '{
		  "Account": {"Uid": "wDQ2w9V6"},
          "Person": {"Email": "new@new.com",  "FirstName": "New", "LastName": "Person"},
          "IsPrimary": "false"
}'
```

200 OK

Example Response

- Body
- Headers (10)

View More

json

```json
{
  "Person": {
    "Email": "new@new.com",
    "FirstName": "New",
    "LastName": "Person",
    "MailingAddress": null,
    "PhoneMobile": "",
    "PhoneWork": "",
    "Timezone": null,
    "EmailBounceDateTime": null,
    "EmailSpamDateTime": null,
    "EmailUnsubscribeDateTime": null,
    "EmailLastDeliveredDateTime": null,
    "PersonAccount": null,
    "FullName": "New Person",
    "Uid": "ZBWzAP9E",
    "Created": "2018-01-29T12:03:12.2881933-05:00",
    "Updated": "2018-01-29T12:03:12.2881933-05:00"
  },
  "Account": {
    "Name": null,
    "ClientIdentifier": null,
    "BillingAddress": null,
    "MailingAddress": null,
    "AccountStage": 0,
    "PaymentInformation": null,
    "PersonAccount": null,
    "Subscriptions": null,
    "Uid": "wDQ2w9V6",
    "Created": "0001-01-01T00:00:00",
    "Updated": "0001-01-01T00:00:00"
  },
  "IsPrimary": false,
  "Uid": "ZBWzyP9E",
  "Created": "2018-01-29T12:03:12.2881933-05:00",
  "Updated": "2018-01-29T12:03:12.2881933-05:00"
}
```

Cache-Control

no-cache

Content-Length

799

Content-Type

application/json; charset=utf-8

Date

Mon, 29 Jan 2018 17:03:13 GMT

Expires

-1

Pragma

no-cache

Server

Microsoft-IIS/10.0

X-AspNet-Version

4.0.30319

X-Powered-By

ASP.NET

X-SourceFiles

=?UTF-8?B?QzpcRGV2ZWxvcG1lbnRcT3V0c2V0YVxPdXRzZXRhLldlYi5DbGllbnRcYXBpXHYxXGNybVxhY2NvdW50c1x3RFEydzlWNlxtZW1iZXJzaGlwcw==?=

### POSTAdd existing person to existing account

{{url}}/crm/accounts/wDQ2w9V6/memberships

Add an existing person to an existing account.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Bodyraw

```javascript
{
		  "Account": {"Uid": "wDQ2w9V6"},
          "Person": {"Uid": "y7maBrQE"},
          "IsPrimary": "false"
}
```

Example Request

Add existing person to existing account

curl

```curl
curl --location -g '{{url}}/crm/accounts/wDQ2w9V6/memberships' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data '{
		  "Account": {"Uid": "wDQ2w9V6"},
          "Person": {"Uid": "y7maBrQE"},
          "IsPrimary": "false"
}'
```

200 OK

Example Response

- Body
- Headers (10)

View More

json

```json
{
  "Person": {
    "Email": null,
    "FirstName": "",
    "LastName": "",
    "MailingAddress": null,
    "PhoneMobile": "",
    "PhoneWork": "",
    "Timezone": null,
    "EmailBounceDateTime": null,
    "EmailSpamDateTime": null,
    "EmailUnsubscribeDateTime": null,
    "EmailLastDeliveredDateTime": null,
    "PersonAccount": null,
    "FullName": null,
    "Uid": "y7maBrQE",
    "Created": "0001-01-01T00:00:00",
    "Updated": "0001-01-01T00:00:00"
  },
  "Account": {
    "Name": null,
    "ClientIdentifier": null,
    "BillingAddress": null,
    "MailingAddress": null,
    "AccountStage": 0,
    "PaymentInformation": null,
    "PersonAccount": null,
    "Subscriptions": null,
    "Uid": "wDQ2w9V6",
    "Created": "0001-01-01T00:00:00",
    "Updated": "0001-01-01T00:00:00"
  },
  "IsPrimary": false,
  "Uid": "GnmDYQyM",
  "Created": "2018-01-29T11:54:37.3258427-05:00",
  "Updated": "2018-01-29T11:54:37.3258427-05:00"
}
```

Cache-Control

no-cache

Content-Length

745

Content-Type

application/json; charset=utf-8

Date

Mon, 29 Jan 2018 16:54:37 GMT

Expires

-1

Pragma

no-cache

Server

Microsoft-IIS/10.0

X-AspNet-Version

4.0.30319

X-Powered-By

ASP.NET

X-SourceFiles

=?UTF-8?B?QzpcRGV2ZWxvcG1lbnRcT3V0c2V0YVxPdXRzZXRhLldlYi5DbGllbnRcYXBpXHYxXGNybVxhY2NvdW50c1x3RFEydzlWNlxtZW1iZXJzaGlwcw==?=

### POSTAdd account with subscription

{{url}}/crm/accounts

Add a new account with an existing person and a new subscription.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Bodyraw

View More

```javascript
{
    "Name": "Fourth API account",
    "MailingAddress": {
        "AddressLine1": "mailing new line",
        "AddressLine2": "new line2",
        "City": "new city",
        "State": "state",
        "PostalCode": "02440"
    },
    "BillingAddress": {
        "AddressLine1": "billing new line",
        "AddressLine2": "new line2",
        "City": "new city",
        "State": "state",
        "PostalCode": "02440"
    },
    "PersonAccount": [\
        {\
            "Person": {"Uid": "owmjxl9V"},\
            "IsPrimary": "true"\
        }\
    ],
    "Subscriptions":[\
        {\
            "Plan": {"Uid": "VdQG094Y"},\
            "BillingRenewalTerm": 1\
        }\
    ]
}
```

Example Request

Add account with subscription

View More

curl

```curl
curl --location -g '{{url}}/crm/accounts' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data '{
    "Name": "Fourth API account",
    "MailingAddress": {
        "AddressLine1": "mailing new line",
        "AddressLine2": "new line2",
        "City": "new city",
        "State": "state",
        "PostalCode": "02440"
    },
    "BillingAddress": {
        "AddressLine1": "billing new line",
        "AddressLine2": "new line2",
        "City": "new city",
        "State": "state",
        "PostalCode": "02440"
    },
    "PersonAccount": [\
        {\
            "Person": {"Uid": "owmjxl9V"},\
            "IsPrimary": "true"\
        }\
    ],
    "Subscriptions":[\
        {\
            "Plan": {"Uid": "VdQG094Y"},\
            "BillingRenewalTerm": 1\
        }\
    ]
}
'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### POSTRegister Account

{{url}}/crm/registrations

This is the same endpoint our sign up embed uses to create accounts. At a minimum you must pass one Primary Contact with an Email address and one Subscription record with a reference to a Plan. Other fields (e.g. Account Name, Billing Address, Payment Information, etc.) can be passed as desired. A confirmation email will be sent to the user unless you've specifically toggled this option off on the AUTH > SIGN UP AND LOGIN page.

Bodyraw (json)

View More

json

```json
{
    "Name": "ACME, LLC",
    "PersonAccount": [\
        {\
            "IsPrimary": true,\
            "Person": {\
                "Email": "jdoe@domain.com"\
            }\
        }\
    ],
    "Subscriptions": [\
        {\
            "BillingRenewalTerm": 2,\
            "Plan": {\
                "Uid": "amRXjE9J"\
            }\
        }\
    ]
}
```

Example Request

Register Account

View More

curl

```curl
curl --location -g '{{url}}/crm/registrations' \
--data-raw '{
    "Name": "ACME, LLC",
    "PersonAccount": [\
        {\
            "IsPrimary": true,\
            "Person": {\
                "Email": "jdoe@domain.com"\
            }\
        }\
    ],
    "Subscriptions": [\
        {\
            "BillingRenewalTerm": 2,\
            "Plan": {\
                "Uid": "amRXjE9J"\
            }\
        }\
    ]
}'
```

200 OK

Example Response

- Body
- Headers (12)

View More

json

```json
{
  "_objectType": "Account",
  "Name": "ACME, LLC",
  "ClientIdentifier": null,
  "InvoiceNotes": null,
  "IsDemo": false,
  "BillingAddress": null,
  "MailingAddress": null,
  "AccountStage": 2,
  "PaymentInformation": null,
  "PersonAccount": [\
    {\
      "_objectType": "PersonAccount",\
      "Person": null,\
      "Account": null,\
      "IsPrimary": true,\
      "ActivityEventData": null,\
      "Uid": "7maPO31W",\
      "Created": "2023-04-11T18:23:42.9482596Z",\
      "Updated": "2023-04-11T18:23:42.9482596Z"\
    }\
  ],
  "Subscriptions": [\
    {\
      "_objectType": "Subscription",\
      "BillingRenewalTerm": 2,\
      "Account": null,\
      "Plan": null,\
      "Quantity": null,\
      "StartDate": "2023-04-11T18:23:42.9069142Z",\
      "EndDate": null,\
      "ExpirationDate": null,\
      "RenewalDate": "2024-04-11T18:23:42.9069142Z",\
      "NewRequiredQuantity": null,\
      "IsPlanUpgradeRequired": false,\
      "PlanUpgradeRequiredMessage": null,\
      "SubscriptionAddOns": null,\
      "DiscountCouponSubscriptions": null,\
      "DiscountCode": null,\
      "LatestInvoice": null,\
      "Rate": 0,\
      "ActivityEventData": null,\
      "Uid": "zWZLYrdQ",\
      "Created": "2023-04-11T18:23:42.9482596Z",\
      "Updated": "2023-04-11T18:23:42.9482596Z"\
    }\
  ],
  "Deals": [],
  "LastLoginDateTime": null,
  "AccountSpecificPageUrl1": null,
  "AccountSpecificPageUrl2": null,
  "AccountSpecificPageUrl3": null,
  "AccountSpecificPageUrl4": null,
  "AccountSpecificPageUrl5": null,
  "AccountSpecificPageUrl6": null,
  "AccountSpecificPageUrl7": null,
  "AccountSpecificPageUrl8": null,
  "AccountSpecificPageUrl9": null,
  "AccountSpecificPageUrl10": null,
  "RewardFulReferralId": null,
  "HasLoggedIn": false,
  "AccountStageLabel": "Trialing",
  "DomainName": null,
  "LatestSubscription": {
    "_objectType": "Subscription",
    "BillingRenewalTerm": 2,
    "Account": null,
    "Plan": null,
    "Quantity": null,
    "StartDate": "2023-04-11T18:23:42.9069142Z",
    "EndDate": null,
    "ExpirationDate": null,
    "RenewalDate": "2024-04-11T18:23:42.9069142Z",
    "NewRequiredQuantity": null,
    "IsPlanUpgradeRequired": false,
    "PlanUpgradeRequiredMessage": null,
    "SubscriptionAddOns": null,
    "DiscountCouponSubscriptions": null,
    "DiscountCode": null,
    "LatestInvoice": null,
    "Rate": 0,
    "ActivityEventData": null,
    "Uid": "zWZLYrdQ",
    "Created": "2023-04-11T18:23:42.9482596Z",
    "Updated": "2023-04-11T18:23:42.9482596Z"
  },
  "CurrentSubscription": {
    "_objectType": "Subscription",
    "BillingRenewalTerm": 2,
    "Account": null,
    "Plan": null,
    "Quantity": null,
    "StartDate": "2023-04-11T18:23:42.9069142Z",
    "EndDate": null,
    "ExpirationDate": null,
    "RenewalDate": "2024-04-11T18:23:42.9069142Z",
    "NewRequiredQuantity": null,
    "IsPlanUpgradeRequired": false,
    "PlanUpgradeRequiredMessage": null,
    "SubscriptionAddOns": null,
    "DiscountCouponSubscriptions": null,
    "DiscountCode": null,
    "LatestInvoice": null,
    "Rate": 0,
    "ActivityEventData": null,
    "Uid": "zWZLYrdQ",
    "Created": "2023-04-11T18:23:42.9482596Z",
    "Updated": "2023-04-11T18:23:42.9482596Z"
  },
  "PrimaryContact": {
    "_objectType": "Person",
    "Email": "jdoe@domain.com",
    "FirstName": "",
    "LastName": "",
    "MailingAddress": null,
    "PasswordLastUpdated": null,
    "PasswordMustChange": false,
    "PhoneMobile": "",
    "PhoneWork": "",
    "ProfileImageS3Url": null,
    "Title": null,
    "Timezone": null,
    "Language": null,
    "IPAddress": "54.86.50.139",
    "Referer": null,
    "UserAgent": "PostmanRuntime/7.31.3",
    "LastLoginDateTime": null,
    "OAuthGoogleProfileId": null,
    "PersonAccount": null,
    "DealPeople": null,
    "LeadFormSubmissions": null,
    "EmailListPerson": null,
    "Account": null,
    "AccountUids": null,
    "FullName": "jdoe@domain.com",
    "HasLoggedIn": false,
    "OAuthIntegrationStatus": 0,
    "UserAgentPlatformBrowser": "Unknown (Unknown)",
    "HasUnsubscribed": false,
    "DiscordUser": null,
    "IsConnectedToDiscord": false,
    "ActivityEventData": null,
    "Uid": "zWZbMyqW",
    "Created": "2023-04-11T18:23:43",
    "Updated": "2023-04-11T18:23:43.559072Z"
  },
  "PrimarySubscription": null,
  "RecaptchaToken": null,
  "LifetimeRevenue": 0,
  "ActivityEventData": null,
  "Uid": "y9qxpV3Q",
  "Created": "2023-04-11T18:23:42.9482596Z",
  "Updated": "2023-04-11T18:23:42.9482596Z"
}
```

Cache-Control

no-cache

Content-Encoding

gzip

Content-Type

application/json; charset=utf-8

Date

Tue, 11 Apr 2023 18:23:43 GMT

Expires

-1

Pragma

no-cache

Server

Microsoft-IIS/10.0

Vary

Accept-Encoding

X-AspNet-Version

4.0.30319

X-Powered-By

ASP.NET

Content-Length

1118

Connection

keep-alive

### PUTUpdate account

{{url}}/crm/accounts/\[accountUid\]

Update account information. You can update one or multiple properties on the object. Any property that you include in the json schema will be updated. To update custom properties just include them in the same way that they are included when you do a get on the object.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Bodyraw

View More

```javascript
{
	"Name": "First API account",
    "AccountStage": "3",
    "MailingAddress": {
        "Uid": "GEWBer9r",
        "AddressLine1": "mailing new line",
        "AddressLine2": "new line2"
    },
    "BillingAddress": {
         "Uid": "KjW7e4Qq",
         "AddressLine1": "billing new line",
         "AddressLine2": "new line2"
    }
}
```

Example Request

Update account

View More

curl

```curl
curl --location -g --request PUT '{{url}}/crm/accounts/[accountUid]' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data '{
	"Name": "First API account",
    "AccountStage": "3",
    "MailingAddress": {
        "Uid": "GEWBer9r",
        "AddressLine1": "mailing new line",
        "AddressLine2": "new line2"
    },
    "BillingAddress": {
         "Uid": "KjW7e4Qq",
         "AddressLine1": "billing new line",
         "AddressLine2": "new line2"
    }
}'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### PUTCancel account

{{url}}/crm/accounts/cancellation/\[accountUid\]

Add a cancellantion request to an account. The account needs to be in subscribing stage. The stage will authomatically change over to cancelling. If the account has a subscription attached to it then at the subscription renewal the subscription will end and the account will be automatically set to expired.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Bodyraw

```javascript
{
	"CancelationReason": "Too expensive",
    "Comment": "I don't want to use the software for now.",
    "Account": { "Uid": "wDQ2w9V6" }
}
```

Example Request

Cancel account

curl

```curl
curl --location -g --request PUT '{{url}}/crm/accounts/cancellation/[accountUid]' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data '{
	"CancelationReason": "Too expensive",
    "Comment": "I don'\''t want to use the software for now.",
    "Account": { "Uid": "wDQ2w9V6" }
}'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### PUTRemove cancelation

{{url}}/crm/accounts/removecancellation/\[accountUid\]

Remove a previous cancelation request.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Example Request

Remove cancelation

curl

```curl
curl --location -g --request PUT '{{url}}/crm/accounts/removecancellation/[accountUid]' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data ''
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### PUTUpdate person account membership

{{url}}/crm/accounts/\[accountUid\]/memberships/\[membershipUid\]

Update an account membership. This is the method by which you can change the primary contact of an account.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Bodyraw

```javascript
{
    "Account": {"Uid": "abcd1234"},
    "Person": {"Uid": "abcd1234"},
    "IsPrimary": "true"
}
```

Example Request

Update person account membership

curl

```curl
curl --location -g --request PUT '{{url}}/crm/accounts/[accountUid]/memberships/[membershipUid]' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data '{
    "Account": {"Uid": "abcd1234"},
    "Person": {"Uid": "abcd1234"},
    "IsPrimary": "true"
}'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### DELETEDelete account

{{url}}/crm/accounts/\[accountUid\]

Delete an account record.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Example Request

Delete account

curl

```curl
curl --location -g --request DELETE '{{url}}/crm/accounts/[accountUid]' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data ''
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### DELETERemove person from account

{{url}}/crm/accounts/\[accountUid\]/memberships/\[membershipUid\]

Remove a person from an account. Note that you cannot remove the primary contact of an account.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Example Request

Remove person from account

curl

```curl
curl --location -g --request DELETE '{{url}}/crm/accounts/[accountUid]/memberships/[membershipUid]' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data ''
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

## Activities

### GETGet all activities

{{url}}/activities?ActivityType=100&EntityType=1&offset=0&orderBy=ActivityDateTime+DESC

Retrieves all the activites. One or multiple paraneters can be defined to filter the results.

Activity Types

Custom = 10,
Note = 50,
Email = 51,
PhoneCall = 52,
Meeting = 53,
AccountCreated = 100,
AccountUpdated = 101,
AccountAddPerson = 102,
AccountStageUpdated = 103,
AccountDeleted=104,
AccountBillingInformationUpdated=105,
PersonCreated = 200,
PersonUpdated = 201,
PersonDeleted = 202,
PersonLogin = 203,
PersonListSubscribed = 204,
PersonListUnsubscribed = 205,
PersonSegmentAdded = 206,
PersonSegmentRemoved = 207,
PersonEmailOpened = 208,
PersonEmailClicked = 209,
PersonEmailBounce = 210,
PersonEmailSpam = 211,
PersonSupportTicketCreated = 212,
PersonSupportTicketUpdated = 213,
DealCreated = 300,
DealUpdated = 301,
DealAddPerson = 302,
DealAddAccount = 303

Entity Types

Account = 1,
Person = 2,
Deal = 3

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

PARAMS

ActivityType

100

EntityType

1

offset

0

The page number of the results to return

orderBy

ActivityDateTime+DESC

Example Request

Get all activities

View More

curl

```curl
curl --location -g '{{url}}/activities?ActivityType=100&EntityType=1&offset=0&orderBy=ActivityDateTime%2BDESC' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json'
```

200 OK

Example Response

- Body
- Headers (9)

View More

json

```json
{
  "metadata": {
    "limit": 100,
    "offset": 0,
    "total": 1
  },
  "items": [\
    {\
      "Title": "Account created",\
      "Description": "New Deal Match created",\
      "ActivityData": null,\
      "ActivityDateTime": "2018-04-25T14:26:56",\
      "ActivityType": 100,\
      "EntityType": 1,\
      "EntityUid": "aOW4JYQg",\
      "Uid": "4XQYAgQP",\
      "Created": "2018-04-25T10:26:56",\
      "Updated": "2018-04-25T10:26:56"\
    }\
  ]
}
```

Cache-Control

no-cache

Content-Length

10412

Content-Type

application/json; charset=utf-8

Date

Fri, 21 Sep 2018 15:21:18 GMT

Expires

-1

Pragma

no-cache

Server

Microsoft-IIS/10.0

X-AspNet-Version

4.0.30319

X-Powered-By

ASP.NET

### POSTAdd custom activity

{{url}}/activities/customactivity

This method allows you to record custom events associated to an account, people or deal. These activities would then show up on the activity feed of the corresponding entity and can be leveraged to trigger drip campaigns and other automation.

For integration with drip campaigns make sure that what you pass in the Title property matches the start / stop value specified for the campaign.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Bodyraw

```javascript
{
    "Title": "New custom activity for an account",
    "Description": "Custom activity description",
    "ActivityData": "A string, can be used to store store serialized JSON",
    "EntityType": 1,
    "EntityUid": "4XQYqQPB"
}
```

Example Request

Add custom activity

curl

```curl
curl --location -g '{{url}}/activities/customactivity' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data ' {
    "Title": "New custom activity for an account",
    "Description": "Custom activity description",
    "ActivityData": "A string, can be used to store store serialized JSON",
    "EntityType": 1,
    "EntityUid": "4XQYqQPB"
}'
```

200 OK

Example Response

- Body
- Headers (10)

json

```json
{
  "Title": "New custom activity for an account",
  "Description": "Custom activity description",
  "ActivityData": "A string, can be used to store store serialized JSON",
  "EntityType": 1,
  "EntityUid": "4XQYqQPB"
}
```

Cache-Control

no-cache

Content-Length

314

Content-Type

application/json; charset=utf-8

Date

Wed, 12 Dec 2018 20:02:35 GMT

Expires

-1

Pragma

no-cache

Server

Microsoft-IIS/10.0

X-AspNet-Version

4.0.30319

X-Powered-By

ASP.NET

X-SourceFiles

=?UTF-8?B?QzpcRGV2ZWxvcG1lbnRcT3V0c2V0YVxPdXRzZXRhLldlYi5DbGllbnRcYXBpXHYxXGFjdGl2aXRpZXNcY3VzdG9tYWN0aXZpdHk=?=

## Deals

### GETGet all deals

{{url}}/crm/deals

Retrieves all the deals associated with your account.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Example Request

Get all deals

curl

```curl
curl --location -g '{{url}}/crm/deals' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### GETGet deal

{{url}}/crm/deals/\[dealUid\]

Retrieves one deal associated with your account.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Example Request

Get deal

curl

```curl
curl --location -g '{{url}}/crm/deals/[dealUid]' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### POSTAdd deal

{{url}}/crm/deals

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Bodyraw

View More

```javascript
{
  "Name": "New",
  "DealPipelineStage": {"Uid": "4XQYqQPB"},
  "Amount": 12,
  "AssignedToPersonClientIdentifier": "xxxxxxx",
  "Account": {"Uid": "4XQYqQPB"},
   "DealPeople": [\
        {\
          "Person": {"Uid": "8vWy1Wbw"}\
        }\
      ]
}
```

Example Request

Add deal

View More

curl

```curl
curl --location -g '{{url}}/crm/deals' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data '{
  "Name": "New",
  "DealPipelineStage": {"Uid": "4XQYqQPB"},
  "Amount": 12,
  "AssignedToPersonClientIdentifier": "xxxxxxx",
  "Account": {"Uid": "4XQYqQPB"},
   "DealPeople": [\
        {\
          "Person": {"Uid": "8vWy1Wbw"}\
        }\
      ]
}'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### DELETEDelete deal

{{url}}/crm/deals/\[dealUid\]

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Example Request

Delete deal

curl

```curl
curl --location -g --request DELETE '{{url}}/crm/deals/[dealUid]' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data ''
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### PUTUpdate deal

{{url}}/crm/deals/\[dealUid\]

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Bodyraw

View More

```javascript
{
  "Name": "Test",
  "DealPipelineStage": {"Uid": "wZmNZm2O"},
  "Amount": 12,
  "AssignedToPersonClientIdentifier": "xxxxxxx",
  "Account": {"Uid": "4XQYqQPB"},
  "Uid": "[dealUid]",
   "DealPeople": [\
        {\
          "Person": {"Uid": "4XQYqQPB"}\
        }\
      ]
}
```

Example Request

Update deal

View More

curl

```curl
curl --location -g --request PUT '{{url}}/crm/deals/[dealUid]' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data '{
  "Name": "Test",
  "DealPipelineStage": {"Uid": "wZmNZm2O"},
  "Amount": 12,
  "AssignedToPersonClientIdentifier": "xxxxxxx",
  "Account": {"Uid": "4XQYqQPB"},
  "Uid": "[dealUid]",
   "DealPeople": [\
        {\
          "Person": {"Uid": "4XQYqQPB"}\
        }\
      ]
}'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

## Marketing

### GETGet all subscribers to list

{{url}}/email/lists/exmepWVG/subscriptions

Retrieves all the people subscribing to an email list.

HEADERS

Authorization

{{authorizationtoken}}

Example Request

Get all subscribers to list

curl

```curl
curl --location -g '{{url}}/email/lists/[listId]/subscriptions' \
--header 'Authorization: {{authorizationtoken}}'
```

200 OK

Example Response

- Body
- Headers (10)

View More

json

```json
{
  "metadata": {
    "limit": 100,
    "offset": 0,
    "total": 2
  },
  "items": [\
    {\
      "EmailList": {\
        "Name": "My new list",\
        "WelcomeSubject": null,\
        "WelcomeBody": "Welcome",\
        "WelcomeFromName": null,\
        "WelcomeFromEmail": null,\
        "EmailListPerson": null,\
        "CountSubscriptionsActive": 0,\
        "CountSubscriptionsBounce": 0,\
        "CountSubscriptionsSpam": 0,\
        "CountSubscriptionsUnsubscribed": 0,\
        "Uid": "exmepWVG",\
        "Created": "2017-09-11T12:28:56",\
        "Updated": "2017-09-11T12:28:56"\
      },\
      "Person": {\
        "Email": "new@subscriber.com",\
        "FirstName": "New",\
        "LastName": "Subscriber",\
        "MailingAddress": null,\
        "PhoneMobile": "",\
        "PhoneWork": "",\
        "Timezone": null,\
        "EmailBounceDateTime": null,\
        "EmailSpamDateTime": null,\
        "EmailUnsubscribeDateTime": null,\
        "EmailLastDeliveredDateTime": null,\
        "PersonAccount": null,\
        "FullName": "New Subscriber",\
        "Uid": "wZmNDZ92",\
        "Created": "2018-01-29T14:06:33",\
        "Updated": "2018-01-29T14:06:33"\
      },\
      "EmailListSubscriberStatus": 1,\
      "SubscribedDate": "2018-01-29T14:06:34",\
      "ConfirmedDate": null,\
      "UnsubscribedDate": null,\
      "CleanedDate": null,\
      "WelcomeEmailDeliverDateTime": null,\
      "WelcomeEmailOpenDateTime": null,\
      "UnsubscribeReason": null,\
      "UnsubscribeReasonOther": null,\
      "SendWelcomeEmail": false,\
      "Uid": "KL9ngWZG",\
      "Created": "2018-01-29T14:06:34",\
      "Updated": "2018-01-29T14:06:34"\
    },\
    {\
      "EmailList": {\
        "Name": "My new list",\
        "WelcomeSubject": null,\
        "WelcomeBody": "Welcome",\
        "WelcomeFromName": null,\
        "WelcomeFromEmail": null,\
        "EmailListPerson": null,\
        "CountSubscriptionsActive": 0,\
        "CountSubscriptionsBounce": 0,\
        "CountSubscriptionsSpam": 0,\
        "CountSubscriptionsUnsubscribed": 0,\
        "Uid": "exmepWVG",\
        "Created": "2017-09-11T12:28:56",\
        "Updated": "2017-09-11T12:28:56"\
      },\
      "Person": {\
        "Email": "new@example.com",\
        "FirstName": "",\
        "LastName": "",\
        "MailingAddress": null,\
        "PhoneMobile": "",\
        "PhoneWork": "",\
        "Timezone": null,\
        "EmailBounceDateTime": null,\
        "EmailSpamDateTime": null,\
        "EmailUnsubscribeDateTime": null,\
        "EmailLastDeliveredDateTime": null,\
        "PersonAccount": null,\
        "FullName": "admin@outsetaa.com",\
        "Uid": "y7maBrQE",\
        "Created": "2017-01-23T07:27:35",\
        "Updated": "2017-03-31T15:53:15"\
      },\
      "EmailListSubscriberStatus": 1,\
      "SubscribedDate": "2018-01-29T14:09:21",\
      "ConfirmedDate": null,\
      "UnsubscribedDate": null,\
      "CleanedDate": null,\
      "WelcomeEmailDeliverDateTime": null,\
      "WelcomeEmailOpenDateTime": null,\
      "UnsubscribeReason": null,\
      "UnsubscribeReasonOther": null,\
      "SendWelcomeEmail": false,\
      "Uid": "dpWr3mnq",\
      "Created": "2018-01-29T14:09:21",\
      "Updated": "2018-01-29T14:09:21"\
    }\
  ]
}
```

Cache-Control

no-cache

Content-Length

2278

Content-Type

application/json; charset=utf-8

Date

Mon, 29 Jan 2018 19:14:55 GMT

Expires

-1

Pragma

no-cache

Server

Microsoft-IIS/10.0

X-AspNet-Version

4.0.30319

X-Powered-By

ASP.NET

X-SourceFiles

=?UTF-8?B?QzpcRGV2ZWxvcG1lbnRcT3V0c2V0YVxPdXRzZXRhLldlYi5DbGllbnRcYXBpXHYxXGVtYWlsXGxpc3RzXGV4bWVwV1ZHXHN1YnNjcmlwdGlvbnM=?=

### POSTSubscribe new person to list

{{url}}/email/lists/\[listId\]/subscriptions

This method adds a new person as a subscriber to an existing email list. The SendWelcomeEmail property determines if the person added to the email list is sent a welcome email. The property defaults to false.

HEADERS

Content-Type

application/json

Authorization

{{authorizationtoken}}

Bodyraw

```javascript
{
	"EmailList": {"Uid": "exmepWVG"},
	"Person": {"Email": "new@subscriber.com", "FirstName": "New", "LastName": "Subscriber" },
    "SendWelcomeEmail": "true/false"
}
```

Example Request

Subscribe new person to list

curl

```curl
curl --location -g '{{url}}/email/lists/[listId]/subscriptions' \
--header 'Content-Type: application/json' \
--header 'Authorization: {{authorizationtoken}}' \
--data-raw '{
	"EmailList": {"Uid": "exmepWVG"},
	"Person": {"Email": "new@subscriber.com", "FirstName": "New", "LastName": "Subscriber" },
    "SendWelcomeEmail": "true/false"
}'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### POSTSubscribe existing person to list

{{url}}/email/lists/\[listId\]/subscriptions

This method adds an existing person as a subscriber to an existing email list. The SendWelcomeEmail property determines if the person added to the email list is sent a welcome email. The property defaults to false.

HEADERS

Content-Type

application/json

Authorization

{{authorizationtoken}}

Bodyraw

```javascript
{
	"EmailList": {"Uid": "exmepWVG"},
	"Person": {"Uid": "y7maBrQE" },
    "SendWelcomeEmail": "true/false"
}
```

Example Request

Subscribe existing person to list

curl

```curl
curl --location -g '{{url}}/email/lists/[listId]/subscriptions' \
--header 'Content-Type: application/json' \
--header 'Authorization: {{authorizationtoken}}' \
--data '{
	"EmailList": {"Uid": "exmepWVG"},
	"Person": {"Uid": "y7maBrQE" },
    "SendWelcomeEmail": "true/false"
}'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### DELETERemove subscriber from list

{{url}}/email/lists/\[listId\]/subscriptions/KL9ngWZG

This method removes a subscriber from an email list.

HEADERS

Authorization

{{authorizationtoken}}

Example Request

Remove subscriber from list

curl

```curl
curl --location -g --request DELETE '{{url}}/email/lists/[list_UID]/subscriptions/[subscription_UID]' \
--header 'Authorization: {{authorizationtoken}}' \
--data ''
```

200 OK

Example Response

- Body
- Headers (9)

No response body

This request doesn't return any response body

Cache-Control

no-cache

Content-Length

0

Date

Mon, 29 Jan 2018 19:17:35 GMT

Expires

-1

Pragma

no-cache

Server

Microsoft-IIS/10.0

X-AspNet-Version

4.0.30319

X-Powered-By

ASP.NET

X-SourceFiles

=?UTF-8?B?QzpcRGV2ZWxvcG1lbnRcT3V0c2V0YVxPdXRzZXRhLldlYi5DbGllbnRcYXBpXHYxXGVtYWlsXGxpc3RzXGV4bWVwV1ZHXHN1YnNjcmlwdGlvbnNcS0w5bmdXWkc=?=

## Support

### GETGet all cases

{{url}}/support/cases

**Case status**

| Name | Value |
| --- | --- |
| Open | 1 |
| Closed | 2 |

**Case source**

| Name | Value |
| --- | --- |
| Website | 1 |
| Email | 2 |
| Facebook | 3 |
| Twitter | 4 |

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Example Request

Get all cases

curl

```curl
curl --location -g '{{url}}/support/cases' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json'
```

200 OK

Example Response

- Body
- Headers (10)

View More

json

```json
{
  "metadata": {
    "limit": 100,
    "offset": 0,
    "total": 1
  },
  "items": [\
    {\
      "SubmittedDateTime": "0001-01-01T00:00:00",\
      "FromPerson": {\
        "Email": "new@support.com",\
        "FirstName": "New",\
        "LastName": "Support",\
        "MailingAddress": null,\
        "PhoneMobile": "",\
        "PhoneWork": "",\
        "Timezone": null,\
        "EmailBounceDateTime": null,\
        "EmailSpamDateTime": null,\
        "EmailUnsubscribeDateTime": null,\
        "EmailLastDeliveredDateTime": null,\
        "PersonAccount": null,\
        "FullName": "New Support",\
        "Uid": "bB9l5DW8",\
        "Created": "2017-01-23T08:54:06",\
        "Updated": "2017-03-31T16:29:05"\
      },\
      "AssignedToPersonClientIdentifier": "y7maBrQE",\
      "Subject": "This is a support ticket",\
      "Body": "This is the body",\
      "UserAgent": null,\
      "Status": 2,\
      "Source": 1,\
      "CaseHistories": [\
        {\
          "HistoryDateTime": "2017-03-29T18:23:22",\
          "Case": null,\
          "AgentName": "First Agent",\
          "Comment": " First Agent assigned this case to  ",\
          "Type": 5,\
          "SeenDateTime": null,\
          "ClickDateTime": null,\
          "Uid": "wZmNZm2O",\
          "Created": "2017-03-29T14:23:22",\
          "Updated": "2017-03-29T14:23:22"\
        }\
      ],\
      "Uid": "wZmNZm2O",\
      "Created": "2017-03-29T13:45:16",\
      "Updated": "2017-03-29T14:48:30"\
    }\
  ]
}
```

Cache-Control

no-cache

Content-Length

22652

Content-Type

application/json; charset=utf-8

Date

Mon, 29 Jan 2018 19:27:16 GMT

Expires

-1

Pragma

no-cache

Server

Microsoft-IIS/10.0

X-AspNet-Version

4.0.30319

X-Powered-By

ASP.NET

X-SourceFiles

=?UTF-8?B?QzpcRGV2ZWxvcG1lbnRcT3V0c2V0YVxPdXRzZXRhLldlYi5DbGllbnRcYXBpXHYxXHN1cHBvcnRcY2FzZXM=?=

### GETGet all cases by person Uid

{{url}}/support/cases?FromPerson.Uid=\[personId\]

Retrieves all the cases from a person.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

PARAMS

FromPerson.Uid

\[personId\]

Example Request

Get all cases by person Uid

curl

```curl
curl --location -g '{{url}}/support/cases?FromPerson.Uid=[personId]' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### GETGet all cases by person email

{{url}}/support/cases?FromPerson.Email=new@example.com

Retrieves all the cases from a person.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

PARAMS

FromPerson.Email

new@example.com

Example Request

Get all cases by person email

curl

```curl
curl --location -g '{{url}}/support/cases?FromPerson.Email=new%40example.com' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### POSTAdd case

{{url}}/support/cases?sendAutoResponder=true

Adds a case into the support system.

Set sendAutoResponder=false if you'd like the system not to send an automatic message that the ticket has been created.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

PARAMS

sendAutoResponder

true

Bodyraw

```javascript
{
  "FromPerson": {"Uid": "bB9l5DW8"},
  "Subject": "This is the third case example",
  "Body": "This is the body",
  "Source": 2

}
```

Example Request

Add case

curl

```curl
curl --location -g '{{url}}/support/cases?sendAutoResponder=true' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data '{
  "FromPerson": {"Uid": "bB9l5DW8"},
  "Subject": "This is the third case example",
  "Body": "This is the body",
  "Source": 2

}'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### POSTAdd client response

{{url}}/support/cases/\[caseUid\]/clientresponse/\[comment\]

Adds a response to the case from the person that opened the case.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Example Request

Add client response

curl

```curl
curl --location -g --request POST '{{url}}/support/cases/wZmNZm2O/clientresponse/Thank you so much' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data ''
```

200 OK

Example Response

- Body
- Headers (8)

No response body

This request doesn't return any response body

Cache-Control

no-cache

Content-Length

0

Date

Wed, 19 Jun 2019 13:45:50 GMT

Expires

-1

Pragma

no-cache

Server

Microsoft-IIS/10.0

X-AspNet-Version

4.0.30319

X-Powered-By

ASP.NET

### POSTAdd reply

{{url}}/support/cases/\[caseUid\]/replies

Adds a reply from an agent to a support case.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Bodyraw

```javascript
{
  "AgentName": "Agent A",
  "Case": {"Uid": "[caseUid]"},
  "Comment": "This is a reply"
}
```

Example Request

Add reply

curl

```curl
curl --location -g '{{url}}/support/cases/[caseUid]/replies' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data '{
  "AgentName": "Agent A",
  "Case": {"Uid": "[caseUid]"},
  "Comment": "This is a reply"
}'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### GETGet all knowledge base categories

{{url}}/support/categories

Example Request

Get all knowledge base categories

curl

```curl
curl --location -g '{{url}}/support/categories'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### GETGet all knowledge base articles

{{url}}/support/articles

Example Request

Get all knowledge base articles

curl

```curl
curl --location -g '{{url}}/support/articles'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### GETGet knowledge base article

{{url}}/support/articles/\[articleUid\]

Example Request

Get knowledge base article

curl

```curl
curl --location -g '{{url}}/support/articles/[articleUid]'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

## Billing

## Plan Families

### GETGet all plan families

{{url}}/billing/planfamilies

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Example Request

Get all plan families

curl

```curl
curl --location -g '{{url}}/billing/planfamilies' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

## Plans

### GETGet all plans

{{url}}/billing/plans

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Example Request

Get all plans

curl

```curl
curl --location -g '{{url}}/billing/plans' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

## Add-ons

### POSTAdd usage for add on

{{url}}/billing/usage

This method adds a usage entry for an add on that bills for usage at the end of the month.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Bodyraw

```javascript
{
	"UsageDate": "2017-12-01T10:00:00",
	"Amount": 10,
	"SubscriptionAddOn":  {	"Uid": "KjW7e4Qq" }

}
```

Example Request

Add usage for add on

curl

```curl
curl --location -g '{{url}}/billing/usage' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data '{
	"UsageDate": "2017-12-01T10:00:00",
	"Amount": 10,
	"SubscriptionAddOn":  {	"Uid": "KjW7e4Qq" }

}'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

## Discounts

### POSTAdd discount

{{url}}/billing/discountcoupons

Payload notes:

- Only one of `AmountOff` or `PercentOff` should be set.
- Duration values:

  - 1 - Forever
  - 2 - Once
  - 3 - Repeating (DurationInMonths must be set)

- Optional properties

  - `DiscountCouponPlans`
  - `DurationInMonths`
  - `RedeemBy`

Bodyraw (json)

View More

json

```json
{
    "UniqueIdentifier": "100OFF",
    "Name": "100% off",
    "IsActive": true,
    "AmountOff": 15,
    "PercentOff": 100,
    "Duration": 1,
    "DurationInMonths": 5,
    "MaxRedemptions": 15,
    "RedeemBy": "2034-12-31T00:00:00Z",
    "DiscountCouponPlans": [\
        { "Uid": "abcd1234" }\
    ]
}
```

Example Request

Add discount

View More

curl

```curl
curl --location -g '{{url}}/billing/discountcoupons' \
--data '{
    "UniqueIdentifier": "100OFF",
    "Name": "100% off",
    "IsActive": true,
    "AmountOff": 15,
    "PercentOff": 100,
    "Duration": 1,
    "DurationInMonths": 5,
    "MaxRedemptions": 15,
    "RedeemBy": "2034-12-31T00:00:00Z",
    "DiscountCouponPlans": [\
        { "Uid": "abcd1234" }\
    ]
}'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

## Subscriptions

### GETGet subscription

{{url}}/billing/subscriptions/\[subscriptionUid\]

HEADERS

Authorization

bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1bmlxdWVfbmFtZSI6ImRpbWl0cmlzQG91dHNldGEuY29tIiwiZ2l2ZW5fbmFtZSI6IkRpbWl0cmlzIiwiZmFtaWx5X25hbWUiOiJHZW9yZ2Frb3BvdWxvcyIsImVtYWlsIjoiZGltaXRyaXNAb3V0c2V0YS5jb20iLCJuYW1laWQiOiI0WFFZcVFQQiIsImF1ZCI6ImxvY2FsaG9zdCIsImlzcyI6ImxvY2FsaG9zdCIsImV4cCI6MTUzNzg4NzgyMSwibmJmIjoxNTA2MzUxODIxfQ.5WmPUK7\_J15vBOFyseycjZcXwfTioIRlqpArIooZScU

Content-Type

application/json

Example Request

Get subscription

curl

```curl
curl --location -g '{{url}}/billing/subscriptions/z49E5z97' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json'
```

200 OK

Example Response

- Body
- Headers (10)

View More

json

```json
{
  "BillingRenewalTerm": 2,
  "Account": {
    "Name": "First API account",
    "ClientIdentifier": null,
    "BillingAddress": null,
    "MailingAddress": null,
    "AccountStage": 3,
    "PaymentInformation": null,
    "PersonAccount": null,
    "Subscriptions": null,
    "Uid": "wDQ2w9V6",
    "Created": "0001-01-01T00:00:00",
    "Updated": "2018-01-29T12:25:28"
  },
  "Plan": {
    "Name": "Core",
    "PlanFamily": null,
    "IsQuantityEditable": false,
    "MinimumQuantity": 0,
    "MonthlyRate": 99,
    "AnnualRate": 500,
    "SetupFee": 0,
    "IsTaxable": false,
    "TrialPeriodDays": 0,
    "UnitOfMeasure": "",
    "PlanAddOns": null,
    "Uid": "VdQG094Y",
    "Created": "2017-09-25T15:24:51",
    "Updated": "2018-01-24T11:07:04"
  },
  "Quantity": null,
  "StartDate": "2018-01-29T21:00:04",
  "EndDate": null,
  "RenewalDate": "2019-01-29T21:00:04",
  "NewRequiredQuantity": null,
  "IsPlanUpgradeRequired": false,
  "PlanUpgradeRequiredMessage": null,
  "SubscriptionAddOns": [\
    {\
      "BillingRenewalTerm": 2,\
      "Subscription": null,\
      "AddOn": null,\
      "Quantity": null,\
      "StartDate": "2018-01-29T21:00:04",\
      "EndDate": null,\
      "RenewalDate": "2019-01-29T21:00:04",\
      "NewRequiredQuantity": null,\
      "Uid": "KjW7e4Qq",\
      "Created": "2018-01-29T16:00:05",\
      "Updated": "2018-01-29T16:00:05"\
    }\
  ],
  "Uid": "z49E5z97",
  "Created": "2018-01-29T16:00:05",
  "Updated": "2018-01-29T16:00:05"
}
```

Cache-Control

no-cache

Content-Length

1176

Content-Type

application/json; charset=utf-8

Date

Mon, 29 Jan 2018 21:09:58 GMT

Expires

-1

Pragma

no-cache

Server

Microsoft-IIS/10.0

X-AspNet-Version

4.0.30319

X-Powered-By

ASP.NET

X-SourceFiles

=?UTF-8?B?QzpcRGV2ZWxvcG1lbnRcT3V0c2V0YVxPdXRzZXRhLldlYi5DbGllbnRcYXBpXHYxXGJpbGxpbmdcc3Vic2NyaXB0aW9uc1x6NDlFNXo5Nw==?=

### POSTAdd first time subscription (preview)

{{url}}/billing/subscriptions/compute-charge-summary

This method is used to see what the initial or renewal invoice would look like if an account were to register with this subscription. The method returns an invoice object with information about the amount outstanding that can be used to show the user a confirmation page.

**Querystring parameters**

| Name | Value |
| --- | --- |
| asOf | now (default), renewal |

**BillingRenewalTerm**

| Name | Value |
| --- | --- |
| Monthly | 1 |
| Yearly | 2 |
| Quarterly | 3 |
| OneTime | 4 |

HEADERS

Content-Type

application/json

Bodyraw

```javascript
{
	"Plan": {"Uid": "DMQvDbWY"},
	"BillingRenewalTerm": 1,
	"Account": { }
}
```

Example Request

Add first time subscription (preview)

curl

```curl
curl --location -g '{{url}}/billing/subscriptions/change-subscription-preview' \
--header 'Content-Type: application/json' \
--data '{
	"Plan": {"Uid": "VdQG094Y"},
	"BillingRenewalTerm": 1,
	"Account": { }
}'
```

200 OK

Example Response

- Body
- Headers (10)

View More

json

```json
{
  "InvoiceDate": "2018-01-29T20:43:54.5546764Z",
  "Number": 10035,
  "BillingInvoiceStatus": 1,
  "Subscription": {
    "BillingRenewalTerm": 1,
    "Account": null,
    "Plan": null,
    "Quantity": null,
    "StartDate": "2018-01-29T20:43:54.5546764Z",
    "EndDate": null,
    "RenewalDate": "2018-02-28T20:43:54.5546764Z",
    "NewRequiredQuantity": null,
    "IsPlanUpgradeRequired": false,
    "PlanUpgradeRequiredMessage": null,
    "SubscriptionAddOns": null,
    "Uid": null,
    "Created": "0001-01-01T00:00:00",
    "Updated": "0001-01-01T00:00:00"
  },
  "Amount": 99,
  "AmountOutstanding": 99,
  "InvoiceLineItems": [\
    {\
      "StartDate": "2018-01-29T20:43:54.5546764Z",\
      "EndDate": "2018-02-27T20:43:54.5546764Z",\
      "Description": "Core",\
      "UnitOfMeasure": "",\
      "Quantity": null,\
      "Rate": 99,\
      "Amount": 99,\
      "Tax": 0,\
      "Invoice": null,\
      "Uid": null,\
      "Created": "0001-01-01T00:00:00",\
      "Updated": "0001-01-01T00:00:00"\
    }\
  ],
  "IsUserGenerated": false,
  "Uid": null,
  "Created": "0001-01-01T00:00:00",
  "Updated": "0001-01-01T00:00:00"
}
```

Cache-Control

no-cache

Content-Length

912

Content-Type

application/json; charset=utf-8

Date

Mon, 29 Jan 2018 20:43:54 GMT

Expires

-1

Pragma

no-cache

Server

Microsoft-IIS/10.0

X-AspNet-Version

4.0.30319

X-Powered-By

ASP.NET

X-SourceFiles

=?UTF-8?B?QzpcRGV2ZWxvcG1lbnRcT3V0c2V0YVxPdXRzZXRhLldlYi5DbGllbnRcYXBpXHYxXGJpbGxpbmdcc3Vic2NyaXB0aW9uc1xmaXJzdHRpbWVzdWJzY3JpcHRpb25wcmV2aWV3?=

### PUTAdd first time subscription

{{url}}/billing/subscriptions/firsttimesubscription

This method is used when adding a subscription to an account for the first time. The method returns an invoice object with information about the amount outstanding.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Bodyraw

```javascript
{
	"Plan": { "Uid": "VdQG094Y" },
	"BillingRenewalTerm": 1,
	"Account": { "Uid": "wDQ2w9V6" }
}
```

Example Request

Add first time subscription

curl

```curl
curl --location -g --request PUT '{{url}}/billing/subscriptions/firsttimesubscription' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data '{
	"Plan": { "Uid": "VdQG094Y" },
	"BillingRenewalTerm": 1,
	"Account": { "Uid": "wDQ2w9V6" }
}'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### PUTAdd first time subscription with add ons

{{url}}/billing/subscriptions/firsttimesubscription

This method is used when adding a subscription to an account for the first time. The method returns an invoice object with information about the amount outstanding.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Bodyraw

```javascript
{
	"Plan": {"Uid": "VdQG094Y"},
	"BillingRenewalTerm": 1,
	"Account": {	"Uid": "KL9ngWZG" },
	"SubscriptionAddOns": [{\
			"AddOn": {	"Uid": "By9q8QAP" }\
	}]
}
```

Example Request

Add first time subscription with add ons

curl

```curl
curl --location -g --request PUT '{{url}}/billing/subscriptions/firsttimesubscription' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data '{
	"Plan": {"Uid": "VdQG094Y"},
	"BillingRenewalTerm": 1,
	"Account": {	"Uid": "KL9ngWZG" },
	"SubscriptionAddOns": [{\
			"AddOn": {	"Uid": "By9q8QAP" }\
	}]
}'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### PUTChange subscription (preview)

{{url}}/billing/subscriptions/\[subscriptionUid\]/changesubscriptionpreview

This method is used when changing a subscription on an account. The method returns an invoice object with information about the amount outstanding that can be used to show the user a confirmation page.

This method does not committ the subscription to the database. Rather it can be used as a preview.

**Renewal term**

| Name | Value |
| --- | --- |
| Monthly | 1 |
| Annual | 2 |

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Bodyraw

```javascript
{
	"Plan": {"Uid": "VdQG094Y"},
	"BillingRenewalTerm": 2,
	"Account": {	"Uid": "wDQ2w9V6" }
}
```

Example Request

Change subscription (preview)

View More

curl

```curl
curl --location -g --request PUT '{{url}}/billing/subscriptions/[subscriptionUid]/changesubscriptionpreview' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data '{
	"Plan": {"Uid": "VdQG094Y"},
	"BillingRenewalTerm": 2,
	"Account": {	"Uid": "wDQ2w9V6" }
}'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### PUTChange subscription

{{url}}/billing/subscriptions/\[subscriptionUid\]/changesubscription

This method is used when changing a subscription on an account. The method returns an invoice object with information about the amount outstanding.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Bodyraw

```javascript
{
	"Plan": {
        "Uid": "VdQG094Y"
    },
	"BillingRenewalTerm": 2,
	"Account": {
        "Uid": "wDQ2w9V6"
    }
}
```

Example Request

Change subscription

View More

curl

```curl
curl --location -g --request PUT '{{url}}/billing/subscriptions/[subscriptionUid]/changesubscription' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data '{
	"Plan": {
        "Uid": "VdQG094Y"
    },
	"BillingRenewalTerm": 2,
	"Account": {
        "Uid": "wDQ2w9V6"
    }
}'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### PUTSet subscription upgrade required

{{url}}/billing/subscriptions/\[subscriptionUid\]/setsubscriptionupgraderequired

Use this method to indicase that an updgrade of plan is required. When a subscription is flagged next time the user authenticates the authentication widget will prompt the user to change plan.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Bodyraw

```javascript
{
	"Uid": "z49E5z97",
	"NewRequiredQuantity": null,
    "IsPlanUpgradeRequired": true,
    "PlanUpgradeRequiredMessage": "This is the message that will display to user"

}
```

Example Request

Set subscription upgrade required

View More

curl

```curl
curl --location -g --request PUT '{{url}}/billing/subscriptions/[subscriptionUid]/setsubscriptionupgraderequired' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data '{
	"Uid": "z49E5z97",
	"NewRequiredQuantity": null,
    "IsPlanUpgradeRequired": true,
    "PlanUpgradeRequiredMessage": "This is the message that will display to user"

}'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### PUTExtend trial subscription

{{url}}/crm/accounts/extendtrial/\[accountUid\]/\[date\_in\_yyyy-MM-DD\]

Use this method to extend the date that a trial subscription expires.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Example Request

Extend trial subscription

curl

```curl
curl --location -g --request PUT '{{url}}/crm/accounts/extendtrial/[accountUid]/[date_in_yyyy-MM-DD]' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data ''
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### POSTAdd add-on to subscription

{{url}}/billing/subscriptionaddons

Bodyraw (json)

json

```json
{
    "AddOn": { "Uid": "z49E5z97" },
    "BillingRenewalTerm": 1,
    "Quantity": 1,
    "Subscription": { "Uid": "z49E5z97" }
}
```

Example Request

Add add-on to subscription

curl

```curl
curl --location -g '{{url}}/billing/subscriptionaddons' \
--data '{
    "AddOn": { "Uid": "z49E5z97" },
    "BillingRenewalTerm": 1,
    "Quantity": 1,
    "Subscription": { "Uid": "z49E5z97" }
}'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

### POSTAdd discount to subscription

billing/subscriptions/{subscriptionUid}/discounts/{discountUid}

Add a discount to a subscription.

Example Request

Add discount to subscription

curl

```curl
curl --location -g --request POST 'billing/subscriptions/{subscriptionUid}/discounts/{discountUid}'
```

Example Response

- Body
- Headers (0)

No response body

This request doesn't return any response body

No response headers

This request doesn't return any response headers

## Invoices

### POSTAdd new invoice

{{url}}/billing/invoices

Use this API to create an add-hoc invoice for a given account.

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Bodyraw

View More

```javascript
{
	"Subscription": {
        "Uid": "4XQY8qmP"
    },
	"InvoiceDate": "2017-12-30T00:00:00",
	"InvoiceLineItems": [\
        {\
            "Description": "Manual invoice",\
            "Amount": 20\
        },\
        {\
            "Description": "Manual invoice 2",\
            "Amount": 20\
        }\
    ]
}
```

Example Request

Add new invoice

View More

curl

```curl
curl --location -g '{{url}}/billing/invoices' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json' \
--data '{
	"Subscription": {"Uid": "dpWr3mnq"},
	"InvoiceDate": "2017-12-30T00:00:00",
	"InvoiceLineItems": [ {	"Description": "Manual invoice",\
									"Amount": 20},\
						 {	"Description": "Manual invoice 2",\
									"Amount": 20}\
			]
}'
```

200 OK

Example Response

- Body
- Headers (9)

View More

json

```json
{
  "InvoiceDate": "2017-12-30T00:00:00",
  "Number": 1094,
  "BillingInvoiceStatus": 1,
  "Subscription": {
    "BillingRenewalTerm": 1,
    "Account": null,
    "Plan": null,
    "Quantity": null,
    "StartDate": "2017-11-27T05:00:00",
    "EndDate": null,
    "RenewalDate": "2019-03-26T05:00:00",
    "NewRequiredQuantity": null,
    "IsPlanUpgradeRequired": false,
    "PlanUpgradeRequiredMessage": null,
    "SubscriptionAddOns": null,
    "Uid": "dpWr3mnq",
    "Created": "2017-11-27T18:19:45",
    "Updated": "2019-02-27T02:47:30"
  },
  "Amount": 40,
  "AmountOutstanding": 40,
  "InvoiceLineItems": [\
    {\
      "StartDate": null,\
      "EndDate": null,\
      "Description": "Manual invoice",\
      "UnitOfMeasure": "",\
      "Quantity": null,\
      "Rate": 0,\
      "Amount": 20,\
      "Tax": 0,\
      "Invoice": null,\
      "Uid": "z49EjjW7",\
      "Created": "2019-06-12T19:24:55.6898226Z",\
      "Updated": "2019-06-12T19:24:55.6898226Z"\
    },\
    {\
      "StartDate": null,\
      "EndDate": null,\
      "Description": "Manual invoice 2",\
      "UnitOfMeasure": "",\
      "Quantity": null,\
      "Rate": 0,\
      "Amount": 20,\
      "Tax": 0,\
      "Invoice": null,\
      "Uid": "owmjkBQV",\
      "Created": "2019-06-12T19:24:55.6898226Z",\
      "Updated": "2019-06-12T19:24:55.6898226Z"\
    }\
  ],
  "IsUserGenerated": true,
  "Uid": "pL9PO6QJ",
  "Created": "2019-06-12T19:24:55.6898226Z",
  "Updated": "2019-06-12T19:24:55.6898226Z"
}
```

Cache-Control

no-cache

Content-Length

1124

Content-Type

application/json; charset=utf-8

Date

Wed, 12 Jun 2019 19:24:55 GMT

Expires

-1

Pragma

no-cache

Server

Microsoft-IIS/10.0

X-AspNet-Version

4.0.30319

X-Powered-By

ASP.NET

### GETGet all transactions by account

{{url}}/billing/transactions/\[accountUid\]

Retrieves all transactions for a given accountUId. Transactions are tied to accounts and invoices. Each transaction has a BillingTransactionType.

BillingTransactionType
Invoice = 1,
Payment = 2,
Credit = 3,
Refund = 4,
Chargeback = 5

HEADERS

Authorization

{{authorizationtoken}}

Content-Type

application/json

Example Request

Get all transactions by account

curl

```curl
curl --location -g '{{url}}/billing/transactions/JVmAEnma' \
--header 'Authorization: {{authorizationtoken}}' \
--header 'Content-Type: application/json'
```

200 OK

Example Response

- Body
- Headers (9)

View More

json

```json
{
    "metadata": {
        "limit": 100,
        "offset": 0,
        "total": 2
    },
    "items": [\
        {\
            "TransactionDate": "2018-03-28T20:12:46",\
            "BillingTransactionType": 1,\
            "Account": {\
                "Name": "Test Corporation",\
                "ClientIdentifier": "55",\
                "IsDemo": false,\
                "BillingAddress": null,\
                "MailingAddress": null,\
                "AccountStage": 3,\
                "PaymentInformation": null,\
                "PersonAccount": null,\
                "Subscriptions": null,\
                "Deals": null,\
                "LastLoginDateTime": "2019-03-04T20:41:06",\
                "AccountStageLabel": "Subscribing",\
                "DomainName": null,\
                "LatestSubscription": null,\
                "PrimaryContact": null,\
                "Uid": "JVmAEnma",\
                "Created": "2017-12-15T15:51:33",\
                "Updated": "2019-03-04T20:41:06"\
            },\
            "Invoice": {\
                "InvoiceDate": "2018-03-28T20:12:46",\
                "Number": 1014,\
                "BillingInvoiceStatus": 2,\
                "Subscription": null,\
                "Amount": 3.78,\
                "AmountOutstanding": 0,\
                "InvoiceLineItems": null,\
                "IsUserGenerated": false,\
                "Uid": "qrm04mXZ",\
                "Created": "2018-03-29T13:02:30",\
                "Updated": "2018-05-24T14:00:29"\
            },\
            "Amount": 3.78,\
            "Uid": "Z496vr9X",\
            "Created": "2018-03-29T13:02:30",\
            "Updated": "2018-03-29T13:02:30"\
        },\
        {\
            "TransactionDate": "2018-04-28T20:12:46",\
            "BillingTransactionType": 1,\
            "Account": {\
                "Name": "Test Corporation",\
                "ClientIdentifier": "55",\
                "IsDemo": false,\
                "BillingAddress": null,\
                "MailingAddress": null,\
                "AccountStage": 3,\
                "PaymentInformation": null,\
                "PersonAccount": null,\
                "Subscriptions": null,\
                "Deals": null,\
                "LastLoginDateTime": "2019-03-04T20:41:06",\
                "AccountStageLabel": "Subscribing",\
                "DomainName": null,\
                "LatestSubscription": null,\
                "PrimaryContact": null,\
                "Uid": "JVmAEnma",\
                "Created": "2017-12-15T15:51:33",\
                "Updated": "2019-03-04T20:41:06"\
            },\
            "Invoice": {\
                "InvoiceDate": "2018-04-28T20:12:46",\
                "Number": 1035,\
                "BillingInvoiceStatus": 2,\
                "Subscription": null,\
                "Amount": 0.15,\
                "AmountOutstanding": 0,\
                "InvoiceLineItems": null,\
                "IsUserGenerated": false,\
                "Uid": "4XQY8qmP",\
                "Created": "2018-04-29T13:00:30",\
                "Updated": "2018-05-24T14:00:33"\
            },\
            "Amount": 0.15,\
            "Uid": "jLmJP69P",\
            "Created": "2018-04-29T13:00:30",\
            "Updated": "2018-04-29T13:00:30"\
        }\
}\
```\
\
Cache-Control\
\
no-cache\
\
Content-Length\
\
20585\
\
Content-Type\
\
application/json; charset=utf-8\
\
Date\
\
Fri, 31 May 2019 19:00:53 GMT\
\
Expires\
\
-1\
\
Pragma\
\
no-cache\
\
Server\
\
Microsoft-IIS/10.0\
\
X-AspNet-Version\
\
4.0.30319\
\
X-Powered-By\
\
ASP.NET\
\
### POSTAdd invoice payment\
\
{{url}}/billing/transactions/payment\
\
Adds a payment to an invoice. If the amount matches the outstanding amount of the invoice, the invoice will be marked as Paid.\
\
HEADERS\
\
Authorization\
\
{{authorizationToken}}\
\
Content-Type\
\
application/json\
\
PARAMS\
\
Bodyraw (json)\
\
json\
\
```json\
{\
    "Account": { "Uid": "xxxxxxxx" },\
    "Invoice": { "Uid": "yyyyyyyy" },\
    "Amount": -19.99\
}\
```\
\
Example Request\
\
Add invoice payment\
\
curl\
\
```curl\
curl --location -g '{{url}}/billing/transactions/payment' \\
--header 'Authorization: {{authorizationToken}}' \\
--header 'Content-Type: application/json' \\
--data '{\
    "Account": { "Uid": "xxxxxxxx" },\
    "Invoice": { "Uid": "yyyyyyyy" },\
    "Amount": -19.99\
}'\
```\
\
Example Response\
\
- Body\
- Headers (0)\
\
No response body\
\
This request doesn't return any response body\
\
No response headers\
\
This request doesn't return any response headers\
\
## Payment Information\
\
### POSTUpdate Payment Information\
\
{{url}}/billing/paymentinformation\
\
HEADERS\
\
Authorization\
\
{{authorizationtoken}}\
\
Bodyraw (json)\
\
json\
\
```json\
{\
    "Account": {\
        "Uid": "XXXXXXXX"\
    },\
    "CustomerToken": "cust_xxxxxxxxxxxxxxxx",\
    "NameOnCard": "Joan Smith",\
    "PaymentToken": "pm_xxxxxxxxxxxxxxxx"\
}\
```\
\
Example Request\
\
Update Payment Information\
\
curl\
\
```curl\
curl --location -g '{{url}}/billing/paymentinformation' \\
--header 'Authorization: {{authorizationtoken}}' \\
--data '{\
    "Account": {\
        "Uid": "XXXXXXXX"\
    },\
    "CustomerToken": "cust_xxxxxxxxxxxxxxxx",\
    "NameOnCard": "Joan Smith",\
    "PaymentToken": "pm_xxxxxxxxxxxxxxxx"\
}'\
```\
\
Example Response\
\
- Body\
- Headers (0)\
\
No response body\
\
This request doesn't return any response body\
\
No response headers\
\
This request doesn't return any response headers\
\
## User Profile\
\
This section includes APIs that are related to the maintainance of a users information.\
\
Please note that you can not call these method using the authentication token with the API keys. You'll need to call them with the auth token generated from the Get Auth token method. Make sure to construct the auth token as described in the Getting started >> Client Side section above (eg., "bearer \[token\]")\
\
### GETGet Profile\
\
{{url}}/profile\
\
Use this method to retrieve the profile information of a user. Please note that you can not call this method with the API keys. You'll need to call it with the auth token generated from the Get Auth token method. Make sure to construct the auth token as described in the Getting started >> Client Side section above.\
\
HEADERS\
\
Authorization\
\
{{authorizationoath}}\
\
Content-Type\
\
application/json\
\
Example Request\
\
Get Profile\
\
curl\
\
```curl\
curl --location -g '{{url}}/profile' \\
--header 'Authorization: {{authorizationoath}}' \\
--header 'Content-Type: application/json' \\
--data ''\
```\
\
Example Response\
\
- Body\
- Headers (0)\
\
View More\
\
```javascript\
{\
  "Uid": "exmewp9V",\
  "Email": "example@example.com",\
  "FirstName": "My",\
  "LastName": "example",\
  "MailingAddress": {\
    "Uid": "exmewp9V",\
    "AddressLine1": "new line",\
    "AddressLine2": "new line2",\
    "AddressLine3": null,\
    "City": "City",\
    "State": "State",\
    "PostalCode": "02446"\
  }\
}\
```\
\
No response headers\
\
This request doesn't return any response headers\
\
### PUTUpdate Profile\
\
{{url}}/profile\
\
Use this method to update the profile information of a user.\
\
Please note that you can not call this method with the API keys. You'll need to call it with the auth token generated from the Get Auth token method. Make sure to construct the auth token as described in the Getting started >> Client Side section above.\
\
Also, the body of the request needs to include the UID property that matches the person that you generated the token for.\
\
HEADERS\
\
Authorization\
\
{{authorizationoath}}\
\
Content-Type\
\
application/json\
\
Bodyraw\
\
View More\
\
```javascript\
{\
    "Email": "test@outseta.com",\
    "FirstName": "Test",\
    "LastName": "Testerakopoulos",\
    "MailingAddress": {\
        "AddressLine1": "5 Washington Street",\
        "AddressLine2": "#7",\
        "AddressLine3": null,\
        "City": "Brookline",\
        "State": "Brookline",\
        "PostalCode": "02446",\
        "Country": null,\
        "Uid": "y7marQEq",\
        "Created": "2017-02-07T20:59:21",\
        "Updated": "2019-07-10T12:13:13"\
    },\
    "UserAgent": null,\
    "Uid": "4XQYqQPB"\
}\
```\
\
Example Request\
\
Update Profile\
\
View More\
\
curl\
\
```curl\
curl --location -g --request PUT '{{url}}/profile' \\
--header 'Authorization: {{authorizationoath}}' \\
--header 'Content-Type: application/json' \\
--data-raw '{\
    "Email": "test@outseta.com",\
    "FirstName": "Test",\
    "LastName": "Testerakopoulos",\
    "MailingAddress": {\
        "AddressLine1": "5 Washington Street",\
        "AddressLine2": "#7",\
        "AddressLine3": null,\
        "City": "Brookline",\
        "State": "Brookline",\
        "PostalCode": "02446",\
        "Country": null,\
        "Uid": "y7marQEq",\
        "Created": "2017-02-07T20:59:21",\
        "Updated": "2019-07-10T12:13:13"\
    },\
    "UserAgent": null,\
    "Uid": "4XQYqQPB"\
}'\
```\
\
Example Response\
\
- Body\
- Headers (0)\
\
No response body\
\
This request doesn't return any response body\
\
No response headers\
\
This request doesn't return any response headers\
\
### PUTUpdate Password\
\
{{url}}/profile/password\
\
Use this method to update the password for a user. Please note that you can not call this method with the API keys. You'll need to call it with the auth token generated from the Get Auth token method. Make sure to construct the auth token as described in the Getting started >> Client Side section above.\
\
HEADERS\
\
Authorization\
\
{{authorizationoath}}\
\
Content-Type\
\
application/json\
\
Bodyraw\
\
```javascript\
{\
    "ExistingPassword": "test",\
    "NewPassword": "tester"\
}\
```\
\
Example Request\
\
Update Password\
\
curl\
\
```curl\
curl --location -g --request PUT '{{url}}/profile/password' \\
--header 'Authorization: {{authorizationoath}}' \\
--header 'Content-Type: application/json' \\
--data '{\
    "ExistingPassword": "test",\
    "NewPassword": "tester"\
}'\
```\
\
Example Response\
\
- Body\
- Headers (0)\
\
No response body\
\
This request doesn't return any response body\
\
No response headers\
\
This request doesn't return any response headers\
\
## Authentication\
\
### POSTGet Auth Token\
\
{{url}}/tokens\
\
Call this API from the server to retrieve an access token that you can use to make API calls via the client side. Make sure to secure your username and password and not make them visible on the client side.\
\
To retrieve an access token for a user who has registered with your service, the URL should point to your Outseta domain (e.g. [https://my-company.outseta.com](https://my-company.outseta.com/)).\
\
To retrieve an access token for an administrative user who logs into the Outseta admin site, the URL should be [https://go.outseta.com.](https://go.outseta.com./)\
\
HEADERS\
\
Content-Type\
\
application/x-www-form-urlencoded\
\
Bodyurlencoded\
\
username\
\
{{username}}\
\
password\
\
{{password}}\
\
Example Request\
\
Get Auth Token\
\
curl\
\
```curl\
curl --location -g '{{url}}/tokens' \\
--header 'Content-Type: application/x-www-form-urlencoded' \\
--data-urlencode 'username={{username}}' \\
--data-urlencode 'password={{password}}'\
```\
\
Example Response\
\
- Body\
- Headers (0)\
\
No response body\
\
This request doesn't return any response body\
\
No response headers\
\
This request doesn't return any response headers\
\
### POSTGet Auth Token with API Keys\
\
{{url}}/tokens\
\
Call this API from the server to retrieve an access token that you can used to make API calls via the client side. This method call can also be used to retrieve the access token that can then be set on the profile widget or the chat widget for private sites.\
\
Make sure to secure your API keys and not make them visible on the client side.\
\
HEADERS\
\
Content-Type\
\
application/x-www-form-urlencoded\
\
Authorization\
\
Outseta {{apiKey}}:{{apiKeySecret}}\
\
Bodyurlencoded\
\
username\
\
{{username}}\
\
Example Request\
\
Get Auth Token with API Keys\
\
curl\
\
```curl\
curl --location -g '{{url}}/tokens' \\
--header 'Content-Type: application/x-www-form-urlencoded' \\
--header 'Authorization: Outseta {{apiKey}}:{{apiKeySecret}}' \\
--data-urlencode 'username={{username}}'\
```\
\
200 OK\
\
Example Response\
\
- Body\
- Headers (9)\
\
View More\
\
json\
\
```json\
{\
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6InhObnZiLWxaWDJWNHdKTFctaVdreXBSR0cwVSJ9.eyJ1bmlxdWVfbmFtZSI6ImRpbWl0cmlzQG91dHNldGEuY29tIiwiZ2l2ZW5fbmFtZSI6IkRpbWl0cmlzIiwiZmFtaWx5X25hbWUiOiJHZW9yZ2Frb3BvdWxvcyIsImVtYWlsIjoiZGltaXRyaXNAb3V0c2V0YS5jb20iLCJuYW1laWQiOiI0WFFZcVFQQiIsIm91dHNldGE6YWNjb3VudFVpZCI6IndabU5abTJPIiwib3V0c2V0YTphY2NvdW50Q2xpZW50SWRlbnRpZmllciI6IjEiLCJvdXRzZXRhOmlzUHJpbWFyeSI6IjEiLCJvdXRzZXRhOnN1YnNjcmlwdGlvblVpZCI6IjRYUVlvN1dQIiwib3V0c2V0YTpwbGFuVWlkIjoiS2o5YlhNbW4iLCJvdXRzZXRhOmlzcyI6ImxvY2FsaG9zdCIsImF1ZCI6ImxvY2FsaG9zdCIsImlzcyI6ImxvY2FsaG9zdCIsImV4cCI6MTYwMTU4NDQ2NCwibmJmIjoxNTcwMDQ4NDY0fQ.C13Q5lYW_BOBFLYwiVZX_J1GwlqjtrLCg9PCgIdPzwUKzpQMPbcUGq4DWNs9kleNjEJMy3Cc01S5bNmYefbLuYGngaoRRIqxSd2dErCeSdss9MIMSZjJv_rBuKoaoIXr6uf0KIL_4h1robsMindS2pizz9tqjLO7kcENg9WPfZjuXl81-FIYLL2OsRg7OtHBUvgWvTnnQO_H5_x0vabwD9cKMTH6EeOMMn3StX58yJ1WPNXA-cbppolgcfG45pPfmaPz84wTva-_clSWBG8usPLEshYOTGC8vIbM8LDB0RmxW7vcppcCet1m-tr87J9BzrrVZdVjKzcPUBi5wx0frg",\
  "token_type": "bearer",\
  "expires_in": 31535999\
}\
```\
\
Access-Control-Allow\_Origin\
\
\*\
\
Cache-Control\
\
no-cache\
\
Content-Length\
\
1181\
\
Content-Type\
\
application/json;charset=UTF-8\
\
Date\
\
Wed, 02 Oct 2019 20:34:25 GMT\
\
Expires\
\
-1\
\
Pragma\
\
no-cache\
\
Server\
\
Microsoft-IIS/10.0\
\
X-Powered-By\
\
ASP.NET\
\
## Notifications\
\
### GETNew Request\
\
Example Request\
\
New Request\
\
curl\
\
```curl\
curl --location ''\
```\
\
Example Response\
\
- Body\
- Headers (0)\
\
No response body\
\
This request doesn't return any response body\
\
No response headers\
\
This request doesn't return any response headers