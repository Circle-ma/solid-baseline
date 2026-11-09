import { createRouter, defineRoute, defineRoutes } from "@solidjs/router";
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
  VStack,
} from "~/components/ui";
import { TelemetryProvider } from "~/lib";
import Overview from "~/routes/overview";
import Realtime from "~/routes/realtime";

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

export const Router = createRouter({ routes });

function NavigationBar() {
  return (
    <HStack gap="1" p="1" bg="bg.subtle" borderRadius="md" w="fit">
      <NavLink href="/">Overview & Primitives</NavLink>
      <NavLink href="/realtime">Realtime & Telemetry</NavLink>
    </HStack>
  );
}

export default function App() {
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
              {/* Header */}
              <VStack gap="3" alignItems="stretch">
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

              {/* Routed Page View inside SSR-Safe Telemetry Provider & Async Boundary */}
              <TelemetryProvider>
                <AsyncBoundary>{props.children}</AsyncBoundary>
              </TelemetryProvider>

              <Divider borderColor="border.subtle" />

              {/* Footer */}
              <HStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="3">
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
