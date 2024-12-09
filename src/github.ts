import type { Context } from "@actions/github/lib/context";
import * as core from "@actions/core";

export function getBaseSHA(context: Context) {
  switch (context.eventName) {
    case "push": {
      const payload = context.payload.event;
      core.debug(`Push event payload: ${JSON.stringify(payload)}`);
      
      // Check if payload and required fields exist
      if (!payload || !payload.after) {
        throw new Error('Invalid push event payload');
      }

      if (payload.before === "0000000000000000000000000000000000000000") {
        const baseCommit = `${payload.after}^`;
        return baseCommit;
      }

      if (!payload.before) {
        throw new Error('Missing before SHA in push event payload');
      }

      core.debug(`Using before commit: ${payload.before}`);
      return payload.before;
    }
    case "pull_request": {
      const payload = context.payload;
      const baseSha = payload.pull_request?.base?.sha;
      if (!baseSha) {
        throw new Error('Missing base SHA in pull request payload');
      }
      return baseSha;
    }
    default: {
      throw new Error(`Unexpected event: ${context.eventName}`);
    }
  }
}