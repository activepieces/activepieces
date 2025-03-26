import { HttpMethod, AuthenticationType, HttpRequest, httpClient } from "@activepieces/pieces-common";
import { SeekPage, UserWithMetaInformation } from "@activepieces/shared";

export async function sendTodoApproval(context: any, isTest: boolean) {
    const requestBody = {
      title: context.propsValue.title,
      description: context.propsValue.description ?? undefined,
      statusOptions: context.propsValue.statusOptions.map((option: any) => ({
        name: option.name,
        description: option.description,
        variant: option.variant,
      })),
      flowId: context.flows.current.id,
      runId: isTest ? undefined : context.run.id,
      assigneeId: context.propsValue.assigneeId ?? undefined,
      resolveUrl: context.generateResumeUrl({
        queryParams: {  },
      }),
    };
  
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${context.server.publicUrl}v1/todos`,
      body: requestBody,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.server.token,
      },
    };
  
    return await httpClient.sendRequest(request);
  }
  
  export async function listAssignee(
    publicUrl: string,
    token: string
  ): Promise<SeekPage<UserWithMetaInformation>> {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${publicUrl}v1/todos/assignees`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: token,
      },
    };
    const res = await httpClient.sendRequest<SeekPage<UserWithMetaInformation>>(
      request
    );
    return res.body;
  }
  