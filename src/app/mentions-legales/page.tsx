import Link from 'next/link'

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8 sm:p-12">

        <div className="mb-8">
          <Link href="/" className="text-sm text-[#0a4a2f] hover:underline">← Retour à l'accueil</Link>
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Mentions légales</h1>
        <p className="text-sm text-gray-400 mb-8">Conformément à la législation en vigueur</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Éditeur du site</h2>
            <div className="bg-gray-50 rounded-xl p-5 space-y-2">
              <div className="flex gap-3">
                <span className="font-semibold text-gray-600 w-40 flex-shrink-0">Nom du site</span>
                <span>AgriMarché Afrique de l'Ouest</span>
              </div>
              <div className="flex gap-3">
                <span className="font-semibold text-gray-600 w-40 flex-shrink-0">Responsable</span>
                <span>Moussa Sow</span>
              </div>
              <div className="flex gap-3">
                <span className="font-semibold text-gray-600 w-40 flex-shrink-0">Email</span>
                <a href="mailto:mstreize@gmail.com" className="text-[#0a4a2f] underline">mstreize@gmail.com</a>
              </div>
              <div className="flex gap-3">
                <span className="font-semibold text-gray-600 w-40 flex-shrink-0">Site web</span>
                <span>agrimarcheafrique.com</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Hébergement</h2>
            <div className="bg-gray-50 rounded-xl p-5 space-y-2">
              <div className="flex gap-3">
                <span className="font-semibold text-gray-600 w-40 flex-shrink-0">Hébergeur</span>
                <span>Vercel Inc.</span>
              </div>
              <div className="flex gap-3">
                <span className="font-semibold text-gray-600 w-40 flex-shrink-0">Adresse</span>
                <span>340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis</span>
              </div>
              <div className="flex gap-3">
                <span className="font-semibold text-gray-600 w-40 flex-shrink-0">Site</span>
                <span>vercel.com</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Base de données</h2>
            <div className="bg-gray-50 rounded-xl p-5 space-y-2">
              <div className="flex gap-3">
                <span className="font-semibold text-gray-600 w-40 flex-shrink-0">Prestataire</span>
                <span>Supabase Inc.</span>
              </div>
              <div className="flex gap-3">
                <span className="font-semibold text-gray-600 w-40 flex-shrink-0">Adresse</span>
                <span>970 Toa Payoh North, #07-04, Singapour 318992</span>
              </div>
              <div className="flex gap-3">
                <span className="font-semibold text-gray-600 w-40 flex-shrink-0">Site</span>
                <span>supabase.com</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Propriété intellectuelle</h2>
            <p>
              L'ensemble du contenu de ce site (textes, images, logos, graphismes) est la propriété exclusive
              d'AgriMarché Afrique de l'Ouest, sauf mention contraire. Toute reproduction, distribution ou
              utilisation sans autorisation préalable écrite est interdite.
            </p>
            <p className="mt-3">
              Les annonces publiées par les utilisateurs restent leur propriété. En les publiant sur AgriMarché,
              ils accordent à la plateforme une licence non-exclusive d'affichage.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Responsabilité</h2>
            <p>
              AgriMarché Afrique de l'Ouest est une plateforme de mise en relation. Nous ne sommes pas partie
              aux transactions entre utilisateurs et ne pouvons être tenus responsables des litiges commerciaux
              entre acheteurs et vendeurs.
            </p>
            <p className="mt-3">
              L'exactitude des informations publiées dans les annonces est de la responsabilité exclusive
              des utilisateurs qui les publient.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Droit applicable</h2>
            <p>
              Le présent site est soumis au droit sénégalais. Tout litige relatif à son utilisation sera
              soumis à la compétence des tribunaux sénégalais, sans préjudice des règles d'ordre public
              applicables dans le pays de l'utilisateur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Contact</h2>
            <p>
              Pour toute question ou réclamation :{' '}
              <a href="mailto:mstreize@gmail.com" className="text-[#0a4a2f] underline font-semibold">mstreize@gmail.com</a>
            </p>
          </section>

        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 text-center">
          <Link href="/confidentialite" className="text-sm text-[#0a4a2f] hover:underline mr-6">Politique de confidentialité</Link>
          <Link href="/" className="text-sm text-gray-500 hover:underline">Retour à l'accueil</Link>
        </div>

      </div>
    </div>
  )
}
