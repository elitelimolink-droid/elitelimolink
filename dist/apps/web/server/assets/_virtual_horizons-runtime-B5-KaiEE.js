function resolveFetchUrl(input) {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  if (input && typeof input.url === "string") {
    return input.url;
  }
  return String(input ?? "");
}
if (typeof window !== "undefined") {
  let handleViteOverlay2 = function(node) {
    if (!node.shadowRoot) {
      return;
    }
    const backdrop = node.shadowRoot.querySelector(".backdrop");
    if (backdrop) {
      const overlayHtml = backdrop.outerHTML;
      const parser = new DOMParser();
      const doc = parser.parseFromString(overlayHtml, "text/html");
      const messageBodyElement = doc.querySelector(".message-body");
      const fileElement = doc.querySelector(".file");
      const messageText = messageBodyElement ? messageBodyElement.textContent.trim() : "";
      const fileText = fileElement ? fileElement.textContent.trim() : "";
      const error = messageText + (fileText ? ` File:${fileText}` : "");
      window.parent.postMessage({
        type: "horizons-vite-error",
        error
      }, "*");
    }
  }, firstAppStackFrame2 = function(stack) {
    if (typeof stack !== "string") {
      return null;
    }
    for (const line of stack.split("\n")) {
      if (!STACK_FRAME_LINE_REGEX.test(line) || line.includes("/node_modules/")) {
        continue;
      }
      const match = line.match(APP_STACK_FRAME_REGEX);
      if (match) {
        return match[1];
      }
    }
    return null;
  }, formatRouterError2 = function(error) {
    if (error instanceof Error) {
      return error.name && error.name !== "Error" ? `${error.name}: ${error.message}` : error.message || error.name || "Error";
    }
    if (!error || typeof error !== "object") {
      return error ? String(error) : null;
    }
    const { status, statusText, data, message } = error;
    if (typeof status === "number") {
      if (status < 500) {
        return null;
      }
      const detail = typeof data === "string" && data ? `: ${data}` : "";
      return `${status} ${statusText || "Server Error"}${detail}`;
    }
    if (typeof message === "string" && message) {
      return message;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }, describeRouterError2 = function(routeId, error) {
    const message = formatRouterError2(error);
    if (!message) {
      return null;
    }
    const frame = error instanceof Error ? firstAppStackFrame2(error.stack) : null;
    const origin = frame ? `${routeId}, ${frame}` : routeId;
    return `SSR error on ${window.location.pathname} (${origin}): ${message}`;
  }, reportRouterErrors2 = function(state) {
    if (!state.errors) {
      lastReportedRouterError = null;
      return;
    }
    const error = Object.entries(state.errors).map(([routeId, routeError]) => describeRouterError2(routeId, routeError)).filter((message) => !!message).join("\n");
    if (!error) {
      lastReportedRouterError = null;
      return;
    }
    if (error === lastReportedRouterError) {
      return;
    }
    lastReportedRouterError = error;
    window.parent.postMessage({
      type: "horizons-ssr-error",
      error
    }, "*");
  }, watchRouterErrors2 = function() {
    const router = window.__reactRouterDataRouter;
    if (!router) {
      return false;
    }
    reportRouterErrors2(router.state);
    router.subscribe(reportRouterErrors2);
    return true;
  }, parseStackFrameLine2 = function(line) {
    const lineColMatch = line.match(MATCH_LINE_COL_REGEX);
    if (!lineColMatch) return null;
    const [, lineNum, colNum] = lineColMatch;
    const suffix = `:${lineNum}:${colNum}`;
    const idx = line.lastIndexOf(suffix);
    if (idx === -1) return null;
    const before = line.substring(0, idx);
    const stackPath = before.replace(MATCH_AT_REGEX, "").trim();
    if (!stackPath) return null;
    try {
      const pathname = new URL(stackPath).pathname;
      const filePath = pathname.replace(MATCH_PATH_REGEX, "") || pathname;
      return `${filePath}:${lineNum}:${colNum}`;
    } catch {
      const filePath = stackPath.replace(MATCH_PATH_REGEX, "") || stackPath;
      return `${filePath}:${lineNum}:${colNum}`;
    }
  }, getFilePathFromStack2 = function(stack, skipFrames = 0) {
    if (!stack || typeof stack !== "string") return null;
    const lines = stack.split("\n").slice(1);
    const frames = lines.map((line) => parseStackFrameLine2(line.replace(/\r$/, ""))).filter(Boolean);
    return frames[skipFrames] ?? null;
  }, formatConsoleMessage2 = function(args, skipStackFrames = 1) {
    let messageString = "";
    let filePath = null;
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg instanceof Error) {
        filePath = getFilePathFromStack2(arg.stack, 0);
        messageString = `${arg.name}: ${arg.message}`;
        if (filePath) {
          messageString = `${messageString} at ${filePath}`;
        }
        break;
      }
    }
    if (!messageString) {
      messageString = args.map((arg) => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" ");
      const stack = new Error().stack;
      filePath = getFilePathFromStack2(stack, skipStackFrames);
      if (filePath) {
        messageString = `${messageString} at ${filePath}`;
      }
    }
    return messageString;
  }, isBenignFetchError2 = function(url, body) {
    return BENIGN_FETCH_ERRORS.some(([urlPattern, bodyPattern]) => urlPattern.test(url) && (!bodyPattern || bodyPattern.test(body)));
  }, hasValidationCode2 = function(value) {
    if (value == null) {
      return false;
    }
    if (typeof value === "string") {
      return value.startsWith("validation_");
    }
    if (Array.isArray(value)) {
      return value.some(hasValidationCode2);
    }
    if (typeof value === "object") {
      return Object.values(value).some(hasValidationCode2);
    }
    return false;
  }, isValidationFetchWarning2 = function(url, body) {
    if (!PLATFORM_URL_PATTERN.test(url)) {
      return false;
    }
    try {
      return hasValidationCode2(JSON.parse(body));
    } catch {
      return VALIDATION_CODE_TEXT_PATTERN.test(body);
    }
  };
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        if (addedNode.nodeType === Node.ELEMENT_NODE && (addedNode.tagName?.toLowerCase() === "vite-error-overlay" || addedNode.classList?.contains("backdrop"))) {
          handleViteOverlay2(addedNode);
        }
      }
    }
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  window.onerror = (message, source, lineno, colno, errorObj) => {
    const errorDetails = errorObj ? JSON.stringify({
      name: errorObj.name,
      message: errorObj.message,
      stack: errorObj.stack,
      source,
      lineno,
      colno
    }) : null;
    window.parent.postMessage({
      type: "horizons-runtime-error",
      message,
      error: errorDetails
    }, "*");
  };
  const ROUTER_POLL_INTERVAL_MS = 100;
  const ROUTER_POLL_TIMEOUT_MS = 2e4;
  const unpatchedConsoleWarn = console.warn;
  let lastReportedRouterError = null;
  const STACK_FRAME_LINE_REGEX = /^\s*at\s/;
  const APP_STACK_FRAME_REGEX = /\/(src\/[^\s):]+:\d+:\d+)/;
  if (!watchRouterErrors2()) {
    const routerPollStartedAt = Date.now();
    const routerPollInterval = setInterval(() => {
      if (watchRouterErrors2()) {
        clearInterval(routerPollInterval);
        return;
      }
      if (Date.now() - routerPollStartedAt > ROUTER_POLL_TIMEOUT_MS) {
        clearInterval(routerPollInterval);
        unpatchedConsoleWarn("[horizons-runtime] React Router data router never appeared, SSR errors will not be reported.");
      }
    }, ROUTER_POLL_INTERVAL_MS);
  }
  const originalConsoleError = console.error;
  const MATCH_LINE_COL_REGEX = /:(\d+):(\d+)\)?\s*$/;
  const MATCH_AT_REGEX = /^\s*at\s+(?:async\s+)?(?:.*?\s+)?\(?/;
  const MATCH_PATH_REGEX = /^\//;
  console.error = function(...args) {
    originalConsoleError.apply(console, args);
    window.parent.postMessage({
      type: "horizons-console-error",
      error: formatConsoleMessage2(args, 1)
    }, "*");
  };
  const originalConsoleWarn = console.warn;
  console.warn = function(...args) {
    originalConsoleWarn.apply(console, args);
    window.parent.postMessage({
      type: "horizons-console-warn",
      warning: formatConsoleMessage2(args, 1)
    }, "*");
  };
  const BENIGN_FETCH_ERRORS = [
    [/hcgi\/platform\/api\/collections\/.*auth-with-password.*/i, /Failed to authenticate/i],
    [/hcgi\/api\//i, /Insufficient credits/i],
    [/hcgi\/api\//i, /INTEGRATION_NOT_CONFIGURED/i]
  ];
  const PLATFORM_URL_PATTERN = /hcgi\/platform\//i;
  const VALIDATION_CODE_TEXT_PATTERN = /validation_/;
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = resolveFetchUrl(args[0]);
    if (url.startsWith("ws:") || url.startsWith("wss:")) {
      return originalFetch.apply(this, args);
    }
    return originalFetch.apply(this, args).then(async (response) => {
      const contentType = response.headers.get("Content-Type") || "";
      const isDocumentResponse = contentType.includes("text/html") || contentType.includes("application/xhtml+xml");
      const isOpaqueResponse = response.type === "opaque";
      if (!response.ok && !isDocumentResponse && !isOpaqueResponse) {
        const responseClone = response.clone();
        const errorFromRes = await responseClone.text();
        const requestUrl = response.url;
        const errorMessage = `Fetch error from ${requestUrl}: ${errorFromRes}`;
        if (isBenignFetchError2(requestUrl, errorFromRes)) {
          console.info(errorMessage);
        } else if (isValidationFetchWarning2(requestUrl, errorFromRes)) {
          console.warn(errorMessage);
        } else {
          console.error(errorMessage);
        }
      }
      return response;
    }).catch((error) => {
      if (!url.match(/\.html?$/i)) {
        if (error?.name === "AbortError") {
          console.info(error);
        } else {
          console.error(error);
        }
      }
      throw error;
    });
  };
  if (window.navigation && window.self !== window.top) {
    window.navigation.addEventListener("navigate", (event) => {
      const url = event.destination.url;
      try {
        const destinationUrl = new URL(url);
        const destinationOrigin = destinationUrl.origin;
        const currentOrigin = window.location.origin;
        if (destinationOrigin === currentOrigin) {
          return;
        }
      } catch {
        return;
      }
      window.parent.postMessage({
        type: "horizons-navigation-error",
        url
      }, "*");
    });
  }
}
