import { createAction } from '@activepieces/pieces-framework';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { slidesApi } from '../commons/common';
import { slidesElements } from '../commons/elements';
import { slidesIds } from '../commons/ids';
import { slidesText } from '../commons/presentation-text';
import { slidesProps } from '../commons/props';
import { slidesRequests } from '../commons/requests';
import { listSlideElementsOutputSchema } from '../output-schemas';

export const listSlideElements = createAction({
  auth: googleSlidesAuth,
  name: 'list_slide_elements',
  classification: 'READ',
  displayName: 'List Slide Elements',
  description: 'List the elements on one slide with their position, size and text, in points.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List every element on one slide (including those inside groups) with its object ID, type, position and size in points, rotation, text, table size and cell texts, and parent group, plus the slide size. Pick this before placing, moving, resizing or styling elements, so you know where things are and which object IDs to pass; Get Presentation Outline is enough when you only need text and IDs across the whole deck. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listSlideElementsOutputSchema,
  props: {
    presentation_id: slidesProps.presentationIdProp(),
    slide_number: slidesProps.slideNumberProp(),
    slide_object_id: slidesProps.slideObjectIdProp(),
  },
  async run(context) {
    const presentationId = slidesIds.parsePresentationId(context.propsValue.presentation_id);
    const selector = slidesRequests.readSlideSelector({
      slideNumber: context.propsValue.slide_number,
      slideObjectId: context.propsValue.slide_object_id,
    });
    const accessToken = await getAccessToken(context.auth);
    const action = 'list the slide elements';
    const presentation = await slidesApi
      .getPresentation({ accessToken, presentationId, fields: 'presentationId,pageSize,slides(objectId)' })
      .catch((error: unknown) => {
        throw slidesApi.googleApiError({ error, action });
      });
    const { objectId, index } = slidesRequests.resolveSlide({ slides: presentation.slides ?? [], selector });
    const slide = await slidesApi.getPage({ accessToken, presentationId, pageObjectId: objectId }).catch((error: unknown) => {
      throw slidesApi.googleApiError({ error, action });
    });
    const entries = slidesElements.slideEntries(slide.pageElements);
    const elements = entries.map((entry) => {
      const type = slidesText.elementType(entry.element);
      const size = type === 'TABLE' ? slidesElements.tableSize(entry.element) : null;
      return {
        objectId: entry.element.objectId,
        type,
        shapeType: entry.element.shape?.shapeType ?? null,
        placeholderType: entry.element.shape?.placeholder?.type ?? null,
        parentGroupId: entry.parentGroupId,
        ...slidesElements.entryGeometry({ entry, entries }),
        text: slidesText.elementText(entry.element),
        tableRows: size?.rows ?? null,
        tableColumns: size?.columns ?? null,
        tableCells: entry.element.table
          ? (entry.element.table.tableRows ?? []).map((row) =>
              (row.tableCells ?? []).map((cell) => slidesText.stripTrailingNewlines(slidesText.joinText(cell.text)))
            )
          : null,
      };
    });
    const width = slidesElements.dimensionToEmu(presentation.pageSize?.width);
    const height = slidesElements.dimensionToEmu(presentation.pageSize?.height);
    return {
      presentationId,
      slideObjectId: objectId,
      slideNumber: index + 1,
      slideWidth: width === undefined ? null : slidesElements.emuToPt(width),
      slideHeight: height === undefined ? null : slidesElements.emuToPt(height),
      elementCount: elements.length,
      elements,
    };
  },
});
