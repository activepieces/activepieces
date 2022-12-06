import { Project } from '../../model/project.interface';

export interface ProjectsState {
	loaded: boolean;
	selectedIndex: number;
	projects: Project[];
}
