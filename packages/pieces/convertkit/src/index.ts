import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getSubscriberById } from './lib/actions/get-user';

export const convertkitAuth = PieceAuth.SecretText({
  displayName: 'API Secret',
  description: 'Enter your API Secret key',
  required: true,
});

export const convertkit = createPiece({
  displayName: 'ConvertKit',
  auth: convertkitAuth,
  minimumSupportedRelease: '0.1.0',
  logoUrl:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAALVBMVEVHcEz8aXD8aXD8aHD7aXD8aXH7aXD7aXD7aXD7aXD8aXD7aXD7aXD7aXD7aXBzHgIEAAAADnRSTlMAvg1DpSJt1eJZ74CQMs9LoKAAAADYSURBVDiNlVNLFsQgCBO1/sv9jzvPURDUWUx2EAokRWP+gg1QEDF5d6c9LoSTD6iQ7MY33PEqvh68rnAXHlEUcM5nF4CCeCzYRvhSBcstmzZbdItntl8jZwYfNUGqmqZVGYGyFWUOZLVaK40g6ZXFR31sjdk8HeZeYA/XB+KXL8NjfykgI+AQOODImpuANQEzmbxfR+b/Oe8kaZ6cBl5G28jX0aXzKWai1/F66UiPQ3a5Ro5JnMho8OZw54X358nv7+JNO39Y59QmbTfuqy5A71Og3Z/uD3wAxuQY2rMDSakAAAAASUVORK5CYII=',
  authors: [],
  actions: [getSubscriberById],
  triggers: [],
});
