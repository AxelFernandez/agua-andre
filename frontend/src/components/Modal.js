import React from 'react';

/**
 * Modal reutilizable para mensajes de éxito, error, advertencia e información
 * 
 * @param {boolean} isOpen - Controla si el modal está visible
 * @param {function} onClose - Función para cerrar el modal
 * @param {string} type - Tipo de modal: 'success', 'error', 'warning', 'info'
 * @param {string} title - Título del modal
 * @param {string} message - Mensaje del modal
 * @param {string} confirmText - Texto del botón de confirmación (default: 'Aceptar')
 * @param {function} onConfirm - Función opcional para ejecutar al confirmar (si no se provee, solo cierra)
 * @param {string} cancelText - Texto del botón de cancelar (opcional)
 * @param {function} onCancel - Función opcional para cancelar
 */
function Modal({ 
  isOpen, 
  onClose, 
  type = 'info', 
  title, 
  message, 
  confirmText = 'Aceptar',
  onConfirm,
  cancelText,
  onCancel 
}) {
  if (!isOpen) return null;

  const config = {
    success: {
      icon: 'check_circle',
      iconColor: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      buttonColor: 'bg-primary',
      buttonHover: 'hover:bg-primary/90'
    },
    error: {
      icon: 'error',
      iconColor: 'text-error',
      bgColor: 'bg-error/10',
      buttonColor: 'bg-error',
      buttonHover: 'hover:bg-error/90'
    },
    warning: {
      icon: 'warning',
      iconColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      buttonColor: 'bg-amber-600',
      buttonHover: 'hover:bg-amber-600/90'
    },
    info: {
      icon: 'info',
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      buttonColor: 'bg-primary',
      buttonHover: 'hover:bg-primary/90'
    }
  };

  const currentConfig = config[type] || config.info;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-background-dark rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
        <div className="flex flex-col items-center">
          {/* Ícono */}
          <div className={`${currentConfig.bgColor} rounded-full p-4 mb-4`}>
            <span className={`material-symbols-outlined text-5xl ${currentConfig.iconColor}`}>
              {currentConfig.icon}
            </span>
          </div>

          {/* Título */}
          {title && (
            <h2 className="text-2xl font-bold text-[#111618] dark:text-white mb-2 text-center">
              {title}
            </h2>
          )}
          
          {/* Mensaje */}
          {message && (
            <p className="text-[#617c89] dark:text-gray-400 text-center mb-6 whitespace-pre-line">
              {message}
            </p>
          )}

          {/* Botones */}
          <div className="w-full space-y-2">
            <button
              onClick={handleConfirm}
              className={`w-full h-12 px-6 ${currentConfig.buttonColor} text-white rounded-lg font-bold ${currentConfig.buttonHover} transition-colors`}
            >
              {confirmText}
            </button>
            
            {(cancelText || onCancel) && (
              <button
                onClick={handleCancel}
                className="w-full h-12 px-6 border border-gray-300 dark:border-gray-600 text-[#111618] dark:text-white rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {cancelText || 'Cancelar'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Modal;

