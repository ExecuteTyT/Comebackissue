// ============================================
// VERCEL SERVERLESS FUNCTION ADAPTER
// Адаптер для Express приложения на Vercel
// ============================================

const app = require('../backend/server');

// Экспортируем Express app как serverless function для Vercel
module.exports = app;

