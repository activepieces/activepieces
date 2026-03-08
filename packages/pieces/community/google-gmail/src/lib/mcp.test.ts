import { sendMessage } from './gmail_piece';
import { google } from 'googleapis';

// Mock the Google API to prevent actual network calls during testing
jest.mock('googleapis', () => ({
    google: {
        auth: {
            OAuth2: jest.fn().mockImplementation(() => ({
                setCredentials: jest.fn(),
            })),
        },
        gmail: jest.fn().mockImplementation(() => ({
            users: {
                messages: {
                    send: jest.fn().mockResolvedValue({ data: { id: 'mock_message_id' } }),
                },
            },
        })),
    },
}));

describe('Gmail MCP - sendMessage', () => {
    it('should correctly encode and send a message', async () => {
        const mockContext = {
            auth: { access_token: 'fake_token' },
            propsValue: {
                to: 'receiver@example.com',
                subject: 'Test Subject',
                body: 'Test Body'
            }
        };

        const result = await sendMessage.run(mockContext as any);
        
        expect(result.success).toBe(true);
        expect(google.gmail).toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
        const mockContext = { auth: {}, propsValue: {} };
        // Force an error
        (google.gmail as jest.Mock).mockImplementationOnce(() => {
            throw new Error('API Down');
        });

        await expect(sendMessage.run(mockContext as any)).rejects.toThrow('API Down');
    });
});
