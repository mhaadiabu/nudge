import type { IconSvgElement } from "@hugeicons/react-native";
import { Text, View } from "react-native";

import { Icon } from "@/components/icon";

type EmptyStateProps = {
  icon: IconSvgElement;
  title: string;
  message: string;
  tone?: "accent" | "info" | "success" | "warning";
  action?: React.ReactNode;
};

const toneStyles = {
  accent: "bg-accent-soft text-accent-soft-foreground",
  info: "bg-info-soft text-info-soft-foreground",
  success: "bg-success-soft text-success-soft-foreground",
  warning: "bg-warning-soft text-warning-soft-foreground",
} as const;

export function EmptyState({ icon, title, message, tone = "accent", action }: EmptyStateProps) {
  return (
    <View className="items-center gap-3 px-2 py-8">
      <View
        className={`h-14 w-14 items-center justify-center rounded-xl ${toneStyles[tone]}`}
        style={{ borderCurve: "continuous" }}
      >
        <Icon icon={icon} size={24} strokeWidth={1.75} />
      </View>
      <View className="items-center gap-1">
        <Text
          className="text-base font-semibold text-foreground"
          style={{ includeFontPadding: false }}
        >
          {title}
        </Text>
        <Text
          className="max-w-[260px] text-center text-sm leading-5 text-muted"
          style={{ includeFontPadding: false }}
        >
          {message}
        </Text>
      </View>
      {action}
    </View>
  );
}
