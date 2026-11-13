import { Property } from '@activepieces/pieces-framework';

export const figmaProps = {
  fileKey: (description?: string) =>
    Property.ShortText({
      displayName: 'File Key',
      description:
        description ??
        'The Figma file URL (e.g. https://www.figma.com/design/<key>/<name>) or just the file key from it. Branch URLs target the branch.',
      required: true,
    }),
  nodeIds: ({ required, description }: { required: boolean; description: string }) =>
    Property.Array({
      displayName: 'Node IDs',
      description,
      required,
    }),
  commentId: (description: string) =>
    Property.ShortText({
      displayName: 'Comment ID',
      description,
      required: true,
    }),
  cursor: Property.ShortText({
    displayName: 'Cursor',
    description: 'Leave empty for the first page. To get the next page, pass the Next Cursor from the previous run.',
    required: false,
  }),
};
