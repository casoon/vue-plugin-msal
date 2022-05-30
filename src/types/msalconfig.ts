export interface MsalConfig {
  clientId: string;
  authority: string;
  redirectUri: string;
  postLogoutRedirectUri: string;
  cacheLocation: string;
  scopes: Array<string>;
}
