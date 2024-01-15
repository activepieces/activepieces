import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../../common';
import { ProjectListFilter } from '../../common/models/project';
import { clockodoAuth } from '../../../';

export default createAction({
  auth: clockodoAuth,
  name: 'list_projects',
  displayName: 'Get Projects',
  description: 'Fetches projects from clockodo',
  props: {
    customer_id_filter: Property.Number({
      displayName: 'Customer ID Filter',
      description: 'Filter projects by their customer',
      required: false,
    }),
    active_filter: Property.Checkbox({
      displayName: 'Active Filter',
      description: 'Filter customers by their active status',
      required: false,
      defaultValue: true,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Reads only the specified page',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth);
    const filter: ProjectListFilter = {
      customers_id: propsValue.customer_id_filter,
      active: propsValue.active_filter,
    };
    if (propsValue.page !== undefined) {
      const res = await client.listProjects({
        page: propsValue.page,
        filter,
      });
      return {
        pagination: res.paging,
        projects: res.projects,
      };
    } else {
      const projects = await client.listAllProjects(filter);
      return {
        projects,
      };
    }
  },
});
