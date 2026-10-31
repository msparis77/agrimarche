-- ────────────────────────────────────────────────────────────────
-- Migration : 8 pays (Sénégal, Gambie, Guinée, Cap-Vert, Côte d'Ivoire,
-- Bénin, Burkina Faso, Mali)
-- À exécuter UNE fois dans Supabase > SQL Editor. Sans danger si déjà fait.
-- ────────────────────────────────────────────────────────────────

-- Les prix du marché portent maintenant leur pays (le cron WFP et la page Prix l'utilisent)
ALTER TABLE prix_marche ADD COLUMN IF NOT EXISTS pays    TEXT;
ALTER TABLE prix_marche ADD COLUMN IF NOT EXISTS source  TEXT;
ALTER TABLE prix_marche ADD COLUMN IF NOT EXISTS periode DATE;

-- Les anciennes lignes sans pays étaient toutes saisies au Sénégal (hors Banjul / Conakry)
UPDATE prix_marche SET pays = 'Gambie' WHERE pays IS NULL AND ville IN ('Banjul', 'Brikama', 'Kanifing', 'Basse');
UPDATE prix_marche SET pays = 'Guinée' WHERE pays IS NULL AND ville IN ('Conakry', 'Labé', 'Kankan', 'Kindia');
UPDATE prix_marche SET pays = 'Sénégal' WHERE pays IS NULL;

CREATE INDEX IF NOT EXISTS idx_prix_marche_pays ON prix_marche (pays);
