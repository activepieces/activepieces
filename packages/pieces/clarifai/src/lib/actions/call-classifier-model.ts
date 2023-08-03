import { clarifaiAuth } from "../../"
import { Property, createAction } from "@activepieces/pieces-framework";
import { CommonClarifaiProps, callClarifaiModel, removeListFromPropertyNames } from "../common";
import { Data } from 'clarifai-nodejs-grpc/proto/clarifai/api/resources_pb';
import * as serializer from 'proto3-json-serializer';
import { loadSync } from 'protobufjs';


export const callClassifierModel = createAction({
    auth: clarifaiAuth,
    name: 'call_classifier_model',
    description: 'Call a classifier model',
    displayName: 'Classify Image',
    props: {
        modelUrl: CommonClarifaiProps.modelUrl,
        inputUrl: Property.ShortText({
            description: 'URL of the image to classify',
            displayName: 'Input URL',
            required: true,
        }),
    },
    sampleData: {
        "concepts":[{"id":"ai_FnZCSVMH","name":"cheese","value":0.1487632691860199,"language":"","appId":"main","definition":"","vocabId":"","userId":""},{"id":"ai_DlGsqbPZ","name":"chocolate","value":0.03638983890414238,"language":"","appId":"main","definition":"","vocabId":"","userId":""},{"id":"ai_5Vl4ljkm","name":"pudding","value":0.026635251939296722,"language":"","appId":"main","definition":"","vocabId":"","userId":""},{"id":"ai_BR1Svb7D","name":"coconut","value":0.02174062281847,"language":"","appId":"main","definition":"","vocabId":"","userId":""},{"id":"ai_hh0lr5sh","name":"peanut","value":0.01833334006369114,"language":"","appId":"main","definition":"","vocabId":"","userId":""},{"id":"ai_2GpnH7qr","name":"pie","value":0.017787817865610123,"language":"","appId":"main","definition":"","vocabId":"","userId":""},{"id":"ai_skxkRfDl","name":"cake","value":0.016114983707666397,"language":"","appId":"main","definition":"","vocabId":"","userId":""},{"id":"ai_fZsLlGwm","name":"pizza","value":0.015055184252560139,"language":"","appId":"main","definition":"","vocabId":"","userId":""},{"id":"ai_v65hxxVH","name":"raspberry","value":0.011977915652096272,"language":"","appId":"main","definition":"","vocabId":"","userId":""},{"id":"ai_t3Kx2jXG","name":"soup","value":0.008487546816468239,"language":"","appId":"main","definition":"","vocabId":"","userId":""},{"id":"ai_6s1vcbq9","name":"garlic","value":0.008361454121768475,"language":"","appId":"main","definition":"","vocabId":"","userId":""},{"id":"ai_ZJ7J9Cpj","name":"nut","value":0.008321919478476048,"language":"","appId":"main","definition":"","vocabId":"","userId":""},{"id":"ai_42RH6vqD","name":"pineapple","value":0.007538147736340761,"language":"","appId":"main","definition":"","vocabId":"","userId":""},{"id":"ai_KF7Xcz9J","name":"onion","value":0.00718439556658268,"language":"","appId":"main","definition":"","vocabId":"","userId":""},{"id":"ai_Br1hm5jR","name":"butter","value":0.006603229325264692,"language":"","appId":"main","definition":"","vocabId":"","userId":""},{"id":"ai_P2qDCXHV","name":"lemon","value":0.005530273541808128,"language":"","appId":"main","definition":"","vocabId":"","userId":""},{"id":"ai_53wgdjQM","name":"candy","value":0.005451636854559183,"language":"","appId":"main","definition":"","vocabId":"","userId":""},{"id":"ai_GNdVB8DV","name":"banana","value":0.005412754602730274,"language":"","appId":"main","definition":"","vocabId":"","userId":""},{"id":"ai_hhXChRLh","name":"burrito","value":0.00457315519452095,"language":"","appId":"main","definition":"","vocabId":"","userId":""},{"id":"ai_b4b4hLRV","name":"turkey","value":0.0041757626459002495,"language":"","appId":"main","definition":"","vocabId":"","userId":""}]
    },
    async run(ctx) {
        const { auth } = ctx
        const { modelUrl, inputUrl } = ctx.propsValue;

        const outputs = await callClarifaiModel({
          auth,
          modelUrl,
          inputUrl,
        });
        if (outputs.getOutputsList().length === 0) {
            throw new Error('No outputs found from Clarifai');
        }
        var data = outputs.getOutputsList()[0].getData();
        if (data == undefined) {
            throw new Error('No data found from Clarifai');
        } else {
            var result = Data.toObject(false, data);
            return removeListFromPropertyNames(result);
        }
    },
});
