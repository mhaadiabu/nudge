import { api } from "@nudge/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { Button, useToast } from "heroui-native";
import { ArrowRight01Icon, Megaphone01Icon, SearchRemoveIcon } from "@hugeicons/core-free-icons";
import { Alert, Linking, Pressable, Text, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icon";
import { LoadingScreen } from "@/components/loading-screen";
import { ScreenShell } from "@/components/screen-shell";
import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";
import { formatShortDate } from "@/lib/format";
import { useViewer } from "@/lib/use-viewer";

export default function AnnouncementsScreen() {
  const { toast } = useToast();
  const { isManager } = useViewer();
  const announcements = useQuery(api.portal.listAnnouncements);
  const deleteAnnouncement = useMutation(api.portal.deleteAnnouncement);

  if (!announcements) {
    return <LoadingScreen message="Loading the latest announcements..." />;
  }

  function confirmDelete(id: string, title: string) {
    Alert.alert("Delete announcement", `Permanently remove "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await deleteAnnouncement({ announcementId: id as never });
              toast.show({ variant: "success", label: "Announcement deleted" });
            } catch (error) {
              const message = error instanceof Error ? error.message : "Could not delete.";
              toast.show({ variant: "danger", label: message });
            }
          })();
        },
      },
    ]);
  }

  if (announcements.length === 0) {
    return (
      <ScreenShell>
        <SectionCard title="Announcements" icon={Megaphone01Icon} flat>
          <EmptyState
            icon={Megaphone01Icon}
            title="All quiet for now"
            message="When something important is published, you'll find it here first."
            tone="info"
          />
        </SectionCard>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      {announcements.map((announcement) => (
        <SectionCard
          key={announcement._id}
          title={announcement.title}
          description={`${announcement.course?.code ?? "Faculty"} · Published ${formatShortDate(announcement.publishedAt)}`}
          icon={Megaphone01Icon}
          flat
          trailing={
            <View className="flex-row items-center gap-1.5">
              <StatusPill label={announcement.category} tone="info" />
              {isManager ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete announcement"
                  hitSlop={6}
                  onPress={() => confirmDelete(announcement._id, announcement.title)}
                  className="rounded-md p-1 active:opacity-60"
                >
                  <Icon icon={SearchRemoveIcon} size={16} strokeWidth={2} className="text-danger" />
                </Pressable>
              ) : null}
            </View>
          }
        >
          <View className="flex-row items-start gap-3">
            <View
              className="h-10 w-10 items-center justify-center rounded-xl bg-accent-soft"
              style={{ borderCurve: "continuous" }}
            >
              <Icon
                icon={Megaphone01Icon}
                size={18}
                strokeWidth={2}
                className="text-accent-soft-foreground"
              />
            </View>
            <View className="flex-1 gap-2">
              <Text className="text-sm leading-5 text-foreground">{announcement.body}</Text>
              {announcement.linkUrl ? (
                <Button
                  size="sm"
                  variant="tertiary"
                  className="self-start"
                  onPress={() => {
                    void Linking.openURL(announcement.linkUrl!);
                  }}
                >
                  <Button.Label>Open link</Button.Label>
                  <Icon
                    icon={ArrowRight01Icon}
                    size={14}
                    strokeWidth={2.25}
                    className="text-foreground"
                  />
                </Button>
              ) : null}
            </View>
          </View>
        </SectionCard>
      ))}
    </ScreenShell>
  );
}
