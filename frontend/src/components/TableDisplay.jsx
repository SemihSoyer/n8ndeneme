import './TableDisplay.css';

export default function TableDisplay({ data }) {
  if (!data || !data.rows || data.rows.length === 0) {
    return (
      <div className="table-display-container">
        <div className="no-data">Tablo verisi bulunamadı</div>
      </div>
    );
  }

  // N8N'den gelen format: { columns: [], rows: [[]] }
  const columns = data.columns || data.headers || [];
  const rows = data.rows || [];

  // Rows array formatında mı object formatında mı kontrol et
  const isArrayFormat = rows.length > 0 && Array.isArray(rows[0]);

  const downloadCSV = () => {
    // CSV oluştur
    let csv = columns.join(',') + '\n';
    
    rows.forEach(row => {
      let values;
      if (isArrayFormat) {
        // Array formatı: her satır bir dizi
        values = row.map((cell, idx) => {
          const value = cell !== undefined && cell !== null ? String(cell) : '';
          return value.includes(',') || value.includes('"') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        });
      } else {
        // Object formatı: her satır bir obje
        values = columns.map(col => {
          const value = row[col] !== undefined && row[col] !== null ? String(row[col]) : '';
          return value.includes(',') || value.includes('"') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        });
      }
      csv += values.join(',') + '\n';
    });

    // İndir
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tablo_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="table-display-container">
      <div className="table-header">
        <h3>📊 Oluşturulan Tablo</h3>
        <button className="download-button" onClick={downloadCSV}>
          💾 CSV İndir
        </button>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={index}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column, colIndex) => {
                  let cellValue;
                  if (isArrayFormat) {
                    // Array formatı: index ile erişim
                    cellValue = row[colIndex];
                  } else {
                    // Object formatı: key ile erişim
                    cellValue = row[column];
                  }
                  
                  // Boş hücreleri göster
                  const displayValue = cellValue !== undefined && cellValue !== null 
                    ? String(cellValue) 
                    : '-';
                  
                  return (
                    <td key={colIndex}>
                      {displayValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        Toplam {rows.length} satır • {columns.length} sütun
      </div>
    </div>
  );
}

