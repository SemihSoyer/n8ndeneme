import { useState, useRef, useEffect } from 'react';
import ExcelJS from 'exceljs';
import './TableDisplay.css';

export default function TableDisplay({ data }) {
  const [editingCell, setEditingCell] = useState(null);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [draggedRow, setDraggedRow] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [dragOverRow, setDragOverRow] = useState(null);
  const inputRef = useRef(null);
  
  // Undo/Redo için history yönetimi
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // State olarak tablo verisini tut
  const [tableData, setTableData] = useState(() => {
    if (!data || !data.rows || data.rows.length === 0) {
      return { columns: [], rows: [] };
    }
    
    const columns = data.columns || data.headers || [];
    const rows = data.rows || [];
    
    // Array format'ı object format'a çevir
    const isArrayFormat = rows.length > 0 && Array.isArray(rows[0]);
    
    if (isArrayFormat) {
      const convertedRows = rows.map(row => {
        const obj = {};
        columns.forEach((col, idx) => {
          obj[col] = row[idx] !== undefined && row[idx] !== null ? row[idx] : '';
        });
        return obj;
      });
      return { columns, rows: convertedRows };
    }
    
    return { columns, rows };
  });

  // History'ye kayıt ekleme fonksiyonu
  const addToHistory = (newTableData) => {
    setHistory(prevHistory => {
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(newTableData)));
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  };

  // İlk veriyi history'ye ekle
  useEffect(() => {
    if (tableData.columns.length > 0 && history.length === 0) {
      const initialHistory = [JSON.parse(JSON.stringify(tableData))];
      setHistory(initialHistory);
      setHistoryIndex(0);
    }
  }, [tableData.columns.length]);

  // Keyboard shortcut: Ctrl+Z (undo) ve Ctrl+Y (redo)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setTableData(JSON.parse(JSON.stringify(history[newIndex])));
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          setTableData(JSON.parse(JSON.stringify(history[newIndex])));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, historyIndex]);

  // Undo fonksiyonu
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setTableData(JSON.parse(JSON.stringify(history[newIndex])));
    }
  };

  // Redo fonksiyonu
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setTableData(JSON.parse(JSON.stringify(history[newIndex])));
    }
  };

  if (!data || !data.rows || data.rows.length === 0) {
    return (
      <div className="table-display-container">
        <div className="no-data">Tablo verisi bulunamadı</div>
      </div>
    );
  }

  // Hücre düzenleme
  const handleCellDoubleClick = (rowIndex, columnName, currentValue) => {
    setEditingCell({ rowIndex, columnName, value: currentValue });
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCellChange = (value) => {
    setEditingCell(prev => ({ ...prev, value }));
  };

  const handleCellBlur = () => {
    if (editingCell) {
      const { rowIndex, columnName, value } = editingCell;
      const newRows = [...tableData.rows];
      newRows[rowIndex][columnName] = value;
      const newTableData = { ...tableData, rows: newRows };
      setTableData(newTableData);
      addToHistory(newTableData);
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  // Sütun silme
  const deleteColumn = (columnName) => {
    const newColumns = tableData.columns.filter(col => col !== columnName);
    const newRows = tableData.rows.map(row => {
      const newRow = { ...row };
      delete newRow[columnName];
      return newRow;
    });
    const newTableData = { columns: newColumns, rows: newRows };
    setTableData(newTableData);
    addToHistory(newTableData);
  };

  // Satır silme
  const deleteRow = (rowIndex) => {
    const newRows = tableData.rows.filter((_, idx) => idx !== rowIndex);
    const newTableData = { ...tableData, rows: newRows };
    setTableData(newTableData);
    addToHistory(newTableData);
  };

  // Sütun sürükleme
  const handleColumnDragStart = (e, columnIndex) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedColumn(columnIndex);
    e.target.style.opacity = '0.5';
  };

  const handleColumnDragOver = (e, targetIndex) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedColumn !== null && draggedColumn !== targetIndex) {
      setDragOverColumn(targetIndex);
    }
  };

  const handleColumnDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleColumnDrop = (e, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverColumn(null);
    
    if (draggedColumn === null || draggedColumn === targetIndex) {
      setDraggedColumn(null);
      return;
    }

    const newColumns = [...tableData.columns];
    const [removed] = newColumns.splice(draggedColumn, 1);
    newColumns.splice(targetIndex, 0, removed);
    
    const newTableData = { ...tableData, columns: newColumns };
    setTableData(newTableData);
    addToHistory(newTableData);
    setDraggedColumn(null);
  };

  const handleColumnDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  // Satır sürükleme
  const handleRowDragStart = (e, rowIndex) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', rowIndex.toString());
    setDraggedRow(rowIndex);
    e.currentTarget.style.opacity = '0.5';
  };

  const handleRowDragOver = (e, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (draggedRow !== null && draggedRow !== targetIndex) {
      setDragOverRow(targetIndex);
    }
  };

  const handleRowDragLeave = (e) => {
    // Sadece tbody'den ayrıldığımızda temizle, child elementlere geçerken değil
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverRow(null);
    }
  };

  const handleRowDrop = (e, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverRow(null);
    
    if (draggedRow === null || draggedRow === targetIndex) {
      setDraggedRow(null);
      return;
    }

    const newRows = [...tableData.rows];
    const [removed] = newRows.splice(draggedRow, 1);
    
    // Doğru insert index hesapla
    // Eğer sürüklenen satır target'tan önceyse, target index korunur (zaten splice ile çıkarıldı)
    // Eğer sürüklenen satır target'tan sonraysa, target index olduğu gibi kullanılır
    const insertIndex = draggedRow < targetIndex ? targetIndex - 1 : targetIndex;
    
    newRows.splice(insertIndex, 0, removed);
    
    const newTableData = { ...tableData, rows: newRows };
    setTableData(newTableData);
    addToHistory(newTableData);
    setDraggedRow(null);
  };

  const handleRowDragEnd = (e) => {
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedRow(null);
    setDragOverRow(null);
  };

  // TD elementleri için drag event handler'ları
  const handleTdDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedRow !== null) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleTdDrop = (e, rowIndex) => {
    e.preventDefault();
    e.stopPropagation();
    handleRowDrop(e, rowIndex);
  };

  // CSV İndirme
  const downloadCSV = () => {
    let csv = tableData.columns.join(',') + '\n';
    
    tableData.rows.forEach(row => {
      const values = tableData.columns.map(col => {
        const value = row[col] !== undefined && row[col] !== null ? String(row[col]) : '';
        return value.includes(',') || value.includes('"') 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      });
      csv += values.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tablo_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Excel İndirme - Profesyonel Formatlama ile
  const downloadExcel = async () => {
    try {
      // Yeni workbook oluştur
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Tablo');

      // Header row ekle ve stil ver
      const headerRow = worksheet.addRow(tableData.columns);
      headerRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' } // Mavi arka plan
      };
      headerRow.alignment = { 
        vertical: 'middle', 
        horizontal: 'center',
        wrapText: true
      };
      headerRow.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
      headerRow.height = 25;

      // Data rows ekle
      tableData.rows.forEach((row, rowIndex) => {
        const rowData = tableData.columns.map(col => {
          const value = row[col];
          if (value === null || value === undefined) return '';
          
          // Sayısal değerleri kontrol et
          const numValue = Number(value);
          if (!isNaN(numValue) && value.toString().trim() !== '' && value !== '') {
            return numValue;
          }
          return String(value);
        });
        
        const excelRow = worksheet.addRow(rowData);
        
        // Zebra striping - çift satırlar için açık gri arka plan
        const isEvenRow = rowIndex % 2 === 0;
        if (isEvenRow) {
          excelRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
          };
        }
        
        // Border ekle
        excelRow.border = {
          top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
        };
        
        excelRow.alignment = { 
          vertical: 'middle',
          wrapText: true
        };
        excelRow.height = 20;

        // Her hücre için sayısal değer kontrolü ve hizalama
        excelRow.eachCell((cell, colNumber) => {
          if (typeof cell.value === 'number') {
            cell.alignment = { 
              ...cell.alignment, 
              horizontal: 'right' 
            };
            // Sayısal format
            cell.numFmt = '#,##0.00';
          } else {
            cell.alignment = { 
              ...cell.alignment, 
              horizontal: 'left' 
            };
          }
        });
      });

      // Column genişliklerini otomatik ayarla
      tableData.columns.forEach((col, index) => {
        const column = worksheet.getColumn(index + 1);
        let maxLength = col ? String(col).length : 10;
        
        // Her sütundaki maksimum içerik uzunluğunu bul
        tableData.rows.forEach(row => {
          const value = row[col];
          if (value !== null && value !== undefined) {
            const valueLength = String(value).length;
            maxLength = Math.max(maxLength, valueLength);
          }
        });
        
        // Minimum 10, maksimum 50 karakter genişlik
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      });

      // Header row'u freeze et (scroll yaparken header görünür kalsın)
      worksheet.views = [
        { state: 'frozen', ySplit: 1 }
      ];

      // Excel dosyasını oluştur ve indir
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `tablo_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      
      // URL'i temizle
      setTimeout(() => URL.revokeObjectURL(link.href), 100);
    } catch (error) {
      console.error('Excel export hatası:', error);
      alert('Excel dosyası oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="table-display-container">
      <div className="table-header">
        <h3>📊 Oluşturulan Tablo</h3>
        <div className="header-actions">
          <span className="table-info">
            {tableData.rows.length} satır × {tableData.columns.length} sütun
          </span>
          <div className="action-buttons">
            <button
              className="undo-button"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Geri al (Ctrl+Z)"
            >
              ↶ Geri Al
            </button>
            <button
              className="redo-button"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Yinele (Ctrl+Y)"
            >
              ↷ Yinele
            </button>
            <button className="excel-button" onClick={downloadExcel} title="Excel dosyası olarak indir">
              📊 Excel İndir
            </button>
            <button className="download-button" onClick={downloadCSV} title="CSV dosyası olarak indir">
              💾 CSV İndir
            </button>
          </div>
        </div>
      </div>

      <div className="table-controls-info">
        <span className="control-hint">💡 İpucu: Sütun/satırları sürükleyip bırakarak yerlerini değiştirin • Hücrelere çift tıklayarak düzenleyin</span>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th className="row-number-header">#</th>
              {tableData.columns.map((column, colIndex) => (
                <th
                  key={colIndex}
                  draggable
                  onDragStart={(e) => handleColumnDragStart(e, colIndex)}
                  onDragOver={(e) => handleColumnDragOver(e, colIndex)}
                  onDragLeave={handleColumnDragLeave}
                  onDrop={(e) => handleColumnDrop(e, colIndex)}
                  onDragEnd={handleColumnDragEnd}
                  className={
                    draggedColumn === colIndex 
                      ? 'dragging' 
                      : dragOverColumn === colIndex 
                      ? 'drag-over' 
                      : ''
                  }
                >
                  <div className="th-content">
                    <span className="drag-handle" title="Sürükle">⋮⋮</span>
                    <span className="column-name">{column}</span>
                    <button
                      className="delete-column-btn"
                      onClick={() => deleteColumn(column)}
                      title="Sütunu sil"
                    >
                      ×
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                draggable
                onDragStart={(e) => handleRowDragStart(e, rowIndex)}
                onDragOver={(e) => handleRowDragOver(e, rowIndex)}
                onDragLeave={handleRowDragLeave}
                onDrop={(e) => handleRowDrop(e, rowIndex)}
                onDragEnd={handleRowDragEnd}
                className={
                  draggedRow === rowIndex 
                    ? 'dragging' 
                    : dragOverRow === rowIndex 
                    ? 'drag-over' 
                    : ''
                }
              >
                <td className="row-number">
                  <div className="row-number-content">
                    <span className="drag-handle" title="Sürükle">⋮⋮</span>
                    <span>{rowIndex + 1}</span>
                    <button
                      className="delete-row-btn"
                      onClick={() => deleteRow(rowIndex)}
                      title="Satırı sil"
                    >
                      ×
                    </button>
                  </div>
                </td>
                {tableData.columns.map((column, colIndex) => {
                  const cellValue = row[column] !== undefined && row[column] !== null 
                    ? String(row[column]) 
                    : '';
                  
                  const isEditing = editingCell?.rowIndex === rowIndex && 
                                   editingCell?.columnName === column;
                  
                  return (
                    <td
                      key={colIndex}
                      onDoubleClick={() => handleCellDoubleClick(rowIndex, column, cellValue)}
                      onDragOver={handleTdDragOver}
                      onDrop={(e) => handleTdDrop(e, rowIndex)}
                      className={isEditing ? 'editing' : ''}
                    >
                      {isEditing ? (
                        <input
                          ref={inputRef}
                          type="text"
                          className="cell-input"
                          value={editingCell.value}
                          onChange={(e) => handleCellChange(e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={handleKeyDown}
                        />
                      ) : (
                        <span className="cell-content" title="Düzenlemek için çift tıklayın">
                          {cellValue || '-'}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
