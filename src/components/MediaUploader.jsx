import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function MediaUploader({ onPosted }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [mediaType, setMediaType] = useState(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  function handleFileChange(e) {
    const selected = e.target.files?.[0]
    if (!selected) return

    const isImage = selected.type.startsWith('image/')
    const isVideo = selected.type.startsWith('video/')
    if (!isImage && !isVideo) {
      setError(t('discover.invalidFile'))
      return
    }

    setError('')
    setFile(selected)
    setMediaType(isImage ? 'image' : 'video')
    setPreviewUrl(URL.createObjectURL(selected))
  }

  function clearSelection() {
    setFile(null)
    setPreviewUrl(null)
    setMediaType(null)
    setCaption('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    setError('')

    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage.from('discover-media').upload(path, file)
      if (uploadError) throw uploadError

      const { error: insertError } = await supabase.from('media_posts').insert({
        user_id: user.id,
        media_path: path,
        media_type: mediaType,
        caption: caption.trim() || null
      })
      if (insertError) throw insertError

      clearSelection()
      onPosted?.()
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {!previewUrl ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-ink-line rounded-xl py-8 text-center text-parchment-muted hover:border-candle/40 hover:text-parchment transition-colors"
        >
          <span className="block text-2xl mb-2">📷</span>
          {t('discover.selectMedia')}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-ink-softer">
            {mediaType === 'image' ? (
              <img src={previewUrl} alt="" className="w-full max-h-80 object-contain" />
            ) : (
              <video src={previewUrl} controls className="w-full max-h-80" />
            )}
            <button
              type="button"
              onClick={clearSelection}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-ink/80 text-parchment flex items-center justify-center hover:bg-ink"
            >
              ✕
            </button>
          </div>

          <textarea
            className="input min-h-[70px]"
            placeholder={t('discover.captionPlaceholder')}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={1000}
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button type="submit" disabled={uploading} className="btn-primary w-full">
            {uploading ? t('discover.posting') : t('discover.post')}
          </button>
        </div>
      )}

      {!previewUrl && error && <p className="text-sm text-red-400 mt-2">{error}</p>}
    </form>
  )
}