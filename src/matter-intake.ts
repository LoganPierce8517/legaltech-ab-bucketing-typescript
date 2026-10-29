import { z } from "zod";
import type { InfraiClient } from "./infrai-client.ts";

export const matterIntakeSchema = z.object({
  matterId: z.string().min(1),
  userId: z.string().min(1),
  email: z.string().email(),
  signedDocumentReady: z.boolean(),
  deadline: z.string().date(),
});

export type MatterIntake = z.infer<typeof matterIntakeSchema>;
export type MatterPlan = MatterIntake & { variant: "control" | "delivery-v2" };

function isVariant(value: unknown): value is "control" | "delivery-v2" {
  return value === "control" || value === "delivery-v2";
}

export async function planMatter(client: InfraiClient, input: unknown, flagKey: string): Promise<MatterPlan> {
  const matter = matterIntakeSchema.parse(input);
  const [assignment] = await Promise.all([
    client.getFlagValue(flagKey, matter.userId),
    client.getUser(matter.userId),
  ]);
  const variant = isVariant(assignment) ? assignment : "control";
  return { ...matter, variant };
}
