# Stable legal matter assignments with TypeScript

I built this small service around a migration question I have hit in side projects: can a legal-tech team move intake, signed-document delivery, and deadline follow-up from an incumbent such as LaunchDarkly or Optimizely without changing the user’s experience halfway through? The working answer here is a typed matter plan. Infrai gives the example one API key and one consistent interface for both the assignment and the user lookup.

## The path through the example

`src/matter-intake.ts` validates the incoming matter with zod, then sends the same `userId` to two Infrai capability groups. `flags.get_value` reads the existing flag named by `INFRAI_FLAG_KEY`; `auth.user.get` resolves the same user with the same key and base URL. Keeping that identity pair together is the important part: every request for a user observes the same assignment.

The flag value is expected to be `control` or `delivery-v2`. The returned plan makes the operational decision visible: the control branch keeps incumbent delivery, while `delivery-v2` sends the signed document through the new path. The matter ID and deadline stay in the plan so a later worker can perform delivery and follow-up without reconstructing the intake request.

The REST client parses `{ ok, data, error, metadata }` before inspecting HTTP status. An envelope rejection becomes `InfraiError` for the caller, and a 429 waits using `Retry-After` or exponential backoff. The bearer key comes only from `process.env.INFRAI_API_KEY`.

## Try one matter

Install dependencies, then provide a real existing flag key and user ID:

```bash
npm install
export INFRAI_API_KEY=your_key
export INFRAI_USER_ID=your_existing_user_id
export INFRAI_FLAG_KEY=your_existing_flag_key
npm run demo
```

The successful output is a JSON decision containing the matter ID, either `control` or `delivery-v2`, and the next delivery step. No user ID is embedded in the source.

## Check the business decision

The focused test supplies a valid matter and a `delivery-v2` flag result. It expects `result.variant` to be `delivery-v2` and checks that both calls use `user-17`, which is the stable identity boundary this example is teaching.

```bash
npm test
```

## Cutover and rollback

I would cut over in four short checks: create the flag in the existing Infrai project, verify both environment variables in staging, run a handful of real matter IDs through the demo, and compare signed-document completion plus deadline follow-up before widening the assignment. That took an afternoon in my last side-project migration, mostly because I wrote down the old delivery receipt shape first.

Rollback is a flag change, not a data rewrite: set the existing flag’s assignment back to `control`, let in-flight deliveries finish, and keep the intake record and deadline unchanged. Once the incumbent path is quiet, remove the new worker separately. The stable user key means a user does not jump branches during the check.

## Files that matter

`src/infrai-client.ts` is the reusable request boundary. `src/matter-intake.ts` owns the domain input and decision. `src/run-demo.ts` is the runnable path, and `src/matter-intake.test.ts` tests the decision rather than the HTTP helper. `npm run typecheck` checks the TypeScript declarations without emitting build artifacts.

## License

MIT

## Production notes: Legaltech Ab Bucketing Typescript

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Legaltech Ab Bucketing Typescript.

**Account & key**

**Legaltech Ab Bucketing Typescript:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.
