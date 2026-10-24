import * as React from "react";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata = {
  title: "Pengaturan Aplikasi & Sistem - bekasAja Admin",
  description: "Sinkronisasi pengaturan panel admin dengan aplikasi bekasAja.",
};

export default function SettingsPage() {
  return <SettingsView />;
}
