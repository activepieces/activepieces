export const sampleEntry = {
  Form: { Id: '1', InternalName: 'ContactUs', Name: 'Contact Us' },
  Name: 'Ada Lovelace',
  Address: {
    City: 'Austin',
    CityStatePostalCode: 'Austin, TX 78701',
    Country: 'United States',
    CountryCode: null,
    FullAddress: '1 Test St, Austin, TX 78701',
    FullInternationalAddress: '1 Test St, Austin, TX 78701, United States',
    Latitude: null,
    Line1: '1 Test St',
    Line2: null,
    Line3: null,
    Longitude: null,
    PostalCode: '78701',
    State: 'TX',
    StreetAddress: '1 Test St',
    Type: 'Home',
  },
  Phone: '(555) 010-0100',
  Email: 'ada@example.com',
  Signature: {
    Name: 'Signature.png',
    ContentType: 'image/png',
    Content: 'iVBORw0KGgo=',
    File: 'https://www.cognitoforms.com/sf/temporary-signature-link',
  },
  Files: [
    {
      ContentType: 'application/pdf',
      Id: 'F-Wb5Xb2YH8YuTOBuEh83zu',
      IsEncrypted: false,
      Name: 'resume.pdf',
      Size: 120766,
      File: 'https://www.cognitoforms.com/fa/temporary-file-link',
    },
  ],
  Id: '1-12',
  Entry: {
    AdminLink: 'https://www.cognitoforms.com/acme/1/entries/12',
    DateCreated: '2026-10-20T15:04:00.723Z',
    DateSubmitted: '2026-10-20T15:04:00.723Z',
    DateUpdated: '2026-10-20T15:04:00.723Z',
    Number: 12,
    Order: null,
    Origin: {
      City: null,
      CountryCode: null,
      IpAddress: '203.0.113.10',
      IsImported: false,
      Region: null,
      Timezone: null,
      UserAgent: 'Mozilla/5.0',
    },
    Timestamp: '2026-10-20T15:04:00.723Z',
    User: { Email: 'ada@example.com', FirstName: 'Ada', LastName: 'Lovelace', Name: 'Ada Lovelace' },
    Version: 1,
    Action: 'Submit',
    Role: 'Public',
    Status: 'Submitted',
    PublicLink: 'https://www.cognitoforms.com/acme/ContactUs#public-link-token',
    InternalLink: 'https://www.cognitoforms.com/acme/ContactUs#internal-link-token',
    Document1: 'https://www.cognitoforms.com/d/temporary-document-link',
  },
};

export function webhookInstructions(endpointLabel: string): string {
  return `
To use this trigger, connect your form to the webhook URL in Cognito Forms:

1. Open your form in Cognito Forms and go to **Build**, then **Form Settings**.
2. Turn on **Post JSON Data to Website**.
3. Paste the following URL into the **${endpointLabel}** field only:
\`\`\`text
{{webhookUrl}}
\`\`\`
4. Save the form.

Cognito Forms does not sign these requests, so keep the URL private. Posting JSON data needs a paid Cognito Forms plan.
`;
}
