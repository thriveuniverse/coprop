import Layout from '../components/Layout'

export default function Admin() {
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Administration</h1>
        <p className="text-sm text-gray-500 mt-1">Accès réservé au syndic.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="font-medium text-gray-800 mb-1">Lots & Contacts</h2>
          <p className="text-sm text-gray-500">Gérer les 5 lots et leurs propriétaires.</p>
          <button className="mt-3 text-sm text-blue-600 hover:underline">Ouvrir →</button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="font-medium text-gray-800 mb-1">Règlement de copropriété</h2>
          <p className="text-sm text-gray-500">Téléverser le PDF et vérifier la conformité des propositions.</p>
          <button className="mt-3 text-sm text-blue-600 hover:underline">Ouvrir →</button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="font-medium text-gray-800 mb-1">Signatures (Yousign)</h2>
          <p className="text-sm text-gray-500">Suivre les demandes de signature en cours.</p>
          <button className="mt-3 text-sm text-blue-600 hover:underline">Ouvrir →</button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="font-medium text-gray-800 mb-1">Notifications AG</h2>
          <p className="text-sm text-gray-500">Envoyer les convocations aux copropriétaires.</p>
          <button className="mt-3 text-sm text-blue-600 hover:underline">Ouvrir →</button>
        </div>
      </div>
    </Layout>
  )
}
