export type IssueTypeMetadata = {
    id:string,
    name:string
}

export type IssueFieldMetaData ={
    required:boolean,
    name:string,
    key:string,
    fieldId:string,
    schema:{
        type:"string"|"date"|"datetime"|"array"|"number"|"option"|"user", // "option-with-child",
        items:string,
        custom?:string,
        customId?:number,
    },
    allowedValues?:Array<{value:string,id:string}>
}