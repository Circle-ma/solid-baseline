import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";

const ROOT_DIR = join(import.meta.dirname, "..");
const SRC_DIR = join(ROOT_DIR, "src");
const SERVER_DIR = join(ROOT_DIR, "server");
const SPACETIMEDB_SRC_DIR = join(ROOT_DIR, "spacetimedb/src");

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

// Only ban visual/interactive HTML elements that break design system consistency.
// Structural container tags (div, section, main, nav, header, footer, article, aside,
// ul, ol, li, form, label, span) are permitted.
const BANNED_RAW_DOM = new Set([
  "button",
  "input",
  "select",
  "textarea",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "a",
  "hr",
  "svg",
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

const STYLE_COLOR_JSX_ATTRS = new Set([
  "bg",
  "background",
  "backgroundColor",
  "color",
  "borderColor",
  "borderTopColor",
  "borderBottomColor",
  "borderLeftColor",
  "borderRightColor",
  "outlineColor",
  "fill",
  "stroke",
  "boxShadow",
  "textShadow",
  "border",
  "borderTop",
  "borderBottom",
  "borderLeft",
  "borderRight",
  "css",
]);

const STYLE_CALL_TARGETS = new Set([
  "css",
  "css.raw",
  "cva",
  "sva",
  "box",
  "container",
  "vstack",
  "hstack",
  "grid",
  "divider",
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

const BANNED_CROSS_RUNTIME_MODULES = [
  "src/components",
  "~/components",
  "@solidjs/web",
  "@ark-ui/solid",
  "styled-system",
  "happy-dom",
];

const BANNED_BROWSER_GLOBALS = new Set([
  "window",
  "document",
  "localStorage",
  "sessionStorage",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLDivElement",
  "HTMLButtonElement",
  "HTMLLinkElement",
  "DOMParser",
  "MutationObserver",
  "ResizeObserver",
  "IntersectionObserver",
  "customElements",
]);

const MAX_IDENTICAL_ADHOC_CSS_COUNT = 2;

function isPascalCase(str: string): boolean {
  return /^[A-Z][A-Za-z0-9]*$/.test(str);
}

function getJsxAttrName(attr: ts.JsxAttribute): string {
  return ts.isIdentifier(attr.name) ? attr.name.text : attr.name.getText();
}

function getAllFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
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

function getEnclosingStyleCall(node: ts.Node, sourceFile: ts.SourceFile): ts.CallExpression | null {
  let current: ts.Node | undefined = node.parent;
  while (current) {
    if (ts.isCallExpression(current)) {
      const target = current.expression.getText(sourceFile);
      if (STYLE_CALL_TARGETS.has(target)) {
        return current;
      }
    }
    current = current.parent;
  }
  return null;
}

function getEnclosingJsxAttribute(node: ts.Node): ts.JsxAttribute | null {
  let current: ts.Node | undefined = node.parent;
  while (current) {
    if (ts.isJsxAttribute(current)) {
      return current;
    }
    if (ts.isJsxOpeningElement(current) || ts.isJsxSelfClosingElement(current)) {
      return null;
    }
    current = current.parent;
  }
  return null;
}

function isFreeGlobalReference(node: ts.Identifier): boolean {
  const parent = node.parent;
  if (!parent) return false;
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) return false;
  if (ts.isPropertyAssignment(parent) && parent.name === node) return false;
  if (ts.isPropertySignature(parent) && parent.name === node) return false;
  if (ts.isMethodDeclaration(parent) && parent.name === node) return false;
  if (ts.isMethodSignature(parent) && parent.name === node) return false;
  if (ts.isParameter(parent) && parent.name === node) return false;
  if (ts.isVariableDeclaration(parent) && parent.name === node) return false;
  if (ts.isFunctionDeclaration(parent) && parent.name === node) return false;
  if (ts.isImportSpecifier(parent) || ts.isImportClause(parent) || ts.isNamespaceImport(parent)) {
    return false;
  }
  if (ts.isBindingElement(parent) && parent.name === node) return false;
  if (ts.isTypeAliasDeclaration(parent) || ts.isInterfaceDeclaration(parent)) return false;
  return true;
}

const srcFilePaths = getAllFiles(SRC_DIR);
const serverFilePaths = getAllFiles(SERVER_DIR);
const moduleFilePaths = getAllFiles(SPACETIMEDB_SRC_DIR);
const allFilePaths = [...srcFilePaths, ...serverFilePaths, ...moduleFilePaths];

// Create TypeScript Program and obtain TypeChecker for semantic analysis
const program = ts.createProgram(allFilePaths, {
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  jsx: ts.JsxEmit.Preserve,
  jsxImportSource: "@solidjs/web",
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  baseUrl: ROOT_DIR,
  paths: {
    "~/*": ["src/*"],
    "styled-system/*": ["styled-system/*"],
  },
});

const checker = program.getTypeChecker();

// Track identical one-off css(...) calls in feature code across src/ (excluding UI primitives)
const adhocCssOccurrences = new Map<string, Array<{ sourceFile: ts.SourceFile; node: ts.Node }>>();

function addViolation(
  sourceFile: ts.SourceFile,
  relPath: string,
  node: ts.Node,
  type: string,
  message: string,
) {
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

function scanBackendFile(sourceFile: ts.SourceFile) {
  const filePath = sourceFile.fileName;
  const relPath = relative(ROOT_DIR, filePath);

  function visitor(node: ts.Node) {
    // Rule #16: CROSS_RUNTIME_IMPORT_BANNED (server/ & spacetimedb/ must never import UI/DOM)
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      const spec = node.moduleSpecifier;
      if (spec && ts.isStringLiteral(spec)) {
        const mod = spec.text;
        for (const banned of BANNED_CROSS_RUNTIME_MODULES) {
          if (mod === banned || mod.startsWith(`${banned}/`) || mod.includes(`/${banned}`)) {
            addViolation(
              sourceFile,
              relPath,
              node,
              "CROSS_RUNTIME_IMPORT_BANNED",
              `Cross-runtime import "${mod}" is forbidden in ${relPath}. Server and SpacetimeDB modules must never depend on browser UI primitives, @solidjs/web, or DOM packages.`,
            );
            break;
          }
        }
      }
    }

    if (ts.isIdentifier(node) && BANNED_BROWSER_GLOBALS.has(node.text)) {
      if (isFreeGlobalReference(node)) {
        addViolation(
          sourceFile,
          relPath,
          node,
          "CROSS_RUNTIME_IMPORT_BANNED",
          `Browser/DOM global "${node.text}" is forbidden in ${relPath}. Backend and SpacetimeDB runtimes must remain strictly isolated from DOM APIs.`,
        );
      }
    }

    ts.forEachChild(node, visitor);
  }

  visitor(sourceFile);
}

function scanSourceFile(sourceFile: ts.SourceFile) {
  const filePath = sourceFile.fileName;
  const relPath = relative(ROOT_DIR, filePath);
  const fileContent = sourceFile.text;

  const isUiPrimitive =
    filePath.includes("/src/components/ui/") || filePath.includes("\\src\\components\\ui\\");
  const isDocumentShell = filePath.endsWith("src/Document.tsx");
  const isRoute = filePath.includes("/src/routes/") || filePath.includes("\\src\\routes\\");
  const isLib = filePath.includes("/src/lib/") || filePath.includes("\\src\\lib\\");

  function report(node: ts.Node, type: string, message: string) {
    addViolation(sourceFile, relPath, node, type, message);
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
      report(
        reportNode,
        "ARBITRARY_Z_INDEX",
        `Arbitrary numeric z-index "${exprNode.text}" destroys stacking context. Use canonical tokens: "hide", "base", "docked", "dropdown", "sticky", "banner", "overlay", "modal", "popover", "toast", "tooltip", "max".`,
      );
      return;
    }
    if (ts.isStringLiteral(exprNode)) {
      if (!ALLOWED_Z_INDEX.has(exprNode.text)) {
        report(
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
        report(
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
    // Rule #9: Check for type assertion escape hatch: `as any`
    if (ts.isAsExpression(node)) {
      if (node.type.kind === ts.SyntaxKind.AnyKeyword) {
        report(
          node,
          "TYPE_ESCAPE_HATCH_BANNED",
          "Type assertion `as any` is strictly banned. Derive types from SSOT schema or use narrow type discrimination.",
        );
      }
    }

    // Rule #1: Check for inline style attribute: style={...} or style="..."
    if (ts.isJsxAttribute(node) && getJsxAttrName(node) === "style") {
      report(
        node,
        "INLINE_STYLE_FORBIDDEN",
        "Inline `style` attribute is strictly banned. Use design system tokens via Panda CSS primitives in ~/components/ui.",
      );
    }

    // Rules #2 & #3: Check for hardcoded hex colors & raw color functions ONLY inside style contexts
    if (ts.isStringLiteral(node)) {
      const inStyleCall = getEnclosingStyleCall(node, sourceFile) !== null;
      const enclosingAttr = getEnclosingJsxAttribute(node);
      const inStyleJsxAttr =
        enclosingAttr !== null && STYLE_COLOR_JSX_ATTRS.has(getJsxAttrName(enclosingAttr));

      if (inStyleCall || inStyleJsxAttr) {
        const text = node.text;
        if (
          /^#(?:[0-9a-fA-F]{3,4}){1,2}$/.test(text) &&
          !text.includes("/") &&
          !text.includes("?")
        ) {
          report(
            node,
            "HEX_COLOR_HARDCODED",
            `Hardcoded hex color "${text}" is forbidden in styles. Map visual surfaces to tokens exported from '~/components/ui/tokens'.`,
          );
        }

        const rawColorMatch = /\b(rgba|rgb|hsla|hsl|oklch)\s*\(/i.exec(text);
        if (rawColorMatch) {
          report(
            node,
            "RAW_COLOR_FUNCTION",
            `Raw color function "${rawColorMatch[0]}...)" is forbidden in styles. Define semantic tokens in panda.config.ts or use tokens from '~/components/ui/tokens'.`,
          );
        }
      }
    }

    // Rule #4: Check for arbitrary z-index (semantic TypeChecker analysis) in JSX & style calls
    if (ts.isJsxAttribute(node)) {
      const attrName = getJsxAttrName(node);
      if (attrName === "zIndex" || attrName === "z-index") {
        if (node.initializer) {
          const expr = ts.isJsxExpression(node.initializer)
            ? node.initializer.expression
            : node.initializer;
          if (expr) {
            checkZIndex(expr, node);
          }
        }
      }
    } else if (ts.isPropertyAssignment(node) && getEnclosingStyleCall(node, sourceFile) !== null) {
      const propName = node.name.getText(sourceFile).replace(/['"]/g, "");
      if (propName === "zIndex" || propName === "z-index") {
        checkZIndex(node.initializer, node);
      }
    }

    // Rule #5: Margin props — ban push margins ONLY in JSX attributes & style calls (permit ml/mr/mx="auto")
    if (ts.isJsxAttribute(node)) {
      const propName = getJsxAttrName(node);
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
          report(
            node,
            "MARGIN_PROP_FORBIDDEN",
            `Margin prop "${propName}" is forbidden. Declare Margin Dead. Components must never dictate outer spacing; parent containers orchestrate spacing via gap (only ml/mr/mx="auto" are permitted for flex alignment).`,
          );
        }
      }
    } else if (ts.isPropertyAssignment(node) && getEnclosingStyleCall(node, sourceFile) !== null) {
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
          report(
            node,
            "MARGIN_PROP_FORBIDDEN",
            `Margin prop "${propName}" is forbidden in style objects. Components must never dictate outer spacing; parent containers orchestrate spacing via gap (only ml/mr/mx="auto" are permitted for flex alignment).`,
          );
        }
      }
    }

    // Rule #6: Outside src/components/ui/ and src/Document.tsx, forbid raw visual/interactive DOM elements
    if (!isUiPrimitive && !isDocumentShell) {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tagName = node.tagName.getText(sourceFile);
        if (BANNED_RAW_DOM.has(tagName)) {
          report(
            node,
            "RAW_DOM_ELEMENT_BANNED",
            `Raw visual/interactive HTML element "<${tagName}>" is forbidden outside UI primitives. Use systematic primitives from "~/components/ui" (<Button>, <Input>, <Heading>, <Text>, <NavLink>, <Divider>, <Icon>).`,
          );
        }
      }
    }

    // Rule #7: Outside src/components/ui/, allow one-off `css()` from `styled-system/css`
    // (repeated >= 3 identical styles must be extracted to cva/recipe); still ban `styled-system/patterns` and `styled-system/jsx`.
    if (!isUiPrimitive) {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier)) {
          const mod = moduleSpecifier.text;
          if (mod === "styled-system/patterns" || mod === "styled-system/jsx") {
            report(
              node,
              "ADHOC_CSS_IN_FEATURE_BANNED",
              `Direct import from "${mod}" in feature code is forbidden. Consume layout primitives from "~/components/ui" (one-off page layout styles may use css() from "styled-system/css").`,
            );
          }
        }
      } else if (
        ts.isCallExpression(node) &&
        node.expression.getText(sourceFile) === "css" &&
        node.arguments.length > 0
      ) {
        const normalized = node.arguments
          .map((arg) => arg.getText(sourceFile).replace(/\s+/g, " ").trim())
          .join(",");
        const existing = adhocCssOccurrences.get(normalized) ?? [];
        existing.push({ sourceFile, node });
        adhocCssOccurrences.set(normalized, existing);
      }
    }

    // Rule #8: In src/routes/, forbid exported interface/type declarations so domain contracts live in src/schema/.
    // src/lib/ is permitted to export its own client/hook configuration types.
    if (isRoute) {
      if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
        const hasExport = node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
        if (hasExport) {
          const kindLabel = ts.isInterfaceDeclaration(node) ? "interface" : "type alias";
          report(
            node,
            "UNSCOPED_TYPE_DEFINITION",
            `Exported ${kindLabel} "${node.name.text}" in ${relPath} is forbidden. Domain entities, RPC contracts, and shared types must be declared in src/schema/ (private non-exported helper types are allowed).`,
          );
        }
      }
    }

    // Rule #10: Check for banned legacy Solid 1.x APIs
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
          report(
            node,
            "LEGACY_SOLID_API_BANNED",
            `Legacy Solid 1.x API "${idName}" is banned. Use Solid 2.0 primitives (e.g. onSettled, omit, createSignal(() => ...), Errored/Loading).`,
          );
        }
      }
    }

    // Rule #11: In src/lib/, enforce diagnostic attribution { name: ... } on shared reactive primitives
    if (isLib && ts.isCallExpression(node)) {
      const fnName = node.expression.getText(sourceFile);
      if (fnName === "createSignal" || fnName === "createMemo" || fnName === "createOptimistic") {
        let hasNameOption = false;
        const optArg = node.arguments[1];
        if (optArg && ts.isObjectLiteralExpression(optArg)) {
          for (const prop of optArg.properties) {
            if (ts.isPropertyAssignment(prop)) {
              const pName = prop.name.getText(sourceFile);
              if (pName === "name" && prop.initializer) {
                if (ts.isStringLiteral(prop.initializer)) {
                  hasNameOption = prop.initializer.text.length > 0;
                } else if (
                  ts.isTemplateExpression(prop.initializer) ||
                  ts.isNoSubstitutionTemplateLiteral(prop.initializer)
                ) {
                  hasNameOption = true;
                } else {
                  const initType = checker.getTypeAtLocation(prop.initializer);
                  hasNameOption =
                    Boolean(initType.flags & ts.TypeFlags.StringLike) ||
                    checker.typeToString(initType) === "string";
                }
                if (hasNameOption) break;
              }
            } else if (ts.isShorthandPropertyAssignment(prop) && prop.name.text === "name") {
              hasNameOption = true;
              break;
            }
          }
        }
        if (!hasNameOption) {
          report(
            node,
            "UNNAMED_REACTIVE_PRIMITIVE",
            `Shared reactive primitive "${fnName}" in src/lib/ must provide { name: "..." } diagnostic attribution option for @solidjs/diagnostics.`,
          );
        }
      }
    }

    // Rule #12: Check for legacy typography props on <Text>, <Heading>, <Code>
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = node.tagName.getText(sourceFile);
      if (tagName === "Text" || tagName === "Heading" || tagName === "Code") {
        for (const attr of node.attributes.properties) {
          if (ts.isJsxAttribute(attr)) {
            const attrName = getJsxAttrName(attr);
            if (BANNED_TYPOGRAPHY_PROPS.has(attrName)) {
              report(
                attr,
                "LEGACY_TYPOGRAPHY_PROP_BANNED",
                `Legacy typography prop "${attrName}" is forbidden on <${tagName}>. Use systematic recipe variants (tone="...", weight="...", leading="...", tracking="...").`,
              );
            }
          }
        }
      }
    }

    // Rule #13: Check for component parameter destructuring: function Comp({ prop }) is banned
    if (ts.isFunctionDeclaration(node)) {
      const fnName = node.name?.text;
      if (fnName && isPascalCase(fnName)) {
        for (const param of node.parameters) {
          if (ts.isObjectBindingPattern(param.name)) {
            report(
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
            report(
              param,
              "COMPONENT_PARAM_DESTRUCTURE_BANNED",
              `Component parameter destructuring in "${node.name.text}" is strictly forbidden. Solid 2.0 tracks reactivity through property access; always use \`props.property\`.`,
            );
          }
        }
      }
    }

    // Rule #14: Architecture boundary: In src/routes/, forbid direct fetch() or DbConnection instantiation
    if (isRoute) {
      if (ts.isCallExpression(node)) {
        const callTarget = node.expression.getText(sourceFile);
        if (
          callTarget === "fetch" ||
          callTarget === "window.fetch" ||
          callTarget === "globalThis.fetch"
        ) {
          report(
            node,
            "UNSCOPED_IO_CALL_BANNED",
            "Direct fetch() call in routes is forbidden. All external I/O must be encapsulated in src/lib/ or Context Actions.",
          );
        }
      } else if (ts.isNewExpression(node)) {
        const newTarget = node.expression.getText(sourceFile);
        if (newTarget.includes("DbConnection") || newTarget.includes("DbConnectionBuilder")) {
          report(
            node,
            "UNSCOPED_IO_CALL_BANNED",
            "Direct DbConnection instantiation in routes is forbidden. SpacetimeDB connections must be managed via src/lib/ or Context Providers.",
          );
        }
      }
    }

    // Rule #15: Forbid legacy single-argument createEffect(fn) to prevent hitting the Ark UI 5.x compatibility bridge
    if (ts.isCallExpression(node)) {
      const fnName = node.expression.getText(sourceFile);
      if (fnName === "createEffect") {
        const secondArg = node.arguments[1];
        const isOptionsOnlySecondArg =
          secondArg !== undefined &&
          ts.isObjectLiteralExpression(secondArg) &&
          !secondArg.properties.some((prop) => {
            if (ts.isPropertyAssignment(prop) || ts.isMethodDeclaration(prop)) {
              return prop.name.getText(sourceFile).replace(/['"]/g, "") === "effect";
            }
            if (ts.isShorthandPropertyAssignment(prop)) {
              return prop.name.text === "effect";
            }
            return false;
          });
        if (node.arguments.length < 2 || isOptionsOnlySecondArg) {
          report(
            node,
            "SINGLE_ARG_CREATE_EFFECT_BANNED",
            "Single-argument createEffect(fn) is forbidden in application code to avoid triggering the temporary Ark UI 5.x compatibility bridge. Always use Solid 2.0 split createEffect(compute, apply) or onSettled().",
          );
        }
      }
    }

    ts.forEachChild(node, visitor);
  }

  visitor(sourceFile);
}

for (const filePath of srcFilePaths) {
  const sourceFile = program.getSourceFile(filePath);
  if (sourceFile) {
    scanSourceFile(sourceFile);
  }
}

for (const filePath of [...serverFilePaths, ...moduleFilePaths]) {
  const sourceFile = program.getSourceFile(filePath);
  if (sourceFile) {
    scanBackendFile(sourceFile);
  }
}

// Enforce rule #7 repetition threshold: >= 3 identical one-off css() calls must be extracted
for (const [, occurrences] of adhocCssOccurrences) {
  if (occurrences.length > MAX_IDENTICAL_ADHOC_CSS_COUNT) {
    for (const { sourceFile, node } of occurrences) {
      addViolation(
        sourceFile,
        relative(ROOT_DIR, sourceFile.fileName),
        node,
        "REPEATED_ADHOC_CSS_BANNED",
        `Identical one-off css() block repeated ${occurrences.length} times (>= 3). Extract it into a reusable cva() or panda.config.ts recipe.`,
      );
    }
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
    "✅ [ARCHITECTURAL RAILS VERIFIED] All 16 architectural invariants strictly verified across src/, server/, and spacetimedb/ via TypeScript AST & TypeChecker.\n",
  );
  process.exit(0);
}
