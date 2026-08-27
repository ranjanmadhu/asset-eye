import sharp from 'sharp';

export interface LetterboxResult {
  tensor: Float32Array;
  /** Scale applied to the original image before padding. */
  scale: number;
  padX: number;
  padY: number;
  originalWidth: number;
  originalHeight: number;
}

/**
 * Resizes into a square canvas preserving aspect ratio, so boxes can be mapped
 * back to original pixel coordinates via `scale`/`padX`/`padY`.
 */
export async function letterbox(
  image: Buffer,
  size: number,
): Promise<LetterboxResult> {
  const source = sharp(image).rotate();
  const metadata = await source.metadata();
  const originalWidth = metadata.width ?? 0;
  const originalHeight = metadata.height ?? 0;
  if (!originalWidth || !originalHeight) {
    throw new Error('Unable to read image dimensions.');
  }

  const scale = Math.min(size / originalWidth, size / originalHeight);
  const resizedWidth = Math.round(originalWidth * scale);
  const resizedHeight = Math.round(originalHeight * scale);
  const padX = Math.floor((size - resizedWidth) / 2);
  const padY = Math.floor((size - resizedHeight) / 2);

  const {data} = await source
    .resize(resizedWidth, resizedHeight, {fit: 'fill'})
    .extend({
      top: padY,
      bottom: size - resizedHeight - padY,
      left: padX,
      right: size - resizedWidth - padX,
      background: {r: 114, g: 114, b: 114},
    })
    .removeAlpha()
    .raw()
    .toBuffer({resolveWithObject: true});

  const plane = size * size;
  const tensor = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    tensor[i] = data[i * 3] / 255;
    tensor[plane + i] = data[i * 3 + 1] / 255;
    tensor[plane * 2 + i] = data[i * 3 + 2] / 255;
  }

  return {tensor, scale, padX, padY, originalWidth, originalHeight};
}
