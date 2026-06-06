import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://rlnigbyjnlloplqwzxrm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsbmlnYnlqbmxsb3BscXd6eHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MTM1ODEsImV4cCI6MjA5NTk4OTU4MX0.ZVJ0lskiUwo55aEmxpFJ9BWiw4L6giAG_s1kXHh5sA4'
)

const categories = [
  { nom_fr: 'Céréales',                    nom_en: 'Cereals',              icone: '🌾', slug: 'cereales' },
  { nom_fr: 'Légumineuses',                nom_en: 'Legumes',              icone: '🥜', slug: 'legumineuses' },
  { nom_fr: 'Tubercules & Racines',        nom_en: 'Tubers & Roots',       icone: '🥔', slug: 'tubercules-racines' },
  { nom_fr: 'Légumes',                     nom_en: 'Vegetables',           icone: '🍅', slug: 'legumes' },
  { nom_fr: 'Fruits',                      nom_en: 'Fruits',               icone: '🥭', slug: 'fruits' },
  { nom_fr: 'Oléagineux',                  nom_en: 'Oilseeds',             icone: '🫙', slug: 'oleagineux' },
  { nom_fr: 'Épices & Aromates',           nom_en: 'Spices & Herbs',       icone: '🌶️', slug: 'epices-aromates' },
  { nom_fr: 'Plantes médicinales',         nom_en: 'Medicinal Plants',     icone: '🌿', slug: 'plantes-medicinales' },
  { nom_fr: 'Coton & Fibres',              nom_en: 'Cotton & Fibers',      icone: '☁️', slug: 'coton-fibres' },
  { nom_fr: 'Bétail & Élevage',            nom_en: 'Livestock',            icone: '🐄', slug: 'betail-elevage' },
  { nom_fr: 'Volaille & Œufs',             nom_en: 'Poultry & Eggs',       icone: '🐔', slug: 'volaille-oeufs' },
  { nom_fr: 'Poisson & Aquaculture',       nom_en: 'Fish & Aquaculture',   icone: '🐟', slug: 'poisson-aquaculture' },
  { nom_fr: 'Produits laitiers',           nom_en: 'Dairy Products',       icone: '🥛', slug: 'produits-laitiers' },
  { nom_fr: 'Miel & Apiculture',           nom_en: 'Honey & Beekeeping',   icone: '🍯', slug: 'miel-apiculture' },
  { nom_fr: 'Semences & Plants',           nom_en: 'Seeds & Seedlings',    icone: '🌱', slug: 'semences-plants' },
  { nom_fr: 'Intrants agricoles',          nom_en: 'Agricultural Inputs',  icone: '🧪', slug: 'intrants-agricoles' },
  { nom_fr: 'Matériel agricole',           nom_en: 'Farm Equipment',       icone: '🚜', slug: 'materiel-agricole' },
  { nom_fr: 'Transformation agroalim.',    nom_en: 'Food Processing',      icone: '🏭', slug: 'transformation' },
  { nom_fr: 'Bois & Biomasse',             nom_en: 'Wood & Biomass',       icone: '🪵', slug: 'bois-biomasse' },
  { nom_fr: 'Autre',                       nom_en: 'Other',                icone: '📦', slug: 'autre' },
]

const { data, error } = await supabase
  .from('categories')
  .upsert(categories, { onConflict: 'slug' })
  .select()

if (error) {
  console.error('❌ Erreur:', error.message)
  console.log('\nCopiez-collez ce SQL dans votre dashboard Supabase (SQL Editor) :')
  console.log('-------------------------------------------------------------------')
  console.log(`INSERT INTO categories (nom_fr, nom_en, icone, slug) VALUES`)
  console.log(categories.map(c => `  ('${c.nom_fr}', '${c.nom_en}', '${c.icone}', '${c.slug}')`).join(',\n'))
  console.log(`ON CONFLICT (slug) DO NOTHING;`)
} else {
  console.log(`✅ ${data?.length || categories.length} catégories insérées avec succès !`)
  data?.forEach(c => console.log(`  ${c.icone} ${c.nom_fr}`))
}
