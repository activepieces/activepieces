export interface PlannerPromptTemplate {
    system: string;
    context: string;
    request: string;
    defaultGuidelines: string[];
    requirements: string[];
    important: string[];
}

export interface PromptTemplates {
    planner: {
        default: PlannerPromptTemplate;
    };
}

export const prompts: PromptTemplates = {
    planner: {
        default: {
            system: "You are a planner agent that creates high-level plans for automation flows.",
            context: "{{available_pieces}}",
            request: "User request: {{user_prompt}}",
            defaultGuidelines: [
                "Create a high-level plan that:",
                "1. Starts with a trigger step",
                "2. Includes necessary action steps",
                "3. Uses router steps only when conditional logic is needed"
            ],
            requirements: [
                "The plan should have:",
                "- A descriptive name that summarizes what it does",
                "- A clear description of its purpose",
                "- A sequence of steps with their types and piece information"
            ],
            important: [
                "IMPORTANT:",
                "- First try to use piece triggers and actions directly",
                "- Only use ROUTER if the logic cannot be handled by piece capabilities",
                "- Keep the plan as simple as possible while meeting the requirements"
            ]
        }
    }
}; 