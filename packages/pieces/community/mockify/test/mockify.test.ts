import { mockApiAction } from "../src/lib/actions/mock-api";

describe("Mockify Piece", () => {
  test("Mock API returns correct response", async () => {
    const result = await (mockApiAction as any).run({
      propsValue: {
        endpoint: "/test",
        responseTemplate: { hello: "world" },
        statusCode: 200,
        delay: 0,
      },
    });

    expect(result.status).toBe(200);
    expect(result.body.hello).toBe("world");
  });

  test("Mock API handles delay", async () => {
    const start = Date.now();
    await (mockApiAction as any).run({
      propsValue: {
        endpoint: "/slow",
        responseTemplate: { success: true },
        statusCode: 200,
        delay: 50,
      },
    });
    const end = Date.now();
    expect(end - start).toBeGreaterThanOrEqual(40);
  });
});
