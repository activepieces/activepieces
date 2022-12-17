import {createComponent} from '../../framework/component';
import {newGithubStar} from "./trigger/new-star";

export const github = createComponent({
	name: 'github',
	displayName: "Github",
	logoUrl: 'https://cdn.activepieces.com/components/github/logo.png',
	actions: [],
	triggers: [newGithubStar],
});
