import type { Group } from "../modules/timetable/types/Group.ts";

export function getGroupPath(id: string, groups: Group[]): Group[] {
  const byId = new Map(groups.map((group) => [group.id, group]));
  const path: Group[] = [];
  const visited = new Set<string>();
  let group = byId.get(id);
  while (group && !visited.has(group.id)) {
    visited.add(group.id);
    path.unshift(group);
    group = group.parentId ? byId.get(group.parentId) : undefined;
  }
  return path;
}
