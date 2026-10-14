-- Temporarily retire only the 31 generated sample frames from the active shop catalog.
-- Their full definitions remain in ARCHIVED_AVATAR_FRAMES for restoration.
-- Saved ownership, equipped IDs, Coin/XP and progress history are not modified.
delete from public.cosmetic_catalog
where category='frame' and id in (
  'frame-starter',
  'frame-flame-1',
  'frame-flame-2',
  'frame-flame-3',
  'frame-flame-4',
  'frame-flame-5',
  'frame-football-1',
  'frame-football-2',
  'frame-football-3',
  'frame-football-4',
  'frame-football-5',
  'frame-detective-1',
  'frame-detective-2',
  'frame-detective-3',
  'frame-detective-4',
  'frame-detective-5',
  'frame-manga-1',
  'frame-manga-2',
  'frame-manga-3',
  'frame-manga-4',
  'frame-manga-5',
  'frame-builder-1',
  'frame-builder-2',
  'frame-builder-3',
  'frame-builder-4',
  'frame-builder-5',
  'frame-space-1',
  'frame-space-2',
  'frame-space-3',
  'frame-space-4',
  'frame-space-5'
);

