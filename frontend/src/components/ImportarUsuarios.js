import React, { useState } from 'react';
import axios from '../services/axios';
import Modal from './Modal';

function ImportarUsuarios({ onImportComplete }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Por favor seleccione un archivo CSV');
        return;
      }
      setFile(selectedFile);
      setError('');
      setResult(null);
      setPreview(null);
    }
  };

  const handlePreview = async () => {
    if (!file) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/import/usuarios/csv/preview`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setPreview(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al generar vista previa');
    } finally {
      setLoading(false);
    }
  };

  const handleImportClick = () => {
    if (!file) return;
    setShowConfirmModal(true);
  };

  const handleImport = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/import/usuarios/csv`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data.data);
      if (onImportComplete) {
        onImportComplete(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al importar archivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
        Importar Usuarios desde CSV
      </h3>

      {/* Área de carga de archivo */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Seleccionar Archivo CSV
        </label>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="flex-1 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-800 dark:file:text-blue-400"
          />
        </div>
        {file && (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Archivo seleccionado: <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(2)} KB)
          </p>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handlePreview}
          disabled={!file || loading}
          className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && !result ? 'Procesando...' : 'Vista Previa'}
        </button>
        <button
          onClick={handleImportClick}
          disabled={!file || loading}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {loading && !preview ? 'Importando...' : 'Importar Ahora'}
        </button>
      </div>

      {/* Mensajes de error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Vista previa */}
      {preview && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Vista Previa (primeros 10 registros)</h4>
          <div className="overflow-x-auto max-h-64">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-blue-200 dark:border-blue-800">
                  <th className="text-left p-2">Nombre</th>
                  <th className="text-left p-2">Zona</th>
                  <th className="text-left p-2">Padrón</th>
                  <th className="text-left p-2">Dirección</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, idx) => (
                  <tr key={idx} className="border-b border-blue-100 dark:border-blue-900">
                    <td className="p-2 text-slate-900 dark:text-white">{row.NOMBRE}</td>
                    <td className="p-2 text-slate-600 dark:text-slate-400">{row.ZONA}</td>
                    <td className="p-2 text-slate-600 dark:text-slate-400">{row.PADRON}</td>
                    <td className="p-2 text-slate-600 dark:text-slate-400">{row.DIRE01}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resultado de la importación */}
      {result && (
        <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h4 className="font-bold text-green-900 dark:text-green-300 text-lg mb-4">
            ✅ Importación Completada
          </h4>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{result.total}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total de registros</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{result.exitosos}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Importados exitosamente</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{result.errores}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Con errores</p>
            </div>
          </div>

          {result.detalleErrores && result.detalleErrores.length > 0 && (
            <div className="mt-4">
              <h5 className="font-semibold text-red-900 dark:text-red-300 mb-2">
                Errores Encontrados:
              </h5>
              <div className="max-h-48 overflow-y-auto bg-white dark:bg-slate-800 rounded p-3">
                {result.detalleErrores.map((err, idx) => (
                  <div key={idx} className="text-sm mb-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="font-medium text-slate-900 dark:text-white">Línea {err.linea}:</span>
                    <span className="text-slate-600 dark:text-slate-400"> {err.nombre} - </span>
                    <span className="text-red-600 dark:text-red-400">{err.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instrucciones */}
      <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">📋 Formato del CSV:</h4>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
          <li>• Separador: punto y coma (;)</li>
          <li>• Columnas requeridas: NOMBRE, ZONA, PADRON, DIRE01</li>
          <li>• Columnas opcionales: WHATSAPP, TELEFONO, EMAIL, CUIT, TIPO, ORDEN</li>
          <li>• El padrón se formateará automáticamente al formato correcto</li>
          <li>• Tamaño máximo: 10MB</li>
        </ul>
      </div>

      {/* Modal de Confirmación */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        type="warning"
        title="Confirmar Importación"
        message={file ? `¿Está seguro de importar este archivo?\n\nArchivo: ${file.name}\nTamaño: ${(file.size / 1024).toFixed(2)} KB\n\nEsta acción puede tardar varios minutos si el archivo es grande.` : ''}
        confirmText="Confirmar Importación"
        onConfirm={handleImport}
        cancelText="Cancelar"
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
}

export default ImportarUsuarios;

