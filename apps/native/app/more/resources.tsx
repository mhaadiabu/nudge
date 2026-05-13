import { api } from "@nudge/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Button } from "heroui-native";
import { Linking, Text, View } from "react-native";

import { LoadingScreen } from "@/components/loading-screen";
import { ScreenShell } from "@/components/screen-shell";
import { SectionCard } from "@/components/section-card";
import { formatShortDate } from "@/lib/format";

export default function ResourcesScreen() {
  const resources = useQuery(api.portal.listResources);

  if (!resources) {
    return <LoadingScreen message="Fetching course materials..." />;
  }

  return (
    <ScreenShell title="Resources">
      <View className="gap-3">
        {resources.map((resource) => (
          <SectionCard
            key={resource._id}
            title={resource.title}
            description={`${resource.course?.code ?? "General"} • ${resource.kind}`}
          >
            {resource.description ? (
              <Text className="text-sm text-foreground">{resource.description}</Text>
            ) : null}
            <Text className="text-sm text-muted">Added {formatShortDate(resource.createdAt)}</Text>
            <Button
              size="sm"
              className="self-start"
              onPress={() => {
                void Linking.openURL(resource.url);
              }}
            >
              <Button.Label>Open resource</Button.Label>
            </Button>
          </SectionCard>
        ))}
      </View>
    </ScreenShell>
  );
}
