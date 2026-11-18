import {
  createRouter,
  defineRoute,
  defineRoutes,
  intentPreload,
  pendingLinks,
} from "@solidjs/router";
import { lazy } from "solid-js";
import { css } from "styled-system/css";
import "./index.css";
import {
  AsyncBoundary,
  Badge,
  Box,
  Card,
  Container,
  Divider,
  Heading,
  HStack,
  Link,
  NavLink,
  Text,
  ThemeToggle,
  VStack,
} from "~/components/ui";
import { RpcProvider } from "~/lib/rpc-provider";
import Overview from "~/routes/overview";

const Realtime = lazy(() => import("~/routes/realtime"));

const skipLinkClass = css({
  position: "fixed",
  top: "3",
  left: "3",
  zIndex: "max",
  px: "4",
  py: "2",
  bg: "accent.default",
  color: "accent.fg",
  borderRadius: "l2",
  textStyle: "sm",
  fontWeight: "semibold",
  transform: "translateY(-200%)",
  _focusVisible: {
    transform: "translateY(0)",
    color: "accent.fg",
  },
});

const mainFocusClass = css({
  outline: "none",
});

function NotFound() {
  return (
    <Card.Root variant="elevated">
      <Card.Header>
        <HStack gap="2" alignItems="center">
          <Badge variant="subtle" intent="warning">
            404
          </Badge>
          <Card.Title>Page Not Found</Card.Title>
        </HStack>
        <Card.Description>
          The requested route does not exist in this application shell.
        </Card.Description>
      </Card.Header>
      <Card.Body>
        <Text size="sm" tone="muted">
          Check the URL path or return to the overview workspace to continue exploring primitives
          and realtime telemetry.
        </Text>
      </Card.Body>
      <Card.Footer>
        <NavLink href={router.paths()} end>
          Return to Overview
        </NavLink>
      </Card.Footer>
    </Card.Root>
  );
}

export const routes = defineRoutes([
  defineRoute({
    path: "/",
    component: Overview,
  }),
  defineRoute({
    path: "/realtime",
    component: Realtime,
  }),
  defineRoute({
    path: "*",
    component: NotFound,
  }),
]);

export const router = createRouter({
  routes,
  preloadLinks: intentPreload(),
  links: pendingLinks,
});

function NavigationBar() {
  return (
    <HStack
      as="nav"
      aria-label="Primary"
      gap="2"
      alignItems="center"
      p="1"
      bg="bg.subtle"
      borderRadius="l2"
      borderWidth="1px"
      borderColor="border.subtle"
    >
      <HStack gap="1" alignItems="center">
        <NavLink href={router.paths()} end>
          Overview & Primitives
        </NavLink>
        <NavLink href={router.paths.realtime()}>Realtime & Telemetry</NavLink>
      </HStack>
      <Divider orientation="vertical" h="4" color="border.subtle" />
      <ThemeToggle />
    </HStack>
  );
}

export default function App() {
  const Router = router;
  return (
    <Router>
      {(props) => (
        <Box
          minH="100vh"
          bg="bg.canvas"
          color="fg.default"
          py={{ base: "6", md: "12" }}
          px={{ base: "4", sm: "6", md: "12" }}
        >
          <Link href="#main-content" class={skipLinkClass}>
            Skip to main content
          </Link>
          <Container maxW="4xl" p="0">
            <VStack gap="8" alignItems="stretch">
              {/* Semantic Header */}
              <VStack as="header" gap="3" alignItems="stretch">
                <HStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="4">
                  <HStack gap="3" alignItems="center" flexWrap="wrap">
                    <Heading as="h1" size="2xl" tracking="tight">
                      Solid 2.0 Baseline Architecture
                    </Heading>
                    <Badge variant="subtle">2026 Core</Badge>
                  </HStack>
                  <NavigationBar />
                </HStack>
                <Text size="sm" tone="muted" leading="relaxed">
                  High-performance, type-safe SPA starter engineered with Bun, Vite, Solid 2.0,
                  Solid Router, Ark UI, Panda CSS, SpacetimeDB, ConnectRPC, Oxlint, and Biome.
                </Text>
              </VStack>

              <Divider color="border.subtle" />

              {/* Routed Page View inside Service-Agnostic RPC Provider & Async Boundary */}
              <Box as="main" id="main-content" tabindex={-1} class={mainFocusClass}>
                <RpcProvider>
                  <AsyncBoundary>{props.children}</AsyncBoundary>
                </RpcProvider>
              </Box>

              <Divider color="border.subtle" />

              {/* Semantic Footer */}
              <HStack
                as="footer"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap="3"
              >
                <Text size="xs" tone="muted">
                  Systematic UI Primitives · Solid Router 2.0 · Container Layout · Schema SSOT
                </Text>
                <Text size="xs" tone="muted">
                  Verified with Oxlint & Biome
                </Text>
              </HStack>
            </VStack>
          </Container>
        </Box>
      )}
    </Router>
  );
}
