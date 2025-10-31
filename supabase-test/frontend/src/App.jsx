import { useState } from 'react';
import FileUpload from './components/FileUpload.jsx';
import ChatInterface from './components/ChatInterface.jsx';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);

  const handleUploadSuccess = (uploaded) => {
    setDocuments(uploaded);
  };

  const reset = () => setDocuments([]);

  return (
    <div className="app">
      <header>
        <h1>Supabase Belge Analiz Testi</h1>
        <p className="notice">Bu arayüz, n8n workflow'unu Supabase altyapısı ile test etmek içindir.</p>
      </header>

      <main>
        <section className="panel">
          <FileUpload onUploadSuccess={handleUploadSuccess} />
        </section>

        {documents.length > 0 && (
          <section className="panel">
            <div className="section-title">2. Belgelerle Sohbet Et</div>
            <div className="status-badge">
              {documents.length} belge yüklendi
              <button className="reset-link" type="button" onClick={reset}>
                • sıfırla
              </button>
            </div>
            <ChatInterface documents={documents} />
          </section>
        )}
      </main>
    </div>
  );
}
