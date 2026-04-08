import satori from 'satori';
import { html } from 'satori-html';

import { createAvatarSvg } from './avatar';
import { COLORS, OG_HEIGHT, OG_WIDTH, TWITTER_HEIGHT, TWITTER_WIDTH, type SocialVariant } from './config';
import { createFolderGeometry, createFolderPath } from './folder';
import { escapeHtml, truncateText } from './utils';

const VARIANT_LAYOUT = {
  og: {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    titleMax: 60,
    descriptionMax: 190,
    frameTranslateY: 46,
    folderWidthBoost: 44,
    folderHeightBoost: 162,
    urlTop: 12,
    urlRight: 42,
    urlSize: 30,
    contentLeft: 64,
    contentRight: 64,
    contentTop: 82,
    contentBottom: 152,
    avatarSize: 270,
    gap: 52,
    contentMaxWidth: 716,
    contentPadTop: 8,
    avatarOffsetX: 2,
    avatarOffsetY: 86,
    textOffsetY: 34,
    eyebrowSize: 19,
    eyebrowMarginBottom: 16,
    titleSize: 74,
    titleLineHeight: 1.04,
    titleMarginBottom: 24,
    descriptionSize: 31,
    descriptionLineHeight: 1.42,
    ctaMarginTop: 28,
    ctaFontSize: 23,
    ctaPaddingX: 18,
    ctaPaddingY: 12,
  },
  twitter: {
    width: TWITTER_WIDTH,
    height: TWITTER_HEIGHT,
    titleMax: 54,
    descriptionMax: 150,
    frameTranslateY: 0,
    frameLeft: 8,
    frameBottom: 0,
    folderWidth: TWITTER_WIDTH - 16,
    folderHeight: 540,
    folderWidthBoost: 0,
    folderHeightBoost: 0,
    urlTop: 18,
    urlRight: 34,
    urlSize: 30,
    contentLeft: 56,
    contentRight: 56,
    contentTop: 64,
    contentBottom: 82,
    avatarSize: 262,
    gap: 36,
    contentMaxWidth: 700,
    contentPadTop: 0,
    avatarOffsetX: 40,
    avatarOffsetY: 98,
    textOffsetY: 34,
    eyebrowSize: 17,
    eyebrowMarginBottom: 14,
    titleSize: 66,
    titleLineHeight: 1.04,
    titleMarginBottom: 20,
    descriptionSize: 30,
    descriptionLineHeight: 1.42,
    ctaMarginTop: 26,
    ctaFontSize: 22,
    ctaPaddingX: 20,
    ctaPaddingY: 12,
  },
} as const;

