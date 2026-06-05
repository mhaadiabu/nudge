import { cn } from "heroui-native";
import { Pressable, Text, View } from "react-native";

import { useAppTheme } from "@/contexts/app-theme-context";

type Option = { value: "light" | "dark"; label: string };

const OPTIONS: Option[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function ThemeSwitcher() {
  const { isLight, setTheme } = useAppTheme();

  return (
    <View
      className="h-11 flex-row rounded-xl bg-surface-tertiary p-1"
      style={{ borderCurve: "continuous" }}
    >
      {OPTIONS.map((option) => {
        const active = (isLight ? "light" : "dark") === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${option.label} theme`}
            onPress={() => {
              setTheme(option.value);
            }}
            className={cn(
              "flex-1 items-center justify-center rounded-lg",
              active ? "bg-surface" : "bg-transparent",
            )}
            style={{ borderCurve: "continuous" }}
          >
            <Text
              className={cn("text-sm font-semibold", active ? "text-foreground" : "text-muted")}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
