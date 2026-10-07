const labelFade =
  'whitespace-nowrap transition-opacity duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[collapsible=icon]:opacity-0 motion-reduce:transition-none';

const hideWhenCollapsed =
  'grid grid-rows-[1fr] opacity-100 transition-[grid-template-rows,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[collapsible=icon]:grid-rows-[0fr] group-data-[collapsible=icon]:opacity-0 motion-reduce:transition-none';

const showWhenCollapsed =
  'grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[collapsible=icon]:grid-rows-[1fr] group-data-[collapsible=icon]:opacity-100 motion-reduce:transition-none';

const expand =
  'grid transition-[grid-template-rows,opacity,visibility] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none';

const rotate =
  'transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none';

const menuSurface =
  'rounded-lg p-1.5 [&_[data-slot=dropdown-menu-item]]:rounded-md [&_[data-slot=dropdown-menu-radio-item]]:rounded-md [&_[data-slot=dropdown-menu-sub-trigger]]:rounded-md';

const scrollArea =
  'overflow-x-hidden overflow-y-auto overscroll-contain [scrollbar-width:thin] group-data-[collapsible=icon]:[scrollbar-width:none] group-data-[collapsible=icon]:[&::-webkit-scrollbar]:hidden';

const fadeEdges =
  'snap-y snap-mandatory scroll-py-1.5 py-1.5 [mask-image:linear-gradient(to_bottom,transparent,black_6px,black_calc(100%-6px),transparent)] [&>li]:snap-start';

const fadeBottom =
  'pt-2 pb-3 [mask-image:linear-gradient(to_bottom,transparent,black_8px,black_calc(100%-20px),transparent)]';

export const sidebarStyles = {
  labelFade,
  hideWhenCollapsed,
  showWhenCollapsed,
  expand,
  rotate,
  menuSurface,
  scrollArea,
  fadeEdges,
  fadeBottom,
};
