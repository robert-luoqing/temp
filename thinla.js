(function () {
  const thinlaCookieName = "__tlref__";
  const thinlaRefName = "tlref";
  const thinaAPIUrl =
    "https://api.dev.thinla.com/cms/shopify/callback/promotion";

  const thinlaMgr = {
    getCookie: function (cookieName) {
      const cookieString = document.cookie;
      const cookies = cookieString.split("; ");

      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].split("=");
        const name = decodeURIComponent(cookie[0].trim());

        if (name === cookieName) {
          return decodeURIComponent(cookie[1]);
        }
      }

      return null;
    },
    setCookie: function (cookieName, cookieValue, expirationDays) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expirationDays);

      const cookieString = `${encodeURIComponent(
        cookieName
      )}=${encodeURIComponent(
        cookieValue
      )}; expires=${expirationDate.toUTCString()}; path=/;`;
      document.cookie = cookieString;
    },
    getURLParamByKey: function (key) {
      const url = window.location.search.substring(1);
      const params = {};

      url.split("&").forEach((param) => {
        const parts = param.split("=");
        const paramKey = decodeURIComponent(parts[0]);
        const paramValue = decodeURIComponent(parts[1] || "");
        params[paramKey] = paramValue;
      });

      return params[key] || null;
    },
    reportedOrderIds: [],
    detectOrderAndReportToThinla: function () {
      // console.log("test: ", JSON.stringify(Shopify.checkout));
      if (
        typeof Shopify !== "undefined" &&
        Shopify.checkout &&
        Shopify.checkout.order_id
      ) {
        const orderId = Shopify.checkout.order_id;
        const shop = Shopify.shop;
        if (thinlaMgr.reportedOrderIds.indexOf(orderId) < 0) {
          thinlaMgr.reportedOrderIds.push(orderId);
          const referralCode = thinlaMgr.getCookie(thinlaCookieName);
          if (referralCode) {
            // Report to thinla
            fetch(thinaAPIUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                url: window.location.href,
                content: JSON.stringify(Shopify.checkout),
                orderId,
                shop,
                referralCode,
              }),
            })
              .then((resp) => {
                resp
                  .json()
                  .then((data) => {
                    if (data.message !== "Success") {
                      const index = thinlaMgr.reportedOrderIds.indexOf(orderId);
                      thinlaMgr.reportedOrderIds.splice(index, 1);
                    }
                  })
                  .catch((e) => {
                    const index = thinlaMgr.reportedOrderIds.indexOf(orderId);
                    thinlaMgr.reportedOrderIds.splice(index, 1);
                  });
              })
              .catch((e) => {
                const index = thinlaMgr.reportedOrderIds.indexOf(orderId);
                thinlaMgr.reportedOrderIds.splice(index, 1);
              });
          }
        }
      }
    },
  };

  // Set referal code into cookie
  const refValue = thinlaMgr.getURLParamByKey(thinlaRefName);
  if (refValue) {
    thinlaMgr.setCookie(thinlaCookieName, refValue, 1);
  }

  // Shopify.checkout
  // Shopify.checkout.order_id

  window.addEventListener("DOMContentLoaded", (event) => {
    thinlaMgr.detectOrderAndReportToThinla();
  });

  thinlaMgr.detectOrderAndReportToThinla();
  setInterval(() => {
    thinlaMgr.detectOrderAndReportToThinla();
  }, 4000);
})();
