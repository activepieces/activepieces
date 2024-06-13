import { whatsappAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

export const sendFromTemplate = createAction({
  auth: whatsappAuth,
  name: 'sendFromTemplate',
  displayName: 'Send From Template',
  description: 'Send whatsapp messages using templates from cloud api',
  props: {
    to: Property.ShortText({
      displayName: 'To',
      description: 'Recipient phone number',
      required: true,
    }),
    listTemplate: Property.DynamicProperties({
      description: 'Templates',
      displayName: 'Templates',
      required: true,
      refreshers: ['auth'],
      props: async (propsValue) => {
          const response = await fetchTemplates(propsValue);
          let properties = {};
          if(response&&response.body && response.body.data && response.body.data.length > 0){
             properties = {
              template: Property.StaticDropdown({
                displayName: 'Templates',
                required: true,
                options: {
                  options: response.body.data.map((template: any) => {
                    return { label: template.name, value: template };
                  }
                  ),
                },
              }),
          };
        }
          return properties;
      }
  }), 
  template_params: Property.DynamicProperties({
    description: 'Template Params',
    displayName: 'Template Params',
    required: true,
    refreshers: ['listTemplate'],
    props: async (propsValue) => {

    const properties = {};  
    if(propsValue && propsValue['listTemplate'] && propsValue['listTemplate']['template'] && propsValue['listTemplate']['template']['components'] && propsValue['listTemplate']['template']['components'].length > 0){
      const template = propsValue['listTemplate']['template']['components'];

      for (let i = 0; i < template.length; i++) { 
        const element = template[i];
          if(element['type'] == 'HEADER'){
            const formatt = element['format'];
            const header = Property.File({
              displayName: formatt,
              description: `Provide a valid ${formatt} file`,
              required: true
          })
          Object.assign(properties, { headerMarkdown:Property.MarkDown({
            value: `###### Template Header\n Provide a valid header ( ${formatt} ) for the template.`
          }),
           });
          Object.assign(properties, { header: header });
          if(formatt == 'IMAGE'){
            const caption = Property.ShortText({
              displayName: 'Image Caption',
              description: 'Image Caption (Optional)',
              required: false
          })
          Object.assign(properties, { caption: caption });
          }else if(formatt == 'VIDEO'){
            const caption = Property.ShortText({
              displayName: 'Video Caption',
              description: 'Video Caption (Optional)',
              required: false
          })
          Object.assign(properties, { caption: caption });
          }else if(formatt == 'DOCUMENT'){
            const caption = Property.ShortText({
              displayName: 'File Name',
              description: 'Document File Name (Optional)',
              required: false
          })
          Object.assign(properties, { caption: caption });
          }
         
        }else if(element['type'] == 'BODY'){
          const examples = element['example'];
          if(examples && examples['body_text'] && examples['body_text'].length > 0){
            Object.assign(properties, { templateParameters:Property.MarkDown({
              value: `###### Template Parameters\n Provide a valid header parameters for the template.`
            }),
             });
            for (let j = 0; j < examples['body_text'][0].length; j++) {
              const body = examples['body_text'][0][j];
              const bodyText = Property.ShortText({
                displayName: `Body Field ${j+1}`,
                description: `Example: ${body}`,
                required: true
            })
            Object.assign(properties, { ["fieldParam"+j]: bodyText });
            }
          }
         }
      
  }
}
return properties;
  
}

  }),
  },
  async run(context) {
    
    const { access_token, phoneNumberId } = context.auth;
    const { to, listTemplate, template_params } = context.propsValue;

    const components = [];

    if(listTemplate['template'] && listTemplate['template']['components'] && listTemplate['template']['components'].length > 0){
      const template = listTemplate['template']['components'];

      for (let i = 0; i < template.length; i++) { 
        const element = template[i];
          if(element['type'] == 'HEADER'){
            const formatt = element['format'];
            const parameters = [];
          if(formatt == 'IMAGE'){
            parameters.push({
              type: 'image',
              image:{
                link: template_params['header'],
                filename: template_params['caption']
              },
            });
          
          }else if(formatt == 'VIDEO'){
            parameters.push({
              type: 'video',
              video:{
                link: template_params['header'],
                filename: template_params['caption']
              },
            });
         
          }else if(formatt == 'DOCUMENT'){
            parameters.push({
              type: 'document',
              document: {
                link: template_params['header'],
                filename: template_params['caption']
              },
              
            });
           
          }
          const header = {
            type: 'header',
            parameters:parameters,
          }
          components.push(header);
         
        }else if(element['type'] == 'BODY'){
          const examples = element['example'];
          if(examples && examples['body_text'] && examples['body_text'].length > 0){

            const parameters = [];
            for (let j = 0; j < examples['body_text'][0].length; j++) {
              parameters.push({
                type: 'text',
                text: template_params['fieldParam'+j]
              });
            
            }
            const body = {
              type: 'body',
              parameters:parameters,
            }
            components.push(body);
          }
         }
  }
}

const body = {
  messaging_product: "whatsapp",
  recipient_type: "individual",
  to,
  type: 'template',
  template: {
    name: listTemplate['template']['name'],
    language: {
      code: listTemplate['template']['language']
    },
    components: components
  },
  
}

    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      headers: {
        Authorization: 'Bearer ' + access_token,
        contentType: 'application/json',
      },
      body,
    }).then((res) => {
      return res;
    }
    );

  }
});


const fetchTemplates = async (context:any) => {
  const { access_token, businessAccountId } = context.auth;

  return await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `https://graph.facebook.com/v19.0/${businessAccountId}/message_templates`,
    headers: {
      Authorization: 'Bearer ' + access_token,
    },
  }).then((res) => {
    return res;
  }
  );
}