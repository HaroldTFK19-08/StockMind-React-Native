import { createMockCollection } from "@/core";

export const centrosMock = createMockCollection([
    { id: "1", nombre: "Centro de Comercio y Servicios", ubicacion: "Popayán, Centro", direccion: "Cl. 4 #2-67", sedes: 3, ambientes: 12 },
    { id: "2", nombre: "Centro de Teleinformática y Producción Industrial", ubicacion: "Popayán, Norte", direccion: "Cl. 4 #2-67", sedes: 1, ambientes: 20 },
    { id: "3", nombre: "Centro Agropecuario", ubicacion: "Popayán, Norte", direccion: "Km 7 vía Cajibío", sedes: 2, ambientes: 10 },
]);
