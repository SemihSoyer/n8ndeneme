import { useState, useEffect, useRef } from 'react';
import { sendChatMessage, getChatMessages, getTableStatus } from '../services/api';
import TableDisplay from './TableDisplay';
import './ChatInterface.css';

// Birden fazla dokümanı ve template bilgisini kabul edecek şekilde güncellendi
export default function ChatInterface({ documents, template }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [currentTableId, setCurrentTableId] = useState(null);
  const [tableData, setTableData] = useState(null);
  const messagesEndRef = useRef(null);
  const primaryDocument = documents[0]; // Ana doküman bilgisini gösterim için al

  // Mesajları yükle
  useEffect(() => {
    if (primaryDocument?.id) {
      loadMessages();
    }
  }, [primaryDocument]);

  // Polling - tablo durumunu kontrol et
  useEffect(() => {
    if (!currentTableId) return;

    const interval = setInterval(async () => {
      try {
        const status = await getTableStatus(currentTableId);
        
        if (status.status === 'completed') {
          setTableData(status.tableData);
          setCurrentTableId(null); // Polling'i durdur
          await loadMessages(); // Mesajları güncelle
        } else if (status.status === 'failed') {
          setCurrentTableId(null);
          await loadMessages();
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000); // Her 3 saniyede kontrol et

    return () => clearInterval(interval);
  }, [currentTableId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      // Sadece birincil dokümanın sohbet geçmişini yüklüyoruz.
      // Çoklu sohbet geçmişi birleştirme özelliği eklenebilir.
      const data = await getChatMessages(primaryDocument.id);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Load messages error:', error);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isSending) return;

    setIsSending(true);
    const userMessage = inputMessage.trim();
    setInputMessage('');

    try {
      // Tüm doküman ID'lerini bir diziye topla
      const documentIds = documents.map(doc => doc.id);
      // Template bilgisini de gönder
      const templateId = template?.id || 'genel-analiz';
      console.log('Template being sent:', templateId, 'Full template:', template);
      const result = await sendChatMessage(documentIds, userMessage, templateId);
      setCurrentTableId(result.tableId); // Polling başlat
      await loadMessages();
    } catch (error) {
      console.error('Send message error:', error);
      alert('Mesaj gönderilemedi: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={`chat-container ${tableData ? 'has-table' : ''}`}>
      <div className="chat-content-wrapper">
        <div className="chat-header">
          <div className="document-info">
            <span className="doc-icon">📚</span>
            <div>
              <div className="doc-name">
                {documents.length > 1 
                  ? `${documents.length} belge yüklendi` 
                  : primaryDocument.filename
                }
              </div>
              <div className="doc-meta">
                Toplam Boyut: {(documents.reduce((acc, doc) => acc + doc.fileSize, 0) / 1024).toFixed(1)} KB
              </div>
            </div>
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="empty-state">
              <p>👋 Merhaba!</p>
              <p>{template?.title && `${template.title} şablonu seçildi.`}</p>
              <p>Bu belgeden nasıl bir tablo oluşturmamı istersiniz?</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={msg.id || index} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="message-content">
                  <div className="message-text">{msg.message}</div>
                  <div className="message-time">
                    {new Date(msg.created_at).toLocaleTimeString('tr-TR')}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {currentTableId && (
            <div className="message assistant">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="processing-indicator">
                  <div className="spinner-small"></div>
                  <span>Tablo oluşturuluyor...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-form" onSubmit={handleSend}>
          <input
            type="text"
            className="chat-input"
            placeholder="Nasıl bir tablo oluşturmamı istersiniz?"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isSending}
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={isSending || !inputMessage.trim()}
          >
            {isSending ? '⏳' : '📤'}
          </button>
        </form>
      </div>

      {tableData && (
        <div className="table-display-wrapper">
          <TableDisplay data={tableData} />
        </div>
      )}
    </div>
  );
}

