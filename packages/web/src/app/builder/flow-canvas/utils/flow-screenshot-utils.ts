import { tryCatch } from '@activepieces/shared';
import { Node } from '@xyflow/react';
import { getFontEmbedCSS } from 'html-to-image';

import { ApNodeType } from './types';

// collecting font-face CSS downloads and base64-encodes every font; do it
// once per session instead of on every capture
let cachedFontEmbedCss: string | null = null;
const imageDataUrlCache = new Map<string, Promise<string | null>>();

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
  // let the capturing state paint before any work happens
  await yieldToMain();
  const bounds = calculateNodesBoundsFromDom(flowNodes);
  if (!bounds) {
    return;
  }
  const exportLayout = calculateExportLayout(bounds);
  const captureSvgUrl = await buildCaptureSvgUrl({
    viewportElement,
    exportLayout,
  });
  const flowImage = new Image();
  flowImage.src = captureSvgUrl;
  // decoding happens off the main thread
  await flowImage.decode();
  const composedCanvas = composeImageWithCanvasBackground({
    flowImage,
    viewportElement,
    exportLayout,
  });
  await downloadCanvasAsPng({
    canvas: composedCanvas,
    fileName: `${sanitizeFileName(flowName)}.png`,
  });
}

/**
 * The exported image covers the node bounds plus padding, scaled up for
 * crispness — unless that would exceed the browser canvas size limit, in
 * which case resolution is traded for coverage. `origin` is where the flow
 * coordinate system's padded top-left corner lands in image pixels; both the
 * capture transform and the dot grid alignment derive from it.
 */
function calculateExportLayout(bounds: Bounds): ExportLayout {
  const contentWidth = bounds.width + 2 * IMAGE_PADDING;
  const contentHeight = bounds.height + 2 * IMAGE_PADDING;
  const scale = Math.min(
    PREFERRED_PIXEL_SCALE,
    MAX_IMAGE_DIMENSION / contentWidth,
    MAX_IMAGE_DIMENSION / contentHeight,
  );
  const origin = {
    x: (IMAGE_PADDING - bounds.x) * scale,
    y: (IMAGE_PADDING - bounds.y) * scale,
  };
  return {
    scale,
    imageWidth: Math.round(contentWidth * scale),
    imageHeight: Math.round(contentHeight * scale),
    origin,
    transform: `translate(${origin.x}px, ${origin.y}px) scale(${scale})`,
  };
}

async function downloadCanvasAsPng({
  canvas,
  fileName,
}: {
  canvas: HTMLCanvasElement;
  fileName: string;
}): Promise<void> {
  // toBlob encodes the PNG off the main thread, unlike toDataURL which
  // freezes the tab for large flows
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  );
  if (!blob) {
    throw new Error('Failed to encode the flow image');
  }
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = fileName;
  link.href = objectUrl;
  link.click();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}

/**
 * Hand-rolled replacement for html-to-image's clone phase. That library
 * copies the full computed style (~350 longhands) of every element in one
 * synchronous pass, which freezes the tab for seconds on large flows. This
 * pipeline copies only the properties that affect how the flow paints and
 * stays responsive by yielding between chunks of style reads.
 */
async function buildCaptureSvgUrl({
  viewportElement,
  exportLayout,
}: {
  viewportElement: HTMLElement;
  exportLayout: ExportLayout;
}): Promise<string> {
  const { imageWidth, imageHeight, transform } = exportLayout;
  cachedFontEmbedCss =
    cachedFontEmbedCss ?? (await getFontEmbedCSS(viewportElement));
  const clonedViewport = await cloneViewportWithCapturedStyles(viewportElement);
  await inlineImageSources(clonedViewport);
  clonedViewport.style.transform = transform;
  clonedViewport.style.overflow = 'visible';
  const fontStyleElement = document.createElement('style');
  fontStyleElement.textContent = cachedFontEmbedCss;
  clonedViewport.insertBefore(fontStyleElement, clonedViewport.firstChild);
  const serializedClone = new XMLSerializer().serializeToString(clonedViewport);
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${imageWidth}" height="${imageHeight}"><foreignObject width="${imageWidth}" height="${imageHeight}" style="overflow: visible;">${serializedClone}</foreignObject></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
}

/**
 * Clones the viewport and inlines each element's captured styles onto its
 * clone. The clone is taken first so the tree shape is frozen — document
 * -order walks of both trees then stay in lockstep. All style reads happen
 * before any write: interleaving them forces a full style recalculation per
 * element, and writes only touch the detached clone, so the live page never
 * reflows.
 */
async function cloneViewportWithCapturedStyles(
  viewportElement: HTMLElement,
): Promise<HTMLElement> {
  const clonedViewport = viewportElement.cloneNode(true) as HTMLElement;
  const originalElements = [
    viewportElement,
    ...Array.from(viewportElement.querySelectorAll('*')),
  ];
  const clonedElements = [
    clonedViewport,
    ...Array.from(clonedViewport.querySelectorAll('*')),
  ];
  const styleTexts: (string | null)[] = [];
  for (let index = 0; index < originalElements.length; index++) {
    const element = originalElements[index];
    styleTexts.push(
      element instanceof HTMLElement || element instanceof SVGElement
        ? serializeComputedStyle(element)
        : null,
    );
    if (index % STYLE_READ_CHUNK_SIZE === STYLE_READ_CHUNK_SIZE - 1) {
      await yieldToMain();
    }
  }
  const elementsToRemove = clonedElements.filter(
    (clonedElement) => !isCapturedElement(clonedElement),
  );
  clonedElements.forEach((clonedElement, index) => {
    const styleText = styleTexts[index];
    if (styleText) {
      clonedElement.setAttribute('style', styleText);
    }
  });
  elementsToRemove.forEach((element) => element.remove());
  return clonedViewport;
}

