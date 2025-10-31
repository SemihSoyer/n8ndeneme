import PropTypes from 'prop-types';
import './TableDisplay.css';

export default function TableDisplay({ data }) {
  const columns = data?.columns ?? data?.headers ?? [];
  const rows = data?.rows ?? [];

  if (!columns.length || !rows.length) {
    return (
      <div className="table-container">
        <p className="table-empty">Tablo verisi henüz hazır değil.</p>
      </div>
    );
  }

  const isArrayRows = Array.isArray(rows[0]);

  const downloadCsv = () => {
    const csvRows = [columns.join(',')];

    rows.forEach((row) => {
      const cells = isArrayRows
        ? row.map((cell) => sanitizeCell(cell))
        : columns.map((column) => sanitizeCell(row[column]));
      csvRows.push(cells.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tablo-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="table-container">
      <div className="table-header">
        <h3>📊 Tablo Önizleme</h3>
        <button type="button" onClick={downloadCsv}>
          CSV indir
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column, colIndex) => {
                  const value = isArrayRows ? row[colIndex] : row[column];
                  return <td key={column}>{value ?? '-'}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        {rows.length} satır • {columns.length} sütun
      </div>
    </div>
  );
}

TableDisplay.propTypes = {
  data: PropTypes.shape({
    columns: PropTypes.arrayOf(PropTypes.string),
    headers: PropTypes.arrayOf(PropTypes.string),
    rows: PropTypes.array,
  }),
};

function sanitizeCell(value) {
  const text = value ?? '';
  const stringValue = String(text);
  if (stringValue.includes(',') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}
