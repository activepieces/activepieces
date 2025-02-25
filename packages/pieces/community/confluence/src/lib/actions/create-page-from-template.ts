import { confluenceAuth } from "../../index";
import { createAction, Property } from "@activepieces/pieces-framework";
import { folderIdProp, spaceIdProp, templateIdProp, templateVariablesProp } from "../common/props";
import { confluenceApiCall } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const createPageFromTemplateAction = createAction({
    auth:confluenceAuth,
    name:'create-page-from-template',
    displayName:'Create Page from Template',
    description:'Creates a new page from a template with the given title and variables.',
    props:{
        spaceId:spaceIdProp,
        templateId:templateIdProp,
        folderId:folderIdProp,
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
        templateVariables:templateVariablesProp,
    },
    async run(context){
        const {spaceId,templateId,title,status,folderId} = context.propsValue;
        const variables = context.propsValue.templateVariables ??{};

        const template = await confluenceApiCall<{ body: { storage: { value: string } } }>({
                    domain: context.auth.confluenceDomain,
                    username: context.auth.username,
                    password: context.auth.password,
                    method: HttpMethod.GET,
                    version: 'v1',
                    resourceUri: `/template/${templateId}`,
                });
        
        const body = template.body.storage.value;

        let content = body.replace(/<at:declarations>[\s\S]*?<\/at:declarations>/, "").trim();
        Object.entries(variables).forEach(([key, value]) => {
            const varRegex = new RegExp(`<at:var at:name=(['"])${key}\\1\\s*\\/?>`, "g");
            content = content.replace(varRegex, value);
          });

        const response = await confluenceApiCall({
            domain: context.auth.confluenceDomain,
            username: context.auth.username,
            password: context.auth.password,
            method: HttpMethod.POST,
            version: 'v2',
            resourceUri: '/pages',
            body: {
                spaceId:spaceId,
                title,
                parentId:folderId,
                status,
                body:{
                    representation:'storage',
                    value:content,
                }
            }
        })

        return response;
    }
})