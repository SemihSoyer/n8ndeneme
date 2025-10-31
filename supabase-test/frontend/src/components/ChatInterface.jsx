import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  sendChatMessage,
  getChatMessages,
  getTableStatus,
} from '../services/api.js';
import TableDisplay from './TableDisplay.jsx';
import './ChatInterface.css';

export default function ChatInterface({ documents }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [tableId, setTableId] = useState(null);
  const [tableData, setTableData] = useState(null);
  const messagesEndRef = useRef(null);

  const primaryDocument = documents?.[0];

  useEffect(() => {
    if (!primaryDocument?.id) return;

    async function fetchMessages() {
      try {
        const response = await getChatMessages(primaryDocument.id);
        setMessages(response.messages ?? []);
      } catch (error) {
        console.error('Mesajlar alınırken hata oluştu:', error);
      }
    }

    fetchMessages();
  }, [primaryDocument?.id]);

  useEffect(() => {
    if (!tableId) return undefined;

    const interval = setInterval(async () => {
      try {
        const status = await getTableStatus(tableId);

        if (status.status === 'completed') {
          setTableData(status.tableData ?? null);
          setTableId(null);
          const updated = await getChatMessages(primaryDocument.id);
          setMessages(updated.messages ?? []);
        }

        if (status.status === 'failed') {
          setTableId(null);
          const updated = await getChatMessages(primaryDocument.id);
          setMessages(updated.messages ?? []);
        }
      } catch (error) {
        console.error('Durum kontrolü başarısız:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [tableId, primaryDocument?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const totalSize = documents.reduce((sum, doc) => sum + (doc.fileSize ?? 0), 0);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const message = input.trim();
    if (!message) return;

    try {
      setIsSending(true);
      setInput('');
      setTableData(null);

      const ids = documents.map((doc) => doc.id);
      const response = await sendChatMessage(ids, message);
      setTableId(response.tableId);

      const updated = await getChatMessages(primaryDocument.id);
      setMessages(updated.messages ?? []);
    } catch (error) {
      console.error('Mesaj gönderilirken hata:', error);
      alert(error.message ?? 'Mesaj gönderilemedi');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={`chat-layout ${tableData ? 'has-table' : ''}`}>
      <section className="chat-panel">
        <header className="chat-header">
          <div className="doc-chip">📄</div>
          <div>
            <div className="doc-title">
              {documents.length > 1
                ? `${documents.length} belge seçildi`
                : primaryDocument?.filename ?? 'Belge adı yok'}
            </div>
            <div className="doc-meta">
              Toplam boyut: {(totalSize / 1024).toFixed(1)} KB
            </div>
          </div>
        </header>

        <div className="messages">
          {messages.length === 0 ? (
            <div className="empty">
              <p>👋 Merhaba!</p>
              <p>Tabloya dönüştürmek istediğiniz anlatımı yazın.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`msg ${msg.role}`}>
                <div className="avatar">{msg.role === 'user' ? '🧑' : '🤖'}</div>
                <div className="bubble">
                  <div className="text">{msg.message}</div>
                  <div className="time">
                    {new Date(msg.created_at).toLocaleTimeString('tr-TR')}
                  </div>
                </div>
              </div>
            ))
          )}

          {tableId && (
            <div className="msg assistant processing">
              <div className="avatar">🤖</div>
              <div className="bubble">
                <div className="spinner" />
                <div>Tablo hazırlanıyor…</div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form className="chat-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            disabled={isSending}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Örn: Fiyatları ve adetleri ayrı sütunlarda göster"
          />
          <button type="submit" disabled={isSending || !input.trim()}>
            {isSending ? 'Gönderiliyor…' : 'Gönder'}
          </button>
        </form>
      </section>

      {tableData && (
        <aside className="table-panel">
          <TableDisplay data={tableData} />
        </aside>
      )}
    </div>
  );
}

ChatInterface.propTypes = {
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      filename: PropTypes.string,
      fileSize: PropTypes.number,
    })
  ).isRequired,
};
