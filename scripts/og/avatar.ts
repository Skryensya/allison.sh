import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { COLORS, ROOT_DIR } from './config';

const AVATAR_IMAGE_PATH = path.join(ROOT_DIR, 'src', 'assets', 'avatar', 'base-og-site-colors.jpeg');
const AVATAR_LIGHT = '#F4F1EB';

let avatarDataUriPromise: Promise<string> | null = null;

async function loadAvatarDataUri(): Promise<string> {
  if (!avatarDataUriPromise) {
    avatarDataUriPromise = readFile(AVATAR_IMAGE_PATH).then(
      (buffer: Buffer) => `data:image/jpeg;base64,${buffer.toString('base64')}`,
    );
  }

  return avatarDataUriPromise;
}

export async function createAvatarSvg(): Promise<string> {
  const avatarDataUri = await loadAvatarDataUri();

  return `
    <div
      style="
        width: 100%;
        height: 100%;
        display: flex;
        overflow: hidden;
        border-radius: 9999px;
        border: 2px solid ${COLORS.border};
        background: ${AVATAR_LIGHT};
        box-shadow:
          0 0 0 10px rgba(255,255,255,0.03),
          0 18px 40px rgba(0,0,0,0.18);
      "
    >
      <img
        src="${avatarDataUri}"
        width="100%"
        height="100%"
        style="
          width: 100%;
          height: 100%;
          display: flex;
          object-fit: cover;
          object-position: 50% 42%;
          opacity: 0.96;
        "
      />
    </div>
  `
    .replace(/\s+/g, ' ')
    .trim();
}
