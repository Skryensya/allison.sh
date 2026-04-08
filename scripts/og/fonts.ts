import { readFile } from 'node:fs/promises';

import { FONT_BOLD_PATH, FONT_REGULAR_PATH } from './config';
import { toArrayBuffer } from './utils';

let fontDataPromise:
  | Promise<
      [
        { name: string; data: ArrayBuffer; weight: 400; style: 'normal' },
        { name: string; data: ArrayBuffer; weight: 700; style: 'normal' },
      ]
    >
  | undefined;

export async function loadFonts() {
  if (!fontDataPromise) {
    fontDataPromise = Promise.all([readFile(FONT_REGULAR_PATH), readFile(FONT_BOLD_PATH)]).then(
      ([regular, bold]) => [
        {
          name: 'Satoshi',
          data: toArrayBuffer(regular),
          weight: 400 as const,
          style: 'normal' as const,
        },
        {
          name: 'Satoshi',
          data: toArrayBuffer(bold),
          weight: 700 as const,
          style: 'normal' as const,
        },
      ],
    );
  }

  return fontDataPromise;
}
