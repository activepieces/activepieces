import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { slidesApi } from '../commons/common';
import { slidesElements } from '../commons/elements';
import { slidesIds } from '../commons/ids';
import { slidesProps } from '../commons/props';
import { deleteElementsOutputSchema } from '../output-schemas';

export const deleteElements = createAction({
  auth: googleSlidesAuth,
  name: 'delete_elements',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Elements',
  description: 'Delete one or more elements (shapes, images, tables, groups…) from slides.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently delete one or more page elements (shapes, text boxes, images, tables, videos, lines, groups) by object ID, all in one atomic change: if any ID is wrong nothing is deleted. Deleting a group deletes its children. Use Delete Slide to remove a whole slide and Set Element Text with Clear Text to only empty a box. Get IDs from List Slide Elements or Get Presentation Outline. Not idempotent: a repeat fails because the elements are gone.',
    idempotent: false,
  },
  outputSchema: deleteElementsOutputSchema,
  props: {
    presentation_id: slidesProps.presentationIdProp(),
    object_ids: Property.Array({
      displayName: 'Element Object IDs',
      description: 'Object IDs of the elements to delete, e.g. ["g2c8d1e5a7f_0_3"].',
      required: true,
    }),
  },
  async run(context) {
    const presentationId = slidesIds.parsePresentationId(context.propsValue.presentation_id);
    const objectIds = slidesElements.readElementIds({ value: context.propsValue.object_ids, label: 'Element Object IDs' });
    const accessToken = await getAccessToken(context.auth);
    const action = 'delete the elements';
    const presentation = await slidesElements.fetchDeck({ accessToken, presentationId }).catch((error: unknown) => {
      throw slidesApi.googleApiError({ error, action });
    });
    const located = objectIds.map((objectId) => slidesElements.locateElement({ presentation, objectId }));
    const listed = new Set(objectIds);
    const topLevel = located.filter((entry) => !entry.ancestorGroupIds.some((groupId) => listed.has(groupId)));
    await slidesElements.applyRequests({
      accessToken,
      presentationId,
      requests: topLevel.map((entry) => ({ deleteObject: { objectId: entry.element.objectId } })),
      revisionId: presentation.revisionId,
      action,
    });
    return {
      presentationId,
      deletedObjectIds: objectIds,
      deletedCount: objectIds.length,
      slideObjectIds: Array.from(new Set(located.map((entry) => entry.slideObjectId))),
    };
  },
});
