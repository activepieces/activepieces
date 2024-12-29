


// interface PromptVariables {
//     [key: string]: string;
// }

// export class PromptTemplate {
//     private static replaceVariables(template: string, variables: PromptVariables): string {
//         console.debug('Replacing variables in template', { template, variables });

//         return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
//             const trimmedKey = key.trim();
//             const value = variables[trimmedKey];
            
//             if (value === undefined) {
//                 return '';
//             }

//             return value;
//         });
//     }

//     private static processPromptSection(section: string[] | string, variables: PromptVariables): string {
        
//         if (Array.isArray(section)) {
//             return section.map(line => this.replaceVariables(line, variables)).join('\n');
//         }
//         return this.replaceVariables(section, variables);
//     }

//     static processCustomPrompt(customPrompt: string, variables: PromptVariables): string {

//         if (!customPrompt?.trim()) {
//             console.warn('[PromptTemplate] Warning: Empty custom prompt provided');
//             return '';
//         }

//         const processedPrompt = this.replaceVariables(customPrompt, variables);
//         return processedPrompt;
//     }

//     static getPlannerPrompt(variables: PromptVariables, customPrompt?: string): string {

//         // If custom prompt is provided, process it directly
//         if (customPrompt?.trim()) {
//             return this.processCustomPrompt(customPrompt, variables);
//         }
//         const plannerPrompt = prompts.planner.default

//         const sections = [
//             plannerPrompt.system,
//             this.processPromptSection(plannerPrompt.context, variables),
//             this.processPromptSection(plannerPrompt.request, variables),
//             this.processPromptSection(plannerPrompt.defaultGuidelines, variables),
//             this.processPromptSection(plannerPrompt.requirements, variables),
//             this.processPromptSection(plannerPrompt.important, variables)
//         ];

//         const finalPrompt = sections.filter(Boolean).join('\n\n');
//         return finalPrompt;
//     }
// } 