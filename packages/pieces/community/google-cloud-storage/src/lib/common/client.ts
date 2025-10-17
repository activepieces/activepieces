import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';


interface CreateBucketRequestBody {
  name: string;
  location: string;
  storageClass: string;
  versioning?: {
    enabled: boolean;
  };
  iamConfiguration?: {
    uniformBucketLevelAccess: {
      enabled: boolean;
    };
  };
}


interface CloneObjectRequestBody {
    contentType?: string;
    metadata?: Record<string, string>;
    storageClass?: string;
}

interface CreateAclRequestBody {
    entity: string;
    role: 'READER' | 'OWNER';
}

interface CreateBucketAclRequestBody {
    entity: string;
    role: 'READER' | 'WRITER' | 'OWNER';
}

interface CreateBucketDefaultObjectAclRequestBody {
    entity: string;
    role: 'READER' | 'OWNER';
}




export class GoogleCloudStorageClient {
  private readonly GCS_API_URL = 'https://storage.googleapis.com/storage/v1';
  private readonly GCRM_API_URL = 'https://cloudresourcemanager.googleapis.com/v1';
  private readonly PUBSUB_API_URL = 'https://pubsub.googleapis.com/v1';

  constructor(private readonly accessToken: string) {}

  /**
   * Searches/Lists objects (files) within a bucket based on criteria.
   */
  async searchObjects(params: {
    bucketName: string;
    prefix?: string;
    delimiter?: string;
    startOffset?: string;
    endOffset?: string;
    maxResults?: number;
    versions?: boolean;
  }) {
    const queryParams: QueryParams = {};
    if (params.prefix) queryParams['prefix'] = params.prefix;
    if (params.delimiter) queryParams['delimiter'] = params.delimiter;
    if (params.startOffset) queryParams['startOffset'] = params.startOffset;
    if (params.endOffset) queryParams['endOffset'] = params.endOffset;
    if (params.maxResults) queryParams['maxResults'] = params.maxResults.toString();
    if (params.versions) queryParams['versions'] = 'true';

    const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${this.GCS_API_URL}/b/${params.bucketName}/o`,
        queryParams: queryParams,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: this.accessToken,
        },
    };
    const response = await httpClient.sendRequest<{ items: { name: string; id: string }[], prefixes: string[] }>(request);
    return response.body;
  }

  /**
   * Lists all projects the authenticated user has access to.
   */
  async listProjects(): Promise<{ projects: { name: string; projectId: string }[] }> {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${this.GCRM_API_URL}/projects`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.accessToken,
      },
    };
    const response = await httpClient.sendRequest<{ projects: { name: string; projectId: string }[] }>(request);
    return response.body;
  }

  /**
   * Lists all storage buckets within a specific Google Cloud project.
   * @param projectId The ID of the Google Cloud project.
   */
  async listBuckets(projectId: string): Promise<{ items: { name: string; id: string }[] }> {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${this.GCS_API_URL}/b`,
      queryParams: {
        project: projectId,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.accessToken,
      },
    };
    const response = await httpClient.sendRequest<{ items: { name: string; id: string }[] }>(request);
    return response.body;
  }

  /**
   * Lists objects (files) within a specific storage bucket.
   * @param bucketName The name of the bucket.
   */
  async listObjects(bucketName: string): Promise<{ items: { name: string; id: string }[] }> {
    const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${this.GCS_API_URL}/b/${bucketName}/o`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: this.accessToken,
        },
    };
    const response = await httpClient.sendRequest<{ items: { name: string; id: string }[] }>(request);
    return response.body;
  }

  /**
   * Creates a new storage bucket in a specific project.
   * @param projectId The ID of the Google Cloud project.
   * @param body The configuration for the new bucket.
   */
  async createBucket(projectId: string, body: CreateBucketRequestBody) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${this.GCS_API_URL}/b`,
      queryParams: {
        project: projectId,
      },
      body: body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.accessToken,
      },
    };
    const response = await httpClient.sendRequest(request);
    return response.body;
  }

  /**
   * Deletes an empty bucket.
   * @param bucketName The globally unique name of the bucket.
   */
  async deleteEmptyBucket(bucketName: string): Promise<void> {
    const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `${this.GCS_API_URL}/b/${bucketName}`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: this.accessToken,
        },
    };
    await httpClient.sendRequest(request);
  }
  
  /**
   * Clones an object to a new location, with optional metadata override.
   */
  async cloneObject(params: {
    sourceBucket: string;
    sourceObject: string;
    destinationBucket: string;
    destinationObject: string;
    metadata?: CloneObjectRequestBody;
  }) {
    const encodedSourceObject = encodeURIComponent(params.sourceObject);
    const encodedDestinationObject = encodeURIComponent(params.destinationObject);

    const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${this.GCS_API_URL}/b/${params.sourceBucket}/o/${encodedSourceObject}/copyTo/b/${params.destinationBucket}/o/${encodedDestinationObject}`,
        body: params.metadata ?? {},
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: this.accessToken,
        },
    };
    const response = await httpClient.sendRequest(request);
    return response.body;
  }

  /**
   * Deletes a specific object from a bucket.
   * @param bucketName The name of the bucket containing the object.
   * @param objectName The name of the object to delete.
   */
  async deleteObject(bucketName: string, objectName: string): Promise<void> {
    const encodedObjectName = encodeURIComponent(objectName);
    const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `${this.GCS_API_URL}/b/${bucketName}/o/${encodedObjectName}`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: this.accessToken,
        },
    };
    await httpClient.sendRequest(request);
  }

  /**
   * Creates an Access Control List (ACL) entry on an object.
   * @param bucketName The name of the bucket.
   * @param objectName The name of the object.
   * @param body The ACL entity and role to grant.
   */
  async createObjectAcl(bucketName: string, objectName: string, body: CreateAclRequestBody) {
    const encodedObjectName = encodeURIComponent(objectName);
    const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${this.GCS_API_URL}/b/${bucketName}/o/${encodedObjectName}/acl`,
        body: body,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: this.accessToken,
        },
    };
    const response = await httpClient.sendRequest(request);
    return response.body;
  }

  /**
   * Deletes an Access Control List (ACL) entry from an object.
   * @param bucketName The name of the bucket.
   * @param objectName The name of the object.
   * @param entity The ACL entity to revoke permission from.
   */
  async deleteObjectAcl(bucketName: string, objectName: string, entity: string): Promise<void> {
    const encodedObjectName = encodeURIComponent(objectName);
    const encodedEntity = encodeURIComponent(entity);
    const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `${this.GCS_API_URL}/b/${bucketName}/o/${encodedObjectName}/acl/${encodedEntity}`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: this.accessToken,
        },
    };
    await httpClient.sendRequest(request);
  }

   /**
   * Creates an Access Control List (ACL) entry on a bucket.
   * @param bucketName The name of the bucket.
   * @param body The ACL entity and role to grant.
   */
  async createBucketAcl(bucketName: string, body: CreateBucketAclRequestBody) {
    const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${this.GCS_API_URL}/b/${bucketName}/acl`,
        body: body,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: this.accessToken,
        },
    };
    const response = await httpClient.sendRequest(request);
    return response.body;
  }

  /**
   * Deletes an Access Control List (ACL) entry from a bucket.
   * @param bucketName The name of the bucket.
   * @param entity The ACL entity to revoke permission from.
   */
  async deleteBucketAcl(bucketName: string, entity: string): Promise<void> {
    const encodedEntity = encodeURIComponent(entity);
    const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `${this.GCS_API_URL}/b/${bucketName}/acl/${encodedEntity}`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: this.accessToken,
        },
    };
    await httpClient.sendRequest(request);
  }

  /**
   * Creates a Default Object Access Control List (ACL) entry on a bucket.
   * @param bucketName The name of the bucket.
   * @param body The ACL entity and role to grant.
   */
  async createBucketDefaultObjectAcl(bucketName: string, body: CreateBucketDefaultObjectAclRequestBody) {
    const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${this.GCS_API_URL}/b/${bucketName}/defaultObjectAcl`,
        body: body,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: this.accessToken,
        },
    };
    const response = await httpClient.sendRequest(request);
    return response.body;
  }

  /**
   * Deletes a Default Object Access Control List (ACL) entry from a bucket.
   * @param bucketName The name of the bucket.
   * @param entity The ACL entity to revoke permission from.
   */
  async deleteBucketDefaultObjectAcl(bucketName: string, entity: string): Promise<void> {
    const encodedEntity = encodeURIComponent(entity);
    const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `${this.GCS_API_URL}/b/${bucketName}/defaultObjectAcl/${encodedEntity}`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: this.accessToken,
        },
    };
    await httpClient.sendRequest(request);
  }

  /**
   * Creates a Pub/Sub topic.
   */
  async createPubSubTopic(projectId: string, topicName: string) {
    const request: HttpRequest = {
      method: HttpMethod.PUT,
      url: `${this.PUBSUB_API_URL}/projects/${projectId}/topics/${topicName}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.accessToken,
      },
    };
    return await httpClient.sendRequest(request);
  }

  /**
   * Deletes a Pub/Sub topic.
   */
  async deletePubSubTopic(projectId: string, topicName: string) {
    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `${this.PUBSUB_API_URL}/projects/${projectId}/topics/${topicName}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.accessToken,
      },
    };
    return await httpClient.sendRequest(request);
  }

  /**
   * Grants GCS service account permission to publish to a topic.
   */
  async grantTopicPermissions(projectId: string, topicName: string) {
    const gcsServiceAccount = 'service-' + (await this.getProjectNumber(projectId)) + '@gs-project-accounts.iam.gserviceaccount.com';
    const requestBody = {
      policy: {
        bindings: [
          {
            role: 'roles/pubsub.publisher',
            members: [`serviceAccount:${gcsServiceAccount}`],
          },
        ],
      },
    };
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${this.PUBSUB_API_URL}/projects/${projectId}/topics/${topicName}:setIamPolicy`,
      body: requestBody,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.accessToken,
      },
    };
    return await httpClient.sendRequest(request);
  }
  
  /**
   * Helper to get the project number needed for service account permissions.
   */
  private async getProjectNumber(projectId: string): Promise<string> {
    const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${this.GCRM_API_URL}/projects/${projectId}`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: this.accessToken,
        },
    };
    const response = await httpClient.sendRequest<{ projectNumber: string }>(request);
    return response.body.projectNumber;
  }
  
  /**
   * Creates a notification configuration on a bucket for specific event types.
   */
  async createBucketNotification(
    bucketName: string,
    topicName: string,
    projectId: string,
    eventTypes: string[]
  ) {
    const requestBody = {
      topic: `//pubsub.googleapis.com/projects/${projectId}/topics/${topicName}`,
      payload_format: 'JSON_API_V1',
      event_types: eventTypes,
    };
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${this.GCS_API_URL}/b/${bucketName}/notificationConfigs`,
      body: requestBody,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.accessToken,
      },
    };
    const response = await httpClient.sendRequest<{ id: string }>(request);
    return response.body;
  }
  
  /**
   * Deletes a notification configuration from a bucket.
   */
  async deleteBucketNotification(bucketName: string, notificationId: string) {
    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `${this.GCS_API_URL}/b/${bucketName}/notificationConfigs/${notificationId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.accessToken,
      },
    };
    return await httpClient.sendRequest(request);
  }
  
  /**
   * Creates a Pub/Sub subscription to a topic, pointing to a webhook.
   */
  async createPubSubSubscription(projectId: string, topicName: string, subscriptionName: string, webhookUrl: string) {
    const requestBody = {
      topic: `projects/${projectId}/topics/${topicName}`,
      pushConfig: {
        pushEndpoint: webhookUrl,
      },
    };
    const request: HttpRequest = {
      method: HttpMethod.PUT,
      url: `${this.PUBSUB_API_URL}/projects/${projectId}/subscriptions/${subscriptionName}`,
      body: requestBody,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.accessToken,
      },
    };
    return await httpClient.sendRequest(request);
  }

  /**
   * Deletes a Pub/Sub subscription.
   */
  async deletePubSubSubscription(projectId: string, subscriptionName: string) {
    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `${this.PUBSUB_API_URL}/projects/${projectId}/subscriptions/${subscriptionName}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.accessToken,
      },
    };
    return await httpClient.sendRequest(request);
  }
}