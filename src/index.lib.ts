import { defineStore } from "pinia";
import { PublicClientApplication, Configuration, InteractionType, PopupRequest, RedirectRequest, EventMessage, EventMessageUtils, EventType, InteractionStatus,  AccountInfo } from "@azure/msal-browser";
import { RouteLocationNormalized, Router } from "vue-router";
import axios, {AxiosInstance} from "axios";

type AccountIdentifiers = Partial<Pick<AccountInfo, "homeAccountId"|"localAccountId"|"username">>;

export const useAuth = defineStore("auth", {
    state: () => {
        return ({
            inProgress: InteractionStatus.Startup,
            error: null,
            accessToken: null,
            interactionType: InteractionType.Redirect,
            accessTokenRequest: {
                scopes: [],
                account: undefined as AccountInfo | undefined,
            },
            accounts: new Array<AccountInfo>(),
            msalConfig: undefined as Configuration | undefined,
            axiosConfig: undefined as Configuration | undefined,
            msalInstance:  undefined as PublicClientApplication | undefined,
            axiosInstance:  undefined as AxiosInstance | undefined
        });
    },
    actions: {
        init(msalConfig: any, axiosConfig: any){
            if (msalConfig != undefined && msalConfig != null) {
                this.msalConfig = msalConfig;
                this.createClientApplication(this.msalConfig);
            }
            if (axiosConfig != undefined && axiosConfig != null) {
                this.axiosConfig = axiosConfig;
                this.createAxiosInstance(this.axiosConfig);
            }
            return this;
        },
        createClientApplication(msalConfig: any){
            this.msalInstance = new PublicClientApplication(msalConfig);
            this.msalInstance.addEventCallback((message: EventMessage) => {
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
                        const currentAccounts = this.msalInstance!.getAllAccounts();
                        if (!accountArraysAreEqual(currentAccounts, this.accounts!)) {
                            this.accounts = currentAccounts;
                        }
                        break;
                }

                const status = EventMessageUtils.getInteractionStatusFromEvent(message, this.inProgress);
                if (status !== null) {
                    this.inProgress = status;
                }
            });

            return this;
        },
        createAxiosInstance(axiosConfig: any){
            this.axiosInstance = axios.create(axiosConfig);
            /*
            this.axiosInstance.interceptors.request.use(
                (config) => {
                    return this.msalInstance!
                        .acquireTokenSilent(this.accessTokenRequest)
                        .then(function (accessTokenResponse: any) {
                            config.headers = {
                                Authorization: `Bearer ${accessTokenResponse.accessToken}`,
                                Accept: "application/json",
                                "Content-Type": "application/x-www-form-urlencoded",
                            };
                            return config;
                        });
                },
                (error) => {
                    Promise.reject(error);
                }
            );
            this.axiosInstance.interceptors.response.use(
                (response) => {
                    return response;
                },
                 (error) => {
                    const originalRequest = error.config;
                    if (error.response.status === 403 && !originalRequest._retry) {
                        originalRequest._retry = true;
                        //const access_token = await refreshAccessToken();
                        //axios.defaults.headers.common['Authorization'] = 'Bearer ' + access_token;
                        return this.axiosInstance!(originalRequest);
                    }
                    if (error.response) {
                        console.log(error.response.data);
                        console.log(error.response.status);
                        console.log(error.response.headers);
                    } else if (error.request) {
                        console.log(error.request);
                    } else {
                        console.log("Error", error.message);
                    }
                    console.log(error.config);
                }
            );*/
            return this;
        },
        registerGuard(router: Router) {
            if (router != undefined && this.msalInstance != undefined) {

                const loginRequest = {
                    scopes: ["User.Read"]
                };

                router.beforeEach(async (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
                    if (to.meta.requiresAuth) {
                        const request = {
                            ...loginRequest,
                            redirectStartPage: to.fullPath
                        }
                        const shouldProceed = await this.isAuthenticated(request);
                        return shouldProceed || '/failed';
                    }

                    return true;
                });
            }
        },
        isAuthenticated(loginRequest: PopupRequest|RedirectRequest): Promise<boolean> {
            return this.msalInstance!.handleRedirectPromise().then(() => {
                const accounts = this.msalInstance!.getAllAccounts();
                if (accounts.length > 0) {
                    return true;
                }

                if (this.interactionType === InteractionType.Popup) {
                    return this.msalInstance!.loginPopup(loginRequest).then(() => {
                        return true;
                    }).catch(() => {
                        return false;
                    })
                } else if (this.interactionType === InteractionType.Redirect) {
                    return this.msalInstance!.loginRedirect(loginRequest).then(() => {
                        return true;
                    }).catch(() => {
                        return false;
                    });
                }

                return false;
            }).catch(() => {
                return false;
            });
        },
        SetAxiosAccessTokenScopes(scopes: any) {
            this.accessTokenRequest = {
                scopes: scopes,
                account: this.accounts![0],
            };
        }
    }
})

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