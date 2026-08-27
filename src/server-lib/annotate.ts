import sharp from 'sharp';

import type {MappedDetection} from './label-map';

const PALETTE = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

/**
 * Draws boxes via an SVG overlay composited by sharp, which avoids pulling in a
 * native canvas binding.
 */
export async function annotate(
  image: Buffer,
  detections: MappedDetection[],
  width: number,
  height: number,
): Promise<Buffer> {
  const base = sharp(image).rotate().jpeg({quality: 88});
  if (!detections.length) {
    return base.toBuffer();
  }

  const stroke = Math.max(2, Math.round(Math.min(width, height) * 0.005));
  const fontSize = Math.max(12, Math.round(Math.min(width, height) * 0.028));

  const shapes = detections
    .map((d, i) => {
      const color = PALETTE[i % PALETTE.length];
      const x = Math.round(d.box.x);
      const y = Math.round(d.box.y);
      const w = Math.round(d.box.width);
      const h = Math.round(d.box.height);
      const label = `${d.type} ${(d.confidence * 100).toFixed(0)}%`;
      const labelWidth = Math.round(label.length * fontSize * 0.6) + fontSize;
      const labelY = Math.max(0, y - fontSize - stroke * 2);

      return [
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${color}" stroke-width="${stroke}"/>`,
        `<rect x="${x}" y="${labelY}" width="${labelWidth}" height="${fontSize + stroke * 2}" fill="${color}"/>`,
        `<text x="${x + fontSize * 0.3}" y="${labelY + fontSize}" font-family="sans-serif" font-size="${fontSize}" fill="#ffffff">${escapeXml(label)}</text>`,
      ].join('');
    })
    .join('');

  const overlay = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${shapes}</svg>`,
  );

  return base.composite([{input: overlay, top: 0, left: 0}]).toBuffer();
}

function escapeXml(value: string): string {
  return value.replace(
    /[<>&'"]/g,
    (c) => ({'<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'})[c]!,
  );
}
