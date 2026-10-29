import { createRouter, defineRoute, defineRoutes, useLocation } from "@solidjs/router";
import { css } from "styled-system/css";
import "./index.css";
import { Badge, Box, Container, Divider, Heading, HStack, Text, VStack } from "~/components/ui";
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

const navLinkClass = css({
  textDecoration: "none",
  color: "inherit",
  cursor: "pointer",
  display: "inline-flex",
});

function NavigationBar() {
  const location = useLocation();

  return (
    <HStack gap="1" p="1" bg="bg.subtle" borderRadius="md" w="fit">
      <a href="/" class={navLinkClass}>
        <Box
          px="3"
          py="1.5"
          borderRadius="sm"
          bg={location.pathname === "/" ? "bg.default" : "transparent"}
          color={location.pathname === "/" ? "fg.default" : "fg.muted"}
        >
          <Text size="xs" fontWeight={location.pathname === "/" ? "semibold" : "normal"}>
            Overview & Primitives
          </Text>
        </Box>
      </a>
      <a href="/realtime" class={navLinkClass}>
        <Box
          px="3"
          py="1.5"
          borderRadius="sm"
          bg={location.pathname === "/realtime" ? "bg.default" : "transparent"}
          color={location.pathname === "/realtime" ? "fg.default" : "fg.muted"}
        >
          <Text size="xs" fontWeight={location.pathname === "/realtime" ? "semibold" : "normal"}>
            Realtime & Telemetry
          </Text>
        </Box>
      </a>
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
                    <Heading as="h1" size="2xl" letterSpacing="tight">
                      Solid 2.0 Baseline Architecture
                    </Heading>
                    <Badge variant="subtle">2026 Core</Badge>
                  </HStack>
                  <NavigationBar />
                </HStack>
                <Text size="sm" color="fg.muted" lineHeight="relaxed">
                  High-performance, type-safe SPA starter engineered with Bun, Vite, Solid 2.0,
                  Solid Router, Ark UI, Panda CSS, SpacetimeDB, ConnectRPC, Oxlint, and Biome.
                </Text>
              </VStack>

              <Divider borderColor="border.subtle" />

              {/* Routed Page View */}
              {props.children}

              <Divider borderColor="border.subtle" />

              {/* Footer */}
              <HStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="3">
                <Text size="xs" color="fg.muted">
                  Systematic UI Primitives · Solid Router 2.0 · Container Layout · Schema SSOT
                </Text>
                <Text size="xs" color="fg.muted">
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
