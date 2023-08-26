// import { createAction, NonAuthPiecePropertyMap, Property, PropertyType } from "@activepieces/pieces-framework";

// const props:NonAuthPiecePropertyMap= {}
// const propTypes = Object.values(PropertyType);

// propTypes.forEach(pt=>{
//     switch(pt)
//     {
//         case PropertyType.ARRAY:{
//             const optionalArray = Property.Array({
//                 displayName:"Optional Array with initial value",
//                 defaultValue:["test"],
//                 required:false,
//             })
//             const requiredArray = Property.Array({
//                 displayName:"Required Array",
//                 required:true,
//             })
//             props['optionalArray']=optionalArray;
//             props['requiredArray']=requiredArray;
//             break;
            
//         }
//         case PropertyType.BASIC_AUTH:
//         case PropertyType.OAUTH2:
//         case PropertyType.CUSTOM_AUTH:
//         case PropertyType.SECRET_TEXT:
//             {
//                 break;
//             }
//             case PropertyType.CHECKBOX: {
//                 const optionalCb = Property.Checkbox({
//                     displayName:"Optional Checkbox with initial value",
//                     defaultValue:true,
//                     required:false,
//                 })
//                 const requiredCb = Property.Checkbox({
//                     displayName:"Required Checkbox",
//                     required:true,
//                 })
//                 props['optionalCb']=optionalCb;
//                 props['requiredCb']=requiredCb;
//                 break;
//             }
//             case PropertyType.DATE_TIME:
//             {
//                 const optionalDate = Property.DateTime({
//                     displayName:"Optional Text with initial value",
//                     defaultValue:"2023-08-01",
//                     required:false,
//                 })
//                 const requiredDate = Property.DateTime({
//                     displayName:"Required Text ",
//                     required:true,
//                 })
//                 props['optionalDate']=optionalDate;
//                 props['requiredDate']=requiredDate;
//                 break;
//             }
//             case PropertyType.LONG_TEXT:
//             case PropertyType.SHORT_TEXT:
//                 {
//                     const optionalText = Property.ShortText({
//                         displayName:"Optional Text with initial value",
//                         defaultValue:"optionalText",
//                         required:false,
//                     })
//                     const requiredText = Property.ShortText({
//                         displayName:"Required Text",
//                         required:true,
//                     })
//                     props['optionalText']=optionalText;
//                     props['requiredText']=requiredText;
//                     break;
//                 }
//             case PropertyType.NUMBER:{
//                 const optionalNumber = Property.Number({
//                     displayName:"Optional Number with initial value",
//                     defaultValue:14,
//                     required:false,
//                 })
//                 const requiredNumber = Property.Number({
//                     displayName:"Required Number",
//                     required:true,
//                 })
//                 props['optionalNumber']=optionalNumber;
//                 props['requiredNumber']=requiredNumber;
//                 break;
//             }
//             case PropertyType.FILE:
//                 {
//                     const optionalFile = Property.File({
//                         displayName:"Optional File with initial value",
//                         defaultValue:{
//                             base64:"test"
//                         },
//                         required:false,
//                     })
//                     const requiredFile = Property.File({
//                         displayName:"Required File",
//                         required:true,
//                     })
//                     props['optionalFile']=optionalFile;
//                     props['requiredFile']=requiredFile;
//                     break;
//                 }
//                 case PropertyType.MARKDOWN:
//                     {
//                         const markdownProp = Property.MarkDown({
//                             value:`To obtain a token, follow these steps:
//                             1. Go to https://discord.com/developers/applications
//                             2. Click on Application (or create one if you don't have one)
//                             3. Click on Bot
//                             4. Copy the token`
//                         });
//                         props['markdownProp']=markdownProp;
//                         break;
//                     }
//                 case PropertyType.DROPDOWN: {
//                    const values = async (props:Record<string,unknown>)=>{
//                     const options= [
//                         {
//                             label:"v1",
//                             value:"text"
//                         },
//                         {
//                             label:"v2",
//                             value:"text1"
//                         }
//                     ]

//                         return {
//                             options:options,
//                             disabled:props['optionalText'] === "test",
//                             placeholder:''
//                         }
                
//                 }
//                    const optionalDropdown = Property.Dropdown({
//                     displayName:"Optional Dropdwon with initial value",
//                     refreshers:["optionalText"],
//                     options:values,
//                     defaultValue: 'text',
//                     required:false,
//                 })
//                 const requiredDropdown = Property.Dropdown({
//                     displayName:"Required Dropdown with optional text",
//                     refreshers:['optionalFile'],
//                     options:values,
//                     required:true,
//                 })
//                 props['optionalDropdown']=optionalDropdown;
//                 props['requiredDropdown']=requiredDropdown;
                
//                 break;
//                 }
//                 case PropertyType.MULTI_SELECT_DROPDOWN: 
//                 {
//                     const values = async (props:Record<string,unknown>)=>{
//                         const options= [
//                             {
//                                 label:"v1",
//                                 value:"text"
//                             },
//                             {
//                                 label:"v2",
//                                 value:"text1"
//                             }
//                         ]
//                             return {
//                                 options:options,
//                                 disabled:props['optionalText'] === "test",
//                                 placeholder:''
//                             }
                    
