import { Surface } from "heroui-native";
import { Text, View } from "react-native";

type MetricCardProps = {
  label: string;
  value: string;
  detail?: string;
};

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <Surface variant="secondary" className="min-w-[148px] flex-1 rounded-3xl p-4">
      <View className="gap-1">
        <Text className="text-xs uppercase tracking-wide text-muted">{label}</Text>
        <Text className="text-2xl font-semibold text-foreground">{value}</Text>
        {detail ? <Text className="text-xs text-muted">{detail}</Text> : null}
      </View>
    </Surface>
  );
}
