import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/icon";
import { Calendar01Icon, Clock01Icon } from "@hugeicons/core-free-icons";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

type Mode = "datetime" | "date" | "time";

type DateTimeFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  mode?: Mode;
  minValue?: number;
};

function startOfDay(timestamp: number) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function formatDisplay(timestamp: number, mode: Mode) {
  if (!timestamp || Number.isNaN(timestamp)) {
    return mode === "time"
      ? "Pick a time"
      : mode === "date"
        ? "Pick a date"
        : "Pick a date and time";
  }
  const date = new Date(timestamp);
  if (mode === "time") {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }
  if (mode === "date") {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function pad(value: number) {
  return value < 10 ? `0${value}` : String(value);
}

type StepperProps = {
  label: string;
  value: string;
  onDecrement: () => void;
  onIncrement: () => void;
  disabledDecrement?: boolean;
  disabledIncrement?: boolean;
};

function Stepper({
  label,
  value,
  onDecrement,
  onIncrement,
  disabledDecrement,
  disabledIncrement,
}: StepperProps) {
  return (
    <View className="flex-row items-center justify-between gap-3 rounded-xl bg-surface-tertiary px-3 py-2.5">
      <Text className="text-sm font-medium text-foreground">{label}</Text>
      <View className="flex-row items-center gap-1.5">
        <StepperButton
          icon="minus"
          onPress={onDecrement}
          disabled={disabledDecrement}
          accessibilityLabel={`Decrease ${label}`}
        />
        <View className="min-w-[56px] items-center">
          <Text className="text-base font-semibold text-foreground tabular-nums">{value}</Text>
        </View>
        <StepperButton
          icon="plus"
          onPress={onIncrement}
          disabled={disabledIncrement}
          accessibilityLabel={`Increase ${label}`}
        />
      </View>
    </View>
  );
}

function StepperButton({
  icon,
  onPress,
  disabled,
  accessibilityLabel,
}: {
  icon: "minus" | "plus";
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={6}
      disabled={disabled}
      onPress={onPress}
      className="h-8 w-8 items-center justify-center rounded-lg bg-surface active:opacity-60 disabled:opacity-30"
      style={{ borderCurve: "continuous" }}
    >
      <Text className="text-lg font-semibold text-foreground">{icon === "plus" ? "+" : "−"}</Text>
    </Pressable>
  );
}

type PickerDraft = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  isPM: boolean;
};

function dateToDraft(timestamp: number): PickerDraft {
  const date = new Date(timestamp);
  const hours24 = date.getHours();
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
    hour: hours24 % 12 === 0 ? 12 : hours24 % 12,
    minute: date.getMinutes(),
    isPM: hours24 >= 12,
  };
}

function draftToTimestamp(draft: PickerDraft): number {
  const hours24 = draft.isPM
    ? draft.hour === 12
      ? 12
      : draft.hour + 12
    : draft.hour === 12
      ? 0
      : draft.hour;
  return new Date(draft.year, draft.month, draft.day, hours24, draft.minute, 0, 0).getTime();
}

function calendarGrid(
  draft: PickerDraft,
): Array<{ key: string; day: number | null; isSelected: boolean }> {
  const totalDays = daysInMonth(draft.year, draft.month);
  const firstWeekday = new Date(draft.year, draft.month, 1).getDay();
  const cells: Array<{ key: string; day: number | null; isSelected: boolean }> = [];
  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push({ key: `pad-${index}`, day: null, isSelected: false });
  }
  for (let day = 1; day <= totalDays; day += 1) {
    cells.push({
      key: `${draft.year}-${draft.month}-${day}`,
      day,
      isSelected: day === draft.day,
    });
  }
  return cells;
}

