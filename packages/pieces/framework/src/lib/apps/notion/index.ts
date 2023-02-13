import { createPiece } from '../../framework/piece';
import { notionCreateDatabasePage } from './actions/create-database-page';

export const notion = createPiece({
	name: 'notion',
	displayName: "Notion",
	logoUrl: 'https://www.notion.so/cdn-cgi/image/format=auto,width=128,quality=100/front-static/shared/icons/notion-app-icon-3d.png',
	actions: [notionCreateDatabasePage],
	triggers: [],
});
