/**
 * Configurações do Projeto Catalogo V3
 * IMPORTANTE: Em produção, use variáveis de ambiente
 */

const AppConfig = {
  firebase: {
 apiKey: "AIzaSyAZ90xAptvBeRDFl52FI7-WJJD14I6YKk4",
  authDomain: "drak-feet-admin.firebaseapp.com",
  projectId: "drak-feet-admin",
  storageBucket: "drak-feet-admin.firebasestorage.app",
  messagingSenderId: "525123704162",
  appId: "1:525123704162:web:ea0a3bc86663334a79c83b",
  measurementId: "G-EFERT7RZZ5"
  },

  cloudinary: {
   cloudName: 'dz2alj2st',
    uploadPreset: 'drakfeet_products'
  },

  appCheck: {
    siteKey: ''
  },

  session: {
    timeout: 30 * 60 * 1000,
    warningTime: 5 * 60 * 1000,
    checkInterval: 60 * 1000
  },

  security: {
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000
  },

  app: {
    name: "Catalogo Admin",
    version: "3.0.0",
    basePath: "/admin",
    environment: "production"
  }
};

function validateConfig() {
  if (!AppConfig.firebase.apiKey) {
    console.warn("Configure as credenciais do Firebase!");
  }

  if (!AppConfig.security.maxLoginAttempts || AppConfig.security.maxLoginAttempts < 3) {
    console.warn("maxLoginAttempts muito baixo. Revise AppConfig.security.");
  }
}

validateConfig();

window.AppConfig = AppConfig;

