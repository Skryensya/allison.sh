import satori from 'satori';
import { html } from 'satori-html';

import { createAvatarSvg } from './avatar';
import { COLORS, OG_HEIGHT, OG_WIDTH } from './config';
import { createFolderGeometry, createFolderPath } from './folder';
import { escapeHtml, truncateText } from './utils';

export async function renderOgSvg(
  title: string,
  description: string,
  slug: string,
  fonts: Array<{ name: string; data: ArrayBuffer; weight: 400 | 700; style: 'normal' }>,
): Promise<string> {
  const safeTitle = truncateText(title, 60);
  const safeDescription = truncateText(description, 190);
  const avatarSvg = await createAvatarSvg();
  const pageUrl = slug === 'index' ? 'Allison.sh' : `Allison.sh/proyectos/${slug}`;
  const baseFolderGeometry = createFolderGeometry(safeTitle);
  const folderGeometry = {
    ...baseFolderGeometry,
    width: baseFolderGeometry.width + 44,
    height: baseFolderGeometry.height + 150,
  };
  const folderPath = createFolderPath(folderGeometry);

  return satori(
    html(`
      <div
        style="
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: ${COLORS.background};
          color: ${COLORS.text};
          font-family: Satoshi;
        "
      >
        <div
          style="
            position: absolute;
            inset: 0;
            display: flex;
            background:
              radial-gradient(circle at 100% 0%, ${COLORS.glow} 0%, transparent 48%),
              linear-gradient(180deg, rgba(255,255,255,0.015) 0%, rgba(255,255,255,0) 100%);
          "
        ></div>

        <div
          style="
            position: relative;
            width: ${folderGeometry.width}px;
            height: ${folderGeometry.height}px;
            display: flex;
            transform: translateY(46px) scaleY(0.988);
          "
        >
          <svg
            width="${folderGeometry.width}"
            height="${folderGeometry.height}"
            viewBox="0 0 ${folderGeometry.width} ${folderGeometry.height}"
            style="position: absolute; inset: 0; display: flex; overflow: visible;"
          >
            <defs>
              <linearGradient id="folder-fill-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#4C4943" />
                <stop offset="46%" stop-color="#413E39" />
                <stop offset="100%" stop-color="#34322F" />
              </linearGradient>
              <linearGradient id="folder-inner-glow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="rgba(255,255,255,0.065)" />
                <stop offset="42%" stop-color="rgba(255,255,255,0.018)" />
                <stop offset="100%" stop-color="rgba(0,0,0,0.06)" />
              </linearGradient>
              <linearGradient id="folder-top-sheen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="rgba(255,255,255,0.1)" />
                <stop offset="26%" stop-color="rgba(255,255,255,0.035)" />
                <stop offset="100%" stop-color="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>
            <path d="${folderPath}" fill="${COLORS.folderShadow}" transform="translate(0 -26)" opacity="0.26" />
            <path d="${folderPath}" fill="#57524B" transform="translate(0 -8)" opacity="0.18" />
            <path d="${folderPath}" fill="${COLORS.border}" transform="translate(0 1)" opacity="0.92" />
            <path d="${folderPath}" fill="url(#folder-fill-gradient)" />
            <path d="${folderPath}" fill="url(#folder-top-sheen)" opacity="0.75" />
            <path d="${folderPath}" fill="url(#folder-inner-glow)" opacity="0.9" />
          </svg>

          <div
            style="
              position: absolute;
              top: 12px;
              right: 42px;
              display: flex;
              font-size: 30px;
              line-height: 1;
              font-weight: 700;
              letter-spacing: -0.04em;
              color: ${COLORS.text};
            "
          >
            ${escapeHtml(pageUrl)}
          </div>

          <div
            style="
              position: absolute;
              left: 64px;
              right: 58px;
              top: 86px;
              bottom: 132px;
              display: flex;
              align-items: center;
              gap: 52px;
            "
          >
            <div
              style="
                width: 244px;
                min-width: 244px;
                height: 244px;
                display: flex;
                align-items: center;
                justify-content: center;
              "
            >
              ${avatarSvg}
            </div>

            <div
              style="
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: center;
                max-width: 716px;
                padding-top: 18px;
              "
            >
              <div
                style="
                  display: flex;
                  font-size: 74px;
                  line-height: 0.98;
                  font-weight: 700;
                  letter-spacing: -0.06em;
                  color: #ffffff;
                  margin-bottom: 26px;
                "
              >
                ${escapeHtml(safeTitle)}
              </div>

              <div
                style="
                  display: flex;
                  font-size: 31px;
                  line-height: 1.36;
                  font-weight: 400;
                  color: ${COLORS.text};
                  max-width: 716px;
                "
              >
                ${escapeHtml(safeDescription)}
              </div>
            </div>
          </div>
        </div>
      </div>
    `),
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      fonts,
    },
  );
}
