import assert from "node:assert/strict";
import { planMatter } from "./matter-intake.ts";

const calls: string[] = [];
const client = {
  async getFlagValue(key: string, userId: string) { calls.push(`flag:${key}:${userId}`); return "delivery-v2"; },
  async getUser(userId: string) { calls.push(`user:${userId}`); return { id: userId }; },
} as never;

const result = await planMatter(client, {
  matterId: "matter-17",
  userId: "user-17",
  email: "lawyer@example.com",
  signedDocumentReady: true,
  deadline: "2026-11-30",
}, "legal-intake");
assert.equal(result.variant, "delivery-v2");
assert.deepEqual(calls, ["flag:legal-intake:user-17", "user:user-17"]);
console.log("matter decision test passed");
