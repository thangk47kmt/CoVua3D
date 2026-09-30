import { createFileRoute } from "@tanstack/react-router";
import { PracticeDesk } from "@/components/game/PracticeDesk";

export const Route = createFileRoute("/learn")({
  component: PracticeDesk,
});
