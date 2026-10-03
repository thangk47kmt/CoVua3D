import { createFileRoute } from "@tanstack/react-router";
import { HallGate } from "@/components/hall/HallGate";
import { HallView } from "@/components/hall/HallView";
import { useHallIdentity } from "@/components/hall/use-hall-identity";
import { useT } from "@/i18n";

export const Route = createFileRoute("/hall")({
  component: HallPage,
});

function HallPage() {
  const ident = useHallIdentity();
  const { t } = useT();
  if (!ident.ready) {
    return <div className="grid h-dvh place-items-center text-muted">{t("openingHall")}</div>;
  }
  if (!ident.present) return <HallGate callback="/hall" onEntered={ident.reload} />;
  return <HallView />;
}
