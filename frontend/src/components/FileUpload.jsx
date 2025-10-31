import { useState, useCallback } from 'react';
import { uploadDocument } from '../services/api';
import './FileUpload.css';

export default function FileUpload({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFiles = (files) => {
    setError(null);
    const newFiles = Array.from(files);
    // TODO: Dosya sayısı ve boyut kontrolü eklenebilir.
    setSelectedFiles(newFiles);
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const handleFileSelect = (e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setError(null);
    setIsUploading(true);

    try {
      const uploadPromises = selectedFiles.map(file => uploadDocument(file));
      const results = await Promise.all(uploadPromises);
      const uploadedDocuments = results.map(result => result.document);
      onUploadSuccess(uploadedDocuments); // Birden fazla dokümanı yukarı gönder
    } catch (err) {
      setError(err.message || 'Bir veya daha fazla dosya yüklenemedi.');
    } finally {
      setIsUploading(false);
    }
  };

  const renderFilePreview = () => (
    <div className="file-preview-container">
      <h4>Seçilen Dosyalar ({selectedFiles.length})</h4>
      <ul className="file-list">
        {selectedFiles.map((file, index) => (
          <li key={index} className="file-item">
            <span className="file-icon">📄</span>
            <span className="file-name">{file.name}</span>
            <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
          </li>
        ))}
      </ul>
      <div className="button-group">
        <button className="upload-button" onClick={handleUpload} disabled={isUploading}>
          {isUploading ? 'Yükleniyor...' : `${selectedFiles.length} Belgeyi İşle`}
        </button>
        <button className="cancel-button" onClick={() => setSelectedFiles([])} disabled={isUploading}>
          İptal
        </button>
      </div>
    </div>
  );

  return (
    <div className="file-upload-container">
      {selectedFiles.length === 0 ? (
        <div
          className={`file-upload-area ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="upload-status">
              <div className="spinner"></div>
              <p>Dosyalar yükleniyor...</p>
            </div>
          ) : (
            <>
              <div className="upload-icon">📂</div>
              <h3>Belgeleri Yükle</h3>
              <p>PDF, JPG veya PNG dosyalarını buraya sürükleyin (En fazla 20 adet)</p>
              <p className="or-text">veya</p>
              <label className="file-select-button">
                Dosyaları Seç
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  multiple // Çoklu dosya seçimine izin ver
                />
              </label>
              <p className="file-info">Maksimum dosya boyutu: 10MB</p>
            </>
          )}
        </div>
      ) : (
        renderFilePreview()
      )}

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

