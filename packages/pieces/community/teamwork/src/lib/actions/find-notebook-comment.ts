import { createAction, Property, DynamicProperties, DynamicPropsValue, ActionRunner, InputPropertyMap } from '@activepieces/pieces-framework';
import { teamworkAuth, TeamworkAuth } from '../common/auth';
import { teamworkClient } from '../common/client';
import { teamworkProps } from '../common/props';

export const findNotebookOrCommentAction = createAction({
  auth: teamworkAuth,
  name: 'find_notebook_or_comment',
  displayName: 'Find Notebook / Notebook Comment',
  description: 'Locate notebooks or note comments by search parameters.',
  props: {
    findType: Property.StaticDropdown({
      displayName: 'Find Type',
      description: 'Select whether to find a notebook or a notebook comment.',
      required: true,
      options: {
        options: [
          { label: 'Find Notebook', value: 'notebook' },
          { label: 'Find Notebook Comment', value: 'comment' },
        ],
      },
    }),
    dynamicProps: Property.DynamicProperties<true>({
      displayName: 'Search Parameters',
      required: true,
      refreshers: ['findType'],
      props: async (context) => {
        const props: InputPropertyMap = {}; // Corrected type here
        const findType = context['propsValue']['findType'];

        if (findType === 'notebook') {
          props['project_id'] = teamworkProps.project_id(true);
          props['searchTerm'] = Property.ShortText({
            displayName: 'Notebook Name',
            description: 'The name of the notebook to search for.',
            required: true,
          });
        } else if (findType === 'comment') {
          props['project_id'] = teamworkProps.project_id(true);
          props['notebook_id'] = teamworkProps.notebook_id(true);
          props['searchTerm'] = Property.ShortText({
            displayName: 'Comment Content',
            description: 'The content of the comment to search for.',
            required: true,
          });
        }

        return props;
      },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const findType = propsValue.findType;
    const dynamicProps = propsValue.dynamicProps as DynamicPropsValue;
    const searchTerm = dynamicProps?.['searchTerm'] as string;
    const projectId = dynamicProps?.['project_id'] as string;
    const notebookId = dynamicProps?.['notebook_id'] as string;

    if (findType === 'notebook') {
      const notebooks = await teamworkClient.getNotebooks(auth as TeamworkAuth, projectId);
      const foundNotebooks = notebooks.filter(
        (notebook: any) => notebook.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return {
        message: `Found ${foundNotebooks.length} notebooks.`,
        notebooks: foundNotebooks,
      };

    } else if (findType === 'comment') {
      const comments = await teamworkClient.getNotebookComments(auth as TeamworkAuth, notebookId);
      const foundComments = comments.filter(
        (comment: any) => comment.body.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return {
        message: `Found ${foundComments.length} comments.`,
        comments: foundComments,
      };
    }
    
    return {
      message: 'No action performed as no valid find type was selected.',
      result: null,
    };
  },
});