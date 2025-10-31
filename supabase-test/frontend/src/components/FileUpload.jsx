import { useState } from 'react';
import PropTypes from 'prop-types';
import { uploadDocument } from '../services/api.js';
import './FileUpload.css';

export default function FileUpload({ onUploadSuccess }) {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleSelect = (event) => {
    const selected = Array.from(event.target.files ?? []);
    setFiles(selected);
    setError('');
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const dropped = Array.from(event.dataTransfer.files ?? []);
    if (dropped.length) {
      setFiles(dropped);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!files.length) return;

    try {
      setIsUploading(true);
      const uploads = await Promise.all(files.map((file) => uploadDocument(file)));
      const documents = uploads.map((result) => result.document);
      onUploadSuccess(documents);
    } catch (err) {
      setError(err.message ?? 'Dosya yüklenemedi');
    } finally {
      setIsUploading(false);
    }
  };

  const dropDisabled = isUploading ? 'dropzone disabled' : 'dropzone';

  return (
    <div className="upload-panel">
      <h2 className="panel-title">1. Belgeleri Yükle</h2>
      <p className="panel-sub-title">PDF, PNG veya JPG dosyalarını seç.</p>

      <label
        htmlFor="file-input"
        className={dropDisabled}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <span className="icon">📁</span>
        {files.length ? (
          <>
            <strong>{files.length}</strong> dosya seçildi
          </>
        ) : (
          <>
            Dosyaları buraya sürükle veya tıkla
            <span className="hint">Maksimum 10 MB</span>
          </>
        )}
        <input
          id="file-input"
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleSelect}
        />
      </label>

      {files.length > 0 && (
        <ul className="file-list">
          {files.map((file) => (
            <li key={file.name}>
              <span>{file.name}</span>
              <span className="meta">{(file.size / 1024).toFixed(1)} KB</span>
            </li>
          ))}
        </ul>
      )}

      <div className="actions">
        <button type="button" onClick={handleUpload} disabled={!files.length || isUploading}>
          {isUploading ? 'Yükleniyor…' : 'Belgeleri Yükle'}
        </button>
        <button type="button" onClick={() => setFiles([])} disabled={isUploading}>
          Temizle
        </button>
      </div>

      {error && <p className="error">⚠️ {error}</p>}
    </div>
  );
}

FileUpload.propTypes = {
  onUploadSuccess: PropTypes.func.isRequired,
};
