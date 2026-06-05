import { api } from "@nudge/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  Search01Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { Text, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { FilterChip } from "@/components/filter-chip";
import { Icon } from "@/components/icon";
import { LoadingScreen } from "@/components/loading-screen";
import { ScreenShell } from "@/components/screen-shell";
import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";
import { Input } from "heroui-native";
import { formatRole } from "@/lib/format";
import { useViewer } from "@/lib/use-viewer";

type Filter = "all" | "students" | "managers" | "researchers";

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "Everyone" },
  { value: "students", label: "Students" },
  { value: "managers", label: "Managers" },
  { value: "researchers", label: "Researchers" },
];

function toneForRole(role: string): "accent" | "info" | "success" | "warning" {
  if (role === "student") return "info";
  if (role === "researcher") return "warning";
  if (role === "lecturer") return "success";
  return "accent";
}

export default function TeamScreen() {
  const { isManager } = useViewer();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const people = useQuery(
    api.profiles.listPeople,
    isManager ? {} : "skip",
  );
  const experiments = useQuery(
    api.experiments.listExperiments,
    isManager ? {} : "skip",
  );

  if (!isManager) {
    return (
      <ScreenShell>
        <SectionCard title="Manager only" flat>
          <EmptyState
            icon={UserMultipleIcon}
            title="Sign in as a manager"
            message="The team directory is available to lecturers, admins, and researchers."
            tone="info"
          />
        </SectionCard>
      </ScreenShell>
    );
  }

  if (!people || !experiments) {
    return <LoadingScreen message="Loading your team..." />;
  }

  const matchesFilter = (person: { primaryRole: string; roles: string[] }) => {
    if (filter === "all") return true;
    if (filter === "students") return person.roles.includes("student");
    if (filter === "researchers") return person.roles.includes("researcher");
    if (filter === "managers") {
      return person.roles.some((role) => role !== "student");
    }
    return true;
  };

  const matchesSearch = (person: { fullName?: string | null; email: string; studentId?: string | null }) => {
    if (!search.trim()) return true;
    const needle = search.trim().toLowerCase();
    return (
      (person.fullName ?? "").toLowerCase().includes(needle) ||
      person.email.toLowerCase().includes(needle) ||
      (person.studentId ?? "").toLowerCase().includes(needle)
    );
  };

  const filtered = people.filter((person) => matchesFilter(person) && matchesSearch(person));
  const students = people.filter((p) => p.roles.includes("student")).length;
  const managers = people.filter((p) => p.roles.some((r) => r !== "student")).length;
  const runningExperiments = experiments.filter((exp) => exp.status === "running").length;

  return (
    <ScreenShell>
      <SectionCard title="At a glance" flat>
        <View className="flex-row flex-wrap gap-2">
          <StatusPill label={`${students} students`} tone="info" />
          <StatusPill label={`${managers} managers`} tone="accent" />
          <StatusPill
            label={`${runningExperiments} running experiments`}
            tone={runningExperiments > 0 ? "success" : "muted"}
          />
        </View>
      </SectionCard>

      <SectionCard title="Find a person" icon={Search01Icon} flat>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, email, or student ID"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        <View className="mt-3 flex-row flex-wrap gap-2">
          {filters.map((item) => (
            <FilterChip
              key={item.value}
              label={item.label}
              active={item.value === filter}
              onPress={() => {
                setFilter(item.value);
              }}
            />
          ))}
        </View>
      </SectionCard>

      {filtered.length === 0 ? (
        <SectionCard title="Results" flat>
          <EmptyState
            icon={UserMultipleIcon}
            title="No matches"
            message={
              search || filter !== "all"
                ? "Try a different search or filter."
                : "Once people join this workspace, they'll show up here."
            }
            tone="info"
          />
        </SectionCard>
      ) : (
        <SectionCard
          title={`People (${filtered.length})`}
          icon={UserMultipleIcon}
          flat
        >
          {filtered.map((person, index) => (
            <View key={person._id}>
              {index > 0 ? <View className="h-px bg-separator" /> : null}
              <View className="py-3.5">
                <View className="flex-row items-center gap-3.5">
                  <View
                    className="h-10 w-10 items-center justify-center rounded-xl bg-accent-soft"
                    style={{ borderCurve: "continuous" }}
                  >
                    <Icon
                      icon={UserMultipleIcon}
                      size={18}
                      strokeWidth={2}
                      className="text-accent-soft-foreground"
                    />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="text-base font-medium text-foreground">
                      {person.fullName ?? person.email}
                    </Text>
                    <Text className="text-xs text-muted">
                      {formatRole(person.roles)} · {person.studentId ?? person.email}
                    </Text>
                  </View>
                  <StatusPill
                    label={person.primaryRole}
                    tone={toneForRole(person.primaryRole)}
                  />
                </View>
              </View>
            </View>
          ))}
        </SectionCard>
      )}
    </ScreenShell>
  );
}
