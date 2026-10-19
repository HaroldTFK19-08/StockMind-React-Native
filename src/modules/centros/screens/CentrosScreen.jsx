import { useState } from "react";
import { useResource, useFilteredList } from "@/shared/hooks";
import { ListPage, ResourceList, Button } from "@/shared/ui";
import PortalHeader from "@/navigation/PortalHeader";
import { centrosService } from "../centros.service";
import { useCentrosAnimation } from "../hooks/useCentrosAnimation";
import CentroCard from "../components/CentroCard";
import CentroForm from "../components/CentroForm";
import CentroDetail from "../components/CentroDetail";

const SEARCH_KEYS = ["nombre", "ubicacion", "direccion"];

export default function CentrosScreen({ canCreate = true }) {
    const resource = useResource(() => centrosService.list(), []);
    const lista = useFilteredList(resource.data, { searchKeys: SEARCH_KEYS });
    const [form, setForm] = useState(false);
    const [detalle, setDetalle] = useState(null);
    const animationStyle = useCentrosAnimation();

    return (
        <ListPage
            animationStyle={animationStyle}
            header={<PortalHeader />}
            title="Centros"
            subtitle="Centros de formación del SENA Cauca"
            search={{
                value: lista.query,
                onChangeText: lista.setQuery,
                placeholder: "Buscar centros",
                onAdd: canCreate ? () => setForm(true) : undefined,
                addLabel: "Nuevo centro",
            }}
        >
            <ResourceList
                resource={resource}
                items={lista.items}
                filtered={Boolean(lista.query)}
                empty={{
                    icon: "business-outline",
                    title: "Aún no hay centros",
                    action: canCreate ? <Button title="Registrar centro" icon="add" onPress={() => setForm(true)} /> : null,
                }}
                renderItem={({ item }) => <CentroCard centro={item} onPress={() => setDetalle(item)} />}
            />
            <CentroForm visible={form} onClose={() => setForm(false)} onSaved={(c) => resource.setData((prev) => [c, ...(prev ?? [])])} />
            <CentroDetail centro={detalle} onClose={() => setDetalle(null)} />
        </ListPage>
    );
}
