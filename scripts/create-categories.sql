-- ============================================================
-- 1. Créer la table categories
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_fr TEXT NOT NULL,
  nom_en TEXT NOT NULL,
  nom_wo TEXT,
  icone  TEXT NOT NULL DEFAULT '📦',
  slug   TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. Activer Row Level Security
-- ============================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire
CREATE POLICY "categories_select" ON categories
  FOR SELECT USING (true);

-- Les utilisateurs connectés peuvent ajouter une catégorie
CREATE POLICY "categories_insert" ON categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 3. Insérer les 20 catégories agricoles
-- ============================================================
INSERT INTO categories (nom_fr, nom_en, icone, slug) VALUES
  ('Céréales',                   'Cereals',              '🌾', 'cereales'),
  ('Légumineuses',               'Legumes',              '🥜', 'legumineuses'),
  ('Tubercules & Racines',       'Tubers & Roots',       '🥔', 'tubercules-racines'),
  ('Légumes',                    'Vegetables',           '🍅', 'legumes'),
  ('Fruits',                     'Fruits',               '🥭', 'fruits'),
  ('Oléagineux',                 'Oilseeds',             '🫙', 'oleagineux'),
  ('Épices & Aromates',          'Spices & Herbs',       '🌶️', 'epices-aromates'),
  ('Plantes médicinales',        'Medicinal Plants',     '🌿', 'plantes-medicinales'),
  ('Coton & Fibres',             'Cotton & Fibers',      '☁️', 'coton-fibres'),
  ('Bétail & Élevage',           'Livestock',            '🐄', 'betail-elevage'),
  ('Volaille & Œufs',            'Poultry & Eggs',       '🐔', 'volaille-oeufs'),
  ('Poisson & Aquaculture',      'Fish & Aquaculture',   '🐟', 'poisson-aquaculture'),
  ('Produits laitiers',          'Dairy Products',       '🥛', 'produits-laitiers'),
  ('Miel & Apiculture',          'Honey & Beekeeping',   '🍯', 'miel-apiculture'),
  ('Semences & Plants',          'Seeds & Seedlings',    '🌱', 'semences-plants'),
  ('Intrants agricoles',         'Agricultural Inputs',  '🧪', 'intrants-agricoles'),
  ('Matériel agricole',          'Farm Equipment',       '🚜', 'materiel-agricole'),
  ('Transformation agroalim.',   'Food Processing',      '🏭', 'transformation'),
  ('Bois & Biomasse',            'Wood & Biomass',       '🪵', 'bois-biomasse'),
  ('Autre',                      'Other',                '📦', 'autre')
ON CONFLICT (slug) DO NOTHING;
