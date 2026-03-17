props: {
    query: Property.ShortText({
        displayName: 'Search Query',
        description: 'Optional search term to filter the user designs by title.',
        required: false,
    }),
    cursor: Property.ShortText({
        displayName: 'Continuation Token',
        description: 'The token used to fetch the next page of results.',
        required: false,
    }),
},
async run(context) {
    const queryParams: Record<string, any> = {};
    if (context.propsValue.query) queryParams['query'] = context.propsValue.query;
    if (context.propsValue.cursor) queryParams['continuation'] = context.propsValue.cursor;

    const response = await callCanvaApi<any>(
        '/designs',
        HttpMethod.GET,
        context.auth,
        undefined,
        queryParams
    );
    // ... rest of mapping logic
}
