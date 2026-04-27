import { generateFakeData } from "../src/lib/actions/generate-data";

describe("Fakely Piece", () => {
  test("Generate fake data with fields and count", async () => {
    const result = await generateFakeData.run({
      propsValue: {
        fields: ["first_name", "last_name", "email"],
        count: 5,
        locale: "en",
      },
      auth: undefined,
      store: {} as any,
    } as any);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(5);
    expect(result[0]).toHaveProperty("first_name");
    expect(result[0]).toHaveProperty("last_name");
    expect(result[0]).toHaveProperty("email");
    expect(typeof result[0].first_name).toBe("string");
  });

  test("Generate fake data with custom template", async () => {
    const result = await generateFakeData.run({
      propsValue: {
        fields: [],
        count: 1,
        locale: "en",
        template: {
          user_email: "{{internet.email}}",
          user_full_name: "{{person.fullName}}",
        },
      },
      auth: undefined,
      store: {} as any,
    } as any);

    expect(result.length).toBe(1);
    expect(result[0]).toHaveProperty("user_email");
    expect(result[0]).toHaveProperty("user_full_name");
    expect(result[0].user_email).toContain("@");
  });

  test("Generate fake data with Arabic locale", async () => {
    const result = await generateFakeData.run({
      propsValue: {
        fields: ["first_name"],
        count: 1,
        locale: "ar",
      },
      auth: undefined,
      store: {} as any,
    } as any);

    expect(result.length).toBe(1);
    expect(typeof result[0].first_name).toBe("string");
    // Simple check for Arabic characters (range 0600-06FF)
    const hasArabic = /[\u0600-\u06FF]/.test(result[0].first_name);
    expect(hasArabic).toBe(true);
  });

  test("Handle unknown fields gracefully", async () => {
    const result = await generateFakeData.run({
      propsValue: {
        fields: ["non_existent_field"],
        count: 1,
        locale: "en",
      },
      auth: undefined,
      store: {} as any,
    } as any);

    expect(result.length).toBe(1);
    expect(result[0].non_existent_field).toContain("Unknown field");
  });
});
