import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";

export interface PageElement {
    objectId: string;
    table?: Table
    sheetsChart?: {
        spreadsheetId: string;
        chartId: number;
    };
    shape?: Shape
}

interface Presentation {
    slides?: Slide[];
}

interface Slide {
    pageElements?: PageElement[];
}


interface Shape {
    text?: Text;
}

interface Text {
    textElements?: TextElement[];
}

export interface TextElement {
    textRun?: TextRun;
}

interface TextRun {
    content?: string;
}

interface Table {
    tableRows?: TableRow[];
}

interface TableRow {
    tableCells?: TableCell[];
}

export interface TableCell {
    text?: Text;
}

export const googleSheetsCommon = {
	baseUrl: 'https://slides.googleapis.com/v1/presentations/',
    batchUpdate,
    getSlide,
    createSlide
};

export async function batchUpdate(access_token: string, slide_id: string, requests: any) {
    return (
        await httpClient.sendRequest<{
            spreadsheetId: string;
        }>({
            method: HttpMethod.POST,
            url: `https://slides.googleapis.com/v1/presentations/${slide_id}:batchUpdate`,
            body: {
                requests: requests
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: access_token,
            },
        })
    ).body;
}

export async function getSlide(access_token: string, slide_id: string) {
    return (
        await httpClient.sendRequest<{
            presentationId: string;
            title: string;
            slides: {
                pageElements: any; objectId: object; 
}[];
        }>({
            method: HttpMethod.GET,
            url: `https://slides.googleapis.com/v1/presentations/${slide_id}`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: access_token,
            },
        })
    ).body;
}

export async function createSlide(access_token: string, requests: any) {
    return (
        await httpClient.sendRequest<{
            presentationId: string;
            title: string;
            spreadsheetId: string;
            replies: any[];
        }>({
            method: HttpMethod.POST,
            url: `https://slides.googleapis.com/v1/presentations`,
            body: {
                requests: requests
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: access_token,
            },
        })
    ).body;
}