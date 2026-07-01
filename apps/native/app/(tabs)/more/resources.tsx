import { api } from "@nudge/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { Button, useToast } from "heroui-native";
import { ArrowRight01Icon, Folder01Icon, SearchRemoveIcon } from "@hugeicons/core-free-icons";
import { Alert, Linking, Pressable, Text, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icon";
import { LoadingScreen } from "@/components/loading-screen";
import { ScreenShell } from "@/components/screen-shell";
import { SectionCard } from "@/components/section-card";
import { formatFileSize, formatShortDate } from "@/lib/format";
import { useViewer } from "@/lib/use-viewer";

export default function ResourcesScreen() {
  const { toast } = useToast();
  const { isManager } = useViewer();
  const resources = useQuery(api.portal.listResources);
  const deleteResource = useMutation(api.portal.deleteResource);

  if (!resources) {
    return <LoadingScreen message="Fetching course materials..." />;
  }

  function confirmDelete(id: string, title: string) {
    Alert.alert("Delete resource", `Permanently remove "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await deleteResource({ resourceId: id as never });
              toast.show({ variant: "success", label: "Resource deleted" });
            } catch (error) {
              const message = error instanceof Error ? error.message : "Could not delete.";
              toast.show({ variant: "danger", label: message });
            }
          })();
        },
      },
    ]);
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
          trailing={
            isManager ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete resource"
                hitSlop={6}
                onPress={() => confirmDelete(resource._id, resource.title)}
                className="rounded-md p-1 active:opacity-60"
              >
                <Icon icon={SearchRemoveIcon} size={16} strokeWidth={2} className="text-danger" />
              </Pressable>
            ) : null
          }
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
              {resource.fileSize ? (
                <Text className="text-xs text-muted">{formatFileSize(resource.fileSize)}</Text>
              ) : null}
              <Text className="text-xs text-muted">
                Added {formatShortDate(resource.createdAt)}
              </Text>
              <Button
                size="sm"
                className="mt-1 self-start"
                isDisabled={!resource.url}
                onPress={() => {
                  if (resource.url) {
                    void Linking.openURL(resource.url);
                  }
                }}
              >
                <Button.Label>{resource.storageId ? "Open file" : "Open resource"}</Button.Label>
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
