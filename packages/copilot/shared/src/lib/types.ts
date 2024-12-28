export interface PlannerPromptTemplate {
  system: string;
  context: string;
  request: string;
  defaultGuidelines: string[];
  requirements: string[];
  important: string[];
} 