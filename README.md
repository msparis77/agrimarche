# 🌾 AgriMarché — Marketplace Agricole Afrique de l'Ouest

Plateforme B2B/B2C de mise en relation entre producteurs agricoles et acheteurs au Sénégal, Gambie et Guinée.

## Stack technique
- **Frontend** : Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend** : Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Déploiement** : Vercel

## Fonctionnalités MVP incluses
- ✅ Authentification (inscription / connexion)
- ✅ Publication d'annonces avec photos
- ✅ Recherche et filtres (catégorie, pays, prix)
- ✅ Page détail produit
- ✅ Contact WhatsApp direct
- ✅ Messagerie interne
- ✅ Dashboard vendeur
- ✅ Favoris
- ✅ 3 langues : Français / Anglais / Wolof
- ✅ Design mobile-first

---

## 🚀 Installation

### 1. Cloner et installer

```bash
git clone <ton-repo>
cd agri-market
npm install
```

### 2. Configurer Supabase

1. Va sur [supabase.com](https://supabase.com) → ton projet
2. SQL Editor → colle le contenu de `supabase_schema.sql` → Run
3. Storage → crée un bucket appelé `images` → Public

### 3. Variables d'environnement

Copie `.env.local.example` en `.env.local` :

```bash
cp .env.local.example .env.local
```

Remplis avec tes clés Supabase (Project Settings > API) :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4. Lancer en local

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000)

---

## 📦 Déploiement sur Vercel

1. Push ton code sur GitHub
2. Va sur [vercel.com](https://vercel.com) → New Project → importe ton repo
3. Ajoute les variables d'environnement dans Vercel (Settings > Environment Variables)
4. Deploy 🚀

---

## 🗂 Structure du projet

```
src/
├── app/
│   ├── page.tsx              # Accueil
│   ├── layout.tsx            # Layout global
│   ├── recherche/page.tsx    # Recherche + filtres
│   ├── vendre/page.tsx       # Publier annonce
│   ├── dashboard/page.tsx    # Dashboard vendeur
│   ├── messages/page.tsx     # Messagerie
│   ├── login/page.tsx        # Connexion
│   ├── register/page.tsx     # Inscription
│   └── produits/[id]/page.tsx # Détail produit
├── components/
│   ├── layout/Navbar.tsx
│   └── marketplace/ProductCard.tsx
├── hooks/
│   ├── useAuth.tsx           # Auth context
│   └── useLang.tsx           # Langue context
├── i18n/
│   └── translations.ts       # FR / EN / WO
└── lib/
    └── supabase.ts           # Client + helpers
```

---

## 🗄 Base de données (Supabase)

Tables principales :
- `profiles` — Utilisateurs (vendeurs et acheteurs)
- `products` — Annonces produits
- `categories` — Catégories agricoles (10 pré-remplies)
- `messages` — Messagerie interne
- `reviews` — Avis et notes
- `favorites` — Favoris
- `vendor_verifications` — Vérification vendeurs

---

## 📱 Modèle économique (Phase 2)

- Annonces gratuites au départ
- Annonces sponsorisées (payantes)
- Abonnements vendeurs professionnels
- Commission sur transactions avec paiement mobile (Orange Money, Wave)

---

## 🌍 Langues supportées

| Code | Langue  |
|------|---------|
| `fr` | Français |
| `en` | English  |
| `wo` | Wolof    |

---

## 📞 Contact & Support

Projet développé pour NS PARIS Consulting
