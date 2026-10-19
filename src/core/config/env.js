import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * Configuración del entorno de StockMind.
 *
 * Expo solo inyecta en la app las variables que empiezan por EXPO_PUBLIC_ y
 * SOLO si se leen de forma estática (process.env.EXPO_PUBLIC_X). No usar
 * process.env[nombre] ni desestructurar process.env: llegarían undefined.
 *
 * Tras cambiar .env hay que reiniciar con caché limpia: npx expo start -c
 */
const RAW_API_URL = process.env.EXPO_PUBLIC_API_URL;
const RAW_USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS;
const RAW_TIMEOUT = process.env.EXPO_PUBLIC_API_TIMEOUT;
const RAW_DEBUG = process.env.EXPO_PUBLIC_API_DEBUG;

const DEFAULT_TIMEOUT = 15000;
const MIN_TIMEOUT = 1000;
const MAX_TIMEOUT = 120000;
const DEFAULT_MOCK_LATENCY = 450;

const IS_DEV = typeof __DEV__ !== "undefined" && __DEV__;
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0"];

const clean = (value) => (typeof value === "string" ? value.trim() : "");

const parseBoolean = (value) => {
    const v = clean(value).toLowerCase();
    if (v === "true") return true;
    if (v === "false") return false;
    return null;
};

const parseTimeout = (value) => {
    const timeout = Number(clean(value));
    if (!Number.isFinite(timeout) || timeout < MIN_TIMEOUT) return DEFAULT_TIMEOUT;
    return Math.min(timeout, MAX_TIMEOUT);
};

/** IP de la PC donde corre `expo start` (la misma que usa el celular para cargar el bundle). */
function getDevMachineHost() {
    const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost ?? "";
    const host = hostUri.split(":")[0];
    return host && !LOCAL_HOSTS.includes(host) ? host : null;
}

/**
 * En celular o emulador "localhost" es el propio dispositivo, no tu PC.
 * Si la URL apunta a localhost se reemplaza por la IP de la PC (o por
 * 10.0.2.2 en el emulador de Android). En web se deja tal cual.
 */
function resolveLocalhost(url) {
    if (Platform.OS === "web") return url;
    const match = url.match(/^(https?:\/\/)([^/:]+)(.*)$/i);
    if (!match || !LOCAL_HOSTS.includes(match[2].toLowerCase())) return url;

    const devHost = getDevMachineHost();
    if (devHost) return `${match[1]}${devHost}${match[3]}`;
    if (Platform.OS === "android") return `${match[1]}10.0.2.2${match[3]}`;
    return url;
}

function normalizeApiUrl(value) {
    const url = clean(value).replace(/\/+$/, "");
    if (!url) return "";
    if (!/^https?:\/\//i.test(url)) {
        console.warn(`[env] EXPO_PUBLIC_API_URL debe empezar por http:// o https:// (valor: "${url}")`);
        return "";
    }
    return resolveLocalhost(url);
}

const apiUrl = normalizeApiUrl(RAW_API_URL);

export const env = Object.freeze({
    apiUrl,
    // Si EXPO_PUBLIC_USE_MOCKS no está definido, se usan mocks solo cuando no hay URL.
    useMocks: parseBoolean(RAW_USE_MOCKS) ?? apiUrl === "",
    timeout: parseTimeout(RAW_TIMEOUT),
    // Muestra en consola cada petición (solo en desarrollo).
    debug: IS_DEV && parseBoolean(RAW_DEBUG) === true,
    mockLatency: DEFAULT_MOCK_LATENCY,
    isDevelopment: IS_DEV,
});

if (IS_DEV) {
    if (!env.useMocks && !env.apiUrl) {
        console.warn("[env] EXPO_PUBLIC_USE_MOCKS=false pero EXPO_PUBLIC_API_URL está vacía. Revisa tu .env.");
    }
    console.log(
        `[env] ${env.useMocks ? "Modo MOCK (sin backend)" : `API: ${env.apiUrl}`} · timeout ${env.timeout} ms`
    );
}
