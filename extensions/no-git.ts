/**
 * No Git Push Extension
 *
 * Blocks `git push` from being executed by pi. When detected, pi is told
 * to show the user the exact command to run themselves instead.
 */

import { isToolCallEventType, type ExtensionAPI } from "@mariozechner/pi-coding-agent";

/** Strip single- and double-quoted strings so we don't match inside -m "..." args. */
function stripQuotes(command: string): string {
	return command.replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/'(?:[^'\\]|\\.)*'/g, "''");
}

export default function (pi: ExtensionAPI) {
	pi.on("tool_call", async (event, ctx) => {
		if (!isToolCallEventType("bash", event)) return;

		const command = event.input.command ?? "";
		if (!/\bgit\s+push\b/.test(stripQuotes(command))) return;

		ctx.ui.notify("Blocked: git push", "warning");

		return {
			block: true,
			reason:
				"git push is not permitted. Do not retry. " +
				"Show the user the exact command to run manually:\n\n" +
				`\`\`\`sh\n${command}\n\`\`\``,
		};
	});
}
