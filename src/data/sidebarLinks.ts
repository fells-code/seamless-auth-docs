import NextJsIntroduction from "@/components/Content/NextJs/Introduction";
import NextJsInstallation from "@/components/Content/NextJs/Installation";
import NextJsUsage from "@/components/Content/NextJs/Usage";
import ReactIntroduction from "@/components/Content/React/Introduction";
import ReactInstallation from "@/components/Content/React/Installation";
import ReactUsage from "@/components/Content/React/Usage";
import { Framework, SidebarItem } from "@/types";

const sidebarLinks: Record<Framework, SidebarItem[]> = {
  nextjs: [
    {
      label: "Introduction",
      href: "/docs/nextjs/introduction",
      component: NextJsIntroduction,
    },
    {
      label: "Installation",
      href: "/docs/nextjs/installation",
      component: NextJsInstallation,
    },
    { label: "Usage", href: "/docs/nextjs/usage", component: NextJsUsage },
  ],
  react: [
    {
      label: "Introduction",
      href: "/docs/react/introduction",
      component: ReactIntroduction,
    },
    {
      label: "Installation",
      href: "/docs/react/installation",
      component: ReactInstallation,
    },
    {
      label: "Usage",
      href: "/docs/react/usage",
      component: ReactUsage,
    },
  ],
};

export default sidebarLinks;
