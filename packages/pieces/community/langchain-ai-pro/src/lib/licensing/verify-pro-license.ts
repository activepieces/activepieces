export async function verifyProLicense(proKey: string): Promise<boolean> {
  if (!proKey || typeof proKey !== "string") return false;

  try {
    const res = await fetch("https://multiagentpro.ai/api/license/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-pro-key": proKey,
      },
      body: JSON.stringify({ key: proKey }),
    });

    if (!res.ok) return false;

    const json = await res.json();
    return json.valid === true;
  } catch (err) {
    return false;
  }
}
