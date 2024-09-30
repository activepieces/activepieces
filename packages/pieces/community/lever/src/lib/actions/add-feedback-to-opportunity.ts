import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { LEVER_BASE_URL, LeverAuth, leverAuth } from '../..';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { LeverFieldMapping } from '../common';

export const addFeedbackToOpportunity = createAction({
  name: 'addFeedbackToOpportunity',
  displayName: 'Add feedback to opportunity',
  description: 'Provide feedback to a candidate after an interview',
  auth: leverAuth,
  props: {
    performAs: Property.Dropdown({
      displayName: 'Feedback author',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect first.',
            options: [],
          };
        }

        const users = [];
        let cursor = undefined;
        do {
          const queryParams: Record<string, string> = {
            include: 'name',
          };
          if (cursor) {
            queryParams['offset'] = cursor;
          }

          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${LEVER_BASE_URL}/users`,
            queryParams: queryParams,
            authentication: {
              type: AuthenticationType.BASIC,
              username: (auth as LeverAuth).apiKey,
              password: '',
            },
          });
          cursor = response.body.next;
          const usersPage = response.body.data.map(
            (user: { id: string; name: string }) => {
              return {
                label: user.name,
                value: user.id,
              };
            }
          );
          users.push(...usersPage);
        } while (cursor !== undefined);

        return {
          options: users,
        };
      },
    }),
    opportunityId: Property.ShortText({
      displayName: 'Opportunity ID',
      required: true,
    }),
    panelId: Property.Dropdown({
      displayName: 'Interview panel',
      description: 'If you select one, you must select an interview too',
      required: false,
      refreshers: ['auth', 'opportunityId'],
      options: async ({ auth, opportunityId }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect first.',
            options: [],
          };
        }
        if (!opportunityId) {
          return {
            disabled: true,
            placeholder: 'Please select a candidate (opportunity).',
            options: [],
          };
        }
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${LEVER_BASE_URL}/opportunities/${opportunityId}/panels?expand=stage&include=id&include=stage&include=start`,
          authentication: {
            type: AuthenticationType.BASIC,
            username: (auth as LeverAuth).apiKey,
            password: '',
          },
        });
        return {
          options: response.body.data.map(
            (panel: { id: string; start: number; stage: { text: string } }) => {
              const interviewDate = new Date(panel.start);
              return {
                label: `${interviewDate.toLocaleDateString()} - ${
                  panel.stage.text
                }`,
                value: panel.id,
              };
            }
          ),
        };
      },
    }),
    interviewId: Property.Dropdown({
      displayName: 'Interview',
      description: 'Mandatory is you select an interview panel',
      required: false,
      refreshers: ['auth', 'opportunityId', 'panelId'],
      options: async ({ auth, opportunityId, panelId }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect first.',
            options: [],
          };
        }
        if (!opportunityId) {
          return {
            disabled: true,
            placeholder: 'Please select a candidate (opportunity).',
            options: [],
          };
        }
        if (!panelId) {
          return {
            disabled: true,
            placeholder: 'Please select an interview panel.',
            options: [],
          };
        }
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${LEVER_BASE_URL}/opportunities/${opportunityId}/panels/${panelId}?include=interviews`,
          authentication: {
            type: AuthenticationType.BASIC,
            username: (auth as LeverAuth).apiKey,
            password: '',
          },
        });
        return {
          options: response.body.data.interviews.map(
            (interview: { id: string; subject: string }) => {
              return { label: interview.subject, value: interview.id };
            }
          ),
        };
      },
    }),
    feedbackTemplateId: Property.Dropdown({
      displayName: 'Feedback template',
      description: 'Ignored if you select an interview panel and an interview',
      required: false,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect first.',
            options: [],
          };
        }

        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${LEVER_BASE_URL}/feedback_templates`,
          authentication: {
            type: AuthenticationType.BASIC,
            username: (auth as LeverAuth).apiKey,
            password: '',
          },
        });
        return {
          options: response.body.data.map(
            (template: { id: string; text: string }) => {
              return {
                label: template.text,
                value: template.id,
              };
            }
          ),
        };
      },
    }),
    feedbackFields: Property.DynamicProperties({
      displayName: 'Fields',
      required: true,
      refreshers: [
        'auth',
        'opportunityId',
        'panelId',
        'interviewId',
        'feedbackTemplateId',
      ],
      props: async ({
        auth,
        opportunityId,
        panelId,
        interviewId,
        feedbackTemplateId,
      }) => {
        if (
          !auth ||
          !opportunityId ||
          !(feedbackTemplateId || (panelId && interviewId))
        ) {
          return {
            disabled: true,
            placeholder:
              'Please connect your Lever account first and select an interview or a feedback template',
            options: [],
          };
        }
        const fields: DynamicPropsValue = {};
        const templateId =
          panelId && interviewId
            ? await getFeedbackTemplateForInterview(
                opportunityId,
                panelId,
                interviewId,
                auth as LeverAuth
              )
            : feedbackTemplateId;

        try {
          const feedbackTemplateResponse = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${LEVER_BASE_URL}/feedback_templates/${templateId}`,
            authentication: {
              type: AuthenticationType.BASIC,
              username: (auth as LeverAuth).apiKey,
              password: '',
            },
          });
          feedbackTemplateResponse.body.data.fields.map(
            (field: {
              id: string;
              text: string;
              description: string;
              required: boolean;
              type: string;
              options?: { text: string; optionId: string }[];
              scores?: { text: string; description: string }[];
            }) => {
              const mappedField =
                LeverFieldMapping[field.type] || LeverFieldMapping['default'];
              mappedField.buildActivepieceType(fields, field);
            }
          );
        } catch (e) {
          console.error(
            'Unexpected error while building dynamic properties',
            e
          );
        }
        return fields;
      },
    }),
  },
  async run({ auth, propsValue }) {
    const templateId =
      propsValue.panelId && propsValue.interviewId
        ? await getFeedbackTemplateForInterview(
            propsValue.opportunityId,
            propsValue.panelId,
            propsValue.interviewId,
            auth as LeverAuth
          )
        : propsValue.feedbackTemplateId;

    const feedbackTemplateResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${LEVER_BASE_URL}/feedback_templates/${templateId}`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: (auth as LeverAuth).apiKey,
        password: '',
      },
    });

    const templateFields = feedbackTemplateResponse.body.data.fields;
    const groupedValues = Object.entries(propsValue.feedbackFields).reduce<
      Record<string, DynamicPropsValue[]>
    >((values, [fieldId, fieldValue]: [string, DynamicPropsValue]) => {
      const canonicalId = fieldId.substring(0, 36);
      values[canonicalId] = values[canonicalId] ?? [];
      values[canonicalId].push(fieldValue);
      return values;
    }, {});

    const payload = {
      baseTemplateId: templateId,
      panel: propsValue.panelId,
      interview: propsValue.interviewId,
      fieldValues: Object.entries(groupedValues).map(([fieldId, values]) => {
        const templateField = templateFields.find(
          (tf: { id: string }) => tf.id === fieldId
        );
        const mappedField =
          templateField.type in LeverFieldMapping
            ? LeverFieldMapping[templateField.type]
            : LeverFieldMapping['default'];
        return mappedField.buildLeverType(fieldId, values);
      }),
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${LEVER_BASE_URL}/opportunities/${propsValue.opportunityId}/feedback?perform_as=${propsValue.performAs}`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.apiKey,
        password: '',
      },
      body: payload,
    });

    return response.body.data;
  },
});

async function getFeedbackTemplateForInterview(
  opportunityId: string | DynamicPropsValue,
  panelId: string | DynamicPropsValue,
  interviewId: string | DynamicPropsValue,
  auth: LeverAuth
) {
  const interviewResponse = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${LEVER_BASE_URL}/opportunities/${opportunityId}/panels/${panelId}?include=interviews`,
    authentication: {
      type: AuthenticationType.BASIC,
      username: auth.apiKey,
      password: '',
    },
  });
  const interview = interviewResponse.body.data.interviews.find(
    (interview: { id: string }) =>
      interview.id === (interviewId as unknown as string)
  );
  return interview.feedbackTemplate;
}
