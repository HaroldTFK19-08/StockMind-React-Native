import { env } from "../config/env";
import { tokenStorage } from "../storage/tokenStorage";
import { ApiError, messageFromResponse } from "./ApiError";

let onUnauthorized = null;

/** El AuthProvider registra aquí qué hacer cuando el backend responde 401. */
export function setUnauthorizedHandler(handler) {
    onUnauthorized = handler;
}

function buildUrl(path, params) {
    const url = `${env.apiUrl}${path.startsWith("/") ? path : `/${path}`}`;
    if (!params) return url;
    const query = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");
    return query ? `${url}?${query}` : url;
}

async function parseBody(response) {
    if (response.status === 204) return null;
    const text = await response.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

// Oculta contraseñas en los logs de depuración.
const SENSIBLES = ["contrasena", "password", "password_confirmation", "token"];
const maskForLog = (body) =>
    body && typeof body === "object" && !Array.isArray(body)
        ? Object.fromEntries(Object.entries(body).map(([k, v]) => [k, SENSIBLES.includes(k) ? "•••" : v]))
        : body ?? "";

async function request(method, path, { body, params, headers, auth = true } = {}) {
    if (!env.apiUrl) {
        throw new ApiError("No hay URL del backend configurada (EXPO_PUBLIC_API_URL).");
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), env.timeout);

    const finalHeaders = { Accept: "application/json", ...headers };
    if (body !== undefined) finalHeaders["Content-Type"] = "application/json";
    if (auth) {
        const token = await tokenStorage.get();
        if (token) finalHeaders.Authorization = `Bearer ${token}`;
    }
    const url = buildUrl(path, params);
    const startedAt = Date.now();
    if (env.debug) console.log(`[api] → ${method} ${url}`, maskForLog(body));

    let response;
    try {
        response = await fetch(url, {
            method,
            headers: finalHeaders,
            body: body !== undefined ? JSON.stringify(body) : undefined,
            signal: controller.signal,
        });
    } catch (error) {
        const timeout = error?.name === "AbortError";
        if (env.isDevelopment) {
            console.warn(`[api] ✕ ${method} ${url} → ${timeout ? "timeout" : error?.message ?? "sin conexión"}`);
        }
        throw new ApiError(
            timeout
                ? "El servidor tardó demasiado en responder."
                : "No se pudo conectar con el servidor. Revisa tu conexión.",
            { status: 0, details: error }
        );
    } finally {
        clearTimeout(timer);
    }

    const data = await parseBody(response);
    if (env.debug) console.log(`[api] ← ${response.status} ${method} ${url} (${Date.now() - startedAt} ms)`, maskForLog(data));

    // Si la URL no apunta a la API (p. ej. falta /api), Laravel responde una página HTML.
    if (response.ok && typeof data === "string" && data.trimStart().startsWith("<")) {
        throw new ApiError("El servidor respondió HTML en lugar de JSON. Revisa EXPO_PUBLIC_API_URL.", {
            status: response.status,
            details: data.slice(0, 300),
        });
    }

    if (!response.ok) {
        const error = new ApiError(messageFromResponse(response.status, data), {
            status: response.status,
            details: data,
        });
        if (error.isUnauthorized && auth) onUnauthorized?.();
        throw error;
    }
    return data;
}

export const http = {
    get: (path, options) => request("GET", path, options),
    post: (path, body, options) => request("POST", path, { ...options, body }),
    put: (path, body, options) => request("PUT", path, { ...options, body }),
    patch: (path, body, options) => request("PATCH", path, { ...options, body }),
    delete: (path, options) => request("DELETE", path, options),
};

/**
 * Normaliza respuestas de listas. Acepta:
 *   [ ... ]  |  { data: [...] }  |  { results: [...] }  |  { items: [...] }
 */
export function unwrapList(payload) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];
    return payload.data ?? payload.results ?? payload.items ?? payload.rows ?? [];
}

/** Normaliza respuestas de un solo objeto: { data: {...} } o {...} */
export function unwrapItem(payload) {
    if (payload && typeof payload === "object" && !Array.isArray(payload) && "data" in payload) {
        return payload.data;
    }
    return payload;
}
