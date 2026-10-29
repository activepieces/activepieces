import { confluenceAuth } from '../auth';
import { createAction, Property } from "@activepieces/pieces-framework";
import { confluenceApi } from '../common/api';
import { confluenceProps } from '../common/props';
import { createPageOutputSchema } from '../output-schemas';

export const createPageFromTemplateAction = createAction({
    auth:confluenceAuth,
    name:'create-page-from-template',
    outputSchema: createPageOutputSchema,
    classification: 'WRITE',
    displayName:'Create Page from Template',
    description:'Creates a new page from a template with the given title and variables.',
    audience: 'both',
    aiMetadata: { description: 'Creates a new Confluence page by fetching a template, substituting its declared variables with the provided values, and posting the rendered content as a page (published or draft) in the given space. Use when a page should follow a predefined template rather than free-form body. Requires the template ID and matching variable names. Not idempotent: each call creates another page.', idempotent: false },
    props:{
        spaceId:confluenceProps.spaceId({ required: true }),
        templateId:confluenceProps.templateId({ required: true }),
        folderId:confluenceProps.folderId({ required: false }),
        title:Property.ShortText({
            displayName:'Title',
            required:true,
        }),
        status:Property.StaticDropdown({
            displayName:'Status',
            required:true,
            defaultValue:'draft',
            options:{
                disabled:false,
                options:[
                    {
                        label:'Published ',
                        value:'current'
                    },
                    {
                        label:'Draft',
                        value:'draft'
                    }
                ]
            }
        }),
        templateVariables:confluenceProps.templateVariables({ required: false }),
    },
    async run(context){
        const {spaceId,templateId,title,status,folderId} = context.propsValue;
        const variables = context.propsValue.templateVariables ??{};

        const template = await confluenceApi.getTemplate({ auth: context.auth, templateId });
        
        const body = template.body.storage.value;

        let content = body.replace(/<at:declarations>[\s\S]*?<\/at:declarations>/, "").trim();
        Object.entries(variables).forEach(([key, value]) => {
            const varRegex = new RegExp(`<at:var at:name=(['"])${key}\\1\\s*\\/?>`, "g");
            const safeValue = typeof value === 'string' ? escapeStorageValue(value) : '';
            content = content.replace(varRegex, safeValue);
          });

        return await confluenceApi.createPage({
            auth: context.auth,
            spaceId,
            title,
            parentId: folderId,
            status,
            representation: 'storage',
            value: content,
        });
    }
})

function escapeStorageValue(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}
