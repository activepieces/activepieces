export type ListFormsResponse = {
    data:{
  data: {
    id: number;
    name: string;
    slug:string
  }[];}
};


export type CreateWebhookResponse = {
    data:{
        id:number
    }
}