import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SRC_DIR = join(import.meta.dirname, "../src");

interface Violation {
  file: string;
  line: number;
  type: string;
  message: string;
  snippet: string;
}

const violations: Violation[] = [];

function scanDirectory(dir: string) {
  const files = readdirSync(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      scanFile(fullPath);
    }
  }
}

function scanFile(filePath: string) {
  const relPath = relative(process.cwd(), filePath);
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // Skip comment lines
    if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
      return;
    }

    // 1. Check for inline style attributes
    if (/\bstyle\s*=\s*[{"]/i.test(line)) {
      violations.push({
        file: relPath,
        line: lineNum,
        type: "INLINE_STYLE_FORBIDDEN",
        message:
          "Inline style attribute (`style={{ ... }}`) is strictly forbidden. Use Panda CSS layout primitives and tokens.",
        snippet: trimmed,
      });
    }

    // 2. Check for hardcoded hex colors
    const hexMatch = /#([0-9a-fA-F]{3,8})\b/.exec(line);
    // Allow URL fragments or schema comments if any, but in source ts/tsx code flag color hexes
    if (hexMatch && !line.includes("http://") && !line.includes("https://")) {
      violations.push({
        file: relPath,
        line: lineNum,
        type: "HEX_COLOR_HARDCODED",
        message: `Hardcoded hex color "${hexMatch[0]}" is forbidden. Use semantic tokens from '~/components/ui/tokens' (e.g., STATUS.success, STATUS.danger, ACCENTS, FOREGROUNDS, SURFACES).`,
        snippet: trimmed,
      });
    }

    // 3. Check for raw rgba / rgb colors
    const rgbMatch = /\b(rgba|rgb|hsla|hsl)\s*\(/.exec(line);
    if (rgbMatch) {
      violations.push({
        file: relPath,
        line: lineNum,
        type: "RAW_COLOR_FUNCTION",
        message: `Raw color function "${rgbMatch[0]}...)" is forbidden. Define semantic tokens with alpha in panda.config.ts or use tokens from '~/components/ui/tokens'.`,
        snippet: trimmed,
      });
    }

    // 4. Check for arbitrary numeric z-index
    const zIndexMatch = /\b(zIndex|z-index)\s*[:=]\s*["']?(\d+)["']?/.exec(line);
    if (zIndexMatch) {
      violations.push({
        file: relPath,
        line: lineNum,
        type: "ARBITRARY_Z_INDEX",
        message: `Arbitrary z-index "${zIndexMatch[2]}" destroys stacking context. Use canonical tokens: "hide" (-1), "base" (0), "docked" (10), "dropdown" (1000), "sticky" (1100), "banner" (1200), "overlay" (1300), "modal" (1400), "popover" (1500), "toast" (1600), "tooltip" (1700), "max" (9999).`,
        snippet: trimmed,
      });
    }
  });
}

scanDirectory(SRC_DIR);

if (violations.length > 0) {
  console.error("\n❌ [ARCHITECTURAL RAIL VIOLATIONS DETECTED]");
  console.error("═══════════════════════════════════════════════════════════════════════════");
  console.error("The following violations break the 2026 Paved Path design system invariants:");
  console.error("═══════════════════════════════════════════════════════════════════════════\n");

  for (const v of violations) {
    console.error(`  [${v.type}] at ${v.file}:${v.line}`);
    console.error(`  Offense: ${v.snippet}`);
    console.error(`  Remedy:  ${v.message}\n`);
  }

  console.error(
    `Total: ${violations.length} architectural violation(s). Fix all violations before proceeding.\n`,
  );
  process.exit(1);
} else {
  console.log(
    "✅ [ARCHITECTURAL RAILS VERIFIED] All source files strictly comply with zero-hardcoding closed-world tokens.\n",
  );
  process.exit(0);
}
