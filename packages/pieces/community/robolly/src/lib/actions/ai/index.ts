import { createHiddenRenderLinkAction } from './create-hidden-render-link';
import { createTemplateAction } from './create-template';
import { getRenderAction } from './get-render';
import { listGalleryTemplatesAction } from './list-gallery-templates';
import { listRendersAction } from './list-renders';
import { listTemplateElementsAction } from './list-template-elements';
import { listTemplatesAction } from './list-templates';
import { renderTemplateAction } from './render-template';
import { updateTemplateAction } from './update-template';

export const robollyAiActions = [
	listTemplatesAction,
	listTemplateElementsAction,
	listGalleryTemplatesAction,
	createTemplateAction,
	updateTemplateAction,
	renderTemplateAction,
	createHiddenRenderLinkAction,
	getRenderAction,
	listRendersAction,
];
