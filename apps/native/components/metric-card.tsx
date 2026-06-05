import { Surface } from "heroui-native";
import type { IconSvgElement } from "@hugeicons/react-native";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";

import { Icon } from "@/components/icon";
import { shadows } from "@/lib/theme";

export type Metric = {
  label: string;
  value: string;
  detail?: string;
  icon?: IconSvgElement;
  /**
   * Optional emphasis state. `success` and `warning` colour the value
   * semantically, never defaulting to the brand accent — so a `0%` never
   * looks like an error.
   */
  emphasis?: "default" | "success" | "warning" | "accent";
};

type MetricGridProps = {
  metrics: readonly Metric[];
};

const emphasisColor: Record<NonNullable<Metric["emphasis"]>, string> = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  accent: "text-accent",
};

export function MetricGrid({ metrics }: MetricGridProps) {
  return (
    <Surface variant="secondary" style={[styles.surface, shadows.soft as ViewStyle]}>
      <View className="flex-row flex-wrap">
        {metrics.map((metric, index) => {
          const emphasis = metric.emphasis ?? "default";
          return (
            <View
              key={metric.label}
              style={[
                styles.cell,
                index % 2 === 0 ? styles.cellLeft : styles.cellRight,
                index >= 2 ? styles.cellBottom : null,
              ]}
            >
              <View className="flex-row items-center gap-1.5">
                {metric.icon ? (
                  <Icon icon={metric.icon} size={13} strokeWidth={2.5} className="text-muted" />
                ) : null}
                <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {metric.label}
                </Text>
              </View>
              <Text
                className={`text-[34px] font-bold tracking-tight ${emphasisColor[emphasis]}`}
                style={styles.value}
                numberOfLines={1}
              >
                {metric.value}
              </Text>
              {metric.detail ? <Text className="text-xs text-muted">{metric.detail}</Text> : null}
            </View>
          );
        })}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  surface: {
    borderCurve: "continuous",
  },
  cell: {
    width: "50%",
    paddingVertical: 18,
    paddingHorizontal: 4,
    gap: 6,
  },
  cellLeft: {
    paddingLeft: 18,
  },
  cellRight: {
    paddingRight: 18,
  },
  cellBottom: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(127,127,127,0.22)",
    paddingTop: 18,
  },
  value: {
    fontVariant: ["tabular-nums"],
  },
});
