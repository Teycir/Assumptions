// Fixture: benign-refactor
// A pure utility function refactor with unit tests and no side effects or hidden assumptions.

export interface User {
  firstName: string;
  lastName: string;
}

export function formatFullName(user: User): string {
  const first = (user.firstName || "").trim();
  const last = (user.lastName || "").trim();
  if (!first && !last) return "Anonymous";
  if (!first) return last;
  if (!last) return first;
  return `${first} ${last}`;
}
