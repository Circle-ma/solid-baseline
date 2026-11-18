import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";

const SRC_DIR = join(import.meta.dirname, "../src");

interface Violation {
  file: string;
  line: number;
  col: number;
  type: string;
  message: string;
  snippet: string;
}

const violations: Violation[] = [];

const ALLOWED_Z_INDEX = new Set([
  "hide",
  "base",
  "docked",
  "dropdown",
  "sticky",
  "banner",
  "overlay",
  "modal",
  "popover",
  "toast",
  "tooltip",
  "max",
]);

const BANNED_RAW_DOM = new Set([
  "div",
  "span",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "button",
  "input",
  "textarea",
  "select",
  "label",
  "hr",
  "svg",
  "table",
  "a",
]);

const BANNED_MARGIN_PROPS = new Set([
  "margin",
  "m",
  "mt",
  "mb",
  "ml",
  "mr",
  "mx",
  "my",
  "marginTop",
  "marginBottom",
  "marginLeft",
  "marginRight",
  "marginInline",
  "marginBlock",
]);

const BANNED_LEGACY_SOLID_APIS = new Set([
  "onMount",
  "splitProps",
  "mergeProps",
  "createResource",
  "createComputed",
  "Suspense",
  "SuspenseList",
  "ErrorBoundary",
  "Index",
  "batch",
]);

const BANNED_TYPOGRAPHY_PROPS = new Set(["color", "fontWeight", "lineHeight", "letterSpacing"]);

function isPascalCase(str: string): boolean {
  return /^[A-Z][A-Za-z0-9]*$/.test(str);
}

function getAllFiles(dir: string): string[] {
  const result: string[] = [];
  const files = readdirSync(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      result.push(...getAllFiles(fullPath));
    } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      result.push(fullPath);
    }
  }
  return result;
}

const allFilePaths = getAllFiles(SRC_DIR);

// Create TypeScript Program and obtain TypeChecker for semantic analysis
const program = ts.createProgram(allFilePaths, {
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  jsx: ts.JsxEmit.Preserve,
  jsxImportSource: "solid-js",
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  baseUrl: join(import.meta.dirname, ".."),
  paths: {
    "~/*": ["src/*"],
    "styled-system/*": ["styled-system/*"],
  },
});

const checker = program.getTypeChecker();

