import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/client/boardui/utils/cx";
import { useIsReadOnlyViewer } from "@/client/features/team/organizationQueries";
import {
  connectNavGroup,
  getProjectNavGroups,
} from "@/client/navigation/items";
import { ProjectSwitcher } from "@/client/features/projects/ProjectSwitcher";
import {
  SamChatListSkeleton,
  SamSidebarPanel,
} from "@/client/features/sam/SamSidebarPanel";
import {
  Sidebar as UiSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from "@/client/components/ui/sidebar";
import {
  AccountFooter,
  EveryAppLink,
  everyApp,
  SidebarNavLink,
} from "@/client/components/SidebarAccountFooter";

export function Sidebar({
  projectId,
  projectPending,
  ready,
}: {
  projectId: string | null;
  /** No project is known yet, but the projects list may still name one. */
  projectPending: boolean;
  /** The session is confirmed, so the sidebar's own data can load. */
  ready: boolean;
}) {
  // Until a project is known, show the project nav as rows without links, so
  // the sidebar has its full shape from the first paint instead of growing
  // once projects load. The placeholder rows never render these links.
  const navPlaceholder = projectId === null && projectPending;
  const readOnly = useIsReadOnlyViewer();
  const navGroups =
    projectId !== null || navPlaceholder
      ? getProjectNavGroups(projectId ?? "", { readOnly })
      : readOnly
        ? []
        : [connectNavGroup];
  const { pathname } = useLocation();
  const { setOpenMobile } = useSidebar();
  // SAM is hidden from navigation: the chat route is only reachable by URL,
  // and while it is open its chat list takes the nav's place.
  const onSamRoute = pathname.includes("/sam");

  return (
    <UiSidebar variant="inset" collapsible="offcanvas">
      <SidebarHeader
        className={cn("gap-0 px-3 pb-2", everyApp ? "pt-2" : "pt-3")}
      >
        {everyApp ? <EveryAppLink /> : null}
        <Link
          to="/"
          onClick={() => setOpenMobile(false)}
          className="flex items-center gap-2 px-1 pb-3 text-headline-semibold text-text-primary"
        >
          <span
            aria-hidden
            className="flex size-7 items-center justify-center rounded-2lg bg-linear-to-b from-accent-500 to-accent-600 text-caption-1-bold text-white shadow-nav-selected"
          >
            O
          </span>
          OpenSEO
        </Link>
        <ProjectSwitcher
          activeProjectId={projectId}
          ready={ready}
          onCloseDrawer={() => setOpenMobile(false)}
        />
      </SidebarHeader>

      <SidebarContent>
        {onSamRoute && projectId ? (
          ready ? (
            <SamSidebarPanel
              projectId={projectId}
              onNavigate={() => setOpenMobile(false)}
            />
          ) : (
            <div className="px-2 py-1">
              <SamChatListSkeleton />
            </div>
          )
        ) : (
          <nav
            aria-label="Main navigation"
            aria-busy={navPlaceholder || undefined}
          >
            {navGroups.map((group) => (
              <SidebarGroup key={group.label} className="py-1">
                <SidebarGroupLabel className="h-8">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const { icon, label, ...linkProps } = item;
                      return (
                        <SidebarNavLink
                          key={linkProps.to}
                          icon={icon}
                          label={label}
                          linkProps={linkProps}
                          placeholder={navPlaceholder}
                        />
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </nav>
        )}
      </SidebarContent>
      <AccountFooter ready={ready} />
    </UiSidebar>
  );
}
