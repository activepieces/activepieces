import { createAction } from '@activepieces/pieces-framework';
import { listProjectMail } from '../api';
import { aconexAuth } from '../auth';
import { assertAuthProps, readAuth } from '../auth-props';
import { mailBoxProp, mailReturnFieldsProp, mailSearchQueryProp, pageNumberProp, pageSizeProp, projectIdProp } from '../props';

export const listProjectMailAction = createAction({
  auth: aconexAuth,
  name: 'list_project_mail',
  displayName: 'List Project Mail',
  description:
    'List one page of inbox or sent mail. Response keys are the mail XML names, not the return_fields tokens. Sending mail is not part of this action.',
  classification: 'READ',
  props: {
    projectId: projectIdProp,
    mailBox: mailBoxProp,
    searchQuery: mailSearchQueryProp,
    returnFields: mailReturnFieldsProp,
    pageSize: pageSizeProp,
    pageNumber: pageNumberProp,
  },
  async run(context) {
    const auth = assertAuthProps(readAuth(context.auth));
    return listProjectMail(auth, {
      projectId: context.propsValue.projectId,
      mailBox: context.propsValue.mailBox,
      searchQuery: context.propsValue.searchQuery,
      returnFields: context.propsValue.returnFields,
      pageSize: context.propsValue.pageSize,
      pageNumber: context.propsValue.pageNumber,
    });
  },
});
