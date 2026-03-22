/**
 * Jewellery list for AR try-on: images from src/assets/jewellery/*.png
 * + metadata from src/assets/configs/jewellery.json
 */

import jewelleryConfig from '../assets/configs/jewellery.json';

/** Vite resolves each PNG to a public URL */
const jewelImageModules = import.meta.glob<string>('../assets/jewellery/*.png', {
  eager: true,
  import: 'default',
});

type JsonRow = {
  file: string;
  path: string;
  name: string;
  price: string;
  color: string;
  gem: string;
  x: number;
  y: number;
  dw: number;
  dh: number;
  /** Fraction of face height to push overlay down (necklace on neck). */
  drop_factor?: number;
  /** Scale dw/dh against face height instead of width. */
  use_face_height?: boolean;
};

export type JewelleryCatalogItem = JsonRow & {
  id: string;
  imageUrl: string;
};

function resolveImageUrl(file: string): string | undefined {
  const entry = Object.entries(jewelImageModules).find(([key]) => key.endsWith(`/${file}`));
  return entry?.[1];
}

/**
 * Ordered list: only entries whose `file` exists under src/assets/jewellery/
 */
export function getJewelleryCatalog(): JewelleryCatalogItem[] {
  const config = jewelleryConfig as Record<string, JsonRow>;
  const items: JewelleryCatalogItem[] = [];

  for (const id of Object.keys(config).sort()) {
    const row = config[id];
    const file = row.file || row.path.split('/').pop() || '';
    const imageUrl = resolveImageUrl(file);
    if (!imageUrl) continue;
    items.push({ id, ...row, file, imageUrl });
  }

  return items;
}
