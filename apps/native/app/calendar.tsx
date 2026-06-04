import { api } from "@nudge/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Text, View } from "react-native";

import { LoadingScreen } from "@/components/loading-screen";
import { ScreenShell } from "@/components/screen-shell";
import { SectionCard } from "@/components/section-card";
import { formatDayLabel, formatShortDate } from "@/lib/format";

export default function CalendarScreen() {
  const items = useQuery(api.portal.listCalendarFeed);

  if (!items) {
    return <LoadingScreen message="Building your calendar feed..." />;
  }

  return (
    <ScreenShell title="Calendar">
      <View className="gap-10">
        {items.map((item) => (
          <SectionCard
            key={`${item.kind}-${item.id}`}
            title={item.title}
            description={`${formatDayLabel(item.startsAt)} • ${item.kind}`}
          >
            <Text className="text-sm leading-5 text-foreground">{item.detail}</Text>
            <Text className="text-sm text-muted">
              {formatShortDate(item.startsAt)}
              {item.endsAt !== item.startsAt ? ` - ${formatShortDate(item.endsAt)}` : ""}
            </Text>
          </SectionCard>
        ))}
      </View>
    </ScreenShell>
  );
}
