import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react-native";
import { cn } from "heroui-native";
import { Text, View } from "react-native";

import { Icon } from "@/components/icon";

type ListRowProps = {
  title: string;
  description?: string;
  icon: IconSvgElement;
  trailing?: React.ReactNode;
  showChevron?: boolean;
};

export function ListRow({ title, description, icon, trailing, showChevron = true }: ListRowProps) {
  return (
    <View
      className={cn(
        "flex-row items-center gap-3.5 py-3.5",
        "border-t border-separator first:border-t-0",
      )}
    >
      <View
        className="h-10 w-10 items-center justify-center rounded-xl bg-accent-soft"
        style={{ borderCurve: "continuous" }}
      >
        <Icon icon={icon} size={18} strokeWidth={2} className="text-accent-soft-foreground" />
      </View>
      <View className="flex-1 gap-0.5">
        <Text
          className="text-base font-medium text-foreground"
          style={{ includeFontPadding: false }}
        >
          {title}
        </Text>
        {description ? (
          <Text
            className="text-sm leading-5 text-muted"
            numberOfLines={2}
            style={{ includeFontPadding: false }}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {trailing}
      {showChevron ? (
        <Icon icon={ArrowRight01Icon} size={16} strokeWidth={2} className="text-muted" />
      ) : null}
    </View>
  );
}
