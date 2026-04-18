import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const SOURCE_LABELS = {
  AG: 'AG',
  unanimous_written: 'Accord unanime écrit',
  AGE: 'AGE',
}

export default function Decisions() {
  const [decisions, setDecisions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('decisions')
      .select('*')
      .order('decided_at', { ascending: false })
      .then(({ data }) => {
        setDecisions(data || [])
        setLoading(false)
      })
  }, [])

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Décisions</h1>
        <p className="text-sm text-gray-500 mt-1">Registre immuable des décisions formelles.</p>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Chargement…</p>
      ) : decisions.length === 0 ? (
        <p className="text-gray-500 text-sm">Aucune décision enregistrée.</p>
      ) : (
        <ul className="space-y-3">
          {decisions.map(d => (
            <li key={d.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-medium text-gray-900">{d.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">{d.final_text}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {SOURCE_LABELS[d.source] || d.source} · {new Date(d.decided_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${
                  d.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {d.status === 'active' ? 'Active' : d.status === 'completed' ? 'Complétée' : 'Archivée'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Layout>
  )
}
