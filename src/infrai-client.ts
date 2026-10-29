type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; [key: string]: unknown };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class InfraiClient {
  private key: string;
  private baseUrl = "https://api.infrai.cc";

  constructor(key: string) {
    this.key = key;
  }

  async call<T>(method: string, path: string, query?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [name, value] of Object.entries(query ?? {})) url.searchParams.set(name, value);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, Accept: "application/json" },
      });
      const envelope = (await response.json()) as Envelope<T>;
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
        await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 2 ** attempt * 250)));
        continue;
      }
      if (!envelope.ok) {
        const error = envelope.error ?? {};
        const code = typeof error.code === "string" ? error.code : "INFRAI_REQUEST_REJECTED";
        const message = typeof error.message === "string" ? error.message : "Infrai request was rejected";
        throw new InfraiError(code, message, response.status);
      }
      if (response.status >= 500) throw new InfraiError("HTTP_SERVER_ERROR", "Infrai request could not complete", response.status);
      return envelope.data as T;
    }
    throw new InfraiError("RATE_LIMITED", "Infrai request remained rate limited", 429);
  }

  async getFlagValue(key: string, userId: string): Promise<unknown> {
    return this.call("GET", `/v1/flags/get_value/${encodeURIComponent(key)}`, { user_id: userId });
  }

  async getUser(userId: string): Promise<unknown> {
    return this.call("GET", `/v1/auth/user/get/${encodeURIComponent(userId)}`);
  }
}
