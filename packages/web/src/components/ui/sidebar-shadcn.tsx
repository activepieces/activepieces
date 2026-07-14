import { cva, type VariantProps } from 'class-variance-authority';
import { t } from 'i18next';
import { Slot } from 'radix-ui';
import * as React from 'react';

import { useCursorTooltip } from '@/components/custom/cursor-tooltip';
import { PanelLeftCloseIcon } from '@/components/icons/panel-left-close';
import { PanelLeftOpenIcon } from '@/components/icons/panel-left-open';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const SIDEBAR_COOKIE_NAME = 'sidebar_state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = '16rem';
const SIDEBAR_DEFAULT_WIDTH_PX = 256;
// The resize handle never changes the sidebar's width — dragging inward only
// pushes it off-screen to close it. Within the safety zone the push is a
// preview: content stays fully visible and releasing snaps the sidebar back;
// past it the content starts fading and releasing commits the close.
const SIDEBAR_CLOSE_DRAG_DEAD_ZONE_PX = 40;
// Releasing without having moved past this counts as a click, which closes.
const SIDEBAR_CLICK_MOVEMENT_TOLERANCE_PX = 5;
const SIDEBAR_FADE_END_OFFSET_PX = SIDEBAR_DEFAULT_WIDTH_PX * 0.8;
// --sidebar-width (16rem = 256px) + edge margin — the hover-keep column for the
// offcanvas hover panel; the pointer anywhere in this column keeps it open.
const SIDEBAR_HOVER_COLUMN_WIDTH_PX = 272;
const SIDEBAR_EDGE_GLOW_WIDTH_PX = 40;
// Covers the 200ms collapse transition during which the header menu button
// sweeps under the cursor and would re-trigger hover-open.
const SIDEBAR_HOVER_SUPPRESS_AFTER_CLOSE_MS = 400;
const SIDEBAR_WIDTH_MOBILE = '18rem';
const SIDEBAR_WIDTH_ICON = '3rem';
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';
// Survives route changes (which remount the provider) so an open hover panel
// stays open while navigating through it.
let lastHoverState = false;

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }

  return context;
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  hoverMode = false,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hoverMode?: boolean;
}) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);
  // Seeded from a module-level flag: route changes remount the whole layout
  // (each route owns its provider instance), and the hover-revealed panel must
  // survive in-panel navigation instead of vanishing on every page switch.
  const [isHovered, setIsHovered] = React.useState(() => lastHoverState);
  const [keepElevatedZIndex, setKeepElevatedZIndex] = React.useState(false);
  const hoverSuppressedUntilRef = React.useRef(0);

  const [_open, _setOpen] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SIDEBAR_COOKIE_NAME);
      if (stored !== null) {
        return stored === 'true';
      }
    }
    return defaultOpen;
  });
  // How far the close drag has pushed the sidebar off-screen (0..default
  // width) — the sidebar's width itself never changes.
  const [closeDragOffset, setCloseDragOffset] = React.useState(0);
  const [isResizing, setIsResizing] = React.useState(false);
  const persistedOpen = openProp ?? _open;

  // A drag-close hides the sidebar instantly: transitions stay suppressed
  // until the hidden state has actually painted (double rAF) — re-enabling
  // them in the same frame would let the browser animate the jump instead.
  React.useEffect(() => {
    if (!isResizing || persistedOpen) {
      return;
    }
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setIsResizing(false));
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [isResizing, persistedOpen]);

  const isHoverExpanded = hoverMode && !persistedOpen && isHovered;
  const open = persistedOpen || isHoverExpanded;
  const shouldElevateZIndex = isHoverExpanded || keepElevatedZIndex;

  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState =
        typeof value === 'function' ? value(persistedOpen) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }

      // Pinning/unpinning is a deliberate action — drop any lingering hover
      // state so closing never instantly reopens the sidebar as a hover panel.
      lastHoverState = false;
      setIsHovered(false);
      setKeepElevatedZIndex(false);
      if (!openState) {
        hoverSuppressedUntilRef.current =
          Date.now() + SIDEBAR_HOVER_SUPPRESS_AFTER_CLOSE_MS;
      }

      localStorage.setItem(SIDEBAR_COOKIE_NAME, String(openState));
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, persistedOpen],
  );

  const hoverTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const zIndexTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const setHovered = React.useCallback((hovered: boolean) => {
    if (hovered && Date.now() < hoverSuppressedUntilRef.current) {
      return;
    }
    lastHoverState = hovered;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (zIndexTimeoutRef.current) {
      clearTimeout(zIndexTimeoutRef.current);
      zIndexTimeoutRef.current = null;
    }

    if (hovered) {
      setIsHovered(true);
      setKeepElevatedZIndex(false);
    } else {
      setIsHovered(false);
      setKeepElevatedZIndex(true);
      zIndexTimeoutRef.current = setTimeout(() => {
        setKeepElevatedZIndex(false);
      }, 200);
    }
  }, []);

  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (zIndexTimeoutRef.current) {
        clearTimeout(zIndexTimeoutRef.current);
      }
    };
  }, []);

  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
  }, [isMobile, setOpen, setOpenMobile]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  const state = open ? 'expanded' : 'collapsed';

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
      hoverMode,
      isHoverExpanded,
      shouldElevateZIndex,
      setHovered,
      closeDragOffset,
      setCloseDragOffset,
      isResizing,
      setIsResizing,
    }),
    [
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      shouldElevateZIndex,
      toggleSidebar,
      hoverMode,
      isHoverExpanded,
      setHovered,
      closeDragOffset,
      isResizing,
    ],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={
            {
              '--sidebar-width': SIDEBAR_WIDTH,
              '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn(
            'group/sidebar-wrapper flex h-svh w-full has-data-[variant=inset]:bg-sidebar',
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}

function Sidebar({
  side = 'left',
  variant = 'sidebar',
  collapsible = 'offcanvas',
  resizable = false,
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  side?: 'left' | 'right';
  variant?: 'sidebar' | 'floating' | 'inset';
  collapsible?: 'offcanvas' | 'icon' | 'none';
  resizable?: boolean;
}) {
  const {
    isMobile,
    state,
    openMobile,
    setOpenMobile,
    setOpen,
    hoverMode,
    isHoverExpanded,
    shouldElevateZIndex,
    setHovered,
    closeDragOffset,
    isResizing,
  } = useSidebar();

  // Offcanvas hover-reveal: the closed sidebar opens as a short floating panel
  // (shadow, no layout space) while the pointer is over the left edge or the
  // panel itself. Closing is delayed so the panel slides out fully rendered —
  // flipping the state to collapsed immediately would unmount labels/sections
  // and make the panel visibly shrink mid-animation.
  const isOffcanvasHoverPanel =
    hoverMode && collapsible === 'offcanvas' && isHoverExpanded;
  const [isHoverClosing, setIsHoverClosing] = React.useState(false);
  const hoverCloseTimeoutRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  React.useEffect(() => {
    return () => {
      if (hoverCloseTimeoutRef.current) {
        clearTimeout(hoverCloseTimeoutRef.current);
      }
    };
  }, []);

  const handleHoverEnter = () => {
    if (hoverCloseTimeoutRef.current) {
      clearTimeout(hoverCloseTimeoutRef.current);
      hoverCloseTimeoutRef.current = null;
    }
    setIsHoverClosing(false);
    setHovered(true);
  };

  // Only used for icon-mode hover (builder rail). Offcanvas hover opens solely
  // from the screen-edge strip, and closing is driven by the mousemove effect
  // below: the whole edge column (above/below the panel too) counts as inside.
  const handleHoverLeave = () => {
    setHovered(false);
  };

  const [isEdgeGlow, setIsEdgeGlow] = React.useState(false);
  const edgeGlowActive =
    hoverMode &&
    collapsible === 'offcanvas' &&
    state === 'collapsed' &&
    !isHoverExpanded;

  React.useEffect(() => {
    if (!edgeGlowActive) {
      setIsEdgeGlow(false);
      return;
    }
    const handleMouseMove = (event: MouseEvent) => {
      const distanceFromEdge =
        side === 'left' ? event.clientX : window.innerWidth - event.clientX;
      setIsEdgeGlow(distanceFromEdge <= SIDEBAR_EDGE_GLOW_WIDTH_PX);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [edgeGlowActive, side]);

  React.useEffect(() => {
    if (!isOffcanvasHoverPanel) {
      return;
    }
    const handleMouseMove = (event: MouseEvent) => {
      const inColumn =
        side === 'left'
          ? event.clientX <= SIDEBAR_HOVER_COLUMN_WIDTH_PX
          : event.clientX >= window.innerWidth - SIDEBAR_HOVER_COLUMN_WIDTH_PX;
      if (inColumn) {
        if (hoverCloseTimeoutRef.current) {
          clearTimeout(hoverCloseTimeoutRef.current);
          hoverCloseTimeoutRef.current = null;
        }
        setIsHoverClosing(false);
        return;
      }
      if (!hoverCloseTimeoutRef.current) {
        setIsHoverClosing(true);
        hoverCloseTimeoutRef.current = setTimeout(() => {
          hoverCloseTimeoutRef.current = null;
          setIsHoverClosing(false);
          setHovered(false);
        }, 200);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isOffcanvasHoverPanel, side, setHovered]);

  if (collapsible === 'none') {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          'flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
          style={
            {
              '--sidebar-width': SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className="group peer hidden text-sidebar-foreground md:block"
      data-state={state}
      data-collapsible={state === 'collapsed' ? collapsible : ''}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
      onMouseEnter={
        hoverMode && collapsible !== 'offcanvas' ? handleHoverEnter : undefined
      }
      onMouseLeave={
        hoverMode && collapsible !== 'offcanvas' ? handleHoverLeave : undefined
      }
    >
      {hoverMode &&
        collapsible === 'offcanvas' &&
        (state === 'collapsed' || isHoverExpanded) && (
          <div
            data-slot="sidebar-hover-zone"
            aria-hidden="true"
            onMouseEnter={handleHoverEnter}
            className={cn(
              'fixed inset-y-0 z-40 hidden w-1.5 md:block',
              side === 'left' ? 'left-0' : 'right-0',
            )}
          />
        )}
      {edgeGlowActive && (
        <div
          data-slot="sidebar-edge-glow"
          aria-hidden="true"
          className={cn(
            'pointer-events-none fixed inset-y-0 z-40 hidden w-5 transition-[opacity,transform] duration-300 ease-out md:block',
            side === 'left'
              ? 'left-0 origin-left bg-gradient-to-r from-muted-foreground/50 to-transparent'
              : 'right-0 origin-right bg-gradient-to-l from-muted-foreground/50 to-transparent',
            isEdgeGlow ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0',
          )}
        />
      )}
      {/* This is what handles the sidebar gap on desktop */}
      <div
        data-slot="sidebar-gap"
        // While the close drag pushes the sidebar out, the layout gap follows
        // the visible width so the page content slides in behind it.
        style={
          isResizing
            ? { width: SIDEBAR_DEFAULT_WIDTH_PX - closeDragOffset }
            : undefined
        }
        className={cn(
          'relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear',
          isResizing && 'transition-none',
          'group-data-[collapsible=offcanvas]:w-0',
          'group-data-[side=right]:rotate-180',
          variant === 'floating' || variant === 'inset'
            ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]'
            : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)',
          isHoverExpanded &&
            (collapsible === 'offcanvas'
              ? 'w-0'
              : variant === 'floating' || variant === 'inset'
              ? 'w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]'
              : 'w-(--sidebar-width-icon)'),
        )}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          'fixed z-10 hidden w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex',
          isResizing && 'transition-none',
          isOffcanvasHoverPanel
            ? cn(
                'top-1/2 -translate-y-1/2 h-[85svh] overflow-hidden rounded-lg border shadow-xl',
                side === 'left' ? 'left-2' : 'right-2',
                isHoverClosing &&
                  (side === 'left'
                    ? 'left-[calc(var(--sidebar-width)*-1)]'
                    : 'right-[calc(var(--sidebar-width)*-1)]'),
              )
            : cn(
                'inset-y-0 h-svh',
                side === 'left'
                  ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
                  : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
              ),
          variant === 'floating' || variant === 'inset'
            ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]'
            : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)',
          !hoverMode && (side === 'left' ? 'border-r' : 'border-l'),
          hoverMode &&
            isHoverExpanded &&
            !isOffcanvasHoverPanel &&
            (side === 'left' ? 'border-r' : 'border-l'),
          hoverMode &&
            collapsible === 'offcanvas' &&
            !isOffcanvasHoverPanel &&
            (side === 'left' ? 'border-r' : 'border-l'),
          !hoverMode &&
            state === 'collapsed' &&
            collapsible === 'icon' &&
            '[&_*]:!cursor-nesw-resize [&_button]:!cursor-pointer [&_button]:relative [&_button]:z-20 [&_button_*]:!cursor-pointer [&_a]:!cursor-pointer [&_a]:relative [&_a]:z-20 [&_a_*]:!cursor-pointer [&_[role=button]]:!cursor-pointer [&_[role=button]]:relative [&_[role=button]]:z-20 [&_[role=button]_*]:!cursor-pointer [&_[data-sidebar=menu-button]]:!cursor-pointer [&_[data-sidebar=menu-button]]:relative [&_[data-sidebar=menu-button]]:z-20 [&_[data-sidebar=menu-button]_*]:!cursor-pointer cursor-nesw-resize',
          shouldElevateZIndex && 'z-55',
          className,
        )}
        // The close drag pushes the whole panel off-screen instead of
        // shrinking it, so the content never squishes.
        style={
          isResizing
            ? side === 'left'
              ? { left: -closeDragOffset }
              : { right: -closeDragOffset }
            : undefined
        }
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          // The content stays fully visible through the safety zone, then
          // fades out, reaching fully transparent at 80% of the way.
          style={
            isResizing
              ? {
                  opacity: Math.max(
                    0,
                    1 -
                      Math.max(
                        0,
                        closeDragOffset - SIDEBAR_CLOSE_DRAG_DEAD_ZONE_PX,
                      ) /
                        (SIDEBAR_FADE_END_OFFSET_PX -
                          SIDEBAR_CLOSE_DRAG_DEAD_ZONE_PX),
                  ),
                }
              : undefined
          }
          className={cn(
            'flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow',
            isOffcanvasHoverPanel && 'rounded-lg',
            !hoverMode &&
              state === 'collapsed' &&
              collapsible === 'icon' &&
              'relative',
          )}
        >
          {!hoverMode && state === 'collapsed' && collapsible === 'icon' && (
            <div
              className="absolute inset-0 z-10 !cursor-nesw-resize"
              onClick={() => setOpen(true)}
              aria-hidden="true"
            />
          )}
          {children}
        </div>
        {resizable && state === 'expanded' && !isHoverExpanded && (
          <SidebarResizeHandle side={side} />
        )}
      </div>
    </div>
  );
}

function SidebarResizeHandle({ side }: { side: 'left' | 'right' }) {
  const { setOpen, setCloseDragOffset, isResizing, setIsResizing } =
    useSidebar();
  const latestOffsetRef = React.useRef(0);
  const startPointRef = React.useRef<{ x: number; y: number } | null>(null);
  const maxMovementRef = React.useRef(0);
  // The sidebar cannot be resized — clicking or dragging its line only
  // closes it, so the tooltip offers a single combined hint.
  const cursorTooltip = useCursorTooltip({
    lines: [{ action: t('Click or drag'), description: t('to close') }],
    disabled: isResizing,
  });

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    latestOffsetRef.current = 0;
    startPointRef.current = { x: event.clientX, y: event.clientY };
    maxMovementRef.current = 0;
    setCloseDragOffset(0);
    setIsResizing(true);
  };

  // Dragging inward pushes the whole sidebar off-screen (content fading,
  // never squished); whether it actually closes is decided on release.
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    if (startPointRef.current) {
      maxMovementRef.current = Math.max(
        maxMovementRef.current,
        Math.hypot(
          event.clientX - startPointRef.current.x,
          event.clientY - startPointRef.current.y,
        ),
      );
    }
    const rawOffset =
      side === 'left'
        ? SIDEBAR_DEFAULT_WIDTH_PX - event.clientX
        : event.clientX - (window.innerWidth - SIDEBAR_DEFAULT_WIDTH_PX);
    const offset = Math.min(SIDEBAR_DEFAULT_WIDTH_PX, Math.max(0, rawOffset));
    latestOffsetRef.current = offset;
    setCloseDragOffset(offset);
  };

  // Fires on every way a drag can end — pointerup, pointercancel, explicit
  // release — unlike pointerup/pointercancel handlers, which the browser can
  // skip after it has already dropped the capture, leaving the resizing state
  // (and the handle's active color) stuck on.
  const handleLostPointerCapture = () => {
    const wasClick =
      startPointRef.current !== null &&
      maxMovementRef.current < SIDEBAR_CLICK_MOVEMENT_TOLERANCE_PX;
    startPointRef.current = null;
    const shouldClose =
      wasClick || latestOffsetRef.current > SIDEBAR_CLOSE_DRAG_DEAD_ZONE_PX;
    if (shouldClose) {
      // The close is instant, not animated: snap fully hidden while the
      // resizing flag still disables transitions; the unmount cleanup then
      // re-enables them after the hidden state has painted.
      setCloseDragOffset(SIDEBAR_DEFAULT_WIDTH_PX);
      setOpen(false);
      return;
    }
    setIsResizing(false);
    setCloseDragOffset(0);
  };

  return (
    <>
      <div
        data-slot="sidebar-resize-handle"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize Sidebar"
        className={cn(
          'absolute inset-y-0 z-30 w-px cursor-col-resize touch-none transition-colors duration-200 ease-in-out hover:bg-muted-foreground/40 after:absolute after:inset-y-0 after:left-1/2 after:w-1.5 after:-translate-x-1/2',
          isResizing && 'bg-muted-foreground/40 duration-0',
          side === 'left' ? 'right-0' : 'left-0',
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerEnter={cursorTooltip.handlers.onPointerEnter}
        onPointerLeave={cursorTooltip.handlers.onPointerLeave}
        onLostPointerCapture={handleLostPointerCapture}
      />
      {cursorTooltip.tooltip}
    </>
  );
}

function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar, open } = useSidebar();

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn('size-7', className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      {open ? (
        <PanelLeftCloseIcon size={16} />
      ) : (
        <PanelLeftOpenIcon size={16} />
      )}
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

function SidebarRail({ className, ...props }: React.ComponentProps<'button'>) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        'absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border sm:flex',
        'in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize',
        '[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize',
        'group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar',
        '[[data-side=left][data-collapsible=offcanvas]_&]:-right-2',
        '[[data-side=right][data-collapsible=offcanvas]_&]:-left-2',
        className,
      )}
      {...props}
    />
  );
}

