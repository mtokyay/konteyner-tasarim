/**
 * Format number as Turkish currency
 * 125000 -> "125.000,00 TL"
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) {
    return '0,00 TL';
  }

  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replace('₺', 'TL');
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${amount.toLocaleString('tr-TR')} TL`;
  }
}

/**
 * Format date as DD.MM.YYYY
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  if (!date) return '';

  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return '';
    }

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}.${month}.${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Format date with time as DD.MM.YYYY HH:MM
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date and time string
 */
export function formatDateTime(date) {
  if (!date) return '';

  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return '';
    }

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}.${month}.${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting date and time:', error);
    return '';
  }
}

/**
 * Format Turkish phone number
 * "5321234567" -> "0532 123 45 67"
 * @param {string} phone - Phone number (10 or 11 digits)
 * @returns {string} Formatted phone number
 */
export function formatPhone(phone) {
  if (!phone) return '';

  try {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');

    // If already starts with 0, use as is
    if (cleaned.startsWith('0')) {
      if (cleaned.length === 10) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`;
      }
      if (cleaned.length === 11) {
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
      }
    }

    // If 10 digits (mobile without 0), add 0
    if (cleaned.length === 10) {
      const withZero = `0${cleaned}`;
      return `${withZero.slice(0, 4)} ${withZero.slice(4, 7)} ${withZero.slice(7, 9)} ${withZero.slice(9)}`;
    }

    // Return original if can't parse
    return phone;
  } catch (error) {
    console.error('Error formatting phone:', error);
    return phone;
  }
}

/**
 * Format percentage
 * 0.18 -> "18%"
 * @param {number} value - Decimal value (0-1)
 * @returns {string} Formatted percentage
 */
export function formatPercentage(value) {
  if (value === null || value === undefined) {
    return '0%';
  }

  try {
    return `${(value * 100).toFixed(1)}%`;
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return '';
  }
}

/**
 * Status map for design status
 */
export const designStatusMap = {
  taslak: {
    label: 'Taslak',
    color: 'gray',
    bgColor: '#f3f4f6',
    textColor: '#374151',
  },
  onaybekleme: {
    label: 'Onay Bekleniyor',
    color: 'amber',
    bgColor: '#fef3c7',
    textColor: '#b45309',
  },
  onaylandi: {
    label: 'Onaylandı',
    color: 'green',
    bgColor: '#d1fae5',
    textColor: '#065f46',
  },
  reddedildi: {
    label: 'Reddedildi',
    color: 'red',
    bgColor: '#fee2e2',
    textColor: '#991b1b',
  },
  arsivlendi: {
    label: 'Arşivlendi',
    color: 'slate',
    bgColor: '#e2e8f0',
    textColor: '#1e293b',
  },
};

/**
 * Status map for contract status
 */
export const contractStatusMap = {
  taslak: {
    label: 'Taslak',
    color: 'gray',
    bgColor: '#f3f4f6',
    textColor: '#374151',
  },
  hazirlanmakta: {
    label: 'Hazırlanmakta',
    color: 'blue',
    bgColor: '#dbeafe',
    textColor: '#1e40af',
  },
  onaybeklemede: {
    label: 'Onay Bekleniyor',
    color: 'amber',
    bgColor: '#fef3c7',
    textColor: '#b45309',
  },
  imzalandi: {
    label: 'İmzalandı',
    color: 'green',
    bgColor: '#d1fae5',
    textColor: '#065f46',
  },
  gecerliligi: {
    label: 'Geçerli',
    color: 'emerald',
    bgColor: '#ccfbf1',
    textColor: '#134e4a',
  },
  sona_erdi: {
    label: 'Sona Erdi',
    color: 'slate',
    bgColor: '#e2e8f0',
    textColor: '#1e293b',
  },
  iptal_edildi: {
    label: 'İptal Edildi',
    color: 'red',
    bgColor: '#fee2e2',
    textColor: '#991b1b',
  },
};

/**
 * Status map for payment status
 */
export const paymentStatusMap = {
  beklemede: {
    label: 'Bekleniyor',
    color: 'amber',
    bgColor: '#fef3c7',
    textColor: '#b45309',
  },
  odenmi: {
    label: 'Ödendi',
    color: 'green',
    bgColor: '#d1fae5',
    textColor: '#065f46',
  },
  kismen_odenmi: {
    label: 'Kısmen Ödendi',
    color: 'blue',
    bgColor: '#dbeafe',
    textColor: '#1e40af',
  },
  gecikmeli: {
    label: 'Gecikmeli',
    color: 'orange',
    bgColor: '#fed7aa',
    textColor: '#92400e',
  },
  iptal: {
    label: 'İptal',
    color: 'red',
    bgColor: '#fee2e2',
    textColor: '#991b1b',
  },
  geri_odeme: {
    label: 'Geri Ödeme',
    color: 'purple',
    bgColor: '#e9d5ff',
    textColor: '#6b21a8',
  },
};

/**
 * Status map for production status
 */
export const productionStatusMap = {
  planlandi: {
    label: 'Planlandı',
    color: 'gray',
    bgColor: '#f3f4f6',
    textColor: '#374151',
  },
  baslandi: {
    label: 'Başlandı',
    color: 'blue',
    bgColor: '#dbeafe',
    textColor: '#1e40af',
  },
  devaminda: {
    label: 'Devam Ediyor',
    color: 'cyan',
    bgColor: '#cffafe',
    textColor: '#164e63',
  },
  kontrol_bekleme: {
    label: 'Kontrol Bekleniyor',
    color: 'amber',
    bgColor: '#fef3c7',
    textColor: '#b45309',
  },
  kontrol_basarili: {
    label: 'Kontrol Başarılı',
    color: 'green',
    bgColor: '#d1fae5',
    textColor: '#065f46',
  },
  kontrol_basarisiz: {
    label: 'Kontrol Başarısız',
    color: 'red',
    bgColor: '#fee2e2',
    textColor: '#991b1b',
  },
  teslim_hazirligi: {
    label: 'Teslim Hazırlığı',
    color: 'lime',
    bgColor: '#dcfce7',
    textColor: '#166534',
  },
  teslim_edildi: {
    label: 'Teslim Edildi',
    color: 'emerald',
    bgColor: '#ccfbf1',
    textColor: '#134e4a',
  },
  iptal: {
    label: 'İptal',
    color: 'slate',
    bgColor: '#e2e8f0',
    textColor: '#1e293b',
  },
};

/**
 * Get status badge data by status value and type
 * @param {string} status - Status value (e.g., 'onaylandi')
 * @param {string} type - Entity type (e.g., 'design', 'contract', 'payment', 'production')
 * @returns {Object|null} Status data with label and colors
 */
export function getStatusBadge(status, type) {
  let statusMap = {};

  switch (type) {
    case 'design':
      statusMap = designStatusMap;
      break;
    case 'contract':
      statusMap = contractStatusMap;
      break;
    case 'payment':
      statusMap = paymentStatusMap;
      break;
    case 'production':
      statusMap = productionStatusMap;
      break;
    default:
      return null;
  }

  return statusMap[status] || null;
}

/**
 * Format file size in human readable format
 * 1024 -> "1 KB"
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format large numbers with Turkish locale
 * 1234567 -> "1.234.567"
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  if (num === null || num === undefined) {
    return '0';
  }

  try {
    return num.toLocaleString('tr-TR');
  } catch (error) {
    console.error('Error formatting number:', error);
    return num.toString();
  }
}

/**
 * Truncate text to specified length and add ellipsis
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, length = 50) {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * Format person name to title case
 * "MEHMET TOKYAY" -> "Mehmet Tokyay"
 * @param {string} name - Name to format
 * @returns {string} Formatted name
 */
export function formatPersonName(name) {
  if (!name) return '';

  return name
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert snake_case to Turkish sentence case
 * "onaybekleme" -> "Onay Bekleniyor"
 * @param {string} text - Text to convert
 * @returns {string} Formatted text
 */
export function snakeCaseToLabel(text) {
  if (!text) return '';

  return text
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
