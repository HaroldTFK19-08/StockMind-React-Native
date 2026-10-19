import "../global.css";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastProvider, BrandSplash, ErrorState } from "@/shared/ui";
import { AuthProvider, useAuth, ROLES } from "@/modules/auth";

SplashScreen.preventAutoHideAsync().catch(() => {});
const MIN_SPLASH_MS = 1400;
const routeModules = require.context("./", true, /\.(js|jsx|ts|tsx)$/);
const routeModuleIds = routeModules.keys().filter((moduleId) => !/^\.\/_layout\.(js|jsx|ts|tsx)$/.test(moduleId));
const ROUTE_PRELOAD_BATCH_SIZE = 3;

function RootNavigator() {
    const { status, user } = useAuth();
    const [splashListo, setSplashListo] = useState(false);
    const [rutasListas, setRutasListas] = useState(false);
    const [errorCargaRutas, setErrorCargaRutas] = useState(null);
    const [intentoCarga, setIntentoCarga] = useState(0);

    useEffect(() => {
        SplashScreen.hideAsync().catch(() => {});
        const t = setTimeout(() => setSplashListo(true), MIN_SPLASH_MS);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        let activo = true;

        async function cargarRutas() {
            try {
                for (let i = 0; i < routeModuleIds.length; i += ROUTE_PRELOAD_BATCH_SIZE) {
                    routeModuleIds.slice(i, i + ROUTE_PRELOAD_BATCH_SIZE).forEach((moduleId) => routeModules(moduleId));

                    if (i + ROUTE_PRELOAD_BATCH_SIZE < routeModuleIds.length) {
                        await new Promise((resolve) => requestAnimationFrame(() => resolve()));
                    }
                }

                if (activo) setRutasListas(true);
            } catch (error) {
                if (activo) {
                    setErrorCargaRutas(error instanceof Error ? error : new Error(String(error)));
                }
            }
        }

        cargarRutas();
        return () => {
            activo = false;
        };
    }, [intentoCarga]);

    if (errorCargaRutas) {
        return (
            <View className="flex-1 items-center justify-center bg-white px-6">
                <ErrorState
                    error={new Error(`No se pudieron cargar las pantallas: ${errorCargaRutas.message}`)}
                    onRetry={() => {
                        setErrorCargaRutas(null);
                        setRutasListas(false);
                        setIntentoCarga((intento) => intento + 1);
                    }}
                />
            </View>
        );
    }

    if (status === "restoring" || !splashListo || !rutasListas) return <BrandSplash />;

    const rol = user?.rol;
    // Rutas protegidas: cada grupo solo existe si se cumple su condición.
    // Al iniciar/cerrar sesión expo-router redirige solo a "index".
    return (
        <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
            <Stack.Screen name="index" />
            <Stack.Protected guard={!user}>
                <Stack.Screen name="auth" />
            </Stack.Protected>
            <Stack.Protected guard={Boolean(user)}>
                <Stack.Screen name="acerca" options={{ animation: "slide_from_right" }} />
            </Stack.Protected>
            <Stack.Protected guard={rol === ROLES.ADMIN}>
                <Stack.Screen name="admin" />
            </Stack.Protected>
            <Stack.Protected guard={rol === ROLES.INSTRUCTOR}>
                <Stack.Screen name="instructor" />
            </Stack.Protected>
            <Stack.Protected guard={rol === ROLES.CUENTADANTE}>
                <Stack.Screen name="cuentaDante" />
            </Stack.Protected>
            <Stack.Protected guard={rol === ROLES.APRENDIZ}>
                <Stack.Screen name="aprendiz" />
            </Stack.Protected>
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <ToastProvider>
                    <StatusBar style="light" />
                    <RootNavigator />
                </ToastProvider>
            </AuthProvider>
        </SafeAreaProvider>
    );
}
