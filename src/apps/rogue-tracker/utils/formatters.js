// Funções de formatação para números
export const formatNumber = (num) => {
  if (!num || num === 0) return '0';
  return num.toFixed(1);
};

export const formatPercentage = (value) => {
  if (!value || value === 0) return '0%';
  return `${Math.round(value)}%`;
};

export const formatScore = (score) => {
  if (!score || score === 0) return '0.0';
  return score.toFixed(1);
};

export const formatAverage = (value) => {
  if (!value || value === 0) return '0.0';
  return (Math.round(value * 10) / 10).toFixed(1);
};
