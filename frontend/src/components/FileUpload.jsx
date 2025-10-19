import { useState } from 'react';
import { uploadDocument } from '../services/api';
import './FileUpload.css';

export default function FileUpload({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    setError(null);
    setIsUploading(true);

    try {
      const result = await uploadDocument(file);
      onUploadSuccess(result.document);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="file-upload-container">
      <div
        className={`file-upload-area ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="upload-status">
            <div className="spinner"></div>
            <p>Dosya yükleniyor...</p>
          </div>
        ) : (
          <>
            <div className="upload-icon">📄</div>
            <h3>Belge Yükle</h3>
            <p>PDF, JPG veya PNG dosyasını buraya sürükleyin</p>
            <p className="or-text">veya</p>
            <label className="file-select-button">
              Dosya Seç
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </label>
            <p className="file-info">Maksimum dosya boyutu: 10MB</p>
          </>
        )}
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

