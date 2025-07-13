## What does this PR do?

This PR adds a complete Cloudinary MCP (Managed Connection Provider) integration for Activepieces. It provides robust, production-ready standalone Node.js scripts for all required Cloudinary actions, triggers, and custom API calls, enabling seamless media management and automation with Cloudinary.

---

### Explain How the Feature Works

- **Standalone Node.js scripts** are provided for each Cloudinary action and trigger, using the official Cloudinary SDK or direct API calls for maximum reliability.
- **Features include:**  
  - Upload (unsigned preset), delete, transform, find by public ID, usage report, polling for new resources/tags, and a custom API call utility.
- **Setup instructions** and usage examples are included in the README.
- **Why standalone scripts?**  
  Due to a current context issue with Activepieces actions, all features are implemented as standalone scripts for reliability. This approach is recommended until the context issue is resolved.

<!-- [Insert the video link here if you have a demo] -->

---

### Relevant User Scenarios

- Automate image/video/file uploads to Cloudinary from any workflow.
- Delete, transform, or fetch details for any Cloudinary asset.
- Monitor for new uploads or tags and trigger downstream automations.
- Generate usage reports for account monitoring and quota management.
- Make custom API calls to any Cloudinary endpoint for advanced use cases.

<!-- [Insert Pylon tickets or community posts here if possible] -->

---

### Test Outputs

**Upload Resource:**
```
Upload result: {
  asset_id: 'ed842731d5e037024823add55b6311f0',
  public_id: 'sample_bdgcod',
  ...
  secure_url: 'https://res.cloudinary.com/de7qxfvjd/image/upload/v1752396470/sample_bdgcod.png',
  ...
}
```

**Delete Resource:**
```
Cloudinary SDK delete result: { result: 'ok' }
```

**Transform Resource:**
```
Transformed URL: https://res.cloudinary.com/de7qxfvjd/image/upload/c_fill,h_300,w_400/sample_bdgcod?_a=BAMAK+fi0
```

**Find Resource by Public ID:**
```
Cloudinary SDK find result: {
  asset_id: 'ed842731d5e037024823add55b6311f0',
  public_id: 'sample_bdgcod',
  ...
  secure_url: 'https://res.cloudinary.com/de7qxfvjd/image/upload/v1752396470/sample_bdgcod.png',
  ...
}
```

**Usage Report:**
```
Cloudinary SDK usage report: {
  plan: 'Free',
  ...
  storage: { usage: 0, credits_usage: 0 },
  ...
}
```

**Poll New Resources:**
```
Resources uploaded in the last 10 minutes:
- sample_bdgcod (created at: 2025-07-13T08:47:50Z)
```

**Poll New Tags:**
```
Resources with tags added in the last 10 minutes:
No new tags found on resources.
```

**Custom API Call:**
```
Custom API call result: {
  resources: [
    { public_id: 'sample_bdgcod', ... },
    ...
  ]
}
```

---

Fixes #8346 