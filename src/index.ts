import { App, reactive } from "vue";
import { EventMessage, EventMessageUtils, EventType, InteractionStatus, PublicClientApplication, AccountInfo, LogLevel } from "@azure/msal-browser";
import { MsalConfig } from "./types";
import { Router } from "vue-router";
import { registerGuard } from "./lib"

type AccountIdentifiers = Partial<Pick<AccountInfo, "homeAccountId"|"localAccountId"|"username">>;


export const msalPlugin = {
  install: (app: App, config: MsalConfig, router: Router) => {

    const msalConfig = {
      auth: {
        clientId: config.clientId,
        authority: config.authority,
        redirectUri: config.redirectUri,
        postLogoutRedirectUri: config.postLogoutRedirectUri
      },
      cache: {
        cacheLocation: config.cacheLocation
      },
      system: {
        loggerOptions: {
          loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
            if (containsPii) {
              return;
            }
            switch (level) {
              case LogLevel.Error:
                console.error(message);
                return;
              case LogLevel.Info:
                console.info(message);
                return;
              case LogLevel.Verbose:
                console.debug(message);
                return;
              case LogLevel.Warning:
                console.warn(message);
                return;
              default:
                return;
            }
          },
          logLevel: LogLevel.Verbose
        }
      }
    };

    const msalInstance = new PublicClientApplication(msalConfig);

    const loginRequest = {
      scopes: config.scopes,
    };

    const inProgress = InteractionStatus.Startup;
    const accounts = msalInstance.getAllAccounts();

    registerGuard(router, msalInstance, loginRequest);

    const state = reactive({
      instance: msalInstance,
      inProgress: inProgress,
      accounts: accounts
    });

    app.config.globalProperties.$msal = state;

    msalInstance.addEventCallback((message: EventMessage) => {
      switch (message.eventType) {
        case EventType.ACCOUNT_ADDED:
        case EventType.ACCOUNT_REMOVED:
        case EventType.LOGIN_SUCCESS:
        case EventType.SSO_SILENT_SUCCESS:
        case EventType.HANDLE_REDIRECT_END:
        case EventType.LOGIN_FAILURE:
        case EventType.SSO_SILENT_FAILURE:
        case EventType.LOGOUT_END:
        case EventType.ACQUIRE_TOKEN_SUCCESS:
        case EventType.ACQUIRE_TOKEN_FAILURE:
          const currentAccounts = msalInstance.getAllAccounts();
          if (!accountArraysAreEqual(currentAccounts, state.accounts)) {
            state.accounts = currentAccounts;
          }
          break;
      }

      const status = EventMessageUtils.getInteractionStatusFromEvent(message, state.inProgress);
      if (status !== null) {
        state.inProgress = status;
      }
    });

  }
}

/**
 * Helper function to determine whether 2 arrays are equal
 * Used to avoid unnecessary state updates
 * @param arrayA
 * @param arrayB
 */
function accountArraysAreEqual(arrayA: Array<AccountIdentifiers>, arrayB: Array<AccountIdentifiers>): boolean {
  if (arrayA.length !== arrayB.length) {
    return false;
  }

  const comparisonArray = [...arrayB];

  return arrayA.every((elementA) => {
    const elementB = comparisonArray.shift();
    if (!elementA || !elementB) {
      return false;
    }

    return (elementA.homeAccountId === elementB.homeAccountId) &&
      (elementA.localAccountId === elementB.localAccountId) &&
      (elementA.username === elementB.username);
  });
}
