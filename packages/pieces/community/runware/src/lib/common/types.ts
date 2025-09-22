import {
    IRemoveImageBackground,
    IRequestImage,
    IRequestVideo,
} from '@runware/sdk-js';

export interface AuthorizationParams {
  apiKey: string;
}

export interface GenerateImagesParams
  extends AuthorizationParams,
    IRequestImage {}

export interface GenerateVideoFromTextParams
  extends AuthorizationParams,
    IRequestVideo {}

export interface ImageBackgroundRemovalParams
  extends AuthorizationParams,
    IRemoveImageBackground {}