export function DateTimeField({
  label,
  value,
  onChange,
  mode = "datetime",
  minValue,
}: DateTimeFieldProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PickerDraft>(() => dateToDraft(value || Date.now()));

  useEffect(() => {
    if (open) {
      setDraft(dateToDraft(value || Date.now()));
    }
  }, [open, value]);

  const updateDraft = (next: Partial<PickerDraft>) => {
    setDraft((current) => {
      const merged = { ...current, ...next };
      const maxDay = daysInMonth(merged.year, merged.month);
      merged.day = clamp(merged.day, 1, maxDay);
      return merged;
    });
  };

  const handleConfirm = () => {
    const next = draftToTimestamp(draft);
    if (minValue && next < minValue) {
      onChange(minValue);
    } else {
      onChange(next);
    }
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const showDate = mode === "date" || mode === "datetime";
  const showTime = mode === "time" || mode === "datetime";
  const previewTimestamp = draftToTimestamp(draft);
  const minYear = minValue ? new Date(minValue).getFullYear() : null;
  const currentYear = new Date().getFullYear();
  const minDraftTimestamp = minValue ? minValue : null;

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-muted" style={{ includeFontPadding: false }}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, currently ${formatDisplay(value, mode)}`}
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3.5 py-3 active:opacity-70"
        style={{ borderCurve: "continuous" }}
      >
        <Text
          className={`flex-1 text-base ${value ? "text-foreground" : "text-muted"}`}
          style={{ includeFontPadding: false, textAlignVertical: "center" }}
        >
          {formatDisplay(value, mode)}
        </Text>
        <Icon
          icon={mode === "time" ? Clock01Icon : Calendar01Icon}
          size={16}
          strokeWidth={2}
          className="text-muted"
        />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
        statusBarTranslucent
      >
        <View className="flex-1 justify-end bg-black/50">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            onPress={handleCancel}
            className="absolute inset-0"
          />
          <View
            className="rounded-t-3xl bg-background p-5"
            style={{
              paddingBottom: Math.max(insets.bottom, 16) + 16,
              borderCurve: "continuous",
            }}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-base font-semibold text-foreground">{label}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={8}
                onPress={handleCancel}
                className="rounded-md px-2 py-1 active:opacity-60"
              >
                <Text className="text-sm font-semibold text-muted">Close</Text>
              </Pressable>
            </View>

            {showDate ? (
              <View className="gap-4">
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Stepper
                      label="Year"
                      value={String(draft.year)}
                      onDecrement={() => {
                        const nextYear = clamp(draft.year - 1, minYear ?? 1970, currentYear + 5);
                        updateDraft({ year: nextYear });
                      }}
                      onIncrement={() => {
                        const nextYear = clamp(draft.year + 1, minYear ?? 1970, currentYear + 5);
                        updateDraft({ year: nextYear });
                      }}
                    />
                  </View>
                  <View className="flex-1">
                    <Stepper
                      label="Month"
                      value={MONTHS[draft.month] ?? ""}
                      onDecrement={() => {
                        if (draft.month === 0) {
                          updateDraft({
                            month: 11,
                            year: clamp(draft.year - 1, minYear ?? 1970, currentYear + 5),
                          });
                        } else {
                          updateDraft({ month: draft.month - 1 });
                        }
                      }}
                      onIncrement={() => {
                        if (draft.month === 11) {
                          updateDraft({
                            month: 0,
                            year: clamp(draft.year + 1, minYear ?? 1970, currentYear + 5),
                          });
                        } else {
                          updateDraft({ month: draft.month + 1 });
                        }
                      }}
                    />
                  </View>
                </View>

                <View>
                  <View className="mb-2 flex-row justify-between px-1">
                    {WEEKDAYS.map((day, index) => (
                      <Text
                        key={`${day}-${index}`}
                        className="w-9 text-center text-[11px] font-semibold uppercase tracking-wider text-muted"
                      >
                        {day}
                      </Text>
                    ))}
                  </View>
                  <View className="flex-row flex-wrap">
                    {calendarGrid(draft).map((cell) => {
                      if (cell.day === null) {
                        return <View key={cell.key} className="h-10 w-[14.2857%]" />;
                      }
                      const cellDate = new Date(draft.year, draft.month, cell.day).getTime();
                      const isDisabled = minDraftTimestamp
                        ? cellDate < startOfDay(minDraftTimestamp)
                        : false;
                      return (
                        <View key={cell.key} className="w-[14.2857%] items-center py-0.5">
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Select ${MONTHS_LONG[draft.month]} ${cell.day}, ${draft.year}`}
                            accessibilityState={{
                              selected: cell.isSelected,
                              disabled: isDisabled,
                            }}
                            disabled={isDisabled}
                            onPress={() => updateDraft({ day: cell.day ?? draft.day })}
                            className={`h-9 w-9 items-center justify-center rounded-full ${
                              cell.isSelected
                                ? "bg-accent"
                                : isDisabled
                                  ? "bg-transparent opacity-30"
                                  : "bg-transparent"
                            }`}
                            style={{ borderCurve: "continuous" }}
                          >
                            <Text
                              className={`text-sm font-medium ${
                                cell.isSelected
                                  ? "text-accent-foreground"
                                  : isDisabled
                                    ? "text-muted"
                                    : "text-foreground"
                              }`}
                            >
                              {cell.day}
                            </Text>
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            ) : null}

            {showTime ? (
              <View className="mt-4 gap-3">
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Stepper
                      label="Hour"
                      value={String(draft.hour)}
                      onDecrement={() =>
                        updateDraft({ hour: draft.hour === 1 ? 12 : draft.hour - 1 })
                      }
                      onIncrement={() =>
                        updateDraft({ hour: draft.hour === 12 ? 1 : draft.hour + 1 })
                      }
                    />
                  </View>
                  <View className="flex-1">
                    <Stepper
                      label="Minute"
                      value={pad(draft.minute)}
                      onDecrement={() => updateDraft({ minute: (draft.minute + 14) % 60 })}
                      onIncrement={() => updateDraft({ minute: (draft.minute + 1) % 60 })}
                    />
                  </View>
                </View>
                <View className="flex-row gap-2 self-start">
                  {[
                    { label: "AM", value: false },
                    { label: "PM", value: true },
                  ].map((option) => {
                    const active = draft.isPM === option.value;
                    return (
                      <Pressable
                        key={option.label}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={`${option.label} ${active ? "selected" : ""}`}
                        onPress={() => updateDraft({ isPM: option.value })}
                        className={`h-9 w-16 items-center justify-center rounded-lg ${
                          active ? "bg-accent" : "bg-surface-tertiary"
                        }`}
                        style={{ borderCurve: "continuous" }}
                      >
                        <Text
                          className={`text-sm font-semibold ${
                            active ? "text-accent-foreground" : "text-foreground"
                          }`}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <View className="mt-5 rounded-xl bg-surface-tertiary p-3">
              <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Preview
              </Text>
              <Text className="mt-1 text-base font-medium text-foreground">
                {formatDisplay(previewTimestamp, mode)}
              </Text>
            </View>

            <View className="mt-5 flex-row gap-3">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                onPress={handleCancel}
                className="flex-1 items-center justify-center rounded-xl bg-surface-tertiary px-4 py-3 active:opacity-60"
                style={{ borderCurve: "continuous" }}
              >
                <Text className="text-sm font-semibold text-foreground">Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Confirm"
                onPress={handleConfirm}
                className="flex-1 items-center justify-center rounded-xl bg-accent px-4 py-3 active:opacity-80"
                style={{ borderCurve: "continuous" }}
              >
                <Text className="text-sm font-semibold text-accent-foreground">Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