function scanSourceFile(sourceFile: ts.SourceFile) {
  const filePath = sourceFile.fileName;
  const relPath = relative(join(import.meta.dirname, ".."), filePath);
  const fileContent = sourceFile.text;

  const isUiPrimitive =
    filePath.includes("/src/components/ui/") || filePath.includes("\\src\\components\\ui\\");
  const isDocumentShell = filePath.endsWith("src/Document.tsx");
  const isRoute = filePath.includes("/src/routes/") || filePath.includes("\\src\\routes\\");
  const isLib = filePath.includes("/src/lib/") || filePath.includes("\\src\\lib\\");
  const isSchema = filePath.includes("/src/schema/") || filePath.includes("\\src\\schema\\");
  const isTest = filePath.includes("/src/__tests__/") || filePath.includes("\\src\\__tests__\\");

  function addViolation(node: ts.Node, type: string, message: string) {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    const snippet = node.getText(sourceFile).slice(0, 100).replace(/\n/g, " ");
    violations.push({
      file: relPath,
      line: line + 1,
      col: character + 1,
      type,
      message,
      snippet,
    });
  }

  // 1. Text-level check: Escape hatches banned anywhere in src/
  const lines = fileContent.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.includes("@ts-ignore") || l.includes("@ts-expect-error")) {
      violations.push({
        file: relPath,
        line: i + 1,
        col: 1,
        type: "TYPE_ESCAPE_HATCH_BANNED",
        message:
          "TypeScript suppressions (@ts-ignore, @ts-expect-error) are strictly banned. Fix type errors rationally.",
        snippet: l.trim(),
      });
    }
  }

  function checkZIndex(exprNode: ts.Node, reportNode: ts.Node) {
    if (ts.isNumericLiteral(exprNode)) {
      addViolation(
        reportNode,
        "ARBITRARY_Z_INDEX",
        `Arbitrary numeric z-index "${exprNode.text}" destroys stacking context. Use canonical tokens: "hide", "base", "docked", "dropdown", "sticky", "banner", "overlay", "modal", "popover", "toast", "tooltip", "max".`,
      );
      return;
    }
    if (ts.isStringLiteral(exprNode)) {
      if (!ALLOWED_Z_INDEX.has(exprNode.text)) {
        addViolation(
          reportNode,
          "ARBITRARY_Z_INDEX",
          `Arbitrary z-index "${exprNode.text}" destroys stacking context. Use canonical tokens: "hide", "base", "docked", "dropdown", "sticky", "banner", "overlay", "modal", "popover", "toast", "tooltip", "max".`,
        );
      }
      return;
    }

    // Semantic TypeChecker analysis for ternary, variable, and complex expressions
    try {
      const type = checker.getTypeAtLocation(exprNode);
      const typeStr = checker.typeToString(type);

      function isBadType(t: ts.Type): boolean {
        if (t.flags & (ts.TypeFlags.Number | ts.TypeFlags.NumberLiteral)) {
          return true;
        }
        if (t.isStringLiteral()) {
          return !ALLOWED_Z_INDEX.has(t.value);
        }
        return false;
      }

      let violating = false;
      if (type.isUnion()) {
        for (const sub of type.types) {
          if (isBadType(sub)) {
            violating = true;
            break;
          }
        }
      } else if (isBadType(type)) {
        violating = true;
      }

      if (violating) {
        addViolation(
          reportNode,
          "ARBITRARY_Z_INDEX",
          `Arbitrary z-index of type "${typeStr}" destroys stacking context. Use canonical tokens: "hide", "base", "docked", "dropdown", "sticky", "banner", "overlay", "modal", "popover", "toast", "tooltip", "max".`,
        );
      }
    } catch {
      // TypeChecker fallback
    }
  }

  function visitor(node: ts.Node) {
    // 2. Check for type assertion escape hatch: `as any`
    if (ts.isAsExpression(node)) {
      if (node.type.kind === ts.SyntaxKind.AnyKeyword) {
        addViolation(
          node,
          "TYPE_ESCAPE_HATCH_BANNED",
          "Type assertion `as any` is strictly banned. Derive types from SSOT schema or use narrow type discrimination.",
        );
      }
    }

    // 3. Check for inline style attribute: style={...} or style="..."
    if (ts.isJsxAttribute(node) && node.name.text === "style") {
      addViolation(
        node,
        "INLINE_STYLE_FORBIDDEN",
        "Inline `style` attribute is strictly banned. Use design system tokens via Panda CSS primitives in ~/components/ui.",
      );
    }

    // 4. Check for hardcoded hex colors & raw color functions
    if (ts.isStringLiteral(node)) {
      const text = node.text;
      if (/^#(?:[0-9a-fA-F]{3,4}){1,2}$/.test(text) && !text.includes("/") && !text.includes("?")) {
        const parent = node.parent;
        const isHref =
          ts.isJsxAttribute(parent) && (parent.name.text === "href" || parent.name.text === "to");
        if (!isHref) {
          addViolation(
            node,
            "HEX_COLOR_HARDCODED",
            `Hardcoded hex color "${text}" is forbidden. Map visual surfaces to tokens exported from '~/components/ui/tokens'.`,
          );
        }
      }

      const rawColorMatch = /\b(rgba|rgb|hsla|hsl|oklch)\s*\(/i.exec(text);
      if (rawColorMatch) {
        addViolation(
          node,
          "RAW_COLOR_FUNCTION",
          `Raw color function "${rawColorMatch[0]}...)" is forbidden. Define semantic tokens in panda.config.ts or use tokens from '~/components/ui/tokens'.`,
        );
      }
    }

    // 5. Check for arbitrary z-index (semantic TypeChecker analysis)
    if (ts.isJsxAttribute(node) && (node.name.text === "zIndex" || node.name.text === "z-index")) {
      if (node.initializer) {
        const expr = ts.isJsxExpression(node.initializer)
          ? node.initializer.expression
          : node.initializer;
        if (expr) {
          checkZIndex(expr, node);
        }
      }
    } else if (ts.isPropertyAssignment(node)) {
      const propName = node.name.getText(sourceFile).replace(/['"]/g, "");
      if (propName === "zIndex" || propName === "z-index") {
        checkZIndex(node.initializer, node);
      }
    }

    // 6. Margin props: Ban push margins, permit flex alignment ("auto" for ml, mr, mx)
    if (ts.isJsxAttribute(node)) {
      const propName = node.name.text;
      if (BANNED_MARGIN_PROPS.has(propName)) {
        let isAllowedAuto = false;
        if (propName === "ml" || propName === "mr" || propName === "mx") {
          if (
            node.initializer &&
            ts.isStringLiteral(node.initializer) &&
            node.initializer.text === "auto"
          ) {
            isAllowedAuto = true;
          } else if (
            node.initializer &&
            ts.isJsxExpression(node.initializer) &&
            node.initializer.expression &&
            ts.isStringLiteral(node.initializer.expression) &&
            node.initializer.expression.text === "auto"
          ) {
            isAllowedAuto = true;
          }
        }
        if (!isAllowedAuto) {
          addViolation(
            node,
            "MARGIN_PROP_FORBIDDEN",
            `Margin prop "${propName}" is forbidden. Declare Margin Dead. Components must never dictate outer spacing; parent containers orchestrate spacing via gap (only ml/mr/mx="auto" are permitted for flex alignment).`,
          );
        }
      }
    } else if (ts.isPropertyAssignment(node)) {
      const propName = node.name.getText(sourceFile).replace(/['"]/g, "");
      if (BANNED_MARGIN_PROPS.has(propName)) {
        let isAllowedAuto = false;
        if (propName === "ml" || propName === "mr" || propName === "mx") {
          if (ts.isStringLiteral(node.initializer) && node.initializer.text === "auto") {
            isAllowedAuto = true;
          } else if (
            isUiPrimitive &&
            ts.isPropertyAccessExpression(node.initializer) &&
            node.initializer.expression.getText(sourceFile) === "props"
          ) {
            isAllowedAuto = true;
          }
        }
        if (!isAllowedAuto) {
          addViolation(
            node,
            "MARGIN_PROP_FORBIDDEN",
            `Margin prop "${propName}" is forbidden. Declare Margin Dead. Components must never dictate outer spacing; parent containers orchestrate spacing via gap (only ml/mr/mx="auto" are permitted for flex alignment).`,
          );
        }
      }
    }

    // 7. Outside src/components/ui/ and src/Document.tsx, forbid raw DOM elements
    if (!isUiPrimitive && !isDocumentShell) {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tagName = node.tagName.getText(sourceFile);
        if (BANNED_RAW_DOM.has(tagName)) {
          addViolation(
            node,
            "RAW_DOM_ELEMENT_BANNED",
            `Raw HTML element "<${tagName}>" is forbidden in features. Use systematic UI primitives from "~/components/ui" (e.g. <Heading>, <Text>, <Button>, <Box>, <Container>, <VStack>, <HStack>, <NavLink>).`,
          );
        }
      }
    }

    // 8. Outside src/components/ui/, strictly forbid importing from Panda internals
    if (!isUiPrimitive) {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier)) {
          const mod = moduleSpecifier.text;
          if (
            mod === "styled-system/css" ||
            mod === "styled-system/patterns" ||
            mod === "styled-system/jsx"
          ) {
            addViolation(
              node,
              "ADHOC_CSS_IN_FEATURE_BANNED",
              `Direct import from "${mod}" in feature code is strictly forbidden. Consume pre-composed primitives from "~/components/ui".`,
            );
          }
        }
      }
    }

    // 9. In src/routes/ and src/lib/, forbid ad-hoc type/interface definitions
    if (isRoute || isLib) {
      if (ts.isInterfaceDeclaration(node)) {
        addViolation(
          node,
          "UNSCOPED_TYPE_DEFINITION",
          `Ad-hoc interface "${node.name.text}" in ${relPath} is forbidden. Schema is Single Source of Truth (SSOT); declare all models and context types in src/schema/.`,
        );
      } else if (ts.isTypeAliasDeclaration(node)) {
        addViolation(
          node,
          "UNSCOPED_TYPE_DEFINITION",
          `Ad-hoc type alias "${node.name.text}" in ${relPath} is forbidden. Schema is Single Source of Truth (SSOT); declare all models and context types in src/schema/.`,
        );
      }
    }

    // 10. Check for banned legacy Solid 1.x APIs
    if (ts.isIdentifier(node)) {
      const idName = node.text;
      if (BANNED_LEGACY_SOLID_APIS.has(idName)) {
        const parent = node.parent;
        const isImporting = ts.isImportSpecifier(parent) && parent.name === node;
        const isCalling = ts.isCallExpression(parent) && parent.expression === node;
        const isJsxTag =
          (ts.isJsxOpeningElement(parent) || ts.isJsxSelfClosingElement(parent)) &&
          parent.tagName === node;
        if (isImporting || isCalling || isJsxTag) {
          addViolation(
            node,
            "LEGACY_SOLID_API_BANNED",
            `Legacy Solid 1.x API "${idName}" is banned. Use Solid 2.0 primitives (e.g. onSettled, omit, createSignal(() => ...), Errored/Loading).`,
          );
        }
      }
    }

    // 11. Check for unnamed reactive primitives: createSignal, createMemo, createOptimistic
    if (ts.isCallExpression(node)) {
      const fnName = node.expression.getText(sourceFile);
      if (fnName === "createSignal" || fnName === "createMemo" || fnName === "createOptimistic") {
        let hasNameOption = false;
        const optArg =
          fnName === "createSignal" || fnName === "createMemo"
            ? node.arguments[1]
            : node.arguments[1];
        if (optArg && ts.isObjectLiteralExpression(optArg)) {
          for (const prop of optArg.properties) {
            if (ts.isPropertyAssignment(prop)) {
              const pName = prop.name.getText(sourceFile);
              if (
                pName === "name" &&
                prop.initializer &&
                ts.isStringLiteral(prop.initializer) &&
                prop.initializer.text.length > 0
              ) {
                hasNameOption = true;
                break;
              }
            }
          }
        }
        if (!hasNameOption) {
          addViolation(
            node,
            "UNNAMED_REACTIVE_PRIMITIVE",
            `Reactive primitive "${fnName}" must provide { name: "..." } diagnostic attribution option for @solidjs/diagnostics.`,
          );
        }
      }
    }

    // 12. Check for legacy typography props on <Text>, <Heading>, <Code>
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = node.tagName.getText(sourceFile);
      if (tagName === "Text" || tagName === "Heading" || tagName === "Code") {
        for (const attr of node.attributes.properties) {
          if (ts.isJsxAttribute(attr)) {
            const attrName = attr.name.text;
            if (BANNED_TYPOGRAPHY_PROPS.has(attrName)) {
              addViolation(
                attr,
                "LEGACY_TYPOGRAPHY_PROP_BANNED",
                `Legacy typography prop "${attrName}" is forbidden on <${tagName}>. Use systematic recipe variants (tone="...", weight="...", leading="...", tracking="...").`,
              );
            }
          }
        }
      }
    }

    // 13. Check for component parameter destructuring: function Comp({ prop }) is banned
    if (ts.isFunctionDeclaration(node)) {
      const fnName = node.name?.text;
      if (fnName && isPascalCase(fnName)) {
        for (const param of node.parameters) {
          if (ts.isObjectBindingPattern(param.name)) {
            addViolation(
              param,
              "COMPONENT_PARAM_DESTRUCTURE_BANNED",
              `Component parameter destructuring in "${fnName}" is strictly forbidden. Solid 2.0 tracks reactivity through property access; always use \`props.property\`.`,
            );
          }
        }
      }
    } else if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      isPascalCase(node.name.text)
    ) {
      const init = node.initializer;
      if (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) {
        for (const param of init.parameters) {
          if (ts.isObjectBindingPattern(param.name)) {
            addViolation(
              param,
              "COMPONENT_PARAM_DESTRUCTURE_BANNED",
              `Component parameter destructuring in "${node.name.text}" is strictly forbidden. Solid 2.0 tracks reactivity through property access; always use \`props.property\`.`,
            );
          }
        }
      }
    }

    // 14. Architecture boundary: In src/routes/, forbid direct fetch() or DbConnection instantiation
    if (isRoute) {
      if (ts.isCallExpression(node)) {
        const callTarget = node.expression.getText(sourceFile);
        if (
          callTarget === "fetch" ||
          callTarget === "window.fetch" ||
          callTarget === "globalThis.fetch"
        ) {
          addViolation(
            node,
            "UNSCOPED_IO_CALL_BANNED",
            "Direct fetch() call in routes is forbidden. All external I/O must be encapsulated in src/lib/ or Context Actions.",
          );
        }
      } else if (ts.isNewExpression(node)) {
        const newTarget = node.expression.getText(sourceFile);
        if (newTarget.includes("DbConnection") || newTarget.includes("DbConnectionBuilder")) {
          addViolation(
            node,
            "UNSCOPED_IO_CALL_BANNED",
            "Direct DbConnection instantiation in routes is forbidden. SpacetimeDB connections must be managed via src/lib/ or Context Providers.",
          );
        }
      }
    }

    ts.forEachChild(node, visitor);
  }

  visitor(sourceFile);
}

for (const filePath of allFilePaths) {
  const sourceFile = program.getSourceFile(filePath);
  if (sourceFile) {
    scanSourceFile(sourceFile);
  }
}

if (violations.length > 0) {
  console.error("\n❌ [ARCHITECTURAL RAIL VIOLATIONS DETECTED]");
  console.error("═══════════════════════════════════════════════════════════════════════════");
  console.error("The following violations break the 2026 Paved Path design system invariants:");
  console.error("═══════════════════════════════════════════════════════════════════════════\n");

  for (const v of violations) {
    console.error(`  [${v.type}] at ${v.file}:${v.line}:${v.col}`);
    console.error(`  Offense: ${v.snippet}`);
    console.error(`  Remedy:  ${v.message}\n`);
  }

  console.error(
    `Total: ${violations.length} architectural violation(s). Fix all violations before proceeding.\n`,
  );
  process.exit(1);
} else {
  console.log(
    "✅ [ARCHITECTURAL RAILS VERIFIED] All 14 architectural invariants strictly verified across src/ via TypeScript AST & TypeChecker.\n",
  );
  process.exit(0);
}
