import { HttpRequest, HttpMethod, httpClient } from "@activepieces/pieces-common";
import { Property, createAction } from "@activepieces/pieces-framework";
import { openaiAuth } from "../..";
import FormData from "form-data";
import mime from 'mime-types';

export const transcribeAction = createAction({
    name: 'transcribe',
    displayName: 'Transcribe',
    description: 'Transcribe audio to text using whisper-1 model',
    auth: openaiAuth,
    props: {
        audio : Property.File({
            displayName: 'Audio',
            required: true,
            description: 'Audio file to transcribe',
        }),
        fileName : Property.ShortText({
            displayName: 'File name',
            required: true,
            description: 'Name of the file',
        }),
    },
    run: async ( context ) => {
        const fileData = context.propsValue.audio;        
        const mimeType = mime.lookup(fileData.extension ? fileData.extension : '');

        const form = new FormData()
        form.append("file", fileData.data , { filename: context.propsValue.fileName , contentType: mimeType as string });
        form.append("model", "whisper-1");

        const request : HttpRequest = {
            method : HttpMethod.POST,
            url : `https://api.openai.com/v1/audio/transcriptions`,
            body : form,
            headers : {
                ...form.getHeaders(),
                Authorization : `Bearer ${context.auth}`,
            },            
        };
        try{
            const response = await httpClient.sendRequest(request)
            return response.body;
        }catch(e){
            return e;
        }
    },
});