const { createApp } = require("../dist/create-app.js");

let appPromise;

async function getApp() {
  if (!appPromise) {
    appPromise = createApp().then(async (app) => {
      await app.init();
      return app;
    });
  }
  return appPromise;
}

module.exports = async function handler(request, response) {
  const app = await getApp();
  const express = app.getHttpAdapter().getInstance();
  express(request, response);
};
