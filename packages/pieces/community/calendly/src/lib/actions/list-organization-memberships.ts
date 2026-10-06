import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calendlyAuth } from '../auth';
import { calendlyCommon, CalendlyCollection, CalendlyRecord } from '../common';
import { organizationMembershipsOutputSchema } from '../output-schemas';

export const listOrganizationMembershipsAction = createAction({
  auth: calendlyAuth,
  name: 'list_organization_memberships',
  classification: 'SEARCH',
  displayName: 'List Organization Members',
  description: 'Lists the members of a Calendly organization.',
  audience: 'ai',
  aiMetadata: {
    description:
      "List the members of a Calendly organization with each membership URI, role (owner, admin, user) and the member's user URI, name and email. Leave Organization empty for the connected user's organization. Filter by email or role. Paginated with Page Token. Read-only.",
    idempotent: true,
  },
  outputSchema: organizationMembershipsOutputSchema,
  props: {
    organization: calendlyCommon.organization,
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Only return the member with this email.',
      required: false,
    }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      required: false,
      options: {
        options: [
          { label: 'Owner', value: 'owner' },
          { label: 'Admin', value: 'admin' },
          { label: 'User', value: 'user' },
        ],
      },
    }),
    count: calendlyCommon.count,
    pageToken: calendlyCommon.pageToken,
  },
  async run({ auth, propsValue }) {
    const organization = await calendlyCommon.resolveOrganizationUri({
      token: auth.secret_text,
      organization: propsValue.organization,
    });
    const response = await calendlyCommon.calendlyRequest<CalendlyCollection<CalendlyRecord>>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: '/organization_memberships',
      queryParams: {
        organization,
        email: propsValue.email?.trim(),
        role: propsValue.role,
        ...calendlyCommon.pageQuery({ count: propsValue.count, pageToken: propsValue.pageToken }),
      },
    });
    return calendlyCommon.toPage({ response });
  },
});
