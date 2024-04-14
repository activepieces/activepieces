loadActualAPSdk();
var loadSdkPromise;

function loadActualAPSdk() {
  loadSdkPromise = new Promise((resolve, reject) => {
    const scriptTag = document.createElement('script');
    //replace source with url from cdn
    scriptTag.src = 'SDK_URL';
    scriptTag.onload = () => {
      setApInWindow();
      resolve();
    };
    scriptTag.onerror = (err) => {
      reject(err);
    };
    scriptTag.async = true;
    document.head.append(scriptTag);
  });
}

function setApInWindow() {
  const apSdk = document.createElement('ap-sdk');
  document.body.append(apSdk);
  window.ap = apSdk;
}

// eslint-disable-next-line no-undef
ap = {};
const methodNames = ['init', 'connect', 'disconnect', 'isConnected'];
for (const method of methodNames) {
  // eslint-disable-next-line no-undef
  ap[method] = (...args) => {
    return new Promise((resolve, reject) => {
      loadSdkPromise.then(
        () => {
          window.ap[method](...args).then(
            (val) => resolve(val),
            (err) => reject(err)
          );
        },
        (err) => reject(err)
      );
    });
  };
}
