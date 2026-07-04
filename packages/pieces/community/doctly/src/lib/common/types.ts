export type CreateDocumentResponse = {
    id:string,
    file_name:string,
    status:string
}

export type GetDocumentResponse = {
    id:string,
    file_name:string,
    status:string,
    output_file_url:string
}