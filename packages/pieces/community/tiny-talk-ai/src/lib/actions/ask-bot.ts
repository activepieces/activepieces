import { createAction, Property } from "@activepieces/pieces-framework";
import { tinyTalkAiAuth } from "../common/auth";

export const askBotAction = createAction({
    name: 'ask-bot',
    auth: tinyTalkAiAuth,
    displayName: 'Ask Bot',
    description: 'Sends message to selected bot.',
    audience: 'both',
    aiMetadata: { description: 'Sends a user message to a specific TinyTalk AI bot and returns the bot\'s generated reply as text. Choose this to query a configured conversational bot; requires the target bot\'s ID (from the bot\'s Details page) and the question prompt. Not idempotent: each call produces a fresh generation.', idempotent: false },
    props: {
        botId: Property.ShortText({
            displayName: 'Bot ID',
            required: true,
            description: 'You can find this in your Bot Details page in the dashboard.'
        }),
        prompt: Property.LongText({
            displayName: 'Question',
            required: true
        })
    },
    async run(context) {
        const { botId, prompt } = context.propsValue;

        const response = await fetch("https://api.tinytalk.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                'Api-Key': context.auth.secret_text,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                botId,
                messages: [

                    {
                        "role": "user",
                        "content": prompt
                    },
                ]
            }),
            redirect: "follow",
        })

        if (!response.ok) {
            const errorData = await response.json();
            throw Error(errorData.message);
        }

        const stream = response.body;

        if (!stream) {
            throw new Error("No stream returned from TinyTalk API");
        }

        const reader = stream.getReader();
        const decoder = new TextDecoder();

        let fullText = "";
        let done = false;

        while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;

            if (!value) continue;

            const chunk = decoder.decode(value, { stream: true });

            chunk.split("\n").forEach((line) => {
                if (line.startsWith("data: ") && !line.includes("[DONE]")) {
                    try {
                        const json = JSON.parse(line.replace("data: ", ""));
                        const delta = json?.choices?.[0]?.delta;
                        if (delta?.content) {
                            fullText += delta.content;
                            process.stdout.write(delta.content); 
                        }
                    } catch {
                        // ignore malformed lines
                    }
                }
            });
        }

        return fullText;

    }
})