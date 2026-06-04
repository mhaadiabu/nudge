import { type PropsWithChildren } from "react";
import { Text, View } from "react-native";

type SectionCardProps = PropsWithChildren<{
  title: string;
  description?: string;
}>;

export function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <View className="gap-5">
      <View className="gap-1">
        <Text className="text-xs font-medium uppercase tracking-wider text-muted">{title}</Text>
        {description ? <Text className="text-sm text-muted">{description}</Text> : null}
      </View>
      {children}
    </View>
  );
}