function SidebarInset({ className, ...props }: React.ComponentProps<'main'>) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        'relative flex w-full flex-1 flex-col bg-background',
        'md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2',
        className,
      )}
      {...props}
    />
  );
}

function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn('h-8 w-full bg-background shadow-none', className)}
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn('flex flex-col gap-2 p-2', className)}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn('flex flex-col gap-2 p-2', className)}
      {...props}
    />
  );
}

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn('mx-2 w-auto bg-sidebar-border', className)}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        'scrollbar-none flex min-h-0 flex-1 flex-col gap-0 overflow-auto group-data-[collapsible=icon]:overflow-hidden',
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn('relative flex w-full min-w-0 flex-col p-2', className)}
      {...props}
    />
  );
}

function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'div'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'div';

  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        'flex h-7 shrink-0 items-center rounded-md px-2 text-xs font-normal text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
        'group-data-[collapsible=icon]:-mt-7 group-data-[collapsible=icon]:opacity-0',
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      className={cn(
        'absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
        'after:absolute after:-inset-2 md:after:hidden',
        'group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn('w-full text-sm', className)}
      {...props}
    />
  );
}

function SidebarMenu({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn('flex w-full min-w-0 flex-col gap-1', className)}
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn('group/menu-item relative', className)}
      {...props}
    />
  );
}

