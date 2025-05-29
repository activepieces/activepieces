import { SmashSend } from '@smashsend/node';
import { Property } from '@activepieces/pieces-framework';

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const createClient = (apiKey: string): SmashSend => {
  return new SmashSend(apiKey);
};

export const createCustomPropertiesField = () => {
  return Property.DynamicProperties({
    displayName: 'Custom Properties',
    description: 'Additional custom properties for the contact',
    required: false,
    refreshers: [],
    props: async ({ auth }) => {
      if (!auth) return {};
      
      try {
        const client = createClient(auth.apiKey);
        const response = await client.contacts.listProperties();
        
        if (!response?.items || !Array.isArray(response.items)) {
          return {};
        }
        
        const dynamicProps: any = {};
        
        response.items.forEach((property: any) => {
          const key = property.apiSlug;
          const displayName = property.displayName || 
            property.apiSlug.charAt(0).toUpperCase() + property.apiSlug.slice(1);
          
          // Map property types to ActivePieces property types
          switch (property.type) {
            case 'BOOLEAN':
              dynamicProps[key] = Property.Checkbox({
                displayName,
                description: property.description || `Enter the value for ${displayName}.`,
                required: false,
              });
              break;
            case 'NUMBER':
            case 'INTEGER':
              dynamicProps[key] = Property.Number({
                displayName,
                description: property.description || `Enter the value for ${displayName}.`,
                required: false,
              });
              break;
            case 'STRING':
            case 'TEXT':
            case 'EMAIL':
            case 'URL':
            case 'PHONE':
            case 'DATE':
            default:
              dynamicProps[key] = Property.ShortText({
                displayName,
                description: property.description || `Enter the value for ${displayName}.`,
                required: false,
              });
              break;
          }
        });
        
        return dynamicProps;
      } catch (error: any) {
        // If we can't fetch custom properties, return empty object
        return {};
      }
    },
  });
}; 