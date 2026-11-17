import type { Metadata } from "next";
import { aiEnabled } from "@/lib/assistant";
import { Chat } from "./Chat";

export const metadata: Metadata = { title: "Din · Assistente" };

export default function AssistantPage() {
  return <Chat ai={aiEnabled()} />;
}
