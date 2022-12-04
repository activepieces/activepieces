import { Project } from '../../model/project.interface';

export interface ProjectsState {
	loaded: boolean;
	selectedIndex: undefined | number;
	projects: Project[];
}
