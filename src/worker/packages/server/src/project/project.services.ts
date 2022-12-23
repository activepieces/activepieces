import { Project } from 'shared';
import { ProjectDTO } from 'shared/src/dto/projects/project-request';
import { projectRepo } from './project.repo';

export const projectService = {
  toDTO(project: Project): ProjectDTO {
    return {
      id: project.id,
      displayName: project.displayName,
    };
  },

  async listProjects(): Promise<ProjectDTO[]> {
    const projects = await projectRepo.find();
    return projects.map((project) => this.toDTO(project));
  },

  async createProject(projectDTO: Partial<ProjectDTO>): Promise<ProjectDTO> {
    const createdProject = await projectRepo.create({
      displayName: projectDTO.displayName,
    });
    await projectRepo.save(createdProject);
    return this.toDTO(createdProject);
  },

  async updateProject(
    id: string,
    projectDTO: Partial<ProjectDTO>
  ): Promise<ProjectDTO> {
    const project = await projectRepo.findOne({ where: { id } });
    if (!project) {
      throw new Error(`Project with ID ${id} not found`);
    }
    project.displayName = projectDTO.displayName;
    await projectRepo.save(project);

    return this.toDTO(project);
  },

  async getProjectById(id: string): Promise<ProjectDTO> {
    const project = await projectRepo.findOne({ where: { id } });
    if (!project) {
      throw new Error(`Project with id ${id} not found.`);
    }
    return this.toDTO(project);
  },
};
