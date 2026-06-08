import Link from 'next/link'

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8 sm:p-12">

        <div className="mb-8">
          <Link href="/" className="text-sm text-[#0a4a2f] hover:underline">← Retour à l'accueil</Link>
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Politique de confidentialité</h1>
        <p className="text-sm text-gray-400 mb-8">Dernière mise à jour : juin 2025 — AgriMarché Afrique de l'Ouest</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Qui sommes-nous ?</h2>
            <p>
              AgriMarché Afrique de l'Ouest est une plateforme de mise en relation entre producteurs agricoles,
              acheteurs, transporteurs et transformateurs en Afrique de l'Ouest. Le responsable du traitement
              des données est <strong>Moussa Sow</strong>, joignable à l'adresse{' '}
              <a href="mailto:mstreize@gmail.com" className="text-[#0a4a2f] underline">mstreize@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Données collectées</h2>
            <p className="mb-3">Nous collectons les données suivantes lors de votre inscription et utilisation de la plateforme :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Identité :</strong> nom complet, adresse email, numéro de téléphone / WhatsApp</li>
              <li><strong>Localisation :</strong> pays, ville, région</li>
              <li><strong>Profil professionnel :</strong> rôle (producteur, acheteur, transporteur, transformateur), produits, volumes</li>
              <li><strong>Annonces publiées :</strong> titre, description, prix, photos, coordonnées de contact</li>
              <li><strong>Messages :</strong> échanges privés entre utilisateurs sur la plateforme</li>
              <li><strong>Données de navigation :</strong> pages visitées, durée de session (données anonymisées)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Comment nous utilisons vos données</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Créer et gérer votre compte utilisateur</li>
              <li>Afficher vos annonces aux autres utilisateurs</li>
              <li>Permettre les échanges de messages entre acheteurs et vendeurs</li>
              <li>Améliorer nos services et l'expérience utilisateur</li>
              <li>Envoyer des notifications relatives à votre activité sur la plateforme</li>
              <li>Produire des statistiques agrégées et anonymisées (tendances des marchés agricoles)</li>
            </ul>
            <p className="mt-3">
              Nous ne vendons jamais vos données personnelles. Les statistiques partagées avec des partenaires
              sont toujours <strong>anonymisées</strong> et ne permettent pas d'identifier un individu.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Base légale du traitement</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Exécution du contrat :</strong> les données nécessaires au fonctionnement de la plateforme</li>
              <li><strong>Consentement :</strong> accepté lors de l'inscription</li>
              <li><strong>Intérêt légitime :</strong> amélioration du service, sécurité, lutte contre la fraude</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Conservation des données</h2>
            <p>
              Vos données sont conservées aussi longtemps que votre compte est actif. En cas de suppression
              de compte, vos données personnelles sont effacées sous <strong>30 jours</strong>, sauf obligation légale contraire.
              Les messages peuvent être conservés jusqu'à 1 an à des fins de sécurité.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Vos droits</h2>
            <p className="mb-3">Conformément au RGPD (Règlement Général sur la Protection des Données) et à la loi sénégalaise n°2008-12 relative à la protection des données personnelles, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Droit d'accès :</strong> obtenir une copie de vos données personnelles</li>
              <li><strong>Droit de rectification :</strong> corriger des données inexactes ou incomplètes</li>
              <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données ("droit à l'oubli")</li>
              <li><strong>Droit d'opposition :</strong> vous opposer à certains traitements</li>
              <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format lisible</li>
              <li><strong>Droit de limitation :</strong> limiter le traitement dans certains cas</li>
            </ul>
            <p className="mt-3">
              Pour exercer ces droits, contactez-nous à{' '}
              <a href="mailto:mstreize@gmail.com" className="text-[#0a4a2f] underline">mstreize@gmail.com</a>.
              Nous répondrons dans un délai de <strong>30 jours</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Sécurité des données</h2>
            <p>
              Vos données sont hébergées sur des serveurs sécurisés (Supabase, USA) avec chiffrement en transit (HTTPS/TLS)
              et au repos. L'accès est limité aux personnes autorisées. Nous appliquons les meilleures pratiques
              de sécurité informatique pour protéger vos informations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Cookies et traceurs</h2>
            <p>
              Nous utilisons uniquement des cookies techniques nécessaires au bon fonctionnement de la plateforme
              (session d'authentification). Nous n'utilisons pas de cookies publicitaires ni de traceurs tiers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Transferts internationaux</h2>
            <p>
              Vos données sont hébergées aux États-Unis (Supabase Inc., Vercel Inc.). Ces transferts sont encadrés
              par des garanties appropriées conformément au RGPD (clauses contractuelles types).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Conformité réglementaire</h2>
            <p>
              Cette politique est conforme au <strong>Règlement (UE) 2016/679 (RGPD)</strong> et à la{' '}
              <strong>loi sénégalaise n°2008-12 du 25 janvier 2008</strong> sur la protection des données à caractère
              personnel, supervisée par la Commission de Protection des Données Personnelles (CDP) du Sénégal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">11. Contact</h2>
            <p>
              Pour toute question relative à cette politique ou à vos données personnelles :{' '}
              <a href="mailto:mstreize@gmail.com" className="text-[#0a4a2f] underline font-semibold">mstreize@gmail.com</a>
            </p>
          </section>

        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 text-center">
          <Link href="/mentions-legales" className="text-sm text-[#0a4a2f] hover:underline mr-6">Mentions légales</Link>
          <Link href="/" className="text-sm text-gray-500 hover:underline">Retour à l'accueil</Link>
        </div>

      </div>
    </div>
  )
}
