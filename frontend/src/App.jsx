import { useState } from 'react';
import FileUpload from './components/FileUpload';
import ChatInterface from './components/ChatInterface';
import './App.css';

function App() {
  const [uploadedDocument, setUploadedDocument] = useState(null);

  const handleUploadSuccess = (document) => {
    setUploadedDocument(document);
  };

  const handleReset = () => {
    if (confirm('Yeni bir belge yüklemek ister misiniz?')) {
      setUploadedDocument(null);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>TABLOLA DENEME</h1>
      </header>

      <main className="app-main">
        {!uploadedDocument ? (
          <FileUpload onUploadSuccess={handleUploadSuccess} />
        ) : (
          <>
            <div className="reset-container">
              <button className="reset-button" onClick={handleReset}>
                ← Yeni Belge Yükle
              </button>
            </div>
            <ChatInterface document={uploadedDocument} />
          </>
        )}
      </main>

    </div>
  );
}

export default App;
