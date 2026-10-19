import { env, http, ENDPOINTS, ApiError, unwrapItem, mockDelay, mockSession } from "@/core";
import { mapUsuario } from "@/modules/usuarios/usuarios.mapper";
import { usuariosMock, MOCK_PASSWORDS } from "@/modules/usuarios/usuarios.mock";
import { mapSession, toLoginDTO, toRegisterDTO } from "./auth.mapper";

export const authService = {
    /** POST /auth/login → { token, user } */
    async login(credentials) {
        const dto = toLoginDTO(credentials);
        if (env.useMocks) {
            await mockDelay(700);
            const [row] = await usuariosMock.list((u) => u.correo === dto.correo);
            if (!row || MOCK_PASSWORDS[dto.correo] !== dto.contrasena) {
                throw new ApiError("Correo o contraseña incorrectos.", { status: 401 });
            }
            const user = mapUsuario(row);
            mockSession.set(user);
            return { token: `mock-token-${user.id}`, user };
        }
        const session = mapSession(await http.post(ENDPOINTS.auth.login, dto, { auth: false }));
        if (!session.token) throw new ApiError("El servidor no devolvió un token de sesión.");
        // Si el login no trae el usuario, se consulta /auth/me
        if (!session.user) session.user = await this.me(session.token);
        return session;
    },

    /** POST /auth/register → { token?, user? } */
    async register(values) {
        const dto = toRegisterDTO(values);
        if (env.useMocks) {
            await mockDelay(700);
            const existe = await usuariosMock.list((u) => u.correo === dto.correo);
            if (existe.length) throw new ApiError("Ya existe una cuenta con ese correo.", { status: 409 });
            const row = await usuariosMock.create({ ...dto, contrasena: undefined, programa: "Sin asignar", estado: "Activo" });
            MOCK_PASSWORDS[dto.correo] = dto.contrasena;
            return { token: null, user: mapUsuario(row) };
        }
        return mapSession(await http.post(ENDPOINTS.auth.register, dto, { auth: false }));
    },

    /** GET /auth/me → usuario autenticado */
    async me(token) {
        if (env.useMocks) return mockSession.get();
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        return mapUsuario(unwrapItem(await http.get(ENDPOINTS.auth.me, { headers, auth: !token })));
    },
};
