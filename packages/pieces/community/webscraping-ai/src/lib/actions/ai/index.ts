import { askQuestionAction } from './ask-question';
import { extractFieldsAction } from './extract-fields';
import { getAccountAction } from './get-account';
import { getHtmlAction } from './get-html';
import { getSelectedHtmlAction } from './get-selected-html';
import { getSelectedMultipleAction } from './get-selected-multiple';
import { getStructuredDataAction } from './get-structured-data';
import { getTextAction } from './get-text';
import { postHtmlAction } from './post-html';
import { postSelectedHtmlAction } from './post-selected-html';
import { postSelectedMultipleAction } from './post-selected-multiple';
import { postTextAction } from './post-text';
import { searchGoogleAction } from './search-google';

export const webscrapingAiAiActions = [
	getHtmlAction,
	postHtmlAction,
	getTextAction,
	postTextAction,
	getSelectedHtmlAction,
	postSelectedHtmlAction,
	getSelectedMultipleAction,
	postSelectedMultipleAction,
	askQuestionAction,
	extractFieldsAction,
	searchGoogleAction,
	getStructuredDataAction,
	getAccountAction,
];
