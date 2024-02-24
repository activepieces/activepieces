import { Action, createReducer, on } from '@ngrx/store';
import { ProjectActions } from './project.action';
import { ProjectsState } from './project-state.model';

const initialState: ProjectsState = {
  selectedIndex: 0,
  projects: [],
  platform: undefined,
};

const _projectReducer = createReducer(
  initialState,
  on(
    ProjectActions.updateNotifyStatus,
    (state, { notifyStatus }): ProjectsState => {
      const updatedProjects = [...state.projects];
      updatedProjects[state.selectedIndex] = {
        ...state.projects[state.selectedIndex],
        notifyStatus: notifyStatus,
      };

      return {
        platform: state.platform,
        projects: updatedProjects,
        selectedIndex: state.selectedIndex,
      };
    }
  ),
  on(ProjectActions.updateLimits, (state, { limits }): ProjectsState => {
    const updatedProjects = [...state.projects];
    updatedProjects[state.selectedIndex] = {
      ...state.projects[state.selectedIndex],
      plan: {
        ...state.projects[state.selectedIndex].plan,
        tasks: limits.tasks,
      },
    };

    return {
      platform: state.platform,
      projects: updatedProjects,
      selectedIndex: state.selectedIndex,
    };
  }),
  on(
    ProjectActions.setProjects,
    (_state, { projects, platform, selectedIndex }): ProjectsState => {
      return {
        projects: projects,
        platform,
        selectedIndex: selectedIndex,
      };
    }
  ),
  // eslint-disable-next-line no-empty-pattern, @typescript-eslint/no-unused-vars
  on(ProjectActions.clearProjects, (_state, {}): ProjectsState => {
    return {
      projects: [],
      selectedIndex: 0,
      platform: undefined,
    };
  }),
  on(ProjectActions.updateProject, (state, { project }): ProjectsState => {
    const updatedProjects = [...JSON.parse(JSON.stringify(state.projects))];
    const index = updatedProjects.findIndex((p) => p.id === project.id);

    if (index < 0) {
      console.error("Project updated wasn't found in the list of projects");
    } else {
      updatedProjects[index] = project;
    }
    return {
      platform: state.platform,
      projects: updatedProjects,
      selectedIndex: state.selectedIndex,
    };
  }),
  on(ProjectActions.addProject, (state, { project }): ProjectsState => {
    const newState = JSON.parse(JSON.stringify(state));
    return {
      platform: newState.platform,
      projects: [...newState.projects, project],
      selectedIndex: newState.selectedIndex,
    };
  })
);

export function projectReducer(
  state: ProjectsState | undefined,
  action: Action
) {
  return _projectReducer(state, action);
}
