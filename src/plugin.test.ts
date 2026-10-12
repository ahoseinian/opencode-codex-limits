import { describe, expect, mock, test } from "bun:test";
import type { Plugin } from "@opencode/plugin";
import plugin from "../index";
import { CodexLimitsRpc } from "./rpc";
import type { QuotaResult } from "./types";

describe("server plugin", () => {
  test("registers quota RPC without accessing credentials during setup", async () => {
    const dispose = mock(async () => {});
    const active = mock(async () => undefined);
    let usage: (() => Promise<QuotaResult>) | undefined;
    const register = mock(
      async (definition: unknown, handlers: { usage: () => Promise<QuotaResult> }) => {
        expect(definition).toBe(CodexLimitsRpc);
        usage = handlers.usage;
        return { dispose };
      },
    );
    const context = {
      rpc: { register },
      integration: { connection: { active } },
    } as unknown as Plugin.Context;

    const cleanup = await plugin.setup(context);

    expect(plugin.id).toBe("opencode-codex-limits");
    expect(register).toHaveBeenCalledTimes(1);
    expect(active).not.toHaveBeenCalled();
    expect(await usage!()).toEqual({ ok: false, error: "no_openai_auth" });
    expect(active).toHaveBeenCalledWith("openai");
    await cleanup!();
    expect(dispose).toHaveBeenCalledTimes(1);
  });
});
