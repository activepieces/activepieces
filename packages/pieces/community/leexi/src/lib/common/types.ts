export type ListCallResponse = {
    data:Array<{
        created_at:string
    }>,
    pagination:{
        page:number,
        items:number
    }
}