_search_

[Submit Help Request](https://go.outseta.com/support/kb)

[![](https://s3.amazonaws.com/outseta-production/1/0-outseta-logo_37c2b321-0381-4690-b1db-f2d4c2d386ca.png)](https://go.outseta.com/support/kb/categories)
Help Desk


[Submit Help Request](https://go.outseta.com/support/kb)

- [Getting Started](https://go.outseta.com/support/kb/categories/B9l5alW8/getting-started)
- [Protected Content](https://go.outseta.com/support/kb/categories/rQVZLeQ6/protected-content)
- [Sign up and Login](https://go.outseta.com/support/kb/categories/xE9LyAWw/sign-up-and-login)
- [Webflow](https://go.outseta.com/support/kb/categories/wZmN8w92/webflow)
- [Developer Docs](https://go.outseta.com/support/kb/categories/d1QpjYWE/developer-docs)
- [Code Snippets & Examples](https://go.outseta.com/support/kb/categories/rm0Ak4QX/code-snippets-examples)
- [Billing](https://go.outseta.com/support/kb/categories/6Dmwq94j/billing)
- [CRM](https://go.outseta.com/support/kb/categories/RyW1KQBl/crm)
- [Email](https://go.outseta.com/support/kb/categories/Z496r9Xz/email)
- [Help Desk](https://go.outseta.com/support/kb/categories/By9q8QAP/help-desk)
- [Settings](https://go.outseta.com/support/kb/categories/VdQG094Y/settings)
- [Integrations](https://go.outseta.com/support/kb/categories/qNmd5Q0x/integrations)
- [Legal & Security](https://go.outseta.com/support/kb/categories/L9P6vAmJ/legal-security)
- more\_horiz
   - [Getting Started](https://go.outseta.com/support/kb/categories/B9l5alW8/getting-started)
  - [Protected Content](https://go.outseta.com/support/kb/categories/rQVZLeQ6/protected-content)
  - [Sign up and Login](https://go.outseta.com/support/kb/categories/xE9LyAWw/sign-up-and-login)
  - [Webflow](https://go.outseta.com/support/kb/categories/wZmN8w92/webflow)
  - [Developer Docs](https://go.outseta.com/support/kb/categories/d1QpjYWE/developer-docs)
  - [Code Snippets & Examples](https://go.outseta.com/support/kb/categories/rm0Ak4QX/code-snippets-examples)
  - [Billing](https://go.outseta.com/support/kb/categories/6Dmwq94j/billing)
  - [CRM](https://go.outseta.com/support/kb/categories/RyW1KQBl/crm)
  - [Email](https://go.outseta.com/support/kb/categories/Z496r9Xz/email)
  - [Help Desk](https://go.outseta.com/support/kb/categories/By9q8QAP/help-desk)
  - [Settings](https://go.outseta.com/support/kb/categories/VdQG094Y/settings)
  - [Integrations](https://go.outseta.com/support/kb/categories/qNmd5Q0x/integrations)
  - [Legal & Security](https://go.outseta.com/support/kb/categories/L9P6vAmJ/legal-security)

# Setup activity notifications (Webhooks, Callbacks)

Outseta allows you to setup notifications that can be sent either via email or web callbacks when an activity occurs. For example, maybe you want to be notified every time a new account is created or when a customer updates their payment information; we've got you covered.

1\. Click **SETTINGS > NOTIFICATIONS** from the left hand side bar, then click **ADD** **NOTIFICATION**.

![](https://s3.amazonaws.com/outseta-production/1/0-Screen+Shot+2025-06-26+at+1.33.10+PM_99c2381f-34a5-4e28-83cf-c7459428a46d.png)

2\. Select the activity type that you'd like to setup a notification for, then enter the email address you'd like the notification to be sent to or the website URL you'd like the activity to post to.

When a callback URL is used and the notification endpoint returns an error we retry the notification 20 times in 20 minute increments. To test the callbacks and be able to inspect the content of the callback request please use tools like [RequestBin](https://requestbin.com/) or [Webhook](https://webhook.site/).

To ensure that Outseta is the one calling your endpoint [secure it with a webhook signature](https://go.outseta.com/support/kb/articles/Rm85R5Q4/secure-and-verify-webhooks-with-a-sha256-signature).

In the example below I've created an email notification for every time a deal is updated.

![](https://s3.amazonaws.com/outseta-production/1/0-Screen+Shot+2025-06-26+at+1.35.24+PM_b2299344-f1d5-454e-ac86-7b6125ee8930.png)

3\. Click **ADD**.

See below for an example JSON object returned for all activity notifications that return an account entity.

```
{
   "Name":"Test Company",
   "IsDemo":false,
   "AccountStage":2,
   "PersonAccount":[\
      {\
         "Person":{\
            "Email":"test@test.com",\
            "FirstName":"Test First Name",\
            "LastName":"Test Last Name",\
            "PhoneMobile":"",\
            "PhoneWork":"",\
            "IPAddress":"::1",\
            "Referer":"http://localhost/auth",\
            "UserAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36",\
            "FullName":"Test First Name Test Last Name",\
            "OAuthIntegrationStatus":0,\
            "UserAgentPlatformBrowser":"WinNT (Chrome)",\
            "Uid":"dQGpld94",\
            "Created":"2019-05-24T14:30:21",\
            "Updated":"2019-05-24T14:33:25"\
         },\
         "IsPrimary":true,\
         "Uid":"Kj9baMQn",\
         "Created":"2019-05-24T14:34:22.3279439Z",\
         "Updated":"2019-05-24T14:34:22.3279439Z"\
      }\
   ],
   "Subscriptions":[\
      {\
         "BillingRenewalTerm":1,\
         "Quantity":1,\
         "StartDate":"2019-05-24T14:34:22.0649555Z",\
         "RenewalDate":"2019-06-24T14:34:22.0649555Z",\
         "IsPlanUpgradeRequired":false,\
         "Uid":"ZBWzp2QE",\
         "Created":"2019-05-24T14:34:22.3279439Z",\
         "Updated":"2019-05-24T14:34:22.3279439Z"\
      }\
   ],
   "Deals":[\
\
   ],
   "AccountStageLabel":"Trialing",
   "LatestSubscription":{
      "BillingRenewalTerm":1,
      "Quantity":1,
      "StartDate":"2019-05-24T14:34:22.0649555Z",
      "RenewalDate":"2019-06-24T14:34:22.0649555Z",
      "IsPlanUpgradeRequired":false,
      "Uid":"ZBWzp2QE",
      "Created":"2019-05-24T14:34:22.3279439Z",
      "Updated":"2019-05-24T14:34:22.3279439Z"
   },
   "Uid":"By9qp3QA",
   "Created":"2019-05-24T14:34:22.3279439Z",
   "Updated":"2019-05-24T14:34:22.3279439Z"
}
```

**Relevant articles:**

👉 [Integrate Outseta with your backend database](https://go.outseta.com/support/kb/articles/B9lV2dm8/integrate-outseta-with-your-backend-database)

👉 [Secure and verify webhooks with a SHA256 Signature](https://go.outseta.com/support/kb/articles/Rm85R5Q4/secure-and-verify-webhooks-with-a-sha256-signature)

content\_copy
Copy as Markdown

**Articles in this category**

- [Invite team members (add new users) to your account](https://go.outseta.com/support/kb/articles/owmj1aWV/invite-team-members-add-new-users-to-your-account)
- [Upload your company logo](https://go.outseta.com/support/kb/articles/KjW74mqb/upload-your-company-logo)

**Outseta**

—

- [Home](http://outseta.com/)
- [About Us](https://www.outseta.com/what-were-about)
- [API Docs](https://documenter.getpostman.com/view/3613332/outseta-rest-api-v1/7TNfr6k?version=latest)
- [Outseta Academy](https://fast.wistia.com/embed/channel/mycheflsrj)
- [Submit Help Request](https://go.outseta.com/support/kb/articles/6DmwY294/setup-activity-notifications-webhooks-callbacks#)

close

Submit Help Request

Email

Subject

How can we help you?

Attachments (0)

_attach\_file_ Add up to 5 files

Max 2.0 MB per file. Accepted file types: .csv, .jpg, .jpeg, .pdf, .png, .txt, .xlsx

reCAPTCHA

Recaptcha requires verification.

I'm not a robot

reCAPTCHA

Submit

reCAPTCHA