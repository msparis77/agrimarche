-- ================================================================
-- AGRIMARCHÉ — Configuration complète de la base de données
-- Colle tout ce fichier dans Supabase > SQL Editor > Run
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- 1. PRODUCTS
-- ────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

CREATE TABLE categories (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_fr     TEXT NOT NULL,
  nom_en     TEXT NOT NULL,
  nom_wo     TEXT,
  icone      TEXT NOT NULL DEFAULT '📦',
  slug       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  categorie_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  titre            TEXT NOT NULL,
  description      TEXT,
  quantite         NUMERIC,
  unite            TEXT DEFAULT 'kg',
  prix             NUMERIC NOT NULL DEFAULT 0,
  devise           TEXT DEFAULT 'FCFA',
  pays             TEXT,
  ville            TEXT,
  images           TEXT[],
  whatsapp_contact TEXT,
  disponible       BOOLEAN DEFAULT true,
  sponsorise       BOOLEAN DEFAULT false,
  vues             INTEGER DEFAULT 0,
  statut           TEXT DEFAULT 'actif',
  expires_at       TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- 2. MESSAGES
-- ────────────────────────────────────────────────────────────────
CREATE TABLE messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
  contenu     TEXT NOT NULL,
  lu          BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- 3. TRANSACTIONS
-- ────────────────────────────────────────────────────────────────
CREATE TABLE transactions (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  seller_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id          UUID REFERENCES products(id) ON DELETE SET NULL,
  montant             NUMERIC NOT NULL DEFAULT 0,
  devise              TEXT DEFAULT 'FCFA',
  commission          NUMERIC DEFAULT 0,
  montant_net         NUMERIC DEFAULT 0,
  methode             TEXT,
  telephone_paiement  TEXT,
  reference_interne   TEXT,
  quantite            NUMERIC DEFAULT 1,
  unite               TEXT,
  statut              TEXT DEFAULT 'en_cours',
  confirmed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- 4. FAVORITES
-- ────────────────────────────────────────────────────────────────
CREATE TABLE favorites (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

-- ────────────────────────────────────────────────────────────────
-- 5. VENDOR_VERIFICATIONS
-- ────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS vendor_verifications CASCADE;

CREATE TABLE vendor_verifications (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  type_doc          TEXT,
  doc_recto_url     TEXT,
  doc_verso_url     TEXT,
  selfie_url        TEXT,
  nom_complet       TEXT,
  date_naissance    DATE,
  adresse           TEXT,
  activite          TEXT,
  annees_experience INTEGER,
  statut            TEXT DEFAULT 'en_attente',
  note_admin        TEXT,
  examine_par       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  examine_le        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- 6. PAYMENT_METHODS
-- ────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS payment_methods CASCADE;

CREATE TABLE payment_methods (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code            TEXT NOT NULL UNIQUE,
  nom             TEXT NOT NULL,
  logo            TEXT DEFAULT '💳',
  pays            TEXT[] DEFAULT '{}',
  instructions    TEXT,
  numero_marchand TEXT,
  actif           BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO payment_methods (code, nom, logo, pays, instructions, numero_marchand, actif) VALUES
(
  'wave_sn',
  'Wave Sénégal',
  '🌊',
  ARRAY['Sénégal'],
  'Ouvrez l''application Wave
Appuyez sur "Envoyer"
Entrez le numéro {ref}
Entrez le montant exact
Ajoutez la référence {ref} dans le commentaire
Confirmez le paiement',
  '77 000 00 00',
  true
),
(
  'orange_sn',
  'Orange Money Sénégal',
  '🟠',
  ARRAY['Sénégal'],
  'Composez #144#
Choisissez "Transfert d''argent"
Entrez le numéro destinataire
Entrez le montant
Ajoutez la référence {ref} en message
Validez avec votre code secret',
  '77 111 22 33',
  true
),
(
  'free_sn',
  'Free Money Sénégal',
  '🔵',
  ARRAY['Sénégal'],
  'Ouvrez l''application Free Money
Appuyez sur "Transfert"
Entrez le numéro destinataire
Entrez le montant
Indiquez la référence {ref}
Confirmez avec votre code',
  '76 222 33 44',
  true
),
(
  'afrimoney_gm',
  'Afrimoney Gambie',
  '🟢',
  ARRAY['Gambie'],
  'Ouvrez Afrimoney
Choisissez "Send Money"
Entrez le numéro destinataire
Entrez le montant
Ajoutez la référence {ref}
Confirmez le transfert',
  '220 300 40 50',
  true
),
(
  'mtn_gn',
  'MTN Mobile Money Guinée',
  '🟡',
  ARRAY['Guinée'],
  'Composez *155#
Choisissez "Transfert"
Entrez le numéro destinataire
Entrez le montant
Mentionnez la référence {ref}
Validez avec votre PIN',
  '620 123 456',
  true
);

-- ────────────────────────────────────────────────────────────────
-- 7. FORUM_POSTS
-- ────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS forum_comments CASCADE;
DROP TABLE IF EXISTS forum_posts CASCADE;

CREATE TABLE forum_posts (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  titre      TEXT NOT NULL,
  contenu    TEXT NOT NULL,
  categorie  TEXT DEFAULT 'General',
  vues       INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- 8. FORUM_COMMENTS
-- ────────────────────────────────────────────────────────────────
CREATE TABLE forum_comments (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contenu    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- 9. PRIX_MARCHE
-- ────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS prix_marche CASCADE;

CREATE TABLE prix_marche (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendeur        TEXT NOT NULL,
  type_vendeur   TEXT,
  telephone      TEXT,
  produit        TEXT NOT NULL,
  prix           NUMERIC NOT NULL,
  unite          TEXT NOT NULL DEFAULT 'kg',
  quantite_dispo TEXT,
  ville          TEXT NOT NULL,
  description    TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- 10. RLS (Row Level Security) — toutes les tables
-- ────────────────────────────────────────────────────────────────

-- CATEGORIES
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cat_read"   ON categories FOR SELECT USING (true);
CREATE POLICY "cat_insert" ON categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- PRODUCTS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prod_read"   ON products FOR SELECT USING (true);
CREATE POLICY "prod_insert" ON products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prod_update" ON products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "prod_delete" ON products FOR DELETE USING (auth.uid() = user_id);

-- MESSAGES
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg_read"   ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "msg_insert" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "msg_update" ON messages FOR UPDATE USING (auth.uid() = receiver_id);

-- TRANSACTIONS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "txn_read"   ON transactions FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "txn_insert" ON transactions FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "txn_update_admin" ON transactions FOR UPDATE USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- FAVORITES
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fav_read"   ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "fav_insert" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fav_delete" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- VENDOR_VERIFICATIONS
ALTER TABLE vendor_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verif_read_own"   ON vendor_verifications FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "verif_insert" ON vendor_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "verif_update" ON vendor_verifications FOR UPDATE USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- PAYMENT_METHODS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pay_read" ON payment_methods FOR SELECT USING (true);

-- FORUM_POSTS
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fp_read"   ON forum_posts FOR SELECT USING (true);
CREATE POLICY "fp_insert" ON forum_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fp_update" ON forum_posts FOR UPDATE USING (auth.uid() = user_id);

-- FORUM_COMMENTS
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fc_read"   ON forum_comments FOR SELECT USING (true);
CREATE POLICY "fc_insert" ON forum_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- PRIX_MARCHE
ALTER TABLE prix_marche ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pm_read"   ON prix_marche FOR SELECT USING (true);
CREATE POLICY "pm_insert" ON prix_marche FOR INSERT WITH CHECK (true);

-- ────────────────────────────────────────────────────────────────
-- 11. CATEGORIES — 20 entrées agricoles
-- ────────────────────────────────────────────────────────────────
INSERT INTO categories (nom_fr, nom_en, icone, slug) VALUES
  ('Céréales',                 'Cereals',             '🌾', 'cereales'),
  ('Légumineuses',             'Legumes',             '🥜', 'legumineuses'),
  ('Tubercules & Racines',     'Tubers & Roots',      '🥔', 'tubercules-racines'),
  ('Légumes',                  'Vegetables',          '🍅', 'legumes'),
  ('Fruits',                   'Fruits',              '🥭', 'fruits'),
  ('Oléagineux',               'Oilseeds',            '🫙', 'oleagineux'),
  ('Épices & Aromates',        'Spices & Herbs',      '🌶️', 'epices-aromates'),
  ('Plantes médicinales',      'Medicinal Plants',    '🌿', 'plantes-medicinales'),
  ('Coton & Fibres',           'Cotton & Fibers',     '☁️', 'coton-fibres'),
  ('Bétail & Élevage',         'Livestock',           '🐄', 'betail-elevage'),
  ('Volaille & Œufs',          'Poultry & Eggs',      '🐔', 'volaille-oeufs'),
  ('Poisson & Aquaculture',    'Fish & Aquaculture',  '🐟', 'poisson-aquaculture'),
  ('Produits laitiers',        'Dairy Products',      '🥛', 'produits-laitiers'),
  ('Miel & Apiculture',        'Honey & Beekeeping',  '🍯', 'miel-apiculture'),
  ('Semences & Plants',        'Seeds & Seedlings',   '🌱', 'semences-plants'),
  ('Intrants agricoles',       'Agricultural Inputs', '🧪', 'intrants-agricoles'),
  ('Matériel agricole',        'Farm Equipment',      '🚜', 'materiel-agricole'),
  ('Transformation agroalim.', 'Food Processing',     '🏭', 'transformation'),
  ('Bois & Biomasse',          'Wood & Biomass',      '🪵', 'bois-biomasse'),
  ('Autre',                    'Other',               '📦', 'autre')
ON CONFLICT (slug) DO NOTHING;

-- ────────────────────────────────────────────────────────────────
-- 12. FONCTION increment_views
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_views(product_id UUID)
RETURNS VOID AS $$
  UPDATE products SET vues = vues + 1 WHERE id = product_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ================================================================
-- TERMINÉ — 9 tables créées + RLS + données de base
--
-- ÉTAPE SUIVANTE (dans Supabase > Storage) :
-- Créer deux buckets publics manuellement :
--   • "images"        → photos de produits
--   • "verifications" → documents d'identité vendeurs
-- ================================================================
