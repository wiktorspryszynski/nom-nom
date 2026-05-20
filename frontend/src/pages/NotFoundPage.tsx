import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { NOMNOM_404 } from '../assets'

export default function NotFoundPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-primary flex flex-col items-center justify-center px-6 text-center gap-6">
      <img src={NOMNOM_404} alt="NomNom lost" className="w-52 select-none" />
      <div className="flex flex-col gap-2">
        <h1 className="text-5xl font-extrabold text-lily tracking-tight">404</h1>
        <p className="text-lg font-extrabold text-lily">{t('notFoundTitle')}</p>
        <p className="text-sm font-semibold text-lily/60 max-w-xs">{t('notFoundBody')}</p>
      </div>
      <button
        onClick={() => navigate('/')}
        className="btn-fill border-[3px] border-lily text-lily rounded-full px-8 py-3 text-base font-extrabold cursor-pointer"
      >
        {t('notFoundBack')}
      </button>
    </div>
  )
}
