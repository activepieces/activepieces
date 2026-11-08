import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { addSlide } from './lib/actions/add-slide';
import { addSlideAi, exportPresentationAi, generatePresentationAi, generateSpeakerNotesAi } from './lib/actions/ai-actions';
import { alaiCustomApiCall } from './lib/actions/custom-api-call';
import { deletePresentation } from './lib/actions/delete-presentation';
import { deleteSlide } from './lib/actions/delete-slide';
import { exportPresentation } from './lib/actions/export-presentation';
import { generatePresentation } from './lib/actions/generate-presentation';
import { generateSpeakerNotes } from './lib/actions/generate-speaker-notes';
import { getGeneration } from './lib/actions/get-generation';
import { listPresentations, listThemes, listVibes } from './lib/actions/list-resources';
import { uploadImages } from './lib/actions/upload-images';
import { alaiAuth } from './lib/common/auth';

export const alai = createPiece({
  displayName: 'Alai',
  auth: alaiAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/alai.png',
  authors: ['getalai', 'sanket-a11y', 'OdaiAhmed99'],
  description: 'AI-powered presentation generation API. Create, export, and manage professional presentations from text.',
  categories: [PieceCategory.CONTENT_AND_FILES, PieceCategory.ARTIFICIAL_INTELLIGENCE],
  actions: [
    generatePresentation,
    generatePresentationAi,
    addSlideAi,
    exportPresentationAi,
    generateSpeakerNotesAi,
    getGeneration,
    exportPresentation,
    addSlide,
    deletePresentation,
    listPresentations,
    listThemes,
    listVibes,
    deleteSlide,
    generateSpeakerNotes,
    uploadImages,
    alaiCustomApiCall,
  ],
  triggers: [],
});