function isCapturedElement(domNode: Element): boolean {
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
function calculateNodesBoundsFromDom(nodes: Node[]): Bounds | null {
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

function serializeComputedStyle(element: HTMLElement | SVGElement): string {
  const computedStyle = getComputedStyle(element);
  return CAPTURE_STYLE_PROPERTIES.flatMap((property) => {
    const value = computedStyle.getPropertyValue(property);
    return value === '' ? [] : [`${property}: ${value};`];
  }).join(' ');
}

/**
 * The rasterizer renders the SVG in an isolated document with no network
 * access, so every <img> source must be inlined as a data URL.
 */
async function inlineImageSources(clonedViewport: HTMLElement): Promise<void> {
  const images = Array.from(clonedViewport.querySelectorAll('img'));
  await Promise.all(
    images.map(async (image) => {
      image.removeAttribute('srcset');
      const source = image.getAttribute('src');
      if (!source || source.startsWith('data:')) {
        return;
      }
      const dataUrl = await getImageDataUrl(source);
      if (dataUrl) {
        image.setAttribute('src', dataUrl);
      }
    }),
  );
}

function getImageDataUrl(source: string): Promise<string | null> {
  const cached = imageDataUrlCache.get(source);
  if (cached) {
    return cached;
  }
  const pending = fetchImageAsDataUrl(source);
  imageDataUrlCache.set(source, pending);
  return pending;
}

async function fetchImageAsDataUrl(source: string): Promise<string | null> {
  const { data } = await tryCatch(async () => {
    const response = await fetch(source);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  });
  return data;
}

function composeImageWithCanvasBackground({
  flowImage,
  viewportElement,
  exportLayout,
}: {
  flowImage: HTMLImageElement;
  viewportElement: HTMLElement;
  exportLayout: ExportLayout;
}): HTMLCanvasElement {
  const { imageWidth, imageHeight } = exportLayout;
  const composedCanvas = document.createElement('canvas');
  composedCanvas.width = imageWidth;
  composedCanvas.height = imageHeight;
  const context = composedCanvas.getContext('2d');
  if (!context) {
    throw new Error('Failed to create the flow image canvas');
  }
  context.fillStyle = getCanvasBackgroundColor();
  context.fillRect(0, 0, imageWidth, imageHeight);
  drawCanvasDotPattern({ context, viewportElement, exportLayout });
  context.drawImage(flowImage, 0, 0, imageWidth, imageHeight);
  return composedCanvas;
}

/**
 * The dotted canvas background lives outside the captured viewport element
 * (React Flow draws it on a sibling layer), so redraw the same dot grid —
 * read from the live background pattern — onto the exported image.
 */
function drawCanvasDotPattern({
  context,
  viewportElement,
  exportLayout,
}: {
  context: CanvasRenderingContext2D;
  viewportElement: HTMLElement;
  exportLayout: ExportLayout;
}): void {
  const { imageWidth, imageHeight, origin, scale } = exportLayout;
  const dotPattern = readBackgroundDotPattern(viewportElement);
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
  const tileSize = Math.max(1, Math.round(gap));
  const tile = document.createElement('canvas');
  tile.width = tileSize;
  tile.height = tileSize;
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
  const originX = positiveModulo(origin.x, gap);
  const originY = positiveModulo(origin.y, gap);
  context.save();
  context.translate(originX, originY);
  context.fillStyle = pattern;
  context.fillRect(-originX, -originY, imageWidth + gap, imageHeight + gap);
  context.restore();
}

function readBackgroundDotPattern(viewportElement: HTMLElement): {
  gap: number;
  radius: number;
  color: string;
} | null {
  const patternElement = document.querySelector<SVGPatternElement>(
    '.react-flow__background pattern',
  );
  const circleElement = patternElement?.querySelector('circle');
  if (!patternElement || !circleElement) {
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

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

const IMAGE_PADDING = 60;
const MAX_IMAGE_DIMENSION = 8192;
const PREFERRED_PIXEL_SCALE = 2;
const STYLE_READ_CHUNK_SIZE = 400;
const SCREENSHOT_EXCLUDE_ATTRIBUTE = 'data-flow-screenshot-exclude';
const CAPTURE_STYLE_PROPERTIES = [
  'display',
  'position',
  'top',
  'left',
  'right',
  'bottom',
  'z-index',
  'transform',
  'transform-origin',
  // tailwind's translate/rotate/scale utilities compile to the independent
  // transform properties, not `transform`
  'translate',
  'rotate',
  'scale',
  'overflow-x',
  'overflow-y',
  'visibility',
  'opacity',
  'filter',
  'box-sizing',
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
  'flex-direction',
  'flex-wrap',
  'align-items',
  'align-self',
  'justify-content',
  'gap',
  'flex-grow',
  'flex-shrink',
  'flex-basis',
  'order',
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
  'outline-width',
  'outline-style',
  'outline-color',
  'outline-offset',
  'background-color',
  'background-image',
  'background-size',
  'background-position',
  'background-repeat',
  'box-shadow',
  'object-fit',
  'object-position',
  'vertical-align',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'letter-spacing',
  'color',
  // an ancestor's resolved -webkit-text-fill-color inherits down over
  // `color`, so it must be pinned per element
  '-webkit-text-fill-color',
  'text-shadow',
  'text-align',
  'text-decoration-line',
  'text-decoration-color',
  'text-decoration-style',
  'white-space',
  'word-break',
  'overflow-wrap',
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

type Point = { x: number; y: number };

type Bounds = Point & { width: number; height: number };

type ExportLayout = {
  scale: number;
  imageWidth: number;
  imageHeight: number;
  origin: Point;
  transform: string;
};
