import { type PropsWithChildren } from "react";
import { Text, View } from "react-native";
import { Surface } from "heroui-native";

type SectionCardProps = PropsWithChildren<{
  title: string;
  description?: string;
}>;

export function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <Surface variant="secondary" className="rounded-3xl p-4">
      <View className="gap-3">
        <View className="gap-1">
          <Text className="text-base font-semibold text-foreground">{title}</Text>
          {description ? <Text className="text-sm text-muted">{description}</Text> : null}
        </View>
        {children}
      </View>
    </Surface>
  );
}
