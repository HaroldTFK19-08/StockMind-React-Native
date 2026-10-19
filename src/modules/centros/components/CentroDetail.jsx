import { BottomSheet, InfoField, InfoGroup } from "@/shared/ui";

export default function CentroDetail({ centro, onClose }) {
    return (
        <BottomSheet visible={Boolean(centro)} onClose={onClose} title={centro?.nombre ?? "Centro"} subtitle="Centro de formación" icon="business-outline">
            {centro ? (
                <InfoGroup>
                    <InfoField icon="location-outline" label="Ubicación" value={centro.ubicacion} />
                    <InfoField icon="map-outline" label="Dirección" value={centro.direccion} />
                    {centro.telefono ? <InfoField icon="call-outline" label="Teléfono" value={centro.telefono} /> : null}
                    <InfoField icon="git-branch-outline" label="Sedes" value={String(centro.sedes)} />
                    <InfoField icon="easel-outline" label="Ambientes" value={String(centro.ambientes)} />
                </InfoGroup>
            ) : null}
        </BottomSheet>
    );
}
