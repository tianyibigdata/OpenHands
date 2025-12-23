/**
 * Generates a URL to redirect to for OAuth authentication
 * @param identityProvider The identity provider to use (e.g., "github", "gitlab", "bitbucket", "azure_devops")
 * @param requestUrl The URL of the request
 * @returns The URL to redirect to for OAuth
 */
export const generateAuthUrl = (
  identityProvider: string,
  requestUrl: URL,
  authUrl?: string,
) => {
  // Use HTTPS protocol unless the host is localhost or 127.0.0.1
  const isLocalhost =
    requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1";
  const protocol = isLocalhost ? requestUrl.protocol : "https:";

  // For local development, OAuth callback must go to backend (port 3000), not frontend dev server
  const callbackHost =
    isLocalhost && requestUrl.port === "3001"
      ? `${requestUrl.hostname}:3000` // Frontend dev server -> redirect to backend
      : requestUrl.host; // Production or backend -> use same host

  const redirectUri = `${protocol}//${callbackHost}/oauth/keycloak/callback`;

  let finalAuthUrl: string;

  if (authUrl) {
    // For local development, preserve http:// protocol if specified
    if (authUrl.startsWith("localhost") || authUrl.startsWith("127.0.0.1")) {
      finalAuthUrl = `http://${authUrl.replace(/^https?:\/\//, "")}`;
    } else {
      // Ensure https:// is prepended and remove any accidental duplicate slashes
      finalAuthUrl = `https://${authUrl.replace(/^https?:\/\//, "")}`;
    }
  } else {
    finalAuthUrl = requestUrl.hostname
      .replace(/(^|\.)staging\.all-hands\.dev$/, "$1auth.staging.all-hands.dev")
      .replace(/(^|\.)app\.all-hands\.dev$/, "auth.app.all-hands.dev")
      .replace(/(^|\.)localhost$/, "auth.staging.all-hands.dev");

    // If no replacements matched, prepend "auth." (excluding localhost)
    if (
      finalAuthUrl === requestUrl.hostname &&
      requestUrl.hostname !== "localhost"
    ) {
      finalAuthUrl = `auth.${requestUrl.hostname}`;
    }

    finalAuthUrl = `https://${finalAuthUrl}`;
  }

  // Hardcode for local development - change these values to match your local setup
  const realmName = isLocalhost ? "aganthos" : "allhands";
  const clientId = isLocalhost ? "aganthos-client" : "allhands";

  const scope = "openid email profile"; // OAuth scope - not user-facing
  const separator = requestUrl.search ? "&" : "?";
  const cleanHref = requestUrl.href.replace(/\/$/, "");
  const state = `${cleanHref}${separator}login_method=${identityProvider}`;
  return `${finalAuthUrl}/realms/${realmName}/protocol/openid-connect/auth?client_id=${clientId}&kc_idp_hint=${identityProvider}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}`;
};
