import type { Member } from "@/types";

/** Block full app until staff approve onboarding and activate the member. */
export function needsOnboardingGate(member: Member): boolean {
  // Existing roster members may not have onboardingStatus set yet.
  if (member.status === "active" && !member.onboardingStatus) {
    return false;
  }
  if (member.onboardingStatus !== "complete") return true;
  if (member.status !== "active") return true;
  return false;
}

export function onboardingBadgeLabel(member: Member): string | null {
  if (member.onboardingStatus === "complete" && member.status === "active") {
    return null;
  }
  if (!member.onboardingStatus && member.status === "active") {
    return null;
  }
  if (member.onboardingStatus === "needs_review") {
    return "Onboarding: needs review";
  }
  if (member.onboardingStatus === "in_progress") {
    return "Onboarding: forms incomplete";
  }
  if (member.onboardingStatus === "not_started") {
    return "Onboarding: not started";
  }
  if (member.status === "pending") {
    return "Pending activation";
  }
  return null;
}
