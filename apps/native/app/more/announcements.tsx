import { api } from "@nudge/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Button } from "heroui-native";
import { Linking, Text, View } from "react-native";

import { LoadingScreen } from "@/components/loading-screen";
import { ScreenShell } from "@/components/screen-shell";
import { SectionCard } from "@/components/section-card";
import { formatShortDate } from "@/lib/format";

export default function AnnouncementsScreen() {
  const announcements = useQuery(api.portal.listAnnouncements);

  if (!announcements) {
    return <LoadingScreen message="Loading the latest announcements..." />;
  }

  return (
    <ScreenShell title="Announcements">
      <View className="gap-10">
        {announcements.map((announcement) => (
          <SectionCard
            key={announcement._id}
            title={announcement.title}
            description={`${announcement.course?.code ?? "Faculty"} • ${announcement.category}`}
          >
            <Text className="text-sm leading-5 text-foreground">{announcement.body}</Text>
            <Text className="text-sm text-muted">
              Published {formatShortDate(announcement.publishedAt)}
            </Text>
            {announcement.linkUrl ? (
              <Button
                size="sm"
                variant="secondary"
                className="mt-2 self-start"
                onPress={() => {
                  void Linking.openURL(announcement.linkUrl!);
                }}
              >
                <Button.Label>Open link</Button.Label>
              </Button>
            ) : null}
          </SectionCard>
        ))}
      </View>
    </ScreenShell>
  );
}
