import path from 'node:path';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
export const TWITTER_WIDTH = 1200;
export const TWITTER_HEIGHT = 600;
export const SOCIAL_IMAGE_EXTENSION = 'jpg';
export const SOCIAL_JPEG_QUALITY = 86;
export const ROOT_DIR = process.cwd();
export const OG_OUTPUT_DIR = path.join(ROOT_DIR, 'public', 'og');
export const TWITTER_OUTPUT_DIR = path.join(ROOT_DIR, 'public', 'twitter');
export const PROJECTS_DIR = path.join(ROOT_DIR, 'src', 'content', 'proyectos');
export const FONT_REGULAR_PATH = path.join(ROOT_DIR, 'src', 'assets', 'fonts', 'satoshi-400.ttf');
export const FONT_BOLD_PATH = path.join(ROOT_DIR, 'src', 'assets', 'fonts', 'satoshi-700.ttf');

export const COLORS = {
  background: '#0F0F0E',
  text: '#E0DDD8',
  muted: '#9B9590',
  subtle: '#858280',
  border: '#4A4740',
  folder: '#393836',
  folderEdge: '#4A4740',
  folderShadow: 'rgba(0, 0, 0, 0.22)',
  glow: 'rgba(244, 241, 235, 0.08)',
} as const;

export type SocialVariant = 'og' | 'twitter';

export interface PageEntry {
  title: string;
  description: string;
  slug: string;
}

export interface FolderGeometry {
  width: number;
  height: number;
  flapHeight: number;
  topLeftRadius: number;
  rightInset: number;
  rightDrop: number;
  flapCurve: number;
  bottomRadius: number;
  flapStart: number;
  flapEnd: number;
  topInset: number;
  topLift: number;
}
