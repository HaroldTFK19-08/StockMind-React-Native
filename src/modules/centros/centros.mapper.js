import { pick, toId, compact } from "@/core";

/** Backend → App */
export function mapCentro(dto = {}) {
    return {
        id: toId(pick(dto, "id", "id_centro")),
        nombre: pick(dto, "nombre", "centro", "name"),
        ubicacion: pick(dto, "ubicacion", "municipio", "ciudad"),
        direccion: pick(dto, "direccion", "address"),
        telefono: pick(dto, "telefono"),
        sedes: Number(pick(dto, "sedes", "total_sedes", "_count.sedes") ?? 0),
        ambientes: Number(pick(dto, "ambientes", "total_ambientes", "_count.ambientes") ?? 0),
    };
}

/** App → Backend */
export const toCentroDTO = (values) =>
    compact({
        nombre: values.nombre?.trim(),
        ubicacion: values.ubicacion?.trim(),
        direccion: values.direccion?.trim(),
        telefono: values.telefono?.trim() || undefined,
    });
