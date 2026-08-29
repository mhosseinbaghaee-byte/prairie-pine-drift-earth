import { createFileRoute } from "@tanstack/react-router";
import { PouyaApp } from "@/components/pouya-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <PouyaApp />;
}