//                     }
//                const optionalMultiSelectDropdown = Property.MultiSelectDropdown({
//                 displayName:"Optional MSDropdwon with initial value",
//                 refreshers:["optionalText"],
//                 options:values,
//                 defaultValue: ['text'],
//                 required:false,
//             })
//             const requiredMultiselectDropdown = Property.MultiSelectDropdown({
//                 displayName:"Required MSDropdown with optional text as refresher",
//                 refreshers:['optionalText'],
//                 options:values,
//                 required:true,
//             })
//             props['optionalMultiSelectDropdown']=optionalMultiSelectDropdown;
//             props['requiredMultiselectDropdown']=requiredMultiselectDropdown;
//             break;
//                 }
//                 case PropertyType.OBJECT: {
//                     const optionalObject = Property.Object({
//                         displayName:"Optional Object with initial value",
//                         defaultValue:{"text":"text",  "number":123 , "array": [1,2,3,4] , "object": {"x":1}},
//                         required:false,
//                     })
//                     const requiredlObject = Property.Object({
//                         displayName:"Requried Object ",
//                         required:true,
//                     })
//                     props['optionalObject']=optionalObject;
//                     props['requiredlObject']=requiredlObject;
//                     break;
//                 }
//                 case PropertyType.JSON:
//                 {
//                     const optionalJson = Property.Json({
//                         displayName:"Optional Json with initial value",
//                         defaultValue:{"text":"text",  "number":123 , "array": [1,2,3,4] , "object": {"x":1}},
//                         required:false,
//                     })
//                     const requiredJson = Property.Json({
//                         displayName:"Required Json",
//                         required:true,
//                     })
//                     props['optionalJson']=optionalJson;
//                     props['requiredJson']=requiredJson;
//                     break;
//                 }
//                 case PropertyType.STATIC_DROPDOWN:
//                 {

//                     const staticDropdownOptional = Property.StaticDropdown({
//                         displayName:"Optional static Dropdown with initial value",
//                         options:{
//                             options:[{label:"val1", value: 1}, {label:"val2",value:2}]
//                         },
//                         defaultValue:2,
//                         required:false,
//                     })
//                     const staticDropdownRequired = Property.StaticDropdown({
//                         displayName:"Required static dropdwon",
//                         options:{
//                             options:[{label:"val1", value: 1}, {label:"val2",value:2}]
//                         },
//                         required:true,
//                     })
//                     const staticDropdownDisabled = Property.StaticDropdown({
//                         displayName:"disabled static dropdwon",
//                         options:{
//                             options:[{label:"val1", value: 1}, {label:"val2",value:2}],
//                             disabled:true,
//                             placeholder:"Disabled"
//                         },
//                         required:true,
//                     })
//                     props['staticDropdownOptional']=staticDropdownOptional;
//                     props['staticDropdownRequired']=staticDropdownRequired;
//                     props['staticDropdownDisabled']=staticDropdownDisabled;
//                     break;
//                 }
//                 case PropertyType.STATIC_MULTI_SELECT_DROPDOWN: {
//                     const staticMultiDropdownOptional = Property.StaticMultiSelectDropdown({
//                         displayName:"Optional Static MSDropdown with initial value",
//                         options:{
//                             options:[{label:"val1", value: 1}, {label:"val2",value:2}]
//                         },
//                         defaultValue:[2,1],
//                         required:false,
//                     })
//                     const staticMultiDropdownRequired = Property.StaticMultiSelectDropdown({
//                         displayName:"Required Static MSdropdwon",
//                         options:{
//                             options:[{label:"val1", value: 1}, {label:"val2",value:2}]
//                         },
//                         required:true,
//                     })
//                     const staticMultiDropdownDisabled = Property.StaticMultiSelectDropdown({
//                         displayName:"Disabled Static MSdropdwon",
//                         options:{
//                             options:[{label:"val1", value: 1}, {label:"val2",value:2}],
//                             disabled:true,
//                             placeholder:"Disabled"
//                         },
//                         required:true,
//                     })
//                     props['staticMultiDropdownOptional']=staticMultiDropdownOptional;
//                     props['staticMultiDropdownRequired']=staticMultiDropdownRequired;
//                     props['staticMultiDropdownDisabled']=staticMultiDropdownDisabled;
//                     break;
//                 }
//                 case PropertyType.DYNAMIC:{
//                     props['dynamic'] = Property.DynamicProperties({
//                         displayName:"dynamic",
//                         refreshers:[],
//                         required:false,
//                         props:async(val)=>{
//                             return {
//                                 x: Property.ShortText({
//                                 displayName:"dynamic prop",
//                                 required:false
//                                 })
//                             }
//                         }
//                     })
//                     break;
//                 }
//                 default:
//                     {
//                         const p:never = pt;
//                         console.error('unknown property '+ p);
//                     }

//     }
    
// })





// export const testingActionWithAllProps = createAction({
//     name: 'testingActionWithAllProps',
//     description: 'Shows all props with other side states',
//     displayName: 'testing action with all props',
//     requireAuth: true,
//     props: props,
//     async run(configValue) {
    
//         return configValue;
//     },
  
// });
