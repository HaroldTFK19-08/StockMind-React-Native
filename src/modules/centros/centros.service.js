import { env, http, ENDPOINTS, unwrapList, unwrapItem } from "@/core";
import { mapCentro, toCentroDTO } from "./centros.mapper";
import { centrosMock } from "./centros.mock";

export const centrosService = {
    /** GET /centros */
    async list() {
        if (env.useMocks) return (await centrosMock.list()).map(mapCentro);
        return unwrapList(await http.get(ENDPOINTS.centros.base)).map(mapCentro);
    },
    /** POST /centros */
    async create(values) {
        const dto = toCentroDTO(values);
        if (env.useMocks) return mapCentro(await centrosMock.create({ ...dto, sedes: 1, ambientes: 0 }));
        return mapCentro(unwrapItem(await http.post(ENDPOINTS.centros.base, dto)));
    },
    /** PUT /centros/:id */
    async update(id, values) {
        const dto = toCentroDTO(values);
        if (env.useMocks) return mapCentro(await centrosMock.update(id, dto));
        return mapCentro(unwrapItem(await http.put(ENDPOINTS.centros.byId(id), dto)));
    },
};