export async function renderSocialSvg(
  title: string,
  description: string,
  slug: string,
  fonts: Array<{ name: string; data: ArrayBuffer; weight: 400 | 700; style: 'normal' }>,
  variant: SocialVariant,
): Promise<string> {
  const layout = VARIANT_LAYOUT[variant];
  const safeTitle = truncateText(title, layout.titleMax);
  const safeDescription = truncateText(description, layout.descriptionMax);
  const avatarSvg = await createAvatarSvg();
  const isHome = slug === 'index';
  const pageUrlBase = 'Allison.sh';
  const pageUrlSuffix = isHome ? '' : `/proyectos/${slug}`;
  const eyebrow = isHome ? 'Portfolio personal' : 'Proyecto seleccionado';
  const ctaLabel = isHome ? 'Ver proyectos →' : 'Leer proyecto →';
  const baseFolderGeometry = createFolderGeometry(safeTitle);
  const folderGeometry = {
    ...baseFolderGeometry,
    width: layout.folderWidth ?? baseFolderGeometry.width + layout.folderWidthBoost,
    height: layout.folderHeight ?? baseFolderGeometry.height + layout.folderHeightBoost,
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
              radial-gradient(circle at 100% 0%, rgba(244,241,235,0.12) 0%, rgba(244,241,235,0.06) 18%, transparent 48%),
              radial-gradient(circle at 84% 60%, rgba(233,219,196,0.09) 0%, rgba(233,219,196,0.035) 20%, transparent 42%),
              radial-gradient(circle at 78% 66%, rgba(244,241,235,0.04) 0%, rgba(244,241,235,0.014) 16%, transparent 36%),
              linear-gradient(180deg, rgba(255,255,255,0.024) 0%, rgba(255,255,255,0.01) 22%, rgba(255,255,255,0) 56%),
              linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.06) 100%);
          "
        ></div>

        <div
          style="
            position: absolute;
            inset: 0;
            display: flex;
            background:
              radial-gradient(ellipse 92% 30% at 50% 100%, rgba(233,219,196,0.11) 0%, rgba(233,219,196,0.045) 24%, rgba(233,219,196,0.015) 42%, transparent 68%),
              linear-gradient(180deg, rgba(255,255,255,0) 72%, rgba(244,241,235,0.028) 88%, rgba(244,241,235,0.045) 100%),
              linear-gradient(90deg, rgba(255,255,255,0.012) 0%, rgba(255,255,255,0.004) 12%, rgba(255,255,255,0) 28%, rgba(255,255,255,0) 72%, rgba(255,255,255,0.02) 100%);
            opacity: 0.82;
          "
        ></div>

        <div
          style="
            position: ${variant === 'twitter' ? 'absolute' : 'relative'};
            ${variant === 'twitter' ? `left: ${layout.frameLeft}px; bottom: ${layout.frameBottom}px;` : ''}
            width: ${folderGeometry.width}px;
            height: ${folderGeometry.height}px;
            display: flex;
            transform: translateY(${layout.frameTranslateY}px) scaleY(0.988);
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
              top: ${layout.urlTop}px;
              right: ${layout.urlRight}px;
              display: flex;
              font-size: ${layout.urlSize}px;
              line-height: 1;
              font-weight: 700;
              letter-spacing: -0.04em;
              color: ${COLORS.text};
            "
          >
            <span style="display: flex; color: ${COLORS.text};">${escapeHtml(pageUrlBase)}</span>
            ${pageUrlSuffix ? `<span style="display: flex; color: ${COLORS.subtle};">${escapeHtml(pageUrlSuffix)}</span>` : ''}
          </div>

          <div
            style="
              position: absolute;
              left: ${layout.contentLeft}px;
              right: ${layout.contentRight}px;
              top: ${layout.contentTop}px;
              bottom: ${layout.contentBottom}px;
              display: flex;
              align-items: flex-start;
              gap: ${layout.gap}px;
            "
          >
            <div
              style="
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                align-items: flex-start;
                max-width: ${layout.contentMaxWidth}px;
                padding-top: ${layout.contentPadTop}px;
                transform: translateY(${layout.textOffsetY}px);
              "
            >
              <div
                style="
                  display: flex;
                  font-size: ${layout.eyebrowSize}px;
                  line-height: 1;
                  font-weight: 700;
                  letter-spacing: 0.08em;
                  text-transform: uppercase;
                  color: ${COLORS.subtle};
                  margin-bottom: ${layout.eyebrowMarginBottom}px;
                "
              >
                ${escapeHtml(eyebrow)}
              </div>

              <div
                style="
                  display: flex;
                  font-size: ${layout.titleSize}px;
                  line-height: ${layout.titleLineHeight};
                  font-weight: 700;
                  letter-spacing: -0.06em;
                  color: #ffffff;
                  margin-bottom: ${layout.titleMarginBottom}px;
                "
              >
                ${escapeHtml(safeTitle)}
              </div>

              <div
                style="
                  display: flex;
                  font-size: ${layout.descriptionSize}px;
                  line-height: ${layout.descriptionLineHeight};
                  font-weight: 400;
                  color: ${COLORS.text};
                  max-width: ${layout.contentMaxWidth}px;
                "
              >
                ${escapeHtml(safeDescription)}
              </div>

              <div
                style="
                  display: flex;
                  align-items: center;
                  align-self: flex-start;
                  margin-top: ${layout.ctaMarginTop}px;
                  padding: ${layout.ctaPaddingY}px ${layout.ctaPaddingX}px;
                  border: 1px solid rgba(224, 221, 216, 0.22);
                  border-radius: 999px;
                  background: rgba(244, 241, 235, 0.05);
                  color: #ffffff;
                  font-size: ${layout.ctaFontSize}px;
                  line-height: 1;
                  font-weight: 700;
                  letter-spacing: -0.03em;
                "
              >
                ${escapeHtml(ctaLabel)}
              </div>
            </div>

            <div
              style="
                width: ${layout.avatarSize}px;
                min-width: ${layout.avatarSize}px;
                height: ${layout.avatarSize}px;
                display: flex;
                align-items: center;
                justify-content: center;
                transform: translate(${layout.avatarOffsetX}px, ${layout.avatarOffsetY}px);
              "
            >
              ${avatarSvg}
            </div>
          </div>
        </div>
      </div>
    `),
    {
      width: layout.width,
      height: layout.height,
      fonts,
    },
  );
}
