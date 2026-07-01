import { Text, View } from "react-native";

import { NaviiAvatar } from "@/components/navii-avatar";

type AvatarSize = "sm" | "md" | "lg" | number;

const PRESET_SIZES: Record<"sm" | "md" | "lg", number> = {
  sm: 32,
  md: 40,
  lg: 48,
};

function getSeed(name?: string | null, email?: string | null): string {
  const source = (name && name.trim()) || (email && email.split("@")[0]) || "guest";
  return source;
}

function getInitials(name?: string | null, email?: string | null) {
  const source = (name && name.trim()) || (email && email.split("@")[0]) || "";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function resolveSize(size: AvatarSize | undefined): number {
  if (typeof size === "number") {
    return size;
  }
  return PRESET_SIZES[size ?? "md"];
}

type AvatarProps = {
  name?: string | null;
  email?: string | null;
  size?: AvatarSize;
  className?: string;
};

export function Avatar({ name, email, size = "md", className }: AvatarProps) {
  const seed = getSeed(name, email);
  const dimension = resolveSize(size);
  return (
    <View className={className} style={{ width: dimension, height: dimension }}>
      <NaviiAvatar seed={seed} size={dimension} title={name ?? email ?? "User"} ringless />
    </View>
  );
}

type InitialsAvatarProps = {
  name?: string | null;
  email?: string | null;
  size?: AvatarSize;
  className?: string;
};

export function InitialsAvatar({ name, email, size = "md", className }: InitialsAvatarProps) {
  const dimension = resolveSize(size);
  return (
    <View
      className={`items-center justify-center rounded-full bg-accent-soft ${className ?? ""}`}
      style={{
        width: dimension,
        height: dimension,
        borderCurve: "continuous",
      }}
    >
      <Text
        className="font-semibold tracking-tight text-accent-soft-foreground"
        style={{
          fontSize: Math.max(11, Math.round(dimension * 0.38)),
          includeFontPadding: false,
          textAlignVertical: "center",
        }}
      >
        {getInitials(name, email)}
      </Text>
    </View>
  );
}
