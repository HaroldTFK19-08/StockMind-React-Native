import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { env, tokenStorage, userStorage, setUnauthorizedHandler, mockSession, ApiError } from "@/core";
import { authService } from "./auth.service";
import { usuariosService } from "@/modules/usuarios/usuarios.service";
import { ROLES } from "./roles";

const AuthContext = createContext(null);
const ROLES_VALIDOS = Object.values(ROLES);

/**
 * Estado global de sesión.
 *   status: "restoring" (leyendo la sesión guardada) | "ready"
 *   user:   usuario autenticado o null
 */
export function AuthProvider({ children }) {
    const [status, setStatus] = useState("restoring");
    const [user, setUser] = useState(null);

    const clearSession = useCallback(async () => {
        mockSession.clear();
        setUser(null);
        await Promise.all([tokenStorage.clear(), userStorage.clear()]);
    }, []);

    const startSession = useCallback(async ({ token, user: nextUser }) => {
        if (!ROLES_VALIDOS.includes(nextUser?.rol)) {
            throw new ApiError("Tu cuenta no tiene un rol válido para usar la app.");
        }
        await Promise.all([tokenStorage.set(token), userStorage.set(nextUser)]);
        if (env.useMocks) mockSession.set(nextUser);
        setUser(nextUser);
    }, []);

    // Restaurar sesión al abrir la app
    useEffect(() => {
        let activo = true;
        (async () => {
            try {
                const [token, cached] = await Promise.all([tokenStorage.get(), userStorage.get()]);
                if (!token || !cached) return;
                if (env.useMocks) mockSession.set(cached);
                if (activo) setUser(cached);
                // Refresca los datos del usuario en segundo plano
                if (!env.useMocks) {
                    authService
                        .me()
                        .then((fresh) => {
                            if (activo && fresh) {
                                setUser(fresh);
                                userStorage.set(fresh);
                            }
                        })
                        .catch(() => {});
                }
            } catch {
                await clearSession();
            } finally {
                if (activo) setStatus("ready");
            }
        })();
        return () => {
            activo = false;
        };
    }, [clearSession]);

    // Si el backend responde 401 en cualquier petición, se cierra la sesión
    useEffect(() => {
        setUnauthorizedHandler(() => clearSession());
        return () => setUnauthorizedHandler(null);
    }, [clearSession]);

    const login = useCallback(
        async (credentials) => {
            const session = await authService.login(credentials);
            await startSession(session);
            return session.user;
        },
        [startSession]
    );

    const register = useCallback(
        async (values) => {
            const result = await authService.register(values);
            // Si el backend inicia sesión al registrarse, se aprovecha
            if (result?.token && result?.user) await startSession(result);
            return result;
        },
        [startSession]
    );

    const updateProfile = useCallback(
        async (values) => {
            if (!user?.id) throw new ApiError("No se pudo identificar tu cuenta.");
            const updated = await usuariosService.update(user.id, values);
            const returnedFields = Object.fromEntries(
                Object.entries(updated).filter(([, value]) => value !== undefined)
            );
            const nextUser = { ...user, ...returnedFields, ...values };
            await userStorage.set(nextUser);
            if (env.useMocks) mockSession.set(nextUser);
            setUser(nextUser);
            return nextUser;
        },
        [user]
    );

    const value = useMemo(
        () => ({ status, user, isAuthenticated: Boolean(user), login, register, updateProfile, logout: clearSession }),
        [status, user, login, register, updateProfile, clearSession]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
    return ctx;
}
