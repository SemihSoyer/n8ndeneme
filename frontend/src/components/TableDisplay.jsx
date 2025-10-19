import './TableDisplay.css';

export default function TableDisplay({ data }) {
  if (!data || !data.rows || data.rows.length === 0) {
    return (
      <div className="table-display-container">
        <div className="no-data">Tablo verisi bulunamadı</div>
      </div>
    );
  }

  const headers = data.headers || Object.keys(data.rows[0]);

  const downloadCSV = () => {
    // CSV oluştur
    let csv = headers.join(',') + '\n';
    data.rows.forEach(row => {
      const values = headers.map(h => {
        const value = row[h] || '';
        // Virgül içeren değerleri tırnak içine al
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      });
      csv += values.join(',') + '\n';
    });

    // İndir
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tablo_${new Date().getTime()}.csv`;
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
              {headers.map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {headers.map((header, colIndex) => (
                  <td key={colIndex}>{row[header]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        Toplam {data.rows.length} satır
      </div>
    </div>
  );
}

