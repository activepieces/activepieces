import { Action, createReducer, on } from '@ngrx/store';
import { ProjectActions } from '../action/project.action';
import { ProjectsState } from '../model/projects-state.model';

const initialState: ProjectsState = {
	loaded: false,
	selectedIndex: 0,
	projects: [],
};

const _projectReducer = createReducer(
	initialState,
	on(ProjectActions.setProjects, (state, { projects }): ProjectsState => {
		return { projects: projects, loaded: true, selectedIndex: projects.length > 0 ? 0 : undefined };
	}),
	on(ProjectActions.clearProjects, (state, {}): ProjectsState => {
		return { projects: [], loaded: false, selectedIndex: undefined };
	})
);

export function projectReducer(state: ProjectsState | undefined, action: Action) {
	return _projectReducer(state, action);
}
