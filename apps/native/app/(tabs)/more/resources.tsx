import { api } from "@nudge/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Button } from "heroui-native";
import { ArrowRight01Icon, Folder01Icon } from "@hugeicons/core-free-icons";
import { Linking, Text, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icon";
import { LoadingScreen } from "@/components/loading-screen";
import { ScreenShell } from "@/components/screen-shell";
import { SectionCard } from "@/components/section-card";
import { formatShortDate } from "@/lib/format";

export default function ResourcesScreen() {
  const resources = useQuery(api.portal.listResources);

  if (!resources) {
    return <LoadingScreen message="Fetching course materials..." />;
  }

  if (resources.length === 0) {
    return (
      <ScreenShell>
        <SectionCard title="Library" icon={Folder01Icon} flat>
          <EmptyState
            icon={Folder01Icon}
            title="No materials yet"
            message="When lecturers share notes, templates, or recordings, they'll appear here for quick access."
            tone="info"
          />
        </SectionCard>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      {resources.map((resource) => (
        <SectionCard
          key={resource._id}
          title={resource.title}
          description={`${resource.course?.code ?? "General"} · ${resource.kind}`}
          icon={Folder01Icon}
          flat
        >
          <View className="flex-row items-start gap-3">
            <View
              className="h-10 w-10 items-center justify-center rounded-xl bg-accent-soft"
              style={{ borderCurve: "continuous" }}
            >
              <Icon
                icon={Folder01Icon}
                size={18}
                strokeWidth={2}
                className="text-accent-soft-foreground"
              />
            </View>
            <View className="flex-1 gap-1.5">
              {resource.description ? (
                <Text className="text-sm leading-5 text-foreground" numberOfLines={3}>
                  {resource.description}
                </Text>
              ) : null}
              <Text className="text-xs text-muted">
                Added {formatShortDate(resource.createdAt)}
              </Text>
              <Button
                size="sm"
                className="mt-1 self-start"
                onPress={() => {
                  void Linking.openURL(resource.url);
                }}
              >
                <Button.Label>Open resource</Button.Label>
                <Icon
                  icon={ArrowRight01Icon}
                  size={14}
                  strokeWidth={2.25}
                  className="text-primary-foreground"
                />
              </Button>
            </View>
          </View>
        </SectionCard>
      ))}
    </ScreenShell>
  );
}
