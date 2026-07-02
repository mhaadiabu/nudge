import type { IconSvgElement } from "@hugeicons/react-native";

function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

export function hugeiconToSvg(
  icon: IconSvgElement,
  options?: {
    size?: number;
    strokeWidth?: number;
    color?: string;
  },
): string {
  const size = options?.size ?? 24;
  const strokeWidth = options?.strokeWidth;
  const color = options?.color ?? "currentColor";

  const parts: string[] = [];

  for (const [tag, attrs] of icon) {
    const attrEntries = Object.entries(attrs).filter(([key]) => key !== "key");

    const attrStr = attrEntries
      .map(([key, val]) => {
        const svgKey = camelToKebab(key);
        let svgVal = String(val);
        if (svgVal === "currentColor") {
          svgVal = color;
        }
        if (svgKey === "stroke-width" && strokeWidth !== undefined) {
          svgVal = String(strokeWidth);
        }
        return `${svgKey}="${svgVal}"`;
      })
      .join(" ");

    parts.push(`<${tag} ${attrStr}/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" fill="none">${parts.join("")}</svg>`;
}
