import { api } from "@nudge/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";
import {
  Calendar01Icon,
  Calendar03Icon,
  Clock01Icon,
  SearchRemoveIcon,
} from "@hugeicons/core-free-icons";
import { Alert, Pressable, Text, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icon";
import { LoadingScreen } from "@/components/loading-screen";
import { ScreenShell } from "@/components/screen-shell";
import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";
import { formatDayLabel, formatShortDate } from "@/lib/format";
import { useViewer } from "@/lib/use-viewer";

type IconTone = "accent" | "info" | "success" | "warning";

type CalendarItem = {
  id: string;
  assignmentId?: string;
  title: string;
  detail: string;
  kind: "timetable" | "assignment";
  startsAt: number;
  endsAt: number;
};

function itemTone(kind: string): IconTone {
  if (kind === "event" || kind === "deadline") return "accent";
  if (kind === "assignment") return "warning";
  return "info";
}

function groupByDay(items: CalendarItem[]) {
  const groups = new Map<string, CalendarItem[]>();
  for (const item of items) {
    const date = new Date(item.startsAt);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const existing = groups.get(key);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(key, [item]);
    }
  }
  return Array.from(groups.entries()).map(([key, group]) => ({
    key,
    label: formatDayLabel(group[0].startsAt),
    items: group,
  }));
}

export default function CalendarScreen() {
  const { toast } = useToast();
  const { config, isLoading: isViewerLoading, isMissing, isManager } = useViewer();
  const items = useQuery(api.portal.listCalendarFeed, isViewerLoading || isMissing ? "skip" : {});
  const deleteTimetableEvent = useMutation(api.portal.deleteTimetableEvent);
  const deleteAssignment = useMutation(api.assignments.deleteForCourse);

  if (isViewerLoading || isMissing || !items) {
    return <LoadingScreen message="Building your calendar feed..." />;
  }

  function confirmDelete(item: CalendarItem) {
    const isEvent = item.kind === "timetable";
    Alert.alert(
      `Delete ${isEvent ? "event" : "assignment"}`,
      `Permanently remove "${item.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                if (isEvent) {
                  await deleteTimetableEvent({ eventId: item.id as never });
                } else if (item.assignmentId) {
                  await deleteAssignment({ assignmentId: item.assignmentId as never });
                }
                toast.show({ variant: "success", label: "Removed" });
              } catch (error) {
                const message = error instanceof Error ? error.message : "Could not delete.";
                toast.show({ variant: "danger", label: message });
              }
            })();
          },
        },
      ],
    );
  }

  if (items.length === 0) {
    return (
      <ScreenShell>
        <SectionCard title="Calendar" icon={Calendar01Icon} flat>
          <EmptyState
            icon={Calendar03Icon}
            title="Your week is clear"
            message={
              config.isManager
                ? "When you publish events, deadlines, or timetable changes, they'll show up here."
                : "No classes, deadlines, or events scheduled. We'll surface them here as soon as they appear on your timetable."
            }
            tone="info"
          />
        </SectionCard>
      </ScreenShell>
    );
  }

  const sorted = [...items].sort((a, b) => a.startsAt - b.startsAt);
  const groups = groupByDay(sorted);

  return (
    <ScreenShell>
      {groups.map((group) => (
        <SectionCard key={group.key} title={group.label} icon={Calendar01Icon} flat>
          <View className="gap-3.5 divide-y divide-separator">
            {group.items.map((item) => {
              const tone = itemTone(item.kind);
              const toneBg = {
                accent: "bg-accent-soft",
                info: "bg-info-soft",
                success: "bg-success-soft",
                warning: "bg-warning-soft",
              }[tone];
              const toneFg = {
                accent: "text-accent-soft-foreground",
                info: "text-info-soft-foreground",
                success: "text-success-soft-foreground",
                warning: "text-warning-soft-foreground",
              }[tone];
              return (
                <View
                  key={`${item.kind}-${item.id}`}
                  className="flex-row items-start gap-3 pt-3.5 first:pt-0"
                >
                  <View
                    className={`h-9 w-9 items-center justify-center rounded-2xl ${toneBg}`}
                    style={{ borderCurve: "continuous" }}
                  >
                    <Icon icon={Clock01Icon} size={16} strokeWidth={2} className={toneFg} />
                  </View>
                  <View className="flex-1 gap-1">
                    <View className="flex-row items-start justify-between gap-2">
                      <Text className="flex-1 text-sm font-semibold text-foreground">
                        {item.title}
                      </Text>
                      <View className="flex-row items-center gap-1.5">
                        <StatusPill label={item.kind} tone={tone} />
                        {isManager ? (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Delete ${item.title}`}
                            hitSlop={6}
                            onPress={() => confirmDelete(item)}
                            className="rounded-md p-1 active:opacity-60"
                          >
                            <Icon
                              icon={SearchRemoveIcon}
                              size={16}
                              strokeWidth={2}
                              className="text-danger"
                            />
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                    <Text className="text-sm leading-5 text-foreground" numberOfLines={2}>
                      {item.detail}
                    </Text>
                    <Text className="text-xs text-muted">
                      {formatShortDate(item.startsAt)}
                      {item.endsAt !== item.startsAt ? ` – ${formatShortDate(item.endsAt)}` : ""}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </SectionCard>
      ))}
    </ScreenShell>
  );
}
