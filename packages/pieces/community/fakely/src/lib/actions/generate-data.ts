import { ActionContext, createAction, Property } from "@activepieces/pieces-framework";
import { faker, fakerAR, fakerES, fakerFR, fakerIT, fakerDE, fakerPT_BR, fakerEN } from "@faker-js/faker";

const locales: Record<string, any> = {
  ar: fakerAR,
  es: fakerES,
  fr: fakerFR,
  it: fakerIT,
  de: fakerDE,
  pt_br: fakerPT_BR,
  en: fakerEN,
};

interface GenerateDataProps {
  fields: string[];
  count: number;
  locale: string;
  template?: any;
}

export const generateFakeData = createAction({
  name: "generate_fake_data",
  displayName: "Generate Fake Data",
  description: "Generate multiple records of fake data for testing.",
  props: {
    fields: Property.Array({
      displayName: "Fields",
      description: "List of fields to generate (e.g., first_name, last_name, email, phone, uuid, company, address).",
      required: true,
    }),
    count: Property.Number({
      displayName: "Count",
      description: "Number of records to generate (Max 100).",
      required: true,
      defaultValue: 1,
    }),
    locale: Property.StaticDropdown({
      displayName: "Locale",
      description: "The locale for generated data.",
      required: false,
      options: {
        options: [
          { label: "English", value: "en" },
          { label: "Arabic", value: "ar" },
          { label: "Spanish", value: "es" },
          { label: "French", value: "fr" },
          { label: "German", value: "de" },
          { label: "Italian", value: "it" },
          { label: "Portuguese (Brazil)", value: "pt_br" },
        ],
      },
      defaultValue: "en",
    }),
    template: Property.Json({
      displayName: "Custom Template",
      description: "Optional custom JSON template. Use placeholders like {{person.firstName}} or {{internet.email}}.",
      required: false,
    }),
  },
  async run(context: ActionContext) {
    const fields = context.propsValue.fields as string[];
    const count = Math.min(Number(context.propsValue.count) || 1, 100);
    const locale = (context.propsValue.locale as string) || "en";
    const template = context.propsValue.template as Record<string, any>;
    
    const selectedFaker: any = locales[locale] || faker;
    const records = [];

    const processTemplate = (obj: any): any => {
      if (typeof obj === 'string') {
        try {
          return selectedFaker.helpers.fake(obj);
        } catch {
          return obj;
        }
      }
      if (Array.isArray(obj)) {
        return obj.map(item => processTemplate(item));
      }
      if (typeof obj === 'object' && obj !== null) {
        const newObj: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
          newObj[key] = processTemplate(value);
        }
        return newObj;
      }
      return obj;
    };

    for (let i = 0; i < count; i++) {
        let record: Record<string, any> = {};

        if (template) {
           // Handle custom template safely without JSON.parse breaking on newlines
           record = processTemplate(template);
        } else if (fields && Array.isArray(fields)) {
            fields.forEach((field) => {
                const fieldName = String(field).toLowerCase();
                switch (fieldName) {
                    case "first_name":
                        record[fieldName] = selectedFaker.person.firstName();
                        break;
                    case "last_name":
                        record[fieldName] = selectedFaker.person.lastName();
                        break;
                    case "full_name":
                        record[fieldName] = selectedFaker.person.fullName();
                        break;
                    case "email":
                        record[fieldName] = selectedFaker.internet.email();
                        break;
                    case "phone":
                        record[fieldName] = selectedFaker.phone.number();
                        break;
                    case "uuid":
                        record[fieldName] = selectedFaker.string.uuid();
                        break;
                    case "company":
                        record[fieldName] = selectedFaker.company.name();
                        break;
                    case "address":
                        record[fieldName] = selectedFaker.location.streetAddress();
                        break;
                    case "city":
                        record[fieldName] = selectedFaker.location.city();
                        break;
                    case "country":
                        record[fieldName] = selectedFaker.location.country();
                        break;
                    case "zip":
                        record[fieldName] = selectedFaker.location.zipCode();
                        break;
                    case "job_title":
                        record[fieldName] = selectedFaker.person.jobTitle();
                        break;
                    case "paragraph":
                        record[fieldName] = selectedFaker.lorem.paragraph();
                        break;
                    case "date":
                        record[fieldName] = selectedFaker.date.anytime().toISOString();
                        break;
                    default:
                        // Try to find it in faker or return a dummy string
                        try {
                            record[fieldName] = selectedFaker.helpers.fake(`{{${fieldName}}}`);
                        } catch (e) {
                            record[fieldName] = `Unknown field: ${fieldName}`;
                        }
                }
            });
        }
        records.push(record);
    }
    return records;
  },
});
