import {
  ImageToVideoCreateParams,
  TextToImageCreateParams,
} from '@runwayml/sdk/resources';

export interface AuthorizationParams {
  apiKey: string;
}

export interface GenerateImageFromTextParams
  extends AuthorizationParams,
    TextToImageCreateParams {}

export interface GenerateVideoFromImageParams
  extends AuthorizationParams,
    ImageToVideoCreateParams {}

export interface GetTaskDetailsParams extends AuthorizationParams {
  taskId: string;
}

export interface CancelOrDeleteATaskParams extends AuthorizationParams {
  taskId: string;
}
