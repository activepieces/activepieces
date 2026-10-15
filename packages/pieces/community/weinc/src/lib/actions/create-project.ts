import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { weincAuth } from '../auth';
import { compact, weincRequest, WeincProject } from '../common/client';
import { clientEmailDropdown } from '../common/props';

export const createProject = createAction({
  auth: weincAuth,
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Creates a website project in one of your client accounts.',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a new WeInc website project owned by an existing, activated client of the organization (identified by email). Optionally starts from one of the organization templates. Not idempotent: each call creates another project.',
    idempotent: false,
  },
  props: {
    clientEmail: clientEmailDropdown,
    name: Property.ShortText({ displayName: 'Project Name', required: true }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    templateId: Property.ShortText({
      displayName: 'Template ID',
      description: 'Optional ID of one of your organization templates to start from.',
      required: false,
    }),
  },
  async run(context) {
    const { clientEmail, name, description, templateId } = context.propsValue;
    const res = await weincRequest<{ project: WeincProject }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/projects',
      body: compact({ client_email: clientEmail, name, description, template_id: templateId }),
    });
    return res.project;
  },
});