const sidebarMenuButtonVariants = cva(
  'peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-active:font-normal data-active:text-sidebar-accent-foreground data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground group-has-data-[sidebar=menu-action]/menu-item:pr-8   [&>span:last-child]:truncate [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'hover:bg-sidebar-accent active:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        outline:
          'bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]',
      },
      size: {
        default: 'h-7 text-sm',
        sm: 'h-6 text-xs',
        lg: 'h-12 text-sm ',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = 'default',
  size = 'default',
  tooltip,
  className,
  ...props
}: React.ComponentProps<'button'> & {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string | React.ComponentProps<typeof TooltipContent>;
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const Comp = asChild ? Slot.Root : 'button';
  const { isMobile, state } = useSidebar();

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    />
  );

  if (!tooltip) {
    return button;
  }

  if (typeof tooltip === 'string') {
    tooltip = {
      children: tooltip,
    };
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        hidden={state !== 'collapsed' || isMobile}
        {...tooltip}
      />
    </Tooltip>
  );
}

function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<'button'> & {
  asChild?: boolean;
  showOnHover?: boolean;
}) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      className={cn(
        'absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform peer-hover/menu-button:text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
        'after:absolute after:-inset-2 md:after:hidden',
        'peer-data-[size=sm]/menu-button:top-1',
        'peer-data-[size=default]/menu-button:top-1.5',
        'peer-data-[size=lg]/menu-button:top-2.5',
        'group-data-[collapsible=icon]:hidden',
        showOnHover &&
          'peer-data-active/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-open:opacity-100 md:opacity-0',
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        'pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium text-sidebar-foreground tabular-nums select-none',
        'peer-hover/menu-button:text-sidebar-accent-foreground peer-data-active/menu-button:text-sidebar-accent-foreground',
        'peer-data-[size=sm]/menu-button:top-1',
        'peer-data-[size=default]/menu-button:top-1.5',
        'peer-data-[size=lg]/menu-button:top-2.5',
        'group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<'div'> & {
  showIcon?: boolean;
}) {
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn('flex h-7 items-center gap-2 rounded-md px-2', className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            '--skeleton-width': width,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        'mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5',
        'group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn('group/menu-sub-item relative', className)}
      {...props}
    />
  );
}

function SidebarMenuSubButton({
  asChild = false,
  size = 'md',
  isActive = false,
  className,
  ...props
}: React.ComponentProps<'a'> & {
  asChild?: boolean;
  size?: 'sm' | 'md';
  isActive?: boolean;
}) {
  const Comp = asChild ? Slot.Root : 'a';

  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        'flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground ring-sidebar-ring outline-hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground',
        'data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground',
        size === 'sm' && 'text-xs',
        size === 'md' && 'text-sm',
        'group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarContext,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};

type SidebarContextProps = {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
  hoverMode: boolean;
  isHoverExpanded: boolean;
  shouldElevateZIndex: boolean;
  setHovered: (hovered: boolean) => void;
  closeDragOffset: number;
  setCloseDragOffset: (offset: number) => void;
  isResizing: boolean;
  setIsResizing: (resizing: boolean) => void;
};
