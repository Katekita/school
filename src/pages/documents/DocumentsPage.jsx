import { ArrowDownToLine, ArrowUpRight, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageBanner from '../../components/PageBanner'
import Reveal from '../../components/Reveal'
import { documents } from '../../data/mockData'
import { useLanguage } from '../../i18n/LanguageContext'

export default function DocumentsPage() {
  const { t } = useLanguage()
  return (
    <>
      <PageBanner title={t('documents.title')} eyebrow={t('documents.eyebrow')} />
      <section className="content-section">
        <div className="page-container">
          {documents.length ? (
            <div className="document-grid">
              {documents.map((doc) => (
                <Reveal key={doc.id}>
                  <article className="page-card document-card">
                    <div className="doc-icon">
                      <FileText size={22} />
                    </div>
                    <span className="meta-chip">{doc.category}</span>
                    <h3>{doc.title}</h3>
                    <div className="meta-row">{doc.date}</div>
                    <div className="meta-row">
                      {doc.type} · {doc.size}
                    </div>
                    <div className="doc-actions">
                      <Link className="button-primary" to="/documents">
                        {t('documents.open')} <ArrowUpRight size={14} />
                      </Link>
                      <Link className="button-outline" to="/documents">
                        {t('documents.download')} <ArrowDownToLine size={14} />
                      </Link>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <FileText size={34} />
              <h3>{t('documents.emptyTitle')}</h3>
              <p>{t('documents.emptyText')}</p>
              <Link className="text-link" to="/baylanysh">
                {t('documents.contacts')} <ArrowUpRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
