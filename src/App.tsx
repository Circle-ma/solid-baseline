import { createRouter, defineRoute, defineRoutes } from "@solidjs/router";
import { lazy } from "solid-js";
import "./index.css";
import {
  AsyncBoundary,
  Badge,
  Box,
  Container,
  Divider,
  Heading,
  HStack,
  NavLink,
  Text,
  ThemeToggle,
  VStack,
} from "~/components/ui";
import { RpcProvider } from "~/lib/rpc-provider";
import Overview from "~/routes/overview";

const Realtime = lazy(() => import("~/routes/realtime"));

export const routes = defineRoutes([
  defineRoute({
    path: "/",
    component: Overview,
  }),
  defineRoute({
    path: "/realtime",
    component: Realtime,
  }),
]);

export const router = createRouter({ routes });

function NavigationBar() {
  return (
    <HStack
      as="nav"
      aria-label="Primary navigation"
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
      <Divider orientation="vertical" h="4" borderColor="border.subtle" />
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

              <Divider borderColor="border.subtle" />

              {/* Routed Page View inside Service-Agnostic RPC Provider & Async Boundary */}
              <Box as="main">
                <RpcProvider>
                  <AsyncBoundary>{props.children}</AsyncBoundary>
                </RpcProvider>
              </Box>

              <Divider borderColor="border.subtle" />

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
