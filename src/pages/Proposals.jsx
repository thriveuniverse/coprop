import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const STATUS_LABELS = {
  discussion: 'Discussion',
  consensus_reached: 'Consensus atteint',
  rejected: 'Rejeté',
  escalated_to_ag: 'Escaladé en AG',
}

const STATUS_COLORS = {
  discussion: 'bg-yellow-100 text-yellow-800',
  consensus_reached: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  escalated_to_ag: 'bg-blue-100 text-blue-800',
}

export default function Proposals() {
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('proposals')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProposals(data || [])
        setLoading(false)
      })
  }, [])

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Propositions</h1>
        <button className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">
          + Nouvelle proposition
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Chargement…</p>
      ) : proposals.length === 0 ? (
        <p className="text-gray-500 text-sm">Aucune proposition pour le moment.</p>
      ) : (
        <ul className="space-y-3">
          {proposals.map(p => (
            <li key={p.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-medium text-gray-900">{p.title}</h2>
                  {p.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>
                  )}
                  {p.tags?.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {p.tags.map(tag => (
                        <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${STATUS_COLORS[p.status]}`}>
                  {STATUS_LABELS[p.status]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Layout>
  )
}
