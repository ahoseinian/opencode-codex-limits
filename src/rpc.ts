import { Rpc } from "@opencode-ai/plugin";

export const CodexLimitsRpc = Rpc.define({
  id: "opencode-codex-limits",
  methods: {
    usage: {
      input: {
        type: "object",
        additionalProperties: false,
      },
      output: {
        oneOf: [
          {
            type: "object",
            properties: {
              ok: { const: true },
              plan: { type: "string" },
              windows: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    label: { type: "string" },
                    usedPercent: { type: "number" },
                    resetText: { type: "string" },
                  },
                  required: ["label", "usedPercent", "resetText"],
                  additionalProperties: false,
                },
              },
            },
            required: ["ok", "plan", "windows"],
            additionalProperties: false,
          },
          {
            type: "object",
            properties: {
              ok: { const: false },
              error: {
                enum: [
                  "no_openai_auth",
                  "unsupported_auth",
                  "invalid_token",
                  "network",
                  "auth",
                  "rate_limited",
                  "invalid_response",
                  "server_error",
                ],
              },
            },
            required: ["ok", "error"],
            additionalProperties: false,
          },
        ],
      },
    },
  },
  events: {},
});
