import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { refreshSheetsCharts } from './lib/actions/refresh-charts';
import { generateFromTemplate } from './lib/actions/generate-from-template';
import { getPresentation } from './lib/actions/get-presentation';
import { createPresentation } from './lib/actions/create-presentation';
import { copyPresentation } from './lib/actions/copy-presentation';
import { findPresentations } from './lib/actions/find-presentations';
import { getPresentationOutline } from './lib/actions/get-presentation-outline';
import { getSlide } from './lib/actions/get-slide';
import { getSlideThumbnail } from './lib/actions/get-slide-thumbnail';
import { addSlide } from './lib/actions/add-slide';
import { duplicateSlide } from './lib/actions/duplicate-slide';
import { moveSlide } from './lib/actions/move-slide';
import { deleteSlide } from './lib/actions/delete-slide';
import { replaceText } from './lib/actions/replace-text';
import { replaceShapesWithImage } from './lib/actions/replace-shapes-with-image';
import { insertImage } from './lib/actions/insert-image';
import { setSpeakerNotes } from './lib/actions/set-speaker-notes';
import { exportPresentation } from './lib/actions/export-presentation';
import { batchUpdate } from './lib/actions/batch-update';
import { listSlideElements } from './lib/actions/list-slide-elements';
import { createShape } from './lib/actions/create-shape';
import { insertText } from './lib/actions/insert-text';
import { setElementText } from './lib/actions/set-element-text';
import { updateTextStyle } from './lib/actions/update-text-style';
import { updateParagraphStyle } from './lib/actions/update-paragraph-style';
import { updateShapeProperties } from './lib/actions/update-shape-properties';
import { moveResizeElement } from './lib/actions/move-resize-element';
import { deleteElements } from './lib/actions/delete-elements';
import { createTable } from './lib/actions/create-table';
import { insertTableRowsOrColumns } from './lib/actions/insert-table-rows-or-columns';
import { deleteTableRowsOrColumns } from './lib/actions/delete-table-rows-or-columns';
import { setSlideBackground } from './lib/actions/set-slide-background';
import { insertVideo } from './lib/actions/insert-video';
import { replaceImage } from './lib/actions/replace-image';
import { getAccessToken, googleSlidesAuth, GoogleSlidesAuthValue } from './lib/auth';

export { googleSlidesAuth, getAccessToken, GoogleSlidesAuthValue } from './lib/auth';

export const googleSlide = createPiece({
  displayName: 'Google Slides',
  auth: googleSlidesAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-slides.png',
  authors: ['Kevinyu-alan'],
  actions: [
    getPresentation,
    refreshSheetsCharts,
    generateFromTemplate,
    createPresentation,
    copyPresentation,
    findPresentations,
    getPresentationOutline,
    getSlide,
    getSlideThumbnail,
    addSlide,
    duplicateSlide,
    moveSlide,
    deleteSlide,
    replaceText,
    replaceShapesWithImage,
    insertImage,
    setSpeakerNotes,
    exportPresentation,
    batchUpdate,
    listSlideElements,
    createShape,
    insertText,
    setElementText,
    updateTextStyle,
    updateParagraphStyle,
    updateShapeProperties,
    moveResizeElement,
    deleteElements,
    createTable,
    insertTableRowsOrColumns,
    deleteTableRowsOrColumns,
    setSlideBackground,
    insertVideo,
    replaceImage,
    createCustomApiCallAction({
      baseUrl: () => 'https://slides.googleapis.com/v1/presentations/',
      auth: googleSlidesAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${await getAccessToken(auth as GoogleSlidesAuthValue)}`,
      }),
    }),
  ],
  triggers: [],
});
