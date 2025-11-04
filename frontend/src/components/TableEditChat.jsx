import { useEffect, useRef, useState } from 'react';
import { editTableWithAI, getTableEditStatus } from '../services/api';
import './TableEditChat.css';

export default function TableEditChat({ tableId, tableData, onTableUpdate }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [editId, setEditId] = useState(null);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [sessionId] = useState(() => tableId); // Session ID = tableId (sabit)
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Polling mekanizması: editId varsa durumu kontrol et
  useEffect(() => {
    if (!editId) return undefined;

    const interval = setInterval(async () => {
      try {
        const status = await getTableEditStatus(editId);
        console.log('🔍 Edit status alındı:', status);

        if (status.status === 'completed') {
          console.log('✅ Düzenleme tamamlandı, tablo güncelleniyor...');
          // Düzenlenmiş tabloyu güncelle
          if (status.edited_table_data && onTableUpdate) {
            // edited_table_data string ise parse et
            const parsedData = typeof status.edited_table_data === 'string' 
              ? JSON.parse(status.edited_table_data) 
              : status.edited_table_data;
            console.log('📊 Parse edilmiş tablo verisi:', parsedData);
            onTableUpdate(parsedData);
            console.log('✅ onTableUpdate çağrıldı');
          } else {
            console.log('⚠️ edited_table_data veya onTableUpdate yok:', { 
              has_data: !!status.edited_table_data, 
              has_callback: !!onTableUpdate 
            });
          }

          // Başarı mesajı ekle
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              role: 'assistant',
              message: '✅ Tablo başarıyla düzenlendi!',
              created_at: new Date().toISOString(),
            },
          ]);

          setEditId(null);
          setIsSending(false);
        }

        if (status.status === 'failed') {
          // Hata mesajı ekle
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              role: 'assistant',
              message: `❌ Tablo düzenlenirken hata oluştu: ${status.error_message || 'Bilinmeyen hata'}`,
              created_at: new Date().toISOString(),
            },
          ]);

          setEditId(null);
          setIsSending(false);
        }
      } catch (error) {
        console.error('Düzenleme durumu kontrolü başarısız:', error);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            role: 'assistant',
            message: `❌ Durum kontrolü başarısız: ${error.message}`,
            created_at: new Date().toISOString(),
          },
        ]);
        setEditId(null);
        setIsSending(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [editId, onTableUpdate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const prompt = input.trim();
    if (!prompt || !tableId || !tableData) return;

    if (prompt.length > 500) {
      alert('Prompt maksimum 500 karakter olabilir');
      return;
    }

    try {
      setIsSending(true);
      
      // Kullanıcı mesajını ekle
      const userMessage = {
        id: Date.now(),
        role: 'user',
        message: prompt,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput('');

      // AI processing mesajı ekle
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          message: '🤖 AI tablonuzu düzenliyor...',
          created_at: new Date().toISOString(),
        },
      ]);

      const response = await editTableWithAI(tableId, tableData, prompt, {
        web_search: webSearchEnabled,
        session_id: sessionId,
      });

      if (response.edit_id) {
        setEditId(response.edit_id);
      } else {
        throw new Error('edit_id alınamadı');
      }
    } catch (error) {
      console.error('AI düzenleme hatası:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: 'assistant',
          message: `❌ Hata: ${error.message || 'Tablo düzenlenirken hata oluştu'}`,
          created_at: new Date().toISOString(),
        },
      ]);
      setIsSending(false);
    }
  };

  return (
    <div className="chat-content-wrapper">
      <div className="chat-header">
        <div className="document-info">
          <span className="doc-icon">🤖</span>
          <div>
            <div className="doc-name">AI Tablo Düzenleme</div>
            <div className="doc-meta">
              Tabloyu istediğiniz gibi düzenleyin
            </div>
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>🤖 Merhaba!</p>
            <p>Tablonuzu nasıl düzenlemek istersiniz?</p>
            <div className="example-prompts">
              <p className="examples-title">Örnekler:</p>
              <ul>
                <li>"100tl altındaki ürünleri çıkar"</li>
                <li>"Tarih formatını YYYY-MM-DD'ye çevir"</li>
                <li>"Fiyat kolonuna %18 KDV ekle"</li>
                <li>"Toplam tutarı hesapla ve ekle"</li>
              </ul>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.role}`}>
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

        {isSending && editId && (
          <div className="message assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="processing-indicator">
                <div className="spinner-small"></div>
                <span>Tablo düzenleniyor…</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <div className="web-search-wrapper">
          <button
            type="button"
            className={`web-search-btn ${webSearchEnabled ? 'active' : ''}`}
            onClick={() => setWebSearchEnabled(!webSearchEnabled)}
            disabled={isSending}
            title={webSearchEnabled ? 'Web Araması Açık' : 'Web Araması Kapalı'}
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span className="status-indicator"></span>
          </button>
          <span className="status-text">
            {webSearchEnabled ? 'Açık' : 'Kapalı'}
          </span>
        </div>
        <input
          type="text"
          className="chat-input"
          placeholder="Örn: 100tl altındaki ürünleri çıkar"
          value={input}
          disabled={isSending || !tableId}
          onChange={(event) => setInput(event.target.value)}
          maxLength={500}
        />
        <button 
          type="submit" 
          className="send-button"
          disabled={isSending || !input.trim() || !tableId}
        >
          {isSending ? '⏳' : '📤'}
        </button>
      </form>

      {input.length > 0 && (
        <div className="prompt-counter">
          {input.length}/500 karakter
        </div>
      )}
    </div>
  );
}

