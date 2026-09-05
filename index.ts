import { Plugin } from "@opencode-ai/plugin";
import { parseJwt } from "./src/auth";
import { CodexLimitsRpc } from "./src/rpc";
import type { QuotaResult } from "./src/types";
import { fetchUsage } from "./src/usage";

const plugin = Plugin.define({
  id: "opencode-codex-limits",
  async setup(ctx) {
    const registration = await ctx.rpc.register(CodexLimitsRpc, {
      usage: async (): Promise<QuotaResult> => {
        const connection = await ctx.integration.connection.active("openai");
        if (!connection) return { ok: false, error: "no_openai_auth" };

        const credential = await ctx.integration.connection.resolve(connection);
        if (!credential) return { ok: false, error: "no_openai_auth" };
        if (credential.type !== "oauth") return { ok: false, error: "unsupported_auth" };

        const jwt = parseJwt(credential.access);
        if (!jwt) return { ok: false, error: "invalid_token" };

        return fetchUsage(credential.access, jwt.accountId);
      },
    });

    return () => registration.dispose();
  },
});

export default plugin;
