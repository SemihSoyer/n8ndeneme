import { useState } from 'react';
import FileUpload from './components/FileUpload';
import TemplateSelector from './components/TemplateSelector';
import ChatInterface from './components/ChatInterface';
import './App.css';

function App() {
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showChat, setShowChat] = useState(false);

  const handleUploadSuccess = (documents) => {
    setUploadedDocuments(documents);
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setShowChat(true);
  };

  const handleReset = () => {
    if (confirm('Yeni belgeler yüklemek ister misiniz?')) {
      setUploadedDocuments([]);
      setSelectedTemplate(null);
      setShowChat(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>TABLOLA DENEME</h1>
      </header>

      <main className="app-main">
        {uploadedDocuments.length === 0 ? (
          <FileUpload onUploadSuccess={handleUploadSuccess} />
        ) : !showChat ? (
          <TemplateSelector 
            onTemplateSelect={setSelectedTemplate}
            onContinue={handleTemplateSelect}
          />
        ) : (
          <>
            <div className="reset-container">
              <button className="reset-button" onClick={handleReset}>
                ← Yeni Belgeler Yükle
              </button>
            </div>
            <ChatInterface 
              documents={uploadedDocuments} 
              template={selectedTemplate}
            />
          </>
        )}
      </main>

    </div>
  );
}

export default App;
