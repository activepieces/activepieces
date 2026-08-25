# Sofya

## Description
[Sofya](https://sofya.co) gives AI agents web access through one API: search the web, fetch pages as clean markdown, extract structured data with AI, and run deep multi-source research.

## Actions
1. **Search** - Web search that returns extracted page content (not just snippets), with an optional AI-synthesized answer. Supports news search, recency filtering, and domain include/exclude lists.
2. **Fetch** - Fetch one or more URLs and return their content as clean markdown. Also handles PDFs and documents. Up to 10 URLs per call.
3. **Extract** - Fetch a page and extract specific information from it using AI, based on a prompt.
4. **Research** - Deep multi-source research: decomposes the query, reads many sources in parallel, and returns a structured report with citations.

Plus a **Custom API Call** action for any other Sofya endpoint.

## Authentication
This piece requires a Sofya API key:
1. Visit https://sofya.co and create an account (signing up with GitHub gives most accounts 1,000 free credits per month).
2. Open your dashboard at https://sofya.co/dashboard.
3. Copy your API key (it starts with `ay_live_`).

## Requirements
- Sofya API Key
