import React, { useState } from 'react';
import './TemplateSelector.css';

const TemplateSelector = ({ onTemplateSelect, onContinue }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const templates = [
    {
      id: 'fatura',
      title: 'Fatura',
      description: 'Fatura analizi ve detay çıkarımı',
      icon: '📄',
      color: '#4CAF50'
    },
    {
      id: 'fis-dekont',
      title: 'Fiş / Dekont',
      description: 'Fiş ve dekont işlemleri analizi',
      icon: '🧾',
      color: '#2196F3'
    },
    {
      id: 'tablo',
      title: 'Tablo',
      description: 'Tablolu veri çıkarımı ve analizi',
      icon: '📊',
      color: '#FF9800'
    },
    {
      id: 'sozlesme',
      title: 'Sözleşme',
      description: 'Sözleşme maddeleri ve taraf analizi',
      icon: '📜',
      color: '#9C27B0'
    },
    {
      id: 'genel-analiz',
      title: 'Genel Analiz',
      description: 'Esnek belge analizi ve soru-cevap',
      icon: '🔍',
      color: '#607D8B'
    }
  ];

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template.id);
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  const handleContinue = () => {
    if (selectedTemplate && onContinue) {
      const selected = templates.find(t => t.id === selectedTemplate);
      onContinue(selected);
    }
  };

  return (
    <div className="template-selector-container">
      <div className="template-header">
        <h2>Belge Tipini Seçin</h2>
        <p>Yüklediğiniz belgenin tipine uygun şablonu seçerek daha iyi sonuçlar alabilirsiniz</p>
      </div>

      <div className="template-grid">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
            onClick={() => handleTemplateSelect(template)}
            style={{ '--accent-color': template.color }}
          >
            <div className="template-icon">{template.icon}</div>
            <h3>{template.title}</h3>
            <p>{template.description}</p>
            {selectedTemplate === template.id && (
              <div className="selection-indicator">
                <span className="checkmark">✓</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="template-actions">
        <button
          className="continue-btn"
          onClick={handleContinue}
          disabled={!selectedTemplate}
        >
          Devam Et
        </button>
      </div>
    </div>
  );
};

export default TemplateSelector;
