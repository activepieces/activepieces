import { prompts, PromptTemplates } from '../config/prompts';

interface PromptVariables {
    [key: string]: string;
}

export class PromptTemplate {
    private static replaceVariables(template: string, variables: PromptVariables): string {
        console.debug('Replacing variables in template:', template);
        console.debug('Available variables:', variables);
        const result = template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
            const trimmedKey = key.trim();
            const value = variables[trimmedKey] || '';
            console.debug(`Replacing ${match} with:`, value);
            return value;
        });
        console.debug('Result after replacement:', result);
        return result;
    }

    private static processPromptSection(section: string[] | string, variables: PromptVariables): string {
        if (Array.isArray(section)) {
            return section.map(line => this.replaceVariables(line, variables)).join('\n');
        }
        return this.replaceVariables(section, variables);
    }

    static processCustomPrompt(customPrompt: string, variables: PromptVariables): string {
        console.debug('Processing custom prompt with variables:', variables);
        console.debug('Custom prompt template:', customPrompt);
        
        const processedPrompt = this.replaceVariables(customPrompt, variables);
        console.debug('Processed custom prompt:', processedPrompt);
        
        return processedPrompt;
    }

    static getPlannerPrompt(variables: PromptVariables): string {
        console.debug('Getting planner prompt with variables:', variables);
        const plannerPrompt = prompts.planner.default;
        console.debug('Using planner prompt template:', plannerPrompt);

        const sections = [
            plannerPrompt.system,
            this.processPromptSection(plannerPrompt.context, variables),
            this.processPromptSection(plannerPrompt.request, variables),
            this.processPromptSection(plannerPrompt.stepConfig, variables),
            this.processPromptSection(plannerPrompt.defaultGuidelines, variables),
            this.processPromptSection(plannerPrompt.requirements, variables),
            this.processPromptSection(plannerPrompt.important, variables)
        ];

        const finalPrompt = sections.filter(Boolean).join('\n\n');
        console.debug('Final generated prompt:', finalPrompt);
        return finalPrompt;
    }
} 