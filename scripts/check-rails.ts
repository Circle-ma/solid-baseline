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
  const relPath = relative(process.cwd(), filePath).replaceAll("\\", "/");
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  const isUiPrimitive = relPath.startsWith("src/components/ui/");
  const isDocumentShell = relPath === "src/Document.tsx";
  const isFeatureOrRouteOrLib = relPath.startsWith("src/routes/") || relPath.startsWith("src/lib/");

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // 9. Check for type escape hatches (even inside comments for @ts-ignore / @ts-expect-error)
    if (trimmed.includes("@ts-ignore") || trimmed.includes("@ts-expect-error")) {
      violations.push({
        file: relPath,
        line: lineNum,
        type: "TYPE_ESCAPE_HATCH_BANNED",
        message:
          "TypeScript escape comments (@ts-ignore, @ts-expect-error) are strictly forbidden. Resolve the type definition properly.",
        snippet: trimmed,
      });
    }

    // Skip comment lines for remaining checks
    const isComment =
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed.startsWith("*") ||
      trimmed.endsWith("*/");
    if (isComment) {
      return;
    }

    // 9 (continued). Check for `as any` in active code
    if (/\bas\s+any\b/.test(line)) {
      violations.push({
        file: relPath,
        line: lineNum,
        type: "TYPE_ESCAPE_HATCH_BANNED",
        message:
          "Type escape hatch `as any` is strictly forbidden. Use narrow types, generics, or type-safe omission helpers.",
        snippet: trimmed,
      });
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
    if (hexMatch && !line.includes("http://") && !line.includes("https://")) {
      violations.push({
        file: relPath,
        line: lineNum,
        type: "HEX_COLOR_HARDCODED",
        message: `Hardcoded hex color "${hexMatch[0]}" is forbidden. Use semantic tokens from '~/components/ui/tokens'.`,
        snippet: trimmed,
      });
    }

    // 3. Check for raw rgba / rgb / hsl / hsla / oklch colors
    const rawColorMatch = /\b(rgba|rgb|hsla|hsl|oklch)\s*\(/.exec(line);
    if (rawColorMatch) {
      violations.push({
        file: relPath,
        line: lineNum,
        type: "RAW_COLOR_FUNCTION",
        message: `Raw color function "${rawColorMatch[0]}...)" is forbidden. Define semantic tokens in panda.config.ts or use tokens from '~/components/ui/tokens'.`,
        snippet: trimmed,
      });
    }

    // 4. Check for arbitrary numeric z-index
    const zIndexMatch = /\b(zIndex|z-index)\s*[:=]\s*(?:\{["']?|["'])?(\d+)/.exec(line);
    if (zIndexMatch) {
      violations.push({
        file: relPath,
        line: lineNum,
        type: "ARBITRARY_Z_INDEX",
        message: `Arbitrary z-index "${zIndexMatch[2]}" destroys stacking context. Use canonical tokens: "hide", "base", "docked", "dropdown", "sticky", "banner", "overlay", "modal", "popover", "toast", "tooltip", "max".`,
        snippet: trimmed,
      });
    }

    // 5. Global ban on margin props
    const marginMatch =
      /\b(margin|m|mt|mb|ml|mr|mx|my|marginTop|marginBottom|marginLeft|marginRight|marginInline|marginBlock)\s*[:=]\s*["'{]/i.exec(
        line,
      );
    if (marginMatch) {
      violations.push({
        file: relPath,
        line: lineNum,
        type: "MARGIN_PROP_FORBIDDEN",
        message: `Margin prop "${marginMatch[1]}" is forbidden. Declare Margin Dead. Components must never dictate their outer positioning; parent containers orchestrate spacing via gap.`,
        snippet: trimmed,
      });
    }

    // 6. Outside src/components/ui/ and src/Document.tsx, forbid raw DOM elements
    if (!isUiPrimitive && !isDocumentShell) {
      const rawDomMatch =
        /<(div|span|p|h[1-6]|button|input|textarea|select|label|hr|svg|table)\b|<a\s+/.exec(line);
      if (rawDomMatch) {
        violations.push({
          file: relPath,
          line: lineNum,
          type: "RAW_DOM_ELEMENT_BANNED",
          message: `Raw unstyled DOM element "${rawDomMatch[0].trim()}" is forbidden outside UI primitives. Use Systematic UI Primitives from '~/components/ui' (<Box>, <VStack>, <HStack>, <Text>, <Heading>, <Button>, <Input>, <NavLink>, etc.).`,
          snippet: trimmed,
        });
      }
    }

    // 7. Outside src/components/ui/, forbid importing from styled-system/css, styled-system/patterns, or styled-system/jsx
    if (!isUiPrimitive) {
      const adhocCssMatch =
        /\bfrom\s+["']styled-system\/(css|patterns|jsx)["']|\bimport\s*\(?["']styled-system\/(css|patterns|jsx)["']/.exec(
          line,
        );
      if (adhocCssMatch) {
        violations.push({
          file: relPath,
          line: lineNum,
          type: "ADHOC_CSS_IN_FEATURE_BANNED",
          message: `Ad-hoc styled-system import "${adhocCssMatch[0]}" is forbidden outside 'src/components/ui/'. All visual composition must go through Systematic UI primitives.`,
          snippet: trimmed,
        });
      }
    }

    // 8. In src/routes/ and src/lib/, forbid declaring ad-hoc interface or type definitions
    if (isFeatureOrRouteOrLib) {
      if (
        !line.trim().startsWith("import") &&
        /\b(export\s+)?(interface|type)\s+[A-Za-z0-9_]+\s*(=|\{|<)/.test(line)
      ) {
        violations.push({
          file: relPath,
          line: lineNum,
          type: "UNSCOPED_TYPE_DEFINITION",
          message:
            "Ad-hoc type or interface declarations are forbidden in routes and lib. All contracts, domain models, and context types must reside in 'src/schema/' or 'src/components/ui/'.",
          snippet: trimmed,
        });
      }
    }

    // 10. Check for legacy Solid 1.x APIs
    const legacySolidMatch =
      /\b(onMount|splitProps|mergeProps|createResource|createComputed|Suspense|SuspenseList|ErrorBoundary|Index|batch)\b|\.Provider\b/.exec(
        line,
      );
    if (legacySolidMatch) {
      violations.push({
        file: relPath,
        line: lineNum,
        type: "LEGACY_SOLID_API_BANNED",
        message: `Legacy Solid 1.x API "${legacySolidMatch[0]}" is forbidden in Solid 2.0. Use Solid 2.0 equivalents (onSettled, microtasks, <Loading>, <Errored>, <For>, <Repeat>, automatic batching, <Context value={...}>).`,
        snippet: trimmed,
      });
    }

    // 11. Check that reactive primitives have diagnostic attribution name
    const reactivePrimMatch =
      /\b(createSignal|createMemo|createOptimistic)\s*(?:<[^>]+>)?\s*\(/.exec(line);
    if (reactivePrimMatch && !trimmed.startsWith("import") && !trimmed.startsWith("export")) {
      const window = lines.slice(index, Math.min(lines.length, index + 5)).join(" ");
      if (!/\bname\s*:/.test(window)) {
        violations.push({
          file: relPath,
          line: lineNum,
          type: "UNNAMED_REACTIVE_PRIMITIVE",
          message: `Reactive primitive "${reactivePrimMatch[1]}" must include a diagnostic name attribute (e.g. { name: "..." }) within 4 lines for @solidjs/diagnostics attribution.`,
          snippet: trimmed,
        });
      }
    }

    // 12. Check for legacy typography props (color, fontWeight, lineHeight, letterSpacing) on Text, Heading, Code
    const typoTagMatch = /<(Text|Heading|Code)\b/.exec(line);
    if (typoTagMatch) {
      const tagWindow = lines.slice(index, Math.min(lines.length, index + 8)).join(" ");
      const tagContentMatch = /<(Text|Heading|Code)\b([^>]*?)(?:>|\/)/.exec(tagWindow);
      if (tagContentMatch) {
        const legacyPropMatch = /\b(color|fontWeight|lineHeight|letterSpacing)\s*=/.exec(
          tagContentMatch[2],
        );
        if (legacyPropMatch) {
          violations.push({
            file: relPath,
            line: lineNum,
            type: "LEGACY_TYPOGRAPHY_PROP_BANNED",
            message: `Legacy typography prop "${legacyPropMatch[1]}" on <${typoTagMatch[1]}> is forbidden. Use canonical recipe variants: tone, weight, leading, tracking, and tabular.`,
            snippet: trimmed,
          });
        }
      }
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
    "✅ [ARCHITECTURAL RAILS VERIFIED] All 12 architectural invariants strictly verified across src/.\n",
  );
  process.exit(0);
}
