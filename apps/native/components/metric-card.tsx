import { Text, View } from "react-native";

type MetricCardProps = {
  label: string;
  value: string;
  detail?: string;
};

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <View className="min-w-[120px] flex-1 gap-1">
      <Text className="text-xs uppercase tracking-wider text-muted">{label}</Text>
      <Text className="text-2xl font-semibold tracking-tight text-foreground">{value}</Text>
      {detail ? <Text className="text-xs text-muted">{detail}</Text> : null}
    </View>
  );
}
