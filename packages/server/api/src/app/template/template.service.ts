const { uniqueId } = require('lodash');
import { query } from '../database/provideQuery'

export const getWorkflowApps = async () => {
  const q = {
    name: 'getWorkflowApps--' + uniqueId(),
    text: `select * from app_third_party `,
  };

  let wfApp: any = Object.assign({}, {});
  const wfApps = await query(q);
  // console.log('wfApps', wfApps);
  for (let i = 0; i < wfApps.length; i++) {
    let obj: any = {};
    obj['clientId'] = wfApps[i].client_id;
    obj['clientSecret'] = wfApps[i].client_secret;
    wfApp[wfApps[i].key] = obj;
  }
  return wfApp;
};


function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
export const getTemplateWorkflows = async (request: any) => {
  const q = {
    name: 'getTemplateWorkflows--' + uniqueId(),
    text: `select * from flow_template order by created desc`,
  };

  const templates = await query(q);
  return templates;
};
export const saveTemplateWorkflow = async (body: any) => {
  const q = {
    name: 'saveTemplateWorkflow--' + uniqueId(),
    text: `insert into flow_template (
      id
      ,name
      ,description
      ,"type"
      ,tags
      ,pieces
      ,"blogUrl"
      ,"template"
      ,"projectId"
      ,"platformId"
      ) 
      values (
      '`+generateId()+`'
      ,'`+body.name+`'
      ,'`+body.description+`'
      ,'`+body.type+`'
      ,'`+JSON.stringify(body.tags)+`'
      ,'`+JSON.stringify(body.pieces)+`'
      ,'`+body.blogUrl+`'
      ,'`+JSON.stringify(body.template)+`'
      ,'`+body.projectId+`'
      ,'`+body.platformId+`'
      ) `,
  };

  let template: any = Object.assign({}, {});
  const templates = await query(q);
  for (let i = 0; i < templates.length; i++) {
    let obj: any = {};
    obj['id'] = templates[i].id;
    obj['created'] = templates[i].created;
    obj['updated'] = templates[i].updated;
    obj['name'] = templates[i].name;
    obj['description'] = templates[i].description;
    obj['type'] = templates[i].type;
    obj['tags'] = templates[i].tags;
    obj['pieces'] = templates[i].pieces;
    obj['blogUrl'] = templates[i].blogUrl;
    obj['template'] = templates[i].template;
    obj['projectId'] = templates[i].projectId;
    obj['platformId'] = templates[i].platformId;
    template[templates[i].id] = obj;
  }
  return template;
};
