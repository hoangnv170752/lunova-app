/**
 * Jewellery list for AR try-on: backend presets + local preview assets from src/assets/jewellery/*.png
 */

import type { ArJewelleryPreset } from '../api/arTryOn';

/** Vite resolves each PNG to a public URL */
const jewelImageModules = import.meta.glob<string>('../assets/jewellery/*.png', {
  eager: true,
  import: 'default',
});

export type JewelleryCatalogItem = ArJewelleryPreset & {
  id: string;
  imageUrl: string;
};

function resolveImageUrl(file: string): string | undefined {
  const entry = Object.entries(jewelImageModules).find(([key]) => {
    const keyFile = key.split('/').pop();
    return keyFile === file;
  });
  return entry?.[1];
}

/**
 * Ordered list using backend presets. Only entries whose `file` exists locally are returned.
 */
export function buildJewelleryCatalog(presets: Record<string, ArJewelleryPreset>): JewelleryCatalogItem[] {
  const items: JewelleryCatalogItem[] = [];

  for (const id of Object.keys(presets).sort()) {
    const row = presets[id];
    const imageUrl = resolveImageUrl(row.file);
    if (!imageUrl) continue;
    items.push({ id, ...row, imageUrl });
  }

  return items;
}
