import { Node } from '@xyflow/react';
import { getFontEmbedCSS, toCanvas } from 'html-to-image';

import { ApNodeType } from './types';

// collecting font-face CSS downloads and base64-encodes every font; do it
// once per session instead of on every capture
let cachedFontEmbedCss: string | null = null;

async function downloadFlowAsImage({
  nodes,
  flowName,
}: {
  nodes: Node[];
  flowName: string;
}): Promise<void> {
  const viewportElement = document.querySelector<HTMLElement>(
    '.react-flow__viewport',
  );
  const flowNodes = nodes.filter((node) => node.type !== ApNodeType.NOTE);
  if (!viewportElement || flowNodes.length === 0) {
    return;
  }
  // let the capturing state paint before the heavy work blocks the main thread
  await new Promise((resolve) => setTimeout(resolve, 0));
  const bounds = calculateNodesBoundsFromDom(flowNodes);
  if (!bounds) {
    return;
  }
  const contentWidth = bounds.width + 2 * IMAGE_PADDING;
  const contentHeight = bounds.height + 2 * IMAGE_PADDING;
  // long flows can exceed the browser canvas size limit, so trade resolution for coverage
  const scale = Math.min(
    PREFERRED_PIXEL_SCALE,
    MAX_IMAGE_DIMENSION / contentWidth,
    MAX_IMAGE_DIMENSION / contentHeight,
  );
  const imageWidth = Math.round(contentWidth * scale);
  const imageHeight = Math.round(contentHeight * scale);
  cachedFontEmbedCss =
    cachedFontEmbedCss ?? (await getFontEmbedCSS(viewportElement));
  const restoreSvgStyles = inlineSvgStylesForCapture(viewportElement);
  let flowCanvas: HTMLCanvasElement;
  try {
    flowCanvas = await toCanvas(viewportElement, {
      pixelRatio: 1,
      fontEmbedCSS: cachedFontEmbedCss,
      filter: isCapturedElement,
      width: imageWidth,
      height: imageHeight,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${(IMAGE_PADDING - bounds.x) * scale}px, ${
          (IMAGE_PADDING - bounds.y) * scale
        }px) scale(${scale})`,
      },
    });
  } finally {
    restoreSvgStyles();
  }
  const composedCanvas = composeImageWithCanvasBackground({
    flowCanvas,
    imageWidth,
    imageHeight,
    bounds,
    scale,
  });
  // toBlob encodes the PNG off the main thread, unlike toDataURL which
  // freezes the tab for large flows
  const blob = await new Promise<Blob | null>((resolve) =>
    composedCanvas.toBlob(resolve, 'image/png'),
  );
  if (!blob) {
    throw new Error('Failed to encode the flow image');
  }
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${sanitizeFileName(flowName)}.png`;
  link.href = objectUrl;
  link.click();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}

function isCapturedElement(domNode: HTMLElement): boolean {
  if (!(domNode instanceof Element)) {
    return true;
  }
  const isBuilderChrome = domNode.classList.contains(
    'react-flow__viewport-portal',
  );
  const isNote = domNode.classList.contains(
    `react-flow__node-${ApNodeType.NOTE}`,
  );
  const isExcluded = domNode.hasAttribute(SCREENSHOT_EXCLUDE_ATTRIBUTE);
  return !isBuilderChrome && !isNote && !isExcluded;
}

/**
 * React Flow reports node sizes on its internal nodes, but the nodes returned
 * by getNodes() in the builder don't carry `measured` dimensions, so the
 * rendered DOM elements are the source of truth for each node's size.
 */
function calculateNodesBoundsFromDom(
  nodes: Node[],
): { x: number; y: number; width: number; height: number } | null {
  const boxes = nodes.flatMap((node) => {
    const nodeElement = document.querySelector<HTMLElement>(
      `.react-flow__node[data-id="${CSS.escape(node.id)}"]`,
    );
    if (!nodeElement) {
      return [];
    }
    return [
      {
        left: node.position.x,
        top: node.position.y,
        right: node.position.x + nodeElement.offsetWidth,
        bottom: node.position.y + nodeElement.offsetHeight,
      },
    ];
  });
  if (boxes.length === 0) {
    return null;
  }
  const left = Math.min(...boxes.map((box) => box.left));
  const top = Math.min(...boxes.map((box) => box.top));
  const right = Math.max(...boxes.map((box) => box.right));
  const bottom = Math.max(...boxes.map((box) => box.bottom));
  return { x: left, y: top, width: right - left, height: bottom - top };
}

/**
 * html-to-image keeps DOM attributes but drops stylesheet-applied styling
 * everywhere inside <svg> subtrees — the edge lines lose their stroke and the
 * HTML inside edge foreignObjects (branch labels, add buttons) renders
 * unstyled. Inline the computed styles on every element inside the viewport's
 * SVGs for the capture, and restore the originals afterwards.
 */
function inlineSvgStylesForCapture(viewportElement: HTMLElement): () => void {
  // only the edge layer's svgs lose styling; svgs inside node HTML are
  // handled correctly by html-to-image
  const elements = Array.from(
    viewportElement.querySelectorAll('.react-flow__edges svg'),
  )
    .flatMap((svg) => [svg, ...Array.from(svg.querySelectorAll('*'))])
    .filter(
      (element): element is HTMLElement | SVGElement =>
        element instanceof HTMLElement || element instanceof SVGElement,
    );
  const computedStyleTexts = elements.map((element) =>
    serializeComputedStyle(element),
  );
  const previousStyles = elements.map((element) =>
    element.getAttribute('style'),
  );
  elements.forEach((element, index) => {
    if (computedStyleTexts[index]) {
      element.setAttribute('style', computedStyleTexts[index]);
    }
  });
  return () =>
    elements.forEach((element, index) => {
      const previousStyle = previousStyles[index];
      if (previousStyle === null) {
        element.removeAttribute('style');
      } else {
        element.setAttribute('style', previousStyle);
      }
    });
}

function serializeComputedStyle(element: HTMLElement | SVGElement): string {
  const computedStyle = getComputedStyle(element);
  return CAPTURE_STYLE_PROPERTIES.flatMap((property) => {
    const value = computedStyle.getPropertyValue(property);
    return value === '' ? [] : [`${property}: ${value};`];
  }).join(' ');
}

function composeImageWithCanvasBackground({
  flowCanvas,
  imageWidth,
  imageHeight,
  bounds,
  scale,
}: {
  flowCanvas: HTMLCanvasElement;
  imageWidth: number;
  imageHeight: number;
  bounds: { x: number; y: number };
  scale: number;
}): HTMLCanvasElement {
  const composedCanvas = document.createElement('canvas');
  composedCanvas.width = imageWidth;
  composedCanvas.height = imageHeight;
  const context = composedCanvas.getContext('2d');
  if (!context) {
    return flowCanvas;
  }
  context.fillStyle = getCanvasBackgroundColor();
  context.fillRect(0, 0, imageWidth, imageHeight);
  drawCanvasDotPattern({ context, imageWidth, imageHeight, bounds, scale });
  context.drawImage(flowCanvas, 0, 0, imageWidth, imageHeight);
  return composedCanvas;
}

/**
 * The dotted canvas background lives outside the captured viewport element
 * (React Flow draws it on a sibling layer), so redraw the same dot grid —
 * read from the live background pattern — onto the exported image.
 */
function drawCanvasDotPattern({
  context,
  imageWidth,
  imageHeight,
  bounds,
  scale,
}: {
  context: CanvasRenderingContext2D;
  imageWidth: number;
  imageHeight: number;
  bounds: { x: number; y: number };
  scale: number;
}): void {
  const dotPattern = readBackgroundDotPattern();
  if (!dotPattern) {
    return;
  }
  const gap = dotPattern.gap * scale;
  const radius = dotPattern.radius * scale;
  if (gap < 1 || radius <= 0) {
    return;
  }
  // drawing one tile and repeating it is orders of magnitude faster than
  // arc-filling every dot on a large export
  const tile = document.createElement('canvas');
  tile.width = Math.max(1, Math.round(gap));
  tile.height = Math.max(1, Math.round(gap));
  const tileContext = tile.getContext('2d');
  if (!tileContext) {
    return;
  }
  tileContext.fillStyle = dotPattern.color;
  tileContext.beginPath();
  tileContext.arc(radius, radius, radius, 0, 2 * Math.PI);
  tileContext.fill();
  const pattern = context.createPattern(tile, 'repeat');
  if (!pattern) {
    return;
  }
  const originX = positiveModulo((IMAGE_PADDING - bounds.x) * scale, gap);
  const originY = positiveModulo((IMAGE_PADDING - bounds.y) * scale, gap);
  context.save();
  context.translate(originX, originY);
  context.fillStyle = pattern;
  context.fillRect(-originX, -originY, imageWidth + gap, imageHeight + gap);
  context.restore();
}

function readBackgroundDotPattern(): {
  gap: number;
  radius: number;
  color: string;
} | null {
  const patternElement = document.querySelector<SVGPatternElement>(
    '.react-flow__background pattern',
  );
  const circleElement = patternElement?.querySelector('circle');
  const viewportElement = document.querySelector<HTMLElement>(
    '.react-flow__viewport',
  );
  if (!patternElement || !circleElement || !viewportElement) {
    return null;
  }
  const zoomMatch = viewportElement.style.transform.match(/scale\(([\d.]+)\)/);
  const zoom = zoomMatch ? Number(zoomMatch[1]) : NaN;
  if (!Number.isFinite(zoom) || zoom <= 0) {
    return null;
  }
  return {
    gap: patternElement.width.baseVal.value / zoom,
    radius: circleElement.r.baseVal.value / zoom,
    color: getComputedStyle(circleElement).fill,
  };
}

function positiveModulo(value: number, modulo: number): number {
  return ((value % modulo) + modulo) % modulo;
}

function getCanvasBackgroundColor(): string {
  // the canvas element itself can have a transparent background (the visible
  // color then comes from a parent), so walk up to the first painted one
  let element = document.querySelector<HTMLElement>('.react-flow');
  while (element) {
    const backgroundColor = getComputedStyle(element).backgroundColor;
    if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
      return backgroundColor;
    }
    element = element.parentElement;
  }
  return '#ffffff';
}

function sanitizeFileName(name: string): string {
  const sanitized = name.replace(/[^a-zA-Z0-9-_ ]/g, '').trim();
  return sanitized.length > 0 ? sanitized : 'flow';
}

const IMAGE_PADDING = 60;
const MAX_IMAGE_DIMENSION = 8192;
const PREFERRED_PIXEL_SCALE = 2;
const SCREENSHOT_EXCLUDE_ATTRIBUTE = 'data-flow-screenshot-exclude';
const CAPTURE_STYLE_PROPERTIES = [
  'display',
  'position',
  'top',
  'left',
  'right',
  'bottom',
  'transform',
  'overflow',
  'visibility',
  'opacity',
  'box-sizing',
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
  'flex-direction',
  'align-items',
  'justify-content',
  'gap',
  'flex-grow',
  'flex-shrink',
  'flex-basis',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-top-style',
  'border-right-style',
  'border-bottom-style',
  'border-left-style',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-right-radius',
  'border-bottom-left-radius',
  'background-color',
  'box-shadow',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'letter-spacing',
  'color',
  '-webkit-text-fill-color',
  'text-shadow',
  'text-align',
  'white-space',
  'text-overflow',
  'text-transform',
  'stroke',
  'stroke-width',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-opacity',
  'fill',
  'fill-opacity',
];

export const flowScreenshotUtils = {
  downloadFlowAsImage,
  SCREENSHOT_EXCLUDE_ATTRIBUTE,
};
