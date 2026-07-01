import { api } from "@nudge/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Calendar01Icon, Calendar03Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import { Text, View } from "react-native";

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
  title: string;
  detail: string;
  kind: string;
  startsAt: number;
  endsAt: number;
};

function itemTone(kind: string): IconTone {
  if (kind === "event") return "accent";
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
  const { config, isLoading: isViewerLoading, isMissing } = useViewer();
  const items = useQuery(api.portal.listCalendarFeed, isViewerLoading || isMissing ? "skip" : {});

  if (isViewerLoading || isMissing || !items) {
    return <LoadingScreen message="Building your calendar feed..." />;
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
          <View className="gap-3.5">
            {group.items.map((item, index) => {
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
                  className={`flex-row items-start gap-3 ${
                    index > 0 ? "pt-3.5 border-t border-separator" : ""
                  }`}
                >
                  <View
                    className={`h-9 w-9 items-center justify-center rounded-xl ${toneBg}`}
                    style={{ borderCurve: "continuous" }}
                  >
                    <Icon icon={Clock01Icon} size={16} strokeWidth={2} className={toneFg} />
                  </View>
                  <View className="flex-1 gap-1">
                    <View className="flex-row items-start justify-between gap-2">
                      <Text className="flex-1 text-sm font-semibold text-foreground">
                        {item.title}
                      </Text>
                      <StatusPill label={item.kind} tone={tone} />
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
