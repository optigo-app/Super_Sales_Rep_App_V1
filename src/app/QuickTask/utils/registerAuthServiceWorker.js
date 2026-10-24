export function registerAuthServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl =
        process.env.NODE_ENV === 'development'
          ? `${process.env.PUBLIC_URL}/sw.js`
          : `/sw.js`;

      console.log('service worker url: ', swUrl)
      navigator.serviceWorker.register(swUrl, {
        scope: '/'
      })
        .then(registration => {
          console.log('Auth Service Worker registered successfully:', registration.scope);
          return registration.scope;
        })
        .catch(error => {
          console.error('Auth Service Worker registration failed:', error);
        });
    });

    if (navigator.serviceWorker.controller) {
      console.log('Service worker is already active');
      // initializeMessageChannel();
    } else {
      // Wait for the service worker to be activated
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service worker now controlling the page');
        // initializeMessageChannel();
      });
    }
  }
}

export function getServiceWorkerRegistration() {
  return navigator.serviceWorker.getRegistration();
}
export function sendMessageToServiceWorker(message) {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
    return true;
  }
  return false;
}