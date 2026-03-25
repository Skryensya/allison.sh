export const avatarGridSize = 6;
export const avatarTileSize = 25;
export const avatarCanvasSize = 150;
export const avatarArtSize = 128;
export const avatarArtOffsetX = 11;
export const avatarArtOffsetY = 10;

export const avatarGrid = [
  ['base-tile-00', 'base-tile-00', 'base-tile-01', 'base-tile-02', 'base-tile-00', 'base-tile-00'],
  ['base-tile-00', 'base-tile-03', 'base-tile-04', 'base-tile-05', 'base-tile-06', 'base-tile-00'],
  ['base-tile-00', 'base-tile-07', 'left-eye-base', 'right-eye-base', 'base-tile-08', 'base-tile-00'],
  ['base-tile-00', 'base-tile-09', 'mouth-rest-left', 'mouth-rest-right', 'base-tile-10', 'base-tile-00'],
  ['base-tile-11', 'base-tile-12', 'base-tile-13', 'base-tile-14', 'base-tile-15', 'base-tile-16'],
  ['base-tile-17', 'base-tile-18', 'base-tile-19', 'base-tile-20', 'base-tile-21', 'base-tile-22'],
] as const;

/** Tile indices in the grid that belong to hat overlays (single masked hat layer). */
export const avatarHatIndices = [2, 3, 7, 8, 9, 10, 13, 14, 15, 16, 19, 20, 21, 22] as const;

/** Tile indices in the grid that belong to outfit variants (bottom 2 rows). */
export const avatarOutfitIndices = [
  24, 25, 26, 27, 28, 29,
  30, 31, 32, 33, 34, 35,
] as const;

export const avatarHats: Record<string, string[]> = {
  none: [
    'hat-empty', 'hat-empty', 'hat-empty', 'hat-empty', 'hat-empty', 'hat-empty',
    'hat-empty', 'hat-empty', 'hat-empty', 'hat-empty', 'hat-empty', 'hat-empty',
    'hat-empty', 'hat-empty',
  ],
  'la-cap': [
    'la-cap-slot-02', 'la-cap-slot-03', 'la-cap-slot-07', 'la-cap-slot-08', 'la-cap-slot-09', 'la-cap-slot-10',
    'la-cap-slot-13', 'la-cap-slot-14', 'la-cap-slot-15', 'la-cap-slot-16', 'la-cap-slot-19', 'hat-empty',
    'hat-empty', 'la-cap-slot-22',
  ],
  'batman-mask': [
    'batman-mask-slot-02', 'batman-mask-slot-03', 'batman-mask-slot-07', 'batman-mask-slot-08', 'batman-mask-slot-09', 'batman-mask-slot-10',
    'batman-mask-slot-13', 'batman-mask-slot-14', 'batman-mask-slot-15', 'batman-mask-slot-16', 'batman-mask-slot-19', 'batman-mask-slot-20',
    'batman-mask-slot-21', 'batman-mask-slot-22',
  ],
};

/** Each outfit maps the 12 outfit tile slots to alternative tile names. */
export const avatarOutfits: Record<string, string[]> = {
  base: [
    'base-tile-11', 'base-tile-12', 'base-tile-13', 'base-tile-14', 'base-tile-15', 'base-tile-16',
    'base-tile-17', 'base-tile-18', 'base-tile-19', 'base-tile-20', 'base-tile-21', 'base-tile-22',
  ],
  'sweater-alt': [
    'sweater-alt-tile-11', 'sweater-alt-tile-12', 'sweater-alt-tile-13', 'sweater-alt-tile-14', 'sweater-alt-tile-15', 'base-tile-16',
    'sweater-alt-tile-17', 'sweater-alt-tile-18', 'sweater-alt-tile-19', 'sweater-alt-tile-20', 'sweater-alt-tile-21', 'sweater-alt-tile-22',
  ],
  batman: [
    'batman-tile-11', 'batman-tile-12', 'batman-tile-13', 'batman-tile-14', 'batman-tile-15', 'batman-tile-16',
    'batman-tile-17', 'batman-tile-18', 'batman-tile-19', 'batman-tile-20', 'batman-tile-21', 'batman-tile-22',
  ],
};

export const avatarSpecialConfigs = [
  {
    id: 'batman',
    outfit: 'batman',
    hat: 'batman-mask',
  },
] as const;
