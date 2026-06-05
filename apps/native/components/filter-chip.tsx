import { Pressable } from "react-native";
import { Text, View } from "react-native";

import { cn } from "heroui-native";

type FilterChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

export function FilterChip({ label, active, onPress }: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={cn(
        "h-9 flex-row items-center justify-center rounded-xl px-3.5",
        active ? "bg-accent-soft" : "bg-surface-tertiary",
      )}
      style={{ borderCurve: "continuous" }}
    >
      <Text
        className={cn("text-sm font-medium", active ? "text-accent-soft-foreground" : "text-muted")}
      >
        {label}
      </Text>
      <View
        className={cn(
          "ml-1.5 h-1.5 w-1.5 rounded-full",
          active ? "bg-accent-soft-foreground" : "bg-transparent",
        )}
      />
    </Pressable>
  );
}
