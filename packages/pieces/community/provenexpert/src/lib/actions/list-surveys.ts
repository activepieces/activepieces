import { createAction } from '@activepieces/pieces-framework';
import { provenExpertAuth } from '../common/auth';
import { provenExpertCommon } from '../common';

type SurveyData = {
  code: string;
  name: string;
  created?: number;
  active?: number;
  url?: string;
  pos?: number;
  qr?: string;
  printPng?: string;
  printPdf?: string;
};

export const listSurveysAction = createAction({
  auth: provenExpertAuth,
  name: 'list_surveys',
  displayName: 'List Surveys',
  description: 'Returns all surveys on your ProvenExpert profile with their codes, names, and share links.',
  audience: 'both',
  aiMetadata: { description: 'Lists all surveys on the authenticated ProvenExpert profile, including each survey code, name, active state, and share links. Use to discover available surveys or to resolve a survey code needed by the invitation actions. Takes no input; read-only and idempotent.', idempotent: true },
  props: {},
  async run(context) {
    const response = await provenExpertCommon.apiCall<{
      status: string;
      surveys?: Record<string, SurveyData>;
    }>({
      auth: context.auth.props,
      path: '/survey/get',
    });
    const surveys = response.body.surveys ?? {};
    return Object.values(surveys).map((s) => ({
      code: s.code,
      name: s.name,
      active: s.active === 1,
      created_at: s.created
        ? new Date(s.created * 1000).toISOString()
        : null,
      position: s.pos ?? null,
      survey_url: s.url ?? null,
      qr_code_url: s.qr ?? null,
      print_png_url: s.printPng ?? null,
      print_pdf_url: s.printPdf ?? null,
    }));
  },
});
