---
id: a-custom-ai-provider-is-now-checked-when-you-save-it
title: "A custom AI provider is now checked when you save it"
added: '2026-09-08'
release: 0.91.0
---

The custom OpenAI-compatible provider accepted any text as its base URL and as its API key header name. A config that cannot be used saved without complaint and then failed on every run that used it, with a message from the HTTP layer rather than from Activepieces: a header name of `authorization: bearer` produced *"Headers.append: is an invalid header name"*, and a base URL that will not parse produced *"Invalid URL"*.

Saving now fails with a message naming the field to fix. Nothing changes for a provider whose config already works, and no stored config is altered or re-checked in place.

#### What you need to do

Nothing, unless you have a custom AI provider whose base URL or API key header is malformed. Those already fail at run time. The next time you save that provider you will be told which field is wrong: enter the header name on its own, such as `Authorization`, with its value in the API key field, and give the base URL in full including the scheme, such as `https://api.example.com/v1`.
