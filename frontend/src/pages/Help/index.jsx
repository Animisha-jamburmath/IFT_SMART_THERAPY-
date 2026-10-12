import React from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { FiBookOpen, FiMessageCircle, FiMail } from 'react-icons/fi';

const Help = () => {
  const { t } = useTranslation();
  const faqs = [
    { q: t('help.faq1'), a: t('help.faq1a') },
    { q: t('help.faq2'), a: t('help.faq2a') },
    { q: t('help.faq3'), a: t('help.faq3a') },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title={t('help.title')} />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-soft border p-6 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <FiBookOpen className="text-primary" size={28} />
                <h3 className="text-xl font-semibold">{t('help.welcome')}</h3>
              </div>
              <p className="text-gray-500 text-sm">{t('help.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-2xl shadow-soft p-4 border-l-4 border-primary">
                <h4 className="font-semibold flex items-center gap-2"><FiMessageCircle className="text-primary" /> {t('help.faq')}</h4>
              </div>
              <div className="bg-white rounded-2xl shadow-soft p-4 border-l-4 border-accent">
                <h4 className="font-semibold flex items-center gap-2"><FiMail className="text-accent" /> {t('help.contact')}</h4>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft border p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><FiMessageCircle className="text-primary" /> {t('help.faq')}</h3>
              <div className="space-y-3">
                {faqs.map((item, i) => (
                  <div key={i} className="border rounded-xl p-3 hover:bg-gray-50">
                    <p className="font-medium text-sm">{item.q}</p>
                    <p className="text-sm text-gray-500 mt-1">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Help;