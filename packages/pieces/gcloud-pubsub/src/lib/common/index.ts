import { JWT } from 'google-auth-library';

export const common = {
  getClient(auth: unknown) {
    const { email, privateKey } = auth as IAuth;

    const gaxios = new JWT({
      email,
      key: privateKey.replace(/\\n/g, '\n'), // remove duplicate '\' from client side
      scopes: ['https://www.googleapis.com/auth/pubsub'],
    });
    return gaxios;
  },

  /**
   * @returns options topics, topic value contain project name: projects/{pname}/topics/{tname}
   */
  async getTopics(auth: IAuth) {
    const client = common.getClient(auth);

    const topics = {
      disabled: true,
      options: [] as { label: string, value: string }[],
      placeholder: 'Need authentication' as string | undefined,
    };

    try {
      const response = await client.request<ITopicsInfo>({
        url: `https://pubsub.googleapis.com/v1/projects/${auth.projectId}/topics`,
        method: 'GET',
      });

      topics.options = response.data.topics
        .map(topic => {
          const topicName = topic.name.split('topics/')[1];
          return { label: `${topicName}`, value: topic.name };
        });

      delete topics.placeholder;
      topics.disabled = false;
    } catch (e: any) {
      if ('response' in e) {
        topics.placeholder = `Get topics error: ${e.response.data.error}`;
        console.debug(e.response.data.error)
      } else {
        topics.placeholder = `${auth.email} ${auth.privateKey}-------Error: ${e}`;
      }
    }

    return topics;
  }
}

export interface IAuth {
  email: string;
  privateKey: string;
  projectId: string;
}

export interface ITopicsInfo {
  topics: { name: string }[],
}
