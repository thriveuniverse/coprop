import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
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

function FileAttachment({ url, name }) {
  const [signedUrl, setSignedUrl] = useState(null)
  const isImage = /\.(png|jpe?g|gif|webp)$/i.test(name)

  useEffect(() => {
    supabase.storage
      .from('documents')
      .createSignedUrl(url, 3600)
      .then(({ data }) => { if (data) setSignedUrl(data.signedUrl) })
  }, [url])

  async function handleDownload() {
    const { data } = await supabase.storage.from('documents').download(url)
    if (!data) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(data)
    a.download = name
    a.click()
  }

  if (!signedUrl) return <p className="text-xs text-gray-400 mt-2">Chargement de la pièce jointe…</p>

  return (
    <div className="mt-2">
      {isImage ? (
        <img
          src={signedUrl}
          alt={name}
          className="max-w-xs rounded border border-gray-200 cursor-pointer hover:opacity-90"
          onClick={handleDownload}
          title="Cliquer pour télécharger"
        />
      ) : (
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
        >
          <span>📎</span> {name}
        </button>
      )}
    </div>
  )
}

export default function ProposalDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session, profile } = useAuth()

  const [proposal, setProposal] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)

  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef()

  useEffect(() => {
    async function load() {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from('proposals').select('*').eq('id', id).single(),
        supabase
          .from('comments')
          .select('*, profiles(full_name, email)')
          .eq('proposal_id', id)
          .order('created_at'),
      ])
      if (!p) { navigate('/proposals'); return }
      setProposal(p)
      setComments(c || [])
      setLoading(false)
    }
    load()
  }, [id])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim() && !file) return
    setSubmitting(true)
    setError(null)

    let file_url = null
    let file_name = null

    if (file) {
      const ext = file.name.split('.').pop()
      const path = `proposals/${id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(path, file)
      if (uploadError) { setError('Erreur lors du téléversement du fichier.'); setSubmitting(false); return }
      file_url = path
      file_name = file.name
    }

    const { data: newComment, error: insertError } = await supabase
      .from('comments')
      .insert({
        proposal_id: id,
        user_id: session.user.id,
        content: text.trim(),
        file_url,
        file_name,
      })
      .select('*, profiles(full_name, email)')
      .single()

    if (insertError) { setError(insertError.message); setSubmitting(false); return }

    setComments(prev => [...prev, newComment])
    setText('')
    setFile(null)
    if (fileRef.current) fileRef.current.value = ''
    setSubmitting(false)
  }

  if (loading) return <Layout><p className="text-sm text-gray-400">Chargement…</p></Layout>

  return (
    <Layout>
      {/* Back */}
      <button
        onClick={() => navigate('/proposals')}
        className="text-sm text-gray-500 hover:text-gray-800 mb-4 inline-flex items-center gap-1"
      >
        ← Retour aux propositions
      </button>

      {/* Proposal header */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{proposal.title}</h1>
            {proposal.description && (
              <p className="text-sm text-gray-600 mt-2">{proposal.description}</p>
            )}
            {proposal.tags?.length > 0 && (
              <div className="flex gap-1 mt-3 flex-wrap">
                {proposal.tags.map(tag => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-3">
              Créée le {new Date(proposal.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${STATUS_COLORS[proposal.status]}`}>
            {STATUS_LABELS[proposal.status]}
          </span>
        </div>
      </div>

      {/* Comments */}
      <h2 className="font-medium text-gray-800 mb-3">
        Commentaires {comments.length > 0 && <span className="text-gray-400 font-normal">({comments.length})</span>}
      </h2>

      {comments.length === 0 ? (
        <p className="text-sm text-gray-400 mb-6">Aucun commentaire pour le moment.</p>
      ) : (
        <ul className="space-y-3 mb-6">
          {comments.map(c => {
            const author = c.profiles?.full_name || c.profiles?.email || 'Utilisateur'
            return (
              <li key={c.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{author}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(c.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                {c.content && <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>}
                {c.file_url && <FileAttachment url={c.file_url} name={c.file_name} />}
              </li>
            )
          })}
        </ul>
      )}

      {/* Add comment form */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-sm font-medium text-gray-800 mb-3">Ajouter un commentaire</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={3}
            placeholder="Votre commentaire… (devis reçu, mise à jour, question…)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div>
            <label className="block text-xs text-gray-500 mb-1">Pièce jointe (optionnel — PDF, image, Word)</label>
            <input
              type="file"
              ref={fileRef}
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp"
              onChange={e => setFile(e.target.files[0] || null)}
              className="text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || (!text.trim() && !file)}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-40"
            >
              {submitting ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
