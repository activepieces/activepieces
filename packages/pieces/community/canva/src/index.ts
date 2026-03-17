// packages/pieces/community/src/lib/canva/actions/export-design.ts

// ... (imports remain the same)

export const exportDesignAction = createAction({
    auth: canvaAuth,
    name: 'export_design',
    displayName: 'Export Design',
    description: 'Generate a temporary download URL for a Canva design.',
    props: {
        designId: Property.ShortText({
            displayName: 'Design ID',
            description: 'The unique Canva Design ID.',
            required: true,
        }),
        format: Property.StaticDropdown({
            displayName: 'Export Format',
            description: 'The file format to export.',
            required: true,
            options: {
                options: [
                    // FIX: Canva API expects lowercase values for format type
                    { label: 'PDF (Standard)', value: 'pdf' },
                    { label: 'PNG', value: 'png' },
                    { label: 'JPG', value: 'jpg' }
                ]
            }
        })
    },
    async run(context) {
        const { designId, format } = context.propsValue;
        
        const startResponse = await callCanvaApi<any>(
            `/designs/${designId}/exports`,
            HttpMethod.POST,
            context.auth,
            {
                format: {
                    type: format // Now 'pdf', 'png', etc.
                }
            }
        );

        const jobId = startResponse.job?.id;
        if (!jobId) throw new Error('Failed to start Canva export job.');

        let attempts = 0;
        const maxAttempts = 20; 
        
        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const jobStatus = await callCanvaApi<any>(
                `/exports/${jobId}`,
                HttpMethod.GET,
                context.auth
            );

            // FIX: Canva API status strings are lowercase: 'success', 'failed', 'in_progress'
            const status = jobStatus.job?.status?.toLowerCase();
            
            if (status === 'success') {
                return {
                    success: true,
                    downloadUrls: jobStatus.job?.urls || [],
                    message: 'Success! URLs are valid for 60 minutes.'
                };
            } else if (status === 'failed') {
                throw new Error(`Export job failed: ${jobStatus.job?.error?.message || 'Unknown error'}`);
            }
            
            attempts++;
        }

        throw new Error('Export job timed out.');
    }
});
