// src/components/DataManager.jsx
import React, { useState, useRef } from 'react';
import { exportData, importData, mergeImportedData } from '../utils/localStorage';
import { Download, Upload, FileText, AlertTriangle, Check } from 'lucide-react';
import './DataManager.css';

const DataManager = ({ onDataChange }) => {
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [importMode, setImportMode] = useState('merge');
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  const handleExport = () => {
    try {
      const success = exportData();
      if (success) {
        setMessage({ type: 'success', text: 'Данные успешно экспортированы!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: 'Ошибка при экспорте данных' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при экспорте: ' + error.message });
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setMessage({ type: 'error', text: 'Выберите JSON файл' });
      return;
    }

    setImporting(true);
    setMessage({ type: '', text: '' });

    importData(file)
      .then((data) => {
        setImportPreview(data);
        setImporting(false);
      })
      .catch((error) => {
        setMessage({ type: 'error', text: error.message });
        setImporting(false);
        setImportPreview(null);
      });
  };

  const handleConfirmImport = () => {
    if (!importPreview) return;

    try {
      const success = mergeImportedData(importPreview, importMode);
      if (success) {
        setMessage({ type: 'success', text: 'Данные успешно импортированы!' });
        setImportPreview(null);
        onDataChange();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: 'Ошибка при импорте данных' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при импорте: ' + error.message });
    }

    // Очищаем input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelImport = () => {
    setImportPreview(null);
    setMessage({ type: '', text: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="data-manager">
      <h2>Управление данными</h2>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
          {message.text}
        </div>
      )}

      <div className="data-actions">
        <div className="export-section">
          <h3>Экспорт данных</h3>
          <p>Скачайте все ваши расходы и категории в JSON файл для резервного копирования или переноса на другое устройство.</p>
          <button className="export-btn" onClick={handleExport}>
            <Download size={18} />
            Экспортировать данные
          </button>
        </div>

        <div className="import-section">
          <h3>Импорт данных</h3>
          <p>Загрузите ранее сохраненный JSON файл с данными.</p>
          
          <div className="file-input-wrapper">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".json"
              className="file-input"
              id="import-file"
              disabled={importing}
            />
            <label htmlFor="import-file" className="file-input-label">
              <Upload size={18} />
              {importing ? 'Загрузка...' : 'Выбрать файл'}
            </label>
          </div>
        </div>
      </div>

      {importPreview && (
        <div className="import-preview">
          <h3>Предварительный просмотр импорта</h3>
          
          <div className="preview-stats">
            <div className="preview-stat">
              <FileText size={20} />
              <div>
                <div className="stat-number">{importPreview.expenses.length}</div>
                <div className="stat-label">Расходов</div>
              </div>
            </div>
            <div className="preview-stat">
              <div className="category-preview-icon">🏷️</div>
              <div>
                <div className="stat-number">{importPreview.categories.length}</div>
                <div className="stat-label">Категорий</div>
              </div>
            </div>
          </div>

          {importPreview.importDate && (
            <div className="import-date">
              <strong>Дата экспорта:</strong> {new Date(importPreview.importDate).toLocaleDateString('ru-RU')}
            </div>
          )}

          <div className="import-mode">
            <h4>Режим импорта:</h4>
            <div className="mode-options">
              <label className="mode-option">
                <input
                  type="radio"
                  name="importMode"
                  value="merge"
                  checked={importMode === 'merge'}
                  onChange={(e) => setImportMode(e.target.value)}
                />
                <span>Объединить с текущими данными</span>
                <small>Добавит новые записи к существующим</small>
              </label>
              
              <label className="mode-option">
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={(e) => setImportMode(e.target.value)}
                />
                <span>Заменить все данные</span>
                <small>⚠️ Удалит все текущие данные</small>
              </label>
            </div>
          </div>

          <div className="import-actions">
            <button className="confirm-btn" onClick={handleConfirmImport}>
              <Check size={16} />
              Импортировать
            </button>
            <button className="cancel-btn" onClick={handleCancelImport}>
              Отменить
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManager;
