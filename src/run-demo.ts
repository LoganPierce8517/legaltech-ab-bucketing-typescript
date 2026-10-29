import { InfraiClient } from "./infrai-client.ts";
import { planMatter } from "./matter-intake.ts";

const key = process.env.INFRAI_API_KEY;
const userId = process.env.INFRAI_USER_ID;
const flagKey = process.env.INFRAI_FLAG_KEY;
if (!key || !userId || !flagKey) throw new Error("Set INFRAI_API_KEY, INFRAI_USER_ID, and INFRAI_FLAG_KEY");

const plan = await planMatter(new InfraiClient(key), {
  matterId: process.env.MATTER_ID ?? "matter-demo-001",
  userId,
  email: process.env.MATTER_EMAIL ?? "counsel@example.com",
  signedDocumentReady: true,
  deadline: process.env.MATTER_DEADLINE ?? "2026-12-15",
}, flagKey);
console.log(JSON.stringify({ matterId: plan.matterId, variant: plan.variant, next: plan.variant === "delivery-v2" ? "signed-document-delivery" : "incumbent-delivery" }, null, 2));
