# Google Translate

Translate text and detect languages with Google Cloud Translation (v2 Basic API).

## Authentication

OAuth2 with a client from your own Google Cloud project:

1. Select or create a Google Cloud project with billing enabled (Cloud Translation has a free tier of 500,000 characters per month).
2. Enable the **Cloud Translation API**.
3. On the OAuth consent screen, add the scope `https://www.googleapis.com/auth/cloud-translation`.
4. Create an OAuth client ID of type *Web application* and add the redirect URL shown in the connection dialog to *Authorized redirect URIs*.
5. Paste the Client ID and Client Secret into the connection and sign in.

Usage is billed per character on that Google Cloud project.

## Actions

| Action | Description |
| --- | --- |
| Translate Text | Translate text into a target language. The source language is detected automatically unless set. Supports plain text and HTML. |
| Detect Language | Return the most likely language of a text (code and English name), with a confidence between 0 and 1. |
| List Supported Languages | List the languages the API supports, with names in a chosen display language. |
| Custom API call | Send a request to `https://translation.googleapis.com` with the connection's token. |

## Triggers

None.
