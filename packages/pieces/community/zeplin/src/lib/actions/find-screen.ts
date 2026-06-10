import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ziplinAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { project_idProp } from '../common/props';

export const findScreen = createAction({
  auth: ziplinAuth,
  name: 'findScreen',
  displayName: 'Find Screen',
  description: 'Find a screen by name or retrieve all screens in a project',
  props: {
    projectId: project_idProp,
    screenName: Property.ShortText({
      displayName: 'Screen Name',
      description: 'Optional screen name to search for (partial match)',
      required: false,
    }),
  },
  async run(context) {
    const { projectId, screenName } = context.propsValue;

    const screens = (await makeRequest<any[]>(
      context.auth.secret_text,
      HttpMethod.GET,
      `/projects/${projectId}/screens`
    )) || [];

    if (screenName) {
      const filtered = screens.filter((screen) =>
        screen.title.toLowerCase().includes(screenName.toLowerCase())
      );
      return filtered.length > 0 ? filtered : screens;
    }

    return screens;
  },
});
