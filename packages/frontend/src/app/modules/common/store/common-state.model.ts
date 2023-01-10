import { AppCredential, Project } from 'shared';

export interface CommonStateModel {
	readonly projectsState: ProjectsState;
}

export interface ProjectsState {
	loaded: boolean;
	selectedIndex: number;
	projects: Project[];
}

export interface AppCredentialState {
	loaded: boolean;
	appCredentials: AppCredential[];
}

export interface AppConnectionState {
	loaded: boolean;
	appCredentials: AppConnectionState[];
}