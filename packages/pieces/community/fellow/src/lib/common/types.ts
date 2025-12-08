export type ListRecordingsResponse = {
    recordings:{
        page_info:{
            cursor:string|null;
            page_size:number;
        },
        data:{
            id:string,
            started_at:string
        }[];
    }
}