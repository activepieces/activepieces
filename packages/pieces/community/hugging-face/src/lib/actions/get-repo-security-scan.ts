import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfProps } from '../common/props';
import { hfRepo } from '../common/repo';
import { getRepoSecurityScanOutputSchema } from '../output-schemas';

export const getRepoSecurityScan = createAction({
  auth: huggingFaceAuth,
  name: 'get_repo_security_scan',
  classification: 'READ',
  displayName: 'Get Security Scan',
  description: 'Get the malware and pickle security-scan status of a repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns the Hub's malware and pickle-import security scan status for a repository: whether scans are done and which files were flagged, each with a level such as safe, caution, suspicious or unsafe. Use it as a safety check before recommending that someone download or load a model's weights. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: getRepoSecurityScanOutputSchema,
  props: {
    repo_type: hfProps.repoType(),
    repo_id: hfProps.repoId(),
  },
  async run(context) {
    const { repo_type, repo_id } = context.propsValue;
    const token = context.auth.secret_text;
    const apiPath = await hfRepo.apiPath({ token, repoType: repo_type, repoId: repo_id });
    const response = await hfHub.request<unknown>({
      token,
      method: HttpMethod.GET,
      path: `${apiPath}/scan`,
    });
    return response.body;
  },
});
