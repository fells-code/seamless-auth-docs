import { FC } from "react";

export type Framework = "nextjs" | "react";

export type SidebarItem = {
  label: string;
  href: string;
  component: FC;
};
