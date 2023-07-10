import { OAuth2PropertyValue, Property } from "@activepieces/pieces-framework";
import { Client } from "@notionhq/client";

export const notionCommon = {
    baseUrl: "https://api.notion.com/v1",
    database_id: Property.Dropdown<string>({
        displayName: "Database",
        required: true,
        description: "Select the database you want to use",
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: "Please connect your Notion account first",
                    options: []
                }
            }
            const notion = new Client({
                auth: (auth as OAuth2PropertyValue).access_token,
                notionVersion: "2022-02-22",
            });
            const databases = await notion.search({
                filter: {
                    property: "object",
                    value: "database",
                }
            });
            return {
                placeholder: "Select a database",
                options: databases.results.map((database: any) => ({
                    label: database.title[0].plain_text,
                    value: database.id
                }))
            }
        }
    }),
    parent_page: Property.Dropdown<string>({
        displayName: "Parent Page",
        required: true,
        description: "Select the parent page you want to use",
        refreshers: ['authentication'],
        options: async (propsValue) => {
            if (!propsValue['authentication']) {
                return {
                    disabled: true,
                    placeholder: "Please connect your Notion account first",
                    options: []
                }
            }
            const notion = new Client({
                auth: (propsValue['authentication'] as OAuth2PropertyValue).access_token,
                notionVersion: "2022-02-22",
            });
            
            const pages = await notion.search({
                filter: {
                    property: "object",
                    value: "page",
                }
            });

            let results = pages.results as any[]
            results = results.filter((page: any) => {
                try{
                    return page.properties.title.title[0].text.content !== undefined
                }catch(e){
                    return false;
                }
            })

            return {
                placeholder: "Select a page",
                options: results.map((page: any) => ({
                    label: page.properties.title.title[0].text.content,
                    value: page.id
                }))
            }
        }
    }),
    getItems: async (authentication: OAuth2PropertyValue, database_id: string) => {
        const notion = new Client({
            auth: (authentication).access_token,
            notionVersion: "2022-02-22",
        });

        const response = await notion.databases.query({
            database_id: database_id,
        });

        const results = response.results as any[];
        return results.filter((item: any) => {
            try{
                return item.properties.Name.title[0].text.content !== undefined
            }catch(e){
                return false;
            }
        })
    },
    getPages: async (authentication: OAuth2PropertyValue) => {
        const notion = new Client({
            auth: (authentication).access_token,
            notionVersion: "2022-02-22",
        });

        const response = await notion.search({
            filter: {
                property: "object",
                value: "page",
            }
        });

        let results = response.results as any[]
        results = results.filter((page: any) => {
            try{
                return page.properties.title.title[0].text.content !== undefined
            }catch(e){
                return false;
            }
        })

        return results
    }
}

type User = {
    object: string;
    id: string;
};
  
type EmojiIcon = {
    type: string;
    emoji: string;
};
  
type DatabaseIdParent = {
    type: string;
    database_id: string;
};
  
type CreatedTimeProperty = {
    id: string;
    type: string;
    created_time: string;
};
  
type SelectOption = {
    id: string;
    name: string;
    color: string;
};
  
type TitleText = {
    type: string;
    text: {
      content: string;
      link: any;
};
    annotations: {
      bold: boolean;
      italic: boolean;
      strikethrough: boolean;
      underline: boolean;
      code: boolean;
      color: string;
};
    plain_text: string;
    href: any;
};
  
export type Page = {
    object: string;
    id: string;
    created_time: string;
    last_edited_time: string;
    created_by: User;
    last_edited_by: User;
    cover: any;
    icon: EmojiIcon;
    parent: DatabaseIdParent;
    archived: boolean;
    properties: {
      "Date Created": CreatedTimeProperty;
      Status: {
        id: string;
        type: string;
        select: SelectOption;
};
      Name: {
        id: string;
        type: string;
        title: TitleText[];
};
};
    url: string;
    public_url: any;
};
  
