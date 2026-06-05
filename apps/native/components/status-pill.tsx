import { cn } from "heroui-native";
import { Text, View, type ViewStyle } from "react-native";

type Tone = "accent" | "success" | "warning" | "info" | "muted";

const toneStyles: Record<Tone, { bg: string; text: string }> = {
  accent: { bg: "bg-accent-soft", text: "text-accent-soft-foreground" },
  success: { bg: "bg-success-soft", text: "text-success-soft-foreground" },
  warning: { bg: "bg-warning-soft", text: "text-warning-soft-foreground" },
  info: { bg: "bg-info-soft", text: "text-info-soft-foreground" },
  muted: { bg: "bg-surface-tertiary", text: "text-muted" },
};

type StatusPillProps = {
  label: string;
  tone?: Tone;
  style?: ViewStyle;
};

export function StatusPill({ label, tone = "muted", style }: StatusPillProps) {
  const styles = toneStyles[tone];
  return (
    <View
      className={cn("h-6 flex-row items-center rounded-md px-2.5", styles.bg)}
      style={[{ borderCurve: "continuous" }, style]}
    >
      <Text className={cn("text-[11px] font-semibold uppercase tracking-wider", styles.text)}>
        {label}
      </Text>
    </View>
  );
}

type StatusDotProps = {
  tone?: Tone;
  size?: number;
};

export function StatusDot({ tone = "muted", size = 8 }: StatusDotProps) {
  const styles = toneStyles[tone];
  return <View className={cn("rounded-full", styles.bg)} style={{ width: size, height: size }} />;
}
