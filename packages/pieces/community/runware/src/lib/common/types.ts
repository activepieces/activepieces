import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import {
    IRemoveImageBackground,
    IRequestImage,
    IRequestVideo,
} from '@runware/sdk-js';
import { runwareAuth } from '.';

export interface AuthorizationParams {
  apiKey: AppConnectionValueForAuthProperty<typeof runwareAuth>;
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
