import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
	// TypeScript recommended rules (ready for when extensions are added)
	...tseslint.configs.recommended,

	// Prettier must be last — disables all formatting rules that conflict
	eslintConfigPrettier,

	{
		rules: {
			// Allow unused vars when prefixed with _
			"@typescript-eslint/no-unused-vars": [
				"error",
				{ argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
			],
			"@typescript-eslint/no-explicit-any": "warn",
		},
	},

	{
		ignores: ["node_modules/**", "*.js"],
	},
);
